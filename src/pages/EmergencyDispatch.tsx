import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Wrench, Lightbulb, Stethoscope, Key, Flame, AlertTriangle, Loader2, Locate } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const categories = [
  { icon: Wrench, label: "Plumbing", id: "plumbing" },
  { icon: Lightbulb, label: "Electrical", id: "electrical" },
  { icon: Stethoscope, label: "Medical", id: "medical" },
  { icon: Key, label: "Locksmith", id: "locksmith" },
  { icon: Flame, label: "Gas Leak", id: "gas" },
];

const urgencyLevels = [
  { label: "Moderate", value: "moderate", color: "bg-secondary/10 text-secondary border-secondary/30" },
  { label: "Urgent", value: "urgent", color: "bg-emergency/10 text-emergency border-emergency/30" },
  { label: "Critical", value: "critical", color: "bg-emergency text-emergency-foreground border-emergency" },
];

const EmergencyDispatch = () => {
  const [selected, setSelected] = useState<string | null>(null);
  const [urgency, setUrgency] = useState<string | null>(null);
  const [dispatching, setDispatching] = useState(false);
  const [locationText, setLocationText] = useState("Tap to detect via GPS");
  const [detectedAddress, setDetectedAddress] = useState("");
  const [detectedCity, setDetectedCity] = useState("");
  const [detecting, setDetecting] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const detectLocation = () => {
    if (!navigator.geolocation) { toast.error("Geolocation not supported"); return; }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`);
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.village || "";
          setDetectedAddress(data.display_name || `${pos.coords.latitude}, ${pos.coords.longitude}`);
          setDetectedCity(city);
          setLocationText(city || "Location detected");
        } catch {
          setDetectedAddress(`${pos.coords.latitude}, ${pos.coords.longitude}`);
          setLocationText("Location detected");
        }
        setDetecting(false);
      },
      () => { setLocationText("Location denied"); setDetecting(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleDispatch = async () => {
    if (!user || !selected || !urgency) return;
    if (!detectedAddress) {
      toast.error("Please detect your location first");
      return;
    }
    setDispatching(true);
    try {
      const now = new Date();
      const { data, error } = await supabase.from("bookings").insert({
        customer_id: user.id,
        vendor_id: user.id,
        service_type: selected,
        scheduled_date: now.toISOString().split("T")[0],
        scheduled_time: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        address: detectedAddress,
        city: detectedCity || null,
        price: 0,
        emergency_flag: true,
        status: "pending",
        special_instructions: `Emergency - ${urgency} urgency`,
      }).select("id").single();
      if (error) throw error;
      toast.success("Emergency dispatched! Vendor is on the way.");
      navigate(`/tracking/${data.id}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDispatching(false);
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="font-heading font-semibold text-foreground">Emergency Dispatch</h1>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Location */}
        <button onClick={detectLocation} className="flex items-center gap-3 bg-card rounded-xl p-4 shadow-card w-full text-left">
          <div className="p-2 rounded-lg bg-primary/10">
            {detecting ? <Loader2 className="w-5 h-5 text-primary animate-spin" /> : <Locate className="w-5 h-5 text-primary" />}
          </div>
          <div>
            <p className="text-sm font-heading font-semibold text-foreground">Current Location</p>
            <p className="text-xs text-muted-foreground">{locationText}</p>
          </div>
        </button>

        {/* Category */}
        <div>
          <h2 className="text-base font-heading font-semibold text-foreground mb-3">What's the emergency?</h2>
          <div className="grid grid-cols-3 gap-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelected(cat.id)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                  selected === cat.id
                    ? "border-emergency bg-emergency/5 shadow-elevated"
                    : "border-border bg-card hover:border-emergency/30"
                )}
              >
                <cat.icon className={cn("w-6 h-6", selected === cat.id ? "text-emergency" : "text-muted-foreground")} />
                <span className="text-xs font-medium text-foreground">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Urgency */}
        <div>
          <h2 className="text-base font-heading font-semibold text-foreground mb-3">Urgency Level</h2>
          <div className="flex gap-2">
            {urgencyLevels.map((level) => (
              <button
                key={level.value}
                onClick={() => setUrgency(level.value)}
                className={cn(
                  "flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all",
                  urgency === level.value ? level.color : "border-border bg-card text-muted-foreground"
                )}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dispatch Button */}
        <Button
          variant="emergency"
          size="xl"
          className="w-full mt-4"
          disabled={!selected || !urgency || dispatching}
          onClick={handleDispatch}
        >
          {dispatching ? <Loader2 className="w-5 h-5 animate-spin" /> : <AlertTriangle className="w-5 h-5" />}
          {dispatching ? "DISPATCHING..." : "DISPATCH NOW"}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Nearest available vendor will be dispatched immediately
        </p>
      </div>
    </div>
  );
};

export default EmergencyDispatch;
