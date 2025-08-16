-- Add verification requests table for sender approval system
CREATE TABLE public.verification_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  receiver_photo_data TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '10 minutes')
);

-- Enable RLS
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for verification requests
CREATE POLICY "Users can view their own verification requests" 
ON public.verification_requests 
FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create verification requests" 
ON public.verification_requests 
FOR INSERT 
WITH CHECK (auth.uid() = receiver_id);

CREATE POLICY "Senders can update verification status" 
ON public.verification_requests 
FOR UPDATE 
USING (auth.uid() = sender_id);

-- Add foreign key constraints
ALTER TABLE public.verification_requests 
ADD CONSTRAINT verification_requests_email_id_fkey 
FOREIGN KEY (email_id) REFERENCES public.secure_emails(id) ON DELETE CASCADE;