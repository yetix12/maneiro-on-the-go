
-- =============================================
-- PARTE 1: ENUM Y TABLAS BASE
-- =============================================

-- 1.1 Crear enum para roles de aplicación
CREATE TYPE public.app_role AS ENUM ('admin_general', 'admin_parroquia', 'driver', 'passenger');

-- 1.2 Tabla de Parroquias
CREATE TABLE public.parroquias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    municipio TEXT,
    estado TEXT DEFAULT 'Nueva Esparta',
    descripcion TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 1.3 Tabla de Perfiles de Usuario
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT,
    full_name TEXT,
    user_type TEXT DEFAULT 'passenger',
    phone TEXT,
    parroquia_id UUID REFERENCES public.parroquias(id) ON DELETE SET NULL,
    direccion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 1.4 Tabla de Roles de Usuario (separada para seguridad)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    parroquia_id UUID REFERENCES public.parroquias(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- =============================================
-- PARTE 2: FUNCIONES DE SEGURIDAD
-- =============================================

-- 2.1 Función para verificar si un usuario tiene un rol específico
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- 2.2 Función para verificar si el usuario actual es admin general
CREATE OR REPLACE FUNCTION public.is_admin_general()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = auth.uid()
          AND role = 'admin_general'
    )
$$;

-- 2.3 Función para verificar si el usuario es admin de una parroquia específica
CREATE OR REPLACE FUNCTION public.is_admin_parroquia(_parroquia_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = auth.uid()
          AND role = 'admin_parroquia'
          AND parroquia_id = _parroquia_id
    )
$$;

-- 2.4 Función para verificar si el usuario es admin de alguna parroquia
CREATE OR REPLACE FUNCTION public.is_any_admin_parroquia()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = auth.uid()
          AND role = 'admin_parroquia'
    )
$$;

-- 2.5 Función para obtener la parroquia del admin
CREATE OR REPLACE FUNCTION public.get_admin_parroquia_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT parroquia_id
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin_parroquia'
    LIMIT 1
$$;

-- =============================================
-- PARTE 3: TABLAS DEL SISTEMA DE TRANSPORTE
-- =============================================

-- 3.1 Tabla de Rutas de Autobús
CREATE TABLE public.bus_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    color TEXT DEFAULT '#3B82F6',
    description TEXT,
    route_identification TEXT,
    short_route TEXT,
    long_route TEXT,
    parroquia_id UUID REFERENCES public.parroquias(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3.2 Tabla de Paradas de Autobús
CREATE TABLE public.bus_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    latitude FLOAT8 NOT NULL,
    longitude FLOAT8 NOT NULL,
    stop_order INT4,
    route_id UUID REFERENCES public.bus_routes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3.3 Tabla de Información de Paradas
CREATE TABLE public.bus_stop_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    latitude FLOAT8,
    longitude FLOAT8,
    image_url TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3.4 Tabla de Vehículos
CREATE TABLE public.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_plate TEXT NOT NULL,
    model TEXT,
    capacity INT4 DEFAULT 30,
    status TEXT DEFAULT 'active',
    driver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    route_id UUID REFERENCES public.bus_routes(id) ON DELETE SET NULL,
    current_latitude FLOAT8,
    current_longitude FLOAT8,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3.5 Tabla de Paradas Detalladas
CREATE TABLE public.paradas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    address TEXT,
    latitude FLOAT8,
    longitude FLOAT8,
    stop_order INT4,
    route_id UUID,
    accessibility BOOLEAN DEFAULT false,
    facilities TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- PARTE 4: TABLAS DE CONTENIDO
-- =============================================

-- 4.1 Tabla de Galería de Imágenes
CREATE TABLE public.galeria_maneiro (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    descripcion TEXT,
    imagen_url TEXT,
    categoria TEXT,
    parroquia_id UUID REFERENCES public.parroquias(id) ON DELETE SET NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4.2 Tabla de Puntos de Interés
CREATE TABLE public.points_of_interest (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    latitude FLOAT8,
    longitude FLOAT8,
    parroquia_id UUID REFERENCES public.parroquias(id) ON DELETE SET NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- PARTE 5: HABILITAR RLS EN TODAS LAS TABLAS
-- =============================================

ALTER TABLE public.parroquias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bus_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bus_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bus_stop_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paradas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.galeria_maneiro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_of_interest ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PARTE 6: POLÍTICAS RLS
-- =============================================

-- 6.1 Políticas para parroquias
CREATE POLICY "Parroquias are viewable by everyone"
ON public.parroquias FOR SELECT
USING (true);

CREATE POLICY "Only admin_general can insert parroquias"
ON public.parroquias FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_general());

CREATE POLICY "Only admin_general can update parroquias"
ON public.parroquias FOR UPDATE
TO authenticated
USING (public.is_admin_general());

CREATE POLICY "Only admin_general can delete parroquias"
ON public.parroquias FOR DELETE
TO authenticated
USING (public.is_admin_general());

-- 6.2 Políticas para profiles
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admin general can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_admin_general());

CREATE POLICY "Admin parroquia can view profiles in their parroquia"
ON public.profiles FOR SELECT
TO authenticated
USING (
    public.is_any_admin_parroquia() 
    AND parroquia_id = public.get_admin_parroquia_id()
);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admin general can update all profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.is_admin_general());

CREATE POLICY "Profiles can be inserted by the user themselves"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 6.3 Políticas para user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admin general can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.is_admin_general());

CREATE POLICY "Only admin_general can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_general());

CREATE POLICY "Only admin_general can update roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (public.is_admin_general());

CREATE POLICY "Only admin_general can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.is_admin_general());

