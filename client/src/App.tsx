import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
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
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { LogOut, Gauge } from "lucide-react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type UserRole = "spectator" | "staff" | "organizer";

function LandingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-chart-2/10">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Gauge className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold">EventFlow</h1>
          </div>
          <p className="text-muted-foreground">Entertainment Center Management System</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-center text-muted-foreground">
            Real-time event monitoring, ticket validation, crowd management, and AI-powered recommendations.
          </p>
          <Button className="w-full" onClick={() => window.location.href = "/api/login"} data-testid="button-login">
            Log In to Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function AuthenticatedApp() {
  const { user, logout } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [, setLocation] = useLocation();

  const [switching, setSwitching] = useState(false);

  const { data: userRoles, isLoading: rolesLoading } = useQuery<any[]>({
    queryKey: ["/api/user/role"],
  });

  useEffect(() => {
    if (userRoles && userRoles.length > 0 && !role && !switching) {
      setRole(userRoles[0].role as UserRole);
    }
  }, [userRoles, role, switching]);

  const handleSelectRole = async (selectedRole: UserRole) => {
    await apiRequest("POST", "/api/user/role", { role: selectedRole });
    queryClient.invalidateQueries({ queryKey: ["/api/user/role"] });
    setRole(selectedRole);
    setSwitching(false);
    setLocation("/");
  };

  const handleSwitchRole = () => {
    setSwitching(true);
    setRole(null);
  };

  if (rolesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!role) {
    return <RoleSelector onSelectRole={handleSelectRole} />;
  }

  const userName = user?.firstName
    ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
    : user?.email || "User";

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar role={role} userName={userName} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                variant="outline"
                size="icon"
                onClick={handleSwitchRole}
                data-testid="button-switch-role"
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

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return <AuthenticatedApp />;
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
