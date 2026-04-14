import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Star, MapPin, Clock, Share2, MessageCircle, ChevronRight, Camera, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFavoriteVendor } from "@/hooks/useFavoriteVendor";
import { cn } from "@/lib/utils";

const vendorData = {
  id: "1",
  name: "Raj Kumar",
  avatar: "RK",
  coverColor: "from-primary to-primary/70",
  rating: 4.8,
  reviews: 156,
  experience: 8,
  distance: "1.2 km",
  bio: "Certified plumber with 8+ years of experience in residential and commercial plumbing. Specializing in leak repairs, pipe installations, and bathroom fittings.",
  services: [
    { name: "Pipe Leak Repair", price: "₹300", duration: "30 min" },
    { name: "Tap Installation", price: "₹500", duration: "45 min" },
    { name: "Bathroom Fitting", price: "₹1,200", duration: "2 hrs" },
    { name: "Drain Cleaning", price: "₹400", duration: "1 hr" },
    { name: "Water Tank Repair", price: "₹800", duration: "1.5 hrs" },
  ],
  availability: [
    { day: "Mon", hours: "9 AM – 6 PM", active: true },
    { day: "Tue", hours: "9 AM – 6 PM", active: true },
    { day: "Wed", hours: "9 AM – 6 PM", active: true },
    { day: "Thu", hours: "9 AM – 6 PM", active: true },
    { day: "Fri", hours: "9 AM – 6 PM", active: true },
    { day: "Sat", hours: "10 AM – 4 PM", active: true },
    { day: "Sun", hours: "Closed", active: false },
  ],
  gallery: [
    { label: "Kitchen pipe fix", bg: "bg-primary/10" },
    { label: "Bathroom remodel", bg: "bg-secondary/10" },
    { label: "Water heater install", bg: "bg-accent" },
    { label: "Drain unclogging", bg: "bg-success/10" },
    { label: "Tap replacement", bg: "bg-primary/10" },
    { label: "Pipe soldering", bg: "bg-secondary/10" },
  ],
  customerReviews: [
    { name: "Arjun M.", rating: 5, date: "2 days ago", text: "Excellent work! Fixed the leak in under 30 minutes. Very professional and clean.", avatar: "AM" },
    { name: "Sneha R.", rating: 5, date: "1 week ago", text: "Installed new taps in both bathrooms. Great quality work at a fair price. Highly recommend!", avatar: "SR" },
    { name: "Deepak K.", rating: 4, date: "2 weeks ago", text: "Good service. Came on time and fixed the issue quickly. Could improve communication a bit.", avatar: "DK" },
    { name: "Meera P.", rating: 5, date: "3 weeks ago", text: "Best plumber in the area! Have used his services 3 times now. Always reliable.", avatar: "MP" },
  ],
};

const VendorProfile = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const v = vendorData;
  const { isFavorite, loading: favLoading, toggleFavorite } = useFavoriteVendor(id || v.id);
  const [selectedService, setSelectedService] = useState(0);

  return (
    <div className="min-h-screen bg-background pb-28 max-w-lg mx-auto">
      {/* Cover + Back */}
      <div className={`relative h-44 bg-gradient-to-br ${v.coverColor}`}>
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4 z-10">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-card/80 backdrop-blur-sm hover:bg-card transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex gap-2">
            <button
              onClick={toggleFavorite}
              disabled={favLoading}
              className="p-2 rounded-xl bg-card/80 backdrop-blur-sm hover:bg-card transition-colors"
            >
              <Heart className={cn("w-5 h-5 transition-colors", isFavorite ? "fill-destructive text-destructive" : "text-foreground")} />
            </button>
            <button className="p-2 rounded-xl bg-card/80 backdrop-blur-sm hover:bg-card transition-colors">
              <Share2 className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>
        {/* Avatar */}
        <div className="absolute -bottom-10 left-4">
          <div className="w-20 h-20 rounded-2xl bg-card shadow-elevated flex items-center justify-center text-2xl font-heading font-bold text-primary border-4 border-background">
            {v.avatar}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="px-4 pt-14 space-y-6">
        <div>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-heading font-bold text-foreground">{v.name}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Plumber · {v.experience} yrs experience</p>
            </div>
            <div className="flex items-center gap-1 bg-secondary/10 px-2.5 py-1 rounded-lg">
              <Star className="w-4 h-4 fill-secondary text-secondary" />
              <span className="text-sm font-heading font-bold text-foreground">{v.rating}</span>
              <span className="text-xs text-muted-foreground">({v.reviews})</span>
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2 text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" />
            <span className="text-xs">{v.distance} away</span>
          </div>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{v.bio}</p>
        </div>

        {/* Services */}
        <section>
          <h2 className="text-base font-heading font-semibold text-foreground mb-3">Services & Pricing</h2>
          <div className="bg-card rounded-xl shadow-card overflow-hidden divide-y divide-border">
            {v.services.map((s, i) => (
              <button
                key={i}
                onClick={() => setSelectedService(i)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 transition-all text-left",
                  selectedService === i ? "bg-primary/5 border-l-4 border-l-primary" : "hover:bg-muted/50"
                )}
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{s.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" /> {s.duration}
                  </p>
                </div>
                <span className="text-sm font-heading font-bold text-foreground">{s.price}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Availability */}
        <section>
          <h2 className="text-base font-heading font-semibold text-foreground mb-3">Availability</h2>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {v.availability.map((a) => (
              <div
                key={a.day}
                className={`flex-shrink-0 w-16 text-center py-2.5 rounded-xl border transition-all ${
                  a.active ? "bg-card border-border shadow-card" : "bg-muted border-transparent opacity-50"
                }`}
              >
                <p className="text-xs font-semibold text-foreground">{a.day}</p>
                <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{a.hours}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Gallery */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-heading font-semibold text-foreground">Past Work</h2>
            <span className="text-xs text-muted-foreground">{v.gallery.length} photos</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {v.gallery.map((img, i) => (
              <div
                key={i}
                className={`aspect-square rounded-xl ${img.bg} flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity`}
              >
                <Camera className="w-5 h-5 text-muted-foreground/50" />
              </div>
            ))}
          </div>
        </section>

        {/* Reviews */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-heading font-semibold text-foreground">Reviews</h2>
            <button className="text-xs font-medium text-primary hover:underline">See All</button>
          </div>
          <div className="space-y-3">
            {v.customerReviews.map((r, i) => (
              <div key={i} className="bg-card rounded-xl p-4 shadow-card">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-heading font-semibold text-accent-foreground">
                    {r.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{r.name}</p>
                    <p className="text-[10px] text-muted-foreground">{r.date}</p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star
                        key={j}
                        className={`w-3 h-3 ${j < r.rating ? "fill-secondary text-secondary" : "text-border"}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{r.text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border p-4">
        <div className="max-w-lg mx-auto flex gap-3">
          <Button variant="outline" size="lg" className="flex-shrink-0">
            <MessageCircle className="w-5 h-5" />
          </Button>
          <Button size="lg" className="flex-1" onClick={() => {
            const s = v.services[selectedService];
            const price = parseInt(s.price.replace(/[₹,]/g, ""));
            navigate("/book", { state: { category: "Plumbing", service: { name: s.name, price, duration: s.duration } } });
          }}>
            Book Now <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VendorProfile;
