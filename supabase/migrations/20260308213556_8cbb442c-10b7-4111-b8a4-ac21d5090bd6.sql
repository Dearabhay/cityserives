
-- Create reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT CHECK (char_length(review_text) <= 2000),
  photos TEXT[] DEFAULT '{}',
  tip_amount INTEGER DEFAULT 0 CHECK (tip_amount >= 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can create their own reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Users can update their own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = customer_id);

-- Create review-photos storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('review-photos', 'review-photos', true);

CREATE POLICY "Users can upload review photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'review-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Review photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'review-photos');
