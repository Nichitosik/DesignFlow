import { Progress } from "@/components/ui/progress";
import { AlertTriangle } from "lucide-react";

interface CapacityMeterProps {
  current: number;
  max: number;
  label: string;
  showAlert?: boolean;
}

export function CapacityMeter({ current, max, label, showAlert = false }: CapacityMeterProps) {
  const percentage = Math.min((current / max) * 100, 100);
  const isNearCapacity = percentage >= 80;
  const isFull = percentage >= 100;

  const getColor = () => {
    if (isFull) return "bg-[hsl(0,80%,55%)]";
    if (isNearCapacity) return "bg-[hsl(38,90%,55%)]";
    return "bg-[hsl(142,70%,45%)]";
  };

  return (
    <div className="space-y-2" data-testid="capacity-meter">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {current.toLocaleString()} / {max.toLocaleString()}
          </span>
          {showAlert && isNearCapacity && (
            <AlertTriangle className="h-4 w-4 text-[hsl(38,90%,55%)]" />
          )}
        </div>
      </div>
      <div className="relative">
        <Progress value={percentage} className="h-2" />
        <div 
          className={`absolute top-0 left-0 h-2 rounded-full transition-all ${getColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-xs text-muted-foreground text-right">
        {percentage.toFixed(1)}% capacity
      </div>
    </div>
  );
}
