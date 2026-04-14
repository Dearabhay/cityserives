CREATE TABLE public.favorite_vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  vendor_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(customer_id, vendor_id)
);

ALTER TABLE public.favorite_vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their favorites"
ON public.favorite_vendors FOR SELECT TO authenticated
USING (auth.uid() = customer_id);

CREATE POLICY "Customers can add favorites"
ON public.favorite_vendors FOR INSERT TO authenticated
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can remove favorites"
ON public.favorite_vendors FOR DELETE TO authenticated
USING (auth.uid() = customer_id);