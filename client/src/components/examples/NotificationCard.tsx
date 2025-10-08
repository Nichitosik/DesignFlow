import { NotificationCard } from "../NotificationCard";

export default function NotificationCardExample() {
  return (
    <div className="space-y-4 p-4 max-w-md">
      <NotificationCard
        type="alert"
        title="Parking Lot A Near Capacity"
        message="Parking Lot A is at 92% capacity. Consider redirecting traffic to Lot B."
        timestamp="2 min ago"
        actionLabel="View Details"
        onAction={() => console.log("View details clicked")}
        onDismiss={() => console.log("Dismissed")}
      />
      <NotificationCard
        type="success"
        title="Event Check-in Started"
        message="Gates are now open for general admission."
        timestamp="15 min ago"
      />
      <NotificationCard
        type="warning"
        title="High Traffic at Entrance 3"
        message="Consider opening additional lanes to reduce wait time."
        timestamp="5 min ago"
        onDismiss={() => console.log("Dismissed")}
      />
    </div>
  );
}
