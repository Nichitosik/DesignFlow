import { useState } from "react";

export interface ArenaCategory {
  id: number;
  name: string;
  zoneType?: "main" | "tribune" | "vip";
  price: number;
  capacity: number;
  sold: number;
  available: number;
  color: string;
}

interface Props {
  categories: ArenaCategory[];
  onCategoryClick: (cat: ArenaCategory) => void;
}

// Each section in the SVG arena
interface Section {
  id: string;
  type: "vip" | "tribune" | "main" | "stage";
  path?: string;
  rect?: { x: number; y: number; w: number; h: number; rx?: number };
  label: string;
  labelX: number;
  labelY: number;
  priceY?: number;
  availY?: number;
}

const STAGE: Section = {
  id: "stage",
  type: "stage",
  rect: { x: 195, y: 14, w: 250, h: 50, rx: 6 },
  label: "STAGE",
  labelX: 320,
  labelY: 44,
};

// All arena sections (excluding stage)
const SECTIONS: Section[] = [
  // VIP — left column
  { id: "vip-l1", type: "vip", rect: { x: 10, y: 74, w: 70, h: 110, rx: 6 }, label: "VIP", labelX: 45, labelY: 122, priceY: 136, availY: 148 },
  { id: "vip-l2", type: "vip", rect: { x: 10, y: 192, w: 70, h: 110, rx: 6 }, label: "VIP", labelX: 45, labelY: 240, priceY: 254, availY: 266 },
  // VIP — right column
  { id: "vip-r1", type: "vip", rect: { x: 560, y: 74, w: 70, h: 110, rx: 6 }, label: "VIP", labelX: 595, labelY: 122, priceY: 136, availY: 148 },
  { id: "vip-r2", type: "vip", rect: { x: 560, y: 192, w: 70, h: 110, rx: 6 }, label: "VIP", labelX: 595, labelY: 240, priceY: 254, availY: 266 },
  // VIP — bottom floor boxes
  { id: "vip-b1", type: "vip", rect: { x: 10, y: 314, w: 70, h: 62, rx: 6 }, label: "VIP", labelX: 45, labelY: 344, priceY: 356, availY: 367 },
  { id: "vip-b2", type: "vip", rect: { x: 560, y: 314, w: 70, h: 62, rx: 6 }, label: "VIP", labelX: 595, labelY: 344, priceY: 356, availY: 367 },

  // Tribune — left upper
  { id: "trib-l1", type: "tribune", rect: { x: 86, y: 74, w: 98, h: 110, rx: 4 }, label: "TRIBUNE", labelX: 135, labelY: 120, priceY: 134, availY: 146 },
  // Tribune — left lower
  { id: "trib-l2", type: "tribune", rect: { x: 86, y: 192, w: 98, h: 110, rx: 4 }, label: "TRIBUNE", labelX: 135, labelY: 238, priceY: 252, availY: 264 },
  // Tribune — right upper
  { id: "trib-r1", type: "tribune", rect: { x: 456, y: 74, w: 98, h: 110, rx: 4 }, label: "TRIBUNE", labelX: 505, labelY: 120, priceY: 134, availY: 146 },
  // Tribune — right lower
  { id: "trib-r2", type: "tribune", rect: { x: 456, y: 192, w: 98, h: 110, rx: 4 }, label: "TRIBUNE", labelX: 505, labelY: 238, priceY: 252, availY: 264 },
  // Tribune — bottom left
  { id: "trib-bl", type: "tribune", rect: { x: 86, y: 314, w: 98, h: 62, rx: 4 }, label: "TRIBUNE", labelX: 135, labelY: 344, priceY: 356, availY: 367 },
  // Tribune — bottom right
  { id: "trib-br", type: "tribune", rect: { x: 456, y: 314, w: 98, h: 62, rx: 4 }, label: "TRIBUNE", labelX: 505, labelY: 344, priceY: 356, availY: 367 },
  // Tribune — bottom center
  { id: "trib-bc", type: "tribune", rect: { x: 188, y: 330, w: 264, h: 46, rx: 4 }, label: "TRIBUNE", labelX: 320, labelY: 352, priceY: 362, availY: 371 },

  // GA / Main — center floor
  { id: "main", type: "main", rect: { x: 188, y: 74, w: 264, h: 250, rx: 4 }, label: "MAIN / GA", labelX: 320, labelY: 192, priceY: 208, availY: 222 },
];

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : "100, 100, 200";
}

function categoryForSection(section: Section, categories: ArenaCategory[]): ArenaCategory | null {
  if (section.type === "stage") return null;

  // Prefer zoneType field when available, fall back to name regex
  const vip = categories.find((c) => c.zoneType === "vip") ?? categories.find((c) => /vip/i.test(c.name));
  const tribune = categories.find((c) => c.zoneType === "tribune") ?? categories.find((c) => /tribun/i.test(c.name));
  const main = categories.find((c) => c.zoneType === "main") ??
    categories.find((c) => !/vip/i.test(c.name) && !/tribun/i.test(c.name));

  if (section.type === "vip" && vip) return vip;
  if (section.type === "tribune" && tribune) return tribune;
  if (section.type === "main" && main) return main;

  // Fallback: pick by order
  if (section.type === "vip") return categories[categories.length - 1] || null;
  if (section.type === "tribune") return categories[1] || categories[0] || null;
  return categories[0] || null;
}

