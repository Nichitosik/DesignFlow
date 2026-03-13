import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Ticket, LayoutGrid, Map, Clock, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import { Link } from "wouter";

const DEFAULT_LAT = 47.0245;
const DEFAULT_LNG = 28.8327;

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function getPriceRange(categories: any[]): string {
  if (!categories || categories.length === 0) return "–";
  const prices = categories.map((c: any) => c.price).filter((p: any) => typeof p === "number");
  if (prices.length === 0) return "–";
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? `${min} MDL` : `${min}–${max} MDL`;
}

function EventCard({ event, venue, categories }: { event: any; venue: any; categories: any[] }) {
  const isUpcoming = new Date(event.date) >= new Date();
  const statusColor = event.status === "active"
    ? "bg-[hsl(142,70%,45%)] text-white border-0"
    : event.status === "cancelled"
    ? "bg-[hsl(0,80%,55%)] text-white border-0"
    : "bg-muted text-muted-foreground";

  return (
    <Card className="overflow-hidden hover-elevate" data-testid={`event-card-${event.id}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge className={`text-xs capitalize ${statusColor}`}>{event.status}</Badge>
              {isUpcoming && <Badge variant="outline" className="text-xs">Upcoming</Badge>}
            </div>
            <h3 className="font-semibold text-base leading-tight truncate" data-testid={`text-event-name-${event.id}`}>
              {event.name}
            </h3>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-muted-foreground">from</p>
            <p className="font-bold text-sm text-primary">{getPriceRange(categories)}</p>
          </div>
        </div>

        <div className="space-y-1.5 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>{formatDate(event.date)}</span>
          </div>
          {event.startTime && (
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>{event.startTime}{event.endTime ? ` – ${event.endTime}` : ""}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {venue?.name || event.venue}
              {venue?.city && ` · ${venue.city}`}
            </span>
          </div>
        </div>

        {event.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{event.description}</p>
        )}

        <Link href="/spectator/tickets">
          <Button size="sm" className="w-full" data-testid={`button-view-event-${event.id}`}>
            <Ticket className="h-3.5 w-3.5 mr-1.5" />
            Buy Tickets
            <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default function SpectatorEvents() {
  const { t } = useI18n();
  const [viewMode, setViewMode] = useState<"cards" | "map">("cards");
  const [filter, setFilter] = useState<"upcoming" | "all">("upcoming");

  const { data: events = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/events"] });
  const { data: venues = [] } = useQuery<any[]>({ queryKey: ["/api/venues"] });

  const { data: allCategories = [] } = useQuery<any[]>({
    queryKey: ["/api/events", "all-categories"],
    queryFn: async () => {
      if (!events.length) return [];
      const results = await Promise.all(
        events.map((e: any) =>
          fetch(`/api/events/${e.id}/ticket-categories`, { credentials: "include" })
            .then(r => r.ok ? r.json() : [])
            .then((cats: any[]) => cats.map((c: any) => ({ ...c, eventId: e.id })))
        )
      );
      return results.flat();
    },
    enabled: events.length > 0,
  });

  const categoriesByEvent = (eventId: number) =>
    allCategories.filter((c: any) => c.eventId === eventId);

  const venueById = (id: number | undefined) =>
    id ? venues.find((v: any) => v.id === id) : undefined;

  const filtered = filter === "upcoming"
    ? events.filter((e: any) => new Date(e.date) >= new Date(Date.now() - 24 * 60 * 60 * 1000))
    : events;

  const sorted = [...filtered].sort(
    (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const mapVenue = venues.find((v: any) => v.latitude && v.longitude) || null;
  const mapLat = mapVenue?.latitude ?? DEFAULT_LAT;
  const mapLng = mapVenue?.longitude ?? DEFAULT_LNG;
  const mapEmbedUrl = `https://maps.google.com/maps?q=${mapLat},${mapLng}&z=13&output=embed`;

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-events-title">{t("events.title")}</h1>
          <p className="text-muted-foreground text-sm">{t("events.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={viewMode === "cards" ? "default" : "outline"}
            onClick={() => setViewMode("cards")}
            data-testid="button-view-cards"
          >
            <LayoutGrid className="h-3.5 w-3.5 mr-1.5" />
            {t("events.cardView")}
          </Button>
          <Button
            size="sm"
            variant={viewMode === "map" ? "default" : "outline"}
            onClick={() => setViewMode("map")}
            data-testid="button-view-map"
          >
            <Map className="h-3.5 w-3.5 mr-1.5" />
            {t("events.mapView")}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={filter === "upcoming" ? "default" : "outline"}
          onClick={() => setFilter("upcoming")}
          data-testid="button-filter-upcoming"
        >
          {t("events.upcoming")}
        </Button>
        <Button
          size="sm"
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
          data-testid="button-filter-all"
        >
          {t("events.allEvents")}
        </Button>
      </div>

      {viewMode === "map" ? (
        <Card className="overflow-hidden" data-testid="events-map-card">
          <iframe
            src={mapEmbedUrl}
            width="100%"
            height="480"
            style={{ border: 0, display: "block" }}
            title="Events Map"
            loading="lazy"
            data-testid="events-map-iframe"
          />
          {mapVenue && (
            <div className="px-4 py-3 border-t flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <span className="font-medium">{mapVenue.name}</span>
              <span className="text-muted-foreground">· {mapVenue.address}, {mapVenue.city}</span>
            </div>
          )}
        </Card>
      ) : (
        <div>
          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Card key={i}>
                  <CardContent className="p-5 space-y-3 animate-pulse">
                    <div className="h-4 bg-muted rounded" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                    <div className="h-8 bg-muted rounded mt-4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center">
                <Calendar className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="font-semibold">{t("events.noEvents")}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {filter === "upcoming" ? t("events.noUpcoming") : t("events.noEventsDesc")}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sorted.map((event: any) => (
                <EventCard
                  key={event.id}
                  event={event}
                  venue={venueById(event.venueId)}
                  categories={categoriesByEvent(event.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
