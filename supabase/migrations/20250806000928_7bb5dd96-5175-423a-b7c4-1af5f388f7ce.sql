-- Arreglar funciones con search_path no establecido
CREATE OR REPLACE FUNCTION public.update_bus_stop_info_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;