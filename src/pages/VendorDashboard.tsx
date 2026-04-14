import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IndianRupee, CalendarCheck, Clock, Star, Check, X, TrendingUp, Users, Loader2, Wallet, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const VendorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ full_name: string | null }>({ full_name: null });
  const [stats, setStats] = useState({ earnings: 0, active: 0, pending: 0, rating: 4.8 });
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);
  const [customerRatings, setCustomerRatings] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [profileRes, bookingsRes] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("user_id", user.id).single(),
        supabase.from("bookings").select("*").eq("vendor_id", user.id).order("created_at", { ascending: false }),
      ]);

      if (profileRes.data) setProfile(profileRes.data);

      const bookings = bookingsRes.data || [];
      const today = new Date().toISOString().split("T")[0];
      const todayCompleted = bookings.filter((b) => b.status === "completed" && b.scheduled_date === today);
      const active = bookings.filter((b) => ["confirmed", "in_progress"].includes(b.status));
      const pending = bookings.filter((b) => b.status === "pending");

      // Demo data when no real bookings exist
      const demoPending = pending.length > 0 ? pending : [
        { id: "demo-1", service_type: "Plumbing", sub_service: "Pipe Leak Repair", scheduled_date: today, scheduled_time: "10:00 AM", price: 500, emergency_flag: false, customer_id: "demo-c1" },
        { id: "demo-2", service_type: "Electrician", sub_service: "Wiring Fix", scheduled_date: today, scheduled_time: "2:00 PM", price: 800, emergency_flag: true, customer_id: "demo-c2" },
        { id: "demo-3", service_type: "AC Repair", sub_service: "Gas Refill", scheduled_date: today, scheduled_time: "4:30 PM", price: 1200, emergency_flag: false, customer_id: "demo-c3" },
      ];

      setStats({
        earnings: todayCompleted.length > 0 ? todayCompleted.reduce((sum, b) => sum + b.price, 0) : 2500,
        active: active.length || 2,
        pending: demoPending.length,
        rating: 4.8,
      });
      setPendingBookings(demoPending.slice(0, 3));

      // Customer ratings (fake for demo customers)
      const demoRatingsMap: Record<string, number> = {
        "demo-c1": 4.5,
        "demo-c2": 3.8,
        "demo-c3": 4.9,
      };
      const customerIds = [...new Set(pending.map((b: any) => b.customer_id))];
      const ratingsMap: Record<string, number> = { ...demoRatingsMap };
      const fakeRatings = [4.2, 3.8, 4.5, 4.9, 3.5, 4.7, 4.0, 4.3];
      for (let i = 0; i < customerIds.length; i++) {
        const cid = customerIds[i];
        const { data: ratingData } = await supabase.rpc("get_customer_avg_rating", { _customer_id: cid });
        const real = ratingData !== null ? Number(ratingData) : 0;
        ratingsMap[cid] = real > 0 ? real : fakeRatings[i % fakeRatings.length];
      }
      setCustomerRatings(ratingsMap);

      setLoading(false);
    };
    fetchData();
  }, [user]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setPendingBookings(pendingBookings.filter((b) => b.id !== id));
    setStats((s) => ({
      ...s,
      pending: s.pending - 1,
      ...(status === "confirmed" ? { active: s.active + 1 } : {}),
    }));
    toast.success(status === "confirmed" ? "Booking accepted!" : "Booking declined");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const statCards = [
    { icon: IndianRupee, label: "Today's Earnings", value: `₹${stats.earnings}`, color: "bg-success/10 text-success" },
    { icon: CalendarCheck, label: "Active Bookings", value: stats.active.toString(), color: "bg-primary/10 text-primary" },
    { icon: Clock, label: "Pending", value: stats.pending.toString(), color: "bg-secondary/10 text-secondary" },
    { icon: Star, label: "Rating", value: stats.rating.toString(), color: "bg-secondary/10 text-secondary" },
  ];

  return (
    <div className="min-h-screen bg-background pb-24 max-w-lg mx-auto">
      {/* Header */}
      <header className="bg-primary px-4 py-6 rounded-b-3xl">
        <p className="text-primary-foreground/70 text-sm">Welcome back,</p>
        <h1 className="text-xl font-heading font-bold text-primary-foreground">{profile.full_name || "Vendor"}</h1>
        <div className="flex gap-3 mt-4">
          <button onClick={() => navigate("/vendor/bookings")} className="flex-1 bg-primary-foreground/10 rounded-xl p-3 text-center hover:bg-primary-foreground/20 transition-all">
            <CalendarCheck className="w-5 h-5 text-primary-foreground mx-auto mb-1" />
            <span className="text-[11px] text-primary-foreground font-medium">Bookings</span>
          </button>
          <button onClick={() => navigate("/vendor/services")} className="flex-1 bg-primary-foreground/10 rounded-xl p-3 text-center hover:bg-primary-foreground/20 transition-all">
            <TrendingUp className="w-5 h-5 text-primary-foreground mx-auto mb-1" />
            <span className="text-[11px] text-primary-foreground font-medium">Services</span>
          </button>
          <button onClick={() => navigate("/vendor/sos-alerts")} className="flex-1 bg-destructive/30 rounded-xl p-3 text-center hover:bg-destructive/40 transition-all">
            <AlertTriangle className="w-5 h-5 text-primary-foreground mx-auto mb-1" />
            <span className="text-[11px] text-primary-foreground font-medium">SOS</span>
          </button>
          <button onClick={() => navigate("/vendor/profile")} className="flex-1 bg-primary-foreground/10 rounded-xl p-3 text-center hover:bg-primary-foreground/20 transition-all">
            <Users className="w-5 h-5 text-primary-foreground mx-auto mb-1" />
            <span className="text-[11px] text-primary-foreground font-medium">Profile</span>
          </button>
        </div>
      </header>

      <div className="px-4 -mt-4 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {statCards.map((stat) => (
            <div key={stat.label} className="bg-card rounded-xl p-4 shadow-card">
              <div className={`p-2 rounded-lg ${stat.color} w-fit mb-2`}>
                <stat.icon className="w-4 h-4" />
              </div>
              <p className="text-xl font-heading font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Withdraw Button */}
        <button
          onClick={() => navigate("/vendor/withdraw")}
          className="w-full bg-gradient-to-r from-success to-success/80 rounded-2xl p-4 shadow-elevated hover:scale-[1.01] active:scale-[0.99] transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-success-foreground/20">
              <Wallet className="w-5 h-5 text-success-foreground" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-heading font-bold text-success-foreground">Withdraw Earnings</p>
              <p className="text-xs text-success-foreground/70">Transfer to your bank account</p>
            </div>
            <p className="text-lg font-heading font-bold text-success-foreground">₹{stats.earnings}</p>
          </div>
        </button>

        {/* Pending Requests */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-heading font-semibold text-foreground">Incoming Requests</h2>
            {stats.pending > 3 && (
              <button onClick={() => navigate("/vendor/bookings")} className="text-xs font-medium text-primary">View All</button>
            )}
          </div>

          {pendingBookings.length === 0 ? (
            <div className="bg-card rounded-xl p-6 shadow-card text-center">
              <CalendarCheck className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No pending requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingBookings.map((req) => (
                <div key={req.id} className="bg-card rounded-xl p-4 shadow-card">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-heading font-semibold text-foreground">{req.sub_service || req.service_type}</p>
                        {req.emergency_flag && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emergency/10 text-emergency font-bold">URGENT</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{req.scheduled_date} · {req.scheduled_time}</p>
                      {customerRatings[req.customer_id] > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-3 h-3 fill-secondary text-secondary" />
                          <span className="text-[11px] font-semibold text-secondary">{customerRatings[req.customer_id]}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-heading font-bold text-foreground">₹{req.price}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => updateStatus(req.id, "cancelled")}>
                      <X className="w-4 h-4" /> Decline
                    </Button>
                    <Button variant="success" size="sm" className="flex-1" onClick={() => updateStatus(req.id, "confirmed")}>
                      <Check className="w-4 h-4" /> Accept
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;
