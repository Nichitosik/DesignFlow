import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NotificationCard } from "@/components/NotificationCard";
import { Users, Ticket, TrendingUp, AlertTriangle, Database } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrganizerOverview() {
  const { data: events, isLoading } = useQuery<any[]>({ queryKey: ["/api/events"] });
  const activeEvent = events?.find((e: any) => e.status === "active") || events?.[0];

  const { data: stats } = useQuery<any>({
    queryKey: ["/api/events", activeEvent?.id, "stats"],
    enabled: !!activeEvent,
    refetchInterval: 10000,
  });

  const { data: zones } = useQuery<any[]>({
    queryKey: ["/api/events", activeEvent?.id, "zones"],
    enabled: !!activeEvent,
  });

  const { data: notifs } = useQuery<any[]>({
    queryKey: ["/api/events", activeEvent?.id, "notifications"],
    enabled: !!activeEvent,
  });

  const seedMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/seed"),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/events"] }); },
  });

  if (isLoading) {
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
  const capacityPct = activeEvent.maxCapacity > 0 ? (((activeEvent.currentAttendance || 0) / activeEvent.maxCapacity) * 100).toFixed(0) : "0";

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-organizer-title">Overview</h1>
        <p className="text-muted-foreground text-sm">{activeEvent.name} - Real-time event monitoring</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <h3 className="text-sm font-medium">Total Attendance</h3>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-attendance">{activeEvent.currentAttendance || 0}</div>
            <p className="text-xs text-muted-foreground">{capacityPct}% of {activeEvent.maxCapacity} capacity</p>
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
            <h3 className="text-sm font-medium">Active Zones</h3>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(zones || []).length}</div>
            <p className="text-xs text-muted-foreground">venue zones configured</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <h3 className="font-semibold">Zone Capacity Overview</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            {(zones || []).map((z: any) => {
              const pct = z.capacity > 0 ? ((z.currentOccupancy || 0) / z.capacity) * 100 : 0;
              const color = pct >= 90 ? "hsl(0,80%,55%)" : pct >= 70 ? "hsl(38,90%,55%)" : "hsl(142,70%,45%)";
              return (
                <div key={z.id} className="space-y-1" data-testid={`zone-capacity-${z.id}`}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{z.name}</span>
                    <span className="text-muted-foreground">{z.currentOccupancy || 0}/{z.capacity}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }} />
                  </div>
                </div>
              );
            })}
            {(!zones || zones.length === 0) && <p className="text-sm text-muted-foreground">No zones configured.</p>}
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h3 className="font-semibold">Recent Events</h3>
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
  );
}
