import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { QRCodeSVG } from "qrcode.react";
import { StatusBadge } from "./StatusBadge";
import { MapPin, Calendar, Clock } from "lucide-react";

interface TicketCardProps {
  ticketId: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  zone: string;
  seat?: string;
  status: "valid" | "invalid" | "warning" | "pending";
}

export function TicketCard({ 
  ticketId, 
  eventName, 
  eventDate, 
  eventTime, 
  zone, 
  seat,
  status 
}: TicketCardProps) {
  return (
    <Card className="max-w-md" data-testid={`card-ticket-${ticketId}`}>
      <CardHeader className="space-y-4 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-lg">{eventName}</h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <Calendar className="h-3 w-3" />
              <span>{eventDate}</span>
              <span className="mx-1">•</span>
              <Clock className="h-3 w-3" />
              <span>{eventTime}</span>
            </div>
          </div>
          <StatusBadge status={status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center p-4 bg-background rounded-md">
          <QRCodeSVG value={ticketId} size={180} level="H" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Ticket ID</span>
            <span className="font-mono font-medium">{ticketId}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Zone
            </span>
            <span className="font-medium">{zone}</span>
          </div>
          {seat && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Seat</span>
              <span className="font-medium">{seat}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
