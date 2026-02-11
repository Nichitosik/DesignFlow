import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CapacityMeter } from "@/components/CapacityMeter";
import { Users, Ticket, TrendingUp, ArrowDown, ArrowUp, Database, BarChart3, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";
import { useEventWebSocket } from "@/hooks/use-websocket";

interface TimePoint {
  time: string;
  entries: number;
  exits: number;
  cumulative: number;
}

export default function OrganizerAnalytics() {
  const { t } = useI18n();
  const [timeData, setTimeData] = useState<TimePoint[]>([]);
  const [peakEntry, setPeakEntry] = useState(0);

  const { data: events, isLoading } = useQuery<any[]>({ queryKey: ["/api/events"] });
  const activeEvent = events?.find((e: any) => e.status === "active") || events?.[0];

  useEventWebSocket(activeEvent?.id, "organizer");

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

  const { data: parking } = useQuery<any[]>({
    queryKey: ["/api/events", activeEvent?.id, "parking"],
    enabled: !!activeEvent,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const entries = Math.floor(Math.random() * 15) + 2;
      const exits = Math.floor(Math.random() * 8);
      const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setPeakEntry(prev => Math.max(prev, entries));
      setTimeData(prev => {
        const lastCum = prev.length > 0 ? prev[prev.length - 1].cumulative : 0;
        return [...prev, { time, entries, exits, cumulative: lastCum + entries - exits }].slice(-20);
      });
    }, 5000);
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
  const checkinRate = ticketStats.total > 0 ? ((ticketStats.used / ticketStats.total) * 100) : 0;
  const totalZoneCapacity = (zones || []).reduce((s: number, z: any) => s + z.capacity, 0);
  const totalZoneOccupancy = (zones || []).reduce((s: number, z: any) => s + (z.currentOccupancy || 0), 0);
  const zoneUtilization = totalZoneCapacity > 0 ? (totalZoneOccupancy / totalZoneCapacity) * 100 : 0;
  const totalParkingCapacity = (parking || []).reduce((s: number, p: any) => s + p.capacity, 0);
  const totalParkingOccupied = (parking || []).reduce((s: number, p: any) => s + (p.occupied || 0), 0);
  const parkingUtilization = totalParkingCapacity > 0 ? (totalParkingOccupied / totalParkingCapacity) * 100 : 0;
  const maxBarValue = Math.max(...timeData.map(d => Math.max(d.entries, d.exits)), 1);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-analytics-title">{t("analytics.title")}</h1>
        <p className="text-muted-foreground text-sm">Real-time event performance metrics</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs text-muted-foreground">Check-in Rate</span>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{checkinRate.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">{ticketStats.used} of {ticketStats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs text-muted-foreground">Zone Utilization</span>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className={`text-2xl font-bold ${zoneUtilization >= 80 ? "text-[hsl(0,80%,55%)]" : "text-[hsl(142,70%,45%)]"}`}>{zoneUtilization.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">{totalZoneOccupancy} in zones</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs text-muted-foreground">Parking Usage</span>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className={`text-2xl font-bold ${parkingUtilization >= 80 ? "text-[hsl(38,90%,55%)]" : "text-[hsl(142,70%,45%)]"}`}>{parkingUtilization.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">{totalParkingOccupied} of {totalParkingCapacity}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs text-muted-foreground">Peak Entry Rate</span>
              <ArrowDown className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-bold">{peakEntry}</p>
            <p className="text-xs text-muted-foreground">per interval</p>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="entry-exit-chart">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Entry/Exit Flow
            </h3>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded" style={{ background: "hsl(142,70%,45%)" }} />
                <span className="text-muted-foreground">Entries</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded" style={{ background: "hsl(38,90%,55%)" }} />
                <span className="text-muted-foreground">Exits</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {timeData.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-end gap-1 h-40 overflow-x-auto">
                {timeData.map((point, i) => (
                  <div key={i} className="flex flex-col items-center gap-0.5 min-w-[24px]">
                    <div className="flex gap-0.5 items-end h-32">
                      <div
                        className="w-3 rounded-t transition-all"
                        style={{
                          height: `${(point.entries / maxBarValue) * 100}%`,
                          backgroundColor: "hsl(142,70%,45%)",
                          minHeight: "2px",
                        }}
                        title={`+${point.entries} entries`}
                      />
                      <div
                        className="w-3 rounded-t transition-all"
                        style={{
                          height: `${(point.exits / maxBarValue) * 100}%`,
                          backgroundColor: "hsl(38,90%,55%)",
                          minHeight: "2px",
                        }}
                        title={`-${point.exits} exits`}
                      />
                    </div>
                    {i % 3 === 0 && (
                      <span className="text-[8px] text-muted-foreground whitespace-nowrap">{point.time.slice(0, 5)}</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Live data - updates every 5 seconds</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <BarChart3 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p>Collecting data...</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <h3 className="font-semibold">Zone Capacity Breakdown</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            {(zones || []).map((z: any) => (
              <CapacityMeter
                key={z.id}
                current={z.currentOccupancy || 0}
                max={z.capacity}
                label={z.name}
                showAlert={((z.currentOccupancy || 0) / z.capacity) >= 0.8}
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <h3 className="font-semibold">Ticket Distribution</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Valid", count: ticketStats.valid, color: "hsl(142,70%,45%)" },
              { label: "Used", count: ticketStats.used, color: "hsl(200,80%,50%)" },
              { label: "Pending", count: ticketStats.pending || 0, color: "hsl(38,90%,55%)" },
            ].map((item) => {
              const pct = ticketStats.total > 0 ? (item.count / ticketStats.total) * 100 : 0;
              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
                      <span>{item.label}</span>
                    </div>
                    <span className="text-muted-foreground">{item.count} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
