
-- Create route_waypoints table to store intermediate points for route polylines
CREATE TABLE public.route_waypoints (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  route_id uuid NOT NULL REFERENCES public.bus_routes(id) ON DELETE CASCADE,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  waypoint_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.route_waypoints ENABLE ROW LEVEL SECURITY;

-- Everyone can view waypoints
CREATE POLICY "Route waypoints are viewable by everyone"
ON public.route_waypoints
FOR SELECT
USING (true);

-- Admins can manage waypoints
CREATE POLICY "Admins can manage route waypoints"
ON public.route_waypoints
FOR ALL
USING (is_admin_general() OR is_any_admin_parroquia());

-- Index for performance
CREATE INDEX idx_route_waypoints_route_id ON public.route_waypoints(route_id, waypoint_order);
