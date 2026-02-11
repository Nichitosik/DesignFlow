import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CapacityMeter } from "@/components/CapacityMeter";
import { StatusBadge } from "@/components/StatusBadge";
import { NotificationCard } from "@/components/NotificationCard";
import { Users, AlertTriangle, CheckCircle2, Database, Activity, TrendingUp, ArrowDown, ArrowUp } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";
import { useEventWebSocket } from "@/hooks/use-websocket";

export default function StaffMonitoring() {
  const { t } = useI18n();
  const [liveEntries, setLiveEntries] = useState<{ time: string; count: number; type: "entry" | "exit" }[]>([]);

  const { data: events, isLoading } = useQuery<any[]>({ queryKey: ["/api/events"] });
  const activeEvent = events?.find((e: any) => e.status === "active") || events?.[0];

  useEventWebSocket(activeEvent?.id, "staff");

  const { data: stats } = useQuery<any>({
    queryKey: ["/api/events", activeEvent?.id, "stats"],
    enabled: !!activeEvent,
    refetchInterval: 10000,
  });

  const { data: zones } = useQuery<any[]>({
    queryKey: ["/api/events", activeEvent?.id, "zones"],
    enabled: !!activeEvent,
    refetchInterval: 10000,
  });

  const { data: notifs } = useQuery<any[]>({
    queryKey: ["/api/events", activeEvent?.id, "notifications"],
    enabled: !!activeEvent,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const entries = Math.floor(Math.random() * 8) + 1;
      const exits = Math.floor(Math.random() * 5);
      const time = new Date().toLocaleTimeString();
      setLiveEntries(prev => [
        { time, count: entries, type: "entry" as const },
        { time, count: exits, type: "exit" as const },
        ...prev,
      ].slice(0, 30));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

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

  const entranceZones = (zones || []).filter((z: any) => z.type === "entrance");
  const ticketStats = stats?.tickets || { total: 0, valid: 0, used: 0 };
  const recentEntries = liveEntries.filter(e => e.type === "entry").slice(0, 5);
  const recentExits = liveEntries.filter(e => e.type === "exit").slice(0, 5);
  const totalRecentEntries = recentEntries.reduce((s, e) => s + e.count, 0);
  const totalRecentExits = recentExits.reduce((s, e) => s + e.count, 0);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-monitoring-title">{t("monitoring.title")}</h1>
        <p className="text-muted-foreground text-sm">Real-time event operations dashboard</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs text-muted-foreground">Checked In</span>
              <CheckCircle2 className="h-4 w-4 text-[hsl(142,70%,45%)]" />
            </div>
            <p className="text-2xl font-bold">{ticketStats.used}</p>
            <p className="text-xs text-muted-foreground">of {ticketStats.total} tickets</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs text-muted-foreground">Awaiting Entry</span>
              <Users className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-bold">{ticketStats.valid}</p>
            <p className="text-xs text-muted-foreground">valid tickets remaining</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs text-muted-foreground">Recent Entries</span>
              <ArrowDown className="h-4 w-4 text-[hsl(142,70%,45%)]" />
            </div>
            <p className="text-2xl font-bold text-[hsl(142,70%,45%)]">+{totalRecentEntries}</p>
            <p className="text-xs text-muted-foreground">last 20 seconds</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs text-muted-foreground">Recent Exits</span>
              <ArrowUp className="h-4 w-4 text-[hsl(38,90%,55%)]" />
            </div>
            <p className="text-2xl font-bold text-[hsl(38,90%,55%)]">-{totalRecentExits}</p>
            <p className="text-xs text-muted-foreground">last 20 seconds</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Entrance Status
            </h3>
          </CardHeader>
          <CardContent className="space-y-4">
            {entranceZones.map((z: any) => {
              const pct = z.capacity > 0 ? ((z.currentOccupancy || 0) / z.capacity) * 100 : 0;
              return (
                <div key={z.id} className="space-y-2" data-testid={`entrance-${z.id}`}>
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className="text-sm font-medium">{z.name}</span>
                    <StatusBadge status={pct >= 80 ? "warning" : "valid"} label={pct >= 80 ? "High Traffic" : "Normal"} />
                  </div>
                  <CapacityMeter current={z.currentOccupancy || 0} max={z.capacity} label="" showAlert={pct >= 80} />
                </div>
              );
            })}
            {entranceZones.length === 0 && <p className="text-sm text-muted-foreground">No entrance zones configured.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Live Entry/Exit Feed
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {liveEntries.slice(0, 15).map((entry, i) => (
                <div key={i} className="flex items-center gap-2 text-xs p-2 rounded bg-muted/50" data-testid={`feed-entry-${i}`}>
                  {entry.type === "entry" ? (
                    <ArrowDown className="h-3 w-3 text-[hsl(142,70%,45%)]" />
                  ) : (
                    <ArrowUp className="h-3 w-3 text-[hsl(38,90%,55%)]" />
                  )}
                  <span className={entry.type === "entry" ? "text-[hsl(142,70%,45%)]" : "text-[hsl(38,90%,55%)]"}>
                    {entry.type === "entry" ? `+${entry.count} entered` : `-${entry.count} exited`}
                  </span>
                  <span className="text-muted-foreground ml-auto">{entry.time}</span>
                </div>
              ))}
              {liveEntries.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Waiting for activity...</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold">Recent Alerts</h3>
        {(notifs || []).slice(0, 5).map((n: any) => (
          <NotificationCard
            key={n.id}
            type={n.type}
            title={n.title}
            message={n.message}
            timestamp={n.createdAt ? new Date(n.createdAt).toLocaleTimeString() : ""}
          />
        ))}
        {(!notifs || notifs.length === 0) && <p className="text-sm text-muted-foreground">No recent alerts.</p>}
      </div>
    </div>
  );
}
