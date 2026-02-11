import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { ScanLine, CheckCircle2, Database, XCircle, RefreshCw, Clock, Play, RotateCcw, ArrowRight, Ticket } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

interface ScanResult {
  status: "valid" | "already_used" | "invalid" | null;
  message: string;
  ticketCode?: string;
  zone?: string;
  seat?: string;
  timestamp?: string;
}

interface DemoTicket {
  id: string;
  code: string;
  status: "pending" | "valid" | "used" | "invalid";
  zone: string;
  seat: string;
}

export default function StaffScanner() {
  const { t } = useI18n();
  const [scanCode, setScanCode] = useState("");
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [demoTickets, setDemoTickets] = useState<DemoTicket[]>([]);
  const { toast } = useToast();

  const { data: events, isLoading } = useQuery<any[]>({ queryKey: ["/api/events"] });
  const activeEvent = events?.find((e: any) => e.status === "active") || events?.[0];

  const { data: stats } = useQuery<any>({
    queryKey: ["/api/events", activeEvent?.id, "stats"],
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

      const result: ScanResult = { status, message, ticketCode: scanCode, timestamp: new Date().toLocaleTimeString() };
      setLastScanResult(result);
      setScanHistory(prev => [result, ...prev].slice(0, 20));
      toast({ title: status === "already_used" ? "Already Used" : "Invalid Ticket", description: message, variant: "destructive" });
    },
  });

  const seedMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/seed"),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/events"] }); },
  });

  const generateDemoTickets = () => {
    const zones = ["VIP Zone A", "General 1", "General 2"];
    const tickets: DemoTicket[] = [
      { id: "d1", code: `DEMO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`, status: "valid", zone: zones[0], seat: "Row 3, Seat 7" },
      { id: "d2", code: `DEMO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`, status: "valid", zone: zones[1], seat: "Row 12, Seat 22" },
      { id: "d3", code: `DEMO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`, status: "used", zone: zones[2], seat: "Row 8, Seat 15" },
      { id: "d4", code: `DEMO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`, status: "invalid", zone: zones[0], seat: "Row 1, Seat 3" },
    ];
    setDemoTickets(tickets);
    setDemoMode(true);
    toast({ title: "Demo Mode Active", description: "Demo tickets created with different statuses. Try scanning them!" });
  };

  const handleDemoScan = (code: string) => {
    const ticket = demoTickets.find(t => t.code === code);
    if (!ticket) {
      const result: ScanResult = { status: "invalid", message: "No ticket found with this code.", ticketCode: code, timestamp: new Date().toLocaleTimeString() };
      setLastScanResult(result);
      setScanHistory(prev => [result, ...prev].slice(0, 20));
      return;
    }
    if (ticket.status === "used") {
      const result: ScanResult = { status: "already_used", message: "This ticket has already been scanned.", ticketCode: code, zone: ticket.zone, seat: ticket.seat, timestamp: new Date().toLocaleTimeString() };
      setLastScanResult(result);
      setScanHistory(prev => [result, ...prev].slice(0, 20));
      return;
    }
    if (ticket.status === "invalid") {
      const result: ScanResult = { status: "invalid", message: "Ticket is invalid or revoked.", ticketCode: code, timestamp: new Date().toLocaleTimeString() };
      setLastScanResult(result);
      setScanHistory(prev => [result, ...prev].slice(0, 20));
      return;
    }
    setDemoTickets(prev => prev.map(t => t.code === code ? { ...t, status: "used" } : t));
    const result: ScanResult = { status: "valid", message: "Ticket validated successfully. Entry granted.", ticketCode: code, zone: ticket.zone, seat: ticket.seat, timestamp: new Date().toLocaleTimeString() };
    setLastScanResult(result);
    setScanHistory(prev => [result, ...prev].slice(0, 20));
    toast({ title: "Valid Ticket (Demo)", description: `${code} - Entry granted` });
    setScanCode("");
  };

  const handleScan = () => {
    if (!scanCode) return;
    if (demoMode) {
      handleDemoScan(scanCode);
    } else {
      scanMutation.mutate(scanCode);
    }
  };

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

  if (isLoading) return <div className="p-6"><Skeleton className="h-10 w-64" /><Skeleton className="h-64 mt-4" /></div>;

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

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-scanner-title">{t("scanner.title")}</h1>
          <p className="text-muted-foreground text-sm">Scan and validate event tickets</p>
        </div>
        <div className="flex items-center gap-2">
          {demoMode ? (
            <Button variant="outline" size="sm" onClick={() => { setDemoMode(false); setDemoTickets([]); setScanHistory([]); setLastScanResult(null); }} data-testid="button-exit-demo">
              <RotateCcw className="h-4 w-4 mr-1" />
              Exit Demo
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={generateDemoTickets} data-testid="button-demo-mode">
              <Play className="h-4 w-4 mr-1" />
              Demo Mode
            </Button>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold" data-testid="text-tickets-scanned">{ticketStats.used}</p>
            <p className="text-xs text-muted-foreground">Scanned</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold" data-testid="text-valid-tickets">{ticketStats.valid}</p>
            <p className="text-xs text-muted-foreground">Valid</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{ticketStats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
      </div>

      {demoMode && demoTickets.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              Demo Tickets (click code to auto-fill scanner)
            </h3>
          </CardHeader>
          <CardContent className="space-y-2">
            {demoTickets.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-2 p-2 rounded border" data-testid={`demo-ticket-${t.id}`}>
                <button className="font-mono text-sm hover:text-primary transition-colors" onClick={() => setScanCode(t.code)} data-testid={`button-fill-${t.id}`}>
                  {t.code}
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{t.zone}</span>
                  <StatusBadge status={t.status === "used" ? "warning" : t.status === "invalid" ? "invalid" : "valid"} label={t.status} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <h3 className="font-semibold flex items-center gap-2">
            <ScanLine className="h-5 w-5" />
            Scan Ticket
            {demoMode && <Badge variant="outline" className="text-xs">Demo</Badge>}
          </h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter or scan ticket code..."
              value={scanCode}
              onChange={(e) => setScanCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScan()}
              data-testid="input-ticket-code"
            />
            <Button onClick={handleScan} disabled={!scanCode || scanMutation.isPending} data-testid="button-scan-ticket">
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
                       lastScanResult.status === "already_used" ? "Already Used" : "Entry Denied"}
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
    </div>
  );
}
