import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Lock, Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      // Supabase auto-sets the session from the hash
    }
  }, []);

  const handleUpdate = async () => {
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (password !== confirmPassword) { toast.error("Passwords do not match"); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      toast.success("Password updated successfully!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md text-center space-y-4 animate-fade-in">
          <CheckCircle className="w-16 h-16 text-primary mx-auto" />
          <h1 className="text-2xl font-heading font-bold text-foreground">Password Updated!</h1>
          <p className="text-sm text-muted-foreground">Your password has been changed successfully.</p>
          <Button onClick={() => navigate("/login")} size="lg" className="w-full h-12 rounded-xl">Go to Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-heading font-bold text-foreground mb-2">Set New Password</h1>
        <p className="text-sm text-muted-foreground mb-6">Enter your new password below.</p>
        <div className="space-y-4 animate-fade-in">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input type={showPassword ? "text" : "password"} placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 h-12 rounded-xl" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-10 h-12 rounded-xl" />
          </div>
          <Button onClick={handleUpdate} size="lg" className="w-full h-12 rounded-xl" disabled={loading}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Update Password"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
