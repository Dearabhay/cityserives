import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [step, setStep] = useState<"auth" | "role">("auth");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { user, userRole } = useAuth();

  // Handle redirect after Google OAuth or already logged-in users
  useEffect(() => {
    if (!user) return;
    if (userRole) {
      navigate(userRole === "vendor" ? "/vendor" : userRole === "admin" ? "/admin" : "/", { replace: true });
    } else {
      // User exists but no role — show role selection
      setStep("role");
    }
  }, [user, userRole, navigate]);

  const handleEmailAuth = async () => {
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }
    if (isSignUp && !fullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName.trim() },
          },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Role check happens via useEffect above
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Lovable hata diya — ab direct Supabase Google OAuth use ho raha hai
  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      // Supabase redirect karega — loading state reset nahi karna
    } catch (error: any) {
      toast.error(error.message || "Google sign-in failed");
      setLoading(false);
    }
  };

  const handleRoleSelect = async (role: "customer" | "vendor") => {
    if (!user) return;
    setLoading(true);
    try {
      // Check if role already exists
      const { data: existing } = await supabase
        .from("user_roles")
        .select("id, role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        // Update existing role
        const { error } = await supabase
          .from("user_roles")
          .update({ role })
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_roles").insert({
          user_id: user.id,
          role,
        });
        if (error) throw error;
      }
      navigate(role === "customer" ? "/" : "/vendor", { replace: true });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 sm:px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-primary">Servantra</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Your City. Your Services. One App.</p>
        </div>

        {step === "auth" && (
          <div className="space-y-3 sm:space-y-4 animate-fade-in">
            {isSignUp && (
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Full Name</label>
                <Input
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-11 sm:h-12 rounded-xl"
                />
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 sm:h-12 rounded-xl"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 sm:h-12 rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button onClick={handleEmailAuth} size="lg" className="w-full h-11 sm:h-12 rounded-xl" disabled={loading}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>{isSignUp ? "Sign Up" : "Sign In"} <ArrowRight className="w-5 h-5 ml-1" /></>
              )}
            </Button>

            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-primary font-medium"
              >
                {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
              </button>
              {!isSignUp && (
                <button
                  onClick={() => navigate("/forgot-password")}
                  className="text-xs text-muted-foreground hover:text-primary"
                >
                  Forgot password?
                </button>
              )}
            </div>

            <div className="relative my-4 sm:my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center"><span className="bg-background px-3 text-xs text-muted-foreground">or continue with</span></div>
            </div>

            <Button variant="outline" size="lg" className="w-full h-11 sm:h-12 rounded-xl" onClick={handleGoogleSignIn} disabled={loading}>
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </Button>
          </div>
        )}

        {step === "role" && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-lg sm:text-xl font-heading font-bold text-center text-foreground mb-4 sm:mb-6">How will you use Servantra?</h2>
            <button
              onClick={() => handleRoleSelect("customer")}
              disabled={loading}
              className="w-full p-4 sm:p-5 rounded-2xl bg-card border-2 border-transparent hover:border-primary shadow-card hover:shadow-elevated transition-all text-left"
            >
              <h3 className="font-heading font-semibold text-foreground">👤 I need services</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Book plumbers, electricians, cleaners & more</p>
            </button>
            <button
              onClick={() => handleRoleSelect("vendor")}
              disabled={loading}
              className="w-full p-4 sm:p-5 rounded-2xl bg-card border-2 border-transparent hover:border-secondary shadow-card hover:shadow-elevated transition-all text-left"
            >
              <h3 className="font-heading font-semibold text-foreground">🛠️ I provide services</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">List your services & grow your business</p>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;