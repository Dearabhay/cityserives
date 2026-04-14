import { useNavigate } from "react-router-dom";
import { Wrench, Scissors, Lightbulb, Sparkles, BookOpen, Paintbrush, Hammer, Snowflake, CookingPot, Car, Dog, Heart } from "lucide-react";

const services = [
  { icon: Wrench, label: "Plumbing", color: "bg-primary/10 text-primary" },
  { icon: Scissors, label: "Salon", color: "bg-secondary/10 text-secondary" },
  { icon: Lightbulb, label: "Electrician", color: "bg-accent text-accent-foreground" },
  { icon: Sparkles, label: "Cleaning", color: "bg-success/10 text-success" },
  { icon: BookOpen, label: "Tutoring", color: "bg-primary/10 text-primary" },
  { icon: Paintbrush, label: "Painting", color: "bg-secondary/10 text-secondary" },
  { icon: Hammer, label: "Carpentry", color: "bg-accent text-accent-foreground" },
  { icon: Snowflake, label: "AC Repair", color: "bg-primary/10 text-primary" },
  { icon: CookingPot, label: "Cook", color: "bg-secondary/10 text-secondary" },
  { icon: Car, label: "Car Wash", color: "bg-success/10 text-success" },
  { icon: Dog, label: "Pet Care", color: "bg-accent text-accent-foreground" },
  { icon: Heart, label: "Massage", color: "bg-primary/10 text-primary" },
];

const ServiceCategoryGrid = () => {
  const navigate = useNavigate();

  return (
    <section className="animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-heading font-semibold text-foreground">Services</h2>
        <button onClick={() => navigate("/search")} className="text-sm font-medium text-primary hover:underline">View All</button>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {services.map((service) => (
          <button
            key={service.label}
            onClick={() => navigate(`/search?q=${encodeURIComponent(service.label)}`)}
            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card shadow-card hover:shadow-elevated transition-all duration-200 hover:-translate-y-0.5 group"
          >
            <div className={`p-2.5 rounded-xl ${service.color} transition-transform group-hover:scale-110`}>
              <service.icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-foreground">{service.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default ServiceCategoryGrid;
