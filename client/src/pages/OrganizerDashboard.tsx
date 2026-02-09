import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CapacityMeter } from "@/components/CapacityMeter";
import { ParkingMonitor } from "@/components/ParkingMonitor";
import { VenueMap } from "@/components/VenueMap";
import { NotificationCard } from "@/components/NotificationCard";
import { Button } from "@/components/ui/button";
import { Users, Ticket, TrendingUp, AlertTriangle, Sparkles, Database, Loader2 } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function OrganizerDashboard() {
  const [activeZone, setActiveZone] = useState<string>();
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

  const mappedParking = (parking || []).map((p: any) => ({
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <h3 className="font-semibold">AI Flow Recommendations</h3>
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
                {generateRecsMutation.isPending ? "Generating..." : "Generate"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {(recommendations || []).map((rec: any) => (
                <div key={rec.id} className={`p-4 rounded-md ${rec.applied ? "bg-muted" : "bg-primary/5 border border-primary/20"}`}>
                  <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                    <p className="text-sm font-medium">{rec.type}</p>
                    <span className="text-xs text-muted-foreground">{rec.confidence}% confidence</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{rec.recommendation}</p>
                  {!rec.applied && (
                    <Button
                      size="sm"
                      onClick={() => applyRecMutation.mutate(rec.id)}
                      disabled={applyRecMutation.isPending}
                      data-testid={`button-apply-rec-${rec.id}`}
                    >
                      Apply Recommendation
                    </Button>
                  )}
                  {rec.applied && <span className="text-xs text-muted-foreground">Applied</span>}
                </div>
              ))}
              {(!recommendations || recommendations.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recommendations yet. Click "Generate" to get AI-powered insights.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <ParkingMonitor lots={mappedParking} />

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
