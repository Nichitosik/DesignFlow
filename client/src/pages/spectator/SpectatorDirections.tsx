import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, ArrowRight, Navigation, Car, Footprints, Bus, Search, ExternalLink } from "lucide-react";
import { useState, useMemo } from "react";
import { useI18n } from "@/lib/i18n";

type TransportMode = "car" | "walk" | "transit";

interface RouteInfo {
  id: string;
  from: string;
  fromAddress: string;
  googleMapsUrl: string;
  modes: {
    mode: TransportMode;
    distance: string;
    duration: string;
    steps: string[];
    transitInfo?: string;
  }[];
}

const VENUE_LAT = 47.0245;
const VENUE_LNG = 28.8327;
const VENUE_NAME = "Chișinău Arena";

const allRoutes: RouteInfo[] = [
  {
    id: "arena",
    from: "Chișinău Arena",
    fromAddress: "Str. Dimo 41/3, Chișinău",
    googleMapsUrl: `https://www.google.com/maps/dir/47.0105,28.8150/${VENUE_LAT},${VENUE_LNG}`,
    modes: [
      {
        mode: "car",
        distance: "3.2 km",
        duration: "12 min",
        steps: ["Head northeast on Str. Andrei Doga toward Bd. Decebal", "Turn left onto Bd. Decebal", "Continue straight for 1.8 km past Parcul Valea Morilor", "Turn right onto Str. Mitropolit Varlaam", "Arrive at the concert venue on your left"],
      },
      {
        mode: "walk",
        distance: "3.0 km",
        duration: "38 min",
        steps: ["Head northeast on Str. Andrei Doga", "Cross Bd. Decebal at the pedestrian crossing", "Walk through Parcul Valea Morilor (scenic path)", "Exit park onto Str. Mitropolit Varlaam", "Continue north for 400m to the concert venue"],
      },
      {
        mode: "transit",
        distance: "4.1 km",
        duration: "22 min",
        transitInfo: "Trolleybus 22 / Route 23",
        steps: ["Walk to Str. Dimo bus stop (2 min)", "Take Trolleybus 22 toward Centru (6 stops)", "Exit at Piata Centrala station", "Transfer to Route 23 toward Arena Nationala", "Exit at venue stop, walk 3 min to entrance"],
      },
    ],
  },
  {
    id: "zimbru",
    from: "Stadionul Zimbru",
    fromAddress: "Str. Tricolorului 39, Chișinău",
    googleMapsUrl: `https://www.google.com/maps/dir/47.0390,28.8560/${VENUE_LAT},${VENUE_LNG}`,
    modes: [
      {
        mode: "car",
        distance: "4.7 km",
        duration: "18 min",
        steps: ["Head south on Str. Tricolorului toward Bd. Dacia", "Turn left onto Bd. Dacia and continue for 2.1 km", "At the roundabout, take the 2nd exit onto Str. Ismail", "Continue straight, passing Piata Centrala on your right", "Turn left onto Bd. Stefan cel Mare si Sfant", "Continue for 0.8 km and arrive at the concert venue"],
      },
      {
        mode: "walk",
        distance: "4.3 km",
        duration: "55 min",
        steps: ["Head south on Str. Tricolorului", "Turn left onto Bd. Dacia", "Walk along Bd. Dacia for 1.8 km", "Turn right on Str. Ismail past Parcul Central", "Continue north on Bd. Stefan cel Mare for 1.2 km", "Arrive at the concert venue"],
      },
      {
        mode: "transit",
        distance: "5.2 km",
        duration: "25 min",
        transitInfo: "Trolleybus 1 / Microbuz 185",
        steps: ["Walk to Stadionul Zimbru stop (3 min)", "Take Trolleybus 1 toward Centru (8 stops)", "Exit at Piata Centrala", "Take Microbuz 185 toward Arena Nationala (3 stops)", "Walk 2 min to venue entrance"],
      },
    ],
  },
  {
    id: "teatrul",
    from: "Teatrul Verde",
    fromAddress: "Parcul Central, Chișinău",
    googleMapsUrl: `https://www.google.com/maps/dir/47.0205,28.8380/${VENUE_LAT},${VENUE_LNG}`,
    modes: [
      {
        mode: "car",
        distance: "1.5 km",
        duration: "5 min",
        steps: ["Exit Teatrul Verde toward Bd. Stefan cel Mare si Sfant", "Turn left onto Bd. Stefan cel Mare si Sfant", "Continue for 0.8 km", "Arrive at the concert venue on your right"],
      },
      {
        mode: "walk",
        distance: "1.1 km",
        duration: "14 min",
        steps: ["Exit Teatrul Verde toward Bd. Stefan cel Mare si Sfant", "Head north on Bd. Stefan cel Mare si Sfant for 0.6 km", "Pass the National Museum of History on your right", "Continue straight and arrive at the concert venue"],
      },
      {
        mode: "transit",
        distance: "1.8 km",
        duration: "8 min",
        transitInfo: "Trolleybus 10",
        steps: ["Walk to Parcul Central stop (1 min)", "Take Trolleybus 10 toward Arena Nationala (2 stops)", "Exit at venue stop and walk 1 min to entrance"],
      },
    ],
  },
  {
    id: "gara",
    from: "Gara Centrala",
    fromAddress: "Aleea Garii 1, Chișinău",
    googleMapsUrl: `https://www.google.com/maps/dir/47.0080,28.8620/${VENUE_LAT},${VENUE_LNG}`,
    modes: [
      {
        mode: "car",
        distance: "2.8 km",
        duration: "10 min",
        steps: ["Exit station onto Str. Calea Basarabiei", "Turn right onto Bd. Negruzzi", "Continue straight through roundabout onto Bd. Stefan cel Mare", "Arrive at the concert venue after 1.5 km"],
      },
      {
        mode: "walk",
        distance: "2.5 km",
        duration: "32 min",
        steps: ["Exit Gara Centrala through the main entrance", "Walk northeast on Str. Calea Basarabiei", "Turn right onto Bd. Negruzzi", "Continue along Bd. Stefan cel Mare for 1.2 km", "Arrive at the concert venue"],
      },
      {
        mode: "transit",
        distance: "3.1 km",
        duration: "15 min",
        transitInfo: "Trolleybus 3 / Route 45",
        steps: ["Walk to Gara Centrala bus stop (1 min)", "Take Trolleybus 3 toward Centru (4 stops)", "Transfer at Piata Stefan cel Mare", "Take Route 45 to Arena Nationala (2 stops)", "Walk 2 min to entrance"],
      },
    ],
  },
];

