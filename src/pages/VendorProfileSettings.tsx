import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, MapPin, Loader2, LogOut, Locate, Star, Shield, Clock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AddressForm, { type AddressFields, fieldsToFullAddress, parseAddressToFields } from "@/components/AddressForm";

const VendorProfileSettings = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("english");
  const [addressFields, setAddressFields] = useState<AddressFields>({
    flat: "", street: "", area: "", city: "", pincode: "", country: "India",
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("user_id", user.id).single().then(({ data }) => {
      if (data) {
        setFullName(data.full_name || "");
        setPhone(data.phone || "");
        setPreferredLanguage((data as any).preferred_language || "english");
        setAddressFields(parseAddressToFields(data.address || "", data.city || ""));
        setAvatarUrl(data.avatar_url);
      }
      setLoading(false);
    });
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = `${publicUrl}?t=${Date.now()}`;
      await supabase.from("profiles").update({ avatar_url: url }).eq("user_id", user.id);
      setAvatarUrl(url);
      toast.success("Photo updated!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({ full_name: fullName, phone, city: addressFields.city, address: fieldsToFullAddress(addressFields), preferred_language: preferredLanguage } as any).eq("user_id", user.id);
      if (error) throw error;
      toast.success("Profile saved!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) { toast.error("Geolocation not supported"); return; }
    toast.loading("Detecting...", { id: "geo-vendor" });
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`);
          const data = await res.json();
          const addr = data.address || {};
          setAddressFields({
            flat: "",
            street: addr.road || addr.street || "",
            area: addr.suburb || addr.neighbourhood || addr.village || "",
            city: addr.city || addr.town || addr.village || "",
            pincode: addr.postcode || "",
            country: addr.country || "India",
          });
          toast.success("Location detected!", { id: "geo-vendor" });
        } catch {
          toast.dismiss("geo-vendor");
        }
      },
      () => toast.error("Location denied", { id: "geo-vendor" }),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28 max-w-lg mx-auto">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border px-4 py-4">
        <h1 className="text-lg font-heading font-bold text-foreground">Vendor Profile</h1>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Avatar & Status */}
        <div className="flex flex-col items-center">
          <button onClick={() => fileInputRef.current?.click()} className="relative group" disabled={uploading}>
            <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl font-heading font-bold text-primary overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                fullName?.charAt(0)?.toUpperCase() || "?"
              )}
            </div>
            <div className="absolute inset-0 rounded-2xl bg-foreground/0 group-hover:bg-foreground/20 transition-colors flex items-center justify-center">
              {uploading ? <Loader2 className="w-6 h-6 text-primary-foreground animate-spin" /> : <Camera className="w-6 h-6 text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
            </div>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          <p className="text-xs text-muted-foreground mt-2">Tap to change photo</p>
        </div>

        {/* Availability Toggle */}
        <div className="bg-card rounded-xl p-4 shadow-card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${available ? "bg-success animate-pulse" : "bg-muted-foreground"}`} />
            <div>
              <p className="text-sm font-heading font-semibold text-foreground">{available ? "Available" : "Offline"}</p>
              <p className="text-[10px] text-muted-foreground">{available ? "You're visible to customers" : "You won't receive bookings"}</p>
            </div>
          </div>
          <button
            onClick={() => { setAvailable(!available); toast.success(available ? "You're now offline" : "You're now online"); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${available ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}
          >
            {available ? "Go Offline" : "Go Online"}
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card rounded-xl p-3 shadow-card text-center">
            <Star className="w-4 h-4 text-secondary mx-auto mb-1" />
            <p className="text-lg font-heading font-bold text-foreground">4.8</p>
            <p className="text-[10px] text-muted-foreground">Rating</p>
          </div>
          <div className="bg-card rounded-xl p-3 shadow-card text-center">
            <Shield className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="text-lg font-heading font-bold text-foreground">142</p>
            <p className="text-[10px] text-muted-foreground">Jobs Done</p>
          </div>
          <div className="bg-card rounded-xl p-3 shadow-card text-center">
            <Clock className="w-4 h-4 text-success mx-auto mb-1" />
            <p className="text-lg font-heading font-bold text-foreground">98%</p>
            <p className="text-[10px] text-muted-foreground">On Time</p>
          </div>
        </div>

        {/* Profile Fields */}
        <section className="space-y-3">
          <h2 className="text-base font-heading font-semibold text-foreground">Business Info</h2>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Full Name</label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" className="h-11 rounded-xl" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 Phone number" className="h-11 rounded-xl" />
          </div>
          <div>
            <h3 className="text-xs font-medium text-muted-foreground mb-2">Service Area / Address</h3>
            <button onClick={detectLocation} className="w-full flex items-center gap-2.5 p-3 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 transition-all mb-3">
              <Locate className="w-4 h-4 text-primary" />
              <div className="text-left">
                <p className="text-xs font-semibold text-foreground">Detect My Location</p>
                <p className="text-[10px] text-muted-foreground">Auto-fill via GPS</p>
              </div>
            </button>
            <AddressForm value={addressFields} onChange={setAddressFields} />
          </div>
          {/* Language Preference */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Preferred Language</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value)}
                className="w-full h-11 pl-9 pr-3 rounded-xl border border-input bg-background text-sm text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="english">English</option>
                <option value="hindi">हिन्दी (Hindi)</option>
                <option value="bengali">বাংলা (Bengali)</option>
                <option value="telugu">తెలుగు (Telugu)</option>
                <option value="marathi">मराठी (Marathi)</option>
                <option value="tamil">தமிழ் (Tamil)</option>
                <option value="gujarati">ગુજરાતી (Gujarati)</option>
                <option value="kannada">ಕನ್ನಡ (Kannada)</option>
                <option value="malayalam">മലയാളം (Malayalam)</option>
                <option value="punjabi">ਪੰਜਾਬੀ (Punjabi)</option>
                <option value="odia">ଓଡ଼ିଆ (Odia)</option>
                <option value="bhojpuri">भोजपुरी (Bhojpuri)</option>
                <option value="urdu">اردو (Urdu)</option>
              </select>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
          </Button>
        </section>

        {/* Account */}
        <section className="space-y-3">
          <h2 className="text-base font-heading font-semibold text-foreground">Account</h2>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
          <Button variant="outline" onClick={handleLogout} className="w-full text-destructive hover:text-destructive">
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </section>
      </div>
    </div>
  );
};

export default VendorProfileSettings;
