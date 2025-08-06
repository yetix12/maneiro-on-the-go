-- First drop all policies that depend on get_current_user_type function
DROP POLICY IF EXISTS "Only admins can modify routes" ON public.bus_routes;
DROP POLICY IF EXISTS "Only admins can modify stops" ON public.bus_stops;
DROP POLICY IF EXISTS "Only admins can manage points of interest" ON public.points_of_interest;
DROP POLICY IF EXISTS "Only admins can manage vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Only admins can modify paradas" ON public.paradas;

-- Drop and recreate profiles policies to avoid recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authentication users only" ON public.profiles;

-- Now drop the problematic function
DROP FUNCTION IF EXISTS public.get_current_user_type() CASCADE;

-- Create new profiles policies that don't cause recursion
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Use auth.users metadata for admin check to avoid recursion
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data ->> 'user_type' = 'admin'
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

-- Create a new secure function for admin checks
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data ->> 'user_type' = 'admin'
  );
$$;

-- Recreate policies for other tables using the new function
CREATE POLICY "Only admins can modify routes" 
ON public.bus_routes 
FOR ALL 
USING (public.is_admin());

CREATE POLICY "Only admins can modify stops" 
ON public.bus_stops 
FOR ALL 
USING (public.is_admin());

CREATE POLICY "Only admins can manage points of interest" 
ON public.points_of_interest 
FOR ALL 
USING (public.is_admin());

CREATE POLICY "Only admins can manage vehicles" 
ON public.vehicles 
FOR ALL 
USING (public.is_admin());

CREATE POLICY "Only admins can modify paradas" 
ON public.paradas 
FOR ALL 
USING (public.is_admin());