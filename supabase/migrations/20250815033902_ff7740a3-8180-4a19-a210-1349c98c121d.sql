-- Fix the handle_new_user trigger to handle secret_key properly
-- The secret_key should be generated later during the key generation step
-- So we'll make it nullable during signup and update it later

-- First, make secret_key nullable temporarily during signup
ALTER TABLE public.profiles ALTER COLUMN secret_key DROP NOT NULL;

-- Update the trigger function to not require secret_key during signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();