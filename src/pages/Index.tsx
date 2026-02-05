
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Navigation, MapPin, Bus, Route, Clock, LogOut, Info } from 'lucide-react';
import GoogleMapComponent from '@/components/GoogleMapComponent';
import RouteList from '@/components/RouteList';
import VehicleTracker from '@/components/VehicleTracker';
import RouteInfoSection from '@/components/RouteInfoSection';
import { useGeolocation } from '@/hooks/useGeolocation';

interface IndexProps {
  onLogout?: () => void;
}

const Index: React.FC<IndexProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('map');
  const [selectedRouteId, setSelectedRouteId] = useState<string | undefined>();
  const [selectedStopId, setSelectedStopId] = useState<string | undefined>();
  const { location, error, isLoading } = useGeolocation();

  const handleStopClick = (routeId: string, stopId: string) => {
    setSelectedRouteId(routeId);
    setSelectedStopId(stopId);
    setActiveTab('info');
  };

  const handleInfoBack = () => {
    setSelectedRouteId(undefined);
    setSelectedStopId(undefined);
    setActiveTab('routes');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-yellow-50">
      {/* Header */}
      <div className="caribbean-gradient text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Transporte Maneiro</h1>
            <p className="text-blue-100 text-sm">Nueva Esparta, Venezuela</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-white/20 rounded-full px-3 py-1">
              <Navigation size={16} />
              <span className="text-sm">En vivo</span>
            </div>
            {onLogout && (
              <Button
                variant="outline"
                size="sm"
                onClick={onLogout}
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                <LogOut size={16} className="mr-1" />
                Salir
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {activeTab === 'map' && (
          <div className="h-screen">
            <GoogleMapComponent userLocation={location} />
          </div>
        )}
        {activeTab === 'routes' && <RouteList onStopClick={handleStopClick} />}
        {activeTab === 'tracker' && <VehicleTracker />}
        {activeTab === 'info' && (
          <RouteInfoSection 
            initialRouteId={selectedRouteId}
            initialStopId={selectedStopId}
            onBack={handleInfoBack}
          />
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-blue-200 shadow-lg">
        <div className="flex justify-around py-2">
          <Button
            variant={activeTab === 'map' ? 'default' : 'ghost'}
            className="flex-1 flex flex-col items-center space-y-1 py-3"
            onClick={() => setActiveTab('map')}
          >
            <MapPin size={18} />
            <span className="text-xs">Mapa</span>
          </Button>
          <Button
            variant={activeTab === 'routes' ? 'default' : 'ghost'}
            className="flex-1 flex flex-col items-center space-y-1 py-3"
            onClick={() => setActiveTab('routes')}
          >
            <Route size={18} />
            <span className="text-xs">Rutas</span>
          </Button>
          <Button
            variant={activeTab === 'tracker' ? 'default' : 'ghost'}
            className="flex-1 flex flex-col items-center space-y-1 py-3"
            onClick={() => setActiveTab('tracker')}
          >
            <Bus size={18} />
            <span className="text-xs">Vehículos</span>
          </Button>
          <Button
            variant={activeTab === 'info' ? 'default' : 'ghost'}
            className="flex-1 flex flex-col items-center space-y-1 py-3"
            onClick={() => setActiveTab('info')}
          >
            <Info size={18} />
            <span className="text-xs">Información</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
