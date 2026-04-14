import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Check, ChevronRight, MapPin, CalendarIcon, Clock, FileText, CreditCard, Loader2, IndianRupee, Locate, Home, Briefcase, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { serviceCatalog } from "@/data/services";
import AddressForm, { type AddressFields, fieldsToFullAddress, parseAddressToFields } from "@/components/AddressForm";

const services = serviceCatalog;

const timeSlots = [
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "1:00 PM", "2:00 PM", "2:30 PM", "3:00 PM",
  "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM", "6:00 PM",
];

const paymentMethods = [
  { id: "upi", label: "UPI", icon: "📱" },
  { id: "card", label: "Card", icon: "💳" },
  { id: "cash", label: "Cash", icon: "💵" },
  { id: "wallet", label: "Wallet", icon: "👛" },
];

const TOTAL_STEPS = 5;

const BookingFlow = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Service is pre-selected from vendor profile
  const preSelected = location.state as { category?: string; service?: { name: string; price: number; duration: string } } | null;
  
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Pre-selected service
  const [selectedCategory, setSelectedCategory] = useState<string | null>(preSelected?.category || null);
  const [selectedSub, setSelectedSub] = useState<{ name: string; price: number; duration: string } | null>(preSelected?.service || null);

  // Step 2
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Step 3
  const [addressFields, setAddressFields] = useState<AddressFields>({
    flat: "", street: "", area: "", city: "", pincode: "", country: "India",
  });
  const [savedAddresses, setSavedAddresses] = useState<{ id: string; label: string; address: string; city: string | null }[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("saved_addresses").select("id, label, address, city").eq("user_id", user.id).order("created_at").then(({ data }) => {
      if (data) setSavedAddresses(data);
    });
  }, [user]);

  // Step 4
  const [instructions, setInstructions] = useState("");

  // Step 5
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);

  // Step 6
  const [paymentMethod, setPaymentMethod] = useState("cash");

  // Result
  const [bookingId, setBookingId] = useState<string | null>(null);

  const discount = promoApplied ? Math.round((selectedSub?.price || 0) * 0.1) : 0;
  const total = (selectedSub?.price || 0) - discount;

  const canNext = () => {
    switch (step) {
      case 1: return !!selectedDate && !!selectedTime;
      case 2: return addressFields.street.trim().length > 0;
      case 3: return true;
      case 4: return true;
      case 5: return !!paymentMethod;
      default: return false;
    }
  };

  const handleApplyPromo = () => {
    if (promoCode.trim().toUpperCase() === "SERVANTRA10") {
      setPromoApplied(true);
      toast.success("Promo applied! 10% off");
    } else if (promoCode.trim()) {
      toast.error("Invalid promo code");
    }
  };

  const handleSubmit = async () => {
    if (!user || !selectedSub || !selectedDate || !selectedTime) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.from("bookings").insert({
        customer_id: user.id,
        service_type: selectedCategory!,
        sub_service: selectedSub.name,
        scheduled_date: format(selectedDate, "yyyy-MM-dd"),
        scheduled_time: selectedTime,
        address: fieldsToFullAddress(addressFields),
        city: addressFields.city.trim() || null,
        special_instructions: instructions.trim() || null,
        promo_code: promoApplied ? promoCode.trim() : null,
        payment_method: paymentMethod,
        price: total,
      }).select("id").single();
      if (error) throw error;
      setBookingId(data.id);
      setStep(6); // confirmation
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const stepLabels = ["Date & Time", "Address", "Notes", "Price", "Payment"];

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => step > 1 && step < 7 ? setStep(step - 1) : navigate(-1)} className="p-2 rounded-xl hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-heading font-semibold text-foreground">
            {step <= TOTAL_STEPS ? stepLabels[step - 1] : "Confirmed!"}
          </h1>
          {step <= TOTAL_STEPS && (
            <span className="ml-auto text-xs text-muted-foreground font-medium">{step}/{TOTAL_STEPS}</span>
          )}
        </div>
        {step <= TOTAL_STEPS && (
          <div className="flex gap-1">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div key={i} className={cn("h-1 flex-1 rounded-full transition-all", i < step ? "bg-primary" : "bg-muted")} />
            ))}
          </div>
        )}
      </header>

      <div className="px-4 py-6">
        {/* Step 1: Date & Time */}
        {step === 1 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <label className="text-sm font-heading font-semibold text-foreground mb-2 block">Pick a date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start h-12 rounded-xl", !selectedDate && "text-muted-foreground")}>
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {selectedDate ? format(selectedDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="text-sm font-heading font-semibold text-foreground mb-2 block">Pick a time</label>
              <div className="grid grid-cols-3 gap-2">
                {timeSlots.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTime(t)}
                    className={cn(
                      "py-2.5 rounded-xl text-xs font-semibold transition-all",
                      selectedTime === t ? "bg-primary text-primary-foreground" : "bg-card border border-border text-foreground hover:border-primary/50"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Address */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-accent">
              <MapPin className="w-4 h-4 text-accent-foreground" />
              <span className="text-xs text-accent-foreground">Confirm your service address</span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!navigator.geolocation) {
                  toast.error("Geolocation not supported");
                  return;
                }
                toast.loading("Detecting location...", { id: "geo" });
                navigator.geolocation.getCurrentPosition(
                  async (pos) => {
                    try {
                      const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`
                      );
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
                      toast.success("Location detected!", { id: "geo" });
                    } catch {
                      toast.dismiss("geo");
                    }
                  },
                  () => {
                    toast.error("Location access denied", { id: "geo" });
                  },
                  { enableHighAccuracy: true, timeout: 10000 }
                );
              }}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 transition-all"
            >
              <div className="p-2 rounded-lg bg-primary/10">
                <Locate className="w-4 h-4 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">Detect My Live Location</p>
                <p className="text-[11px] text-muted-foreground">Use GPS to auto-fill your address</p>
              </div>
            </button>

            {/* Saved Addresses */}
            {savedAddresses.length > 0 && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Saved Addresses</label>
                <div className="space-y-2">
                  {savedAddresses.map((sa) => {
                    const Icon = sa.label === "Home" ? Home : sa.label === "Work" ? Briefcase : MoreHorizontal;
                    const fullAddr = fieldsToFullAddress(addressFields);
                    const isSelected = fullAddr === sa.address;
                    return (
                      <button
                        key={sa.id}
                        type="button"
                        onClick={() => setAddressFields(parseAddressToFields(sa.address, sa.city || ""))}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left",
                          isSelected ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30"
                        )}
                      >
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">{sa.label}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{sa.address}{sa.city ? `, ${sa.city}` : ""}</p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <AddressForm value={addressFields} onChange={setAddressFields} />
          </div>
        )}

        {/* Step 3: Instructions */}
        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-accent">
              <FileText className="w-4 h-4 text-accent-foreground" />
              <span className="text-xs text-accent-foreground">Any special instructions? (optional)</span>
            </div>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="E.g. Ring doorbell twice, pet dog friendly, bring specific tools..."
              maxLength={500}
              rows={4}
              className="w-full rounded-xl bg-muted border-none p-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">{instructions.length}/500</p>
          </div>
        )}

        {/* Step 4: Price Summary */}
        {step === 4 && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-card rounded-xl shadow-card overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="text-sm font-heading font-semibold text-foreground">Booking Summary</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{selectedSub?.name}</span>
                  <span className="font-semibold text-foreground">₹{selectedSub?.price}</span>
                </div>
                {promoApplied && (
                  <div className="flex justify-between text-sm text-success">
                    <span>Promo (SERVANTRA10)</span>
                    <span>-₹{discount}</span>
                  </div>
                )}
                <div className="border-t border-border pt-3 flex justify-between">
                  <span className="text-sm font-heading font-bold text-foreground">Total</span>
                  <span className="text-lg font-heading font-bold text-foreground">₹{total}</span>
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Promo Code</label>
              <div className="flex gap-2">
                <Input
                  value={promoCode}
                  onChange={(e) => { setPromoCode(e.target.value); setPromoApplied(false); }}
                  placeholder="Enter code"
                  className="h-11 rounded-xl flex-1"
                  disabled={promoApplied}
                />
                <Button variant={promoApplied ? "success" : "outline"} onClick={handleApplyPromo} disabled={promoApplied} className="h-11">
                  {promoApplied ? <Check className="w-4 h-4" /> : "Apply"}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Try: SERVANTRA10</p>
            </div>
          </div>
        )}

        {/* Step 5: Payment */}
        {step === 5 && (
          <div className="space-y-4 animate-fade-in">
            <p className="text-sm text-muted-foreground">Select how you'd like to pay.</p>
            <div className="space-y-2">
              {paymentMethods.map((pm) => (
                <button
                  key={pm.id}
                  onClick={() => setPaymentMethod(pm.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left",
                    paymentMethod === pm.id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30"
                  )}
                >
                  <span className="text-2xl">{pm.icon}</span>
                  <span className="text-sm font-semibold text-foreground">{pm.label}</span>
                  {paymentMethod === pm.id && <Check className="w-5 h-5 text-primary ml-auto" />}
                </button>
              ))}
            </div>
            <div className="bg-card rounded-xl p-4 shadow-card flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total to pay</span>
              <span className="text-lg font-heading font-bold text-foreground">₹{total}</span>
            </div>
          </div>
        )}

        {/* Step 6: Confirmation */}
        {step === 6 && (
          <div className="text-center py-8 animate-fade-in space-y-6">
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto">
              <Check className="w-10 h-10 text-success" />
            </div>
            <div>
              <h2 className="text-xl font-heading font-bold text-foreground">Booking Confirmed!</h2>
              <p className="text-sm text-muted-foreground mt-1">Your service has been booked successfully.</p>
            </div>
            <div className="bg-card rounded-xl p-4 shadow-card text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Booking ID</span>
                <span className="font-mono text-xs text-foreground">{bookingId?.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Service</span>
                <span className="font-semibold text-foreground">{selectedSub?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date</span>
                <span className="text-foreground">{selectedDate && format(selectedDate, "PPP")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Time</span>
                <span className="text-foreground">{selectedTime}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-heading font-bold text-foreground">₹{total}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" size="lg" className="flex-1" onClick={() => navigate("/")}>
                Home
              </Button>
              <Button size="lg" className="flex-1" onClick={() => navigate("/bookings")}>
                My Bookings
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      {step <= TOTAL_STEPS && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border p-4">
          <div className="max-w-lg mx-auto">
            <Button
              size="xl"
              className="w-full"
              disabled={!canNext() || submitting}
              onClick={() => {
                if (step < TOTAL_STEPS) setStep(step + 1);
                else handleSubmit();
              }}
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : step === TOTAL_STEPS ? (
                <>Confirm & Pay ₹{total}</>
              ) : (
                <>Continue <ChevronRight className="w-5 h-5" /></>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingFlow;
