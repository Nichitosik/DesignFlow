import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface Props {
  category: string;
  zoneType?: "main" | "tribune" | "vip";
  capacity: number;
  price: number;
  eventId: number;
  takenSeats: string[];
  onSelectSeat: (seat: string | null) => void;
  selectedSeat: string | null;
}

const ROWS_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M"];
const SEATS_PER_ROW = 20;

function buildGrid(capacity: number, category: string) {
  if (category === "VIP") {
    const seatsPerRow = 10;
    const rows = Math.ceil(Math.min(capacity, 100) / seatsPerRow);
    return { rows, seatsPerRow };
  }
  const seatsPerRow = Math.min(SEATS_PER_ROW, Math.ceil(Math.sqrt(capacity * 2)));
  const rows = Math.ceil(capacity / seatsPerRow);
  return { rows, seatsPerRow };
}

function seatLabel(rowIdx: number, seatIdx: number): string {
  const rowLetter = ROWS_LABELS[rowIdx] ?? `R${rowIdx + 1}`;
  return `Row ${rowLetter}, Seat ${seatIdx + 1}`;
}

export default function SeatPickerGrid({
  category, zoneType, capacity, price, takenSeats, onSelectSeat, selectedSeat,
}: Props) {
  const takenSet = new Set(takenSeats);
  const effectiveType = zoneType ?? (/vip/i.test(category) ? "vip" : "tribune");
  const { rows, seatsPerRow } = buildGrid(capacity, effectiveType === "vip" ? "VIP" : "Tribune");

  const isVip = effectiveType === "vip";
  const accentClass = isVip ? "bg-red-400 border-red-500" : "bg-amber-400 border-amber-500";
  const selectedClass = isVip
    ? "bg-red-600 border-red-700 ring-2 ring-red-300"
    : "bg-amber-600 border-amber-700 ring-2 ring-amber-300";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {selectedSeat
            ? `Selected: ${selectedSeat} — ${price.toFixed(0)} MDL`
            : "Click a seat to select"}
        </p>
        {selectedSeat && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => onSelectSeat(null)}
            title="Clear selection"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <div className="border rounded-lg overflow-auto max-h-64 p-3">
        <div className="text-center text-xs text-muted-foreground pb-2 mb-2 border-b">
          ── STAGE ──
        </div>
        <div className="space-y-1.5">
          {Array.from({ length: rows }, (_, rowIdx) => {
            const rowLabel = ROWS_LABELS[rowIdx] ?? `R${rowIdx + 1}`;
            const seatsInRow = Math.min(seatsPerRow, capacity - rowIdx * seatsPerRow);
            if (seatsInRow <= 0) return null;
            return (
              <div key={rowIdx} className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground w-5 shrink-0 text-right">
                  {rowLabel}
                </span>
                <div className="flex gap-1">
                  {Array.from({ length: seatsInRow }, (_, seatIdx) => {
                    const label = seatLabel(rowIdx, seatIdx);
                    const isTaken = takenSet.has(label);
                    const isSelected = selectedSeat === label;
                    return (
                      <button
                        key={seatIdx}
                        type="button"
                        title={isTaken ? `${label} — taken` : label}
                        disabled={isTaken}
                        onClick={() => onSelectSeat(isSelected ? null : label)}
                        className={`w-5 h-5 rounded-full border transition-all shrink-0 ${
                          isTaken
                            ? "bg-muted border-muted-foreground/20 cursor-not-allowed"
                            : isSelected
                            ? selectedClass
                            : `${accentClass} opacity-80 hover:opacity-100 cursor-pointer`
                        }`}
                      />
                    );
                  })}
                </div>
                <span className="text-[10px] text-muted-foreground w-5 shrink-0">
                  {rowLabel}
                </span>
              </div>
            );
          })}
        </div>
        <div className="text-center text-xs text-muted-foreground pt-2 mt-2 border-t">
          {category}
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground justify-center">
        <span className="flex items-center gap-1.5">
          <span className={`w-4 h-4 rounded-full border ${accentClass}`} />
          {price.toFixed(0)} MDL
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-muted border border-muted-foreground/20" />
          Indisponibil
        </span>
        {selectedSeat && (
          <span className="flex items-center gap-1.5">
            <span className={`w-4 h-4 rounded-full border ${selectedClass}`} />
            Selectat
          </span>
        )}
      </div>
    </div>
  );
}
