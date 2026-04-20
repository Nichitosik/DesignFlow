import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Calendar, MapPin, Ticket, Clock,
  ArrowLeft, ChevronRight, Phone, Search, X, ChevronLeft,
} from "lucide-react";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import { Link } from "wouter";

const CATEGORIES = [
  { id: "all", label: "Toate" },
  { id: "concert", label: "Concerte" },
  { id: "theatre", label: "Teatru" },
  { id: "sport", label: "Sport" },
  { id: "other", label: "Altele" },
];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" });
}

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ro-RO", { weekday: "short", day: "numeric", month: "short" });
}

function getPriceRange(categories: any[]): { min: number; max: number } | null {
  if (!categories || categories.length === 0) return null;
  const prices = categories.map((c: any) => c.price).filter((p: any) => typeof p === "number");
  if (prices.length === 0) return null;
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

function getPriceRangeLabel(categories: any[]): string {
  const r = getPriceRange(categories);
  if (!r) return "–";
  return r.min === r.max ? `${r.min} MDL` : `de la ${r.min} MDL`;
}

// Build a date row for the next ~20 days
function buildDateRow() {
  const days: { date: Date; label: string; dayNum: string; dayName: string; month: string }[] = [];
  const today = new Date();
  for (let i = 0; i < 28; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      date: d,
      label: d.toISOString().slice(0, 10),
      dayNum: d.getDate().toString(),
      dayName: d.toLocaleDateString("ro-RO", { weekday: "short" }),
      month: d.toLocaleDateString("ro-RO", { month: "short" }),
    });
  }
  return days;
}

