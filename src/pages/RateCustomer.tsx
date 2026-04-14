import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const RateCustomer = () => {
  const navigate = useNavigate();
  const { bookingId } = useParams();
  const { user } = useAuth();

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const activeRating = hoverRating || rating;
  const ratingLabels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

  const handleSubmit = async () => {
    if (!user || !bookingId) return;
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setSubmitting(true);
    try {
      // Get the booking to find customer_id
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .select("customer_id")
        .eq("id", bookingId)
        .single();

      if (bookingError || !booking) throw new Error("Booking not found");

      const { error } = await supabase.from("customer_reviews" as any).insert({
        vendor_id: user.id,
        customer_id: booking.customer_id,
        booking_id: bookingId,
        rating,
        review_text: reviewText.trim() || null,
      } as any);

      if (error) throw error;

      toast.success("Customer rated successfully! 🎉");
      navigate(-1);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-8 max-w-lg mx-auto">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="font-heading font-semibold text-foreground">Rate Customer</h1>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Star Rating */}
        <section className="text-center">
          <h2 className="text-base font-heading font-semibold text-foreground mb-4">How was the customer?</h2>
          <div className="flex items-center justify-center gap-2 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform hover:scale-110 active:scale-95"
              >
                <Star
                  className={cn(
                    "w-10 h-10 transition-colors",
                    star <= activeRating ? "fill-secondary text-secondary" : "text-border"
                  )}
                />
              </button>
            ))}
          </div>
          {activeRating > 0 && (
            <p className="text-sm font-medium text-secondary animate-fade-in">{ratingLabels[activeRating]}</p>
          )}
        </section>

        {/* Review Text */}
        <section>
          <label className="text-sm font-heading font-semibold text-foreground mb-2 block">Write a note (optional)</label>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="How was your experience with this customer..."
            maxLength={500}
            rows={3}
            className="w-full rounded-xl bg-muted border-none p-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
          <p className="text-xs text-muted-foreground text-right mt-1">{reviewText.length}/500</p>
        </section>

        {/* Submit */}
        <Button onClick={handleSubmit} size="xl" className="w-full" disabled={submitting || rating === 0}>
          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Rating"}
        </Button>
      </div>
    </div>
  );
};

export default RateCustomer;
