import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Check, Database, MapPin, Calendar, Clock } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import InteractiveArenaMap, { ArenaCategory } from "@/components/InteractiveArenaMap";
import SeatPickerGrid from "@/components/SeatPickerGrid";

const needsSeats = (cat: ArenaCategory | null) =>
  !!cat && (cat.zoneType === "tribune" || cat.zoneType === "vip" || /vip|tribun/i.test(cat.name));

export default function SpectatorMap() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [buyCategory, setBuyCategory] = useState<ArenaCategory | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);

  const { data: events, isLoading } = useQuery<any[]>({ queryKey: ["/api/events"] });
  const activeEvent = events?.find((e: any) => e.status === "active") || events?.[0];

  const { data: availability, isLoading: availLoading } = useQuery<ArenaCategory[]>({
    queryKey: ["/api/events", activeEvent?.id, "ticket-availability"],
    queryFn: () =>
      fetch(`/api/events/${activeEvent?.id}/ticket-availability`).then((r) => r.json()),
    enabled: !!activeEvent?.id,
    refetchInterval: 10000,
  });

  // Fetch taken seats when buying Tribune or VIP
  const { data: seatsData } = useQuery<{ takenSeats: string[] }>({
    queryKey: ["/api/events", activeEvent?.id, "seats", buyCategory?.name],
    queryFn: () =>
      fetch(`/api/events/${activeEvent?.id}/seats/${buyCategory?.name}`).then((r) => r.json()),
    enabled: !!activeEvent?.id && needsSeats(buyCategory),
    refetchInterval: 5000,
  });

  const seedMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/seed"),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/events"] }); },
  });

  const purchaseMutation = useMutation({
    mutationFn: async ({ eventId, category, seat }: { eventId: number; category: string; seat?: string }) => {
      const res = await apiRequest("POST", `/api/events/${eventId}/tickets`, { category, seat });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events", activeEvent?.id, "ticket-availability"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events", activeEvent?.id, "seats", buyCategory?.name] });
      setBuyCategory(null);
      setSelectedSeat(null);
      toast({ title: t("buy.purchased"), description: `${t("buy.purchasedDesc")} (${data.category}${data.seat ? `, ${data.seat}` : ""})` });
    },
    onError: (error: any) => {
      toast({ title: t("buy.failed"), description: error.message || t("buy.failedDesc"), variant: "destructive" });
    },
  });

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });

  const needsSeatPicker = needsSeats(buyCategory);
  const canConfirm = !needsSeatPicker || !!selectedSeat;

  if (isLoading) return <div className="p-6"><Skeleton className="h-[500px]" /></div>;

  if (!activeEvent) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <h2 className="text-xl font-semibold">{t("common.noEvents")}</h2>
            <p className="text-muted-foreground text-sm">{t("map.noEventDesc")}</p>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
              data-testid="button-seed-data"
            >
              <Database className="h-4 w-4 mr-2" />
              {seedMutation.isPending ? t("common.loading") : t("tickets.createDemo")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Event info header */}
      <Card>
        <CardContent className="p-5">
          {activeEvent.imageUrl && (
            <div className="rounded-lg overflow-hidden mb-4 -mx-1">
              <img src={activeEvent.imageUrl} alt={activeEvent.name} className="w-full max-h-48 object-cover" />
            </div>
          )}
          <h1 className="text-2xl font-bold mb-1" data-testid="text-map-title">{activeEvent.name}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-2">
            {activeEvent.venue && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 shrink-0" />
                {activeEvent.venue}
              </span>
            )}
            {activeEvent.date && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 shrink-0" />
                {formatDate(activeEvent.date)}
              </span>
            )}
            {activeEvent.startTime && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 shrink-0" />
                {activeEvent.startTime}
              </span>
            )}
          </div>
          {activeEvent.description && (
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
              {activeEvent.description}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Interactive arena map */}
      <div>
        <h2 className="text-base font-semibold mb-3">{t("map.title")}</h2>
        {availLoading ? (
          <Skeleton className="h-[420px]" />
        ) : availability && availability.length > 0 ? (
          <InteractiveArenaMap
            categories={availability}
            onCategoryClick={(cat) => { setBuyCategory(cat); setSelectedSeat(null); }}
          />
        ) : (
          <div className="border rounded-lg p-8 text-center text-muted-foreground">
            No ticket categories available
          </div>
        )}
      </div>

      {/* Buy dialog */}
      <Dialog open={!!buyCategory} onOpenChange={(o) => { if (!o) { setBuyCategory(null); setSelectedSeat(null); } }}>
        <DialogContent className={needsSeatPicker ? "max-w-2xl" : "max-w-sm"} data-testid="buy-dialog">
          <DialogHeader>
            <DialogTitle>{t("buy.confirmTitle")}</DialogTitle>
            <DialogDescription>{t("buy.confirmDesc")} {activeEvent.name}.</DialogDescription>
          </DialogHeader>
          {buyCategory && (
            <div className="space-y-4">
              {/* Event summary */}
              <div className="border rounded-md p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{buyCategory.name} Ticket</span>
                  <Badge variant="outline">{buyCategory.price.toFixed(0)} MDL</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{activeEvent.name}</p>
                {activeEvent.date && (
                  <p className="text-xs text-muted-foreground">
                    {formatDate(activeEvent.date)}
                    {activeEvent.startTime && ` · ${activeEvent.startTime}`}
                  </p>
                )}
                {activeEvent.venue && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {activeEvent.venue}
                  </p>
                )}
              </div>

              {/* Seat picker for Tribune/VIP */}
              {needsSeatPicker && buyCategory && (
                <SeatPickerGrid
                  category={buyCategory.name}
                  zoneType={buyCategory.zoneType}
                  capacity={buyCategory.capacity}
                  price={buyCategory.price}
                  eventId={activeEvent.id}
                  takenSeats={seatsData?.takenSeats || []}
                  selectedSeat={selectedSeat}
                  onSelectSeat={setSelectedSeat}
                />
              )}

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("buy.availableSeats")}</span>
                <span className="font-medium">{buyCategory.available} seats</span>
              </div>
              <div className="flex items-center justify-between text-sm border-t pt-3">
                <span className="font-semibold">{t("buy.total")}</span>
                <span className="font-bold text-lg">{buyCategory.price.toFixed(0)} MDL</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setBuyCategory(null); setSelectedSeat(null); }}
              data-testid="button-cancel-buy"
            >
              {t("buy.cancel")}
            </Button>
            <Button
              disabled={purchaseMutation.isPending || !canConfirm}
              onClick={() => {
                if (buyCategory && activeEvent) {
                  purchaseMutation.mutate({
                    eventId: activeEvent.id,
                    category: buyCategory.name,
                    ...(selectedSeat ? { seat: selectedSeat } : {}),
                  });
                }
              }}
              data-testid="button-confirm-buy"
            >
              <Check className="h-4 w-4 mr-1.5" />
              {purchaseMutation.isPending
                ? t("buy.processing")
                : needsSeatPicker && !selectedSeat
                ? "Select a seat"
                : t("buy.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
