import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserCheck, Gauge } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ThemeToggle } from "@/components/ThemeToggle";

interface RoleSelectorProps {
  onSelectRole: (role: "spectator" | "staff" | "organizer") => void;
}

export default function RoleSelector({ onSelectRole }: RoleSelectorProps) {
  const { t } = useI18n();

  const roles = [
    {
      key: "spectator" as const,
      icon: Users,
      colorClass: "bg-chart-5/10",
      iconColor: "text-chart-5",
      descKey: "role.spectatorDesc",
      descFallback: "View your ticket, navigate the venue, and receive event updates",
    },
    {
      key: "staff" as const,
      icon: UserCheck,
      colorClass: "bg-[hsl(142,70%,45%)]/10",
      iconColor: "text-[hsl(142,70%,45%)]",
      descKey: "role.staffDesc",
      descFallback: "Scan tickets, monitor entrances, and manage crowd flow",
    },
    {
      key: "organizer" as const,
      icon: Gauge,
      colorClass: "bg-primary/10",
      iconColor: "text-primary",
      descKey: "role.organizerDesc",
      descFallback: "Access analytics, AI recommendations, and full event control",
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-chart-2/10">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <LanguageSelector />
        <ThemeToggle />
      </div>
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Gauge className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold">{t("app.name")}</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            {t("app.tagline")}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("role.selectDesc")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {roles.map((r) => (
            <Card key={r.key} className="hover-elevate transition-all cursor-pointer" onClick={() => onSelectRole(r.key)} data-testid={`card-role-${r.key}`}>
              <CardHeader className="text-center">
                <div className={`mx-auto h-16 w-16 rounded-full ${r.colorClass} flex items-center justify-center mb-4`}>
                  <r.icon className={`h-8 w-8 ${r.iconColor}`} />
                </div>
                <h3 className="text-xl font-bold">{t(`role.${r.key}`)}</h3>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  {r.descFallback}
                </p>
                <Button className="w-full" data-testid={`button-role-${r.key}`}>
                  {t(`role.${r.key}`)}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center text-xs text-muted-foreground">
          <p>Demo mode - All roles available for exploration</p>
        </div>
      </div>
    </div>
  );
}
