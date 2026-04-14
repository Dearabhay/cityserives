import { Clock, ArrowRight } from "lucide-react";

const bookings = [
  { vendor: "Raj Kumar", service: "Plumbing", status: "On the way", time: "ETA 12 min", color: "bg-secondary/10 text-secondary" },
  { vendor: "Priya Sharma", service: "Electrical", status: "Scheduled", time: "Tomorrow, 10 AM", color: "bg-primary/10 text-primary" },
];

const ActiveBookings = () => {
  if (bookings.length === 0) return null;

  return (
    <section className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
      <h2 className="text-lg font-heading font-semibold text-foreground mb-4">Active Bookings</h2>
      <div className="space-y-3">
        {bookings.map((booking, i) => (
          <button
            key={i}
            className="w-full flex items-center gap-3 bg-card rounded-xl p-4 shadow-card hover:shadow-elevated transition-all text-left"
          >
            <div className={`p-2 rounded-lg ${booking.color}`}>
              <Clock className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-heading font-semibold text-foreground">{booking.service}</p>
              <p className="text-xs text-muted-foreground">{booking.vendor} · {booking.time}</p>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${booking.color}`}>
              {booking.status}
            </span>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </button>
        ))}
      </div>
    </section>
  );
};

export default ActiveBookings;
