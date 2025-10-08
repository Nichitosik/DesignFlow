import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CapacityMeter } from "@/components/CapacityMeter";
import { ParkingMonitor } from "@/components/ParkingMonitor";
import { VenueMap } from "@/components/VenueMap";
import { NotificationCard } from "@/components/NotificationCard";
import { Button } from "@/components/ui/button";
import { Users, Ticket, TrendingUp, AlertTriangle, Download, Sparkles } from "lucide-react";
import { useState } from "react";

export default function OrganizerDashboard() {
  const [activeZone, setActiveZone] = useState<string>();

  const zones = [
    { id: "stage", name: "Main Stage", x: 35, y: 10, capacity: 5000, current: 4200, type: "stage" as const },
    { id: "entrance-1", name: "Entrance 1", x: 5, y: 45, capacity: 500, current: 450, type: "entrance" as const },
    { id: "entrance-2", name: "Entrance 2", x: 75, y: 45, capacity: 500, current: 320, type: "entrance" as const },
    { id: "vip-a", name: "VIP Zone A", x: 10, y: 65, capacity: 200, current: 180, type: "seating" as const },
    { id: "general-1", name: "General 1", x: 70, y: 40, capacity: 3000, current: 2100, type: "seating" as const },
    { id: "parking-a", name: "Parking A", x: 5, y: 10, capacity: 800, current: 750, type: "parking" as const },
  ];

  const parkingLots = [
    { id: "lot-a", name: "Parking Lot A", capacity: 800, occupied: 750, status: "open" as const },
    { id: "lot-b", name: "Parking Lot B", capacity: 600, occupied: 420, status: "open" as const },
    { id: "lot-c", name: "VIP Parking", capacity: 200, occupied: 200, status: "full" as const },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Organizer Dashboard</h1>
          <p className="text-muted-foreground">Real-time event monitoring and analytics</p>
        </div>
        <Button variant="outline" data-testid="button-export-report">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Total Attendance</h3>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8,547</div>
            <p className="text-xs text-muted-foreground">+12% from last event</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Tickets Sold</h3>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">9,234</div>
            <p className="text-xs text-muted-foreground">92% of capacity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Check-in Rate</h3>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92.5%</div>
            <p className="text-xs text-[hsl(142,70%,45%)]">Above average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Active Alerts</h3>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[hsl(38,90%,55%)]">3</div>
            <p className="text-xs text-muted-foreground">2 parking, 1 entrance</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <VenueMap 
            zones={zones}
            activeZone={activeZone}
            onZoneClick={setActiveZone}
          />

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <h3 className="font-semibold">AI Flow Recommendations</h3>
              <Sparkles className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-md bg-primary/5 border border-primary/20">
                <p className="text-sm font-medium mb-2">Optimize Entrance Distribution</p>
                <p className="text-sm text-muted-foreground mb-3">
                  Based on current traffic patterns, redirect 15% of Entrance 1 flow to Entrance 2 to reduce wait times by ~8 minutes.
                </p>
                <Button size="sm" data-testid="button-apply-recommendation">
                  Apply Recommendation
                </Button>
              </div>
              <div className="p-4 rounded-md bg-muted">
                <p className="text-sm font-medium mb-2">Parking Capacity Alert</p>
                <p className="text-sm text-muted-foreground">
                  Parking Lot A will reach capacity in approximately 25 minutes. Consider activating overflow parking.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <ParkingMonitor lots={parkingLots} />

          <Card>
            <CardHeader>
              <h3 className="font-semibold">Crowd Flow Status</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <CapacityMeter current={4200} max={5000} label="Main Stage Area" />
              <CapacityMeter current={180} max={200} label="VIP Section" showAlert />
              <CapacityMeter current={2100} max={3000} label="General Admission" />
            </CardContent>
          </Card>

          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Recent Events</h3>
            <NotificationCard
              type="alert"
              title="Parking Lot A Near Capacity"
              message="92% full - activate overflow parking"
              timestamp="3 min ago"
              actionLabel="Activate"
              onAction={() => console.log("Activate overflow")}
            />
            <NotificationCard
              type="warning"
              title="High Traffic at Entrance 1"
              message="450/500 capacity - consider opening lane 3"
              timestamp="7 min ago"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
