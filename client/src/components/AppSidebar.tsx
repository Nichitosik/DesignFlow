import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  Ticket,
  Gauge,
  Map,
  Car,
  BarChart3,
  Brain,
  ScanLine,
  Activity,
  Navigation,
  CalendarDays,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";

type UserRole = "spectator" | "staff" | "organizer" | "admin";

interface AppSidebarProps {
  role: UserRole;
  userName?: string;
}

const roleMenuDefs: Record<UserRole, { titleKey: string; url: string; icon: any; testId: string }[]> = {
  spectator: [
    { titleKey: "nav.events", url: "/spectator/events", icon: CalendarDays, testId: "link-events" },
    { titleKey: "nav.myTickets", url: "/spectator/tickets", icon: Ticket, testId: "link-my-tickets" },
    { titleKey: "nav.directions", url: "/spectator/directions", icon: Navigation, testId: "link-directions" },
    { titleKey: "nav.parking", url: "/spectator/parking", icon: Car, testId: "link-parking" },
  ],
  staff: [
    { titleKey: "nav.scanner", url: "/staff/scanner", icon: ScanLine, testId: "link-scanner" },
    { titleKey: "nav.monitoring", url: "/staff/monitoring", icon: Activity, testId: "link-monitoring" },
    { titleKey: "nav.venueMap", url: "/staff/map", icon: Map, testId: "link-venue-map" },
  ],
  organizer: [
    { titleKey: "nav.overview", url: "/organizer/overview", icon: Gauge, testId: "link-overview" },
    { titleKey: "nav.parking", url: "/organizer/parking", icon: Car, testId: "link-parking" },
    { titleKey: "nav.analytics", url: "/organizer/analytics", icon: BarChart3, testId: "link-analytics" },
    { titleKey: "nav.aiInsights", url: "/organizer/ai", icon: Brain, testId: "link-ai-insights" },
  ],
  admin: [
    { titleKey: "nav.adminPanel", url: "/admin/panel", icon: ShieldCheck, testId: "link-admin-panel" },
  ],
};

const roleBadgeColors: Record<UserRole, string> = {
  spectator: "bg-[hsl(200,80%,50%)] text-white border-0",
  staff: "bg-[hsl(38,90%,55%)] text-white border-0",
  organizer: "bg-primary text-primary-foreground border-0",
  admin: "bg-[hsl(0,80%,55%)] text-white border-0",
};

export function AppSidebar({ role, userName = "User" }: AppSidebarProps) {
  const [location] = useLocation();
  const { t } = useI18n();
  const menuItems = roleMenuDefs[role];

  const roleLabel = t(`role.${role}`);

  const isActive = (url: string) => {
    return location === url || (location === "/" && url === menuItems[0].url);
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <Gauge className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">{t("app.name")}</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between gap-2">
            <span>Navigation</span>
            <Badge className={`text-[10px] ${roleBadgeColors[role]}`}>{roleLabel}</Badge>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    data-testid={item.testId}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{t(item.titleKey)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3 p-2 rounded-md">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {userName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{userName}</p>
            <p className="text-xs text-muted-foreground">{roleLabel}</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
