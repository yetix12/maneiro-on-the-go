-- Create Galería de Maneiro table for storing image gallery information
CREATE TABLE public.galeria_maneiro (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  categoria TEXT NOT NULL,
  imagen_url TEXT NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE public.galeria_maneiro ENABLE ROW LEVEL SECURITY;

-- Create policies for the gallery
CREATE POLICY "Anyone can view gallery images" 
ON public.galeria_maneiro 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage gallery images" 
ON public.galeria_maneiro 
FOR ALL 
USING (is_admin());

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_galeria_maneiro_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_galeria_maneiro_updated_at
BEFORE UPDATE ON public.galeria_maneiro
FOR EACH ROW
EXECUTE FUNCTION public.update_galeria_maneiro_updated_at();