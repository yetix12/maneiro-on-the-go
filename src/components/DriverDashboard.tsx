
import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Navigation, MapPin, Bus, Clock, AlertTriangle, LogOut, Route, 
  CreditCard, Phone, Building, User, ChevronRight, ArrowRight 
} from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useDriverData } from '@/hooks/useDriverData';

interface DriverDashboardProps {
  driverInfo: any;
  onLogout: () => void;
}

const DriverDashboard: React.FC<DriverDashboardProps> = ({ driverInfo, onLogout }) => {
  const { location, error, isLoading, getCurrentPosition } = useGeolocation();
  const { vehicle, route, stops, payment, loading: dataLoading, updateVehicleLocation, setVehicleOffline } = useDriverData(driverInfo.id);
  const [isOnline, setIsOnline] = useState(false);
  const [tripStartTime, setTripStartTime] = useState<Date | null>(null);
  const [tripDuration, setTripDuration] = useState('00:00:00');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [nextStopIndex, setNextStopIndex] = useState(0);
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update trip duration timer
  useEffect(() => {
    if (!isOnline || !tripStartTime) return;
    const interval = setInterval(() => {
      const now = new Date();
      const diff = now.getTime() - tripStartTime.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTripDuration(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOnline, tripStartTime]);

  // Send location updates when online
  useEffect(() => {
    if (isOnline && location) {
      updateVehicleLocation(location.latitude, location.longitude);
    }
  }, [location, isOnline]);

  // Find nearest next stop based on current location
  useEffect(() => {
    if (!location || stops.length === 0) return;
    
    let minDist = Infinity;
    let nearestIdx = 0;
    
    stops.forEach((stop, idx) => {
      const dist = Math.sqrt(
        Math.pow(stop.latitude - location.latitude, 2) + 
        Math.pow(stop.longitude - location.longitude, 2)
      );
      if (dist < minDist) {
        minDist = dist;
        nearestIdx = idx;
      }
    });
    
    // Set next stop as the one after nearest (or last stop)
    setNextStopIndex(Math.min(nearestIdx + 1, stops.length - 1));
  }, [location, stops]);

  const handleGoOnline = () => {
    if (location) {
      setIsOnline(true);
      setTripStartTime(new Date());
      updateVehicleLocation(location.latitude, location.longitude);
    } else {
      getCurrentPosition();
    }
  };

  const handleGoOffline = async () => {
    setIsOnline(false);
    setTripStartTime(null);
    setTripDuration('00:00:00');
    await setVehicleOffline();
  };

  const getDistanceToStop = (stop: { latitude: number; longitude: number }) => {
    if (!location) return null;
    const R = 6371;
    const dLat = (stop.latitude - location.latitude) * Math.PI / 180;
    const dLon = (stop.longitude - location.longitude) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(location.latitude * Math.PI / 180) * Math.cos(stop.latitude * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = R * c;
    return dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`;
  };

  const nextStop = stops[nextStopIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-yellow-50">
      {/* Header */}
      <div className="caribbean-gradient text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 rounded-full p-2">
              <Bus size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold">¡Hola, {driverInfo.name}!</h1>
              <p className="text-blue-100 text-sm">
                Conductor - {vehicle?.license_plate || 'Sin vehículo'}
              </p>
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

      <div className="p-4 space-y-4 pb-8">
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
                Activa tu ubicación para comenzar el servicio de transporte
              </p>
              
              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-md mb-4">
                  <AlertTriangle size={16} />
                  {error}
                </div>
              )}

              {!vehicle && (
                <div className="flex items-center gap-2 text-orange-600 text-sm bg-orange-50 p-3 rounded-md mb-4">
                  <AlertTriangle size={16} />
                  No tienes un vehículo asignado. Contacta al administrador.
                </div>
              )}
              
              <Button
                onClick={handleGoOnline}
                className="caribbean-gradient"
                disabled={isLoading || !vehicle}
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
                  <Route size={20} className="mx-auto mb-1 text-blue-600" />
                  <p className="text-xs text-gray-600">Ruta</p>
                  <p className="font-semibold text-sm">Activa</p>
                </div>
                <div className="text-center">
                  <Clock size={20} className="mx-auto mb-1 text-orange-600" />
                  <p className="text-xs text-gray-600">Tiempo</p>
                  <p className="font-semibold text-sm">{tripDuration}</p>
                </div>
              </div>

              {/* Next Stop Info */}
              {nextStop && (
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-orange-800 flex items-center gap-2">
                      <ArrowRight size={18} />
                      Siguiente Parada
                    </h4>
                    {getDistanceToStop(nextStop) && (
                      <Badge className="bg-orange-100 text-orange-800">
                        {getDistanceToStop(nextStop)}
                      </Badge>
                    )}
                  </div>
                  <p className="text-orange-700 font-medium">{nextStop.name}</p>
                  <p className="text-xs text-orange-600 mt-1">
                    Parada {nextStop.stop_order || (nextStopIndex + 1)} de {stops.length}
                  </p>
                </div>
              )}

              {location && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-xs text-green-600">
                    📍 Lat: {location.latitude.toFixed(4)}, Lng: {location.longitude.toFixed(4)}
                  </p>
                </div>
              )}

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

        {/* Ruta Asignada */}
        <Card className="p-4">
          <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
            <Route size={20} className="text-blue-600" />
            Ruta Asignada
          </h3>
          {route ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full border-2 border-black/20" 
                  style={{ backgroundColor: route.color }}
                />
                <div>
                  <p className="font-semibold">{route.name}</p>
                  {route.route_identification && (
                    <p className="text-sm text-gray-500">{route.route_identification}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 p-2 rounded">
                  <p className="text-gray-500 text-xs">Frecuencia</p>
                  <p className="font-medium">{route.frequency_minutes || 15} min</p>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <p className="text-gray-500 text-xs">Horario</p>
                  <p className="font-medium">{route.departure_time?.slice(0, 5) || '05:30'} - {route.arrival_time?.slice(0, 5) || '21:00'}</p>
                </div>
              </div>

              {/* Stops list */}
              <div className="mt-3">
                <p className="text-sm font-medium text-gray-600 mb-2">Paradas ({stops.length})</p>
                <div className="space-y-1">
                  {stops.map((stop, idx) => (
                    <div 
                      key={stop.id} 
                      className={`flex items-center gap-2 p-2 rounded text-sm ${
                        idx === nextStopIndex && isOnline ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'
                      }`}
                    >
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: route.color }}
                      />
                      <span className="flex-1">{stop.name}</span>
                      {idx === nextStopIndex && isOnline && (
                        <ChevronRight size={14} className="text-orange-600" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <Route size={32} className="mx-auto mb-2 opacity-50" />
              <p>No tienes ruta asignada</p>
            </div>
          )}
        </Card>

        {/* Vehículo Asignado */}
        <Card className="p-4">
          <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
            <Bus size={20} className="text-blue-600" />
            Vehículo Asignado
          </h3>
          {vehicle ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-gray-500 text-xs">Placa</p>
                  <p className="font-bold text-lg">{vehicle.license_plate}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-gray-500 text-xs">Modelo</p>
                  <p className="font-medium">{vehicle.model || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-gray-500 text-xs">Capacidad</p>
                  <p className="font-medium">{vehicle.capacity || 30} pasajeros</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-gray-500 text-xs">Estado</p>
                  <Badge className={vehicle.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {vehicle.status === 'active' ? 'Activo' : vehicle.status === 'inactive' ? 'Inactivo' : vehicle.status || 'N/A'}
                  </Badge>
                </div>
              </div>

              {route && (
                <div className="flex items-center gap-2 p-2 rounded bg-blue-50">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: route.color }} />
                  <p className="text-sm text-blue-800">
                    <strong>Ruta:</strong> {route.name}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <Bus size={32} className="mx-auto mb-2 opacity-50" />
              <p>No tienes vehículo asignado</p>
            </div>
          )}
        </Card>

        {/* Métodos de Pago */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <CreditCard size={20} className="text-green-600" />
              Métodos de Pago
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPaymentDialog(true)}
            >
              {payment ? 'Ver Detalles' : 'Sin configurar'}
            </Button>
          </div>

          {payment ? (
            <div className="space-y-2">
              <Badge className={payment.payment_method === 'pago_movil' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                {payment.payment_method === 'pago_movil' ? 'Pago Móvil' : 'Transferencia'}
              </Badge>
              <p className="text-sm text-gray-600">
                {payment.payment_method === 'pago_movil' 
                  ? `Tel: ${payment.pm_telefono || 'N/A'} • ${payment.pm_banco || 'N/A'}`
                  : `Banco: ${payment.tf_banco || 'N/A'} • Cuenta: ${payment.tf_numero_cuenta || 'N/A'}`
                }
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No has configurado tus métodos de pago. Contacta al administrador.</p>
          )}
        </Card>

        {/* GPS Info */}
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-green-50 border-2 border-dashed border-blue-200">
          <div className="text-center">
            <Bus size={32} className="mx-auto mb-2 text-blue-600" />
            <h3 className="font-bold mb-1">Sistema GPS Activo</h3>
            <p className="text-sm text-gray-600">
              Tu ubicación se actualiza automáticamente para el seguimiento del servicio
            </p>
          </div>
        </Card>
      </div>

      {/* Payment Details Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard size={20} />
              Mis Datos de Pago
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!payment ? (
              <div className="text-center py-8 text-gray-500">
                <CreditCard size={48} className="mx-auto mb-2 opacity-50" />
                <p>No tienes datos de pago configurados</p>
                <p className="text-sm mt-1">Contacta al administrador para configurar tu método de pago</p>
              </div>
            ) : payment.payment_method === 'pago_movil' ? (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                  <Phone size={18} />
                  Pago Móvil
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-green-600" />
                    <span className="text-sm"><strong>Teléfono:</strong> {payment.pm_telefono || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-green-600" />
                    <span className="text-sm"><strong>Cédula:</strong> {payment.pm_cedula || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building size={16} className="text-green-600" />
                    <span className="text-sm"><strong>Banco:</strong> {payment.pm_banco || 'N/A'}</span>
                  </div>
                </div>
              </div>
            ) : payment.payment_method === 'transferencia' ? (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                  <Building size={18} />
                  Transferencia Bancaria
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Building size={16} className="text-blue-600" />
                    <span className="text-sm"><strong>Banco:</strong> {payment.tf_banco || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard size={16} className="text-blue-600" />
                    <span className="text-sm"><strong>Tipo:</strong> {payment.tf_tipo_cuenta || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard size={16} className="text-blue-600" />
                    <span className="text-sm"><strong>Cuenta:</strong> {payment.tf_numero_cuenta || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-blue-600" />
                    <span className="text-sm"><strong>Titular:</strong> {payment.tf_titular || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-blue-600" />
                    <span className="text-sm"><strong>Cédula:</strong> {payment.tf_cedula || 'N/A'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                Método de pago no reconocido
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DriverDashboard;
