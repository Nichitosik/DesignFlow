import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Layers, Plus, Minus } from "lucide-react";
import { useState } from "react";

interface VenueZone {
  id: string;
  name: string;
  x: number;
  y: number;
  capacity: number;
  current: number;
  type: "stage" | "entrance" | "parking" | "seating" | "facilities";
}

interface VenueMapProps {
  zones: VenueZone[];
  activeZone?: string;
  onZoneClick?: (zoneId: string) => void;
}

export function VenueMap({ zones, activeZone, onZoneClick }: VenueMapProps) {
  const [zoom, setZoom] = useState(1);

  const getZoneColor = (zone: VenueZone) => {
    const percentage = (zone.current / zone.capacity) * 100;
    if (zone.type === "stage") return "bg-primary/20 border-primary";
    if (zone.type === "entrance") return "bg-chart-5/20 border-chart-5";
    if (percentage >= 90) return "bg-[hsl(0,80%,55%)]/20 border-[hsl(0,80%,55%)]";
    if (percentage >= 70) return "bg-[hsl(38,90%,55%)]/20 border-[hsl(38,90%,55%)]";
    return "bg-[hsl(142,70%,45%)]/20 border-[hsl(142,70%,45%)]";
  };

  return (
    <Card className="p-4" data-testid="venue-map">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Venue Map
        </h3>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="outline" onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}>
            <Minus className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground min-w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button size="icon" variant="outline" onClick={() => setZoom(Math.min(2, zoom + 0.1))}>
            <Plus className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="outline">
            <Layers className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="outline">
            <Navigation className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="relative bg-muted rounded-md overflow-hidden" style={{ height: "400px" }}>
        <div 
          className="absolute inset-0 transition-transform"
          style={{ transform: `scale(${zoom})` }}
        >
          {zones.map((zone) => (
            <button
              key={zone.id}
              className={`absolute rounded-md border-2 transition-all hover-elevate ${getZoneColor(zone)} ${
                activeZone === zone.id ? "ring-2 ring-primary" : ""
              }`}
              style={{
                left: `${zone.x}%`,
                top: `${zone.y}%`,
                width: zone.type === "stage" ? "30%" : "15%",
                height: zone.type === "stage" ? "15%" : "12%",
              }}
              onClick={() => onZoneClick?.(zone.id)}
              data-testid={`zone-${zone.id}`}
            >
              <div className="p-2 text-xs font-medium">
                <div className="truncate">{zone.name}</div>
                <div className="text-muted-foreground">
                  {zone.current}/{zone.capacity}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-primary/20 border-2 border-primary rounded" />
          <span>Stage</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[hsl(142,70%,45%)]/20 border-2 border-[hsl(142,70%,45%)] rounded" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[hsl(38,90%,55%)]/20 border-2 border-[hsl(38,90%,55%)] rounded" />
          <span>Near Capacity</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[hsl(0,80%,55%)]/20 border-2 border-[hsl(0,80%,55%)] rounded" />
          <span>Full</span>
        </div>
      </div>
    </Card>
  );
}
