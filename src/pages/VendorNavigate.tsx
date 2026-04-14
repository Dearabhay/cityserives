import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Navigation, Clock, MapPin, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useVendorLocationBroadcast } from "@/hooks/useVendorLocationBroadcast";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons for leaflet in bundled apps
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const vendorIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const customerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateTime(distKm: number): string {
  // Assume avg 25 km/h in city traffic
  const minutes = Math.round((distKm / 25) * 60);
  if (minutes < 1) return "< 1 min";
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs}h ${mins}m`;
}

// Demo customer locations mapped by city
const demoLocations: Record<string, [number, number]> = {
  delhi: [28.6139, 77.209],
  mumbai: [19.076, 72.8777],
  bangalore: [12.9716, 77.5946],
  chennai: [13.0827, 80.2707],
  hyderabad: [17.385, 78.4867],
  kolkata: [22.5726, 88.3639],
  pune: [18.5204, 73.8567],
  default: [28.6448, 77.2167],
};

const VendorNavigate = () => {
  const navigate = useNavigate();
  const { bookingId } = useParams();
  const { user } = useAuth();

  const [booking, setBooking] = useState<any>(null);
  const [vendorPos, setVendorPos] = useState<[number, number] | null>(null);
  const [customerPos, setCustomerPos] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Broadcast vendor location in real-time
  useVendorLocationBroadcast(bookingId, !!booking);

  useEffect(() => {
    // Get vendor's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setVendorPos([pos.coords.latitude, pos.coords.longitude]),
        () => {
          setGeoError("Location access denied. Using default location.");
          setVendorPos([28.6139, 77.209]); // Default Delhi
        }
      );
    } else {
      setVendorPos([28.6139, 77.209]);
    }
  }, []);

  useEffect(() => {
    if (!user || !bookingId) return;
    const fetchBooking = async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .single();

      if (error || !data) {
        // Demo booking for testing
        const demoBooking = {
          id: bookingId,
          service_type: "Plumbing",
          sub_service: "Pipe Leak Repair",
          address: "Sector 15, Rohini, New Delhi",
          city: "Delhi",
          scheduled_date: new Date().toISOString().split("T")[0],
          scheduled_time: "10:00 AM",
          price: 500,
          customer_id: "demo",
        };
        setBooking(demoBooking);
        const cityKey = "delhi";
        // Slightly offset from vendor for demo
        const base = demoLocations[cityKey] || demoLocations.default;
        setCustomerPos([base[0] + 0.02, base[1] - 0.015]);
      } else {
        setBooking(data);
        const cityKey = (data.city || "").toLowerCase().trim();
        const base = demoLocations[cityKey] || demoLocations.default;
        // Add small random offset to simulate different address
        setCustomerPos([base[0] + (Math.random() * 0.04 - 0.02), base[1] + (Math.random() * 0.04 - 0.02)]);
      }
      setLoading(false);
    };
    fetchBooking();
  }, [user, bookingId]);

  const distance = useMemo(() => {
    if (!vendorPos || !customerPos) return null;
    return haversineDistance(vendorPos[0], vendorPos[1], customerPos[0], customerPos[1]);
  }, [vendorPos, customerPos]);

  const eta = useMemo(() => (distance ? estimateTime(distance) : null), [distance]);

  const center = useMemo<[number, number]>(() => {
    if (vendorPos && customerPos) {
      return [(vendorPos[0] + customerPos[0]) / 2, (vendorPos[1] + customerPos[1]) / 2];
    }
    return vendorPos || customerPos || [28.6139, 77.209];
  }, [vendorPos, customerPos]);

  const openInGoogleMaps = () => {
    if (!customerPos) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${customerPos[0]},${customerPos[1]}`;
    window.open(url, "_blank");
  };

  if (loading || !vendorPos) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-[1000] bg-card/95 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="font-heading font-semibold text-foreground">Navigate to Customer</h1>
      </header>

      {/* Booking Info Card */}
      {booking && (
        <div className="px-4 pt-4">
          <div className="bg-card rounded-xl p-4 shadow-card space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-heading font-semibold text-foreground">
                  {booking.sub_service || booking.service_type}
                </p>
                <p className="text-xs text-muted-foreground">{booking.service_type}</p>
              </div>
              <p className="text-sm font-heading font-bold text-foreground">₹{booking.price}</p>
            </div>
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{booking.address}{booking.city ? `, ${booking.city}` : ""}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              {booking.scheduled_date} · {booking.scheduled_time}
            </div>
          </div>
        </div>
      )}

      {/* Distance & ETA */}
      {distance !== null && (
        <div className="px-4 pt-3">
          <div className="flex gap-3">
            <div className="flex-1 bg-primary/10 rounded-xl p-3 text-center">
              <Navigation className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-lg font-heading font-bold text-foreground">{distance.toFixed(1)} km</p>
              <p className="text-[10px] text-muted-foreground">Distance</p>
            </div>
            <div className="flex-1 bg-secondary/10 rounded-xl p-3 text-center">
              <Clock className="w-5 h-5 text-secondary mx-auto mb-1" />
              <p className="text-lg font-heading font-bold text-foreground">{eta}</p>
              <p className="text-[10px] text-muted-foreground">Est. Travel Time</p>
            </div>
          </div>
        </div>
      )}

      {geoError && (
        <p className="text-xs text-destructive px-4 pt-2">{geoError}</p>
      )}

      {/* Map */}
      <div className="px-4 pt-3 pb-4 flex-1">
        <div className="rounded-xl overflow-hidden shadow-card" style={{ height: 350 }}>
          <MapContainer
            center={center}
            zoom={12}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={vendorPos} icon={vendorIcon}>
              <Popup>📍 Your Location</Popup>
            </Marker>
            {customerPos && (
              <Marker position={customerPos} icon={customerIcon}>
                <Popup>📍 Customer Location</Popup>
              </Marker>
            )}
            {customerPos && (
              <Polyline
                positions={[vendorPos, customerPos]}
                pathOptions={{ color: "hsl(var(--primary))", weight: 3, dashArray: "10, 6" }}
              />
            )}
          </MapContainer>
        </div>
      </div>

      {/* Navigate Button */}
      <div className="px-4 pb-6">
        <Button onClick={openInGoogleMaps} size="xl" className="w-full gap-2">
          <ExternalLink className="w-4 h-4" /> Open in Google Maps
        </Button>
      </div>
    </div>
  );
};

export default VendorNavigate;
