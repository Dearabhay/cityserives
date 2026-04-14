import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Wallet, Loader2, Clock, CheckCircle2, AlertCircle, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Withdrawal = {
  id: string;
  amount: number;
  status: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  created_at: string;
};

const statusConfig: Record<string, { icon: typeof Clock; color: string; label: string }> = {
  pending: { icon: Clock, color: "bg-secondary/10 text-secondary", label: "Pending" },
  processing: { icon: Loader2, color: "bg-primary/10 text-primary", label: "Processing" },
  completed: { icon: CheckCircle2, color: "bg-success/10 text-success", label: "Completed" },
  failed: { icon: AlertCircle, color: "bg-destructive/10 text-destructive", label: "Failed" },
};

const VendorWithdraw = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<"form" | "confirm" | "done">("form");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalWithdrawn, setTotalWithdrawn] = useState(0);

  // Form
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmAccount, setConfirmAccount] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [accountHolder, setAccountHolder] = useState("");

  const availableBalance = totalEarnings - totalWithdrawn;

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [bookingsRes, withdrawalsRes] = await Promise.all([
        supabase.from("bookings").select("price, status").eq("vendor_id", user.id).eq("status", "completed"),
        supabase.from("withdrawals").select("*").eq("vendor_id", user.id).order("created_at", { ascending: false }),
      ]);
      const earnings = (bookingsRes.data || []).reduce((sum, b) => sum + b.price, 0);
      setTotalEarnings(earnings);
      if (withdrawalsRes.data) {
        setWithdrawals(withdrawalsRes.data as Withdrawal[]);
        const withdrawn = withdrawalsRes.data
          .filter((w) => w.status !== "failed")
          .reduce((sum, w) => sum + w.amount, 0);
        setTotalWithdrawn(withdrawn);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const validateForm = () => {
    if (!amount || Number(amount) <= 0) { toast.error("Enter a valid amount"); return false; }
    if (Number(amount) > availableBalance) { toast.error("Amount exceeds available balance"); return false; }
    if (Number(amount) < 100) { toast.error("Minimum withdrawal is ₹100"); return false; }
    if (!bankName.trim()) { toast.error("Enter bank name"); return false; }
    if (!accountNumber.trim() || accountNumber.length < 8) { toast.error("Enter valid account number"); return false; }
    if (accountNumber !== confirmAccount) { toast.error("Account numbers don't match"); return false; }
    if (!ifscCode.trim() || ifscCode.length < 8) { toast.error("Enter valid IFSC code"); return false; }
    if (!accountHolder.trim()) { toast.error("Enter account holder name"); return false; }
    return true;
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.from("withdrawals").insert({
        vendor_id: user.id,
        amount: Number(amount),
        bank_name: bankName.trim(),
        account_number: accountNumber.trim(),
        ifsc_code: ifscCode.trim().toUpperCase(),
        account_holder: accountHolder.trim(),
      }).select().single();
      if (error) throw error;
      setWithdrawals([data as Withdrawal, ...withdrawals]);
      setTotalWithdrawn(totalWithdrawn + Number(amount));
      setStep("done");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 max-w-lg mx-auto">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => step === "confirm" ? setStep("form") : navigate(-1)} className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="font-heading font-semibold text-foreground">
          {step === "done" ? "Withdrawal Requested" : "Withdraw Money"}
        </h1>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-5 text-primary-foreground">
          <p className="text-sm text-primary-foreground/70">Available Balance</p>
          <p className="text-3xl font-heading font-bold mt-1">₹{availableBalance.toLocaleString()}</p>
          <div className="flex gap-4 mt-3 text-xs text-primary-foreground/70">
            <span>Earned: ₹{totalEarnings.toLocaleString()}</span>
            <span>Withdrawn: ₹{totalWithdrawn.toLocaleString()}</span>
          </div>
        </div>

        {/* Step: Bank Details Form */}
        {step === "form" && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-card rounded-xl p-4 shadow-card space-y-4">
              <h2 className="text-sm font-heading font-semibold text-foreground flex items-center gap-2">
                <Landmark className="w-4 h-4 text-primary" /> Bank Details
              </h2>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Withdrawal Amount (₹)</label>
                <Input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="Enter amount (min ₹100)"
                  type="text"
                  inputMode="numeric"
                  className="h-12 rounded-xl text-lg font-heading font-bold"
                />
                {availableBalance > 0 && (
                  <button onClick={() => setAmount(availableBalance.toString())} className="text-[11px] text-primary font-medium mt-1">
                    Withdraw full balance (₹{availableBalance.toLocaleString()})
                  </button>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Account Holder Name</label>
                <Input value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} placeholder="As per bank records" className="h-11 rounded-xl" maxLength={100} />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Bank Name</label>
                <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. State Bank of India" className="h-11 rounded-xl" maxLength={100} />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Account Number</label>
                <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9]/g, ""))} placeholder="Enter account number" className="h-11 rounded-xl" type="text" inputMode="numeric" maxLength={20} />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Confirm Account Number</label>
                <Input value={confirmAccount} onChange={(e) => setConfirmAccount(e.target.value.replace(/[^0-9]/g, ""))} placeholder="Re-enter account number" className="h-11 rounded-xl" type="text" inputMode="numeric" maxLength={20} />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">IFSC Code</label>
                <Input value={ifscCode} onChange={(e) => setIfscCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} placeholder="e.g. SBIN0001234" className="h-11 rounded-xl" maxLength={11} />
              </div>
            </div>

            <Button
              size="lg"
              className="w-full"
              disabled={!amount || !bankName || !accountNumber || !ifscCode || !accountHolder}
              onClick={() => { if (validateForm()) setStep("confirm"); }}
            >
              <Wallet className="w-5 h-5" /> Review Withdrawal
            </Button>
          </div>
        )}

        {/* Step: Confirm */}
        {step === "confirm" && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-card rounded-xl shadow-card overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="text-sm font-heading font-semibold text-foreground">Confirm Withdrawal</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-heading font-bold text-foreground">₹{Number(amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Account Holder</span>
                  <span className="font-medium text-foreground">{accountHolder}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Bank</span>
                  <span className="text-foreground">{bankName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Account</span>
                  <span className="font-mono text-foreground">****{accountNumber.slice(-4)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">IFSC</span>
                  <span className="font-mono text-foreground">{ifscCode}</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-xl bg-accent">
              <AlertCircle className="w-4 h-4 text-accent-foreground mt-0.5 shrink-0" />
              <p className="text-[11px] text-accent-foreground">Withdrawals are typically processed within 2-3 business days. Please ensure your bank details are correct.</p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" size="lg" className="flex-1" onClick={() => setStep("form")}>
                Edit
              </Button>
              <Button size="lg" className="flex-1" disabled={submitting} onClick={handleSubmit}>
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Withdraw"}
              </Button>
            </div>
          </div>
        )}

        {/* Step: Done */}
        {step === "done" && (
          <div className="text-center py-6 space-y-4 animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>
            <div>
              <h2 className="text-xl font-heading font-bold text-foreground">Withdrawal Requested!</h2>
              <p className="text-sm text-muted-foreground mt-1">₹{Number(amount).toLocaleString()} will be transferred in 2-3 business days</p>
            </div>
            <Button size="lg" className="w-full" onClick={() => navigate("/vendor")}>
              Back to Dashboard
            </Button>
          </div>
        )}

        {/* Withdrawal History */}
        {step !== "done" && withdrawals.length > 0 && (
          <div>
            <h2 className="text-base font-heading font-semibold text-foreground mb-3">Withdrawal History</h2>
            <div className="space-y-2">
              {withdrawals.map((w) => {
                const config = statusConfig[w.status] || statusConfig.pending;
                const StatusIcon = config.icon;
                return (
                  <div key={w.id} className="bg-card rounded-xl p-4 shadow-card flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", config.color)}>
                      <StatusIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-heading font-bold text-foreground">₹{w.amount.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">{w.bank_name} · ****{w.account_number.slice(-4)}</p>
                    </div>
                    <div className="text-right">
                      <span className={cn("text-[10px] px-2 py-1 rounded-full font-semibold", config.color)}>{config.label}</span>
                      <p className="text-[10px] text-muted-foreground mt-1">{new Date(w.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorWithdraw;
