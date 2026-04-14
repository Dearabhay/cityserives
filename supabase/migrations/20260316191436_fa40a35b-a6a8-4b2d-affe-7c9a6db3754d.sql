CREATE TABLE public.sos_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  emergency_type text NOT NULL,
  location_address text,
  latitude double precision,
  longitude double precision,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE public.sos_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create SOS alerts" ON public.sos_alerts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own SOS alerts" ON public.sos_alerts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Vendors can view all SOS alerts" ON public.sos_alerts
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'vendor'));

CREATE POLICY "Vendors can update SOS alerts" ON public.sos_alerts
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'vendor'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.sos_alerts;