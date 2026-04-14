import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, Zap, AlertTriangle, ChevronRight } from "lucide-react";

const slides = [
  {
    icon: Search,
    title: "Find Any Service Instantly",
    description: "From plumbing to tutoring — discover trusted professionals near you in seconds.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Zap,
    title: "AI Matches Best Vendors",
    description: "Our smart algorithm finds the perfect match based on your needs, budget, and location.",
    color: "text-secondary",
    bg: "bg-secondary/10",
  },
  {
    icon: AlertTriangle,
    title: "Emergency? One Tap Dispatch",
    description: "Get a plumber, electrician, or locksmith at your door in 15 minutes flat.",
    color: "text-emergency",
    bg: "bg-emergency/10",
  },
];

const Onboarding = () => {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (current < slides.length - 1) {
      setCurrent(current + 1);
    } else {
      navigate("/login");
    }
  };

  const slide = slides[current];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-between p-6 max-w-lg mx-auto">
      <div className="flex justify-end w-full pt-2">
        <button onClick={() => navigate("/login")} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          Skip
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in" key={current}>
        <div className={`p-6 rounded-3xl ${slide.bg} mb-8`}>
          <slide.icon className={`w-16 h-16 ${slide.color}`} />
        </div>
        <h2 className="text-2xl font-heading font-bold text-foreground mb-3">{slide.title}</h2>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">{slide.description}</p>
      </div>

      <div className="w-full space-y-4 pb-8">
        {/* Dots */}
        <div className="flex items-center justify-center gap-2">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current ? "w-8 bg-primary" : "w-2 bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
        <Button onClick={handleNext} size="xl" className="w-full">
          {current < slides.length - 1 ? "Next" : "Get Started"}
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;
