import { TicketCard } from "@/components/TicketCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, Ticket, QrCode, Play, RotateCcw, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface DemoTicket {
  id: string;
  code: string;
  status: "pending" | "valid" | "used" | "invalid";
  zone: string;
  seat: string;
  history: { status: string; time: string }[];
}

export default function SpectatorTickets() {
  const [demoMode, setDemoMode] = useState(false);
  const [demoTickets, setDemoTickets] = useState<DemoTicket[]>([]);
  const { toast } = useToast();

  const { data: events, isLoading: eventsLoading } = useQuery<any[]>({
    queryKey: ["/api/events"],
  });

  const activeEvent = events?.find((e: any) => e.status === "active") || events?.[0];

  const { data: myTickets, isLoading: ticketsLoading } = useQuery<any[]>({
    queryKey: ["/api/tickets/my"],
  });

  const seedMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/seed"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets/my"] });
    },
  });

  const generateDemoTickets = () => {
    const zones = ["VIP Zone A", "General 1", "General 2", "Balcony"];
    const tickets: DemoTicket[] = Array.from({ length: 4 }, (_, i) => ({
      id: `demo-${Date.now()}-${i}`,
      code: `DEMO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      status: "pending" as const,
      zone: zones[i % zones.length],
      seat: `Row ${Math.floor(Math.random() * 20) + 1}, Seat ${Math.floor(Math.random() * 30) + 1}`,
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
                  <Badge variant="outline" className={statusColor(ticket.status)}>
                    {ticket.status.toUpperCase()}
                  </Badge>
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
              <TicketCard
                key={ticket.id}
                ticketId={ticket.ticketCode}
                eventName={activeEvent.name}
                eventDate={eventDate}
                eventTime={activeEvent.startTime || ""}
                zone={ticket.zone}
                seat={ticket.seat}
                status={ticket.status === "used" ? "invalid" : ticket.status}
              />
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
    </div>
  );
}
