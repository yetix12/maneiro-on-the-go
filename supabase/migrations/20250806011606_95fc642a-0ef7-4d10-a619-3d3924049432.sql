-- Fix the admin policy to ensure admins can see all profiles
-- First drop the existing policy and recreate it
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create a more robust admin policy
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles admin_profile 
    WHERE admin_profile.id = auth.uid() 
    AND admin_profile.user_type = 'admin'
  )
);