import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ScanLine, CheckCircle2, XCircle, RefreshCw, Clock,
  Camera, CameraOff, AlertCircle, Calendar, ArrowUpCircle, Zap,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { useEventWebSocket } from "@/hooks/use-websocket";
import jsQR from "jsqr";

declare global {
  interface Window { BarcodeDetector?: any; }
}

interface ScanResult {
  status: "valid" | "already_used" | "invalid" | null;
  message: string;
  ticketCode?: string;
  zone?: string;
  seat?: string;
  category?: string;
  ownerName?: string | null;
  ownerEmail?: string | null;
  timestamp?: string;
}

interface LiveAlert {
  type: "upgraded" | "scanned";
  ticketCode: string;
  category?: string;
  time: string;
}

export default function StaffScanner() {
  const { t } = useI18n();
  const [scanCode, setScanCode] = useState("");
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [liveAlerts, setLiveAlerts] = useState<LiveAlert[]>([]);
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const lastScannedRef = useRef<string>("");

  const { data: events, isLoading } = useQuery<any[]>({ queryKey: ["/api/events"] });
  const activeEvent = events?.find((e: any) => e.status === "active") || events?.[0];

  const { data: stats } = useQuery<any>({
    queryKey: ["/api/events", activeEvent?.id, "stats"],
    enabled: !!activeEvent,
    refetchInterval: 5000,
  });

  useEventWebSocket(activeEvent?.id, "staff", (event) => {
    if (event.type === "ticket_upgraded" && event.data?.ticket) {
      const alert: LiveAlert = {
        type: "upgraded",
        ticketCode: event.data.ticket.ticketCode || event.data.ticket.id,
        category: event.data.newCategory || event.data.ticket.category,
        time: new Date().toLocaleTimeString(),
      };
      setLiveAlerts((prev) => [alert, ...prev].slice(0, 5));
      toast({ title: t("scanner.ticketUpgraded"), description: `${alert.ticketCode} → ${alert.category}` });
    } else if (event.type === "ticket_scanned") {
      queryClient.invalidateQueries({ queryKey: ["/api/events", activeEvent?.id, "stats"] });
    }
  });

  // Keep scan mutation ref fresh to avoid stale closures
  const scanMutateRef = useRef<((code: string) => void) | null>(null);
  useEffect(() => { scanMutateRef.current = (code: string) => scanMutation.mutate(code); });

  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) { clearInterval(scanIntervalRef.current); scanIntervalRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }, []);

  const processScannedCode = useCallback((code: string) => {
    if (!code || code === lastScannedRef.current) return;
    lastScannedRef.current = code;
    setTimeout(() => { lastScannedRef.current = ""; }, 3000);
    setScanCode(code);
    stopCamera();
    scanMutateRef.current?.(code);
  }, [stopCamera]);

  // jsQR canvas scan — works on ALL browsers including iOS Safari
  const scanFrameWithJsQR = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return;

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, w, h);
    const imageData = ctx.getImageData(0, 0, w, h);
    const result = jsQR(imageData.data, w, h, { inversionAttempts: "dontInvert" });
    if (result?.data) processScannedCode(result.data);
  }, [processScannedCode]);

  const startCamera = async () => {
    setCameraError(null);
    lastScannedRef.current = "";

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(t("scanner.cameraUnsupported"));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true"); // required for iOS
        await videoRef.current.play();
      }
      setCameraActive(true);

      // Try BarcodeDetector first (faster, native), fall back to jsQR (universal)
      if ("BarcodeDetector" in window) {
        try {
          const detector = new window.BarcodeDetector!({ formats: ["qr_code"] });
          scanIntervalRef.current = window.setInterval(async () => {
            const video = videoRef.current;
            if (!video || video.readyState < 2) return;
            try {
              const barcodes = await detector.detect(video);
              if (barcodes.length > 0) processScannedCode(barcodes[0].rawValue);
            } catch { /* transient error — ignore */ }
          }, 300);
          return;
        } catch { /* BarcodeDetector failed — fall through to jsQR */ }
      }

      // jsQR fallback: works on iOS Safari, Firefox, all browsers
      scanIntervalRef.current = window.setInterval(scanFrameWithJsQR, 300);

    } catch (err: any) {
      const msg = err?.name === "NotAllowedError" ? t("scanner.cameraDenied") : t("scanner.cameraUnsupported");
      setCameraError(msg);
      setCameraActive(false);
    }
  };

  useEffect(() => { return () => { stopCamera(); }; }, [stopCamera]);

  const scanMutation = useMutation({
    mutationFn: async (ticketCode: string) => {
      const res = await apiRequest("POST", "/api/tickets/scan", { ticketCode });
      return res.json();
    },
    onSuccess: (data) => {
      const result: ScanResult = {
        status: "valid",
        message: t("scanner.entryGranted"),
        ticketCode: data.ticketCode,
        zone: data.zone,
        seat: data.seat,
        category: data.category,
        ownerName: data.ownerName,
        ownerEmail: data.ownerEmail,
        timestamp: new Date().toLocaleTimeString(),
      };
      setLastScanResult(result);
      setScanHistory((prev) => [result, ...prev].slice(0, 20));
      toast({ title: t("scanner.validTicket"), description: `${data.ticketCode}` });
      setScanCode("");
      queryClient.invalidateQueries({ queryKey: ["/api/events", activeEvent?.id, "stats"] });
    },
    onError: (error: any) => {
      const errorMsg = error.message || "";
      let status: ScanResult["status"] = "invalid";
      let message = t("scanner.entryDenied");
      if (errorMsg.includes("already used")) {
        status = "already_used";
        message = t("scanner.alreadyUsed");
      }
      const result: ScanResult = { status, message, ticketCode: scanCode, timestamp: new Date().toLocaleTimeString() };
      setLastScanResult(result);
      setScanHistory((prev) => [result, ...prev].slice(0, 20));
      toast({
        title: status === "already_used" ? t("scanner.alreadyScanned") : t("scanner.invalidTicket"),
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleManualScan = () => {
    if (!scanCode.trim()) return;
    scanMutation.mutate(scanCode.trim());
  };

  const getResultIcon = (status: ScanResult["status"]) => {
    switch (status) {
      case "valid": return <CheckCircle2 className="h-5 w-5 text-[hsl(142,70%,45%)]" />;
      case "already_used": return <RefreshCw className="h-5 w-5 text-[hsl(38,90%,55%)]" />;
      case "invalid": return <XCircle className="h-5 w-5 text-[hsl(0,80%,55%)]" />;
      default: return null;
    }
  };

  const getResultBg = (status: ScanResult["status"]) => {
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
            <h2 className="text-lg font-semibold mb-1">{t("scanner.noEvent")}</h2>
            <p className="text-muted-foreground text-sm">{t("scanner.noEventDesc")}</p>
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
        {/* Concert name hidden intentionally — scanner-only mode */}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold" data-testid="text-tickets-scanned">{ticketStats.used}</p>
            <p className="text-xs text-muted-foreground">{t("scanner.scanned")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold" data-testid="text-valid-tickets">{ticketStats.valid}</p>
            <p className="text-xs text-muted-foreground">{t("scanner.valid")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{ticketStats.total}</p>
            <p className="text-xs text-muted-foreground">{t("scanner.total")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Live alerts from spectator ticket changes */}
      {liveAlerts.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Zap className="h-3 w-3 text-[hsl(38,90%,55%)]" />
            {t("scanner.liveUpdate")}
          </h4>
          {liveAlerts.map((alert, i) => (
            <div key={i} className="flex items-center gap-2 text-xs p-2 rounded-md border border-[hsl(38,90%,55%)]/20 bg-[hsl(38,90%,55%)]/5">
              <ArrowUpCircle className="h-3.5 w-3.5 text-[hsl(38,90%,55%)] shrink-0" />
              <span className="font-mono truncate flex-1">{alert.ticketCode}</span>
              {alert.category && <Badge variant="outline" className="text-[10px]">{alert.category}</Badge>}
              <span className="text-muted-foreground whitespace-nowrap">{alert.time}</span>
            </div>
          ))}
        </div>
      )}

      {/* Scan input */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold flex items-center gap-2">
            <ScanLine className="h-5 w-5" />
            {t("scanner.scanTicket")}
          </h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder={t("scanner.enterCode")}
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
              {t("scanner.scan")}
            </Button>
            <Button
              variant="outline"
              onClick={cameraActive ? stopCamera : startCamera}
              data-testid="button-camera-scan"
              title={cameraActive ? t("scanner.stopCamera") : t("scanner.startCamera")}
            >
              {cameraActive ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
            </Button>
          </div>

          {cameraError && (
            <div className="p-3 rounded-md border border-[hsl(0,80%,55%)]/30 bg-[hsl(0,80%,55%)]/5 flex items-start gap-2 text-sm" data-testid="camera-error">
              <AlertCircle className="h-4 w-4 text-[hsl(0,80%,55%)] shrink-0 mt-0.5" />
              <span className="text-muted-foreground">{cameraError}</span>
            </div>
          )}

          {/* Always render video/canvas so refs are non-null when startCamera assigns the stream */}
          <div className={cameraActive ? "space-y-2" : "hidden"} data-testid="camera-scanner-view">
            <div className="relative rounded-md overflow-hidden border bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full max-h-80"
              />
              {/* Hidden canvas used by jsQR for frame decoding */}
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-52 h-52 border-2 border-white/70 rounded-lg">
                  {/* Corner accents */}
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Camera className="h-3 w-3" />
              Îndreaptă camera spre codul QR al spectatorului
            </p>
          </div>

          {/* Last scan result */}
          {lastScanResult && (
            <div
              className={`p-4 rounded-md border ${getResultBg(lastScanResult.status)}`}
              data-testid="scan-result"
            >
              <div className="flex items-start gap-3">
                {getResultIcon(lastScanResult.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-semibold text-sm">
                      {lastScanResult.status === "valid"
                        ? t("scanner.entryGranted")
                        : lastScanResult.status === "already_used"
                        ? t("scanner.alreadyUsed")
                        : t("scanner.entryDenied")}
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
                      {t("scanner.code")}: {lastScanResult.ticketCode}
                    </p>
                  )}
                  {lastScanResult.zone && (
                    <p className="text-xs text-muted-foreground">
                      {t("scanner.zone")}: {lastScanResult.zone}
                      {lastScanResult.category && ` · ${lastScanResult.category}`}
                      {lastScanResult.seat && ` · ${lastScanResult.seat}`}
                    </p>
                  )}
                  {(lastScanResult.ownerName || lastScanResult.ownerEmail) && (
                    <p className="text-xs text-muted-foreground">
                      {t("scanner.owner")}: {lastScanResult.ownerName || lastScanResult.ownerEmail}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Scan history */}
          {scanHistory.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                <h4 className="text-sm font-medium">{t("scanner.scanHistory")}</h4>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setScanHistory([]); setLastScanResult(null); }}
                  data-testid="button-clear-history"
                >
                  {t("scanner.clear")}
                </Button>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {scanHistory.slice(0, 10).map((scan, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-xs p-2 rounded bg-muted/50"
                    data-testid={`scan-history-${i}`}
                  >
                    {getResultIcon(scan.status)}
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
