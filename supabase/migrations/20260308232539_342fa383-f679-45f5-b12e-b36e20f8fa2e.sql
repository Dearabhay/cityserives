
-- 1. Make vendor_id nullable so bookings can be broadcast
ALTER TABLE public.bookings ALTER COLUMN vendor_id DROP NOT NULL;

-- 2. Drop existing vendor SELECT policy
DROP POLICY IF EXISTS "Vendors can view their bookings" ON public.bookings;

-- 3. New policy: vendors can see their assigned bookings OR unassigned pending bookings
CREATE POLICY "Vendors can view their bookings or available ones"
  ON public.bookings FOR SELECT TO authenticated
  USING (
    auth.uid() = vendor_id
    OR (vendor_id IS NULL AND status = 'pending')
  );

-- 4. Allow vendors to update bookings (for accepting)
CREATE POLICY "Vendors can accept available bookings"
  ON public.bookings FOR UPDATE TO authenticated
  USING (
    vendor_id IS NULL AND status = 'pending'
  )
  WITH CHECK (
    vendor_id = auth.uid() AND status = 'confirmed'
  );

-- 5. Atomic accept_booking function to prevent race conditions
CREATE OR REPLACE FUNCTION public.accept_booking(_booking_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _updated boolean;
BEGIN
  UPDATE public.bookings
  SET vendor_id = auth.uid(), status = 'confirmed', updated_at = now()
  WHERE id = _booking_id
    AND vendor_id IS NULL
    AND status = 'pending';

  GET DIAGNOSTICS _updated = ROW_COUNT;
  RETURN _updated > 0;
END;
$$;
