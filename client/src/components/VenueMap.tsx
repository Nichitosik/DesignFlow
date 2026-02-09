import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Plus, Minus, X } from "lucide-react";
import { useState, useMemo } from "react";

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

function getOccupancyColor(percentage: number): { fill: string; stroke: string; text: string } {
  if (percentage >= 90) return { fill: "hsl(0, 80%, 55%)", stroke: "hsl(0, 80%, 45%)", text: "Full" };
  if (percentage >= 70) return { fill: "hsl(38, 90%, 55%)", stroke: "hsl(38, 90%, 45%)", text: "Busy" };
  if (percentage >= 40) return { fill: "hsl(200, 80%, 50%)", stroke: "hsl(200, 80%, 40%)", text: "Moderate" };
  return { fill: "hsl(142, 70%, 45%)", stroke: "hsl(142, 70%, 35%)", text: "Available" };
}

const zoneTypeIcon: Record<string, string> = {
  stage: "S",
  entrance: "E",
  seating: "A",
  facilities: "F",
  parking: "P",
};

export function VenueMap({ zones, activeZone, onZoneClick }: VenueMapProps) {
  const [zoom, setZoom] = useState(1);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  const zoneMap = useMemo(() => {
    const map: Record<string, VenueZone> = {};
    zones.forEach(z => { map[z.id] = z; });
    return map;
  }, [zones]);

  const handleZoneClick = (zoneId: string) => {
    setSelectedZone(prev => prev === zoneId ? null : zoneId);
    onZoneClick?.(zoneId);
  };

  const selectedZoneData = selectedZone ? zoneMap[selectedZone] : null;

  const zonePositions: Record<string, { x: number; y: number; w: number; h: number }[]> = {
    entrance: [
      { x: 100, y: 200, w: 80, h: 50 },
      { x: 620, y: 200, w: 80, h: 50 },
    ],
    seating: [
      { x: 120, y: 300, w: 140, h: 80 },
      { x: 540, y: 120, w: 150, h: 90 },
    ],
    facilities: [
      { x: 340, y: 380, w: 120, h: 50 },
    ],
  };

  const renderZone = (zone: VenueZone, pos: { x: number; y: number; w: number; h: number }) => {
    const pct = zone.capacity > 0 ? (zone.current / zone.capacity) * 100 : 0;
    const colors = getOccupancyColor(pct);
    const isActive = activeZone === zone.id || hoveredZone === zone.id || selectedZone === zone.id;
    const isVIP = zone.name.toLowerCase().includes("vip");
    const barWidth = pos.w - 20;

    return (
      <g
        key={zone.id}
        onClick={() => handleZoneClick(zone.id)}
        onMouseEnter={() => setHoveredZone(zone.id)}
        onMouseLeave={() => setHoveredZone(null)}
        style={{ cursor: "pointer" }}
        data-testid={`zone-${zone.id}`}
      >
        <rect
          x={pos.x} y={pos.y} width={pos.w} height={pos.h} rx="6"
          fill={isActive ? `${colors.fill}` : "hsl(0, 0%, 97%)"}
          fillOpacity={isActive ? 0.15 : 1}
          stroke={isActive ? colors.stroke : "hsl(0, 0%, 85%)"}
          strokeWidth={isActive ? 2 : 1}
        />
        <circle cx={pos.x + 14} cy={pos.y + 14} r="8" fill={colors.fill} fillOpacity="0.8" />
        <text x={pos.x + 14} y={pos.y + 18} textAnchor="middle" fill="white" fontSize="8" fontWeight="600" fontFamily="system-ui">
          {zoneTypeIcon[zone.type] || "Z"}
        </text>
        <text x={pos.x + 28} y={pos.y + 17} fill="hsl(0, 0%, 20%)" fontSize="10" fontWeight="600" fontFamily="system-ui">
          {zone.name}
        </text>
        {isVIP && (
          <text x={pos.x + pos.w - 8} y={pos.y + 17} textAnchor="end" fill="hsl(45, 100%, 42%)" fontSize="8" fontWeight="700" fontFamily="system-ui">VIP</text>
        )}
        <text x={pos.x + 10} y={pos.y + 32} fill="hsl(0, 0%, 50%)" fontSize="9" fontFamily="system-ui">
          {zone.current}/{zone.capacity}
        </text>
        <text x={pos.x + pos.w - 10} y={pos.y + 32} textAnchor="end" fontSize="9" fontFamily="system-ui" fill={colors.fill} fontWeight="500">
          {colors.text}
        </text>
        <rect x={pos.x + 10} y={pos.y + pos.h - 10} width={barWidth} height="4" rx="2" fill="hsl(0, 0%, 90%)" />
        <rect x={pos.x + 10} y={pos.y + pos.h - 10} width={barWidth * Math.min(pct / 100, 1)} height="4" rx="2" fill={colors.fill} />
      </g>
    );
  };

  return (
    <Card className="p-4" data-testid="venue-map">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="font-semibold flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Interactive Venue Map
        </h3>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="outline" onClick={() => setZoom(Math.max(0.6, zoom - 0.15))} data-testid="button-zoom-out">
            <Minus className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground min-w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button size="icon" variant="outline" onClick={() => setZoom(Math.min(1.8, zoom + 0.15))} data-testid="button-zoom-in">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="relative rounded-md overflow-hidden border bg-muted/30" style={{ height: "420px" }}>
        <svg
          viewBox="0 0 800 500"
          className="w-full h-full"
          style={{ transform: `scale(${zoom})`, transformOrigin: "center center", transition: "transform 0.2s ease" }}
        >
          <rect width="800" height="500" fill="hsl(0, 0%, 98%)" />

          <line x1="100" y1="0" x2="100" y2="500" stroke="hsl(0, 0%, 92%)" strokeWidth="1" />
          <line x1="200" y1="0" x2="200" y2="500" stroke="hsl(0, 0%, 92%)" strokeWidth="1" />
          <line x1="300" y1="0" x2="300" y2="500" stroke="hsl(0, 0%, 92%)" strokeWidth="1" />
          <line x1="400" y1="0" x2="400" y2="500" stroke="hsl(0, 0%, 92%)" strokeWidth="1" />
          <line x1="500" y1="0" x2="500" y2="500" stroke="hsl(0, 0%, 92%)" strokeWidth="1" />
          <line x1="600" y1="0" x2="600" y2="500" stroke="hsl(0, 0%, 92%)" strokeWidth="1" />
          <line x1="700" y1="0" x2="700" y2="500" stroke="hsl(0, 0%, 92%)" strokeWidth="1" />
          <line x1="0" y1="100" x2="800" y2="100" stroke="hsl(0, 0%, 92%)" strokeWidth="1" />
          <line x1="0" y1="200" x2="800" y2="200" stroke="hsl(0, 0%, 92%)" strokeWidth="1" />
          <line x1="0" y1="300" x2="800" y2="300" stroke="hsl(0, 0%, 92%)" strokeWidth="1" />
          <line x1="0" y1="400" x2="800" y2="400" stroke="hsl(0, 0%, 92%)" strokeWidth="1" />

          <path d="M 400 110 L 400 380" stroke="hsl(0, 0%, 88%)" strokeWidth="12" fill="none" strokeLinecap="round" />
          <path d="M 180 250 L 620 250" stroke="hsl(0, 0%, 88%)" strokeWidth="10" fill="none" strokeLinecap="round" />

          <rect x="100" y="20" width="600" height="2" rx="1" fill="hsl(0, 0%, 80%)" />
          <rect x="100" y="478" width="600" height="2" rx="1" fill="hsl(0, 0%, 80%)" />
          <rect x="98" y="20" width="2" height="460" rx="1" fill="hsl(0, 0%, 80%)" />
          <rect x="700" y="20" width="2" height="460" rx="1" fill="hsl(0, 0%, 80%)" />

          <rect x="280" y="30" width="240" height="70" rx="6" fill="hsl(260, 80%, 50%)" />
          <text x="400" y="65" textAnchor="middle" fill="white" fontSize="14" fontWeight="700" fontFamily="system-ui">MAIN STAGE</text>
          <text x="400" y="82" textAnchor="middle" fill="hsl(260, 80%, 85%)" fontSize="9" fontFamily="system-ui">Live Performance Area</text>

          {zones.filter(z => z.type === "entrance").map((zone, i) => {
            const pos = zonePositions.entrance[i] || { x: zone.x * 7, y: zone.y * 4.5, w: 80, h: 50 };
            return renderZone(zone, pos);
          })}

          {zones.filter(z => z.type === "seating").map((zone, i) => {
            const pos = zonePositions.seating[i] || { x: zone.x * 7, y: zone.y * 4.5, w: 140, h: 80 };
            return renderZone(zone, pos);
          })}

          {zones.filter(z => z.type === "facilities").map((zone, i) => {
            const pos = zonePositions.facilities[i] || { x: zone.x * 7, y: zone.y * 4.5, w: 120, h: 50 };
            return renderZone(zone, pos);
          })}

          <rect x="280" y="435" width="50" height="30" rx="4" fill="hsl(0, 0%, 94%)" stroke="hsl(0, 0%, 82%)" strokeWidth="1" />
          <text x="305" y="454" textAnchor="middle" fill="hsl(0, 0%, 50%)" fontSize="8" fontFamily="system-ui">WC</text>

          <rect x="460" y="435" width="60" height="30" rx="4" fill="hsl(0, 0%, 94%)" stroke="hsl(0, 0%, 82%)" strokeWidth="1" />
          <text x="490" y="454" textAnchor="middle" fill="hsl(0, 0%, 50%)" fontSize="8" fontFamily="system-ui">Food Court</text>

          <rect x="350" y="280" width="100" height="40" rx="4" fill="hsl(0, 0%, 94%)" stroke="hsl(0, 0%, 82%)" strokeWidth="1" />
          <text x="400" y="300" textAnchor="middle" fill="hsl(0, 0%, 45%)" fontSize="9" fontWeight="500" fontFamily="system-ui">Control Room</text>
          <text x="400" y="312" textAnchor="middle" fill="hsl(0, 0%, 60%)" fontSize="7" fontFamily="system-ui">Sound / Light</text>

          <text x="400" y="490" textAnchor="middle" fill="hsl(0, 0%, 65%)" fontSize="9" fontFamily="system-ui">Arena Nationala - Concert Layout</text>
        </svg>

        {selectedZoneData && (
          <div className="absolute top-3 right-3 bg-background/95 backdrop-blur border rounded-md p-3 shadow-md max-w-[200px]" data-testid="zone-detail-panel">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-sm font-semibold">{selectedZoneData.name}</span>
              <button onClick={() => setSelectedZone(null)} className="text-muted-foreground">
                <X className="h-3 w-3" />
              </button>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="capitalize">{selectedZoneData.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Occupancy</span>
                <span>{selectedZoneData.current}/{selectedZoneData.capacity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span style={{ color: getOccupancyColor(selectedZoneData.capacity > 0 ? (selectedZoneData.current / selectedZoneData.capacity) * 100 : 0).fill }}>
                  {getOccupancyColor(selectedZoneData.capacity > 0 ? (selectedZoneData.current / selectedZoneData.capacity) * 100 : 0).text}
                </span>
              </div>
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min((selectedZoneData.current / Math.max(selectedZoneData.capacity, 1)) * 100, 100)}%`,
                    backgroundColor: getOccupancyColor(selectedZoneData.capacity > 0 ? (selectedZoneData.current / selectedZoneData.capacity) * 100 : 0).fill,
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ background: "hsl(260, 80%, 50%)" }} />
          <span className="text-muted-foreground">Stage</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ background: "hsl(142, 70%, 45%)" }} />
          <span className="text-muted-foreground">Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ background: "hsl(200, 80%, 50%)" }} />
          <span className="text-muted-foreground">Moderate</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ background: "hsl(38, 90%, 55%)" }} />
          <span className="text-muted-foreground">Busy</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ background: "hsl(0, 80%, 55%)" }} />
          <span className="text-muted-foreground">Full</span>
        </div>
      </div>
    </Card>
  );
}
