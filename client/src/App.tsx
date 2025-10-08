import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import RoleSelector from "@/pages/RoleSelector";
import SpectatorDashboard from "@/pages/SpectatorDashboard";
import StaffDashboard from "@/pages/StaffDashboard";
import OrganizerDashboard from "@/pages/OrganizerDashboard";
import NotFound from "@/pages/not-found";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

type UserRole = "spectator" | "staff" | "organizer";

function Router() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [, setLocation] = useLocation();

  const handleSelectRole = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setLocation("/");
  };

  const handleLogout = () => {
    setRole(null);
    setLocation("/");
  };

  if (!role) {
    return <RoleSelector onSelectRole={handleSelectRole} />;
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar role={role} userName="Alex Johnson" />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                variant="outline"
                size="icon"
                onClick={handleLogout}
                data-testid="button-logout"
                title="Switch Role"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <Switch>
              {role === "spectator" && <Route path="/" component={SpectatorDashboard} />}
              {role === "staff" && <Route path="/" component={StaffDashboard} />}
              {role === "organizer" && <Route path="/" component={OrganizerDashboard} />}
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
