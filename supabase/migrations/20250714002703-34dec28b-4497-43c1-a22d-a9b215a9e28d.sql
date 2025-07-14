-- Fix the infinite recursion in RLS policies by creating a security definer function
-- and updating the problematic policy

-- 1. Create a security definer function to get current user type
CREATE OR REPLACE FUNCTION public.get_current_user_type()
RETURNS TEXT AS $$
  SELECT user_type FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- 2. Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- 3. Create a new policy using the security definer function
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.get_current_user_type() = 'admin');

-- 4. Ensure the test users have the correct user_type
-- Update admin@test.com to have admin privileges
UPDATE public.profiles 
SET user_type = 'admin' 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'admin@test.com'
);

-- Update driver@test.com to have driver privileges  
UPDATE public.profiles 
SET user_type = 'driver'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'driver@test.com'
);

-- 5. Also fix any other policies that might have similar issues
-- Check if there are any other policies referencing profiles table within themselves
-- and update the bus_routes policies to use the same function

DROP POLICY IF EXISTS "Only admins can modify routes" ON public.bus_routes;
CREATE POLICY "Only admins can modify routes" 
ON public.bus_routes 
FOR ALL 
USING (public.get_current_user_type() = 'admin');

DROP POLICY IF EXISTS "Only admins can modify stops" ON public.bus_stops;
CREATE POLICY "Only admins can modify stops" 
ON public.bus_stops 
FOR ALL 
USING (public.get_current_user_type() = 'admin');

DROP POLICY IF EXISTS "Only admins can manage points of interest" ON public.points_of_interest;
CREATE POLICY "Only admins can manage points of interest" 
ON public.points_of_interest 
FOR ALL 
USING (public.get_current_user_type() = 'admin');

DROP POLICY IF EXISTS "Only admins can manage vehicles" ON public.vehicles;
CREATE POLICY "Only admins can manage vehicles" 
ON public.vehicles 
FOR ALL 
USING (public.get_current_user_type() = 'admin');