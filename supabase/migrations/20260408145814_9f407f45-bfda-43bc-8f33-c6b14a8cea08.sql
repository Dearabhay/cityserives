
-- Enable realtime for sos_alerts (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'sos_alerts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.sos_alerts;
  END IF;
END $$;

-- Allow vendors to read sos_alerts (for admin dashboard)
CREATE POLICY "Vendors can view sos_alerts"
ON public.sos_alerts
FOR SELECT
TO authenticated
USING (true);

-- Allow vendors to update sos_alerts status (resolve alerts)
CREATE POLICY "Vendors can update sos_alerts"
ON public.sos_alerts
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
