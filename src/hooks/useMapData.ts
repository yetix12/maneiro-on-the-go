import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface WaypointData {
  id: string;
  lat: number;
  lng: number;
  waypoint_order: number;
}

export interface RouteData {
  id: string;
  name: string;
  color: string;
  route_identification: string | null;
  description: string | null;
  stops: StopData[];
  waypoints: WaypointData[];
}

export interface StopData {
  id: string;
  name: string;
  lat: number;
  lng: number;
  stop_order: number | null;
}

export interface VehicleData {
  id: string;
  routeId: string | null;
  lat: number | null;
  lng: number | null;
  status: string;
  driver: string | null;
  license_plate: string;
  model: string | null;
}

export const useMapData = () => {
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      // Fetch routes, stops, and waypoints in parallel
      const [routesRes, stopsRes, waypointsRes, vehiclesRes] = await Promise.all([
        supabase.from('bus_routes').select('*').eq('is_active', true),
        supabase.from('bus_stops').select('*').order('stop_order'),
        supabase.from('route_waypoints').select('*').order('waypoint_order'),
        supabase.from('vehicles').select('*'),
      ]);

      if (routesRes.error) throw routesRes.error;
      if (stopsRes.error) throw stopsRes.error;
      if (waypointsRes.error) throw waypointsRes.error;
      if (vehiclesRes.error) throw vehiclesRes.error;

      // Combine routes with their stops and waypoints
      const routesWithStops: RouteData[] = (routesRes.data || []).map(route => ({
        id: route.id,
        name: route.name,
        color: route.color || '#3B82F6',
        route_identification: route.route_identification,
        description: route.description,
        stops: (stopsRes.data || [])
          .filter(stop => stop.route_id === route.id)
          .map(stop => ({
            id: stop.id,
            name: stop.name,
            lat: stop.latitude,
            lng: stop.longitude,
            stop_order: stop.stop_order
          })),
        waypoints: (waypointsRes.data || [])
          .filter(wp => wp.route_id === route.id)
          .map(wp => ({
            id: wp.id,
            lat: wp.latitude,
            lng: wp.longitude,
            waypoint_order: wp.waypoint_order
          }))
      }));

      setRoutes(routesWithStops);

      // Fetch driver names for vehicles
      const driverIds = (vehiclesRes.data || []).map(v => v.driver_id).filter(Boolean);
      let driversMap: Record<string, string> = {};
      
      if (driverIds.length > 0) {
        const { data: driversData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', driverIds);
        
        driversMap = (driversData || []).reduce((acc, d) => {
          acc[d.id] = d.full_name || '';
          return acc;
        }, {} as Record<string, string>);
      }

      const formattedVehicles: VehicleData[] = (vehiclesRes.data || []).map(v => ({
        id: v.id,
        routeId: v.route_id,
        lat: v.current_latitude,
        lng: v.current_longitude,
        status: v.status || 'active',
        driver: v.driver_id ? driversMap[v.driver_id] || null : null,
        license_plate: v.license_plate,
        model: v.model
      }));

      setVehicles(formattedVehicles);
    } catch (error) {
      console.error('Error fetching map data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Set up realtime subscription for vehicles
    const vehiclesChannel = supabase
      .channel('vehicles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(vehiclesChannel);
    };
  }, [fetchData]);

  return { routes, vehicles, loading, refetch: fetchData };
};

// Keep the maneiroArea for the polygon highlight
export const maneiroArea = [
  { lat: 11.0158, lng: -63.8702 },
  { lat: 11.0158, lng: -63.8580 },
  { lat: 11.0089, lng: -63.8550 },
  { lat: 11.0025, lng: -63.8580 },
  { lat: 10.9950, lng: -63.8650 },
  { lat: 10.9950, lng: -63.8750 },
  { lat: 11.0089, lng: -63.8750 },
  { lat: 11.0158, lng: -63.8702 }
];
