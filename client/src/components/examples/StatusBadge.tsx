import { StatusBadge } from "../StatusBadge";

export default function StatusBadgeExample() {
  return (
    <div className="flex flex-wrap gap-2 p-4">
      <StatusBadge status="valid" />
      <StatusBadge status="invalid" />
      <StatusBadge status="warning" label="Near Capacity" />
      <StatusBadge status="pending" label="Checking..." />
    </div>
  );
}
