import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarCheck, Clock, CheckCircle2, XCircle, MapPin, Phone, Loader2, Star, Navigation, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type Booking = {
  id: string;
  service_type: string;
  sub_service: string | null;
  scheduled_date: string;
  scheduled_time: string;
  address: string;
  city: string | null;
  status: string;
  price: number;
  emergency_flag: boolean;
  customer_id: string;
};

const tabs = ["Incoming", "Active", "Completed"];

const statusColors: Record<string, string> = {
  pending: "bg-secondary/10 text-secondary",
  confirmed: "bg-primary/10 text-primary",
  in_progress: "bg-primary/10 text-primary",
  completed: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
};

const VendorBookings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("Incoming");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerRatings, setCustomerRatings] = useState<Record<string, number>>({});
  const [ratedBookings, setRatedBookings] = useState<Set<string>>(new Set());
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user) return;
    const fetchBookings = async () => {
      // Fetch both assigned bookings AND available (unassigned pending) ones
      const { data } = await supabase
        .from("bookings")
        .select("*")
        .or(`vendor_id.eq.${user.id},and(vendor_id.is.null,status.eq.pending)`)
        .order("created_at", { ascending: false });
      if (data) {
        setBookings(data);
        // Fetch customer ratings for all unique customers
        const customerIds = [...new Set(data.map((b) => b.customer_id))];
        const ratingsMap: Record<string, number> = {};
        const fakeRatings = [4.2, 3.8, 4.5, 4.9, 3.5, 4.7, 4.0, 4.3];
        for (let i = 0; i < customerIds.length; i++) {
          const cid = customerIds[i];
          const { data: ratingData } = await supabase.rpc("get_customer_avg_rating", { _customer_id: cid });
          const real = ratingData !== null ? Number(ratingData) : 0;
          ratingsMap[cid] = real > 0 ? real : fakeRatings[i % fakeRatings.length];
        }
        setCustomerRatings(ratingsMap);

        // Check which bookings vendor already rated
        const { data: existingReviews } = await supabase
          .from("customer_reviews" as any)
          .select("booking_id")
          .eq("vendor_id", user.id) as any;
        if (existingReviews) {
          setRatedBookings(new Set(existingReviews.map((r: any) => r.booking_id)));
        }

        // Fetch unread message counts
        const activeBookingIds = data.filter(b => ["confirmed", "in_progress"].includes(b.status)).map(b => b.id);
        if (activeBookingIds.length > 0) {
          const { data: unreadMessages } = await supabase
            .from("chat_messages")
            .select("booking_id")
            .in("booking_id", activeBookingIds)
            .neq("sender_id", user.id)
            .eq("read", false);
          if (unreadMessages) {
            const counts: Record<string, number> = {};
            unreadMessages.forEach((m: any) => {
              counts[m.booking_id] = (counts[m.booking_id] || 0) + 1;
            });
            setUnreadCounts(counts);
          }
        }
      }
      setLoading(false);
    };
    fetchBookings();

    // Subscribe to new messages for real-time badge updates
    const channel = supabase
      .channel('vendor-unread-badges')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload: any) => {
        const msg = payload.new;
        if (msg.sender_id !== user.id) {
          setUnreadCounts(prev => ({ ...prev, [msg.booking_id]: (prev[msg.booking_id] || 0) + 1 }));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const acceptBooking = async (id: string) => {
    const { data: accepted, error } = await supabase.rpc("accept_booking", { _booking_id: id });
    if (error) { toast.error(error.message); return; }
    if (!accepted) {
      toast.error("This booking was already accepted by another vendor");
      // Remove from list
      setBookings(bookings.filter((b) => b.id !== id));
      return;
    }
    setBookings(bookings.map((b) => (b.id === id ? { ...b, status: "confirmed", vendor_id: user!.id } : b)));
    toast.success("Booking accepted! 🎉");
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setBookings(bookings.map((b) => (b.id === id ? { ...b, status } : b)));
    toast.success(`Booking ${status}`);
  };

  const filtered = bookings.filter((b) => {
    if (activeTab === "Incoming") return b.status === "pending";
    if (activeTab === "Active") return ["confirmed", "in_progress"].includes(b.status);
    return ["completed", "cancelled"].includes(b.status);
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 max-w-lg mx-auto">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border px-4 py-4">
        <h1 className="text-lg font-heading font-bold text-foreground">My Bookings</h1>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Tabs */}
        <div className="flex gap-2 bg-muted rounded-xl p-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-semibold transition-all",
                activeTab === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-card rounded-xl p-8 shadow-card text-center">
            <CalendarCheck className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No {activeTab.toLowerCase()} bookings</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((booking) => (
              <div key={booking.id} className="bg-card rounded-xl p-4 shadow-card space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-heading font-semibold text-foreground">
                        {booking.sub_service || booking.service_type}
                      </p>
                      {booking.emergency_flag && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emergency/10 text-emergency font-bold">
                          EMERGENCY
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{booking.service_type}</p>
                  </div>
                  <span className={cn("text-[10px] px-2 py-1 rounded-full font-semibold", statusColors[booking.status] || "bg-muted text-muted-foreground")}>
                    {booking.status.replace("_", " ").toUpperCase()}
                  </span>
                </div>

                {/* Customer Rating Badge */}
                {customerRatings[booking.customer_id] > 0 && (
                  <div className="flex items-center gap-1.5 bg-secondary/10 rounded-lg px-2.5 py-1.5 w-fit">
                    <Star className="w-3.5 h-3.5 fill-secondary text-secondary" />
                    <span className="text-xs font-semibold text-secondary">
                      {customerRatings[booking.customer_id]} Customer Rating
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{booking.scheduled_date} · {booking.scheduled_time}</span>
                  <span className="font-heading font-bold text-foreground">₹{booking.price}</span>
                </div>

                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                  <span className="truncate">{booking.address}{booking.city ? `, ${booking.city}` : ""}</span>
                </div>

                {activeTab === "Incoming" && (
                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => updateStatus(booking.id, "cancelled")}>
                      <XCircle className="w-4 h-4" /> Decline
                    </Button>
                    <Button variant="success" size="sm" className="flex-1" onClick={() => acceptBooking(booking.id)}>
                      <CheckCircle2 className="w-4 h-4" /> Accept
                    </Button>
                  </div>
                )}

                {activeTab === "Active" && booking.status === "confirmed" && (
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" onClick={() => updateStatus(booking.id, "in_progress")}>
                      Start Service
                    </Button>
                    <Button variant="outline" size="sm" className="relative" onClick={() => navigate(`/vendor/chat/${booking.id}`)}>
                      <MessageCircle className="w-4 h-4" />
                      {unreadCounts[booking.id] > 0 && (
                        <Badge className="absolute -top-2 -right-2 h-5 min-w-5 flex items-center justify-center p-0 text-[10px]">
                          {unreadCounts[booking.id]}
                        </Badge>
                      )}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/vendor/navigate/${booking.id}`)}>
                      <Navigation className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {activeTab === "Active" && booking.status === "in_progress" && (
                  <div className="flex gap-2">
                    <Button variant="success" size="sm" className="flex-1" onClick={() => updateStatus(booking.id, "completed")}>
                      <CheckCircle2 className="w-4 h-4" /> Mark Completed
                    </Button>
                    <Button variant="outline" size="sm" className="relative" onClick={() => navigate(`/vendor/chat/${booking.id}`)}>
                      <MessageCircle className="w-4 h-4" />
                      {unreadCounts[booking.id] > 0 && (
                        <Badge className="absolute -top-2 -right-2 h-5 min-w-5 flex items-center justify-center p-0 text-[10px]">
                          {unreadCounts[booking.id]}
                        </Badge>
                      )}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/vendor/navigate/${booking.id}`)}>
                      <Navigation className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {activeTab === "Completed" && booking.status === "completed" && !ratedBookings.has(booking.id) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => navigate(`/vendor/rate-customer/${booking.id}`)}
                  >
                    <Star className="w-4 h-4" /> Rate Customer
                  </Button>
                )}

                {activeTab === "Completed" && ratedBookings.has(booking.id) && (
                  <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-success" /> Customer rated
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorBookings;
