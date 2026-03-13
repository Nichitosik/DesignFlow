import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Navigation, Car, Footprints, Bus, ExternalLink, LocateFixed } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";

type TransportMode = "driving" | "walking" | "transit";

const modeConfig: Record<TransportMode, { icon: any; label: string }> = {
  driving: { icon: Car, label: "Car" },
  walking: { icon: Footprints, label: "Walking" },
  transit: { icon: Bus, label: "Transit" },
};

const DEFAULT_VENUE_NAME = "Chișinău Arena";
const DEFAULT_VENUE_ADDRESS = "Strada Independenței 12, Chișinău, Moldova";
const DEFAULT_LAT = 47.0245;
const DEFAULT_LNG = 28.8327;

function buildGoogleMapsUrl(origin: string, destLat: number, destLng: number, mode: TransportMode) {
  const dest = `${destLat},${destLng}`;
  const params = new URLSearchParams({
    api: "1",
    destination: dest,
    travelmode: mode,
  });
  if (origin.trim()) params.set("origin", origin.trim());
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function buildVenueMapUrl(lat: number, lng: number) {
  return `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
}

export default function SpectatorDirections() {
  const { t } = useI18n();
  const [origin, setOrigin] = useState("");
  const [mode, setMode] = useState<TransportMode>("driving");
  const [locating, setLocating] = useState(false);

  const { data: events } = useQuery<any[]>({ queryKey: ["/api/events"] });
  const activeEvent = events?.find((e: any) => e.status === "active") || events?.[0];

  const { data: venues } = useQuery<any[]>({ queryKey: ["/api/venues"] });

  const venue = venues?.find((v: any) => v.id === activeEvent?.venueId) || venues?.[0];
  const venueName = venue?.name || DEFAULT_VENUE_NAME;
  const venueAddress = venue?.address
    ? `${venue.address}, ${venue.city}, ${venue.country}`
    : DEFAULT_VENUE_ADDRESS;
  const venueLat = venue?.latitude ?? DEFAULT_LAT;
  const venueLng = venue?.longitude ?? DEFAULT_LNG;

  const mapEmbedUrl = buildVenueMapUrl(venueLat, venueLng);
  const directionsUrl = buildGoogleMapsUrl(origin, venueLat, venueLng, mode);
  const venueOnlyUrl = `https://www.google.com/maps/search/${venueLat},${venueLng}`;

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrigin(`${pos.coords.latitude},${pos.coords.longitude}`);
        setLocating(false);
      },
      () => { setLocating(false); },
      { timeout: 10000 }
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-directions-title">
          {t("directions.title")}
        </h1>
        <p className="text-muted-foreground text-sm">Get real-time directions to the venue</p>
      </div>

      <Card className="overflow-hidden" data-testid="map-card">
        <iframe
          src={mapEmbedUrl}
          width="100%"
          height="340"
          style={{ border: 0, display: "block" }}
          title="Venue Location Map"
          data-testid="map-iframe"
          loading="lazy"
        />
        <div className="px-4 py-3 border-t flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <div>
              <span className="font-medium">{venueName}</span>
              <span className="text-muted-foreground ml-2 text-xs hidden sm:inline">{venueAddress}</span>
            </div>
          </div>
          <a
            href={venueOnlyUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="link-open-google-maps"
          >
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-1" />
              Open in Google Maps
            </Button>
          </a>
        </div>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Navigation className="h-5 w-5 text-primary" />
            Get Directions to {venueName}
          </h3>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Your starting location</label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter your address or city..."
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                data-testid="input-origin"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={useCurrentLocation}
                disabled={locating}
                title="Use my current location"
                data-testid="button-use-location"
              >
                <LocateFixed className={`h-4 w-4 ${locating ? "animate-pulse" : ""}`} />
              </Button>
            </div>
            {origin && origin.match(/^-?\d+\.\d+,-?\d+\.\d+$/) && (
              <p className="text-xs text-muted-foreground">
                Using your GPS coordinates
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Transport mode</label>
            <div className="flex gap-2 flex-wrap">
              {(Object.entries(modeConfig) as [TransportMode, typeof modeConfig["driving"]][]).map(([m, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <Button
                    key={m}
                    variant={mode === m ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMode(m)}
                    data-testid={`button-mode-${m === "driving" ? "car" : m}`}
                  >
                    <Icon className="h-4 w-4 mr-1.5" />
                    {cfg.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="link-get-directions"
          >
            <Button className="w-full" size="default">
              <Navigation className="h-4 w-4 mr-2" />
              {origin.trim() ? `Get Directions from ${origin.length > 30 ? origin.slice(0, 30) + "…" : origin}` : "Open Google Maps Directions"}
            </Button>
          </a>

          <div className="border-t pt-4 space-y-1 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
              <div>
                <p className="font-medium text-foreground">{venueName}</p>
                <p>{venueAddress}</p>
              </div>
            </div>
            {activeEvent && (
              <div className="flex items-start gap-2 mt-2">
                <span className="h-4 w-4 shrink-0" />
                <p className="text-xs">
                  {activeEvent.name} — {activeEvent.date
                    ? new Date(activeEvent.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
                    : ""}
                  {activeEvent.startTime && ` at ${activeEvent.startTime}`}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h3 className="font-semibold mb-3">Quick Links</h3>
          <div className="grid sm:grid-cols-3 gap-3">
            {(["driving", "walking", "transit"] as TransportMode[]).map((m) => {
              const cfg = modeConfig[m];
              const Icon = cfg.icon;
              const url = buildGoogleMapsUrl("", venueLat, venueLng, m);
              return (
                <a key={m} href={url} target="_blank" rel="noopener noreferrer" data-testid={`link-mode-${m}`}>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Icon className="h-4 w-4" />
                    By {cfg.label}
                  </Button>
                </a>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
