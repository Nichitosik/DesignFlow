import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Sparkles, Loader2, CheckCircle2, Users, Shield, Car, Zap, RefreshCw } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

const recTypeConfig: Record<string, { icon: any; color: string; label: string }> = {
  crowd_flow: { icon: Users, color: "hsl(260 80% 50%)", label: "Crowd Flow" },
  safety: { icon: Shield, color: "hsl(0 80% 55%)", label: "Safety" },
  parking: { icon: Car, color: "hsl(200 80% 50%)", label: "Parking" },
  capacity: { icon: Zap, color: "hsl(38 90% 55%)", label: "Capacity" },
  general: { icon: Brain, color: "hsl(142 70% 45%)", label: "General" },
};

export default function OrganizerAI() {
  const { t } = useI18n();
  const { toast } = useToast();

  const { data: events, isLoading } = useQuery<any[]>({ queryKey: ["/api/events"] });
  const activeEvent = events?.find((e: any) => e.status === "active") || events?.[0];

  const { data: stats } = useQuery<any>({
    queryKey: ["/api/events", activeEvent?.id, "stats"],
    enabled: !!activeEvent,
    refetchInterval: 15000,
  });

  const { data: recommendations, isLoading: recsLoading } = useQuery<any[]>({
    queryKey: ["/api/events", activeEvent?.id, "recommendations"],
    enabled: !!activeEvent,
  });

  const generateRecsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/events/${activeEvent.id}/recommendations/generate`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "AI Recommendations Generated", description: "New crowd flow recommendations are ready based on live data." });
      queryClient.invalidateQueries({ queryKey: ["/api/events", activeEvent?.id, "recommendations"] });
    },
    onError: (error: any) => {
      toast({ title: "Generation Failed", description: error.message, variant: "destructive" });
    },
  });

  const applyRecMutation = useMutation({
    mutationFn: async (recId: number) => {
      const res = await apiRequest("PATCH", `/api/recommendations/${recId}/apply`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", activeEvent?.id, "recommendations"] });
      toast({ title: "Recommendation Applied" });
    },
  });

  if (isLoading) return <div className="p-6"><Skeleton className="h-64" /></div>;

  if (!activeEvent) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Brain className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <h2 className="text-lg font-semibold mb-1">No Events Found</h2>
            <p className="text-sm text-muted-foreground">
              Create an event from the Overview page first, then return here to generate AI recommendations.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const ticketStats = stats?.tickets || { total: 0, used: 0 };
  const appliedCount = (recommendations || []).filter((r: any) => r.applied).length;
  const pendingCount = (recommendations || []).filter((r: any) => !r.applied).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-ai-title">{t("ai.title")}</h1>
          <p className="text-muted-foreground text-sm">GPT-5 powered crowd flow optimization</p>
        </div>
        <Button
          onClick={() => generateRecsMutation.mutate()}
          disabled={generateRecsMutation.isPending}
          data-testid="button-generate-recommendations"
        >
          {generateRecsMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          {generateRecsMutation.isPending ? "Analyzing Live Data..." : "Generate Recommendations"}
        </Button>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs text-muted-foreground">Total Insights</span>
              <Brain className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-bold">{(recommendations || []).length}</p>
            <p className="text-xs text-muted-foreground">recommendations generated</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs text-muted-foreground">Applied</span>
              <CheckCircle2 className="h-4 w-4 text-[hsl(142,70%,45%)]" />
            </div>
            <p className="text-2xl font-bold text-[hsl(142,70%,45%)]">{appliedCount}</p>
            <p className="text-xs text-muted-foreground">recommendations implemented</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs text-muted-foreground">Pending Review</span>
              <RefreshCw className="h-4 w-4 text-[hsl(38,90%,55%)]" />
            </div>
            <p className="text-2xl font-bold text-[hsl(38,90%,55%)]">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">awaiting action</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-semibold">AI Recommendations</h3>
              <p className="text-xs text-muted-foreground">Based on live event data - {ticketStats.used} checked in, {ticketStats.total} total tickets</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {(recommendations || []).map((rec: any) => {
            const config = recTypeConfig[rec.type] || recTypeConfig.general;
            const IconComp = config.icon;

            return (
              <div key={rec.id} className={`p-4 rounded-md border transition-all ${rec.applied ? "bg-muted/50 border-muted" : "border-primary/20"}`} data-testid={`recommendation-${rec.id}`}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: `${config.color}20` }}>
                    <IconComp className="h-4 w-4" style={{ color: config.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs capitalize">{config.label}</Badge>
                        {rec.applied && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-[hsl(142,70%,45%)]" />
                            Applied
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${rec.confidence}%`, backgroundColor: config.color }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{rec.confidence}%</span>
                      </div>
                    </div>
                    <p className="text-sm mt-1">{rec.recommendation}</p>
                    {!rec.applied && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-3"
                        onClick={() => applyRecMutation.mutate(rec.id)}
                        disabled={applyRecMutation.isPending}
                        data-testid={`button-apply-rec-${rec.id}`}
                      >
                        Apply Recommendation
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {(!recommendations || recommendations.length === 0) && (
            <div className="text-center py-8">
              <Brain className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No recommendations yet. Click "Generate Recommendations" to get AI-powered crowd flow insights based on current event data.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
