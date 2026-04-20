import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { NotificationCard } from "@/components/NotificationCard";
import {
  Users, Ticket, TrendingUp, AlertTriangle, Plus, CalendarPlus, PenLine, Check, X, Trash2,
  ScanLine, ImageIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useI18n } from "@/lib/i18n";
import { useEventWebSocket } from "@/hooks/use-websocket";
import { useState, useRef, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { useToast } from "@/hooks/use-toast";

const ZONE_TYPE_COLORS: Record<string, string> = {
  main: "#6366f1",
  tribune: "#f59e0b",
  vip: "#ef4444",
};

interface CategoryForm {
  name: string;
  zoneType: "main" | "tribune" | "vip";
  price: string;
  capacity: string;
  rowCount: string;
  seatsPerRow: string;
}

interface EventForm {
  name: string;
  description: string;
  venueName: string;
  venueAddress: string;
  date: string;
  startTime: string;
  endTime: string;
  maxCapacity: string;
  status: "draft" | "active";
  imageUrl: string;
}

const defaultEventForm = (): EventForm => ({
  name: "",
  description: "",
  venueName: "",
  venueAddress: "",
  date: "",
  startTime: "18:00",
  endTime: "23:00",
  maxCapacity: "5000",
  status: "active",
  imageUrl: "",
});

const defaultCategories = (): CategoryForm[] => [
  { name: "Main / GA", zoneType: "main", price: "50", capacity: "5000", rowCount: "0", seatsPerRow: "0" },
  { name: "Tribune 203", zoneType: "tribune", price: "150", capacity: "300", rowCount: "10", seatsPerRow: "30" },
  { name: "Tribune 204", zoneType: "tribune", price: "200", capacity: "300", rowCount: "10", seatsPerRow: "30" },
  { name: "VIP Box A (5 seats)", zoneType: "vip", price: "500", capacity: "5", rowCount: "1", seatsPerRow: "5" },
  { name: "VIP Box B (9 seats)", zoneType: "vip", price: "400", capacity: "9", rowCount: "1", seatsPerRow: "9" },
];


export default function OrganizerOverview() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [step, setStep] = useState<"event" | "categories">("event");
  const [eventForm, setEventForm] = useState<EventForm>(defaultEventForm());
  const [categories, setCategories] = useState<CategoryForm[]>(defaultCategories());
  const [createdEventId, setCreatedEventId] = useState<number | null>(null);
  const [editingPrice, setEditingPrice] = useState<{ id: number; price: string } | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const { data: events, isLoading } = useQuery<any[]>({ queryKey: ["/api/events"] });

  const activeEvent = selectedEventId
    ? events?.find((e: any) => e.id === selectedEventId)
    : events?.find((e: any) => e.status === "active") || events?.[0];

  useEventWebSocket(activeEvent?.id, "organizer");

  const { data: stats } = useQuery<any>({
    queryKey: ["/api/events", activeEvent?.id, "stats"],
    enabled: !!activeEvent,
    refetchInterval: 10000,
  });

  const { data: zones } = useQuery<any[]>({
    queryKey: ["/api/events", activeEvent?.id, "zones"],
    enabled: !!activeEvent,
  });

  const { data: notifs } = useQuery<any[]>({
    queryKey: ["/api/events", activeEvent?.id, "notifications"],
    enabled: !!activeEvent,
  });

  const { data: ticketCategories } = useQuery<any[]>({
    queryKey: ["/api/events", activeEvent?.id, "ticket-categories"],
    queryFn: () =>
      fetch(`/api/events/${activeEvent?.id}/ticket-categories`).then((r) => r.json()),
    enabled: !!activeEvent,
  });

  const { data: eventTickets } = useQuery<any[]>({
    queryKey: ["/api/events", activeEvent?.id, "tickets"],
    queryFn: () => fetch(`/api/events/${activeEvent?.id}/tickets`, { credentials: "include" }).then((r) => r.json()),
    enabled: !!activeEvent,
    refetchInterval: 8000,
  });

  const [seatViewCat, setSeatViewCat] = useState<string | null>(null);

  const createEventMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/events", data);
      return res.json();
    },
    onSuccess: (event) => {
      setCreatedEventId(event.id);
      setStep("categories");
    },
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description: error.message || t("overview.createEventDesc"),
        variant: "destructive",
      });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async ({ eventId, cat }: { eventId: number; cat: CategoryForm }) => {
      const res = await apiRequest("POST", `/api/events/${eventId}/ticket-categories`, {
        name: cat.name,
        zoneType: cat.zoneType,
        price: Number(cat.price),
        capacity: Number(cat.capacity),
        color: ZONE_TYPE_COLORS[cat.zoneType],
        rowCount: Number(cat.rowCount) || 10,
        seatsPerRow: Number(cat.seatsPerRow) || 20,
      });
      return res.json();
    },
  });

  const updatePriceMutation = useMutation({
    mutationFn: async ({ eventId, catId, price }: { eventId: number; catId: number; price: number }) => {
      const res = await apiRequest("PATCH", `/api/events/${eventId}/ticket-categories/${catId}`, { price });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", activeEvent?.id, "ticket-categories"] });
      setEditingPrice(null);
      toast({ title: t("tickets.upgraded"), description: t("overview.ticketPricesDesc") });
    },
    onError: () => {
      toast({ title: t("common.error"), description: t("tickets.upgradeFailedDesc"), variant: "destructive" });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: number) => {
      await apiRequest("DELETE", `/api/events/${eventId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setDeleteDialogOpen(false);
      setDeleteTargetId(null);
      setSelectedEventId(null);
      toast({ title: t("common.delete"), description: t("overview.deleteEvent") });
    },
    onError: () => {
      toast({ title: t("common.error"), description: t("common.error"), variant: "destructive" });
    },
  });

  const handleEventSubmit = () => {
    const { name, description, venueName, date, startTime, endTime, maxCapacity, status } = eventForm;
    if (!name || !description || !venueName || !date || !startTime || !endTime || !maxCapacity) {
      toast({ title: t("common.error"), description: t("overview.createEventDesc"), variant: "destructive" });
      return;
    }
    createEventMutation.mutate({
      name,
      description,
      venue: venueName,
      date: new Date(date).toISOString(),
      startTime,
      endTime,
      maxCapacity: Number(maxCapacity),
      status,
      ...(eventForm.imageUrl ? { imageUrl: eventForm.imageUrl } : {}),
      ...(eventForm.venueAddress ? { address: eventForm.venueAddress } : {}),
    });
  };

  const handleCategoriesSubmit = async () => {
    if (!createdEventId) return;
    const enabledCats = categories.filter((c) => c.name && Number(c.capacity) > 0);
    for (const cat of enabledCats) {
      await createCategoryMutation.mutateAsync({ eventId: createdEventId, cat });
    }
    queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    setCreateDialogOpen(false);
    setStep("event");
    setEventForm(defaultEventForm());
    setCategories(defaultCategories());
    setCreatedEventId(null);
    toast({ title: t("overview.createEvent"), description: t("buy.purchasedDesc") });
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  if (!activeEvent) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <CalendarPlus className="h-12 w-12 text-muted-foreground/30 mx-auto" />
            <div>
              <h2 className="text-xl font-semibold">{t("overview.createFirstTitle")}</h2>
              <p className="text-muted-foreground text-sm mt-1">{t("overview.createFirstDesc")}</p>
            </div>
            <Button
              className="w-full"
              onClick={() => { setCreateDialogOpen(true); setStep("event"); }}
              data-testid="button-create-event"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t("overview.createFirst")}
            </Button>
          </CardContent>
        </Card>
        <CreateEventDialog
          open={createDialogOpen}
          step={step}
          eventForm={eventForm}
          categories={categories}
          isPendingEvent={createEventMutation.isPending}
          isPendingCats={createCategoryMutation.isPending}
          onClose={() => { setCreateDialogOpen(false); setStep("event"); }}
          onEventChange={(f) => setEventForm(f)}
          onCategoriesChange={(c) => setCategories(c)}
          onEventSubmit={handleEventSubmit}
          onCategoriesSubmit={handleCategoriesSubmit}
        />
      </div>
    );
  }

  const ticketStats = stats?.tickets || { total: 0, valid: 0, used: 0, pending: 0 };
  const checkinRate = ticketStats.total > 0
    ? ((ticketStats.used / ticketStats.total) * 100).toFixed(1)
    : "0.0";
  const capacityPct = activeEvent.maxCapacity > 0
    ? (((activeEvent.currentAttendance || 0) / activeEvent.maxCapacity) * 100).toFixed(0)
    : "0";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-organizer-title">
            {t("overview.title")}
          </h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {events && events.length > 1 ? (
              <select
                className="text-sm text-muted-foreground border rounded-md px-2 py-1 bg-background"
                value={selectedEventId ?? activeEvent.id}
                onChange={(e) => setSelectedEventId(Number(e.target.value))}
                data-testid="select-event"
                title={t("overview.title")}
              >
                {events.map((ev: any) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-sm text-muted-foreground">{activeEvent.name}</span>
            )}
            <Badge
              variant="outline"
              className={activeEvent.status === "active" ? "text-[hsl(142,70%,45%)]" : ""}
            >
              {activeEvent.status}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
            className="text-destructive hover:text-destructive"
            data-testid="button-delete-event"
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            {t("overview.deleteEvent")}
          </Button>
          <Button
            onClick={() => { setCreateDialogOpen(true); setStep("event"); }}
            data-testid="button-create-event"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t("overview.newEvent")}
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <h3 className="text-sm font-medium">{t("overview.totalAttendance")}</h3>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-attendance">
              {activeEvent.currentAttendance || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {capacityPct}% {t("overview.ofCapacity")} {activeEvent.maxCapacity}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <h3 className="text-sm font-medium">{t("overview.ticketsSold")}</h3>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-tickets-sold">
              {ticketStats.total}
            </div>
            <p className="text-xs text-muted-foreground">
              {ticketStats.valid} {t("overview.valid")}, {ticketStats.used} {t("overview.scanned")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <h3 className="text-sm font-medium">{t("overview.checkinRate")}</h3>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{checkinRate}%</div>
            <p className="text-xs text-muted-foreground">{ticketStats.used} {t("overview.checkedIn")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <h3 className="text-sm font-medium">{t("overview.activeZones")}</h3>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(zones || []).length}</div>
            <p className="text-xs text-muted-foreground">{t("overview.venueZones")}</p>
          </CardContent>
        </Card>
      </div>

      {ticketCategories && ticketCategories.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <h3 className="font-semibold">{t("overview.ticketPrices")}</h3>
            <p className="text-xs text-muted-foreground">{t("overview.ticketPricesDesc")}</p>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-3">
              {ticketCategories.map((cat: any) => (
                <div key={cat.id} className="border rounded-md p-4 space-y-2" data-testid={`cat-card-${cat.name}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm">{cat.name}</span>
                    <Badge
                      variant="outline"
                      className={cat.zoneType === "vip" ? "border-red-500 text-red-500" : cat.zoneType === "tribune" ? "border-amber-500 text-amber-500" : "border-indigo-500 text-indigo-500"}
                    >
                      {(cat.sold || 0)}/{cat.capacity} {t("tickets.sold")}
                    </Badge>
                  </div>
                  {editingPrice?.id === cat.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={editingPrice!.price}
                        onChange={(e) => setEditingPrice({ id: cat.id, price: e.target.value })}
                        className="h-8 text-sm"
                        data-testid={`input-price-${cat.name}`}
                      />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">MDL</span>
                      <Button
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() =>
                          updatePriceMutation.mutate({
                            eventId: activeEvent.id,
                            catId: cat.id,
                            price: Number(editingPrice!.price),
                          })
                        }
                        disabled={updatePriceMutation.isPending}
                        data-testid={`button-save-price-${cat.name}`}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 shrink-0"
                        onClick={() => setEditingPrice(null)}
                        data-testid={`button-cancel-price-${cat.name}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-lg" data-testid={`price-${cat.name}`}>
                        {cat.price.toFixed(0)} MDL
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingPrice({ id: cat.id, price: String(cat.price) })}
                        data-testid={`button-edit-price-${cat.name}`}
                      >
                        <PenLine className="h-3.5 w-3.5 mr-1" />
                        {t("overview.editPrice")}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Per-category stats + Tribune/VIP seat view */}
      {ticketCategories && ticketCategories.length > 0 && Array.isArray(eventTickets) && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <h3 className="font-semibold">Statistici pe categorii</h3>
                <p className="text-xs text-muted-foreground">Vândute și scanate pe fiecare zonă</p>
              </div>
              <div className="flex gap-1 flex-wrap">
                {ticketCategories
                  .filter((cat: any) => cat.zoneType === "tribune" || cat.zoneType === "vip")
                  .map((cat: any) => (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setSeatViewCat(seatViewCat === cat.name ? null : cat.name)}
                      className={`text-xs px-2 py-1 rounded border transition-colors ${seatViewCat === cat.name ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
                    >
                      {cat.name}
                    </button>
                  ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Category stats table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-xs text-muted-foreground font-medium">Categorie</th>
                    <th className="text-right py-2 text-xs text-muted-foreground font-medium">Capacitate</th>
                    <th className="text-right py-2 text-xs text-muted-foreground font-medium">Vândute</th>
                    <th className="text-right py-2 text-xs text-muted-foreground font-medium">Rămase</th>
                    <th className="text-right py-2 text-xs text-muted-foreground font-medium">
                      <span className="flex items-center justify-end gap-1"><ScanLine className="h-3 w-3" /> Scanate</span>
                    </th>
                    <th className="text-right py-2 text-xs text-muted-foreground font-medium">Venituri</th>
                  </tr>
                </thead>
                <tbody>
                  {ticketCategories.map((cat: any) => {
                    const catTickets = (eventTickets || []).filter((t: any) => t.category === cat.name);
                    const scanned = catTickets.filter((t: any) => t.status === "used").length;
                    const sold = cat.sold || 0;
                    const remaining = cat.capacity - sold;
                    const revenue = catTickets.reduce((s: number, t: any) => s + (t.price || 0), 0);
                    const soldPct = cat.capacity > 0 ? Math.round((sold / cat.capacity) * 100) : 0;
                    const isLow = remaining <= 10;
                    return (
                      <tr key={cat.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                              cat.zoneType === "vip" ? "bg-red-500" : cat.zoneType === "tribune" ? "bg-amber-500" : "bg-indigo-500"
                            }`} />
                            <span className="font-medium">{cat.name}</span>
                          </div>
                          <Progress
                            value={soldPct}
                            className={`mt-1 ml-4 h-1.5 w-24 ${soldPct >= 90 ? "[&>div]:bg-destructive" : soldPct >= 60 ? "[&>div]:bg-amber-500" : "[&>div]:bg-[hsl(142,70%,45%)]"}`}
                          />
                        </td>
                        <td className="py-3 text-right text-muted-foreground">{cat.capacity}</td>
                        <td className="py-3 text-right">
                          <span className="font-semibold">{sold}</span>
                          <span className="text-muted-foreground text-xs ml-1">({soldPct}%)</span>
                        </td>
                        <td className="py-3 text-right">
                          <span className={`font-semibold ${isLow ? "text-destructive" : "text-[hsl(142,70%,45%)]"}`}>
                            {remaining}
                          </span>
                          {isLow && remaining > 0 && (
                            <span className="text-destructive text-xs ml-1">aproape epuizat</span>
                          )}
                          {remaining === 0 && (
                            <span className="text-destructive text-xs ml-1">epuizat</span>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          <span className="font-medium text-[hsl(142,70%,45%)]">{scanned}</span>
                          <span className="text-muted-foreground text-xs ml-1">
                            ({sold > 0 ? Math.round((scanned / sold) * 100) : 0}%)
                          </span>
                        </td>
                        <td className="py-3 text-right font-semibold">{revenue.toFixed(0)} MDL</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Seat view for Tribune / VIP */}
            {seatViewCat && (
              <OrganizerSeatView
                category={seatViewCat}
                capacity={(ticketCategories.find((c: any) => c.name === seatViewCat)?.capacity) || 0}
                tickets={(eventTickets || []).filter((t: any) => t.category === seatViewCat)}
                color={(ticketCategories.find((c: any) => c.name === seatViewCat)?.color) || "#6366f1"}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Analytics charts */}
      {ticketCategories && ticketCategories.length > 0 && Array.isArray(eventTickets) && (
        <OrganizerCharts categories={ticketCategories} tickets={eventTickets} />
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <h3 className="font-semibold">{t("overview.zoneCapacity")}</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            {(zones || []).map((z: any) => {
              const pct = z.capacity > 0 ? ((z.currentOccupancy || 0) / z.capacity) * 100 : 0;
              const barColor = pct >= 90 ? "bg-destructive" : pct >= 70 ? "bg-[hsl(38,90%,55%)]" : "bg-[hsl(142,70%,45%)]";
              return (
                <div key={z.id} className="space-y-1" data-testid={`zone-capacity-${z.id}`}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{z.name}</span>
                    <span className="text-muted-foreground">
                      {z.currentOccupancy || 0}/{z.capacity}
                    </span>
                  </div>
                  <Progress
                    value={Math.min(pct, 100)}
                    className="h-2 bg-muted"
                    indicatorClassName={barColor}
                  />
                </div>
              );
            })}
            {(!zones || zones.length === 0) && (
              <p className="text-sm text-muted-foreground">{t("overview.noZonesConfigured")}</p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h3 className="font-semibold">{t("overview.recentEvents")}</h3>
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
            <p className="text-sm text-muted-foreground">{t("overview.noRecentEvents")}</p>
          )}
        </div>
      </div>

      {/* Delete event confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={(o) => { if (!o) { setDeleteDialogOpen(false); setDeleteTargetId(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("overview.deleteEvent")}</DialogTitle>
            <DialogDescription>{t("overview.confirmDeleteEvent")}</DialogDescription>
          </DialogHeader>
          {/* Event picker */}
          {events && events.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Select event to delete:</p>
              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                {events.map((ev: any) => (
                  <button
                    type="button"
                    key={ev.id}
                    onClick={() => setDeleteTargetId(ev.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-md border text-sm transition-colors ${
                      deleteTargetId === ev.id
                        ? "border-destructive bg-destructive/5 text-destructive"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    <p className="font-medium">{ev.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(ev.date).toLocaleDateString()} · {ev.status}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setDeleteTargetId(null); }}>
              {t("overview.cancelBtn")}
            </Button>
            <Button
              variant="destructive"
              disabled={deleteEventMutation.isPending || !deleteTargetId}
              onClick={() => deleteTargetId && deleteEventMutation.mutate(deleteTargetId)}
              data-testid="button-confirm-delete-event"
            >
              {deleteEventMutation.isPending ? t("overview.deleting") : t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateEventDialog
        open={createDialogOpen}
        step={step}
        eventForm={eventForm}
        categories={categories}
        isPendingEvent={createEventMutation.isPending}
        isPendingCats={createCategoryMutation.isPending}
        onClose={() => { setCreateDialogOpen(false); setStep("event"); }}
        onEventChange={(f) => setEventForm(f)}
        onCategoriesChange={(c) => setCategories(c)}
        onEventSubmit={handleEventSubmit}
        onCategoriesSubmit={handleCategoriesSubmit}
      />
    </div>
  );
}

function ImageUploadField({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      onChange(url);
    } catch {
      toast({ title: "Eroare upload", description: "Nu s-a putut încărca imaginea", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-1.5">
        <ImageIcon className="h-3.5 w-3.5" />
        Poster / imagine
      </label>
      <div className="flex gap-2">
        <Input
          type="url"
          placeholder="https://example.com/poster.jpg"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className="shrink-0"
        >
          {uploading ? "..." : "Upload"}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          aria-label="Upload event poster image"
          title="Upload event poster image"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </div>
      {value && (
        <img
          src={value}
          alt="preview"
          className="h-24 w-full object-cover rounded-md border"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      )}
    </div>
  );
}

function CreateEventDialog({
  open, step, eventForm, categories,
  isPendingEvent, isPendingCats,
  onClose, onEventChange, onCategoriesChange,
  onEventSubmit, onCategoriesSubmit,
}: {
  open: boolean;
  step: "event" | "categories";
  eventForm: EventForm;
  categories: CategoryForm[];
  isPendingEvent: boolean;
  isPendingCats: boolean;
  onClose: () => void;
  onEventChange: (f: EventForm) => void;
  onCategoriesChange: (c: CategoryForm[]) => void;
  onEventSubmit: () => void;
  onCategoriesSubmit: () => void;
}) {
  const { t } = useI18n();

  const updateCat = (idx: number, field: keyof CategoryForm, value: any) => {
    const updated = [...categories];
    updated[idx] = { ...updated[idx], [field]: value };
    onCategoriesChange(updated);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg" data-testid="dialog-create-event">
        <DialogHeader>
          <DialogTitle>
            {step === "event" ? t("overview.createEventTitle") : t("overview.setCategories")}
          </DialogTitle>
          <DialogDescription>
            {step === "event" ? t("overview.createEventDesc") : t("overview.setCategoriesDesc")}
          </DialogDescription>
        </DialogHeader>

        {step === "event" ? (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("overview.eventName")} *</label>
              <Input
                placeholder={t("overview.eventNamePlaceholder")}
                value={eventForm.name}
                onChange={(e) => onEventChange({ ...eventForm, name: e.target.value })}
                data-testid="input-event-name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("overview.descriptionLabel")} *</label>
              <Input
                placeholder={t("overview.descriptionPlaceholder")}
                value={eventForm.description}
                onChange={(e) => onEventChange({ ...eventForm, description: e.target.value })}
                data-testid="input-event-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("overview.venueName")} *</label>
                <Input
                  placeholder={t("overview.venueNamePlaceholder")}
                  value={eventForm.venueName}
                  onChange={(e) => onEventChange({ ...eventForm, venueName: e.target.value })}
                  data-testid="input-venue-name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("overview.venueAddress")}</label>
                <Input
                  placeholder={t("overview.venueAddressPlaceholder")}
                  value={eventForm.venueAddress}
                  onChange={(e) => onEventChange({ ...eventForm, venueAddress: e.target.value })}
                  data-testid="input-venue-address"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("overview.date")} *</label>
                <Input
                  type="date"
                  value={eventForm.date}
                  onChange={(e) => onEventChange({ ...eventForm, date: e.target.value })}
                  data-testid="input-event-date"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("overview.startTime")} *</label>
                <Input
                  type="time"
                  value={eventForm.startTime}
                  onChange={(e) => onEventChange({ ...eventForm, startTime: e.target.value })}
                  data-testid="input-start-time"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("overview.endTime")} *</label>
                <Input
                  type="time"
                  value={eventForm.endTime}
                  onChange={(e) => onEventChange({ ...eventForm, endTime: e.target.value })}
                  data-testid="input-end-time"
                />
              </div>
            </div>
            {/* Image upload */}
            <ImageUploadField
              value={eventForm.imageUrl}
              onChange={(url) => onEventChange({ ...eventForm, imageUrl: url })}
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("overview.maxCapacity")} *</label>
                <Input
                  type="number"
                  placeholder="10000"
                  value={eventForm.maxCapacity}
                  onChange={(e) => onEventChange({ ...eventForm, maxCapacity: e.target.value })}
                  data-testid="input-max-capacity"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("overview.statusLabel")}</label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={eventForm.status}
                  onChange={(e) => onEventChange({ ...eventForm, status: e.target.value as any })}
                  data-testid="select-event-status"
                  title={t("overview.statusLabel")}
                >
                  <option value="active">{t("overview.statusActive")}</option>
                  <option value="draft">{t("overview.statusDraft")}</option>
                </select>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
            <p className="text-xs text-muted-foreground">Adăugați zone — Main, Tribune (203, 204…), VIP (Box A, Box B…)</p>
            {categories.map((cat, idx) => (
              <div key={idx} className="border rounded-md p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${cat.zoneType === "vip" ? "bg-red-500" : cat.zoneType === "tribune" ? "bg-amber-500" : "bg-indigo-500"}`} />
                  <Input
                    value={cat.name}
                    onChange={(e) => updateCat(idx, "name", e.target.value)}
                    className="h-7 text-sm font-medium flex-1"
                    placeholder="Zone name e.g. Tribune 203"
                  />
                  <select
                    value={cat.zoneType}
                    onChange={(e) => updateCat(idx, "zoneType", e.target.value)}
                    className="h-7 text-xs border rounded px-1 bg-background"
                    title="Zone type"
                  >
                    <option value="main">Main</option>
                    <option value="tribune">Tribune</option>
                    <option value="vip">VIP</option>
                  </select>
                  <button type="button" title="Remove zone" aria-label="Remove zone" onClick={() => onCategoriesChange(categories.filter((_, i) => i !== idx))} className="text-muted-foreground hover:text-destructive">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <label className="text-[10px] text-muted-foreground">Preț (MDL)</label>
                    <Input type="number" value={cat.price} onChange={(e) => updateCat(idx, "price", e.target.value)} className="h-7 text-xs" />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[10px] text-muted-foreground">Capacitate</label>
                    <Input type="number" value={cat.capacity} onChange={(e) => updateCat(idx, "capacity", e.target.value)} className="h-7 text-xs" />
                  </div>
                  {cat.zoneType !== "main" && (
                    <>
                      <div className="space-y-0.5">
                        <label className="text-[10px] text-muted-foreground">Rânduri</label>
                        <Input type="number" value={cat.rowCount} onChange={(e) => updateCat(idx, "rowCount", e.target.value)} className="h-7 text-xs" />
                      </div>
                      <div className="space-y-0.5">
                        <label className="text-[10px] text-muted-foreground">Locuri pe rând</label>
                        <Input type="number" value={cat.seatsPerRow} onChange={(e) => updateCat(idx, "seatsPerRow", e.target.value)} className="h-7 text-xs" />
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => onCategoriesChange([...categories, { name: "", zoneType: "tribune", price: "100", capacity: "100", rowCount: "5", seatsPerRow: "20" }])}
            >
              <Plus className="h-4 w-4 mr-1" /> Adaugă zonă
            </Button>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="button-cancel-event">
            {t("overview.cancelBtn")}
          </Button>
          {step === "event" ? (
            <Button
              onClick={onEventSubmit}
              disabled={isPendingEvent}
              data-testid="button-next-categories"
            >
              {isPendingEvent ? t("overview.creating") : t("overview.nextStep")}
            </Button>
          ) : (
            <Button
              onClick={onCategoriesSubmit}
              disabled={isPendingCats}
              data-testid="button-finish-event"
            >
              {isPendingCats ? t("overview.saving") : t("overview.createEvent")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const ZONE_CHART_COLORS: Record<string, string> = {
  main: "#6366f1",
  tribune: "#f59e0b",
  vip: "#ef4444",
};

function OrganizerCharts({ categories, tickets }: { categories: any[]; tickets: any[] }) {
  const barData = useMemo(() =>
    categories.map((cat: any) => ({
      name: cat.name,
      sold: cat.sold || 0,
      capacity: cat.capacity,
      revenue: tickets
        .filter((t: any) => t.zone === cat.name || t.category === cat.name)
        .reduce((s: number, t: any) => s + (t.price || 0), 0),
    })),
    [categories, tickets]
  );

  const scanned = tickets.filter((t: any) => t.status === "used").length;
  const pending = tickets.filter((t: any) => t.status === "valid").length;
  const totalSold = tickets.length;
  const pieData = totalSold > 0
    ? [
        { name: "Scanned", value: scanned },
        { name: "Not yet", value: pending },
      ]
    : [{ name: "No tickets", value: 1 }];
  const PIE_COLORS = ["hsl(142 70% 45%)", "hsl(var(--muted))"];

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Bar chart: tickets sold & revenue per zone */}
      <Card>
        <CardHeader className="pb-2">
          <h3 className="font-semibold text-sm">Vânzări pe zone</h3>
          <p className="text-xs text-muted-foreground">Numărul de bilete vândute pe fiecare categorie</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 6 }}
                formatter={(v: any, n: string) => [v, n === "sold" ? "Sold" : "Capacity"]}
              />
              <Bar dataKey="sold" name="sold" radius={[4, 4, 0, 0]}>
                {barData.map((entry, idx) => (
                  <Cell key={idx} fill={ZONE_CHART_COLORS[categories[idx]?.zoneType || "main"] || "#6366f1"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Pie chart: check-in rate */}
      <Card>
        <CardHeader className="pb-2">
          <h3 className="font-semibold text-sm">Rată check-in</h3>
          <p className="text-xs text-muted-foreground">Scanate din biletele vândute</p>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={totalSold > 0 ? 3 : 0}
                dataKey="value"
              >
                {pieData.map((_, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any) => [`${v} tickets`]} contentStyle={{ fontSize: 12, borderRadius: 6 }} />
              <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

const ROWS_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M"];
const SEATS_PER_ROW = 20;

function OrganizerSeatView({
  category, capacity, tickets, color,
}: {
  category: string; capacity: number; tickets: any[]; color: string;
}) {
  const isVip = category === "VIP";
  const seatsPerRow = isVip ? 10 : Math.min(SEATS_PER_ROW, Math.ceil(Math.sqrt(capacity * 2)));
  const rows = Math.ceil(Math.min(capacity, isVip ? 100 : capacity) / seatsPerRow);

  const takenSet = new Set(
    tickets
      .filter((t: any) => t.status !== "invalid" && t.seat)
      .map((t: any) => t.seat as string),
  );

  const usedSet = new Set(
    tickets
      .filter((t: any) => t.status === "used" && t.seat)
      .map((t: any) => t.seat as string),
  );

  const accentClass = isVip ? "bg-red-400" : "bg-amber-400";
  const scannedClass = isVip ? "bg-red-700" : "bg-amber-700";

  return (
    <div className="space-y-3 border-t pt-4">
      <div className="flex items-center justify-between text-sm">
        <p className="font-medium">{category} — locuri</p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className={`w-3 h-3 rounded-full ${accentClass}`} /> Ocupat</span>
          <span className="flex items-center gap-1"><span className={`w-3 h-3 rounded-full ${scannedClass}`} /> Intrat</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-muted border" /> Liber</span>
        </div>
      </div>
      <div className="border rounded-lg overflow-auto max-h-60 p-3">
        <div className="text-center text-xs text-muted-foreground pb-2 mb-2 border-b">── SCENĂ ──</div>
        <div className="space-y-1">
          {Array.from({ length: rows }, (_, rowIdx) => {
            const rowLabel = ROWS_LABELS[rowIdx] ?? `R${rowIdx + 1}`;
            const seatsInRow = Math.min(seatsPerRow, capacity - rowIdx * seatsPerRow);
            if (seatsInRow <= 0) return null;
            return (
              <div key={rowIdx} className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground w-5 shrink-0 text-right">{rowLabel}</span>
                <div className="flex gap-1">
                  {Array.from({ length: seatsInRow }, (_, seatIdx) => {
                    const label = `Row ${rowLabel}, Seat ${seatIdx + 1}`;
                    const isTaken = takenSet.has(label);
                    const isScanned = usedSet.has(label);
                    return (
                      <span
                        key={seatIdx}
                        title={label}
                        className={`w-4 h-4 rounded-full shrink-0 ${
                          isScanned ? scannedClass : isTaken ? accentClass : "bg-muted border"
                        }`}
                      />
                    );
                  })}
                </div>
                <span className="text-[10px] text-muted-foreground w-5 shrink-0">{rowLabel}</span>
              </div>
            );
          })}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {takenSet.size} ocupat · {usedSet.size} intrat · {capacity - takenSet.size} liber
      </p>
    </div>
  );
}
