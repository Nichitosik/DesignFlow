import { useEffect, useRef } from "react";
import { queryClient } from "@/lib/queryClient";

export function useEventWebSocket(eventId: number | undefined, role?: string) {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!eventId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "subscribe", eventId, role }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "ticket_scanned":
          case "ticket_upgraded":
            queryClient.invalidateQueries({ queryKey: ["/api/tickets/my"] });
            queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "tickets"] });
            queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "ticket-availability"] });
            queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "stats"] });
            break;
          case "ticket_category_update":
            queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "ticket-categories"] });
            queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "ticket-availability"] });
            break;
          case "zone_update":
            queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "zones"] });
            queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "stats"] });
            break;
          case "parking_update":
            queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "parking"] });
            queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "stats"] });
            break;
          case "notification":
            queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "notifications"] });
            queryClient.invalidateQueries({ queryKey: ["/api/notifications/my"] });
            break;
        }
      } catch {
        // ignore parse errors
      }
    };

    ws.onerror = () => {
      // silent reconnect on error - polling handles the gap
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [eventId, role]);
}
