import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Ticket, QrCode, ArrowUpCircle, X, Download, Check,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useEventWebSocket } from "@/hooks/use-websocket";
import { useI18n } from "@/lib/i18n";

interface TicketAvailability {
  id: number;
  name: string;
  price: number;
  capacity: number;
  sold: number;
  available: number;
  color: string;
}

const STATUS_BADGE: Record<string, string> = {
  valid: "border-[hsl(142,70%,45%)] text-[hsl(142,70%,45%)]",
  used: "border-[hsl(38,90%,55%)] text-[hsl(38,90%,55%)]",
  invalid: "border-[hsl(0,80%,55%)] text-[hsl(0,80%,55%)]",
  pending: "",
};

function parseRowSeat(seat?: string): { row: string; num: string } {
  if (!seat) return { row: "—", num: "—" };
  const m = seat.match(/Row\s*(\w+),\s*Seat\s*(\d+)/i);
  if (m) return { row: m[1], num: m[2] };
  return { row: "—", num: seat };
}

function downloadTicket(ticket: any, eventName: string) {
  const w = window.open("", "_blank");
  if (!w) return;
  const { row, num } = parseRowSeat(ticket.seat);
  w.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Ticket — ${eventName}</title>
      <meta charset="utf-8" />
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; max-width: 480px; margin: auto; }
        .header { font-size: 22px; font-weight: bold; margin-bottom: 4px; }
        .sub { color: #666; font-size: 14px; margin-bottom: 24px; }
        .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; font-size: 14px; }
        .label { color: #888; }
        .value { font-weight: 600; }
        .code { font-family: monospace; font-size: 13px; letter-spacing: 1px; }
        .status { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 12px; border: 1px solid #4ade80; color: #16a34a; }
        @media print { button { display: none; } }
      </style>
    </head>
    <body>
      <div class="header">${eventName}</div>
      <div class="sub">${ticket.zone || ""}</div>
      <div class="row"><span class="label">Ticket</span><span class="value code">${ticket.ticketCode}</span></div>
      <div class="row"><span class="label">Zone</span><span class="value">${ticket.zone || "—"}</span></div>
      <div class="row"><span class="label">Row</span><span class="value">${row}</span></div>
      <div class="row"><span class="label">Seat</span><span class="value">${num}</span></div>
      <div class="row"><span class="label">Category</span><span class="value">${ticket.category || "Main"}</span></div>
      <div class="row"><span class="label">Price</span><span class="value">${(ticket.price || 0).toFixed(2)} MDL</span></div>
      <div class="row"><span class="label">Status</span><span class="status">${ticket.status?.toUpperCase()}</span></div>
      <br/>
      <button onclick="window.print()">🖨 Print / Save as PDF</button>
    </body>
    </html>
  `);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
}

function EventOrderGroup({
  eventId, event, tickets, activeEventId, availability, onShowQr, onUpgrade,
}: {
  eventId: string;
  event: any;
  tickets: any[];
  activeEventId?: number;
  availability?: TicketAvailability[];
  onShowQr: (ticket: any) => void;
  onUpgrade: (ticket: any) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  const eventTotal = tickets.reduce((s, tk) => s + (tk.price || 0), 0);
  const transactionNum = tickets[0]?.ticketCode?.split("-")[0] || eventId;
  // Sort tickets by purchase date (newest first within group)
  const sortedTickets = [...tickets].sort((a, b) =>
    new Date(b.purchasedAt || 0).getTime() - new Date(a.purchasedAt || 0).getTime()
  );

  return (
    <div className="border rounded-xl overflow-hidden bg-card">
      {/* Event header */}
      <div className="flex items-center gap-4 p-4 border-b">
        {event?.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.name}
            className="w-20 h-16 object-cover rounded-lg shrink-0"
          />
        ) : (
          <div className="w-20 h-16 bg-muted rounded-lg shrink-0 flex items-center justify-center">
            <Ticket className="h-6 w-6 text-muted-foreground/40" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-base leading-tight truncate">{event?.name || `Eveniment #${eventId}`}</p>
          <p className="text-sm text-muted-foreground">{event?.venue || ""}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Metodă de plată: Card</p>
        </div>
      </div>

      {/* Transaction summary row — clickable to toggle */}
      <button
        type="button"
        className="w-full flex items-center gap-6 px-4 py-3 border-b bg-muted/20 hover:bg-muted/30 transition-colors text-left flex-wrap"
        onClick={() => setExpanded((v) => !v)}
      >
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Număr tranzacție</p>
          <p className="font-bold text-base font-mono">{transactionNum}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Bilete</p>
          <p className="font-bold text-base">{tickets.length}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total, MDL</p>
          <div className="flex items-center gap-1.5">
            <p className="font-bold text-base">{eventTotal.toFixed(2)}</p>
            <Check className="h-4 w-4 text-[hsl(142,70%,45%)]" />
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              sortedTickets.forEach((tk) => downloadTicket(tk, event?.name || "Event"));
            }}
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Descarcă
          </Button>
          {expanded
            ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
            : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
        </div>
      </button>

      {/* Expandable tickets table */}
      {expanded && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/10">
                <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">Zonă</th>
                <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">Rând</th>
                <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">Loc</th>
                <th className="text-right px-4 py-2 text-xs text-muted-foreground font-medium">Preț, MDL</th>
                <th className="text-right px-4 py-2 text-xs text-muted-foreground font-medium">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {sortedTickets.map((ticket, idx) => {
                const { row, num } = parseRowSeat(ticket.seat);
                return (
                  <tr
                    key={ticket.id}
                    className={`border-b last:border-0 ${idx % 2 === 0 ? "" : "bg-muted/10"}`}
                    data-testid={`ticket-card-${ticket.id}`}
                  >
                    <td className="px-4 py-3 font-medium" data-testid={`ticket-category-${ticket.id}`}>
                      {ticket.category || ticket.zone}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{row}</td>
                    <td className="px-4 py-3 font-mono text-xs">{num}</td>
                    <td className="px-4 py-3 font-medium text-right" data-testid={`ticket-price-${ticket.id}`}>
                      {(ticket.price || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => onShowQr(ticket)}
                          data-testid={`button-show-qr-${ticket.id}`}
                          title="Arată QR"
                        >
                          <QrCode className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => downloadTicket(ticket, event?.name || "Event")}
                          title="Descarcă biletul"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        {(ticket.status === "valid" || ticket.status === "pending") &&
                          availability && availability.length > 0 &&
                          ticket.eventId === activeEventId && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => onUpgrade(ticket)}
                              data-testid={`button-upgrade-${ticket.id}`}
                              title="Upgrade bilet"
                            >
                              <ArrowUpCircle className="h-3.5 w-3.5" />
                            </Button>
                          )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function SpectatorTickets() {
  const { t } = useI18n();
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [qrDialogTicket, setQrDialogTicket] = useState<any | null>(null);
  const { toast } = useToast();

  const { data: events, isLoading: eventsLoading } = useQuery<any[]>({ queryKey: ["/api/events"] });
  const activeEvent = events?.find((e: any) => e.status === "active") || events?.[0];

  useEventWebSocket(activeEvent?.id, "spectator");

  const { data: myTickets, isLoading: ticketsLoading } = useQuery<any[]>({ queryKey: ["/api/tickets/my"] });

  const { data: availability } = useQuery<TicketAvailability[]>({
    queryKey: ["/api/events", activeEvent?.id, "ticket-availability"],
    queryFn: () => fetch(`/api/events/${activeEvent?.id}/ticket-availability`).then((r) => r.json()),
    enabled: !!activeEvent?.id,
    refetchInterval: 10000,
  });

  const upgradeMutation = useMutation({
    mutationFn: ({ ticketId, newCategory }: { ticketId: number; newCategory: string }) =>
      apiRequest("POST", `/api/tickets/${ticketId}/upgrade`, { newCategory }),
    onSuccess: async (res) => {
      const data = await res.json();
      const diff = data.priceDifference;
      queryClient.invalidateQueries({ queryKey: ["/api/tickets/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events", activeEvent?.id, "ticket-availability"] });
      setUpgradeDialogOpen(false);
      toast({ title: t("tickets.upgraded"), description: `${selectedCategory}${diff > 0 ? ` +${diff.toFixed(0)} MDL` : ""}` });
    },
    onError: () => {
      toast({ title: t("tickets.upgradeFailed"), description: t("tickets.upgradeFailedDesc"), variant: "destructive" });
    },
  });

  const getUpgradePriceDiff = () => {
    if (!selectedTicket || !selectedCategory || !availability) return 0;
    const cur = availability.find((a) => a.name === selectedTicket.category);
    const nw = availability.find((a) => a.name === selectedCategory);
    return cur && nw ? nw.price - cur.price : 0;
  };

  // Group tickets by event, sorted by earliest purchasedAt in the group (newest group first)
  const ticketsByEvent: Record<number, { event: any; tickets: any[] }> = (myTickets || []).reduce((acc: any, ticket: any) => {
    const ev = events?.find((e: any) => e.id === ticket.eventId);
    if (!acc[ticket.eventId]) acc[ticket.eventId] = { event: ev, tickets: [] };
    acc[ticket.eventId].tickets.push(ticket);
    return acc;
  }, {});

  // Sort event groups by the most recent purchase in each group
  const sortedEventGroups = Object.entries(ticketsByEvent).sort(([, a], [, b]) => {
    const latestA = Math.max(...(a as any).tickets.map((t: any) => new Date(t.purchasedAt || 0).getTime()));
    const latestB = Math.max(...(b as any).tickets.map((t: any) => new Date(t.purchasedAt || 0).getTime()));
    return latestB - latestA;
  });

  if (eventsLoading || ticketsLoading) {
    return (
      <div className="p-6 space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-36 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold" data-testid="text-tickets-title">Biletele mele</h1>

      {sortedEventGroups.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Ticket className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">{t("myTickets.noTickets")}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("myTickets.noTicketsPurchase")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedEventGroups.map(([eventId, { event, tickets }]) => (
            <EventOrderGroup
              key={eventId}
              eventId={eventId}
              event={event}
              tickets={tickets as any[]}
              activeEventId={activeEvent?.id}
              availability={availability}
              onShowQr={setQrDialogTicket}
              onUpgrade={(ticket) => { setSelectedTicket(ticket); setSelectedCategory(""); setUpgradeDialogOpen(true); }}
            />
          ))}
        </div>
      )}

      {/* Upgrade dialog */}
      <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <DialogContent data-testid="upgrade-dialog">
          <DialogHeader>
            <DialogTitle>{t("myTickets.upgradeTitle")}</DialogTitle>
          </DialogHeader>
          {selectedTicket && availability && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                {t("myTickets.current")}:{" "}
                <span className="font-medium text-foreground">{selectedTicket.category || "Main"}</span>{" "}
                ({(selectedTicket.price || 0).toFixed(0)} MDL)
              </div>
              <div className="space-y-2">
                {[...availability]
                  .filter((cat) => cat.name !== (selectedTicket.category || "Main"))
                  .map((cat) => {
                    const diff = cat.price - (selectedTicket.price || 0);
                    const unavailable = cat.available <= 0;
                    return (
                      <div
                        key={cat.id}
                        className={`border rounded-md p-3 transition-colors ${unavailable ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${selectedCategory === cat.name ? "border-primary bg-primary/5" : ""}`}
                        onClick={() => !unavailable && setSelectedCategory(cat.name)}
                        data-testid={`upgrade-option-${cat.name}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <span className="font-medium text-sm">{cat.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {unavailable ? t("myTickets.soldOut") : `${cat.available} ${t("buy.available")}`}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-sm">{cat.price.toFixed(0)} MDL</div>
                            {diff !== 0 && (
                              <div className={`text-xs ${diff > 0 ? "text-destructive" : "text-[hsl(142,70%,45%)]"}`}>
                                {diff > 0 ? "+" : ""}{diff.toFixed(0)} MDL
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
              {selectedCategory && (
                <div className="border-t pt-3 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("myTickets.priceDiff")}</span>
                  <span className="font-bold">
                    {getUpgradePriceDiff() > 0 ? "+" : ""}{getUpgradePriceDiff().toFixed(0)} MDL
                  </span>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setUpgradeDialogOpen(false)} data-testid="button-cancel-upgrade">
                  {t("myTickets.cancelUpgrade")}
                </Button>
                <Button
                  disabled={!selectedCategory || upgradeMutation.isPending}
                  onClick={() => { if (selectedTicket && selectedCategory) upgradeMutation.mutate({ ticketId: selectedTicket.id, newCategory: selectedCategory }); }}
                  data-testid="button-confirm-upgrade"
                >
                  {upgradeMutation.isPending ? t("myTickets.upgrading") : t("myTickets.confirmUpgrade")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* QR dialog */}
      <Dialog open={!!qrDialogTicket} onOpenChange={(o) => !o && setQrDialogTicket(null)}>
        <DialogContent className="max-w-sm" data-testid="dialog-ticket-qr">
          <DialogHeader className="sr-only">
            <DialogTitle>{t("myTickets.qrTitle")}</DialogTitle>
          </DialogHeader>
          {qrDialogTicket && (
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="text-center">
                <h3 className="font-semibold text-lg">{t("myTickets.qrTitle")}</h3>
                <p className="text-sm text-muted-foreground">
                  {events?.find((e: any) => e.id === qrDialogTicket.eventId)?.name}
                </p>
              </div>
              <div className="p-4 bg-white rounded-xl shadow-md">
                <QRCodeSVG
                  value={qrDialogTicket.ticketCode}
                  size={260}
                  level="M"
                  includeMargin
                  data-testid="qr-code-fullscreen"
                />
              </div>
              <div className="text-center space-y-1">
                <p className="font-mono text-sm font-medium">{qrDialogTicket.ticketCode}</p>
                <p className="text-xs text-muted-foreground">
                  {qrDialogTicket.zone}{qrDialogTicket.seat ? ` · ${qrDialogTicket.seat}` : ""} · {qrDialogTicket.category}
                </p>
                <Badge variant="outline" className={`text-xs ${STATUS_BADGE[qrDialogTicket.status] || ""}`}>
                  {qrDialogTicket.status?.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground text-center">{t("myTickets.qrInstruction")}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadTicket(qrDialogTicket, events?.find((e: any) => e.id === qrDialogTicket.eventId)?.name || "Event")}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
                <Button variant="outline" size="sm" onClick={() => setQrDialogTicket(null)} data-testid="button-close-qr">
                  <X className="h-4 w-4 mr-1" />
                  {t("myTickets.closeQr")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
