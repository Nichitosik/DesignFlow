import { VenueMap } from "@/components/VenueMap";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database } from "lucide-react";

export default function SpectatorMap() {
  const [activeZone, setActiveZone] = useState<string>();

  const { data: events, isLoading } = useQuery<any[]>({ queryKey: ["/api/events"] });
  const activeEvent = events?.find((e: any) => e.status === "active") || events?.[0];

  const { data: zones, isLoading: zonesLoading } = useQuery<any[]>({
    queryKey: ["/api/events", activeEvent?.id, "zones"],
    enabled: !!activeEvent,
  });

  const seedMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/seed"),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/events"] }); },
  });

  if (isLoading) return <div className="p-6"><Skeleton className="h-[500px]" /></div>;

  if (!activeEvent) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <h2 className="text-xl font-semibold">No Events Yet</h2>
            <p className="text-muted-foreground text-sm">Create demo data to see the venue map.</p>
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

  const mappedZones = (zones || []).map((z: any) => ({
    id: String(z.id),
    name: z.name,
    x: z.x,
    y: z.y,
    capacity: z.capacity,
    current: z.currentOccupancy || 0,
    type: z.type,
  }));

  return (
    <div className="p-6 space-y-4 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-map-title">Venue Map</h1>
        <p className="text-muted-foreground text-sm">{activeEvent.name} - {activeEvent.venue}</p>
      </div>
      {zonesLoading ? <Skeleton className="h-[500px]" /> : (
        <VenueMap zones={mappedZones} activeZone={activeZone} onZoneClick={setActiveZone} />
      )}
    </div>
  );
}
