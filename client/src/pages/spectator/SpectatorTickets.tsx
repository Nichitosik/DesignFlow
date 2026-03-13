import { TicketCard } from "@/components/TicketCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, Ticket, QrCode, Play, RotateCcw, ArrowRight, ArrowUpCircle, Tag, Users, Maximize2, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useEventWebSocket } from "@/hooks/use-websocket";

interface DemoTicket {
  id: string;
  code: string;
  status: "pending" | "valid" | "used" | "invalid";
  zone: string;
  seat: string;
  category: string;
  price: number;
  history: { status: string; time: string }[];
}

interface TicketAvailability {
  id: number;
  name: string;
  price: number;
  capacity: number;
  sold: number;
  available: number;
  color: string;
}

export default function SpectatorTickets() {
  const [demoMode, setDemoMode] = useState(false);
  const [demoTickets, setDemoTickets] = useState<DemoTicket[]>([]);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [qrDialogTicket, setQrDialogTicket] = useState<DemoTicket | null>(null);
  const { toast } = useToast();

  const { data: events, isLoading: eventsLoading } = useQuery<any[]>({
    queryKey: ["/api/events"],
  });

  const activeEvent = events?.find((e: any) => e.status === "active") || events?.[0];

  useEventWebSocket(activeEvent?.id, "spectator");

  const { data: myTickets, isLoading: ticketsLoading } = useQuery<any[]>({
    queryKey: ["/api/tickets/my"],
  });

  const { data: availability } = useQuery<TicketAvailability[]>({
    queryKey: ["/api/events", activeEvent?.id, "ticket-availability"],
    queryFn: () => fetch(`/api/events/${activeEvent?.id}/ticket-availability`).then(r => r.json()),
    enabled: !!activeEvent?.id,
    refetchInterval: 10000,
  });

  const seedMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/seed"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets/my"] });
    },
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
      toast({
        title: "Ticket Upgraded",
        description: `Upgraded to ${selectedCategory}. ${diff > 0 ? `Price difference: +${diff.toFixed(2)} MDL` : ""}`,
      });
    },
    onError: () => {
      toast({ title: "Upgrade Failed", description: "Could not upgrade ticket. Please try again.", variant: "destructive" });
    },
  });

  const generateDemoTickets = () => {
    const zones = ["VIP Zone A", "General 1", "General 2", "Balcony"];
    const categories: Array<{ name: string; price: number }> = [
      { name: "Main", price: 50 },
      { name: "Main", price: 50 },
      { name: "Tribuna", price: 120 },
      { name: "Main", price: 50 },
    ];
    const tickets: DemoTicket[] = Array.from({ length: 4 }, (_, i) => ({
      id: `demo-${Date.now()}-${i}`,
      code: `DEMO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      status: "pending" as const,
      zone: zones[i % zones.length],
      seat: `Row ${Math.floor(Math.random() * 20) + 1}, Seat ${Math.floor(Math.random() * 30) + 1}`,
      category: categories[i].name,
      price: categories[i].price,
      history: [{ status: "pending", time: new Date().toLocaleTimeString() }],
    }));
    setDemoTickets(tickets);
    setDemoMode(true);
    toast({ title: "Demo Mode Active", description: "4 demo tickets created. Use the buttons to simulate lifecycle transitions." });
  };

  const transitionDemoTicket = (ticketId: string, newStatus: DemoTicket["status"]) => {
    setDemoTickets(prev => prev.map(t => {
      if (t.id !== ticketId) return t;
      return {
        ...t,
        status: newStatus,
        history: [...t.history, { status: newStatus, time: new Date().toLocaleTimeString() }],
      };
    }));
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "valid": return "text-[hsl(142,70%,45%)]";
      case "used": return "text-[hsl(38,90%,55%)]";
      case "invalid": return "text-[hsl(0,80%,55%)]";
      default: return "text-muted-foreground";
    }
  };

  const getNextTransitions = (status: DemoTicket["status"]): { label: string; next: DemoTicket["status"] }[] => {
    switch (status) {
      case "pending": return [{ label: "Activate", next: "valid" }];
      case "valid": return [{ label: "Scan (Use)", next: "used" }, { label: "Invalidate", next: "invalid" }];
      case "used": return [{ label: "Mark Invalid", next: "invalid" }];
      case "invalid": return [];
    }
  };

  const openUpgradeDialog = (ticket: any) => {
    setSelectedTicket(ticket);
    setSelectedCategory("");
    setUpgradeDialogOpen(true);
  };

  const getUpgradePriceDifference = () => {
    if (!selectedTicket || !selectedCategory || !availability) return 0;
    const currentCat = availability.find(a => a.name === selectedTicket.category);
    const newCat = availability.find(a => a.name === selectedCategory);
    if (!currentCat || !newCat) return 0;
    return newCat.price - currentCat.price;
  };

  if (eventsLoading) {
    return (
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64" />
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

  const eventDate = activeEvent.date ? new Date(activeEvent.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "";
  const categoryOrder = ["Main", "Tribuna", "VIP"];

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-tickets-title">My Tickets</h1>
          <p className="text-muted-foreground text-sm">{activeEvent.name}</p>
        </div>
        <div className="flex items-center gap-2">
          {demoMode ? (
            <Button variant="outline" size="sm" onClick={() => { setDemoMode(false); setDemoTickets([]); }} data-testid="button-exit-demo">
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

      {availability && availability.length > 0 && !demoMode && (
        <Card data-testid="ticket-availability-panel">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold">Ticket Availability</h3>
                <p className="text-xs text-muted-foreground">Real-time pricing and availability</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[...availability].sort((a, b) => categoryOrder.indexOf(a.name) - categoryOrder.indexOf(b.name)).map((cat) => {
                const pct = cat.capacity > 0 ? Math.round((cat.sold / cat.capacity) * 100) : 0;
                return (
                  <div
                    key={cat.id}
                    className="border rounded-md p-4 space-y-2"
                    data-testid={`availability-card-${cat.name}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm" data-testid={`availability-name-${cat.name}`}>{cat.name}</span>
                      <Badge variant="outline" data-testid={`availability-price-${cat.name}`}>{cat.price.toFixed(0)} MDL</Badge>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: cat.color }}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {cat.available} available
                      </span>
                      <span>{pct}% sold</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {demoMode && (
        <Card data-testid="demo-tickets-panel">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold">Ticket Lifecycle Demo</h3>
                <p className="text-xs text-muted-foreground">Simulate ticket status transitions: Pending, Valid, Used, Invalid</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {demoTickets.map((ticket) => (
              <div key={ticket.id} className="border rounded-md p-4 space-y-3" data-testid={`demo-ticket-${ticket.id}`}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Ticket className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-sm font-medium">{ticket.code}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{ticket.category} - {ticket.price} MDL</Badge>
                    <Badge variant="outline" className={statusColor(ticket.status)}>
                      {ticket.status.toUpperCase()}
                    </Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setQrDialogTicket(ticket)}
                      data-testid={`button-show-qr-${ticket.id}`}
                      title="Show QR code"
                    >
                      <QrCode className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
                  <span>Zone: {ticket.zone}</span>
                  <span>Seat: {ticket.seat}</span>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {ticket.history.map((h, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <span className={`text-xs font-medium ${statusColor(h.status)}`}>{h.status}</span>
                      {i < ticket.history.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {getNextTransitions(ticket.status).map((t) => (
                    <Button
                      key={t.next}
                      size="sm"
                      variant="outline"
                      onClick={() => transitionDemoTicket(ticket.id, t.next)}
                      data-testid={`button-transition-${ticket.id}-${t.next}`}
                    >
                      {t.label}
                    </Button>
                  ))}
                  {getNextTransitions(ticket.status).length === 0 && (
                    <span className="text-xs text-muted-foreground">Final state reached</span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {!demoMode && (
        <div className="space-y-4">
          {ticketsLoading ? (
            <Skeleton className="h-64" />
          ) : myTickets && myTickets.length > 0 ? (
            myTickets.map((ticket: any) => (
              <Card key={ticket.id} data-testid={`ticket-card-${ticket.id}`}>
                <CardContent className="p-0">
                  <TicketCard
                    ticketId={ticket.ticketCode}
                    eventName={activeEvent.name}
                    eventDate={eventDate}
                    eventTime={activeEvent.startTime || ""}
                    zone={ticket.zone}
                    seat={ticket.seat}
                    status={ticket.status === "used" ? "invalid" : ticket.status}
                  />
                  <div className="px-4 pb-4 pt-0 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" data-testid={`ticket-category-${ticket.id}`}>
                        {ticket.category || "Main"}
                      </Badge>
                      <span className="text-sm text-muted-foreground" data-testid={`ticket-price-${ticket.id}`}>
                        {(ticket.price || 0).toFixed(0)} MDL
                      </span>
                    </div>
                    {(ticket.status === "valid" || ticket.status === "pending") && availability && availability.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openUpgradeDialog(ticket)}
                        data-testid={`button-upgrade-${ticket.id}`}
                      >
                        <ArrowUpCircle className="h-4 w-4 mr-1" />
                        Upgrade
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Ticket className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No tickets found for this event.</p>
                <p className="text-xs text-muted-foreground mt-1">Try Demo Mode to explore ticket lifecycle features.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <DialogContent data-testid="upgrade-dialog">
          <DialogHeader>
            <DialogTitle>Upgrade Ticket</DialogTitle>
            <DialogDescription>
              Select a new category for your ticket. The price difference will be shown.
            </DialogDescription>
          </DialogHeader>
          {selectedTicket && availability && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Current: <span className="font-medium text-foreground">{selectedTicket.category || "Main"}</span> ({(selectedTicket.price || 0).toFixed(0)} MDL)
              </div>
              <div className="space-y-2">
                {[...availability]
                  .sort((a, b) => categoryOrder.indexOf(a.name) - categoryOrder.indexOf(b.name))
                  .filter(cat => cat.name !== (selectedTicket.category || "Main"))
                  .map((cat) => {
                    const diff = cat.price - (selectedTicket.price || 0);
                    return (
                      <div
                        key={cat.id}
                        className={`border rounded-md p-3 cursor-pointer transition-colors ${selectedCategory === cat.name ? "border-primary bg-primary/5" : "hover-elevate"}`}
                        onClick={() => setSelectedCategory(cat.name)}
                        data-testid={`upgrade-option-${cat.name}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <span className="font-medium text-sm">{cat.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">{cat.available} available</span>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-sm">{cat.price.toFixed(0)} MDL</div>
                            {diff !== 0 && (
                              <div className={`text-xs ${diff > 0 ? "text-[hsl(0,80%,55%)]" : "text-[hsl(142,70%,45%)]"}`}>
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
                <div className="border-t pt-3">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-muted-foreground">Price difference</span>
                    <span className="font-bold">
                      {getUpgradePriceDifference() > 0 ? "+" : ""}{getUpgradePriceDifference().toFixed(0)} MDL
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpgradeDialogOpen(false)} data-testid="button-cancel-upgrade">
              Cancel
            </Button>
            <Button
              disabled={!selectedCategory || upgradeMutation.isPending}
              onClick={() => {
                if (selectedTicket && selectedCategory) {
                  upgradeMutation.mutate({ ticketId: selectedTicket.id, newCategory: selectedCategory });
                }
              }}
              data-testid="button-confirm-upgrade"
            >
              {upgradeMutation.isPending ? "Upgrading..." : "Confirm Upgrade"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!qrDialogTicket} onOpenChange={(open) => !open && setQrDialogTicket(null)}>
        <DialogContent className="max-w-sm" data-testid="dialog-demo-qr">
          <DialogHeader className="sr-only">
            <DialogTitle>Ticket QR Code</DialogTitle>
          </DialogHeader>
          {qrDialogTicket && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="text-center">
                <h3 className="font-semibold text-lg">Ticket QR Code</h3>
                <p className="text-sm text-muted-foreground">{activeEvent?.name}</p>
              </div>
              <div className="p-4 bg-white rounded-md shadow-sm">
                <QRCodeSVG
                  value={qrDialogTicket.code}
                  size={280}
                  level="H"
                  includeMargin
                  data-testid="qr-code-fullscreen"
                />
              </div>
              <div className="text-center space-y-1">
                <p className="font-mono text-sm font-medium">{qrDialogTicket.code}</p>
                <p className="text-xs text-muted-foreground">{qrDialogTicket.zone} · {qrDialogTicket.seat}</p>
                <Badge variant="outline" className={statusColor(qrDialogTicket.status)}>
                  {qrDialogTicket.status.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Show this QR code to staff for scanning and entry validation
              </p>
              <Button
                variant="outline"
                onClick={() => setQrDialogTicket(null)}
                data-testid="button-close-demo-qr"
              >
                <X className="h-4 w-4 mr-1" />
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
