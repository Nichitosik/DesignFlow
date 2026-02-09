import { TicketCard } from "@/components/TicketCard";
import { VenueMap } from "@/components/VenueMap";
import { NotificationCard } from "@/components/NotificationCard";
import { DirectionsPanel } from "@/components/DirectionsPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Database, Car } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import eventImage from "@assets/stock_images/concert_crowd_music__8267ea97.jpg";

export default function SpectatorDashboard() {
  const [activeZone, setActiveZone] = useState<string>();
  const [simulatedParking, setSimulatedParking] = useState<any[] | null>(null);

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

  const { data: parking } = useQuery<any[]>({
    queryKey: ["/api/events", activeEvent?.id, "parking"],
    enabled: !!activeEvent,
  });

  const simulateParkingFn = useCallback(() => {
    if (!parking || parking.length === 0) return;
    setSimulatedParking(prev => {
      const base = prev || parking.map((p: any) => ({ ...p }));
      return base.map((lot: any) => {
        const change = Math.floor(Math.random() * 11) - 3;
        const newOccupied = Math.max(0, Math.min(lot.capacity, (lot.occupied || 0) + change));
        const pct = (newOccupied / lot.capacity) * 100;
        let status = lot.status;
        if (pct >= 98) status = "full";
        else if (pct < 98 && status === "full") status = "open";
        return { ...lot, occupied: newOccupied, status };
      });
    });
  }, [parking]);

  useEffect(() => {
    if (parking && parking.length > 0 && !simulatedParking) {
      setSimulatedParking(parking.map((p: any) => ({ ...p })));
    }
  }, [parking, simulatedParking]);

  useEffect(() => {
    const interval = setInterval(simulateParkingFn, 5000);
    return () => clearInterval(interval);
  }, [simulateParkingFn]);

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

  const displayParking = simulatedParking || parking || [];
  const totalParkingCapacity = displayParking.reduce((sum: number, p: any) => sum + p.capacity, 0);
  const totalParkingOccupied = displayParking.reduce((sum: number, p: any) => sum + (p.occupied || 0), 0);
  const parkingAvailable = totalParkingCapacity - totalParkingOccupied;

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

          {displayParking.length > 0 && (
            <Card data-testid="parking-availability">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Parking Availability
                </h3>
                <span className={`text-lg font-bold ${parkingAvailable > 200 ? "text-[hsl(142,70%,45%)]" : parkingAvailable > 50 ? "text-[hsl(38,90%,55%)]" : "text-[hsl(0,80%,55%)]"}`}>
                  {parkingAvailable} spots
                </span>
              </CardHeader>
              <CardContent className="space-y-3">
                {displayParking.map((lot: any) => {
                  const pct = lot.capacity > 0 ? ((lot.occupied || 0) / lot.capacity) * 100 : 0;
                  const available = lot.capacity - (lot.occupied || 0);
                  return (
                    <div key={lot.id} className="flex items-center justify-between gap-2" data-testid={`parking-lot-${lot.id}`}>
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium">{lot.name}</span>
                        <div className="h-2 bg-muted rounded-full overflow-hidden mt-1">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(pct, 100)}%`,
                              backgroundColor: pct >= 90 ? "hsl(0,80%,55%)" : pct >= 70 ? "hsl(38,90%,55%)" : "hsl(142,70%,45%)",
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground whitespace-nowrap">{available} free</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          <DirectionsPanel />
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
