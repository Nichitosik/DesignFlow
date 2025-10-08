import { VenueMap } from "../VenueMap";
import { useState } from "react";

export default function VenueMapExample() {
  const [activeZone, setActiveZone] = useState<string>();

  const zones = [
    { id: "stage", name: "Main Stage", x: 35, y: 10, capacity: 5000, current: 4200, type: "stage" as const },
    { id: "entrance-1", name: "Entrance 1", x: 5, y: 45, capacity: 500, current: 320, type: "entrance" as const },
    { id: "vip-a", name: "VIP Zone A", x: 10, y: 65, capacity: 200, current: 180, type: "seating" as const },
    { id: "general-1", name: "General 1", x: 70, y: 40, capacity: 3000, current: 2100, type: "seating" as const },
    { id: "parking-a", name: "Parking A", x: 5, y: 10, capacity: 800, current: 750, type: "parking" as const },
    { id: "parking-b", name: "Parking B", x: 75, y: 10, capacity: 600, current: 590, type: "parking" as const },
  ];

  return (
    <div className="p-4">
      <VenueMap 
        zones={zones} 
        activeZone={activeZone}
        onZoneClick={(id) => {
          setActiveZone(id);
          console.log("Zone clicked:", id);
        }}
      />
    </div>
  );
}
