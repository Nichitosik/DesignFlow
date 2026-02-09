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
  Home, 
  Ticket, 
  Gauge,
  Map,
  Car,
  BarChart3,
  Brain,
  ScanLine,
  Activity,
  Navigation,
  Eye,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

type UserRole = "spectator" | "staff" | "organizer";

interface AppSidebarProps {
  role: UserRole;
  userName?: string;
}

const roleMenus: Record<UserRole, { title: string; url: string; icon: any }[]> = {
  spectator: [
    { title: "My Tickets", url: "/spectator/tickets", icon: Ticket },
    { title: "Venue Map", url: "/spectator/map", icon: Map },
    { title: "Directions", url: "/spectator/directions", icon: Navigation },
    { title: "Parking", url: "/spectator/parking", icon: Car },
  ],
  staff: [
    { title: "Scanner", url: "/staff/scanner", icon: ScanLine },
    { title: "Monitoring", url: "/staff/monitoring", icon: Activity },
    { title: "Venue Map", url: "/staff/map", icon: Map },
  ],
  organizer: [
    { title: "Overview", url: "/organizer/overview", icon: Gauge },
    { title: "Venue Map", url: "/organizer/map", icon: Map },
    { title: "Parking", url: "/organizer/parking", icon: Car },
    { title: "Analytics", url: "/organizer/analytics", icon: BarChart3 },
    { title: "AI Insights", url: "/organizer/ai", icon: Brain },
  ],
};

const roleBadgeColors: Record<UserRole, string> = {
  spectator: "bg-[hsl(200,80%,50%)] text-white border-0",
  staff: "bg-[hsl(38,90%,55%)] text-white border-0",
  organizer: "bg-primary text-primary-foreground border-0",
};

export function AppSidebar({ role, userName = "User" }: AppSidebarProps) {
  const [location] = useLocation();
  const menuItems = roleMenus[role];

  const getRoleBadge = () => {
    switch (role) {
      case "spectator": return "Spectator";
      case "staff": return "Staff";
      case "organizer": return "Organizer";
    }
  };

  const isActive = (url: string) => {
    return location === url || (location === "/" && url === menuItems[0].url);
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <Gauge className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">EventFlow</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between gap-2">
            <span>Navigation</span>
            <Badge className={`text-[10px] ${roleBadgeColors[role]}`}>{getRoleBadge()}</Badge>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    data-testid={`link-${item.title.toLowerCase().replace(/\s/g, '-')}`}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
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
            <p className="text-xs text-muted-foreground">{getRoleBadge()}</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
