import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ParkingMonitor } from "@/components/ParkingMonitor";
import { Car, Database, AlertTriangle, TrendingUp } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";

export default function OrganizerParking() {
  const { t } = useI18n();
  const [simulatedParking, setSimulatedParking] = useState<any[] | null>(null);

  const { data: events, isLoading } = useQuery<any[]>({ queryKey: ["/api/events"] });
  const activeEvent = events?.find((e: any) => e.status === "active") || events?.[0];

  const { data: parking } = useQuery<any[]>({
    queryKey: ["/api/events", activeEvent?.id, "parking"],
    enabled: !!activeEvent,
  });

  const simulateParking = useCallback(() => {
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
    const interval = setInterval(simulateParking, 5000);
    return () => clearInterval(interval);
  }, [simulateParking]);

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
  const mappedParking = displayParking.map((p: any) => ({
    id: String(p.id),
    name: p.name,
    capacity: p.capacity,
    occupied: p.occupied || 0,
    status: p.status,
  }));

  const totalCapacity = displayParking.reduce((s: number, p: any) => s + p.capacity, 0);
  const totalOccupied = displayParking.reduce((s: number, p: any) => s + (p.occupied || 0), 0);
  const totalPct = totalCapacity > 0 ? (totalOccupied / totalCapacity) * 100 : 0;
  const fullLots = displayParking.filter((p: any) => p.status === "full").length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-org-parking-title">{t("parking.title")}</h1>
        <p className="text-muted-foreground text-sm">Live parking capacity monitoring</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs text-muted-foreground">Total Utilization</span>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className={`text-2xl font-bold ${totalPct >= 90 ? "text-[hsl(0,80%,55%)]" : totalPct >= 70 ? "text-[hsl(38,90%,55%)]" : "text-[hsl(142,70%,45%)]"}`}>
              {totalPct.toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground">{totalOccupied} of {totalCapacity} spots</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs text-muted-foreground">Available Spots</span>
              <Car className="h-4 w-4 text-[hsl(142,70%,45%)]" />
            </div>
            <p className="text-2xl font-bold text-[hsl(142,70%,45%)]">{totalCapacity - totalOccupied}</p>
            <p className="text-xs text-muted-foreground">across all lots</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs text-muted-foreground">Full Lots</span>
              <AlertTriangle className="h-4 w-4 text-[hsl(38,90%,55%)]" />
            </div>
            <p className="text-2xl font-bold">{fullLots}</p>
            <p className="text-xs text-muted-foreground">of {displayParking.length} total</p>
          </CardContent>
        </Card>
      </div>

      <ParkingMonitor lots={mappedParking} />

      <p className="text-xs text-center text-muted-foreground">
        Parking data updates every 5 seconds (live simulation)
      </p>
    </div>
  );
}
