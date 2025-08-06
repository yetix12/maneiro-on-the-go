-- Arreglar la función get_current_user_type también
CREATE OR REPLACE FUNCTION public.get_current_user_type()
RETURNS text
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT user_type FROM public.profiles WHERE id = auth.uid();
$$;