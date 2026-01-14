-- Add new fields to bus_routes for frequency and schedules
ALTER TABLE public.bus_routes 
ADD COLUMN IF NOT EXISTS frequency_minutes integer DEFAULT 15,
ADD COLUMN IF NOT EXISTS departure_time time DEFAULT '05:30:00',
ADD COLUMN IF NOT EXISTS arrival_time time DEFAULT '21:00:00';

-- Add bus_stop_ids array to galeria_maneiro to link images to bus stops
ALTER TABLE public.galeria_maneiro
ADD COLUMN IF NOT EXISTS bus_stop_ids uuid[] DEFAULT '{}';

-- Add driver_id field to profiles for drivers that need a vehicle assigned
-- (vehicles table already has driver_id, so we're good there)

-- Create storage bucket for gallery images
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery', 'gallery', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for gallery bucket
CREATE POLICY "Gallery images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'gallery');

CREATE POLICY "Admins can upload gallery images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'gallery' 
  AND (
    public.is_admin_general() 
    OR public.is_any_admin_parroquia()
  )
);

CREATE POLICY "Admins can update gallery images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'gallery' 
  AND (
    public.is_admin_general() 
    OR public.is_any_admin_parroquia()
  )
);

CREATE POLICY "Admins can delete gallery images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'gallery' 
  AND (
    public.is_admin_general() 
    OR public.is_any_admin_parroquia()
  )
);

-- Add calle and sector fields to profiles for better filtering
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS calle text,
ADD COLUMN IF NOT EXISTS sector text,
ADD COLUMN IF NOT EXISTS fecha_nacimiento date;