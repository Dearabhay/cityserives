
-- Chat messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Users involved in the booking can insert messages
CREATE POLICY "Booking participants can send messages"
ON public.chat_messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.bookings
    WHERE bookings.id = chat_messages.booking_id
    AND (bookings.customer_id = auth.uid() OR bookings.vendor_id = auth.uid())
  )
);

-- Users involved in the booking can read messages
CREATE POLICY "Booking participants can read messages"
ON public.chat_messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.bookings
    WHERE bookings.id = chat_messages.booking_id
    AND (bookings.customer_id = auth.uid() OR bookings.vendor_id = auth.uid())
  )
);

-- Users can mark messages as read
CREATE POLICY "Booking participants can update messages"
ON public.chat_messages FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.bookings
    WHERE bookings.id = chat_messages.booking_id
    AND (bookings.customer_id = auth.uid() OR bookings.vendor_id = auth.uid())
  )
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
