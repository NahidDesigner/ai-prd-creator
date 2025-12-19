-- Fix: Remove global key exposure from user SELECT policy
-- Users should only see their own keys, admins see all via their separate policy

DROP POLICY IF EXISTS "Users can view their own API keys" ON public.api_keys;

CREATE POLICY "Users can view their own API keys" 
ON public.api_keys 
FOR SELECT 
USING (auth.uid() = user_id AND is_global = false);