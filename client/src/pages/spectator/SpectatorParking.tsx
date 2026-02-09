import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Car, Database, AlertTriangle } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";

export default function SpectatorParking() {
  const [simulatedParking, setSimulatedParking] = useState<any[] | null>(null);

  const { data: events, isLoading } = useQuery<any[]>({ queryKey: ["/api/events"] });
  const activeEvent = events?.find((e: any) => e.status === "active") || events?.[0];

  const { data: parking } = useQuery<any[]>({
    queryKey: ["/api/events", activeEvent?.id, "parking"],
    enabled: !!activeEvent,
  });

  const simulateParkingFn = useCallback(() => {
    if (!parking || parking.length === 0) return;
    setSimulatedParking(prev => {
      const base = prev || parking.map((p: any) => ({ ...p }));
      return base.map((lot: any) => {
        const change = Math.floor(Math.random() * 11) - 3;
        const newOccupied = Math.max(0, Math.min(lot.capacity, (lot.occupied || 0) + change));
        const pct = (newOccupied / lot.capacity) * 100;
        let status = lot.status;
        if (pct >= 98) status = "full";
        else if (pct < 98 && status === "full") status = "open";
        return { ...lot, occupied: newOccupied, status };
      });
    });
  }, [parking]);

  useEffect(() => {
    if (parking && parking.length > 0 && !simulatedParking) {
      setSimulatedParking(parking.map((p: any) => ({ ...p })));
    }
  }, [parking, simulatedParking]);

  useEffect(() => {
    const interval = setInterval(simulateParkingFn, 5000);
    return () => clearInterval(interval);
  }, [simulateParkingFn]);

  const seedMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/seed"),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/events"] }); },
  });

  if (isLoading) return <div className="p-6"><Skeleton className="h-64" /></div>;

  if (!activeEvent) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <h2 className="text-xl font-semibold">No Events Yet</h2>
            <p className="text-muted-foreground text-sm">Create demo data to see parking info.</p>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending} data-testid="button-seed-data">
              <Database className="h-4 w-4 mr-2" />
              {seedMutation.isPending ? "Creating..." : "Create Demo Event"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayParking = simulatedParking || parking || [];
  const totalCapacity = displayParking.reduce((sum: number, p: any) => sum + p.capacity, 0);
  const totalOccupied = displayParking.reduce((sum: number, p: any) => sum + (p.occupied || 0), 0);
  const totalAvailable = totalCapacity - totalOccupied;
  const totalPct = totalCapacity > 0 ? (totalOccupied / totalCapacity) * 100 : 0;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-parking-title">Parking Availability</h1>
        <p className="text-muted-foreground text-sm">Live parking status for {activeEvent.name}</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-[hsl(142,70%,45%)]" data-testid="text-parking-available">{totalAvailable}</p>
            <p className="text-sm text-muted-foreground">Spots Available</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{totalOccupied}</p>
            <p className="text-sm text-muted-foreground">Spots Occupied</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className={`text-3xl font-bold ${totalPct >= 90 ? "text-[hsl(0,80%,55%)]" : totalPct >= 70 ? "text-[hsl(38,90%,55%)]" : "text-[hsl(142,70%,45%)]"}`}>
              {totalPct.toFixed(0)}%
            </p>
            <p className="text-sm text-muted-foreground">Utilization</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {displayParking.map((lot: any) => {
          const pct = lot.capacity > 0 ? ((lot.occupied || 0) / lot.capacity) * 100 : 0;
          const available = lot.capacity - (lot.occupied || 0);
          const color = pct >= 90 ? "hsl(0,80%,55%)" : pct >= 70 ? "hsl(38,90%,55%)" : "hsl(142,70%,45%)";

          return (
            <Card key={lot.id} data-testid={`parking-lot-${lot.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Car className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{lot.name}</span>
                    {lot.status === "full" && <Badge className="bg-[hsl(0,80%,55%)] text-white border-0 text-xs">Full</Badge>}
                    {lot.status === "closed" && <Badge variant="secondary" className="text-xs">Closed</Badge>}
                  </div>
                  <div className="flex items-center gap-2">
                    {pct >= 80 && lot.status === "open" && <AlertTriangle className="h-4 w-4 text-[hsl(38,90%,55%)]" />}
                    <span className="text-sm font-semibold" style={{ color }}>{available} free</span>
                  </div>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span>{lot.occupied || 0} occupied</span>
                  <span>{lot.capacity} total capacity</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Parking data updates every 5 seconds (live simulation)
      </p>
    </div>
  );
}
