
-- Create bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  sub_service TEXT,
  scheduled_date DATE NOT NULL,
  scheduled_time TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT,
  special_instructions TEXT CHECK (char_length(special_instructions) <= 500),
  promo_code TEXT,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  price INTEGER NOT NULL CHECK (price >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','active','completed','cancelled')),
  emergency_flag BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own bookings" ON public.bookings FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Vendors can view their bookings" ON public.bookings FOR SELECT USING (auth.uid() = vendor_id);
CREATE POLICY "Customers can create bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Customers can update their bookings" ON public.bookings FOR UPDATE USING (auth.uid() = customer_id);

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
