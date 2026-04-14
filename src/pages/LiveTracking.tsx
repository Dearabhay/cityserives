import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Phone, MessageCircle, X, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix leaflet default icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const vendorIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const customerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateTime(distKm: number): string {
  const minutes = Math.round((distKm / 25) * 60);
  if (minutes < 1) return "< 1 min";
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

const LiveTracking = () => {
  const navigate = useNavigate();
  const { bookingId } = useParams();
  const { user } = useAuth();

  const [booking, setBooking] = useState<any>(null);
  const [vendorProfile, setVendorProfile] = useState<{ full_name: string | null }>({ full_name: null });
  const [vendorPos, setVendorPos] = useState<[number, number] | null>(null);
  const [customerPos, setCustomerPos] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [demoStep, setDemoStep] = useState(0);
  const isDemo = !booking || booking.id?.startsWith?.("demo");

  // Leaflet refs
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const vendorMarkerRef = useRef<L.Marker | null>(null);
  const customerMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const map = L.map(mapContainerRef.current, {
      center: [28.6139, 77.209],
      zoom: 13,
      scrollWheelZoom: false,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [loading]);

  // Update markers when positions change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (vendorPos) {
      if (vendorMarkerRef.current) {
        vendorMarkerRef.current.setLatLng(vendorPos);
      } else {
        vendorMarkerRef.current = L.marker(vendorPos, { icon: vendorIcon })
          .addTo(map)
          .bindPopup(`🚗 ${vendorProfile.full_name || "Vendor"}`);
      }
    }

    if (customerPos) {
      if (customerMarkerRef.current) {
        customerMarkerRef.current.setLatLng(customerPos);
      } else {
        customerMarkerRef.current = L.marker(customerPos, { icon: customerIcon })
          .addTo(map)
          .bindPopup("📍 Your Location");
      }
    }

    if (vendorPos && customerPos) {
      if (polylineRef.current) {
        polylineRef.current.setLatLngs([vendorPos, customerPos]);
      } else {
        polylineRef.current = L.polyline([vendorPos, customerPos], {
          color: "#3b82f6", weight: 3, dashArray: "10, 6",
        }).addTo(map);
      }
      const bounds = L.latLngBounds([vendorPos, customerPos]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [vendorPos, customerPos, vendorProfile.full_name]);

  // Fetch booking data
  useEffect(() => {
    if (!user || !bookingId) return;
    const fetchBooking = async () => {
      const { data } = await supabase.from("bookings").select("*").eq("id", bookingId).single();
      if (data) {
        setBooking(data);
        const { data: profile } = await supabase.from("profiles").select("full_name").eq("user_id", data.vendor_id).single();
        if (profile) setVendorProfile(profile);
      } else {
        setBooking({ id: bookingId, service_type: "Plumbing", sub_service: "Pipe Leak Repair", address: "Sector 15, Rohini, New Delhi", city: "Delhi", price: 500, vendor_id: "demo-vendor" });
        setVendorProfile({ full_name: "Raj Kumar" });
      }
      setLoading(false);
    };
    fetchBooking();
  }, [user, bookingId]);

  // Get customer location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCustomerPos([pos.coords.latitude, pos.coords.longitude]),
        () => setCustomerPos([28.6139, 77.209])
      );
    } else {
      setCustomerPos([28.6139, 77.209]);
    }
  }, []);

  // Subscribe to real-time vendor location
  useEffect(() => {
    if (!bookingId || !booking || isDemo) return;
    const fetchLocation = async () => {
      const { data } = await supabase.from("vendor_locations").select("latitude, longitude").eq("booking_id", bookingId).single();
      if (data) setVendorPos([data.latitude, data.longitude]);
    };
    fetchLocation();
    const channel = supabase.channel(`vendor-location-${bookingId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "vendor_locations", filter: `booking_id=eq.${bookingId}` }, (payload: any) => {
        const newData = payload.new;
        if (newData?.latitude && newData?.longitude) setVendorPos([newData.latitude, newData.longitude]);
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [bookingId, booking, isDemo]);

  // Demo simulation
  useEffect(() => {
    if (!isDemo || !customerPos) return;
    const startPos: [number, number] = [customerPos[0] + 0.03, customerPos[1] - 0.025];
    const steps = 120;
    const timer = setInterval(() => {
      setDemoStep((prev) => {
        const next = prev + 1;
        if (next >= steps) { clearInterval(timer); return steps; }
        const progress = next / steps;
        setVendorPos([startPos[0] + (customerPos[0] - startPos[0]) * progress, startPos[1] + (customerPos[1] - startPos[1]) * progress]);
        return next;
      });
    }, 1000);
    setVendorPos(startPos);
    return () => clearInterval(timer);
  }, [isDemo, customerPos]);

  const distance = useMemo(() => {
    if (!vendorPos || !customerPos) return null;
    return haversineDistance(vendorPos[0], vendorPos[1], customerPos[0], customerPos[1]);
  }, [vendorPos, customerPos]);
  const eta = useMemo(() => (distance ? estimateTime(distance) : null), [distance]);
  const progress = useMemo(() => (distance ? Math.min(1, Math.max(0, 1 - distance / 5)) : 0), [distance]);

  const vendorName = vendorProfile.full_name || "Vendor";
  const vendorInitials = vendorName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto flex flex-col">
      <header className="sticky top-0 z-[1000] bg-card/95 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="font-heading font-semibold text-foreground">Live Tracking</h1>
        {isDemo && <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-bold ml-auto">DEMO</span>}
      </header>

      <div className="px-4 pt-3">
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">Estimated Arrival</span>
            </div>
            <div className="flex items-center gap-2">
              {distance !== null && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-lg font-semibold">{distance.toFixed(1)} km</span>
              )}
              <span className="text-xl font-heading font-bold text-foreground">{eta || "..."}</span>
            </div>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${progress * 100}%` }} />
          </div>
          <div className="flex justify-between mt-2">
            {["Accepted", "On the way", "Arriving"].map((label, i) => {
              const isActive = i <= (progress > 0.7 ? 2 : progress > 0.1 ? 1 : 0);
              return <span key={label} className={cn("text-[10px] font-medium", isActive ? "text-primary" : "text-muted-foreground")}>{label}</span>;
            })}
          </div>
        </div>
      </div>

      <div className="px-4 pt-3 flex-1" style={{ minHeight: 350 }}>
        <div ref={mapContainerRef} className="rounded-xl overflow-hidden shadow-card h-full" style={{ minHeight: 320 }} />
      </div>

      <div className="bg-card border-t border-border p-4 space-y-4 mt-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-lg font-heading font-bold text-primary">{vendorInitials}</div>
          <div className="flex-1">
            <p className="text-sm font-heading font-semibold text-foreground">{vendorName}</p>
            <p className="text-xs text-muted-foreground">{booking?.service_type} · {booking?.sub_service || "Service"}</p>
          </div>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center hover:bg-success/20 transition-colors">
              <Phone className="w-4 h-4 text-success" />
            </button>
            <button onClick={() => navigate(`/chat/${bookingId}`)} className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
              <MessageCircle className="w-4 h-4 text-primary" />
            </button>
          </div>
        </div>
        <Button variant="outline" className="w-full text-destructive hover:text-destructive" onClick={() => navigate(-1)}>
          <X className="w-4 h-4" /> Cancel Booking
        </Button>
      </div>
    </div>
  );
};

export default LiveTracking;
