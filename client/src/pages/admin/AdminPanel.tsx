import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import {
  Users, CalendarDays, Ticket, TrendingUp,
  Trash2, ShieldCheck, AlertTriangle, Search,
} from "lucide-react";

type EventStatus = "draft" | "active" | "completed" | "cancelled";

interface AdminStats {
  totalUsers: number;
  totalEvents: number;
  totalTickets: number;
  totalRevenue: number;
}

interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
}

interface Event {
  id: number;
  name: string;
  date: string;
  status: EventStatus;
  venue: string;
  maxCapacity: number;
  currentAttendance: number | null;
}

const STATUS_COLORS: Record<EventStatus, string> = {
  active:    "bg-[hsl(142,70%,45%)] text-white border-0",
  draft:     "bg-muted text-muted-foreground",
  completed: "bg-[hsl(200,80%,50%)] text-white border-0",
  cancelled: "bg-[hsl(0,80%,55%)] text-white border-0",
};

export default function AdminPanel() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [deletingEventId, setDeletingEventId] = useState<number | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [eventSearch, setEventSearch] = useState("");
  // Track locally updated statuses so select stays controlled
  const [localStatuses, setLocalStatuses] = useState<Record<number, EventStatus>>({});

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: events, isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      apiRequest("PATCH", `/api/admin/users/${userId}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Rol actualizat" });
    },
    onError: () => toast({ title: "Eroare", description: "Nu s-a putut actualiza rolul.", variant: "destructive" }),
  });

  const updateEventStatusMutation = useMutation({
    mutationFn: ({ eventId, status }: { eventId: number; status: string }) =>
      apiRequest("PATCH", `/api/admin/events/${eventId}/status`, { status }),
    onSuccess: (_data, vars) => {
      setLocalStatuses(prev => ({ ...prev, [vars.eventId]: vars.status as EventStatus }));
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({ title: "Status actualizat" });
    },
    onError: () => toast({ title: "Eroare", description: "Nu s-a putut actualiza statusul.", variant: "destructive" }),
  });

  const deleteEventMutation = useMutation({
    mutationFn: (eventId: number) => apiRequest("DELETE", `/api/admin/events/${eventId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setDeletingEventId(null);
      toast({ title: "Eveniment șters" });
    },
    onError: () => toast({ title: "Eroare", description: "Nu s-a putut șterge evenimentul.", variant: "destructive" }),
  });

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    const q = userSearch.toLowerCase();
    return q
      ? users.filter(u =>
          u.email?.toLowerCase().includes(q) ||
          u.firstName?.toLowerCase().includes(q) ||
          u.lastName?.toLowerCase().includes(q)
        )
      : users;
  }, [users, userSearch]);

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    const q = eventSearch.toLowerCase();
    return q
      ? events.filter(e => e.name.toLowerCase().includes(q) || e.venue.toLowerCase().includes(q))
      : events;
  }, [events, eventSearch]);

  const statCards = [
    { label: t("admin.totalUsers"),   value: stats?.totalUsers   ?? 0,                          icon: Users,       color: "text-[hsl(200,80%,50%)]" },
    { label: t("admin.totalEvents"),  value: stats?.totalEvents  ?? 0,                          icon: CalendarDays, color: "text-primary" },
    { label: t("admin.totalTickets"), value: stats?.totalTickets ?? 0,                          icon: Ticket,      color: "text-[hsl(142,70%,45%)]" },
    { label: t("admin.totalRevenue"), value: `${(stats?.totalRevenue ?? 0).toFixed(0)} MDL`,    icon: TrendingUp,  color: "text-[hsl(38,90%,55%)]" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-admin-title">
          <ShieldCheck className="h-6 w-6 text-primary" />
          {t("admin.title")}
        </h1>
        <p className="text-muted-foreground text-sm">{t("admin.subtitle")}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
          : statCards.map((s) => (
              <Card key={s.label}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">{s.label}</span>
                    <s.icon className={`h-4 w-4 ${s.color}`} />
                  </div>
                  <p className="text-2xl font-bold">{s.value}</p>
                </CardContent>
              </Card>
            ))}
      </div>

      <Tabs defaultValue="events">
        <TabsList>
          <TabsTrigger value="events" data-testid="tab-events">{t("admin.events")}</TabsTrigger>
          <TabsTrigger value="users" data-testid="tab-users">{t("admin.users")}</TabsTrigger>
        </TabsList>

        {/* Events tab */}
        <TabsContent value="events" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h3 className="font-semibold">{t("admin.manageEvents")}</h3>
                <div className="relative w-56">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Caută evenimente..."
                    value={eventSearch}
                    onChange={(e) => setEventSearch(e.target.value)}
                    className="h-8 pl-8 text-xs"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {eventsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
                </div>
              ) : !filteredEvents.length ? (
                <p className="text-muted-foreground text-sm text-center py-8">
                  {eventSearch ? `Niciun eveniment pentru "${eventSearch}"` : t("admin.noEvents")}
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredEvents.map((event) => {
                    const currentStatus = localStatuses[event.id] ?? event.status;
                    return (
                      <div
                        key={event.id}
                        className="flex items-center justify-between gap-4 p-3 rounded-lg border"
                        data-testid={`event-row-${event.id}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <Badge className={`text-xs capitalize ${STATUS_COLORS[currentStatus]}`}>
                              {currentStatus}
                            </Badge>
                            <p className="text-sm font-medium truncate">{event.name}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {event.venue} · {new Date(event.date).toLocaleDateString()} · {event.maxCapacity} locuri
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Select
                            value={currentStatus}
                            onValueChange={(status) =>
                              updateEventStatusMutation.mutate({ eventId: event.id, status })
                            }
                            disabled={updateEventStatusMutation.isPending}
                          >
                            <SelectTrigger className="w-32 h-8 text-xs" data-testid={`select-status-${event.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="active">Activ</SelectItem>
                              <SelectItem value="completed">Finalizat</SelectItem>
                              <SelectItem value="cancelled">Anulat</SelectItem>
                            </SelectContent>
                          </Select>
                          {deletingEventId === event.id ? (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-destructive">{t("admin.confirmDelete")}</span>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-7 px-2 text-xs"
                                onClick={() => deleteEventMutation.mutate(event.id)}
                                disabled={deleteEventMutation.isPending}
                                data-testid={`button-confirm-delete-${event.id}`}
                              >
                                {t("common.delete")}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs"
                                onClick={() => setDeletingEventId(null)}
                              >
                                {t("common.close")}
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeletingEventId(event.id)}
                              data-testid={`button-delete-event-${event.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users tab */}
        <TabsContent value="users" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h3 className="font-semibold">{t("admin.manageUsers")}</h3>
                <div className="relative w-56">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Caută utilizatori..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="h-8 pl-8 text-xs"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : !filteredUsers.length ? (
                <p className="text-muted-foreground text-sm text-center py-8">
                  {userSearch ? `Niciun utilizator pentru "${userSearch}"` : t("admin.noUsers")}
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredUsers.map((user) => {
                    const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || user.id.slice(0, 8);
                    return (
                      <div
                        key={user.id}
                        className="flex items-center justify-between gap-4 p-3 rounded-lg border"
                        data-testid={`user-row-${user.id}`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{name}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email || user.id}</p>
                        </div>
                        <Select
                          value={user.role || "spectator"}
                          onValueChange={(role) => updateRoleMutation.mutate({ userId: user.id, role })}
                          disabled={updateRoleMutation.isPending}
                        >
                          <SelectTrigger className="w-36 h-8 text-xs" data-testid={`select-role-${user.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="spectator">{t("role.spectator")}</SelectItem>
                            <SelectItem value="staff">{t("role.staff")}</SelectItem>
                            <SelectItem value="organizer">{t("role.organizer")}</SelectItem>
                            <SelectItem value="admin">{t("role.admin")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="border-[hsl(38,90%,55%)] bg-[hsl(38,90%,55%)]/5">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-[hsl(38,90%,55%)] shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">{t("admin.warning")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
