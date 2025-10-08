import { CapacityMeter } from "../CapacityMeter";

export default function CapacityMeterExample() {
  return (
    <div className="space-y-4 p-4 max-w-md">
      <CapacityMeter current={450} max={2000} label="Main Entrance" />
      <CapacityMeter current={1650} max={2000} label="VIP Section" showAlert />
      <CapacityMeter current={2000} max={2000} label="Parking Lot A" showAlert />
    </div>
  );
}
