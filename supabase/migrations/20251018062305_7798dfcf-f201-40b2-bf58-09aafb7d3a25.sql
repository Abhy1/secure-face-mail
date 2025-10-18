-- Fix critical RLS vulnerabilities

-- 1. Fix email_otps table - restrict reading to email owner only
DROP POLICY IF EXISTS "Anyone can read their own OTP records" ON email_otps;
CREATE POLICY "Users can only read OTPs for their email"
  ON email_otps
  FOR SELECT
  USING (email = current_setting('request.jwt.claims', true)::json->>'email');

DROP POLICY IF EXISTS "Anyone can update their own OTP records" ON email_otps;
CREATE POLICY "Users can only update OTPs for their email"
  ON email_otps
  FOR UPDATE
  USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- 2. Fix secure_emails table - allow recipients to read emails sent to them
CREATE POLICY "Users can view emails sent to them"
  ON secure_emails
  FOR SELECT
  USING (
    recipient_email = (
      SELECT email 
      FROM profiles 
      WHERE user_id = auth.uid()
    )
  );

-- 3. Add missing DELETE policies with proper restrictions
CREATE POLICY "Users can delete their own sent emails"
  ON secure_emails
  FOR DELETE
  USING (auth.uid() = sender_id);

-- 4. Restrict verification_requests modifications
DROP POLICY IF EXISTS "Users can create verification requests" ON verification_requests;
CREATE POLICY "Receivers can create verification requests"
  ON verification_requests
  FOR INSERT
  WITH CHECK (auth.uid() = receiver_id);

-- 5. Add security to security_logs
CREATE POLICY "Users can view security logs for emails they received"
  ON security_logs
  FOR SELECT
  USING (
    recipient_email = (
      SELECT email 
      FROM profiles 
      WHERE user_id = auth.uid()
    )
  );