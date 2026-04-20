import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, ExternalLink, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import { GoogleMapView } from "@/components/GoogleMapView";

const DEFAULT_LAT = 47.0245;
const DEFAULT_LNG = 28.8327;
const DEFAULT_VENUE_NAME = "Chișinău Arena";
const DEFAULT_VENUE_ADDRESS = "Chișinău, Moldova";

type GeoStatus = "locating" | "located" | "unavailable";

export default function SpectatorDirections() {
  const { t } = useI18n();
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("locating");
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);

  const { data: events } = useQuery<any[]>({ queryKey: ["/api/events"] });
  const activeEvent = events?.find((e: any) => e.status === "active") || events?.[0];

  const { data: venues } = useQuery<any[]>({ queryKey: ["/api/venues"] });
  const venue = venues?.find((v: any) => v.id === activeEvent?.venueId) || venues?.[0];

  const venueName = venue?.name || DEFAULT_VENUE_NAME;
  const venueAddress = venue?.address
    ? `${venue.address}, ${venue.city || ""}, ${venue.country || "Moldova"}`
    : DEFAULT_VENUE_ADDRESS;
  const venueLat = venue?.latitude ?? DEFAULT_LAT;
  const venueLng = venue?.longitude ?? DEFAULT_LNG;

  useEffect(() => {
    if (!navigator.geolocation) { setGeoStatus("unavailable"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setUserLat(pos.coords.latitude); setUserLng(pos.coords.longitude); setGeoStatus("located"); },
      () => setGeoStatus("unavailable"),
      { timeout: 12000, enableHighAccuracy: true }
    );
  }, []);

  const navigationUrl =
    geoStatus === "located" && userLat !== null && userLng !== null
      ? `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${venueLat},${venueLng}&travelmode=driving`
      : `https://www.google.com/maps/dir/?api=1&destination=${venueLat},${venueLng}&travelmode=driving`;

  return (
    <div className="p-6 space-y-5 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-directions-title">
          {t("directions.getToVenue")} {venueName}
        </h1>
        {activeEvent && (
          <p className="text-muted-foreground text-sm mt-1">
            {activeEvent.name}
            {activeEvent.date && ` · ${new Date(activeEvent.date).toLocaleDateString("ro-MD", { weekday: "short", month: "short", day: "numeric" })}`}
            {activeEvent.startTime && ` · ${activeEvent.startTime}`}
          </p>
        )}
      </div>

      {/* Location status indicator */}
      <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-md border ${
        geoStatus === "located"
          ? "border-[hsl(142,70%,45%)]/30 bg-[hsl(142,70%,45%)]/5 text-[hsl(142,70%,45%)]"
          : geoStatus === "locating"
          ? "border-[hsl(38,90%,55%)]/30 bg-[hsl(38,90%,55%)]/5 text-[hsl(38,90%,55%)]"
          : "border-muted bg-muted/30 text-muted-foreground"
      }`}>
        {geoStatus === "locating" && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
        {geoStatus === "located" && <CheckCircle2 className="h-4 w-4 shrink-0" />}
        {geoStatus === "unavailable" && <AlertCircle className="h-4 w-4 shrink-0" />}
        <span>
          {geoStatus === "locating" && t("directions.locating")}
          {geoStatus === "located" && t("directions.located")}
          {geoStatus === "unavailable" && t("directions.locationUnavailable")}
        </span>
      </div>

      {/* Google Map */}
      <Card className="overflow-hidden" data-testid="map-card">
        <div className="p-3">
          <GoogleMapView
            venueLat={venueLat}
            venueLng={venueLng}
            venueName={venueName}
            userLat={geoStatus === "located" ? userLat : null}
            userLng={geoStatus === "located" ? userLng : null}
            showDirections={geoStatus === "located"}
            height={420}
            zoom={14}
          />
        </div>
        <div className="px-4 py-3 border-t flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="font-medium text-sm leading-tight">{venueName}</p>
              <p className="text-xs text-muted-foreground truncate">{venueAddress}</p>
            </div>
          </div>
          <a href={`https://www.google.com/maps/search/${venueLat},${venueLng}`} target="_blank" rel="noopener noreferrer" data-testid="link-open-google-maps">
            <Button variant="outline" size="sm">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              {t("directions.openInMaps")}
            </Button>
          </a>
        </div>
      </Card>

      {/* Navigate button */}
      <a href={navigationUrl} target="_blank" rel="noopener noreferrer" data-testid="link-open-navigation" className="block">
        <Button className="w-full" size="lg">
          <Navigation className="h-4 w-4 mr-2" />
          {geoStatus === "located" ? t("directions.openNavigationFromLocation") : t("directions.openNavigation")}
        </Button>
      </a>

      {geoStatus === "unavailable" && (
        <p className="text-xs text-center text-muted-foreground">{t("directions.locationTip")}</p>
      )}
    </div>
  );
}
