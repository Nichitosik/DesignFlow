import { ParkingMonitor } from "../ParkingMonitor";

export default function ParkingMonitorExample() {
  const lots = [
    { id: "lot-a", name: "Parking Lot A", capacity: 800, occupied: 750, status: "open" as const },
    { id: "lot-b", name: "Parking Lot B", capacity: 600, occupied: 420, status: "open" as const },
    { id: "lot-c", name: "VIP Parking", capacity: 200, occupied: 200, status: "full" as const },
    { id: "lot-d", name: "Staff Parking", capacity: 150, occupied: 85, status: "open" as const },
  ];

  return (
    <div className="p-4 max-w-2xl">
      <ParkingMonitor lots={lots} />
    </div>
  );
}
