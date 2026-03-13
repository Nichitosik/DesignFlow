import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { StatusBadge } from "./StatusBadge";
import { MapPin, Calendar, Clock, Maximize2, X } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [fullscreenQR, setFullscreenQR] = useState(false);

  return (
    <>
      <Card className="max-w-md" data-testid={`card-ticket-${ticketId}`}>
        <CardHeader className="space-y-4 pb-4">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <h3 className="font-semibold text-lg">{eventName}</h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <Calendar className="h-3 w-3" />
                <span>{eventDate}</span>
                <span className="mx-1">·</span>
                <Clock className="h-3 w-3" />
                <span>{eventTime}</span>
              </div>
            </div>
            <StatusBadge status={status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center gap-3 p-4 bg-white rounded-md">
            <QRCodeSVG
              value={ticketId}
              size={200}
              level="H"
              includeMargin
              data-testid={`qr-code-${ticketId}`}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFullscreenQR(true)}
              data-testid={`button-fullscreen-qr-${ticketId}`}
            >
              <Maximize2 className="h-4 w-4 mr-1" />
              Show Fullscreen
            </Button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Ticket ID</span>
              <span className="font-mono font-medium text-xs">{ticketId}</span>
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

      <Dialog open={fullscreenQR} onOpenChange={setFullscreenQR}>
        <DialogContent className="max-w-sm" data-testid="dialog-fullscreen-qr">
          <DialogHeader className="sr-only">
            <DialogTitle>Ticket QR Code - {eventName}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="flex flex-col items-center gap-2">
              <h3 className="font-semibold text-lg">{eventName}</h3>
              <p className="text-sm text-muted-foreground">{eventDate}</p>
            </div>
            <div className="p-4 bg-white rounded-md shadow-sm">
              <QRCodeSVG
                value={ticketId}
                size={280}
                level="H"
                includeMargin
              />
            </div>
            <div className="text-center space-y-1">
              <p className="font-mono text-sm font-medium">{ticketId}</p>
              <p className="text-xs text-muted-foreground">{zone}{seat ? ` · ${seat}` : ""}</p>
            </div>
            <StatusBadge status={status} />
            <p className="text-xs text-muted-foreground text-center">
              Show this QR code to staff for scanning and entry validation
            </p>
            <Button
              variant="outline"
              onClick={() => setFullscreenQR(false)}
              data-testid="button-close-fullscreen-qr"
            >
              <X className="h-4 w-4 mr-1" />
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
