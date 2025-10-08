import { TicketCard } from "@/components/TicketCard";
import { VenueMap } from "@/components/VenueMap";
import { NotificationCard } from "@/components/NotificationCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Navigation, Share2 } from "lucide-react";
import { useState } from "react";
import eventImage from "@assets/stock_images/concert_crowd_music__8267ea97.jpg";

export default function SpectatorDashboard() {
  const [activeZone, setActiveZone] = useState<string>();

  const zones = [
    { id: "stage", name: "Main Stage", x: 35, y: 10, capacity: 5000, current: 4200, type: "stage" as const },
    { id: "entrance-1", name: "Entrance 1", x: 5, y: 45, capacity: 500, current: 320, type: "entrance" as const },
    { id: "vip-a", name: "VIP Zone A", x: 10, y: 65, capacity: 200, current: 180, type: "seating" as const },
    { id: "general-1", name: "General 1", x: 70, y: 40, capacity: 3000, current: 2100, type: "seating" as const },
  ];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="relative h-48 rounded-lg overflow-hidden">
        <img 
          src={eventImage} 
          alt="Event venue" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20" />
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <h1 className="text-3xl font-bold">Summer Music Festival 2024</h1>
          <p className="text-sm opacity-90">August 15, 2024 • 19:00</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <TicketCard
            ticketId="TKT-2024-A7B9C1"
            eventName="Summer Music Festival 2024"
            eventDate="August 15, 2024"
            eventTime="19:00"
            zone="VIP Section A"
            seat="Row 5, Seat 12"
            status="valid"
          />

          <Card>
            <CardHeader>
              <h3 className="font-semibold">Quick Actions</h3>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" variant="outline" data-testid="button-directions">
                <Navigation className="h-4 w-4 mr-2" />
                Get Directions to Your Seat
              </Button>
              <Button className="w-full justify-start" variant="outline" data-testid="button-share">
                <Share2 className="h-4 w-4 mr-2" />
                Share Your Ticket
              </Button>
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
            <h3 className="font-semibold">Event Updates</h3>
            <NotificationCard
              type="info"
              title="Gates Opening Soon"
              message="VIP gates will open in 30 minutes. Please arrive early."
              timestamp="15 min ago"
            />
            <NotificationCard
              type="success"
              title="Parking Available"
              message="Parking Lot B has plenty of available spaces."
              timestamp="1 hour ago"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
