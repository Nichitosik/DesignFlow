import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { I18nProvider } from "@/lib/i18n";
import { LanguageSelector } from "@/components/LanguageSelector";
import RoleSelector from "@/pages/RoleSelector";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useState, useEffect, lazy, Suspense } from "react";

const SpectatorEvents = lazy(() => import("@/pages/spectator/SpectatorEvents"));
const SpectatorTickets = lazy(() => import("@/pages/spectator/SpectatorTickets"));
const SpectatorMap = lazy(() => import("@/pages/spectator/SpectatorMap"));
const SpectatorDirections = lazy(() => import("@/pages/spectator/SpectatorDirections"));
const SpectatorParking = lazy(() => import("@/pages/spectator/SpectatorParking"));

const StaffScanner = lazy(() => import("@/pages/staff/StaffScanner"));
const StaffMonitoring = lazy(() => import("@/pages/staff/StaffMonitoring"));
const StaffMap = lazy(() => import("@/pages/staff/StaffMap"));

const OrganizerOverview = lazy(() => import("@/pages/organizer/OrganizerOverview"));
const OrganizerParking = lazy(() => import("@/pages/organizer/OrganizerParking"));
const OrganizerAnalytics = lazy(() => import("@/pages/organizer/OrganizerAnalytics"));
const OrganizerAI = lazy(() => import("@/pages/organizer/OrganizerAI"));

const AdminPanel = lazy(() => import("@/pages/admin/AdminPanel"));

type UserRole = "spectator" | "staff" | "organizer" | "admin";

function PageLoader() {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}


const roleDefaultPaths: Record<UserRole, string> = {
  spectator: "/spectator/events",
  staff: "/staff/scanner",
  organizer: "/organizer/overview",
  admin: "/admin/panel",
};

function AuthenticatedApp() {
  const { user, logout } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [, setLocation] = useLocation();
  const [location] = useLocation();
  const [switching, setSwitching] = useState(false);

  // Role stored in localStorage (no auth mode)
  useEffect(() => {
    if (!role && !switching) {
      const saved = localStorage.getItem("app-role") as UserRole | null;
      if (saved) {
        setRole(saved);
        if (location === "/" || location === "") {
          setLocation(roleDefaultPaths[saved]);
        }
      }
    }
  }, []);

  const handleSelectRole = (selectedRole: UserRole) => {
    localStorage.setItem("app-role", selectedRole);
    setRole(selectedRole);
    setSwitching(false);
    setLocation(roleDefaultPaths[selectedRole]);
  };

  const handleSwitchRole = () => {
    setSwitching(true);
    setRole(null);
  };

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
                    <Route path="/spectator/events" component={SpectatorEvents} />
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
                    <Route path="/organizer/parking" component={OrganizerParking} />
                    <Route path="/organizer/analytics" component={OrganizerAnalytics} />
                    <Route path="/organizer/ai" component={OrganizerAI} />
                  </>
                )}
                {role === "admin" && (
                  <>
                    <Route path="/admin/panel" component={AdminPanel} />
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
  const [authView, setAuthView] = useState<"login" | "register">("login");

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    if (authView === "register") {
      return <RegisterPage onNavigateLogin={() => setAuthView("login")} />;
    }
    return <LoginPage onNavigateRegister={() => setAuthView("register")} />;
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
