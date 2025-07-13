-- Crear un usuario administrador de prueba
-- Primero insertamos el usuario en auth.users (esto lo manejará Supabase Auth)

-- Insertar directamente en la tabla profiles un usuario admin
-- Usaremos un UUID fijo para el usuario admin
INSERT INTO public.profiles (id, username, full_name, user_type)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin',
  'Administrador del Sistema',
  'admin'
) ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  user_type = EXCLUDED.user_type;