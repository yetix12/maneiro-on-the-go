
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface RouteSelectorProps {
  selectedRoute: string | null;
  onRouteSelect: (routeId: string | null) => void;
}

const RouteSelector: React.FC<RouteSelectorProps> = ({ selectedRoute, onRouteSelect }) => {
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const { data, error } = await supabase
          .from('bus_routes')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (error) {
          console.error('Error fetching routes:', error);
          return;
        }

        setRoutes(data || []);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoutes();
  }, []);

  return (
    <Card className="absolute bottom-24 left-4 right-4 p-4">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <Bus size={18} />
        Rutas de Transporte
      </h3>
      <div className="space-y-2">
        <Button
          variant={selectedRoute === null ? 'default' : 'outline'}
          className="w-full justify-start text-sm"
          onClick={() => onRouteSelect(null)}
        >
          🗺️ Ver todas las rutas
        </Button>
        {loading ? (
          <div className="text-sm text-muted-foreground">Cargando rutas...</div>
        ) : routes.length === 0 ? (
          <div className="text-sm text-muted-foreground">No hay rutas registradas</div>
        ) : (
          routes.map((route) => (
            <Button
              key={route.id}
              variant={selectedRoute === route.id ? 'default' : 'outline'}
              className="w-full justify-start text-sm"
              onClick={() => onRouteSelect(selectedRoute === route.id ? null : route.id)}
            >
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: route.color }}
              />
              {route.route_identification || route.name}
            </Button>
          ))
        )}
      </div>
    </Card>
  );
};

export default RouteSelector;
