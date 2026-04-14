import { useState } from "react";
import { Phone, AlertTriangle, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const emergencyNumbers = [
  { label: "Police", number: "100", icon: "🚔" },
  { label: "Ambulance", number: "108", icon: "🚑" },
  { label: "Fire", number: "101", icon: "🚒" },
  { label: "Women Helpline", number: "1091", icon: "👩" },
  { label: "Emergency", number: "112", icon: "🆘" },
];

const SOSButton = () => {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const { user } = useAuth();

  const handleSOS = async (number: string, label: string) => {
    // Open phone dialer
    window.open(`tel:${number}`, "_self");

    // Log SOS alert to database for admin
    if (user) {
      setSending(true);
      try {
        let locationAddress = "Unknown";
        let lat: number | null = null;
        let lng: number | null = null;

        if (navigator.geolocation) {
          try {
            const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
              navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
            );
            lat = pos.coords.latitude;
            lng = pos.coords.longitude;
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
            );
            const data = await res.json();
            locationAddress = data.display_name || `${lat}, ${lng}`;
          } catch {
            // Location not available
          }
        }

        await supabase.from("sos_alerts" as any).insert({
          user_id: user.id,
          emergency_type: label,
          location_address: locationAddress,
          latitude: lat,
          longitude: lng,
        } as any);

        toast.success("SOS alert sent to admin!");
      } catch {
        // Silent fail — dialing is more important
      } finally {
        setSending(false);
      }
    }
  };

  return (
    <>
      {/* Floating SOS Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 left-4 z-50 w-14 h-14 rounded-full bg-destructive text-destructive-foreground shadow-elevated flex items-center justify-center hover:scale-105 active:scale-95 transition-transform animate-pulse"
        aria-label="SOS Emergency"
      >
        <AlertTriangle className="w-6 h-6" />
      </button>

      {/* SOS Modal */}
      {open && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-sm bg-card rounded-2xl shadow-elevated border border-border overflow-hidden animate-slide-up">
            <div className="p-4 bg-destructive/10 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <h2 className="font-heading font-bold text-foreground">SOS Emergency</h2>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-muted">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="p-4 space-y-2">
              {emergencyNumbers.map((item) => (
                <button
                  key={item.number}
                  onClick={() => handleSOS(item.number, item.label)}
                  disabled={sending}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-background",
                    "hover:bg-muted hover:border-destructive/30 transition-all text-left"
                  )}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.number}</p>
                  </div>
                  <Phone className="w-4 h-4 text-destructive" />
                </button>
              ))}
            </div>
            <div className="px-4 pb-4">
              <p className="text-xs text-center text-muted-foreground">
                Tapping will open your phone dialer & alert admin
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SOSButton;