export default function InteractiveArenaMap({ categories, onCategoryClick }: Props) {
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  if (!categories || categories.length === 0) return null;

  const renderSection = (section: Section) => {
    const cat = categoryForSection(section, categories);
    if (section.type === "stage" || !cat) {
      // Stage
      const r = section.rect!;
      return (
        <g key={section.id}>
          <rect
            x={r.x} y={r.y} width={r.w} height={r.h} rx={r.rx || 4}
            fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth={1}
          />
          <text
            x={section.labelX} y={section.labelY}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={11} fontWeight={600} fill="hsl(var(--muted-foreground))"
            letterSpacing={2}
          >
            {section.label}
          </text>
        </g>
      );
    }

    const isHovered = hoveredSection === section.id;
    const soldOut = cat.available <= 0;
    const pct = cat.capacity > 0 ? cat.sold / cat.capacity : 0;
    const fillOpacity = soldOut ? 0.15 : isHovered ? 0.75 : 0.55;
    const rgb = hexToRgb(cat.color || "#6366f1");
    const r = section.rect!;

    return (
      <g
        key={section.id}
        className={soldOut ? "cursor-not-allowed" : "cursor-pointer"}
        onMouseEnter={() => !soldOut && setHoveredSection(section.id)}
        onMouseLeave={() => setHoveredSection(null)}
        onClick={() => !soldOut && onCategoryClick(cat)}
        tabIndex={soldOut ? -1 : 0}
        role="button"
        aria-label={`${cat.name} — ${cat.price} MDL, ${cat.available} available`}
        onKeyDown={(e) => e.key === "Enter" && !soldOut && onCategoryClick(cat)}
      >
        {/* Background fill */}
        <rect
          x={r.x} y={r.y} width={r.w} height={r.h} rx={r.rx || 4}
          fill={`rgba(${rgb}, ${fillOpacity})`}
          stroke={`rgba(${rgb}, ${isHovered ? 1 : 0.6})`}
          strokeWidth={isHovered ? 2 : 1}
          className="transition-all duration-150"
        />
        {/* Availability fill bar at bottom of section */}
        {!soldOut && (
          <rect
            x={r.x + 2} y={r.y + r.h - 5}
            width={Math.max(0, (r.w - 4) * pct)}
            height={3}
            rx={1.5}
            fill={`rgba(${rgb}, 0.9)`}
          />
        )}
        {/* Label */}
        <text
          x={section.labelX} y={section.labelY}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={section.type === "main" ? 12 : 9}
          fontWeight={700}
          fill={soldOut ? "hsl(var(--muted-foreground))" : `rgba(${rgb}, 1)`}
          letterSpacing={1}
        >
          {section.label}
        </text>
        {/* Price */}
        {section.priceY && (
          <text
            x={section.labelX} y={section.priceY}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={section.type === "main" ? 13 : 9}
            fontWeight={600}
            fill={soldOut ? "hsl(var(--muted-foreground))" : "hsl(var(--foreground))"}
          >
            {cat.price.toFixed(0)} MDL
          </text>
        )}
        {/* Availability */}
        {section.availY && (
          <text
            x={section.labelX} y={section.availY}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={8}
            fill="hsl(var(--muted-foreground))"
          >
            {soldOut ? "SOLD OUT" : `${cat.available} left`}
          </text>
        )}
      </g>
    );
  };

  // Unique categories for legend
  const legendCats = Array.from(
    new Map(categories.map((c) => [c.name, c])).values(),
  );

  return (
    <div className="space-y-4">
      <svg
        viewBox="0 0 640 400"
        className="w-full max-h-[420px] rounded-lg border bg-card"
        aria-label="Arena seating map"
      >
        {/* Arena outline */}
        <rect x={2} y={2} width={636} height={396} rx={12} fill="none" stroke="hsl(var(--border))" strokeWidth={1.5} />

        {/* Stage first */}
        {renderSection(STAGE)}

        {/* All interactive sections */}
        {SECTIONS.map(renderSection)}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 justify-center">
        {legendCats.map((cat) => {
          const soldOut = cat.available <= 0;
          const dotClass = (cat.zoneType === "vip" || /vip/i.test(cat.name))
            ? "bg-red-500"
            : (cat.zoneType === "tribune" || /tribun/i.test(cat.name))
            ? "bg-amber-500"
            : "bg-indigo-500";
          return (
            <button
              type="button"
              key={cat.id}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-opacity ${soldOut ? "opacity-50 cursor-not-allowed" : "hover-elevate cursor-pointer"}`}
              onClick={() => !soldOut && onCategoryClick(cat)}
              disabled={soldOut}
            >
              <span className={`inline-block w-3 h-3 rounded-full shrink-0 ${dotClass}`} />
              <span>{cat.name}</span>
              <span className="text-muted-foreground">{cat.price.toFixed(0)} MDL</span>
              {soldOut && <span className="text-xs text-muted-foreground">· sold out</span>}
            </button>
          );
        })}
      </div>

      {/* Instruction */}
      <p className="text-center text-xs text-muted-foreground">
        Click a section to purchase a ticket
      </p>
    </div>
  );
}
