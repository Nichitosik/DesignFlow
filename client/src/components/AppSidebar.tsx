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
  Gauge
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type UserRole = "spectator" | "staff" | "organizer";

interface AppSidebarProps {
  role: UserRole;
  userName?: string;
}

const roleMenus = {
  spectator: [
    { title: "Dashboard", url: "/", icon: Ticket },
  ],
  staff: [
    { title: "Dashboard", url: "/", icon: Home },
  ],
  organizer: [
    { title: "Dashboard", url: "/", icon: Gauge },
  ],
};

export function AppSidebar({ role, userName = "User" }: AppSidebarProps) {
  const [location] = useLocation();
  const menuItems = roleMenus[role];

  const getRoleBadge = () => {
    switch (role) {
      case "spectator":
        return "Spectator";
      case "staff":
        return "Staff";
      case "organizer":
        return "Organizer";
    }
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Gauge className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">EventFlow</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{getRoleBadge()} Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
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
        <div className="flex items-center gap-3 p-2 rounded-md hover-elevate">
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
