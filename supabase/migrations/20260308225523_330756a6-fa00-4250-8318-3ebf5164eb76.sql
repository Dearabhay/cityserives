
-- Add message_type and metadata columns to chat_messages
ALTER TABLE public.chat_messages 
ADD COLUMN message_type TEXT NOT NULL DEFAULT 'text',
ADD COLUMN metadata JSONB DEFAULT NULL;

-- Create chat-attachments storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-attachments', 'chat-attachments', true);

-- Storage policies for chat attachments
CREATE POLICY "Authenticated users can upload chat attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-attachments');

CREATE POLICY "Anyone can view chat attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-attachments');
