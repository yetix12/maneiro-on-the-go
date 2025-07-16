-- Crear el usuario pakito@email.com con permisos de pasajero
-- Primero verificamos si ya existe y lo actualizamos

-- Buscar el usuario pakito@email.com y asegurar que tenga permisos de pasajero
UPDATE public.profiles 
SET user_type = 'passenger', 
    username = 'pakito',
    full_name = 'Pakito Usuario'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'pakito@email.com'
);

-- También verificar otros formatos de email que podrían estar causando problemas
-- En caso de que no exista, necesitaremos que el usuario lo registre primero