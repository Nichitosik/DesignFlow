import { TicketCard } from "@/components/TicketCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Ticket, QrCode, ArrowUpCircle, Tag, Users, ShoppingCart, X, Check, Calendar } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { useEventWebSocket } from "@/hooks/use-websocket";

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
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);
  const [buyCategory, setBuyCategory] = useState<TicketAvailability | null>(null);
  const [qrDialogTicket, setQrDialogTicket] = useState<any | null>(null);
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
    queryFn: () =>
      fetch(`/api/events/${activeEvent?.id}/ticket-availability`).then((r) => r.json()),
    enabled: !!activeEvent?.id,
    refetchInterval: 10000,
  });

  const purchaseMutation = useMutation({
    mutationFn: async ({ eventId, category }: { eventId: number; category: string }) => {
      const res = await apiRequest("POST", `/api/events/${eventId}/tickets`, { category });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets/my"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/events", activeEvent?.id, "ticket-availability"],
      });
      setBuyDialogOpen(false);
      setBuyCategory(null);
      toast({
        title: "Ticket Purchased",
        description: `Your ${data.category} ticket has been issued. Check your tickets below.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Purchase Failed",
        description: error.message || "Could not purchase ticket. Please try again.",
        variant: "destructive",
      });
    },
  });

  const upgradeMutation = useMutation({
    mutationFn: ({ ticketId, newCategory }: { ticketId: number; newCategory: string }) =>
      apiRequest("POST", `/api/tickets/${ticketId}/upgrade`, { newCategory }),
    onSuccess: async (res) => {
      const data = await res.json();
      const diff = data.priceDifference;
      queryClient.invalidateQueries({ queryKey: ["/api/tickets/my"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/events", activeEvent?.id, "ticket-availability"],
      });
      setUpgradeDialogOpen(false);
      toast({
        title: "Ticket Upgraded",
        description: `Upgraded to ${selectedCategory}.${diff > 0 ? ` +${diff.toFixed(0)} MDL charged.` : ""}`,
      });
    },
    onError: () => {
      toast({
        title: "Upgrade Failed",
        description: "Could not upgrade ticket. Please try again.",
        variant: "destructive",
      });
    },
  });

  const openUpgradeDialog = (ticket: any) => {
    setSelectedTicket(ticket);
    setSelectedCategory("");
    setUpgradeDialogOpen(true);
  };

  const getUpgradePriceDifference = () => {
    if (!selectedTicket || !selectedCategory || !availability) return 0;
    const currentCat = availability.find((a) => a.name === selectedTicket.category);
    const newCat = availability.find((a) => a.name === selectedCategory);
    if (!currentCat || !newCat) return 0;
    return newCat.price - currentCat.price;
  };

  const categoryOrder = ["Main", "Tribuna", "VIP"];

  const statusColor = (status: string) => {
    switch (status) {
      case "valid": return "text-[hsl(142,70%,45%)]";
      case "used": return "text-[hsl(38,90%,55%)]";
      case "invalid": return "text-[hsl(0,80%,55%)]";
      default: return "text-muted-foreground";
    }
  };

  if (eventsLoading) {
    return (
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48" />
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
            <h2 className="text-lg font-semibold mb-1">No Events Available</h2>
            <p className="text-muted-foreground text-sm">
              There are no upcoming events at this time. Check back soon!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const eventDate = activeEvent.date
    ? new Date(activeEvent.date).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";

  const myEventTickets = myTickets?.filter(
    (t: any) => t.eventId === activeEvent.id
  ) || [];

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-tickets-title">My Tickets</h1>
        <p className="text-muted-foreground text-sm">
          {activeEvent.name}
          {eventDate && ` — ${eventDate}`}
          {activeEvent.startTime && ` at ${activeEvent.startTime}`}
        </p>
      </div>

      {availability && availability.length > 0 && (
        <Card data-testid="ticket-availability-panel">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold">Buy Tickets</h3>
                <p className="text-xs text-muted-foreground">
                  Live pricing and availability — purchase instantly
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[...availability]
                .sort((a, b) => categoryOrder.indexOf(a.name) - categoryOrder.indexOf(b.name))
                .map((cat) => {
                  const pct =
                    cat.capacity > 0 ? Math.round((cat.sold / cat.capacity) * 100) : 0;
                  const soldOut = cat.available <= 0;
                  return (
                    <div
                      key={cat.id}
                      className="border rounded-md p-4 space-y-3"
                      data-testid={`availability-card-${cat.name}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="font-semibold text-sm"
                          data-testid={`availability-name-${cat.name}`}
                        >
                          {cat.name}
                        </span>
                        <Badge
                          variant="outline"
                          data-testid={`availability-price-${cat.name}`}
                        >
                          {cat.price.toFixed(0)} MDL
                        </Badge>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: cat.color,
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {soldOut ? "Sold out" : `${cat.available} available`}
                        </span>
                        <span>{pct}% sold</span>
                      </div>
                      <Button
                        className="w-full"
                        size="sm"
                        disabled={soldOut}
                        onClick={() => {
                          setBuyCategory(cat);
                          setBuyDialogOpen(true);
                        }}
                        data-testid={`button-buy-${cat.name}`}
                      >
                        <ShoppingCart className="h-4 w-4 mr-1.5" />
                        {soldOut ? "Sold Out" : "Buy Ticket"}
                      </Button>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h2 className="font-semibold text-lg">My Tickets for This Event</h2>
        {ticketsLoading ? (
          <Skeleton className="h-64" />
        ) : myEventTickets.length > 0 ? (
          myEventTickets.map((ticket: any) => (
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
                    <Badge
                      variant="secondary"
                      data-testid={`ticket-category-${ticket.id}`}
                    >
                      {ticket.category || "Main"}
                    </Badge>
                    <span
                      className="text-sm text-muted-foreground"
                      data-testid={`ticket-price-${ticket.id}`}
                    >
                      {(ticket.price || 0).toFixed(0)} MDL
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${statusColor(ticket.status)}`}
                    >
                      {ticket.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQrDialogTicket(ticket)}
                      data-testid={`button-show-qr-${ticket.id}`}
                      title="Show QR Code"
                    >
                      <QrCode className="h-4 w-4" />
                    </Button>
                    {(ticket.status === "valid" || ticket.status === "pending") &&
                      availability &&
                      availability.length > 0 && (
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
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Ticket className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No tickets yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Purchase a ticket above to get started.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={buyDialogOpen} onOpenChange={(open) => { if (!open) { setBuyDialogOpen(false); setBuyCategory(null); } }}>
        <DialogContent data-testid="buy-dialog">
          <DialogHeader>
            <DialogTitle>Confirm Purchase</DialogTitle>
            <DialogDescription>
              You are about to purchase a ticket for {activeEvent.name}.
            </DialogDescription>
          </DialogHeader>
          {buyCategory && (
            <div className="space-y-4">
              <div className="border rounded-md p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{buyCategory.name} Ticket</span>
                  <Badge variant="outline">{buyCategory.price.toFixed(0)} MDL</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{activeEvent.name}</p>
                {eventDate && (
                  <p className="text-xs text-muted-foreground">
                    {eventDate}
                    {activeEvent.startTime && ` at ${activeEvent.startTime}`}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Zone: {buyCategory.name === "VIP" ? "VIP Zone" : buyCategory.name === "Tribuna" ? "Tribune Section" : "Main Area"}
                </p>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Available</span>
                <span className="font-medium">{buyCategory.available} seats</span>
              </div>
              <div className="flex items-center justify-between text-sm border-t pt-3">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-lg">{buyCategory.price.toFixed(0)} MDL</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setBuyDialogOpen(false); setBuyCategory(null); }}
              data-testid="button-cancel-buy"
            >
              Cancel
            </Button>
            <Button
              disabled={purchaseMutation.isPending}
              onClick={() => {
                if (buyCategory && activeEvent) {
                  purchaseMutation.mutate({
                    eventId: activeEvent.id,
                    category: buyCategory.name,
                  });
                }
              }}
              data-testid="button-confirm-buy"
            >
              <Check className="h-4 w-4 mr-1.5" />
              {purchaseMutation.isPending ? "Processing..." : "Confirm Purchase"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
      >
        <DialogContent data-testid="upgrade-dialog">
          <DialogHeader>
            <DialogTitle>Upgrade Ticket</DialogTitle>
            <DialogDescription>
              Select a new category. You pay only the price difference.
            </DialogDescription>
          </DialogHeader>
          {selectedTicket && availability && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Current:{" "}
                <span className="font-medium text-foreground">
                  {selectedTicket.category || "Main"}
                </span>{" "}
                ({(selectedTicket.price || 0).toFixed(0)} MDL)
              </div>
              <div className="space-y-2">
                {[...availability]
                  .sort((a, b) => categoryOrder.indexOf(a.name) - categoryOrder.indexOf(b.name))
                  .filter((cat) => cat.name !== (selectedTicket.category || "Main"))
                  .map((cat) => {
                    const diff = cat.price - (selectedTicket.price || 0);
                    const unavailable = cat.available <= 0;
                    return (
                      <div
                        key={cat.id}
                        className={`border rounded-md p-3 transition-colors ${unavailable ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${
                          selectedCategory === cat.name
                            ? "border-primary bg-primary/5"
                            : unavailable
                            ? ""
                            : "hover-elevate"
                        }`}
                        onClick={() => !unavailable && setSelectedCategory(cat.name)}
                        data-testid={`upgrade-option-${cat.name}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <span className="font-medium text-sm">{cat.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {unavailable ? "Sold out" : `${cat.available} available`}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-sm">{cat.price.toFixed(0)} MDL</div>
                            {diff !== 0 && (
                              <div
                                className={`text-xs ${
                                  diff > 0
                                    ? "text-[hsl(0,80%,55%)]"
                                    : "text-[hsl(142,70%,45%)]"
                                }`}
                              >
                                {diff > 0 ? "+" : ""}
                                {diff.toFixed(0)} MDL
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
                      {getUpgradePriceDifference() > 0 ? "+" : ""}
                      {getUpgradePriceDifference().toFixed(0)} MDL
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUpgradeDialogOpen(false)}
              data-testid="button-cancel-upgrade"
            >
              Cancel
            </Button>
            <Button
              disabled={!selectedCategory || upgradeMutation.isPending}
              onClick={() => {
                if (selectedTicket && selectedCategory) {
                  upgradeMutation.mutate({
                    ticketId: selectedTicket.id,
                    newCategory: selectedCategory,
                  });
                }
              }}
              data-testid="button-confirm-upgrade"
            >
              {upgradeMutation.isPending ? "Upgrading..." : "Confirm Upgrade"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!qrDialogTicket}
        onOpenChange={(open) => !open && setQrDialogTicket(null)}
      >
        <DialogContent className="max-w-sm" data-testid="dialog-ticket-qr">
          <DialogHeader className="sr-only">
            <DialogTitle>Ticket QR Code</DialogTitle>
          </DialogHeader>
          {qrDialogTicket && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="text-center">
                <h3 className="font-semibold text-lg">Your Ticket QR Code</h3>
                <p className="text-sm text-muted-foreground">{activeEvent?.name}</p>
              </div>
              <div className="p-4 bg-white rounded-md shadow-sm">
                <QRCodeSVG
                  value={qrDialogTicket.ticketCode}
                  size={280}
                  level="H"
                  includeMargin
                  data-testid="qr-code-fullscreen"
                />
              </div>
              <div className="text-center space-y-1">
                <p className="font-mono text-sm font-medium">{qrDialogTicket.ticketCode}</p>
                <p className="text-xs text-muted-foreground">
                  {qrDialogTicket.zone}
                  {qrDialogTicket.seat ? ` · ${qrDialogTicket.seat}` : ""}
                </p>
                <Badge
                  variant="outline"
                  className={`text-xs ${statusColor(qrDialogTicket.status)}`}
                >
                  {qrDialogTicket.status.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Show this QR code to staff at the entrance for validation
              </p>
              <Button
                variant="outline"
                onClick={() => setQrDialogTicket(null)}
                data-testid="button-close-qr"
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
