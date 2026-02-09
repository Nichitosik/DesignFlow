import { TicketCard } from "@/components/TicketCard";
import { VenueMap } from "@/components/VenueMap";
import { NotificationCard } from "@/components/NotificationCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Navigation, Share2, Database } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import eventImage from "@assets/stock_images/concert_crowd_music__8267ea97.jpg";

export default function SpectatorDashboard() {
  const [activeZone, setActiveZone] = useState<string>();

  const { data: events, isLoading: eventsLoading } = useQuery<any[]>({
    queryKey: ["/api/events"],
  });

  const activeEvent = events?.find((e: any) => e.status === "active") || events?.[0];

  const { data: myTickets, isLoading: ticketsLoading } = useQuery<any[]>({
    queryKey: ["/api/tickets/my"],
  });

  const { data: zones, isLoading: zonesLoading } = useQuery<any[]>({
    queryKey: ["/api/events", activeEvent?.id, "zones"],
    enabled: !!activeEvent,
  });

  const { data: notifs } = useQuery<any[]>({
    queryKey: ["/api/events", activeEvent?.id, "notifications"],
    enabled: !!activeEvent,
  });

  const seedMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/seed"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets/my"] });
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

  if (eventsLoading) {
    return (
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <Skeleton className="h-48 w-full rounded-lg" />
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
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
            <p className="text-muted-foreground text-sm">There are no active events. Create demo data to get started.</p>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending} data-testid="button-seed-data">
              <Database className="h-4 w-4 mr-2" />
              {seedMutation.isPending ? "Creating Demo Data..." : "Create Demo Event"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const eventDate = activeEvent.date ? new Date(activeEvent.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "";
  const ticket = myTickets?.[0];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="relative h-48 rounded-lg overflow-hidden">
        <img src={eventImage} alt="Event venue" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20" />
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <h1 className="text-3xl font-bold" data-testid="text-event-name">{activeEvent.name}</h1>
          <p className="text-sm opacity-90">{eventDate} {activeEvent.startTime && `\u2022 ${activeEvent.startTime}`}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {ticketsLoading ? (
            <Skeleton className="h-64" />
          ) : ticket ? (
            <TicketCard
              ticketId={ticket.ticketCode}
              eventName={activeEvent.name}
              eventDate={eventDate}
              eventTime={activeEvent.startTime || ""}
              zone={ticket.zone}
              seat={ticket.seat}
              status={ticket.status === "used" ? "invalid" : ticket.status}
            />
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No tickets found for this event.
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <h3 className="font-semibold">Quick Actions</h3>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" variant="outline" data-testid="button-directions">
                <Navigation className="h-4 w-4 mr-2" />
                Get Directions to Your Seat
              </Button>
              <Button className="w-full justify-start" variant="outline" data-testid="button-share">
                <Share2 className="h-4 w-4 mr-2" />
                Share Your Ticket
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {zonesLoading ? <Skeleton className="h-64" /> : (
            <VenueMap zones={mappedZones} activeZone={activeZone} onZoneClick={setActiveZone} />
          )}

          <div className="space-y-3">
            <h3 className="font-semibold">Event Updates</h3>
            {(notifs || []).slice(0, 5).map((n: any) => (
              <NotificationCard
                key={n.id}
                type={n.type}
                title={n.title}
                message={n.message}
                timestamp={n.createdAt ? new Date(n.createdAt).toLocaleTimeString() : ""}
              />
            ))}
            {(!notifs || notifs.length === 0) && (
              <p className="text-sm text-muted-foreground">No updates yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
