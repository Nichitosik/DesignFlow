import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { NotificationCard } from "@/components/NotificationCard";
import {
  Users, Ticket, TrendingUp, AlertTriangle, Plus, CalendarPlus, PenLine, Check, X,
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
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const CATEGORY_COLORS: Record<string, string> = {
  Main: "#6366f1",
  Tribuna: "#f59e0b",
  VIP: "#ef4444",
};

interface CategoryForm {
  name: "Main" | "Tribuna" | "VIP";
  price: string;
  capacity: string;
  enabled: boolean;
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
});

const defaultCategories = (): CategoryForm[] => [
  { name: "Main", price: "50", capacity: "5000", enabled: true },
  { name: "Tribuna", price: "120", capacity: "2000", enabled: true },
  { name: "VIP", price: "250", capacity: "500", enabled: true },
];

export default function OrganizerOverview() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [step, setStep] = useState<"event" | "categories">("event");
  const [eventForm, setEventForm] = useState<EventForm>(defaultEventForm());
  const [categories, setCategories] = useState<CategoryForm[]>(defaultCategories());
  const [createdEventId, setCreatedEventId] = useState<number | null>(null);
  const [editingPrice, setEditingPrice] = useState<{ id: number; price: string } | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

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
        title: "Failed to create event",
        description: error.message || "Please check the form and try again.",
        variant: "destructive",
      });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async ({ eventId, cat }: { eventId: number; cat: CategoryForm }) => {
      const res = await apiRequest("POST", `/api/events/${eventId}/ticket-categories`, {
        name: cat.name,
        price: Number(cat.price),
        capacity: Number(cat.capacity),
        color: CATEGORY_COLORS[cat.name],
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
      toast({ title: "Price Updated", description: "Ticket price updated and broadcast to all users." });
    },
    onError: () => {
      toast({ title: "Update Failed", description: "Could not update price. Please try again.", variant: "destructive" });
    },
  });

  const handleEventSubmit = () => {
    const { name, description, venueName, venueAddress, date, startTime, endTime, maxCapacity, status } = eventForm;
    if (!name || !description || !venueName || !date || !startTime || !endTime || !maxCapacity) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
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
    });
  };

  const handleCategoriesSubmit = async () => {
    if (!createdEventId) return;
    const enabledCats = categories.filter((c) => c.enabled);
    for (const cat of enabledCats) {
      await createCategoryMutation.mutateAsync({ eventId: createdEventId, cat });
    }
    queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    setCreateDialogOpen(false);
    setStep("event");
    setEventForm(defaultEventForm());
    setCategories(defaultCategories());
    setCreatedEventId(null);
    toast({ title: "Event Created!", description: "Your event is live and ready for ticket sales." });
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
              <h2 className="text-xl font-semibold">No Events Yet</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Create your first event to start selling tickets and managing attendance.
              </p>
            </div>
            <Button
              className="w-full"
              onClick={() => { setCreateDialogOpen(true); setStep("event"); }}
              data-testid="button-create-event"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First Event
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
        <Button
          onClick={() => { setCreateDialogOpen(true); setStep("event"); }}
          data-testid="button-create-event"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Event
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <h3 className="text-sm font-medium">Total Attendance</h3>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-attendance">
              {activeEvent.currentAttendance || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {capacityPct}% of {activeEvent.maxCapacity} capacity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <h3 className="text-sm font-medium">Tickets Sold</h3>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-tickets-sold">
              {ticketStats.total}
            </div>
            <p className="text-xs text-muted-foreground">
              {ticketStats.valid} valid, {ticketStats.used} scanned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <h3 className="text-sm font-medium">Check-in Rate</h3>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{checkinRate}%</div>
            <p className="text-xs text-muted-foreground">{ticketStats.used} checked in</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <h3 className="text-sm font-medium">Active Zones</h3>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(zones || []).length}</div>
            <p className="text-xs text-muted-foreground">venue zones configured</p>
          </CardContent>
        </Card>
      </div>

      {ticketCategories && ticketCategories.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <h3 className="font-semibold">Ticket Prices</h3>
            <p className="text-xs text-muted-foreground">
              Update prices in real time — changes sync instantly to all users
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-3">
              {ticketCategories.map((cat: any) => (
                <div key={cat.id} className="border rounded-md p-4 space-y-2" data-testid={`cat-card-${cat.name}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm">{cat.name}</span>
                    <Badge variant="outline" style={{ borderColor: cat.color, color: cat.color }}>
                      {(cat.sold || 0)}/{cat.capacity} sold
                    </Badge>
                  </div>
                  {editingPrice?.id === cat.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={editingPrice.price}
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
                            price: Number(editingPrice.price),
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
                        Edit
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <h3 className="font-semibold">Zone Capacity Overview</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            {(zones || []).map((z: any) => {
              const pct = z.capacity > 0 ? ((z.currentOccupancy || 0) / z.capacity) * 100 : 0;
              const color =
                pct >= 90
                  ? "hsl(0,80%,55%)"
                  : pct >= 70
                  ? "hsl(38,90%,55%)"
                  : "hsl(142,70%,45%)";
              return (
                <div key={z.id} className="space-y-1" data-testid={`zone-capacity-${z.id}`}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{z.name}</span>
                    <span className="text-muted-foreground">
                      {z.currentOccupancy || 0}/{z.capacity}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
            {(!zones || zones.length === 0) && (
              <p className="text-sm text-muted-foreground">No zones configured.</p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h3 className="font-semibold">Recent Events</h3>
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
            <p className="text-sm text-muted-foreground">No recent events.</p>
          )}
        </div>
      </div>

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
            {step === "event" ? "Create New Event" : "Set Ticket Categories"}
          </DialogTitle>
          <DialogDescription>
            {step === "event"
              ? "Fill in the event details. You can add ticket categories in the next step."
              : "Configure ticket categories, prices, and capacities for your event."}
          </DialogDescription>
        </DialogHeader>

        {step === "event" ? (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-2">
              <label className="text-sm font-medium">Event Name *</label>
              <Input
                placeholder="e.g. Summer Music Festival 2025"
                value={eventForm.name}
                onChange={(e) => onEventChange({ ...eventForm, name: e.target.value })}
                data-testid="input-event-name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description *</label>
              <Input
                placeholder="Brief description of the event"
                value={eventForm.description}
                onChange={(e) => onEventChange({ ...eventForm, description: e.target.value })}
                data-testid="input-event-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Venue Name *</label>
                <Input
                  placeholder="e.g. Chișinău Arena"
                  value={eventForm.venueName}
                  onChange={(e) => onEventChange({ ...eventForm, venueName: e.target.value })}
                  data-testid="input-venue-name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Venue Address</label>
                <Input
                  placeholder="e.g. Str. Independenței 12"
                  value={eventForm.venueAddress}
                  onChange={(e) => onEventChange({ ...eventForm, venueAddress: e.target.value })}
                  data-testid="input-venue-address"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date *</label>
                <Input
                  type="date"
                  value={eventForm.date}
                  onChange={(e) => onEventChange({ ...eventForm, date: e.target.value })}
                  data-testid="input-event-date"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Time *</label>
                <Input
                  type="time"
                  value={eventForm.startTime}
                  onChange={(e) => onEventChange({ ...eventForm, startTime: e.target.value })}
                  data-testid="input-start-time"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Time *</label>
                <Input
                  type="time"
                  value={eventForm.endTime}
                  onChange={(e) => onEventChange({ ...eventForm, endTime: e.target.value })}
                  data-testid="input-end-time"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Max Capacity *</label>
                <Input
                  type="number"
                  placeholder="10000"
                  value={eventForm.maxCapacity}
                  onChange={(e) => onEventChange({ ...eventForm, maxCapacity: e.target.value })}
                  data-testid="input-max-capacity"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={eventForm.status}
                  onChange={(e) => onEventChange({ ...eventForm, status: e.target.value as any })}
                  data-testid="select-event-status"
                >
                  <option value="active">Active (selling)</option>
                  <option value="draft">Draft (hidden)</option>
                </select>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            <p className="text-xs text-muted-foreground">
              Enable the ticket categories you want to offer. Each category corresponds to a zone in the venue.
            </p>
            {categories.map((cat, idx) => (
              <div key={cat.name} className="border rounded-md p-4 space-y-3" data-testid={`cat-form-${cat.name}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={cat.enabled}
                      onChange={(e) => updateCat(idx, "enabled", e.target.checked)}
                      id={`cat-enable-${cat.name}`}
                      data-testid={`checkbox-cat-${cat.name}`}
                    />
                    <label htmlFor={`cat-enable-${cat.name}`} className="font-medium text-sm cursor-pointer">
                      {cat.name}
                    </label>
                  </div>
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLORS[cat.name] }}
                  />
                </div>
                {cat.enabled && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Price (MDL)</label>
                      <Input
                        type="number"
                        value={cat.price}
                        onChange={(e) => updateCat(idx, "price", e.target.value)}
                        className="h-8 text-sm"
                        data-testid={`input-cat-price-${cat.name}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Capacity</label>
                      <Input
                        type="number"
                        value={cat.capacity}
                        onChange={(e) => updateCat(idx, "capacity", e.target.value)}
                        className="h-8 text-sm"
                        data-testid={`input-cat-capacity-${cat.name}`}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="button-cancel-event">
            Cancel
          </Button>
          {step === "event" ? (
            <Button
              onClick={onEventSubmit}
              disabled={isPendingEvent}
              data-testid="button-next-categories"
            >
              {isPendingEvent ? "Creating..." : "Next: Set Ticket Prices"}
            </Button>
          ) : (
            <Button
              onClick={onCategoriesSubmit}
              disabled={isPendingCats}
              data-testid="button-finish-event"
            >
              {isPendingCats ? "Saving..." : "Create Event"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
