import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CapacityMeter } from "@/components/CapacityMeter";
import { ParkingMonitor } from "@/components/ParkingMonitor";
import { VenueMap } from "@/components/VenueMap";
import { NotificationCard } from "@/components/NotificationCard";
import { DirectionsPanel } from "@/components/DirectionsPanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Ticket, TrendingUp, AlertTriangle, Sparkles, Database, Loader2, Brain, Shield, Car, Zap, CheckCircle2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const recTypeConfig: Record<string, { icon: any; color: string; label: string }> = {
  crowd_flow: { icon: Users, color: "hsl(260 80% 50%)", label: "Crowd Flow" },
  safety: { icon: Shield, color: "hsl(0 80% 55%)", label: "Safety" },
  parking: { icon: Car, color: "hsl(200 80% 50%)", label: "Parking" },
  capacity: { icon: Zap, color: "hsl(38 90% 55%)", label: "Capacity" },
  general: { icon: Brain, color: "hsl(142 70% 45%)", label: "General" },
};

export default function OrganizerDashboard() {
  const [activeZone, setActiveZone] = useState<string>();
  const [simulatedParking, setSimulatedParking] = useState<any[] | null>(null);
  const { toast } = useToast();

  const { data: events, isLoading: eventsLoading } = useQuery<any[]>({
    queryKey: ["/api/events"],
  });

  const activeEvent = events?.find((e: any) => e.status === "active") || events?.[0];

  const { data: stats } = useQuery<any>({
    queryKey: ["/api/events", activeEvent?.id, "stats"],
    enabled: !!activeEvent,
  });

  const { data: zones } = useQuery<any[]>({
    queryKey: ["/api/events", activeEvent?.id, "zones"],
    enabled: !!activeEvent,
  });

  const { data: parking } = useQuery<any[]>({
    queryKey: ["/api/events", activeEvent?.id, "parking"],
    enabled: !!activeEvent,
  });

  const { data: notifs } = useQuery<any[]>({
    queryKey: ["/api/events", activeEvent?.id, "notifications"],
    enabled: !!activeEvent,
  });

  const { data: recommendations } = useQuery<any[]>({
    queryKey: ["/api/events", activeEvent?.id, "recommendations"],
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

  const generateRecsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/events/${activeEvent.id}/recommendations/generate`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "AI Recommendations Generated", description: "New crowd flow recommendations are ready." });
      queryClient.invalidateQueries({ queryKey: ["/api/events", activeEvent?.id, "recommendations"] });
    },
    onError: (error: any) => {
      toast({ title: "Generation Failed", description: error.message, variant: "destructive" });
    },
  });

  const applyRecMutation = useMutation({
    mutationFn: async (recId: number) => {
      const res = await apiRequest("PATCH", `/api/recommendations/${recId}/apply`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", activeEvent?.id, "recommendations"] });
      toast({ title: "Recommendation Applied" });
    },
  });

  const seedMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/seed"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
  });

  const mappedZones = (zones || []).map((z: any) => ({
    id: String(z.id),
    name: z.name,
    x: z.x,
    y: z.y,
    capacity: z.capacity,
    current: z.currentOccupancy || 0,
    type: z.type,
  }));

  const displayParking = simulatedParking || parking || [];
  const mappedParking = displayParking.map((p: any) => ({
    id: String(p.id),
    name: p.name,
    capacity: p.capacity,
    occupied: p.occupied || 0,
    status: p.status,
  }));

  if (eventsLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  if (!activeEvent) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <h2 className="text-xl font-semibold">No Events Yet</h2>
            <p className="text-muted-foreground text-sm">Create demo data to get started.</p>
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

  const ticketStats = stats?.tickets || { total: 0, valid: 0, used: 0, pending: 0 };
  const checkinRate = ticketStats.total > 0 ? ((ticketStats.used / ticketStats.total) * 100).toFixed(1) : "0.0";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-organizer-title">Organizer Dashboard</h1>
          <p className="text-muted-foreground">Real-time event monitoring and analytics</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <h3 className="text-sm font-medium">Total Attendance</h3>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-attendance">{activeEvent.currentAttendance || 0}</div>
            <p className="text-xs text-muted-foreground">of {activeEvent.maxCapacity} capacity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <h3 className="text-sm font-medium">Tickets Sold</h3>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-tickets-sold">{ticketStats.total}</div>
            <p className="text-xs text-muted-foreground">{ticketStats.valid} valid, {ticketStats.used} used</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <h3 className="text-sm font-medium">Check-in Rate</h3>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{checkinRate}%</div>
            <p className="text-xs text-muted-foreground">{ticketStats.used} checked in</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <h3 className="text-sm font-medium">Zones</h3>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(zones || []).length}</div>
            <p className="text-xs text-muted-foreground">venue zones active</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <VenueMap zones={mappedZones} activeZone={activeZone} onZoneClick={setActiveZone} />

          <Card data-testid="ai-recommendations">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-semibold">AI Crowd Flow Recommendations</h3>
                  <p className="text-xs text-muted-foreground">Powered by GPT-5 analysis</p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => generateRecsMutation.mutate()}
                disabled={generateRecsMutation.isPending}
                data-testid="button-generate-recommendations"
              >
                {generateRecsMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-1" />
                )}
                {generateRecsMutation.isPending ? "Analyzing..." : "Generate"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {(recommendations || []).map((rec: any) => {
                const config = recTypeConfig[rec.type] || recTypeConfig.general;
                const IconComp = config.icon;

                return (
                  <div key={rec.id} className={`p-4 rounded-md border transition-all ${rec.applied ? "bg-muted/50 border-muted" : "border-primary/20"}`} data-testid={`recommendation-${rec.id}`}>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: `${config.color}20` }}>
                        <IconComp className="h-4 w-4" style={{ color: config.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs capitalize">{config.label}</Badge>
                            {rec.applied && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3 text-[hsl(142,70%,45%)]" />
                                Applied
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${rec.confidence}%`, backgroundColor: config.color }} />
                            </div>
                            <span className="text-xs text-muted-foreground">{rec.confidence}%</span>
                          </div>
                        </div>
                        <p className="text-sm mt-1">{rec.recommendation}</p>
                        {!rec.applied && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-3"
                            onClick={() => applyRecMutation.mutate(rec.id)}
                            disabled={applyRecMutation.isPending}
                            data-testid={`button-apply-rec-${rec.id}`}
                          >
                            Apply Recommendation
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {(!recommendations || recommendations.length === 0) && (
                <div className="text-center py-8">
                  <Brain className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No recommendations yet. Click "Generate" to get AI-powered crowd flow insights based on current event data.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <DirectionsPanel />
        </div>

        <div className="space-y-6">
          <ParkingMonitor lots={mappedParking} />

          {simulatedParking && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Parking data updates every 5 seconds (live simulation)
              </p>
            </div>
          )}

          <Card>
            <CardHeader>
              <h3 className="font-semibold">Crowd Flow Status</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              {(zones || []).filter((z: any) => z.type !== "entrance").map((z: any) => (
                <CapacityMeter
                  key={z.id}
                  current={z.currentOccupancy || 0}
                  max={z.capacity}
                  label={z.name}
                  showAlert={((z.currentOccupancy || 0) / z.capacity) >= 0.8}
                />
              ))}
              {(!zones || zones.filter((z: any) => z.type !== "entrance").length === 0) && (
                <p className="text-sm text-muted-foreground">No zones configured.</p>
              )}
            </CardContent>
          </Card>

          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Recent Events</h3>
            {(notifs || []).slice(0, 5).map((n: any) => (
              <NotificationCard
                key={n.id}
                type={n.type}
                title={n.title}
                message={n.message}
                timestamp={n.createdAt ? new Date(n.createdAt).toLocaleTimeString() : ""}
              />
            ))}
            {(!notifs || notifs.length === 0) && <p className="text-sm text-muted-foreground">No recent events.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
