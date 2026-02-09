import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CapacityMeter } from "@/components/CapacityMeter";
import { StatusBadge } from "@/components/StatusBadge";
import { NotificationCard } from "@/components/NotificationCard";
import { VenueMap } from "@/components/VenueMap";
import { ScanLine, Users, AlertTriangle, CheckCircle2, Database, XCircle, RefreshCw, Clock } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface ScanResult {
  status: "valid" | "already_used" | "invalid" | null;
  message: string;
  ticketCode?: string;
  zone?: string;
  seat?: string;
  timestamp?: string;
}

export default function StaffDashboard() {
  const [activeZone, setActiveZone] = useState<string>();
  const [scanCode, setScanCode] = useState("");
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
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

  const { data: notifs } = useQuery<any[]>({
    queryKey: ["/api/events", activeEvent?.id, "notifications"],
    enabled: !!activeEvent,
  });

  const scanMutation = useMutation({
    mutationFn: async (ticketCode: string) => {
      const res = await apiRequest("POST", "/api/tickets/scan", { ticketCode });
      return res.json();
    },
    onSuccess: (data) => {
      const result: ScanResult = {
        status: "valid",
        message: "Ticket validated successfully. Entry granted.",
        ticketCode: data.ticketCode,
        zone: data.zone,
        seat: data.seat,
        timestamp: new Date().toLocaleTimeString(),
      };
      setLastScanResult(result);
      setScanHistory(prev => [result, ...prev].slice(0, 20));
      toast({ title: "Valid Ticket", description: `${data.ticketCode} - Entry granted` });
      setScanCode("");
      queryClient.invalidateQueries({ queryKey: ["/api/events", activeEvent?.id, "stats"] });
    },
    onError: (error: any) => {
      const errorMsg = error.message || "Unknown error";
      let status: ScanResult["status"] = "invalid";
      let message = "Ticket not found in the system. Entry denied.";

      if (errorMsg.includes("already used")) {
        status = "already_used";
        message = "This ticket has already been scanned. Entry denied - possible duplicate.";
      } else if (errorMsg.includes("invalid")) {
        status = "invalid";
        message = "Ticket is invalid or has been revoked. Entry denied.";
      } else if (errorMsg.includes("404") || errorMsg.includes("not found")) {
        status = "invalid";
        message = "No ticket found with this code. Verify the code and try again.";
      }

      const result: ScanResult = {
        status,
        message,
        ticketCode: scanCode,
        timestamp: new Date().toLocaleTimeString(),
      };
      setLastScanResult(result);
      setScanHistory(prev => [result, ...prev].slice(0, 20));
      toast({ title: status === "already_used" ? "Already Used" : "Invalid Ticket", description: message, variant: "destructive" });
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

  const entranceZones = (zones || []).filter((z: any) => z.type === "entrance");

  if (eventsLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid md:grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
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

  const ticketStats = stats?.tickets || { total: 0, valid: 0, used: 0 };

  const getScanResultIcon = (status: ScanResult["status"]) => {
    switch (status) {
      case "valid": return <CheckCircle2 className="h-5 w-5 text-[hsl(142,70%,45%)]" />;
      case "already_used": return <RefreshCw className="h-5 w-5 text-[hsl(38,90%,55%)]" />;
      case "invalid": return <XCircle className="h-5 w-5 text-[hsl(0,80%,55%)]" />;
      default: return null;
    }
  };

  const getScanResultBg = (status: ScanResult["status"]) => {
    switch (status) {
      case "valid": return "border-[hsl(142,70%,45%)]/30 bg-[hsl(142,70%,45%)]/5";
      case "already_used": return "border-[hsl(38,90%,55%)]/30 bg-[hsl(38,90%,55%)]/5";
      case "invalid": return "border-[hsl(0,80%,55%)]/30 bg-[hsl(0,80%,55%)]/5";
      default: return "";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-staff-title">Staff Dashboard</h1>
        <p className="text-muted-foreground">Monitor event operations and assist spectators</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <h3 className="text-sm font-medium">Tickets Scanned</h3>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-tickets-scanned">{ticketStats.used}</div>
            <p className="text-xs text-muted-foreground">of {ticketStats.total} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <h3 className="text-sm font-medium">Active Entrances</h3>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{entranceZones.length}</div>
            <p className="text-xs text-muted-foreground">entrance zones active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <h3 className="text-sm font-medium">Valid Tickets</h3>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-valid-tickets">{ticketStats.valid}</div>
            <p className="text-xs text-muted-foreground">awaiting check-in</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="font-semibold flex items-center gap-2">
                <ScanLine className="h-5 w-5" />
                Ticket Scanner
              </h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter or scan ticket code..."
                  value={scanCode}
                  onChange={(e) => setScanCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && scanCode && scanMutation.mutate(scanCode)}
                  data-testid="input-ticket-code"
                />
                <Button
                  onClick={() => scanCode && scanMutation.mutate(scanCode)}
                  disabled={!scanCode || scanMutation.isPending}
                  data-testid="button-scan-ticket"
                >
                  <ScanLine className="h-4 w-4 mr-2" />
                  Scan
                </Button>
              </div>

              {lastScanResult && (
                <div className={`p-4 rounded-md border ${getScanResultBg(lastScanResult.status)}`} data-testid="scan-result">
                  <div className="flex items-start gap-3">
                    {getScanResultIcon(lastScanResult.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-semibold text-sm capitalize">
                          {lastScanResult.status === "valid" ? "Entry Granted" :
                           lastScanResult.status === "already_used" ? "Already Used" :
                           "Entry Denied"}
                        </span>
                        {lastScanResult.timestamp && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {lastScanResult.timestamp}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{lastScanResult.message}</p>
                      {lastScanResult.ticketCode && (
                        <p className="text-xs text-muted-foreground mt-1 font-mono truncate">Code: {lastScanResult.ticketCode}</p>
                      )}
                      {lastScanResult.zone && (
                        <p className="text-xs text-muted-foreground">Zone: {lastScanResult.zone} {lastScanResult.seat ? `- ${lastScanResult.seat}` : ""}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {scanHistory.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                    <h4 className="text-sm font-medium">Scan History</h4>
                    <Button size="sm" variant="ghost" onClick={() => { setScanHistory([]); setLastScanResult(null); }} data-testid="button-clear-history">
                      Clear
                    </Button>
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {scanHistory.slice(0, 10).map((scan, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs p-2 rounded bg-muted/50" data-testid={`scan-history-${i}`}>
                        {getScanResultIcon(scan.status)}
                        <span className="font-mono truncate flex-1 min-w-0">{scan.ticketCode}</span>
                        <span className="text-muted-foreground whitespace-nowrap">{scan.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="font-semibold">Entrance Status</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              {entranceZones.map((z: any) => {
                const pct = z.capacity > 0 ? ((z.currentOccupancy || 0) / z.capacity) * 100 : 0;
                return (
                  <div key={z.id} className="space-y-2">
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
        </div>

        <div className="space-y-6">
          <VenueMap zones={mappedZones} activeZone={activeZone} onZoneClick={setActiveZone} />

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
      </div>
    </div>
  );
}
