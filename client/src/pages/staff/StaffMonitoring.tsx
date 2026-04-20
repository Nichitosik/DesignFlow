import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CapacityMeter } from "@/components/CapacityMeter";
import { StatusBadge } from "@/components/StatusBadge";
import { NotificationCard } from "@/components/NotificationCard";
import { Users, CheckCircle2, Database, Activity, TrendingUp, ArrowDown, ArrowUp, CalendarDays } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";
import { useEventWebSocket } from "@/hooks/use-websocket";

export default function StaffMonitoring() {
  const { t } = useI18n();
  const [liveEntries, setLiveEntries] = useState<{ time: string; count: number; type: "entry" | "exit" }[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  const { data: events, isLoading } = useQuery<any[]>({ queryKey: ["/api/events"] });

  // Auto-select first active event on load
  useEffect(() => {
    if (!events || selectedEventId !== null) return;
    const active = events.find((e: any) => e.status === "active") || events[0];
    if (active) setSelectedEventId(active.id);
  }, [events, selectedEventId]);

  const activeEvent = events?.find((e: any) => e.id === selectedEventId);

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

  // Reset feed when switching events
  useEffect(() => {
    setLiveEntries([]);
  }, [selectedEventId]);

  useEffect(() => {
    if (!activeEvent) return;
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
  }, [activeEvent]);

  const seedMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/seed"),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/events"] }); },
  });

  if (isLoading) return <div className="p-6"><Skeleton className="h-64" /></div>;

  if (!events || events.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <h2 className="text-xl font-semibold">Niciun eveniment</h2>
            <p className="text-muted-foreground text-sm">Creați un eveniment pentru a începe monitorizarea.</p>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending} data-testid="button-seed-data">
              <Database className="h-4 w-4 mr-2" />
              {seedMutation.isPending ? "Se creează..." : "Creare Eveniment Demo"}
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
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-monitoring-title">{t("monitoring.title")}</h1>
          <p className="text-muted-foreground text-sm">Panou de operațiuni în timp real</p>
        </div>

        {/* Event selector */}
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select
            value={selectedEventId?.toString() ?? ""}
            onValueChange={(val) => setSelectedEventId(Number(val))}
          >
            <SelectTrigger className="w-56" data-testid="select-monitoring-event">
              <SelectValue placeholder="Alege evenimentul..." />
            </SelectTrigger>
            <SelectContent>
              {events.map((ev: any) => (
                <SelectItem key={ev.id} value={ev.id.toString()}>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        ev.status === "active" ? "bg-green-500" :
                        ev.status === "completed" ? "bg-blue-500" :
                        ev.status === "cancelled" ? "bg-red-500" : "bg-gray-400"
                      }`}
                    />
                    <span className="truncate">{ev.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active event info */}
      {activeEvent && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border bg-muted/40 text-sm">
          <Badge className={
            activeEvent.status === "active" ? "bg-green-500 text-white border-0" :
            activeEvent.status === "completed" ? "bg-blue-500 text-white border-0" :
            "bg-muted text-muted-foreground"
          }>
            {activeEvent.status === "active" ? "Activ" :
             activeEvent.status === "completed" ? "Finalizat" :
             activeEvent.status === "draft" ? "Ciornă" : "Anulat"}
          </Badge>
          <span className="font-medium">{activeEvent.name}</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{activeEvent.venue}</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{new Date(activeEvent.date).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" })}</span>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs text-muted-foreground">Check-in efectuat</span>
              <CheckCircle2 className="h-4 w-4 text-[hsl(142,70%,45%)]" />
            </div>
            <p className="text-2xl font-bold">{ticketStats.used}</p>
            <p className="text-xs text-muted-foreground">din {ticketStats.total} bilete</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs text-muted-foreground">Așteaptă intrarea</span>
              <Users className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-bold">{ticketStats.valid}</p>
            <p className="text-xs text-muted-foreground">bilete valide rămase</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs text-muted-foreground">Intrări recente</span>
              <ArrowDown className="h-4 w-4 text-[hsl(142,70%,45%)]" />
            </div>
            <p className="text-2xl font-bold text-[hsl(142,70%,45%)]">+{totalRecentEntries}</p>
            <p className="text-xs text-muted-foreground">ultimele 20 secunde</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs text-muted-foreground">Ieșiri recente</span>
              <ArrowUp className="h-4 w-4 text-[hsl(38,90%,55%)]" />
            </div>
            <p className="text-2xl font-bold text-[hsl(38,90%,55%)]">-{totalRecentExits}</p>
            <p className="text-xs text-muted-foreground">ultimele 20 secunde</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Status intrări
            </h3>
          </CardHeader>
          <CardContent className="space-y-4">
            {entranceZones.map((z: any) => {
              const pct = z.capacity > 0 ? ((z.currentOccupancy || 0) / z.capacity) * 100 : 0;
              return (
                <div key={z.id} className="space-y-2" data-testid={`entrance-${z.id}`}>
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className="text-sm font-medium">{z.name}</span>
                    <StatusBadge status={pct >= 80 ? "warning" : "valid"} label={pct >= 80 ? "Trafic ridicat" : "Normal"} />
                  </div>
                  <CapacityMeter current={z.currentOccupancy || 0} max={z.capacity} label="" showAlert={pct >= 80} />
                </div>
              );
            })}
            {entranceZones.length === 0 && <p className="text-sm text-muted-foreground">Nicio zonă de intrare configurată.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Flux intrări / ieșiri live
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
                    {entry.type === "entry" ? `+${entry.count} intrat` : `-${entry.count} ieșit`}
                  </span>
                  <span className="text-muted-foreground ml-auto">{entry.time}</span>
                </div>
              ))}
              {liveEntries.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Se așteaptă activitate...</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold">Alerte recente</h3>
        {(notifs || []).slice(0, 5).map((n: any) => (
          <NotificationCard
            key={n.id}
            type={n.type}
            title={n.title}
            message={n.message}
            timestamp={n.createdAt ? new Date(n.createdAt).toLocaleTimeString() : ""}
          />
        ))}
        {(!notifs || notifs.length === 0) && <p className="text-sm text-muted-foreground">Nicio alertă recentă.</p>}
      </div>
    </div>
  );
}
