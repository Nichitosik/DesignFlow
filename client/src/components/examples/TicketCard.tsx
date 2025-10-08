import { TicketCard } from "../TicketCard";

export default function TicketCardExample() {
  return (
    <div className="p-4 flex justify-center">
      <TicketCard
        ticketId="TKT-2024-A7B9C1"
        eventName="Summer Music Festival 2024"
        eventDate="August 15, 2024"
        eventTime="19:00"
        zone="VIP Section A"
        seat="Row 5, Seat 12"
        status="valid"
      />
    </div>
  );
}
