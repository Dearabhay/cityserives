import { useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Star, Camera, X, Loader2, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const tipOptions = [0, 50, 100, 200, 500];

const ReviewRating = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [tipAmount, setTipAmount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 5) {
      toast.error("Maximum 5 photos allowed");
      return;
    }
    const newPhotos = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPhotos([...photos, ...newPhotos]);
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(photos[index].preview);
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const uploadPhotos = async (): Promise<string[]> => {
    if (!user || photos.length === 0) return [];
    setUploading(true);
    const urls: string[] = [];
    for (const photo of photos) {
      const ext = photo.file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("review-photos").upload(path, photo.file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("review-photos").getPublicUrl(path);
      urls.push(publicUrl);
    }
    setUploading(false);
    return urls;
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    if (reviewText.length > 2000) {
      toast.error("Review must be under 2000 characters");
      return;
    }

    setSubmitting(true);
    try {
      const uploadedUrls = await uploadPhotos();

      // Demo vendor ID — in production, pass via route params or booking data
      const { error } = await supabase.from("reviews").insert({
        customer_id: user.id,
        vendor_id: user.id, // placeholder
        rating,
        review_text: reviewText.trim() || null,
        photos: uploadedUrls,
        tip_amount: tipAmount,
      });
      if (error) throw error;

      toast.success("Review submitted! Thank you 🎉");
      navigate(-1);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const ratingLabels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];
  const activeRating = hoverRating || rating;

  return (
    <div className="min-h-screen bg-background pb-8 max-w-lg mx-auto">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="font-heading font-semibold text-foreground">Rate & Review</h1>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Vendor Info */}
        <div className="flex items-center gap-3 bg-card rounded-xl p-4 shadow-card">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-lg font-heading font-bold text-primary">
            RK
          </div>
          <div>
            <p className="text-sm font-heading font-semibold text-foreground">Raj Kumar</p>
            <p className="text-xs text-muted-foreground">Plumbing · Pipe Leak Repair</p>
          </div>
        </div>

        {/* Star Rating */}
        <section className="text-center">
          <h2 className="text-base font-heading font-semibold text-foreground mb-4">How was the service?</h2>
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
          <label className="text-sm font-heading font-semibold text-foreground mb-2 block">Write a review</label>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Tell others about your experience..."
            maxLength={2000}
            rows={4}
            className="w-full rounded-xl bg-muted border-none p-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
          <p className="text-xs text-muted-foreground text-right mt-1">{reviewText.length}/2000</p>
        </section>

        {/* Photo Upload */}
        <section>
          <label className="text-sm font-heading font-semibold text-foreground mb-2 block">Add photos</label>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {photos.map((photo, i) => (
              <div key={i} className="relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden">
                <img src={photo.preview} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-foreground/70 flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-background" />
                </button>
              </div>
            ))}
            {photos.length < 5 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-shrink-0 w-20 h-20 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 hover:border-primary/50 transition-colors"
              >
                <Camera className="w-5 h-5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">{photos.length}/5</span>
              </button>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoSelect} />
        </section>

        {/* Tip */}
        <section>
          <label className="text-sm font-heading font-semibold text-foreground mb-2 block">Tip the vendor</label>
          <p className="text-xs text-muted-foreground mb-3">Show your appreciation with a tip (optional)</p>
          <div className="flex gap-2 flex-wrap">
            {tipOptions.map((amount) => (
              <button
                key={amount}
                onClick={() => setTipAmount(amount)}
                className={cn(
                  "flex items-center gap-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all",
                  tipAmount === amount
                    ? "bg-secondary text-secondary-foreground shadow-sm"
                    : "bg-card border border-border text-foreground hover:border-secondary/50"
                )}
              >
                {amount === 0 ? (
                  "No tip"
                ) : (
                  <>
                    <IndianRupee className="w-3.5 h-3.5" />
                    {amount}
                  </>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Submit */}
        <Button onClick={handleSubmit} size="xl" className="w-full" disabled={submitting || rating === 0}>
          {submitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>Submit Review{tipAmount > 0 ? ` + ₹${tipAmount} Tip` : ""}</>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ReviewRating;
