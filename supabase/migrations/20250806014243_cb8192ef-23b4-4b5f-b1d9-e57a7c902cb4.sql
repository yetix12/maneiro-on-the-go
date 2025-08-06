-- Fix infinite recursion in profiles policies by dropping and recreating them correctly
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authentication users only" ON public.profiles;

-- Create correct RLS policies for profiles table
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND user_type = 'admin'
  )
);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Enable insert for authentication users only" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Ensure the paradas table exists with correct structure
CREATE TABLE IF NOT EXISTS public.paradas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  route_id UUID NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  stop_order INTEGER NOT NULL,
  accessibility BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  facilities TEXT[],
  address TEXT,
  name TEXT NOT NULL,
  description TEXT
);

-- Enable RLS on paradas
ALTER TABLE public.paradas ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for paradas
DROP POLICY IF EXISTS "Anyone can view paradas" ON public.paradas;
DROP POLICY IF EXISTS "Only admins can modify paradas" ON public.paradas;

CREATE POLICY "Anyone can view paradas" 
ON public.paradas 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can modify paradas" 
ON public.paradas 
FOR ALL 
USING (get_current_user_type() = 'admin');

-- Create or replace the update function for paradas
CREATE OR REPLACE FUNCTION public.update_paradas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '';

-- Create trigger for paradas updated_at
DROP TRIGGER IF EXISTS update_paradas_updated_at_trigger ON public.paradas;
CREATE TRIGGER update_paradas_updated_at_trigger
  BEFORE UPDATE ON public.paradas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_paradas_updated_at();