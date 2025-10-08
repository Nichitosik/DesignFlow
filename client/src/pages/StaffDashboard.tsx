import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CapacityMeter } from "@/components/CapacityMeter";
import { StatusBadge } from "@/components/StatusBadge";
import { NotificationCard } from "@/components/NotificationCard";
import { VenueMap } from "@/components/VenueMap";
import { ScanLine, Users, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export default function StaffDashboard() {
  const [activeZone, setActiveZone] = useState<string>();

  const zones = [
    { id: "stage", name: "Main Stage", x: 35, y: 10, capacity: 5000, current: 4200, type: "stage" as const },
    { id: "entrance-1", name: "Entrance 1", x: 5, y: 45, capacity: 500, current: 450, type: "entrance" as const },
    { id: "entrance-2", name: "Entrance 2", x: 75, y: 45, capacity: 500, current: 320, type: "entrance" as const },
    { id: "vip-a", name: "VIP Zone A", x: 10, y: 65, capacity: 200, current: 180, type: "seating" as const },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Staff Dashboard</h1>
        <p className="text-muted-foreground">Monitor event operations and assist spectators</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Tickets Scanned</h3>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3,847</div>
            <p className="text-xs text-muted-foreground">+234 in last hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Active Entrances</h3>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4 / 6</div>
            <p className="text-xs text-muted-foreground">2 entrances on standby</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Alerts</h3>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[hsl(38,90%,55%)]">2</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Quick Actions</h3>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" data-testid="button-scan-ticket">
                <ScanLine className="h-4 w-4 mr-2" />
                Scan Ticket
              </Button>
              <Button className="w-full justify-start" variant="outline" data-testid="button-report-issue">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Report Issue
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="font-semibold">Entrance Status</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Entrance 1</span>
                  <StatusBadge status="warning" label="High Traffic" />
                </div>
                <CapacityMeter current={450} max={500} label="" showAlert />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Entrance 2</span>
                  <StatusBadge status="valid" label="Normal" />
                </div>
                <CapacityMeter current={320} max={500} label="" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <VenueMap 
            zones={zones}
            activeZone={activeZone}
            onZoneClick={setActiveZone}
          />

          <div className="space-y-3">
            <h3 className="font-semibold">Recent Alerts</h3>
            <NotificationCard
              type="warning"
              title="High Traffic at Entrance 1"
              message="Consider opening additional lanes."
              timestamp="5 min ago"
              actionLabel="Open Lane"
              onAction={() => console.log("Open lane")}
            />
            <NotificationCard
              type="info"
              title="VIP Section Check Complete"
              message="All VIP tickets verified and seated."
              timestamp="12 min ago"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