function EventDetail({
  event, venue, categories, onBack,
}: {
  event: any; venue: any; categories: any[]; onBack: () => void;
}) {
  const priceRange = getPriceRange(categories);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        type="button"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        onClick={onBack}
      >
        <ArrowLeft className="h-4 w-4" />
        Toate evenimentele
      </button>

      <div className="grid md:grid-cols-[1fr_300px] gap-6">
        {/* Left: image + description */}
        <div className="space-y-5">
          {event.imageUrl ? (
            <div className="rounded-xl overflow-hidden border">
              <img
                src={event.imageUrl}
                alt={event.name}
                className="w-full max-h-80 object-cover"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.style.display = "none";
                  img.parentElement!.className = "rounded-xl border bg-muted h-56 flex items-center justify-center";
                }}
              />
            </div>
          ) : (
            <div className="rounded-xl border bg-muted h-56 flex items-center justify-center">
              <Ticket className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}
          <h1 className="text-2xl font-bold leading-tight">{event.name}</h1>
          {event.description && (
            <div className="space-y-2">
              {event.description.split("\n").filter(Boolean).map((para: string, i: number) => (
                <p key={i} className="text-sm leading-relaxed text-foreground/80">{para}</p>
              ))}
            </div>
          )}
        </div>

        {/* Right: info sidebar */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium text-sm">{venue?.name || event.venue}</p>
                  {(event.address || venue?.address) && (
                    <p className="text-xs text-muted-foreground">
                      {venue?.city && `${venue.city}, `}{event.address || venue?.address}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-2.5">
                <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">{formatDate(event.date)}{event.startTime ? `, ${event.startTime}` : ""}</p>
                  {event.endTime && (
                    <p className="text-xs text-muted-foreground">Început: {event.startTime} · Sfârșit: {event.endTime}</p>
                  )}
                </div>
              </div>

              {priceRange && (
                <>
                  <Separator />
                  <div className="flex items-center gap-2.5">
                    <Ticket className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">
                        {priceRange.min === priceRange.max
                          ? `${priceRange.min} MDL`
                          : `${priceRange.min} – ${priceRange.max} MDL`}
                      </p>
                      <p className="text-xs text-muted-foreground">Prețul biletului</p>
                    </div>
                  </div>
                </>
              )}

              {venue?.phone && (
                <>
                  <Separator />
                  <div className="flex items-center gap-2.5">
                    <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <p className="text-sm">{venue.phone}</p>
                  </div>
                </>
              )}

              <Link href="/spectator/map">
                <Button className="w-full mt-1" data-testid={`button-buy-${event.id}`}>
                  Cumpără bilet
                </Button>
              </Link>
            </CardContent>
          </Card>

          {categories.length > 0 && (
            <Card>
              <CardContent className="p-4 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Categorii</p>
                {categories.map((cat: any) => (
                  <div key={cat.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{cat.name}</span>
                    <span className="font-medium">{cat.price?.toFixed(0)} MDL</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

    </div>
  );
}

function EventPosterCard({
  event, categories, onClick,
}: {
  event: any; categories: any[]; onClick: () => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <button
      type="button"
      className="text-left group"
      onClick={onClick}
      data-testid={`event-card-${event.id}`}
    >
      <div className="relative rounded-xl overflow-hidden bg-muted aspect-[3/4] mb-3">
        {event.imageUrl && !imgFailed ? (
          <img
            src={event.imageUrl}
            alt={event.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Ticket className="h-10 w-10 text-muted-foreground/30" />
          </div>
        )}
        {/* Status badge top-left */}
        {event.status !== "active" && (
          <div className="absolute top-2 left-2">
            <span className={`text-xs font-bold px-2 py-1 rounded-md ${
              event.status === "cancelled" ? "bg-red-500/90 text-white" :
              event.status === "completed" ? "bg-blue-500/90 text-white" :
              "bg-gray-500/80 text-white"
            }`}>
              {event.status === "cancelled" ? "ANULAT" :
               event.status === "completed" ? "FINALIZAT" : "CIORNĂ"}
            </span>
          </div>
        )}
        {event.status === "active" && (
          <div className="absolute top-2 left-2">
            <span className="text-xs font-bold px-2 py-1 rounded-md bg-green-500/90 text-white flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              ACTIV
            </span>
          </div>
        )}
        {/* Price badge */}
        {getPriceRange(categories) && (
          <div className="absolute bottom-3 left-3">
            <span className="bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1.5 rounded-md">
              {getPriceRangeLabel(categories)}
            </span>
          </div>
        )}
        {event.status === "cancelled" && (
          <div className="absolute inset-0 bg-black/40" />
        )}
      </div>
      <div>
        <p className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {event.name}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {new Date(event.date).toLocaleDateString("ro-RO", { day: "numeric", month: "long" })}
          {event.venue && ` · ${event.venue}`}
        </p>
      </div>
    </button>
  );
}

export default function SpectatorEvents() {
  const { t } = useI18n();
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const dateScrollRef = useRef<HTMLDivElement>(null);

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

  const dateRow = useMemo(() => buildDateRow(), []);

  const filteredEvents = useMemo(() => {
    let result = [...events].filter((e: any) => e.status !== "cancelled" || category === "all");

    // Date filter
    if (selectedDate) {
      result = result.filter((e: any) => e.date?.startsWith(selectedDate));
    } else {
      // Default: upcoming only
      result = result.filter((e: any) => new Date(e.date) >= new Date(Date.now() - 24 * 60 * 60 * 1000));
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((e: any) =>
        e.name?.toLowerCase().includes(q) ||
        e.venue?.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q)
      );
    }

    return result.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events, category, selectedDate, search]);

  // Carousel: last 5 added events (highest id first)
  const carouselEvents = useMemo(() =>
    [...events].sort((a: any, b: any) => b.id - a.id).slice(0, 5),
    [events]
  );
  const [slideIdx, setSlideIdx] = useState(0);

  const goTo = useCallback((idx: number) => {
    setSlideIdx((idx + carouselEvents.length) % carouselEvents.length);
  }, [carouselEvents.length]);

  // Auto-advance every 4s
  useEffect(() => {
    if (carouselEvents.length < 2) return;
    const t = setInterval(() => goTo(slideIdx + 1), 4000);
    return () => clearInterval(t);
  }, [slideIdx, carouselEvents.length, goTo]);

  const scrollDates = (dir: "left" | "right") => {
    if (dateScrollRef.current) {
      dateScrollRef.current.scrollBy({ left: dir === "right" ? 200 : -200, behavior: "smooth" });
    }
  };

  // Show event detail
  if (selectedEvent) {
    const eventVenue = venueById(selectedEvent.venueId);
    return (
      <div className="p-6">
        <EventDetail
          event={selectedEvent}
          venue={eventVenue}
          categories={categoriesByEvent(selectedEvent.id)}
          onBack={() => setSelectedEvent(null)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-0">

      {/* Carousel — last 5 events */}
      {!isLoading && carouselEvents.length > 0 && (() => {
        const ev = carouselEvents[slideIdx];
        return (
          <div className="relative w-full overflow-hidden bg-muted select-none">
            <div className="relative h-[400px] sm:h-[440px]">
              {/* Slide image */}
              <img
                key={ev.id}
                src={ev.imageUrl || ""}
                alt={ev.name}
                className="w-full h-full object-cover transition-opacity duration-500"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              {/* Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

              {/* Prev / Next arrows */}
              {carouselEvents.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Previous"
                    onClick={() => goTo(slideIdx - 1)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors z-10"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next"
                    onClick={() => goTo(slideIdx + 1)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors z-10"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                <p className="text-white/70 text-sm mb-1.5 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDateShort(ev.date)}
                  {ev.startTime && <span className="ml-1">{ev.startTime}</span>}
                  {ev.venue && <><span className="mx-1">·</span>{ev.venue}</>}
                </p>
                <h2 className="text-white text-2xl sm:text-3xl font-bold leading-tight mb-3 max-w-xl">{ev.name}</h2>
                <div className="flex items-center gap-3 flex-wrap">
                  {getPriceRange(categoriesByEvent(ev.id)) && (
                    <span className="bg-primary text-primary-foreground text-sm font-bold px-3 py-1.5 rounded-md">
                      {getPriceRangeLabel(categoriesByEvent(ev.id))}
                    </span>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white"
                    onClick={() => setSelectedEvent(ev)}
                  >
                    Mai multe detalii
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>

              {/* Dots */}
              {carouselEvents.length > 1 && (
                <div className="absolute bottom-4 right-6 flex gap-1.5">
                  {carouselEvents.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Slide ${i + 1}`}
                      onClick={() => goTo(i)}
                      className={`w-2 h-2 rounded-full transition-all ${i === slideIdx ? "bg-white w-5" : "bg-white/40 hover:bg-white/60"}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      <div className="p-6 space-y-5">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Caută evenimente, locații..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-9"
          />
          {search && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category pills */}
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                category === c.id
                  ? "bg-foreground text-background border-foreground"
                  : "border-border hover:border-foreground/50 text-foreground"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Date row */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Scroll dates left"
            onClick={() => scrollDates("left")}
            className="shrink-0 p-1 rounded-full border hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div ref={dateScrollRef} className="flex gap-1.5 overflow-x-auto scrollbar-none flex-1">
            {/* "All" date option */}
            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              className={`shrink-0 flex flex-col items-center px-3 py-2 rounded-xl border text-sm transition-colors min-w-[52px] ${
                !selectedDate ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"
              }`}
            >
              <Calendar className="h-3.5 w-3.5 mb-0.5" />
              <span className="text-[10px] font-medium">Tot</span>
            </button>
            {dateRow.map((d) => {
              const isSelected = selectedDate === d.label;
              const isWeekend = d.date.getDay() === 0 || d.date.getDay() === 6;
              return (
                <button
                  key={d.label}
                  type="button"
                  onClick={() => setSelectedDate(isSelected ? null : d.label)}
                  className={`shrink-0 flex flex-col items-center px-3 py-2 rounded-xl border text-sm transition-colors min-w-[52px] ${
                    isSelected
                      ? "bg-foreground text-background border-foreground"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <span className={`text-base font-bold leading-none ${isWeekend && !isSelected ? "text-red-500" : ""}`}>
                    {d.dayNum}
                  </span>
                  <span className={`text-[10px] mt-0.5 ${isWeekend && !isSelected ? "text-red-400" : "text-muted-foreground"}`}>
                    {d.dayName}
                  </span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            aria-label="Scroll dates right"
            onClick={() => scrollDates("right")}
            className="shrink-0 p-1 rounded-full border hover:bg-muted transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Results */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">
              {search ? `Rezultate: "${search}"` : selectedDate ? `Evenimente pe ${new Date(selectedDate).toLocaleDateString("ro-RO", { day: "numeric", month: "long" })}` : "Evenimente populare"}
            </h2>
            {filteredEvents.length > 0 && (
              <span className="text-sm text-muted-foreground">{filteredEvents.length} {filteredEvents.length === 1 ? "eveniment" : "evenimente"}</span>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="space-y-2 animate-pulse">
                  <div className="aspect-[3/4] bg-muted rounded-xl" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="font-semibold">{t("events.noEvents")}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {search ? `Niciun rezultat pentru "${search}"` : "Nu există evenimente pentru data selectată"}
              </p>
              {(search || selectedDate) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => { setSearch(""); setSelectedDate(null); }}
                >
                  Resetează filtrele
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {filteredEvents.map((event: any) => (
                <EventPosterCard
                  key={event.id}
                  event={event}
                  categories={categoriesByEvent(event.id)}
                  onClick={() => setSelectedEvent(event)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
