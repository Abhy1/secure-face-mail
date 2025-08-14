-- Add missing columns to existing profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS secret_key TEXT,
ADD COLUMN IF NOT EXISTS biometric_data TEXT;

-- Create secure emails table
CREATE TABLE IF NOT EXISTS public.secure_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  encrypted_content TEXT NOT NULL,
  encrypted_attachment TEXT,
  attachment_name TEXT,
  sender_secret_key TEXT NOT NULL,
  is_destroyed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create security logs table for tracking access attempts
CREATE TABLE IF NOT EXISTS public.security_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email_id UUID NOT NULL REFERENCES public.secure_emails(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  attempt_type TEXT NOT NULL, -- 'key_verification', 'biometric_verification'
  success BOOLEAN NOT NULL,
  attempt_count INTEGER DEFAULT 1,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.secure_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for secure_emails
CREATE POLICY "Users can view their sent emails" 
ON public.secure_emails 
FOR SELECT 
USING (auth.uid() = sender_id);

CREATE POLICY "Users can create their own emails" 
ON public.secure_emails 
FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own emails" 
ON public.secure_emails 
FOR UPDATE 
USING (auth.uid() = sender_id);

-- RLS Policies for security_logs
CREATE POLICY "Users can view logs for their emails" 
ON public.security_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.secure_emails 
    WHERE secure_emails.id = security_logs.email_id 
    AND secure_emails.sender_id = auth.uid()
  )
);

CREATE POLICY "Anyone can create security logs" 
ON public.security_logs 
FOR INSERT 
WITH CHECK (true);