import { useEffect, useState } from "react";
import { Loader2, IndianRupee, TrendingUp, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const AdminRevenue = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0 });
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [bookingsRes, withdrawalsRes] = await Promise.all([
        supabase.from("bookings").select("price, status, created_at"),
        supabase.from("withdrawals").select("*").order("created_at", { ascending: false }).limit(20),
      ]);

      const bookings = bookingsRes.data || [];
      const total = bookings.reduce((s, b) => s + (b.price || 0), 0);
      const completed = bookings.filter((b) => b.status === "completed").reduce((s, b) => s + (b.price || 0), 0);
      const pending = bookings.filter((b) => b.status === "pending" || b.status === "confirmed").reduce((s, b) => s + (b.price || 0), 0);

      setStats({ total, completed, pending });
      setWithdrawals(withdrawalsRes.data || []);

      // Group by month for chart
      const monthMap = new Map<string, number>();
      bookings.forEach((b) => {
        const month = new Date(b.created_at).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
        monthMap.set(month, (monthMap.get(month) || 0) + (b.price || 0));
      });
      setChartData(Array.from(monthMap.entries()).map(([name, revenue]) => ({ name, revenue })));

      setLoading(false);
    };
    fetchData();
  }, []);

  const processWithdrawal = async (id: string, status: "approved" | "rejected") => {
    const { error } = await supabase
      .from("withdrawals")
      .update({ status, processed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) { toast.error(error.message); return; }
    setWithdrawals((prev) => prev.map((w) => (w.id === id ? { ...w, status, processed_at: new Date().toISOString() } : w)));
    toast.success(`Withdrawal ${status}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Revenue & Analytics</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <IndianRupee className="w-5 h-5 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">₹{stats.total.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
            <TrendingUp className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">₹{stats.completed.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            <Clock className="w-5 h-5 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">₹{stats.pending.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Withdrawal Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {withdrawals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No withdrawal requests</p>
          ) : (
            <div className="space-y-3">
              {withdrawals.map((w) => (
                <div key={w.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0 gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">₹{w.amount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{w.bank_name} · {w.account_number}</p>
                    <p className="text-xs text-muted-foreground">{w.account_holder}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {w.status === "pending" ? (
                      <>
                        <Button size="sm" onClick={() => processWithdrawal(w.id, "approved")}>Approve</Button>
                        <Button size="sm" variant="outline" onClick={() => processWithdrawal(w.id, "rejected")}>Reject</Button>
                      </>
                    ) : (
                      <Badge variant={w.status === "approved" ? "default" : "destructive"}>{w.status}</Badge>
                    )}
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

export default AdminRevenue;