const modeConfig: Record<TransportMode, { icon: any; label: string; color: string }> = {
  car: { icon: Car, label: "Car", color: "#2196F3" },
  walk: { icon: Footprints, label: "Walking", color: "#4CAF50" },
  transit: { icon: Bus, label: "Public Transport", color: "#9C27B0" },
};

const OSM_TILE = (lat: number, lng: number, zoom: number = 14) =>
  `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.05},${lat - 0.04},${lng + 0.05},${lat + 0.04}&layer=mapnik&marker=${lat},${lng}`;

export default function SpectatorDirections() {
  const { t } = useI18n();
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<TransportMode>("car");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRoutes = useMemo(() => {
    if (!searchQuery.trim()) return allRoutes;
    const q = searchQuery.toLowerCase();
    return allRoutes.filter(r =>
      r.from.toLowerCase().includes(q) || r.fromAddress.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const selectedRoute = expandedRoute ? allRoutes.find(r => r.id === expandedRoute) ?? null : null;

  const mapSrc = selectedRoute
    ? OSM_TILE(
        (selectedRoute.modes[0] ? VENUE_LAT : VENUE_LAT),
        VENUE_LNG,
      )
    : OSM_TILE(VENUE_LAT, VENUE_LNG);

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-directions-title">{t("directions.title")}</h1>
        <p className="text-muted-foreground text-sm">Find the best route to the venue in Chișinău</p>
      </div>

      <Card className="overflow-hidden" data-testid="map-card">
        <iframe
          src={mapSrc}
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
            <span className="font-medium">{VENUE_NAME}</span>
            <span className="text-muted-foreground hidden sm:inline">— Chișinău, Moldova</span>
          </div>
          <a
            href={`https://www.google.com/maps/search/${VENUE_LAT},${VENUE_LNG}`}
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

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={t("directions.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-location"
          />
        </div>
        <div className="flex items-center gap-1 border rounded-md p-1">
          {(Object.entries(modeConfig) as [TransportMode, typeof modeConfig["car"]][]).map(([mode, config]) => {
            const Icon = config.icon;
            const active = selectedMode === mode;
            return (
              <Button
                key={mode}
                variant={active ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedMode(mode)}
                data-testid={`button-mode-${mode}`}
              >
                <Icon className="h-4 w-4 mr-1" />
                {config.label}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        {filteredRoutes.map((route) => {
          const modeData = route.modes.find(m => m.mode === selectedMode);
          if (!modeData) return null;
          const isExpanded = expandedRoute === route.id;
          const config = modeConfig[selectedMode];

          return (
            <Card key={route.id} data-testid={`route-${route.id}`}>
              <button
                className="w-full text-left p-4 hover-elevate transition-colors rounded-t-md"
                onClick={() => setExpandedRoute(isExpanded ? null : route.id)}
                data-testid={`button-route-${route.id}`}
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: `${config.color}20` }}>
                      <MapPin className="h-5 w-5" style={{ color: config.color }} />
                    </div>
                    <div className="min-w-0">
                      <span className="font-medium text-sm block">{route.from}</span>
                      <span className="text-xs text-muted-foreground block truncate">{route.fromAddress}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-sm font-semibold block">{modeData.duration}</span>
                      <span className="text-xs text-muted-foreground">{modeData.distance}</span>
                    </div>
                    {modeData.transitInfo && (
                      <Badge variant="outline" className="text-xs whitespace-nowrap">{modeData.transitInfo}</Badge>
                    )}
                    <ArrowRight className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                  </div>
                </div>
              </button>
              {isExpanded && (
                <CardContent className="border-t pt-4 space-y-2">
                  {modeData.steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm" data-testid={`step-${route.id}-${i}`}>
                      <div className="flex flex-col items-center shrink-0 mt-0.5">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center border" style={{ borderColor: `${config.color}60`, backgroundColor: `${config.color}15` }}>
                          <span className="text-[10px] font-medium" style={{ color: config.color }}>{i + 1}</span>
                        </div>
                        {i < modeData.steps.length - 1 && <div className="w-px h-5 bg-border mt-0.5" />}
                      </div>
                      <p className="text-muted-foreground pt-0.5">{step}</p>
                    </div>
                  ))}
                  <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t flex-wrap">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Estimated: {modeData.duration} ({modeData.distance})</span>
                    </div>
                    <a
                      href={route.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid={`link-gmaps-${route.id}`}
                    >
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-3.5 w-3.5 mr-1" />
                        Open in Maps
                      </Button>
                    </a>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
        {filteredRoutes.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Navigation className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p>No routes found matching your search.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
