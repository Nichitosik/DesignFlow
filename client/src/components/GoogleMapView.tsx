import { useCallback, useRef } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  DirectionsRenderer,
  InfoWindow,
} from "@react-google-maps/api";
import { useState } from "react";
import { MapPin, AlertTriangle } from "lucide-react";

const LIBRARIES: ("places")[] = [];

export interface MapMarker {
  lat: number;
  lng: number;
  label?: string;
  color?: "red" | "blue" | "green" | "yellow";
}

interface GoogleMapViewProps {
  venueLat: number;
  venueLng: number;
  venueName?: string;
  userLat?: number | null;
  userLng?: number | null;
  showDirections?: boolean;
  height?: number;
  zoom?: number;
  extraMarkers?: MapMarker[];
}

const MAP_STYLES = [
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
];

const ICON_COLORS: Record<string, string> = {
  red:    "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
  blue:   "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
  green:  "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
  yellow: "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
};

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

export function GoogleMapView({
  venueLat,
  venueLng,
  venueName = "Venue",
  userLat,
  userLng,
  showDirections = false,
  height = 400,
  zoom = 15,
  extraMarkers = [],
}: GoogleMapViewProps) {
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [venueInfoOpen, setVenueInfoOpen] = useState(false);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: API_KEY ?? "",
    libraries: LIBRARIES,
  });

  const onMapLoad = useCallback((_map: google.maps.Map) => {
    if (!showDirections || !userLat || !userLng) return;
    const svc = new google.maps.DirectionsService();
    directionsServiceRef.current = svc;
    svc.route(
      {
        origin: { lat: userLat, lng: userLng },
        destination: { lat: venueLat, lng: venueLng },
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK" && result) setDirections(result);
      }
    );
  }, [showDirections, userLat, userLng, venueLat, venueLng]);

  // No API key configured
  if (!API_KEY) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 rounded-md border bg-muted/30 text-center p-6"
        style={{ height }}
        data-testid="google-map-no-key"
      >
        <AlertTriangle className="h-8 w-8 text-[hsl(38,90%,55%)]" />
        <div>
          <p className="font-medium text-sm">Google Maps API key not configured</p>
          <p className="text-xs text-muted-foreground mt-1">
            Set <code className="bg-muted px-1 rounded">VITE_GOOGLE_MAPS_API_KEY</code> in your <code className="bg-muted px-1 rounded">.env</code> file
          </p>
        </div>
        <a
          href={`https://www.google.com/maps/search/${venueLat},${venueLng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary underline"
        >
          Open {venueName} in Google Maps
        </a>
      </div>
    );
  }

  if (loadError) {
    return (
      <div
        className="flex items-center justify-center rounded-md border bg-muted/30 text-muted-foreground text-sm"
        style={{ height }}
      >
        Failed to load Google Maps. Check your API key.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        className="flex items-center justify-center rounded-md border bg-muted/30 text-muted-foreground text-sm animate-pulse"
        style={{ height }}
      >
        Loading map...
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={{ width: "100%", height: `${height}px`, borderRadius: "6px" }}
      center={{ lat: venueLat, lng: venueLng }}
      zoom={zoom}
      options={{ styles: MAP_STYLES, mapTypeControl: false, streetViewControl: false }}
      onLoad={onMapLoad}
    >
      {/* Venue marker */}
      <Marker
        position={{ lat: venueLat, lng: venueLng }}
        title={venueName}
        onClick={() => setVenueInfoOpen(true)}
      />
      {venueInfoOpen && (
        <InfoWindow
          position={{ lat: venueLat, lng: venueLng }}
          onCloseClick={() => setVenueInfoOpen(false)}
        >
          <div className="text-sm font-medium flex items-center gap-1">
            <MapPin className="h-3 w-3 text-red-500" />
            {venueName}
          </div>
        </InfoWindow>
      )}

      {/* User location marker */}
      {userLat && userLng && (
        <Marker
          position={{ lat: userLat, lng: userLng }}
          title="Your location"
          icon={ICON_COLORS.blue}
        />
      )}

      {/* Extra markers (parking lots, entrances, etc.) */}
      {extraMarkers.map((m, i) => (
        <Marker
          key={i}
          position={{ lat: m.lat, lng: m.lng }}
          title={m.label}
          icon={m.color ? ICON_COLORS[m.color] : undefined}
        />
      ))}

      {/* Directions route overlay */}
      {directions && (
        <DirectionsRenderer
          directions={directions}
          options={{ suppressMarkers: true, polylineOptions: { strokeColor: "hsl(200,80%,50%)", strokeWeight: 5 } }}
        />
      )}
    </GoogleMap>
  );
}
