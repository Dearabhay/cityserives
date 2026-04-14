import { MapPin, Bell, Search, ChevronDown, Crown, ChevronRight, Locate, Loader2, HeadphonesIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import ServiceCategoryGrid from "@/components/ServiceCategoryGrid";
import EmergencyBanner from "@/components/EmergencyBanner";
import RecommendedVendors from "@/components/RecommendedVendors";
import ActiveBookings from "@/components/ActiveBookings";
import SOSButton from "@/components/SOSButton";
import heroBg from "@/assets/hero-bg.jpg";

const CustomerHome = () => {
  const navigate = useNavigate();
  const [locationName, setLocationName] = useState("Bengaluru");
  const [detectingLocation, setDetectingLocation] = useState(false);

  const detectLiveLocation = () => {
    if (!navigator.geolocation) {
      setLocationName("Location unavailable");
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&format=json`
          );
          const data = await res.json();
          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.county ||
            "Current Location";
          setLocationName(city);
        } catch {
          setLocationName("Current Location");
        }
        setDetectingLocation(false);
      },
      () => {
        setLocationName("Location denied");
        setDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <button onClick={detectLiveLocation} className="flex items-center gap-1.5 text-foreground">
              {detectingLocation ? (
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
              ) : (
                <MapPin className="w-4 h-4 text-primary" />
              )}
              <span className="text-sm font-heading font-semibold">{locationName}</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            <button onClick={() => navigate("/notifications")} className="relative p-2 rounded-xl hover:bg-muted transition-colors">
              <Bell className="w-5 h-5 text-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emergency rounded-full" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="What service do you need?"
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-muted text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="relative h-40 overflow-hidden">
        <img src={heroBg} alt="City services" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-xl font-heading font-bold text-foreground">
            Your City. Your Services.
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">One app for everything you need.</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 space-y-6 mt-5">
        <EmergencyBanner />
        <ServiceCategoryGrid />
        <RecommendedVendors />
        <ActiveBookings />

        {/* Subscription CTA */}
        <button
          onClick={() => navigate("/subscriptions")}
          className="w-full bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-5 text-left shadow-elevated hover:scale-[1.01] active:scale-[0.99] transition-all animate-slide-up"
          style={{ animationDelay: "0.4s" }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary-foreground/20">
              <Crown className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-heading font-bold text-primary-foreground">Subscribe & Save</p>
              <p className="text-xs text-primary-foreground/70 mt-0.5">Weekly & monthly plans from ₹199</p>
            </div>
            <ChevronRight className="w-5 h-5 text-primary-foreground/70" />
          </div>
        </button>
      </div>

      {/* SOS Emergency Button */}
      <SOSButton />

      {/* Floating Support Button */}
      <button
        onClick={() => navigate("/support")}
        className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-elevated flex items-center justify-center hover:scale-105 active:scale-95 transition-transform pulse"
        aria-label="Customer Support"
      >
        <HeadphonesIcon className="w-6 h-6" />
      </button>
    </div>
  );
};

export default CustomerHome;
