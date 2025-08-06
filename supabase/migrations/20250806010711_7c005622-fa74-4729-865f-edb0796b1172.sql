-- Create paradas table for storing detailed stop information
CREATE TABLE public.paradas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  route_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  stop_order INTEGER NOT NULL,
  address TEXT,
  facilities TEXT[], -- Array for facilities like 'shelter', 'bench', 'lighting'
  accessibility BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.paradas ENABLE ROW LEVEL SECURITY;

-- Create policies for paradas
CREATE POLICY "Anyone can view paradas" 
ON public.paradas 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can modify paradas" 
ON public.paradas 
FOR ALL
USING (get_current_user_type() = 'admin'::text);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_paradas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_paradas_updated_at
BEFORE UPDATE ON public.paradas
FOR EACH ROW
EXECUTE FUNCTION public.update_paradas_updated_at();

-- Add index for better performance
CREATE INDEX idx_paradas_route_id ON public.paradas(route_id);
CREATE INDEX idx_paradas_stop_order ON public.paradas(route_id, stop_order);