import { useEffect, useState } from "react";
import { Loader2, Search, Shield, ShieldOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type UserWithRole = {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  avatar_url: string | null;
  created_at: string;
  role?: string;
};

const AdminUsers = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      const [profilesRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("*"),
      ]);

      const rolesMap = new Map<string, string>();
      rolesRes.data?.forEach((r) => rolesMap.set(r.user_id, r.role));

      const merged = (profilesRes.data || []).map((p) => ({
        ...p,
        role: rolesMap.get(p.user_id) || "unknown",
      }));

      setUsers(merged);
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "vendor" ? "customer" : "vendor";
    const { error } = await supabase
      .from("user_roles")
      .update({ role: newRole })
      .eq("user_id", userId);
    if (error) {
      toast.error(error.message);
      return;
    }
    setUsers((prev) =>
      prev.map((u) => (u.user_id === userId ? { ...u, role: newRole } : u))
    );
    toast.success(`Role changed to ${newRole}`);
  };

  const filtered = users.filter(
    (u) =>
      (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.phone || "").includes(search) ||
      (u.city || "").toLowerCase().includes(search.toLowerCase())
  );

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
        <h1 className="text-2xl font-bold text-foreground">Users & Vendors</h1>
        <Badge variant="secondary">{users.length} total</Badge>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, phone, or city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-3">
        {filtered.map((user) => (
          <Card key={user.user_id}>
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-semibold text-muted-foreground">
                      {(user.full_name || "?")[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{user.full_name || "No name"}</p>
                  <p className="text-xs text-muted-foreground">{user.phone || "No phone"} · {user.city || "No city"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant={user.role === "vendor" ? "default" : user.role === "admin" ? "destructive" : "secondary"}>
                  {user.role}
                </Badge>
                {user.role !== "admin" && (
                  <Button size="sm" variant="outline" onClick={() => toggleRole(user.user_id, user.role || "customer")}>
                    {user.role === "vendor" ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">No users found</p>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
