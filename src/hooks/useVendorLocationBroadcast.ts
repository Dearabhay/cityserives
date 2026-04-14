import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook that broadcasts the vendor's GPS location to the database
 * every `intervalMs` milliseconds while active.
 */
export function useVendorLocationBroadcast(bookingId: string | undefined, active: boolean, intervalMs = 5000) {
  const { user } = useAuth();
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const latestPos = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!user || !bookingId || !active) return;

    // Watch position
    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          latestPos.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        },
        () => {
          // Fallback: simulate location
          latestPos.current = { lat: 28.6139 + Math.random() * 0.01, lng: 77.209 + Math.random() * 0.01 };
        },
        { enableHighAccuracy: true, maximumAge: 3000 }
      );
    }

    // Broadcast at interval
    const broadcast = async () => {
      if (!latestPos.current) return;
      const { lat, lng } = latestPos.current;

      await supabase.from("vendor_locations" as any).upsert(
        {
          vendor_id: user.id,
          booking_id: bookingId,
          latitude: lat,
          longitude: lng,
          updated_at: new Date().toISOString(),
        } as any,
        { onConflict: "vendor_id,booking_id" }
      );
    };

    // Initial broadcast
    setTimeout(broadcast, 1000);
    intervalRef.current = setInterval(broadcast, intervalMs);

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user, bookingId, active, intervalMs]);
}
