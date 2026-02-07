import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DriverVehicle {
  id: string;
  license_plate: string;
  model: string | null;
  capacity: number | null;
  status: string | null;
  route_id: string | null;
  current_latitude: number | null;
  current_longitude: number | null;
}

export interface DriverRoute {
  id: string;
  name: string;
  color: string;
  route_identification: string | null;
  description: string | null;
  frequency_minutes: number | null;
  departure_time: string | null;
  arrival_time: string | null;
  short_route: string | null;
  long_route: string | null;
}

export interface DriverStop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  stop_order: number | null;
}

export interface DriverPaymentInfo {
  id: string;
  payment_method: string;
  pm_telefono: string | null;
  pm_cedula: string | null;
  pm_banco: string | null;
  tf_banco: string | null;
  tf_tipo_cuenta: string | null;
  tf_numero_cuenta: string | null;
  tf_titular: string | null;
  tf_cedula: string | null;
}

export const useDriverData = (driverId: string) => {
  const [vehicle, setVehicle] = useState<DriverVehicle | null>(null);
  const [route, setRoute] = useState<DriverRoute | null>(null);
  const [stops, setStops] = useState<DriverStop[]>([]);
  const [payment, setPayment] = useState<DriverPaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDriverData = async () => {
    try {
      // Fetch driver's assigned vehicle
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('driver_id', driverId)
        .maybeSingle();

      if (vehicleError) throw vehicleError;
      setVehicle(vehicleData);

      // Fetch route if vehicle has one
      if (vehicleData?.route_id) {
        const { data: routeData, error: routeError } = await supabase
          .from('bus_routes')
          .select('*')
          .eq('id', vehicleData.route_id)
          .maybeSingle();

        if (routeError) throw routeError;
        setRoute(routeData);

        // Fetch stops for the route
        const { data: stopsData, error: stopsError } = await supabase
          .from('bus_stops')
          .select('*')
          .eq('route_id', vehicleData.route_id)
          .order('stop_order');

        if (stopsError) throw stopsError;
        setStops(stopsData || []);
      }

      // Fetch payment info
      const { data: paymentData, error: paymentError } = await supabase
        .from('driver_payments')
        .select('*')
        .eq('driver_id', driverId)
        .maybeSingle();

      if (paymentError && paymentError.code !== 'PGRST116') throw paymentError;
      setPayment(paymentData);
    } catch (error) {
      console.error('Error fetching driver data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (driverId) {
      fetchDriverData();
    }
  }, [driverId]);

  const updateVehicleLocation = async (lat: number, lng: number) => {
    if (!vehicle) return;
    
    const { error } = await supabase
      .from('vehicles')
      .update({
        current_latitude: lat,
        current_longitude: lng,
        last_updated: new Date().toISOString(),
        status: 'active'
      })
      .eq('id', vehicle.id);

    if (error) {
      console.error('Error updating vehicle location:', error);
    }
  };

  const setVehicleOffline = async () => {
    if (!vehicle) return;
    
    const { error } = await supabase
      .from('vehicles')
      .update({
        current_latitude: null,
        current_longitude: null,
        last_updated: new Date().toISOString(),
        status: 'inactive'
      })
      .eq('id', vehicle.id);

    if (error) {
      console.error('Error setting vehicle offline:', error);
    }
  };

  return { vehicle, route, stops, payment, loading, updateVehicleLocation, setVehicleOffline, refetch: fetchDriverData };
};
