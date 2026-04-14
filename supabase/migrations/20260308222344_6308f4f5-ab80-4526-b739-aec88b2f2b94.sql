
-- Vendor services table
CREATE TABLE public.vendor_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price INTEGER NOT NULL,
  duration TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can view their own services" ON public.vendor_services
  FOR SELECT USING (auth.uid() = vendor_id);

CREATE POLICY "Vendors can insert their own services" ON public.vendor_services
  FOR INSERT WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "Vendors can update their own services" ON public.vendor_services
  FOR UPDATE USING (auth.uid() = vendor_id);

CREATE POLICY "Vendors can delete their own services" ON public.vendor_services
  FOR DELETE USING (auth.uid() = vendor_id);

-- Public read for customers to see vendor services
CREATE POLICY "Customers can view active vendor services" ON public.vendor_services
  FOR SELECT USING (active = true);

-- Withdrawals table
CREATE TABLE public.withdrawals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  ifsc_code TEXT NOT NULL,
  account_holder TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can view their own withdrawals" ON public.withdrawals
  FOR SELECT USING (auth.uid() = vendor_id);

CREATE POLICY "Vendors can create withdrawals" ON public.withdrawals
  FOR INSERT WITH CHECK (auth.uid() = vendor_id);

-- Triggers for updated_at
CREATE TRIGGER update_vendor_services_updated_at
  BEFORE UPDATE ON public.vendor_services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
