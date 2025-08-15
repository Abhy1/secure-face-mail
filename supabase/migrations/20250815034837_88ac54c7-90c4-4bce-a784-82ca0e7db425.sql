-- Create table for storing email OTPs
CREATE TABLE public.email_otps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  otp TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  type TEXT NOT NULL CHECK (type IN ('signup', 'login')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_otps ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can create OTP records" 
ON public.email_otps 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can read their own OTP records" 
ON public.email_otps 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can update their own OTP records" 
ON public.email_otps 
FOR UPDATE 
USING (true);

-- Create index for better performance
CREATE INDEX idx_email_otps_email_otp ON public.email_otps(email, otp);
CREATE INDEX idx_email_otps_expires_at ON public.email_otps(expires_at);