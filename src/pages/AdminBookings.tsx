import { useEffect, useState } from "react";
import { Loader2, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const STATUSES = ["all", "pending", "confirmed", "in_progress", "completed", "cancelled"];

const AdminBookings = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const fetchBookings = async () => {
      const { data } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      setBookings(data || []);
      setLoading(false);
    };
    fetchBookings();

    const channel = supabase
      .channel("admin-bookings")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, (payload) => {
        if (payload.eventType === "INSERT") {
          setBookings((prev) => [payload.new as any, ...prev]);
        } else if (payload.eventType === "UPDATE") {
          setBookings((prev) => prev.map((b) => (b.id === (payload.new as any).id ? payload.new : b)));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Booking ${status}`);
  };

  const filtered = filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  const statusColor = (s: string) => {
    switch (s) {
      case "pending": return "bg-secondary/20 text-secondary";
      case "confirmed": return "bg-primary/20 text-primary";
      case "completed": return "bg-success/20 text-success";
      case "cancelled": return "bg-destructive/20 text-destructive";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-foreground">Bookings</h1>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s === "all" ? "All Statuses" : s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{filtered.length} booking(s)</p>

      <div className="space-y-3">
        {filtered.map((b) => (
          <Card key={b.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-foreground">{b.service_type}</p>
                    {b.sub_service && <span className="text-xs text-muted-foreground">· {b.sub_service}</span>}
                    {b.emergency_flag && <Badge variant="destructive" className="text-[10px]">Emergency</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{b.address}</p>
                  <p className="text-xs text-muted-foreground">
                    {b.scheduled_date} at {b.scheduled_time} · ₹{b.price} · {b.payment_method}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(b.status)}`}>
                  {b.status}
                </span>
              </div>
              {b.status !== "completed" && b.status !== "cancelled" && (
                <div className="flex gap-2 mt-3">
                  {b.status === "pending" && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus(b.id, "cancelled")}>Cancel</Button>
                  )}
                  {b.status === "confirmed" && (
                    <Button size="sm" onClick={() => updateStatus(b.id, "completed")}>Mark Complete</Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">No bookings found</p>
        )}
      </div>
    </div>
  );
};

export default AdminBookings;
