import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MapPin, Clock, ArrowRight, Navigation } from "lucide-react";
import { useState } from "react";

interface RouteInfo {
  id: string;
  from: string;
  fromAddress: string;
  distance: string;
  duration: string;
  steps: string[];
  transport: "car" | "bus" | "walk";
}

const routes: RouteInfo[] = [
  {
    id: "arena",
    from: "Chi\u0219in\u0103u Arena",
    fromAddress: "Str. Dimo 41/3, Chi\u0219in\u0103u",
    distance: "3.2 km",
    duration: "12 min",
    steps: [
      "Head northeast on Str. Andrei Doga toward Bd. Decebal",
      "Turn left onto Bd. Decebal",
      "Continue straight for 1.8 km past Parcul Valea Morilor",
      "Turn right onto Str. Mitropolit Varlaam",
      "Arrive at the concert venue on your left",
    ],
    transport: "car",
  },
  {
    id: "zimbru",
    from: "Stadionul Zimbru",
    fromAddress: "Str. Tricolorului 39, Chi\u0219in\u0103u",
    distance: "4.7 km",
    duration: "18 min",
    steps: [
      "Head south on Str. Tricolorului toward Bd. Dacia",
      "Turn left onto Bd. Dacia and continue for 2.1 km",
      "At the roundabout, take the 2nd exit onto Str. Ismail",
      "Continue straight, passing Piata Centrala on your right",
      "Turn left onto Bd. Stefan cel Mare si Sfant",
      "Continue for 0.8 km and arrive at the concert venue",
    ],
    transport: "car",
  },
  {
    id: "teatrul",
    from: "Teatrul Verde",
    fromAddress: "Parcul Central, Chi\u0219in\u0103u",
    distance: "1.1 km",
    duration: "5 min",
    steps: [
      "Exit Teatrul Verde toward Bd. Stefan cel Mare si Sfant",
      "Head north on Bd. Stefan cel Mare si Sfant for 0.6 km",
      "Pass the National Museum of History on your right",
      "Continue straight and arrive at the concert venue",
    ],
    transport: "walk",
  },
];

export function DirectionsPanel() {
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);

  const getTransportLabel = (transport: string) => {
    switch (transport) {
      case "car": return "By car";
      case "bus": return "By bus";
      case "walk": return "On foot";
      default: return transport;
    }
  };

  return (
    <Card data-testid="directions-panel">
      <CardHeader>
        <h3 className="font-semibold flex items-center gap-2">
          <Navigation className="h-5 w-5" />
          Directions to the Venue
        </h3>
        <p className="text-sm text-muted-foreground">Routes from popular locations in Chi\u0219in\u0103u</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {routes.map((route) => {
          const isExpanded = expandedRoute === route.id;
          return (
            <div key={route.id} className="border rounded-md overflow-hidden" data-testid={`route-${route.id}`}>
              <button
                className="w-full text-left p-3 hover-elevate transition-colors"
                onClick={() => setExpandedRoute(isExpanded ? null : route.id)}
                data-testid={`button-route-${route.id}`}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                    <div className="min-w-0">
                      <span className="font-medium text-sm block truncate">{route.from}</span>
                      <span className="text-xs text-muted-foreground block truncate">{route.fromAddress}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-sm font-semibold block">{route.duration}</span>
                      <span className="text-xs text-muted-foreground">{route.distance} - {getTransportLabel(route.transport)}</span>
                    </div>
                    <ArrowRight className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                  </div>
                </div>
              </button>
              {isExpanded && (
                <div className="px-3 pb-3 border-t bg-muted/30">
                  <div className="pt-3 space-y-2">
                    {route.steps.map((step, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm" data-testid={`step-${route.id}-${i}`}>
                        <div className="flex flex-col items-center shrink-0 mt-1">
                          <div className="w-5 h-5 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                            <span className="text-[10px] font-medium text-primary">{i + 1}</span>
                          </div>
                          {i < route.steps.length - 1 && <div className="w-px h-4 bg-border mt-0.5" />}
                        </div>
                        <p className="text-muted-foreground pt-0.5">{step}</p>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Estimated travel time: {route.duration}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
