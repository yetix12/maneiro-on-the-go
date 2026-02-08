
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bus, Search, X, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RouteSelectorProps {
  selectedRoute: string | null;
  onRouteSelect: (routeId: string | null) => void;
}

const RouteSelector: React.FC<RouteSelectorProps> = ({ selectedRoute, onRouteSelect }) => {
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredRoutes = routes.filter((route) => {
    const term = searchTerm.toLowerCase();
    return (
      route.name?.toLowerCase().includes(term) ||
      route.route_identification?.toLowerCase().includes(term)
    );
  });

  const selectedRouteName = selectedRoute
    ? routes.find(r => r.id === selectedRoute)?.route_identification || routes.find(r => r.id === selectedRoute)?.name || 'Ruta'
    : 'Todas las rutas';

  const handleSelect = (routeId: string | null) => {
    onRouteSelect(routeId);
    setOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="absolute bottom-24 left-4 right-4 z-40">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            className="w-full bg-card text-card-foreground hover:bg-secondary shadow-lg border border-border justify-between h-12 text-base"
            variant="outline"
          >
            <div className="flex items-center gap-2">
              <Bus size={18} className="text-primary" />
              <span className="font-semibold">{selectedRouteName}</span>
            </div>
            <ChevronDown size={18} className="text-muted-foreground" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bus size={20} className="text-primary" />
              Rutas de Transporte
            </DialogTitle>
          </DialogHeader>
          
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar ruta por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              autoFocus
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setSearchTerm('')}
              >
                <X size={14} />
              </Button>
            )}
          </div>

          <ScrollArea className="max-h-[50vh]">
            <div className="space-y-2 pr-2">
              <Button
                variant={selectedRoute === null ? 'default' : 'outline'}
                className="w-full justify-start text-sm"
                onClick={() => handleSelect(null)}
              >
                🗺️ Ver todas las rutas
              </Button>
              {loading ? (
                <div className="text-sm text-muted-foreground p-4 text-center">Cargando rutas...</div>
              ) : filteredRoutes.length === 0 ? (
                <div className="text-sm text-muted-foreground p-4 text-center">
                  {searchTerm ? 'No se encontraron rutas' : 'No hay rutas registradas'}
                </div>
              ) : (
                filteredRoutes.map((route) => (
                  <Button
                    key={route.id}
                    variant={selectedRoute === route.id ? 'default' : 'outline'}
                    className="w-full justify-start text-sm"
                    onClick={() => handleSelect(selectedRoute === route.id ? null : route.id)}
                  >
                    <div
                      className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                      style={{ backgroundColor: route.color }}
                    />
                    {route.route_identification || route.name}
                  </Button>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RouteSelector;
