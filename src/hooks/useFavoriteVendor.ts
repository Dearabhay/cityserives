import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const useFavoriteVendor = (vendorId: string | undefined) => {
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !vendorId) return;
    const check = async () => {
      const { data } = await (supabase.from("favorite_vendors" as any) as any)
        .select("id")
        .eq("customer_id", user.id)
        .eq("vendor_id", vendorId)
        .maybeSingle();
      if (data) {
        setIsFavorite(true);
        setFavoriteId(data.id);
      }
    };
    check();
  }, [user, vendorId]);

  const toggleFavorite = async () => {
    if (!user || !vendorId || loading) return;
    setLoading(true);
    try {
      if (isFavorite && favoriteId) {
        await (supabase.from("favorite_vendors" as any) as any).delete().eq("id", favoriteId);
        setIsFavorite(false);
        setFavoriteId(null);
        toast.success("Removed from favorites");
      } else {
        const { data, error } = await (supabase.from("favorite_vendors" as any) as any)
          .insert({ customer_id: user.id, vendor_id: vendorId })
          .select()
          .single();
        if (error) throw error;
        setIsFavorite(true);
        setFavoriteId(data.id);
        toast.success("Added to favorites ❤️");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update");
    } finally {
      setLoading(false);
    }
  };

  return { isFavorite, loading, toggleFavorite };
};
