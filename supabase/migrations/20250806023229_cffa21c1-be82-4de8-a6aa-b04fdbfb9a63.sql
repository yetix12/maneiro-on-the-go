-- Create a test function to verify admin authentication is working
CREATE OR REPLACE FUNCTION public.test_admin_access()
RETURNS TABLE(
  test_name text,
  result text,
  details jsonb
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO ''
AS $$
  -- Test 1: Check if auth.uid() works
  SELECT 'auth_uid' as test_name, 
         CASE WHEN auth.uid() IS NOT NULL THEN 'PASS' ELSE 'FAIL' END as result,
         jsonb_build_object('auth_uid', auth.uid()) as details
  
  UNION ALL
  
  -- Test 2: Check if user exists in auth.users
  SELECT 'user_exists' as test_name,
         CASE WHEN EXISTS(SELECT 1 FROM auth.users WHERE id = auth.uid()) THEN 'PASS' ELSE 'FAIL' END as result,
         jsonb_build_object('user_found', EXISTS(SELECT 1 FROM auth.users WHERE id = auth.uid())) as details
  
  UNION ALL
  
  -- Test 3: Check user metadata
  SELECT 'user_metadata' as test_name,
         CASE WHEN (SELECT raw_user_meta_data ->> 'user_type' FROM auth.users WHERE id = auth.uid()) = 'admin' THEN 'PASS' ELSE 'FAIL' END as result,
         jsonb_build_object(
           'user_type', (SELECT raw_user_meta_data ->> 'user_type' FROM auth.users WHERE id = auth.uid()),
           'full_metadata', (SELECT raw_user_meta_data FROM auth.users WHERE id = auth.uid())
         ) as details
  
  UNION ALL
  
  -- Test 4: Check is_admin function
  SELECT 'is_admin_function' as test_name,
         CASE WHEN public.is_admin() THEN 'PASS' ELSE 'FAIL' END as result,
         jsonb_build_object('is_admin_result', public.is_admin()) as details
  
  UNION ALL
  
  -- Test 5: Check profile exists
  SELECT 'profile_exists' as test_name,
         CASE WHEN EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid()) THEN 'PASS' ELSE 'FAIL' END as result,
         jsonb_build_object(
           'profile_found', EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid()),
           'profile_data', (SELECT to_jsonb(profiles) FROM public.profiles WHERE id = auth.uid())
         ) as details;
$$;