-- Crear usuario de prueba para pasajero
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'pasajero@test.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Usuario Pasajero", "username": "pasajero"}',
  false,
  '',
  '',
  '',
  ''
);

-- Crear perfil para el usuario pasajero
INSERT INTO public.profiles (id, username, full_name, user_type)
SELECT 
  id,
  'pasajero',
  'Usuario Pasajero',
  'passenger'
FROM auth.users 
WHERE email = 'pasajero@test.com';