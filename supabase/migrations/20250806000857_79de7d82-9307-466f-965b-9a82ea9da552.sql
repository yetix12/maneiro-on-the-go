-- Agregar nuevos campos a la tabla bus_routes
ALTER TABLE public.bus_routes 
ADD COLUMN short_route text,
ADD COLUMN long_route text,
ADD COLUMN route_identification text;

-- Crear tabla para paradas de autobús 
CREATE TABLE public.bus_stop_info (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  image_url text,
  category text DEFAULT 'parada',
  latitude numeric,
  longitude numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Habilitar RLS para la tabla bus_stop_info
ALTER TABLE public.bus_stop_info ENABLE ROW LEVEL SECURITY;

-- Políticas para bus_stop_info
CREATE POLICY "Anyone can view bus stop info" 
ON public.bus_stop_info 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage bus stop info" 
ON public.bus_stop_info 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'admin'
  )
);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_bus_stop_info_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bus_stop_info_updated_at
  BEFORE UPDATE ON public.bus_stop_info
  FOR EACH ROW
  EXECUTE FUNCTION public.update_bus_stop_info_updated_at();