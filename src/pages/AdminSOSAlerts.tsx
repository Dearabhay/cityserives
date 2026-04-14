import { useEffect, useState } from "react";
import { AlertTriangle, MapPin, Clock, CheckCircle, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type SOSAlert = {
  id: string;
  user_id: string;
  emergency_type: string;
  location_address: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  created_at: string;
  resolved_at: string | null;
};

const AdminSOSAlerts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      const { data } = await supabase
        .from("sos_alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      setAlerts((data as SOSAlert[]) || []);
      setLoading(false);
    };
    fetchAlerts();

    // Real-time subscription
    const channel = supabase
      .channel("sos-alerts-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "sos_alerts" },
        (payload) => {
          const newAlert = payload.new as SOSAlert;
          setAlerts((prev) => [newAlert, ...prev]);
          toast.error(`🚨 New SOS Alert: ${newAlert.emergency_type}`, {
            duration: 10000,
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "sos_alerts" },
        (payload) => {
          const updated = payload.new as SOSAlert;
          setAlerts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const resolveAlert = async (id: string) => {
    const { error } = await supabase
      .from("sos_alerts")
      .update({ status: "resolved", resolved_at: new Date().toISOString() })
      .eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Alert resolved");
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeAlerts = alerts.filter((a) => a.status === "active");
  const resolvedAlerts = alerts.filter((a) => a.status === "resolved");

  return (
    <div className="min-h-screen bg-background pb-24 max-w-lg mx-auto">
      <header className="sticky top-0 z-40 bg-destructive px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-destructive-foreground/10">
          <ArrowLeft className="w-5 h-5 text-destructive-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-heading font-bold text-destructive-foreground">SOS Alerts</h1>
          <p className="text-xs text-destructive-foreground/70">
            {activeAlerts.length} active alert{activeAlerts.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="relative">
          <AlertTriangle className="w-6 h-6 text-destructive-foreground" />
          {activeAlerts.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive-foreground text-destructive text-[10px] font-bold rounded-full flex items-center justify-center">
              {activeAlerts.length}
            </span>
          )}
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {activeAlerts.length === 0 && resolvedAlerts.length === 0 && (
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No SOS alerts yet</p>
          </div>
        )}

        {activeAlerts.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-heading font-semibold text-destructive flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
              Active Alerts
            </h2>
            {activeAlerts.map((alert) => (
              <div key={alert.id} className="bg-card rounded-xl p-4 shadow-card border-l-4 border-destructive">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🆘</span>
                    <div>
                      <p className="text-sm font-heading font-semibold text-foreground">{alert.emergency_type}</p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {timeAgo(alert.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
                {alert.location_address && (
                  <p className="text-xs text-muted-foreground flex items-start gap-1 mb-3">
                    <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{alert.location_address}</span>
                  </p>
                )}
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => resolveAlert(alert.id)}
                >
                  <CheckCircle className="w-4 h-4 mr-1" /> Mark Resolved
                </Button>
              </div>
            ))}
          </div>
        )}

        {resolvedAlerts.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-heading font-semibold text-muted-foreground">Resolved</h2>
            {resolvedAlerts.map((alert) => (
              <div key={alert.id} className="bg-card rounded-xl p-3 shadow-card opacity-60">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{alert.emergency_type}</p>
                    <p className="text-[11px] text-muted-foreground">{timeAgo(alert.created_at)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSOSAlerts;
