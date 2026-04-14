
-- Vendor live locations table
CREATE TABLE public.vendor_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(vendor_id, booking_id)
);

ALTER TABLE public.vendor_locations ENABLE ROW LEVEL SECURITY;

-- Vendors can upsert their own location
CREATE POLICY "Vendors can insert their location"
ON public.vendor_locations FOR INSERT TO authenticated
WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "Vendors can update their location"
ON public.vendor_locations FOR UPDATE TO authenticated
USING (auth.uid() = vendor_id);

-- Customers can view vendor location for their bookings
CREATE POLICY "Customers can view vendor location for their bookings"
ON public.vendor_locations FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.bookings
    WHERE bookings.id = vendor_locations.booking_id
    AND bookings.customer_id = auth.uid()
  )
);

-- Vendors can view their own locations
CREATE POLICY "Vendors can view their own location"
ON public.vendor_locations FOR SELECT TO authenticated
USING (auth.uid() = vendor_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.vendor_locations;
