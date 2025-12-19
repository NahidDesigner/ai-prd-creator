-- Assign admin role to existing user with email nahidwebdesigner@gmail.com
-- This ensures the user gets admin role even if they signed up before the trigger was created

DO $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Find the user ID for nahidwebdesigner@gmail.com
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = 'nahidwebdesigner@gmail.com'
  LIMIT 1;

  -- If user exists, assign admin role
  IF target_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Admin role assigned to user: %', target_user_id;
  ELSE
    RAISE NOTICE 'User with email nahidwebdesigner@gmail.com not found';
  END IF;
END $$;

