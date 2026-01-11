-- Update the handle_new_user function to include phone, parroquia_id, and direccion
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, username, full_name, user_type, phone, parroquia_id, direccion)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'user_type', 'passenger'),
        NEW.raw_user_meta_data->>'phone',
        (NEW.raw_user_meta_data->>'parroquia_id')::uuid,
        NEW.raw_user_meta_data->>'direccion'
    );
    RETURN NEW;
END;
$$;