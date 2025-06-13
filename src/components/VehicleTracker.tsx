
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bus, Navigation, Clock, MapPin } from 'lucide-react';

const vehicles = [
  {
    id: 'MAN-001',
    route: 'Pampatar - Porlamar',
    driver: 'Carlos Rodríguez',
    status: 'En ruta',
    passengers: 18,
    capacity: 25,
    location: 'Plaza Bolívar',
    nextStop: 'Centro Comercial',
    estimatedArrival: '3 min',
    color: '#3B82F6'
  },
  {
    id: 'MAN-002',
    route: 'Pampatar - Porlamar',
    driver: 'María González',
    status: 'En parada',
    passengers: 12,
    capacity: 25,
    location: 'Terminal Pampatar',
    nextStop: 'Plaza Mayor',
    estimatedArrival: '5 min',
    color: '#3B82F6'
  },
  {
    id: 'MAN-003',
    route: 'Pampatar - Playa El Agua',
    driver: 'José Martínez',
    status: 'En ruta',
    passengers: 22,
    capacity: 30,
    location: 'El Tirano',
    nextStop: 'Pedro González',
    estimatedArrival: '8 min',
    color: '#10B981'
  },
  {
    id: 'MAN-004',
    route: 'Circuito Urbano',
    driver: 'Ana López',
    status: 'Mantenimiento',
    passengers: 0,
    capacity: 20,
    location: 'Terminal Pampatar',
    nextStop: '-',
    estimatedArrival: '-',
    color: '#F59E0B'
  }
];

const VehicleTracker = () => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En ruta':
        return 'bg-green-100 text-green-800';
      case 'En parada':
        return 'bg-blue-100 text-blue-800';
      case 'Mantenimiento':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOccupancyPercentage = (passengers: number, capacity: number) => {
    return (passengers / capacity) * 100;
  };

  return (
    <div className="p-4 pb-20 space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Vehículos en Tiempo Real</h2>
        <p className="text-gray-600">Seguimiento en vivo de la flota</p>
      </div>

      {vehicles.map((vehicle) => (
        <Card key={vehicle.id} className="p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="bg-gray-100 p-2 rounded-full">
                <Bus size={20} style={{ color: vehicle.color }} />
              </div>
              <div>
                <h3 className="font-bold text-lg">{vehicle.id}</h3>
                <p className="text-gray-600 text-sm">{vehicle.route}</p>
                <p className="text-gray-500 text-xs">Conductor: {vehicle.driver}</p>
              </div>
            </div>
            <Badge className={getStatusColor(vehicle.status)}>
              {vehicle.status}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center space-x-2">
              <MapPin size={16} className="text-blue-600" />
              <div>
                <p className="text-xs text-gray-600">Ubicación actual</p>
                <p className="font-semibold text-sm">{vehicle.location}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Navigation size={16} className="text-green-600" />
              <div>
                <p className="text-xs text-gray-600">Próxima parada</p>
                <p className="font-semibold text-sm">{vehicle.nextStop}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center space-x-2">
              <Clock size={16} className="text-orange-600" />
              <div>
                <p className="text-xs text-gray-600">Tiempo estimado</p>
                <p className="font-semibold text-sm">{vehicle.estimatedArrival}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">
                Ocupación: {vehicle.passengers}/{vehicle.capacity}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    getOccupancyPercentage(vehicle.passengers, vehicle.capacity) > 80
                      ? 'bg-red-500'
                      : getOccupancyPercentage(vehicle.passengers, vehicle.capacity) > 60
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{
                    width: `${getOccupancyPercentage(vehicle.passengers, vehicle.capacity)}%`
                  }}
                />
              </div>
            </div>
          </div>
        </Card>
      ))}

      <Card className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-dashed border-green-200">
        <div className="text-center">
          <Navigation size={32} className="mx-auto mb-2 text-green-600" />
          <h3 className="font-bold mb-1">Sistema GPS Activo</h3>
          <p className="text-sm text-gray-600">
            Información actualizada cada 30 segundos desde cada vehículo
          </p>
        </div>
      </Card>
    </div>
  );
};

export default VehicleTracker;