-- 6.4 Políticas para bus_routes
CREATE POLICY "Bus routes are viewable by everyone"
ON public.bus_routes FOR SELECT
USING (true);

CREATE POLICY "Admin general can manage all routes"
ON public.bus_routes FOR ALL
TO authenticated
USING (public.is_admin_general());

CREATE POLICY "Admin parroquia can manage routes in their parroquia"
ON public.bus_routes FOR ALL
TO authenticated
USING (
    public.is_any_admin_parroquia() 
    AND parroquia_id = public.get_admin_parroquia_id()
);

-- 6.5 Políticas para bus_stops
CREATE POLICY "Bus stops are viewable by everyone"
ON public.bus_stops FOR SELECT
USING (true);

CREATE POLICY "Admins can manage bus stops"
ON public.bus_stops FOR ALL
TO authenticated
USING (public.is_admin_general() OR public.is_any_admin_parroquia());

-- 6.6 Políticas para bus_stop_info
CREATE POLICY "Bus stop info is viewable by everyone"
ON public.bus_stop_info FOR SELECT
USING (true);

CREATE POLICY "Admins can manage bus stop info"
ON public.bus_stop_info FOR ALL
TO authenticated
USING (public.is_admin_general() OR public.is_any_admin_parroquia());

-- 6.7 Políticas para vehicles
CREATE POLICY "Vehicles are viewable by everyone"
ON public.vehicles FOR SELECT
USING (true);

CREATE POLICY "Admins can manage vehicles"
ON public.vehicles FOR ALL
TO authenticated
USING (public.is_admin_general() OR public.is_any_admin_parroquia());

CREATE POLICY "Drivers can update their vehicle location"
ON public.vehicles FOR UPDATE
TO authenticated
USING (driver_id = auth.uid());

-- 6.8 Políticas para paradas
CREATE POLICY "Paradas are viewable by everyone"
ON public.paradas FOR SELECT
USING (true);

CREATE POLICY "Admins can manage paradas"
ON public.paradas FOR ALL
TO authenticated
USING (public.is_admin_general() OR public.is_any_admin_parroquia());

-- 6.9 Políticas para galeria_maneiro
CREATE POLICY "Galeria is viewable by everyone"
ON public.galeria_maneiro FOR SELECT
USING (true);

CREATE POLICY "Admin general can manage all galeria"
ON public.galeria_maneiro FOR ALL
TO authenticated
USING (public.is_admin_general());

CREATE POLICY "Admin parroquia can manage galeria in their parroquia"
ON public.galeria_maneiro FOR ALL
TO authenticated
USING (
    public.is_any_admin_parroquia() 
    AND parroquia_id = public.get_admin_parroquia_id()
);

-- 6.10 Políticas para points_of_interest
CREATE POLICY "Points of interest are viewable by everyone"
ON public.points_of_interest FOR SELECT
USING (true);

CREATE POLICY "Admin general can manage all points of interest"
ON public.points_of_interest FOR ALL
TO authenticated
USING (public.is_admin_general());

CREATE POLICY "Admin parroquia can manage points in their parroquia"
ON public.points_of_interest FOR ALL
TO authenticated
USING (
    public.is_any_admin_parroquia() 
    AND parroquia_id = public.get_admin_parroquia_id()
);

-- =============================================
-- PARTE 7: TRIGGERS
-- =============================================

-- 7.1 Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 7.2 Aplicar trigger a tablas con updated_at
CREATE TRIGGER update_parroquias_updated_at
    BEFORE UPDATE ON public.parroquias
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bus_routes_updated_at
    BEFORE UPDATE ON public.bus_routes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bus_stop_info_updated_at
    BEFORE UPDATE ON public.bus_stop_info
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_paradas_updated_at
    BEFORE UPDATE ON public.paradas
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_galeria_maneiro_updated_at
    BEFORE UPDATE ON public.galeria_maneiro
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7.3 Función para crear perfil automáticamente cuando se registra un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, full_name, user_type)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'user_type', 'passenger')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7.4 Trigger para crear perfil en registro
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- PARTE 8: FUNCIÓN PARA ESTADÍSTICAS
-- =============================================

-- 8.1 Función para obtener estadísticas de una parroquia
CREATE OR REPLACE FUNCTION public.get_parroquia_statistics(_parroquia_id uuid)
RETURNS TABLE (
    total_usuarios BIGINT,
    total_pasajeros BIGINT,
    total_conductores BIGINT,
    total_rutas BIGINT,
    total_paradas BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        (SELECT COUNT(*) FROM public.profiles WHERE parroquia_id = _parroquia_id) as total_usuarios,
        (SELECT COUNT(*) FROM public.profiles WHERE parroquia_id = _parroquia_id AND user_type = 'passenger') as total_pasajeros,
        (SELECT COUNT(*) FROM public.profiles WHERE parroquia_id = _parroquia_id AND user_type = 'driver') as total_conductores,
        (SELECT COUNT(*) FROM public.bus_routes WHERE parroquia_id = _parroquia_id AND is_active = true) as total_rutas,
        (SELECT COUNT(*) FROM public.bus_stops bs 
         JOIN public.bus_routes br ON bs.route_id = br.id 
         WHERE br.parroquia_id = _parroquia_id) as total_paradas
$$;

-- =============================================
-- PARTE 9: INSERTAR PARROQUIAS DE MANEIRO
-- =============================================

INSERT INTO public.parroquias (nombre, municipio, estado, descripcion) VALUES
('Aguirre', 'Maneiro', 'Nueva Esparta', 'Parroquia Aguirre del Municipio Maneiro'),
('Maneiro', 'Maneiro', 'Nueva Esparta', 'Parroquia capital del Municipio Maneiro');
