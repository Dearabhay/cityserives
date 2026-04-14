import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Crown, Zap, Shield, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const plans = [
  {
    id: "weekly",
    name: "Weekly",
    price: 199,
    period: "/week",
    popular: false,
    features: ["1 service per week", "Priority booking", "5% discount on all services"],
    color: "border-border",
  },
  {
    id: "monthly",
    name: "Monthly",
    price: 599,
    period: "/month",
    popular: true,
    features: ["4 services per month", "Priority booking", "15% discount", "No surge pricing", "Free rescheduling"],
    color: "border-primary",
  },
  {
    id: "quarterly",
    name: "Quarterly",
    price: 1499,
    period: "/3 months",
    popular: false,
    features: ["12 services", "Priority + VIP booking", "20% discount", "No surge pricing", "Free rescheduling", "Dedicated support"],
    color: "border-border",
  },
];

const serviceTypes = ["Cleaning", "Plumbing", "Electrician", "AC Repair", "Salon", "Cook"];

const SubscriptionPlans = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const toggleService = (s: string) => {
    setSelectedServices((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  return (
    <div className="min-h-screen bg-background pb-8 max-w-lg mx-auto">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="font-heading font-semibold text-foreground">Subscription Plans</h1>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Hero */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mx-auto mb-3">
            <Crown className="w-7 h-7 text-secondary" />
          </div>
          <h2 className="text-xl font-heading font-bold text-foreground">Save More with Subscriptions</h2>
          <p className="text-sm text-muted-foreground mt-1">Recurring services at discounted rates</p>
        </div>

        {/* Plans */}
        <div className="space-y-3">
          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={cn(
                "w-full text-left rounded-2xl border-2 p-5 transition-all relative overflow-hidden",
                selectedPlan === plan.id
                  ? "border-primary bg-primary/5 shadow-elevated"
                  : `${plan.color} bg-card shadow-card hover:shadow-elevated`
              )}
            >
              {plan.popular && (
                <span className="absolute top-3 right-3 px-2.5 py-0.5 text-[10px] font-bold bg-secondary text-secondary-foreground rounded-full">
                  POPULAR
                </span>
              )}
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-2xl font-heading font-bold text-foreground">₹{plan.price}</span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>
              <p className="text-sm font-heading font-semibold text-foreground mb-3">{plan.name} Plan</p>
              <div className="space-y-1.5">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-success flex-shrink-0" />
                    <span className="text-xs text-muted-foreground">{f}</span>
                  </div>
                ))}
              </div>
            </button>
          ))}
        </div>

        {/* Service Selection */}
        {selectedPlan && (
          <section className="animate-slide-up">
            <h3 className="text-base font-heading font-semibold text-foreground mb-3">Choose services to include</h3>
            <div className="flex flex-wrap gap-2">
              {serviceTypes.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleService(s)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                    selectedServices.includes(s)
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border text-foreground hover:border-primary/50"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Benefits */}
        <section className="bg-card rounded-2xl p-5 shadow-card">
          <h3 className="text-sm font-heading font-semibold text-foreground mb-3">Subscriber Benefits</h3>
          <div className="space-y-3">
            {[
              { icon: Zap, label: "Priority Booking", desc: "Get matched with vendors faster" },
              { icon: Shield, label: "No Surge Pricing", desc: "Pay the same rate during peak hours" },
              { icon: Star, label: "Exclusive Discounts", desc: "Up to 20% off on all services" },
            ].map((b) => (
              <div key={b.label} className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-secondary/10 flex-shrink-0">
                  <b.icon className="w-4 h-4 text-secondary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{b.label}</p>
                  <p className="text-xs text-muted-foreground">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Subscribe Button */}
        <Button
          size="xl"
          className="w-full"
          disabled={!selectedPlan || selectedServices.length === 0}
          onClick={() => {
            const plan = plans.find((p) => p.id === selectedPlan);
            navigate("/book");
          }}
        >
          {selectedPlan
            ? `Subscribe — ₹${plans.find((p) => p.id === selectedPlan)?.price}${plans.find((p) => p.id === selectedPlan)?.period}`
            : "Select a plan"}
        </Button>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
