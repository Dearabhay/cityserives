import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  const handleReset = async () => {
    if (!email) { toast.error("Please enter your email"); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success("Password reset email sent!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <button onClick={() => navigate("/login")} className="flex items-center gap-1 text-sm text-muted-foreground mb-6 hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to login
        </button>
        <h1 className="text-2xl font-heading font-bold text-foreground mb-2">Reset Password</h1>
        {sent ? (
          <div className="space-y-4 animate-fade-in">
            <p className="text-sm text-muted-foreground">We've sent a reset link to <strong className="text-foreground">{email}</strong>. Check your inbox and follow the link.</p>
            <Button onClick={() => navigate("/login")} className="w-full h-12 rounded-xl">Back to Login</Button>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            <p className="text-sm text-muted-foreground mb-4">Enter your email and we'll send you a link to reset your password.</p>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12 rounded-xl" />
            </div>
            <Button onClick={handleReset} size="lg" className="w-full h-12 rounded-xl" disabled={loading}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Reset Link"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
