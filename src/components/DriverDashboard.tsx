
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navigation, MapPin, Bus, Users, Clock, AlertTriangle, LogOut } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';

interface DriverDashboardProps {
  driverInfo: any;
  onLogout: () => void;
}

const DriverDashboard: React.FC<DriverDashboardProps> = ({ driverInfo, onLogout }) => {
  const { location, error, isLoading, getCurrentPosition } = useGeolocation();
  const [isOnline, setIsOnline] = useState(false);
  const [passengers, setPassengers] = useState(0);
  const [currentRoute, setCurrentRoute] = useState('Pampatar - Porlamar');

  const handleGoOnline = () => {
    if (location) {
      setIsOnline(true);
      console.log('Conductor en línea en:', location);
    } else {
      getCurrentPosition();
    }
  };

  const handleGoOffline = () => {
    setIsOnline(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-yellow-50">
      {/* Header del Conductor */}
      <div className="caribbean-gradient text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 rounded-full p-2">
              <Bus size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold">¡Hola, {driverInfo.name}!</h1>
              <p className="text-blue-100 text-sm">Conductor - ID: {driverInfo.id}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onLogout}
            className="bg-white/20 border-white/30 text-white hover:bg-white/30"
          >
            <LogOut size={16} className="mr-1" />
            Salir
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Estado del Conductor */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Estado del Servicio</h2>
            <Badge className={isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
              {isOnline ? 'En línea' : 'Fuera de línea'}
            </Badge>
          </div>

          {!isOnline ? (
            <div className="text-center py-6">
              <Navigation size={48} className="mx-auto mb-4 text-blue-600" />
              <h3 className="text-lg font-semibold mb-2">¿Listo para comenzar?</h3>
              <p className="text-gray-600 mb-4">
                Necesitamos acceso a tu ubicación para que los pasajeros puedan seguir tu ruta
              </p>
              
              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-md mb-4">
                  <AlertTriangle size={16} />
                  {error}
                </div>
              )}
              
              <Button
                onClick={handleGoOnline}
                className="caribbean-gradient"
                disabled={isLoading}
              >
                {isLoading ? 'Obteniendo ubicación...' : 'Comenzar Servicio'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <MapPin size={20} className="mx-auto mb-1 text-green-600" />
                  <p className="text-xs text-gray-600">Ubicación</p>
                  <p className="font-semibold text-sm">Activa</p>
                </div>
                <div className="text-center">
                  <Users size={20} className="mx-auto mb-1 text-blue-600" />
                  <p className="text-xs text-gray-600">Pasajeros</p>
                  <p className="font-semibold text-sm">{passengers}/25</p>
                </div>
                <div className="text-center">
                  <Clock size={20} className="mx-auto mb-1 text-orange-600" />
                  <p className="text-xs text-gray-600">Tiempo</p>
                  <p className="font-semibold text-sm">En ruta</p>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">Ruta Actual</h4>
                <p className="text-green-700">{currentRoute}</p>
                {location && (
                  <p className="text-xs text-green-600 mt-1">
                    Lat: {location.latitude.toFixed(4)}, Lng: {location.longitude.toFixed(4)}
                  </p>
                )}
              </div>

              <Button
                onClick={handleGoOffline}
                variant="destructive"
                className="w-full"
              >
                Terminar Servicio
              </Button>
            </div>
          )}
        </Card>

        {/* Información adicional */}
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-green-50 border-2 border-dashed border-blue-200">
          <div className="text-center">
            <Bus size={32} className="mx-auto mb-2 text-blue-600" />
            <h3 className="font-bold mb-1">Sistema GPS Activo</h3>
            <p className="text-sm text-gray-600">
              Tu ubicación se actualiza cada 30 segundos para que los pasajeros puedan seguir tu ruta
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DriverDashboard;
