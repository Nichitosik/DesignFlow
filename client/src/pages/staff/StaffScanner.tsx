import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { ScanLine, CheckCircle2, XCircle, RefreshCw, Clock, Camera, CameraOff, AlertCircle, Calendar } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

declare global {
  interface Window {
    BarcodeDetector?: any;
  }
}

interface ScanResult {
  status: "valid" | "already_used" | "invalid" | null;
  message: string;
  ticketCode?: string;
  zone?: string;
  seat?: string;
  category?: string;
  timestamp?: string;
}

export default function StaffScanner() {
  const { t } = useI18n();
  const [scanCode, setScanCode] = useState("");
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [barcodeDetectorSupported, setBarcodeDetectorSupported] = useState<boolean | null>(null);
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const detectorRef = useRef<any>(null);
  const lastScannedRef = useRef<string>("");

  useEffect(() => {
    setBarcodeDetectorSupported("BarcodeDetector" in window);
  }, []);

  const { data: events, isLoading } = useQuery<any[]>({ queryKey: ["/api/events"] });
  const activeEvent = events?.find((e: any) => e.status === "active") || events?.[0];

  const { data: stats, refetch: refetchStats } = useQuery<any>({
    queryKey: ["/api/events", activeEvent?.id, "stats"],
    enabled: !!activeEvent,
    refetchInterval: 5000,
  });

  const processScannedCode = useCallback((code: string) => {
    if (!code || code === lastScannedRef.current) return;
    lastScannedRef.current = code;
    setTimeout(() => { lastScannedRef.current = ""; }, 3000);
    setScanCode(code);
    stopCamera();
    scanMutation.mutate(code);
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    lastScannedRef.current = "";

    if (!barcodeDetectorSupported) {
      setCameraError("QR scanning is not supported in this browser. Use Chrome on Android or Desktop.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);

      const detector = new window.BarcodeDetector!({ formats: ["qr_code"] });
      detectorRef.current = detector;

      const scan = async () => {
        if (!videoRef.current || !detectorRef.current) return;
        try {
          const barcodes = await detectorRef.current.detect(videoRef.current);
          if (barcodes.length > 0) {
            processScannedCode(barcodes[0].rawValue);
          }
        } catch {}
      };

      scanIntervalRef.current = window.setInterval(scan, 300);
    } catch {
      setCameraError("Camera access denied. Please allow camera permissions in your browser.");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    detectorRef.current = null;
    setCameraActive(false);
  };

  useEffect(() => {
    return () => { stopCamera(); };
  }, []);

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
        category: data.category,
        timestamp: new Date().toLocaleTimeString(),
      };
      setLastScanResult(result);
      setScanHistory(prev => [result, ...prev].slice(0, 20));
      toast({ title: "Valid Ticket", description: `${data.ticketCode} — Entry granted` });
      setScanCode("");
      queryClient.invalidateQueries({ queryKey: ["/api/events", activeEvent?.id, "stats"] });
    },
    onError: (error: any) => {
      const errorMsg = error.message || "";
      let status: ScanResult["status"] = "invalid";
      let message = "Ticket not found in the system. Entry denied.";
      if (errorMsg.includes("already used")) {
        status = "already_used";
        message = "This ticket has already been scanned. Entry denied.";
      } else if (errorMsg.includes("invalid")) {
        message = "Ticket is invalid or has been revoked. Entry denied.";
      } else if (errorMsg.includes("404") || errorMsg.includes("not found")) {
        message = "No ticket found with this code. Verify and try again.";
      }
      const result: ScanResult = { status, message, ticketCode: scanCode, timestamp: new Date().toLocaleTimeString() };
      setLastScanResult(result);
      setScanHistory(prev => [result, ...prev].slice(0, 20));
      toast({
        title: status === "already_used" ? "Already Used" : "Invalid Ticket",
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleManualScan = () => {
    if (!scanCode.trim()) return;
    scanMutation.mutate(scanCode.trim());
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

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-24" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!activeEvent) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Calendar className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <h2 className="text-lg font-semibold mb-1">No Active Events</h2>
            <p className="text-muted-foreground text-sm">
              No events are currently configured. Please ask an organizer to create an event.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const ticketStats = stats?.tickets || { total: 0, valid: 0, used: 0 };

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-scanner-title">{t("scanner.title")}</h1>
        <p className="text-muted-foreground text-sm">{activeEvent.name}</p>
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

      <Card>
        <CardHeader>
          <h3 className="font-semibold flex items-center gap-2">
            <ScanLine className="h-5 w-5" />
            Scan Ticket
          </h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter or scan ticket code..."
              value={scanCode}
              onChange={(e) => setScanCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleManualScan()}
              data-testid="input-ticket-code"
            />
            <Button
              onClick={handleManualScan}
              disabled={!scanCode.trim() || scanMutation.isPending}
              data-testid="button-scan-ticket"
            >
              <ScanLine className="h-4 w-4 mr-2" />
              Scan
            </Button>
            <Button
              variant="outline"
              onClick={cameraActive ? stopCamera : startCamera}
              data-testid="button-camera-scan"
              title={cameraActive ? "Stop camera" : "Scan with camera"}
            >
              {cameraActive ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
            </Button>
          </div>

          {barcodeDetectorSupported === false && (
            <div className="p-3 rounded-md border border-[hsl(38,90%,55%)]/30 bg-[hsl(38,90%,55%)]/5 flex items-start gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-[hsl(38,90%,55%)] shrink-0 mt-0.5" />
              <span className="text-muted-foreground">
                Camera QR scanning requires Chrome on Android or a modern desktop browser. Use manual input instead.
              </span>
            </div>
          )}

          {cameraError && (
            <div className="p-3 rounded-md border border-[hsl(0,80%,55%)]/30 bg-[hsl(0,80%,55%)]/5 flex items-start gap-2 text-sm" data-testid="camera-error">
              <AlertCircle className="h-4 w-4 text-[hsl(0,80%,55%)] shrink-0 mt-0.5" />
              <span className="text-muted-foreground">{cameraError}</span>
            </div>
          )}

          {cameraActive && (
            <div className="space-y-2" data-testid="camera-scanner-view">
              <div className="relative rounded-md overflow-hidden border bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full"
                  style={{ maxHeight: 320 }}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div
                    className="w-48 h-48 border-2 border-white/60 rounded-md"
                    style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.4)" }}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Camera className="h-3 w-3" />
                Point camera at the QR code on the ticket
              </p>
            </div>
          )}

          {lastScanResult && (
            <div
              className={`p-4 rounded-md border ${getScanResultBg(lastScanResult.status)}`}
              data-testid="scan-result"
            >
              <div className="flex items-start gap-3">
                {getScanResultIcon(lastScanResult.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-semibold text-sm">
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
                    <p className="text-xs text-muted-foreground mt-1 font-mono truncate">
                      Code: {lastScanResult.ticketCode}
                    </p>
                  )}
                  {lastScanResult.zone && (
                    <p className="text-xs text-muted-foreground">
                      Zone: {lastScanResult.zone}
                      {lastScanResult.category && ` · ${lastScanResult.category}`}
                      {lastScanResult.seat ? ` · ${lastScanResult.seat}` : ""}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {scanHistory.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                <h4 className="text-sm font-medium">Scan History</h4>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setScanHistory([]); setLastScanResult(null); }}
                  data-testid="button-clear-history"
                >
                  Clear
                </Button>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {scanHistory.slice(0, 10).map((scan, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-xs p-2 rounded bg-muted/50"
                    data-testid={`scan-history-${i}`}
                  >
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
