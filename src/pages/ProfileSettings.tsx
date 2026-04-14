import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, MapPin, Plus, Trash2, LogOut, Loader2, Home, Briefcase, MoreHorizontal, Locate, Globe, HeadphonesIcon, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AddressForm, { type AddressFields, fieldsToFullAddress, parseAddressToFields } from "@/components/AddressForm";

const labelIcons: Record<string, typeof Home> = { Home, Work: Briefcase, Other: MoreHorizontal };

type SavedAddress = {
  id: string;
  label: string;
  address: string;
  city: string | null;
  is_default: boolean;
};

const ProfileSettings = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("english");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // New address form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState("Home");
  const [newAddressFields, setNewAddressFields] = useState<AddressFields>({
    flat: "", street: "", area: "", city: "", pincode: "", country: "India",
  });

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [profileRes, addressRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("saved_addresses").select("*").eq("user_id", user.id).order("created_at"),
      ]);
      if (profileRes.data) {
        setFullName(profileRes.data.full_name || "");
        setPhone(profileRes.data.phone || "");
        setCity(profileRes.data.city || "");
        setPreferredLanguage((profileRes.data as any).preferred_language || "english");
        setAvatarUrl(profileRes.data.avatar_url);
      }
      if (addressRes.data) setAddresses(addressRes.data);
      setLoading(false);
    };
    fetchData();
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
      toast.success("Avatar updated!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({ full_name: fullName, phone, city, preferred_language: preferredLanguage } as any).eq("user_id", user.id);
      if (error) throw error;
      toast.success("Profile saved!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddAddress = async () => {
    if (!user || !newAddressFields.street.trim()) return;
    const fullAddr = fieldsToFullAddress(newAddressFields);
    try {
      const { data, error } = await supabase.from("saved_addresses").insert({
        user_id: user.id,
        label: newLabel,
        address: fullAddr,
        city: newAddressFields.city || null,
        is_default: addresses.length === 0,
      }).select().single();
      if (error) throw error;
      setAddresses([...addresses, data]);
      setShowAddForm(false);
      setNewAddressFields({ flat: "", street: "", area: "", city: "", pincode: "", country: "India" });
      toast.success("Address added!");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      const { error } = await supabase.from("saved_addresses").delete().eq("id", id);
      if (error) throw error;
      setAddresses(addresses.filter((a) => a.id !== id));
      toast.success("Address removed");
    } catch (err: any) {
      toast.error(err.message);
    }
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
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="font-heading font-semibold text-foreground">Profile Settings</h1>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Avatar */}
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
              {uploading ? (
                <Loader2 className="w-6 h-6 text-primary-foreground animate-spin" />
              ) : (
                <Camera className="w-6 h-6 text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </div>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          <p className="text-xs text-muted-foreground mt-2">Tap to change photo</p>
        </div>

        {/* Profile Fields */}
        <section className="space-y-3">
          <h2 className="text-base font-heading font-semibold text-foreground">Personal Info</h2>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Full Name</label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" className="h-11 rounded-xl" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 Phone number" className="h-11 rounded-xl" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">City</label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Your city" className="h-11 rounded-xl" />
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
          <Button onClick={handleSaveProfile} disabled={saving} className="w-full">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
          </Button>
        </section>

        {/* Saved Addresses */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-heading font-semibold text-foreground">Saved Addresses</h2>
            <button onClick={() => setShowAddForm(!showAddForm)} className="text-sm font-medium text-primary flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>

          {showAddForm && (
            <div className="bg-card rounded-xl p-4 shadow-card space-y-3 animate-slide-up">
              <div className="flex gap-2">
                {["Home", "Work", "Other"].map((l) => (
                  <button
                    key={l}
                    onClick={() => setNewLabel(l)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      newLabel === l ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!navigator.geolocation) { toast.error("Geolocation not supported"); return; }
                  toast.loading("Detecting location...", { id: "geo-profile" });
                  navigator.geolocation.getCurrentPosition(
                    async (pos) => {
                      try {
                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`);
                        const data = await res.json();
                        const addr = data.address || {};
                        setNewAddressFields({
                          flat: "",
                          street: addr.road || addr.street || "",
                          area: addr.suburb || addr.neighbourhood || addr.village || "",
                          city: addr.city || addr.town || addr.village || "",
                          pincode: addr.postcode || "",
                          country: addr.country || "India",
                        });
                        toast.success("Location detected!", { id: "geo-profile" });
                      } catch {
                        toast.dismiss("geo-profile");
                      }
                    },
                    () => { toast.error("Location access denied", { id: "geo-profile" }); },
                    { enableHighAccuracy: true, timeout: 10000 }
                  );
                }}
                className="w-full flex items-center gap-2.5 p-3 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 transition-all"
              >
                <Locate className="w-4 h-4 text-primary" />
                <div className="text-left">
                  <p className="text-xs font-semibold text-foreground">Detect My Live Location</p>
                  <p className="text-[10px] text-muted-foreground">Auto-fill address via GPS</p>
                </div>
              </button>
              <AddressForm value={newAddressFields} onChange={setNewAddressFields} compact />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowAddForm(false)} className="flex-1">Cancel</Button>
                <Button size="sm" onClick={handleAddAddress} className="flex-1">Save Address</Button>
              </div>
            </div>
          )}

          {addresses.length === 0 && !showAddForm && (
            <div className="bg-card rounded-xl p-6 shadow-card text-center">
              <MapPin className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No saved addresses yet</p>
            </div>
          )}

          <div className="space-y-2">
            {addresses.map((addr) => {
              const Icon = labelIcons[addr.label] || MapPin;
              return (
                <div key={addr.id} className="flex items-center gap-3 bg-card rounded-xl p-4 shadow-card">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{addr.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{addr.address}{addr.city ? `, ${addr.city}` : ""}</p>
                  </div>
                  <button onClick={() => handleDeleteAddress(addr.id)} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors">
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Support */}
        <section className="space-y-3">
          <h2 className="text-base font-heading font-semibold text-foreground">Help & Support</h2>
          <button
            onClick={() => navigate("/support")}
            className="w-full flex items-center gap-3 bg-card rounded-xl p-4 shadow-card hover:bg-muted/50 transition-colors"
          >
            <div className="p-2 rounded-lg bg-primary/10">
              <HeadphonesIcon className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-foreground">Customer Support</p>
              <p className="text-xs text-muted-foreground">Chat, FAQ, call us anytime</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
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

export default ProfileSettings;
