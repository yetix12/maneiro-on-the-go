
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bus } from 'lucide-react';
import { busRoutes } from './mapData';

interface RouteSelectorProps {
  selectedRoute: string | null;
  onRouteSelect: (routeId: string | null) => void;
}

const RouteSelector: React.FC<RouteSelectorProps> = ({ selectedRoute, onRouteSelect }) => {
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
        {busRoutes.map((route) => (
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
            {route.name}
          </Button>
        ))}
      </div>
    </Card>
  );
};

export default RouteSelector;
