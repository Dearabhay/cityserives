import { AlertTriangle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const EmergencyBanner = () => {
  const navigate = useNavigate();

  return (
    <section className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
      <button
        onClick={() => navigate("/emergency")}
        className="w-full relative overflow-hidden rounded-2xl bg-emergency p-5 shadow-emergency transition-all hover:scale-[1.01] active:scale-[0.99]"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-emergency/0 to-emergency/30" />
        <div className="relative flex items-center gap-4">
          <div className="flex-shrink-0 p-3 rounded-xl bg-emergency-foreground/20 backdrop-blur-sm">
            <AlertTriangle className="w-7 h-7 text-emergency-foreground" />
          </div>
          <div className="flex-1 text-left">
            <h3 className="text-base font-heading font-bold text-emergency-foreground">
              Need Emergency Help?
            </h3>
            <p className="text-sm text-emergency-foreground/80 mt-0.5">
              Plumber / Electrician in 15 min
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-emergency-foreground/80" />
        </div>
      </button>
    </section>
  );
};

export default EmergencyBanner;
