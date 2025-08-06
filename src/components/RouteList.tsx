
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Bus, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type Route = Tables<'bus_routes'>;
type Stop = Tables<'bus_stops'>;

interface RouteWithStops extends Route {
  stops: Stop[];
}

const RouteList = () => {
  const [routes, setRoutes] = useState<RouteWithStops[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        // Fetch routes
        const { data: routesData, error: routesError } = await supabase
          .from('bus_routes')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (routesError) throw routesError;

        // Fetch stops for each route
        const routesWithStops: RouteWithStops[] = [];
        
        for (const route of routesData || []) {
          const { data: stopsData, error: stopsError } = await supabase
            .from('bus_stops')
            .select('*')
            .eq('route_id', route.id)
            .order('stop_order');

          if (stopsError) {
            console.error('Error fetching stops:', stopsError);
          }

          routesWithStops.push({
            ...route,
            stops: stopsData || []
          });
        }

        setRoutes(routesWithStops);
      } catch (err) {
        console.error('Error fetching routes:', err);
        setError('Error al cargar las rutas');
      } finally {
        setLoading(false);
      }
    };

    fetchRoutes();
  }, []);

  if (loading) {
    return (
      <div className="p-4 pb-20 space-y-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Rutas de Transporte</h2>
          <p className="text-gray-600">Cargando rutas...</p>
        </div>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 pb-20 space-y-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Rutas de Transporte</h2>
          <div className="flex items-center justify-center gap-2 text-red-600 mt-4">
            <AlertCircle size={20} />
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (routes.length === 0) {
    return (
      <div className="p-4 pb-20 space-y-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Rutas de Transporte</h2>
          <p className="text-gray-600">No hay rutas disponibles</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20 space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Rutas de Transporte</h2>
        <p className="text-gray-600">Municipio Maneiro, Nueva Esparta</p>
      </div>

      {routes.map((route) => (
        <Card key={route.id} className="p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div 
                className="w-4 h-8 rounded"
                style={{ backgroundColor: route.color }}
              />
              <div>
                <h3 className="font-bold text-lg">{route.name}</h3>
                <p className="text-xs text-gray-500">ID: {route.route_identification || route.id.slice(0, 8)}</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Bus size={12} className="mr-1" />
              {route.is_active ? 'Activa' : 'Inactiva'}
            </Badge>
          </div>

          {route.description && (
            <div className="mb-4">
              <h4 className="font-semibold mb-1 text-sm">Descripción:</h4>
              <p className="text-gray-600 text-sm">{route.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="font-semibold text-sm text-blue-800 mb-2">Información de Operación</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Frecuencia:</span>
                  <span className="font-medium">15-20 min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Horarios:</span>
                  <span className="font-medium">5:00 AM - 10:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tarifa:</span>
                  <span className="font-medium">Bs. 2.50</span>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-3 rounded-lg">
              <h4 className="font-semibold text-sm text-green-800 mb-2">Información de Ruta</h4>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-gray-600 block">Ruta Corta:</span>
                  <span className="font-medium text-green-700">{route.short_route || 'No definida'}</span>
                </div>
                <div>
                  <span className="text-gray-600 block">Color:</span>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: route.color }}
                    />
                    <span className="font-medium">{route.color}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {route.long_route && (
            <div className="mb-4">
              <h4 className="font-semibold mb-2 text-sm">Ruta Larga:</h4>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border-l-4 border-blue-400">{route.long_route}</p>
            </div>
          )}

          {route.stops && route.stops.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold mb-2 text-sm">Paradas ({route.stops.length}):</h4>
              <div className="flex flex-wrap gap-2">
                {route.stops.map((stop) => (
                  <Badge key={stop.id} variant="outline" className="text-xs">
                    {stop.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Creada: {new Date(route.created_at).toLocaleDateString()}</span>
              <span>Actualizada: {new Date(route.updated_at).toLocaleDateString()}</span>
            </div>
          </div>
        </Card>
      ))}

      <Card className="p-4 bg-gradient-to-r from-blue-50 to-green-50 border-2 border-dashed border-blue-200">
        <div className="text-center">
          <Bus size={32} className="mx-auto mb-2 text-blue-600" />
          <h3 className="font-bold mb-1">Sistema en Tiempo Real</h3>
          <p className="text-sm text-gray-600">
            Información actualizada cada 5 minutos con la ubicación exacta de cada vehículo
          </p>
        </div>
      </Card>
    </div>
  );
};

export default RouteList;
