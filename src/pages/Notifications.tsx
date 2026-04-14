import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, CheckCircle, AlertTriangle, Tag, Truck, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type Notification = {
  id: string;
  type: "booking" | "deal" | "emergency" | "update";
  title: string;
  body: string;
  time: string;
  read: boolean;
};

const mockNotifications: Notification[] = [
  { id: "1", type: "emergency", title: "Emergency Dispatched", body: "A plumber is on the way. ETA 12 minutes.", time: "2 min ago", read: false },
  { id: "2", type: "booking", title: "Booking Confirmed", body: "Your AC Repair with Amit Singh is confirmed for tomorrow at 10 AM.", time: "15 min ago", read: false },
  { id: "3", type: "deal", title: "Weekend Special 🎉", body: "Get 20% off on all cleaning services this Saturday & Sunday.", time: "1 hr ago", read: false },
  { id: "4", type: "update", title: "Vendor On The Way", body: "Raj Kumar is heading to your location. Track live now.", time: "2 hrs ago", read: true },
  { id: "5", type: "booking", title: "Service Completed", body: "Your plumbing service has been completed. Rate your experience!", time: "Yesterday", read: true },
  { id: "6", type: "deal", title: "Refer & Earn ₹200", body: "Share your referral code with friends and earn ₹200 per signup.", time: "2 days ago", read: true },
  { id: "7", type: "update", title: "New Vendor Nearby", body: "5-star rated electrician now available in your area.", time: "3 days ago", read: true },
  { id: "8", type: "emergency", title: "Emergency Resolved", body: "Your gas leak emergency has been resolved by the vendor.", time: "4 days ago", read: true },
];

const iconMap = {
  booking: CheckCircle,
  deal: Tag,
  emergency: AlertTriangle,
  update: Truck,
};

const colorMap = {
  booking: "bg-primary/10 text-primary",
  deal: "bg-secondary/10 text-secondary",
  emergency: "bg-emergency/10 text-emergency",
  update: "bg-success/10 text-success",
};

const Notifications = () => {
  const navigate = useNavigate();
  const unread = mockNotifications.filter((n) => !n.read);
  const read = mockNotifications.filter((n) => n.read);

  return (
    <div className="min-h-screen bg-background pb-24 max-w-lg mx-auto">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="font-heading font-semibold text-foreground">Notifications</h1>
        {unread.length > 0 && (
          <span className="ml-auto px-2 py-0.5 text-[10px] font-bold bg-emergency text-emergency-foreground rounded-full">
            {unread.length} new
          </span>
        )}
      </header>

      <div className="px-4 py-4 space-y-6">
        {unread.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">New</h2>
            <div className="space-y-2">
              {unread.map((n) => (
                <NotifCard key={n.id} notif={n} />
              ))}
            </div>
          </section>
        )}

        {read.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Earlier</h2>
            <div className="space-y-2">
              {read.map((n) => (
                <NotifCard key={n.id} notif={n} />
              ))}
            </div>
          </section>
        )}

        {mockNotifications.length === 0 && (
          <div className="text-center py-16">
            <Bell className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm font-heading font-semibold text-foreground">No notifications yet</p>
            <p className="text-xs text-muted-foreground mt-1">We'll notify you about bookings and offers</p>
          </div>
        )}
      </div>
    </div>
  );
};

const NotifCard = ({ notif }: { notif: Notification }) => {
  const Icon = iconMap[notif.type];
  const color = colorMap[notif.type];

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-xl transition-all",
        notif.read ? "bg-card shadow-card" : "bg-card shadow-elevated border-l-4 border-primary"
      )}
    >
      <div className={cn("p-2 rounded-lg flex-shrink-0 mt-0.5", color)}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("text-sm font-semibold text-foreground", !notif.read && "font-bold")}>{notif.title}</p>
          <span className="text-[10px] text-muted-foreground flex-shrink-0 mt-0.5">{notif.time}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{notif.body}</p>
      </div>
    </div>
  );
};

export default Notifications;
