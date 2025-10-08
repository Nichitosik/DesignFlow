import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CapacityMeter } from "./CapacityMeter";
import { Car, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ParkingLot {
  id: string;
  name: string;
  capacity: number;
  occupied: number;
  status: "open" | "closed" | "full";
}

interface ParkingMonitorProps {
  lots: ParkingLot[];
}

export function ParkingMonitor({ lots }: ParkingMonitorProps) {
  const totalCapacity = lots.reduce((sum, lot) => sum + lot.capacity, 0);
  const totalOccupied = lots.reduce((sum, lot) => sum + lot.occupied, 0);
  const availableSpots = totalCapacity - totalOccupied;

  return (
    <Card data-testid="parking-monitor">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <Car className="h-5 w-5" />
          <h3 className="font-semibold">Parking Status</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">{availableSpots}</span>
          <span className="text-sm text-muted-foreground">spots available</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {lots.map((lot) => {
          const percentage = (lot.occupied / lot.capacity) * 100;
          const isNearFull = percentage >= 80;

          return (
            <div key={lot.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{lot.name}</span>
                  {lot.status === "closed" && (
                    <Badge variant="secondary" className="text-xs">Closed</Badge>
                  )}
                  {lot.status === "full" && (
                    <Badge className="bg-[hsl(0,80%,55%)] text-white border-0 text-xs">Full</Badge>
                  )}
                </div>
                {isNearFull && lot.status === "open" && (
                  <AlertTriangle className="h-4 w-4 text-[hsl(38,90%,55%)]" />
                )}
              </div>
              <CapacityMeter
                current={lot.occupied}
                max={lot.capacity}
                label=""
                showAlert={isNearFull}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
