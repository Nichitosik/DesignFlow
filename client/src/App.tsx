import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { I18nProvider, useI18n } from "@/lib/i18n";
import { LanguageSelector } from "@/components/LanguageSelector";
import RoleSelector from "@/pages/RoleSelector";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { LogOut, Gauge } from "lucide-react";
import { useState, useEffect, lazy, Suspense } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const SpectatorTickets = lazy(() => import("@/pages/spectator/SpectatorTickets"));
const SpectatorMap = lazy(() => import("@/pages/spectator/SpectatorMap"));
const SpectatorDirections = lazy(() => import("@/pages/spectator/SpectatorDirections"));
const SpectatorParking = lazy(() => import("@/pages/spectator/SpectatorParking"));

const StaffScanner = lazy(() => import("@/pages/staff/StaffScanner"));
const StaffMonitoring = lazy(() => import("@/pages/staff/StaffMonitoring"));
const StaffMap = lazy(() => import("@/pages/staff/StaffMap"));

const OrganizerOverview = lazy(() => import("@/pages/organizer/OrganizerOverview"));
const OrganizerMap = lazy(() => import("@/pages/organizer/OrganizerMap"));
const OrganizerParking = lazy(() => import("@/pages/organizer/OrganizerParking"));
const OrganizerAnalytics = lazy(() => import("@/pages/organizer/OrganizerAnalytics"));
const OrganizerAI = lazy(() => import("@/pages/organizer/OrganizerAI"));

type UserRole = "spectator" | "staff" | "organizer";

function PageLoader() {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}

function LandingPage() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-chart-2/10">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <LanguageSelector />
        <ThemeToggle />
      </div>
      <Card className="max-w-md w-full">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Gauge className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold">{t("app.name")}</h1>
          </div>
          <p className="text-muted-foreground">{t("app.tagline")}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-center text-muted-foreground">
            {t("common.welcomeDesc")}
          </p>
          <Button className="w-full" onClick={() => window.location.href = "/api/login"} data-testid="button-login">
            {t("common.login")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

const roleDefaultPaths: Record<UserRole, string> = {
  spectator: "/spectator/tickets",
  staff: "/staff/scanner",
  organizer: "/organizer/overview",
};

function AuthenticatedApp() {
  const { user, logout } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [, setLocation] = useLocation();
  const [location] = useLocation();
  const [switching, setSwitching] = useState(false);

  const { data: userRoles, isLoading: rolesLoading } = useQuery<any[]>({
    queryKey: ["/api/user/role"],
  });

  useEffect(() => {
    if (userRoles && userRoles.length > 0 && !role && !switching) {
      const savedRole = userRoles[0].role as UserRole;
      setRole(savedRole);
      if (location === "/" || location === "") {
        setLocation(roleDefaultPaths[savedRole]);
      }
    }
  }, [userRoles, role, switching]);

  const handleSelectRole = async (selectedRole: UserRole) => {
    await apiRequest("POST", "/api/user/role", { role: selectedRole });
    queryClient.invalidateQueries({ queryKey: ["/api/user/role"] });
    setRole(selectedRole);
    setSwitching(false);
    setLocation(roleDefaultPaths[selectedRole]);
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
              <LanguageSelector />
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
            <Suspense fallback={<PageLoader />}>
              <Switch>
                {role === "spectator" && (
                  <>
                    <Route path="/spectator/tickets" component={SpectatorTickets} />
                    <Route path="/spectator/map" component={SpectatorMap} />
                    <Route path="/spectator/directions" component={SpectatorDirections} />
                    <Route path="/spectator/parking" component={SpectatorParking} />
                  </>
                )}
                {role === "staff" && (
                  <>
                    <Route path="/staff/scanner" component={StaffScanner} />
                    <Route path="/staff/monitoring" component={StaffMonitoring} />
                    <Route path="/staff/map" component={StaffMap} />
                  </>
                )}
                {role === "organizer" && (
                  <>
                    <Route path="/organizer/overview" component={OrganizerOverview} />
                    <Route path="/organizer/map" component={OrganizerMap} />
                    <Route path="/organizer/parking" component={OrganizerParking} />
                    <Route path="/organizer/analytics" component={OrganizerAnalytics} />
                    <Route path="/organizer/ai" component={OrganizerAI} />
                  </>
                )}
                <Route><Redirect to={roleDefaultPaths[role]} /></Route>
              </Switch>
            </Suspense>
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
        <I18nProvider>
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
