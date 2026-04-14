
-- Customer reviews table (vendor rates customer)
CREATE TABLE public.customer_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(booking_id, vendor_id)
);

ALTER TABLE public.customer_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can create customer reviews"
ON public.customer_reviews FOR INSERT TO authenticated
WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "Vendors can view their own customer reviews"
ON public.customer_reviews FOR SELECT TO authenticated
USING (auth.uid() = vendor_id);

CREATE POLICY "Customers can view their own reviews"
ON public.customer_reviews FOR SELECT TO authenticated
USING (auth.uid() = customer_id);

-- Function to get average customer rating
CREATE OR REPLACE FUNCTION public.get_customer_avg_rating(_customer_id UUID)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0)
  FROM public.customer_reviews
  WHERE customer_id = _customer_id
$$;
