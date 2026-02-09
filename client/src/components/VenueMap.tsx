import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Plus, Minus, Info, X } from "lucide-react";
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
  if (percentage >= 90) return { fill: "#ef4444", stroke: "#dc2626", text: "Full" };
  if (percentage >= 70) return { fill: "#f59e0b", stroke: "#d97706", text: "Busy" };
  if (percentage >= 40) return { fill: "#3b82f6", stroke: "#2563eb", text: "Moderate" };
  return { fill: "#22c55e", stroke: "#16a34a", text: "Available" };
}

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

      <div className="relative rounded-md overflow-hidden border" style={{ height: "420px", background: "linear-gradient(135deg, hsl(142 30% 92%), hsl(142 20% 88%))" }}>
        <svg
          viewBox="0 0 800 500"
          className="w-full h-full"
          style={{ transform: `scale(${zoom})`, transformOrigin: "center center", transition: "transform 0.2s ease" }}
        >
          <defs>
            <pattern id="grass" width="20" height="20" patternUnits="userSpaceOnUse">
              <rect width="20" height="20" fill="hsl(142 30% 85%)" />
              <circle cx="5" cy="5" r="0.5" fill="hsl(142 40% 75%)" opacity="0.5" />
              <circle cx="15" cy="15" r="0.5" fill="hsl(142 40% 75%)" opacity="0.5" />
            </pattern>
            <pattern id="pathPattern" width="10" height="10" patternUnits="userSpaceOnUse">
              <rect width="10" height="10" fill="hsl(30 10% 78%)" />
              <line x1="0" y1="5" x2="10" y2="5" stroke="hsl(30 10% 72%)" strokeWidth="0.5" strokeDasharray="2,2" />
            </pattern>
            <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
              <feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.15" />
            </filter>
            <linearGradient id="stageGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(260 80% 60%)" />
              <stop offset="100%" stopColor="hsl(260 80% 45%)" />
            </linearGradient>
            <radialGradient id="spotlightGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(50 100% 75%)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="hsl(50 100% 75%)" stopOpacity="0" />
            </radialGradient>
          </defs>

          <rect width="800" height="500" fill="url(#grass)" />

          <path d="M 400 100 L 400 400" stroke="hsl(30 10% 72%)" strokeWidth="18" fill="none" strokeLinecap="round" opacity="0.7" />
          <path d="M 130 250 L 670 250" stroke="hsl(30 10% 72%)" strokeWidth="14" fill="none" strokeLinecap="round" opacity="0.6" />
          <path d="M 200 100 L 200 400" stroke="hsl(30 10% 72%)" strokeWidth="10" fill="none" strokeLinecap="round" opacity="0.5" />
          <path d="M 600 100 L 600 400" stroke="hsl(30 10% 72%)" strokeWidth="10" fill="none" strokeLinecap="round" opacity="0.5" />
          <path d="M 130 150 L 670 150" stroke="hsl(30 10% 72%)" strokeWidth="8" fill="none" strokeLinecap="round" opacity="0.4" />
          <path d="M 130 380 L 670 380" stroke="hsl(30 10% 72%)" strokeWidth="8" fill="none" strokeLinecap="round" opacity="0.4" />

          <rect x="100" y="15" width="600" height="5" rx="2" fill="hsl(0 0% 60%)" opacity="0.5" />
          <rect x="100" y="480" width="600" height="5" rx="2" fill="hsl(0 0% 60%)" opacity="0.5" />
          <rect x="95" y="15" width="5" height="470" rx="2" fill="hsl(0 0% 60%)" opacity="0.5" />
          <rect x="700" y="15" width="5" height="470" rx="2" fill="hsl(0 0% 60%)" opacity="0.5" />

          <g filter="url(#shadow)">
            <rect x="270" y="30" width="260" height="80" rx="8" fill="url(#stageGrad)" />
            <rect x="270" y="30" width="260" height="80" rx="8" fill="none" stroke="hsl(260 80% 35%)" strokeWidth="2" />
            <circle cx="320" cy="55" r="8" fill="url(#spotlightGlow)" />
            <circle cx="400" cy="50" r="10" fill="url(#spotlightGlow)" />
            <circle cx="480" cy="55" r="8" fill="url(#spotlightGlow)" />
            <text x="400" y="78" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" fontFamily="system-ui">MAIN STAGE</text>
            <text x="400" y="92" textAnchor="middle" fill="hsl(260 80% 85%)" fontSize="9" fontFamily="system-ui">Live Performance Area</text>
          </g>

          {zones.filter(z => z.type === "entrance").map((zone, i) => {
            const positions = [
              { x: 110, y: 220, w: 70, h: 55, rotation: 0 },
              { x: 620, y: 220, w: 70, h: 55, rotation: 0 },
            ];
            const pos = positions[i] || { x: zone.x * 7, y: zone.y * 4.5, w: 70, h: 55, rotation: 0 };
            const pct = zone.capacity > 0 ? (zone.current / zone.capacity) * 100 : 0;
            const colors = getOccupancyColor(pct);
            const isActive = activeZone === zone.id || hoveredZone === zone.id || selectedZone === zone.id;

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
                  fill={isActive ? `${colors.fill}40` : `${colors.fill}20`}
                  stroke={colors.stroke} strokeWidth={isActive ? 3 : 2}
                  filter="url(#shadow)"
                />
                <rect x={pos.x + 5} y={pos.y + 5} width={15} height={15} rx="3" fill={colors.fill} opacity="0.8" />
                <text x={pos.x + 12.5} y={pos.y + 16} textAnchor="middle" fill="white" fontSize="8" fontWeight="bold" fontFamily="system-ui">E</text>
                <text x={pos.x + pos.w / 2} y={pos.y + 28} textAnchor="middle" fill="hsl(0 0% 25%)" fontSize="10" fontWeight="600" fontFamily="system-ui">{zone.name}</text>
                <text x={pos.x + pos.w / 2} y={pos.y + 42} textAnchor="middle" fill="hsl(0 0% 45%)" fontSize="9" fontFamily="system-ui">{zone.current}/{zone.capacity}</text>
                <rect x={pos.x + 10} y={pos.y + pos.h - 8} width={pos.w - 20} height="4" rx="2" fill="hsl(0 0% 85%)" />
                <rect x={pos.x + 10} y={pos.y + pos.h - 8} width={(pos.w - 20) * Math.min(pct / 100, 1)} height="4" rx="2" fill={colors.fill} />
              </g>
            );
          })}

          {zones.filter(z => z.type === "seating").map((zone, i) => {
            const positions = [
              { x: 140, y: 310, w: 120, h: 75 },
              { x: 540, y: 130, w: 140, h: 100 },
            ];
            const pos = positions[i] || { x: zone.x * 7, y: zone.y * 4.5, w: 120, h: 75 };
            const pct = zone.capacity > 0 ? (zone.current / zone.capacity) * 100 : 0;
            const colors = getOccupancyColor(pct);
            const isActive = activeZone === zone.id || hoveredZone === zone.id || selectedZone === zone.id;
            const isVIP = zone.name.toLowerCase().includes("vip");

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
                  x={pos.x} y={pos.y} width={pos.w} height={pos.h} rx="8"
                  fill={isActive ? `${colors.fill}30` : `${colors.fill}15`}
                  stroke={colors.stroke} strokeWidth={isActive ? 3 : 1.5}
                  filter="url(#shadow)"
                />
                {isVIP && (
                  <rect x={pos.x} y={pos.y} width={pos.w} height={pos.h} rx="8"
                    fill="none" stroke="hsl(45 100% 55%)" strokeWidth="1" strokeDasharray="4,3" />
                )}
                {Array.from({ length: Math.min(Math.floor(pos.w / 12), 8) }).map((_, ri) => (
                  <g key={ri}>
                    {Array.from({ length: Math.min(Math.floor(pos.h / 18), 3) }).map((_, ci) => (
                      <rect
                        key={ci}
                        x={pos.x + 12 + ri * 12}
                        y={pos.y + 25 + ci * 16}
                        width="8" height="8" rx="2"
                        fill={colors.fill}
                        opacity={Math.random() > pct / 100 ? 0.15 : 0.5}
                      />
                    ))}
                  </g>
                ))}
                {isVIP && (
                  <text x={pos.x + pos.w - 12} y={pos.y + 14} textAnchor="end" fill="hsl(45 100% 45%)" fontSize="8" fontWeight="bold" fontFamily="system-ui">VIP</text>
                )}
                <text x={pos.x + pos.w / 2} y={pos.y + 14} textAnchor="middle" fill="hsl(0 0% 25%)" fontSize="10" fontWeight="600" fontFamily="system-ui">{zone.name}</text>
                <rect x={pos.x + 8} y={pos.y + pos.h - 10} width={pos.w - 16} height="5" rx="2.5" fill="hsl(0 0% 85%)" />
                <rect x={pos.x + 8} y={pos.y + pos.h - 10} width={(pos.w - 16) * Math.min(pct / 100, 1)} height="5" rx="2.5" fill={colors.fill} />
              </g>
            );
          })}

          {zones.filter(z => z.type === "facilities").map((zone) => {
            const pos = { x: 340, y: 390, w: 120, h: 55 };
            const pct = zone.capacity > 0 ? (zone.current / zone.capacity) * 100 : 0;
            const colors = getOccupancyColor(pct);
            const isActive = activeZone === zone.id || hoveredZone === zone.id || selectedZone === zone.id;

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
                  fill={isActive ? `${colors.fill}30` : `${colors.fill}15`}
                  stroke={colors.stroke} strokeWidth={isActive ? 3 : 1.5}
                  filter="url(#shadow)"
                />
                <rect x={pos.x + 8} y={pos.y + 6} width="14" height="14" rx="3" fill={colors.fill} opacity="0.3" />
                <text x={pos.x + 15} y={pos.y + 17} textAnchor="middle" fill="hsl(0 0% 40%)" fontSize="9" fontWeight="bold" fontFamily="system-ui">F</text>
                <text x={pos.x + pos.w / 2} y={pos.y + 18} textAnchor="middle" fill="hsl(0 0% 25%)" fontSize="10" fontWeight="600" fontFamily="system-ui">{zone.name}</text>
                <text x={pos.x + pos.w / 2} y={pos.y + 33} textAnchor="middle" fill="hsl(0 0% 45%)" fontSize="9" fontFamily="system-ui">{zone.current}/{zone.capacity}</text>
                <rect x={pos.x + 10} y={pos.y + pos.h - 8} width={pos.w - 20} height="4" rx="2" fill="hsl(0 0% 85%)" />
                <rect x={pos.x + 10} y={pos.y + pos.h - 8} width={(pos.w - 20) * Math.min(pct / 100, 1)} height="4" rx="2" fill={colors.fill} />
              </g>
            );
          })}

          <g opacity="0.5">
            <rect x="280" y="430" width="40" height="30" rx="4" fill="hsl(200 50% 70%)" stroke="hsl(200 50% 55%)" strokeWidth="1" />
            <text x="300" y="449" textAnchor="middle" fill="hsl(200 50% 30%)" fontSize="7" fontFamily="system-ui">WC</text>
          </g>
          <g opacity="0.5">
            <rect x="480" y="430" width="50" height="30" rx="4" fill="hsl(30 60% 75%)" stroke="hsl(30 60% 55%)" strokeWidth="1" />
            <text x="505" y="449" textAnchor="middle" fill="hsl(30 60% 30%)" fontSize="7" fontFamily="system-ui">Food</text>
          </g>
          <g opacity="0.5">
            <rect x="350" y="300" width="100" height="45" rx="4" fill="hsl(0 0% 92%)" stroke="hsl(0 0% 75%)" strokeWidth="1" />
            <text x="400" y="318" textAnchor="middle" fill="hsl(0 0% 40%)" fontSize="8" fontWeight="500" fontFamily="system-ui">Sound &amp; Light</text>
            <text x="400" y="332" textAnchor="middle" fill="hsl(0 0% 55%)" fontSize="7" fontFamily="system-ui">Control Booth</text>
          </g>

          <g opacity="0.4">
            <circle cx="160" cy="140" r="12" fill="hsl(142 40% 65%)" />
            <circle cx="650" cy="400" r="15" fill="hsl(142 40% 65%)" />
            <circle cx="730" cy="100" r="10" fill="hsl(142 40% 65%)" />
          </g>

          <text x="400" y="470" textAnchor="middle" fill="hsl(0 0% 50%)" fontSize="10" fontFamily="system-ui" fontStyle="italic">Arena Nationala - Concert Layout</text>
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
          <div className="w-3 h-3 rounded" style={{ background: "hsl(260 80% 50%)" }} />
          <span className="text-muted-foreground">Stage</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ background: "#22c55e" }} />
          <span className="text-muted-foreground">Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ background: "#3b82f6" }} />
          <span className="text-muted-foreground">Moderate</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ background: "#f59e0b" }} />
          <span className="text-muted-foreground">Busy</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ background: "#ef4444" }} />
          <span className="text-muted-foreground">Full</span>
        </div>
      </div>
    </Card>
  );
}
