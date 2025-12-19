-- Auto-confirm users on signup (skip email verification)
-- This function sets email_confirmed_at immediately when a user is created
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = auth, public
AS $$
BEGIN
  -- Auto-confirm the user's email by setting email_confirmed_at to current timestamp
  -- This happens in the same transaction, so the user is immediately confirmed
  NEW.email_confirmed_at = COALESCE(NEW.email_confirmed_at, now());
  NEW.phone_confirmed_at = COALESCE(NEW.phone_confirmed_at, now());
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-confirm users BEFORE insert (so it happens immediately)
DROP TRIGGER IF EXISTS on_auth_user_created_auto_confirm ON auth.users;
CREATE TRIGGER on_auth_user_created_auto_confirm
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_user();

