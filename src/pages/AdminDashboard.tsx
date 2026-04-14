import { useEffect, useState } from "react";
import { Users, CalendarCheck, AlertTriangle, IndianRupee, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

const AdminDashboard = () => {
  const [stats, setStats] = useState({ users: 0, bookings: 0, sosAlerts: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      const [profilesRes, bookingsRes, sosRes, recentRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("bookings").select("id, price", { count: "exact" }),
        supabase.from("sos_alerts").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("bookings").select("*").order("created_at", { ascending: false }).limit(5),
      ]);

      const totalRevenue = bookingsRes.data?.reduce((sum, b) => sum + (b.price || 0), 0) || 0;

      setStats({
        users: profilesRes.count || 0,
        bookings: bookingsRes.count || 0,
        sosAlerts: sosRes.count || 0,
        revenue: totalRevenue,
      });
      setRecentBookings(recentRes.data || []);
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const cards = [
    { title: "Total Users", value: stats.users, icon: Users, color: "text-primary" },
    { title: "Total Bookings", value: stats.bookings, icon: CalendarCheck, color: "text-secondary" },
    { title: "Active SOS Alerts", value: stats.sosAlerts, icon: AlertTriangle, color: "text-destructive" },
    { title: "Total Revenue", value: `₹${stats.revenue.toLocaleString()}`, icon: IndianRupee, color: "text-success" },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <card.icon className={cn("w-5 h-5", card.color)} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {recentBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No bookings yet</p>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{b.service_type}</p>
                    <p className="text-xs text-muted-foreground">{b.address}</p>
                  </div>
                  <div className="text-right">
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      b.status === "pending" && "bg-secondary/20 text-secondary",
                      b.status === "confirmed" && "bg-primary/20 text-primary",
                      b.status === "completed" && "bg-success/20 text-success",
                      b.status === "cancelled" && "bg-destructive/20 text-destructive",
                    )}>
                      {b.status}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">₹{b.price}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const cn = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(" ");

export default AdminDashboard;
