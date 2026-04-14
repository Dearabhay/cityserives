import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Star, MapPin, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type FavoriteVendor = {
  id: string;
  vendor_id: string;
  created_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
    city: string | null;
  };
};

const FavoriteVendors = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteVendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchFavorites = async () => {
      const { data } = await supabase
        .from("favorite_vendors" as any)
        .select("*")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false }) as any;

      if (data) {
        // Fetch vendor profiles
        const vendorIds = data.map((f: any) => f.vendor_id);
        if (vendorIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, full_name, avatar_url, city")
            .in("user_id", vendorIds);

          const profileMap: Record<string, any> = {};
          profiles?.forEach((p) => {
            profileMap[p.user_id] = p;
          });

          setFavorites(
            data.map((f: any) => ({
              ...f,
              profile: profileMap[f.vendor_id] || null,
            }))
          );
        } else {
          setFavorites([]);
        }
      }
      setLoading(false);
    };
    fetchFavorites();
  }, [user]);

  const handleRemove = async (id: string) => {
    const { error } = await (supabase.from("favorite_vendors" as any) as any).delete().eq("id", id);
    if (error) {
      toast.error("Failed to remove");
      return;
    }
    setFavorites(favorites.filter((f) => f.id !== id));
    toast.success("Removed from favorites");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 max-w-lg mx-auto">
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border px-4 py-4">
        <h1 className="text-lg font-heading font-bold text-foreground flex items-center gap-2">
          <Heart className="w-5 h-5 text-destructive fill-destructive" /> Favorite Vendors
        </h1>
      </div>

      <div className="px-4 py-4 space-y-3">
        {favorites.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm font-heading font-semibold text-foreground">No favorite vendors yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Tap the heart icon on a vendor's profile to add them here.
            </p>
            <Button size="sm" className="mt-4" onClick={() => navigate("/search")}>
              Find Vendors
            </Button>
          </div>
        ) : (
          favorites.map((fav) => {
            const name = fav.profile?.full_name || "Vendor";
            const initials = name
              .split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            return (
              <div key={fav.id} className="bg-card rounded-xl shadow-card p-4 flex items-center gap-3">
                <button
                  onClick={() => navigate(`/vendor-profile/${fav.vendor_id}`)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-sm font-heading font-bold text-primary overflow-hidden flex-shrink-0">
                    {fav.profile?.avatar_url ? (
                      <img src={fav.profile.avatar_url} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-heading font-semibold text-foreground truncate">{name}</p>
                    {fav.profile?.city && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" /> {fav.profile.city}
                      </p>
                    )}
                  </div>
                </button>
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/vendor-profile/${fav.vendor_id}`)}
                  >
                    View
                  </Button>
                  <button
                    onClick={() => handleRemove(fav.id)}
                    className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default FavoriteVendors;
