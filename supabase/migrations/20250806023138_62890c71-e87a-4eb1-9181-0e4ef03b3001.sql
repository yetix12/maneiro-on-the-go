-- Fix bus_stop_info policy to use consistent admin check
DROP POLICY IF EXISTS "Only admins can manage bus stop info" ON public.bus_stop_info;

CREATE POLICY "Only admins can manage bus stop info" 
ON public.bus_stop_info 
FOR ALL 
USING (public.is_admin());

-- Verify the is_admin function is working correctly by testing it
-- Let's also create a debug function to help troubleshoot
CREATE OR REPLACE FUNCTION public.debug_admin_check()
RETURNS TABLE(
  current_user_id uuid,
  user_exists boolean,
  user_meta_data jsonb,
  user_type text,
  is_admin_result boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT 
    auth.uid() as current_user_id,
    EXISTS(SELECT 1 FROM auth.users WHERE id = auth.uid()) as user_exists,
    (SELECT raw_user_meta_data FROM auth.users WHERE id = auth.uid()) as user_meta_data,
    (SELECT raw_user_meta_data ->> 'user_type' FROM auth.users WHERE id = auth.uid()) as user_type,
    public.is_admin() as is_admin_result;
$$;