import { Star, MapPin } from "lucide-react";

const vendors = [
  { name: "Raj Kumar", service: "Plumber", rating: 4.8, reviews: 156, distance: "1.2 km", available: true, avatar: "RK" },
  { name: "Priya Sharma", service: "Electrician", rating: 4.9, reviews: 203, distance: "0.8 km", available: true, avatar: "PS" },
  { name: "Amit Singh", service: "AC Repair", rating: 4.7, reviews: 89, distance: "2.1 km", available: false, avatar: "AS" },
  { name: "Neha Gupta", service: "Salon", rating: 4.9, reviews: 312, distance: "1.5 km", available: true, avatar: "NG" },
];

const RecommendedVendors = () => {
  return (
    <section className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-heading font-semibold text-foreground">Recommended For You</h2>
        <button className="text-sm font-medium text-primary hover:underline">See All</button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {vendors.map((vendor) => (
          <div
            key={vendor.name}
            className="flex-shrink-0 w-44 bg-card rounded-xl p-3.5 shadow-card hover:shadow-elevated transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-heading font-semibold text-primary">
                {vendor.avatar}
              </div>
              {vendor.available && (
                <span className="ml-auto px-2 py-0.5 text-[10px] font-semibold bg-success/10 text-success rounded-full">
                  Available
                </span>
              )}
            </div>
            <h4 className="text-sm font-heading font-semibold text-foreground truncate">{vendor.name}</h4>
            <p className="text-xs text-muted-foreground mt-0.5">{vendor.service}</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-0.5">
                <Star className="w-3.5 h-3.5 fill-secondary text-secondary" />
                <span className="text-xs font-semibold text-foreground">{vendor.rating}</span>
              </div>
              <span className="text-muted-foreground">·</span>
              <div className="flex items-center gap-0.5 text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span className="text-xs">{vendor.distance}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default RecommendedVendors;
