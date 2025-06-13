
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Bus } from 'lucide-react';

const routes = [
  {
    id: 'ruta-1',
    name: 'Pampatar - Porlamar',
    description: 'Conecta el centro histórico con la zona comercial',
    frequency: '15-20 min',
    operatingHours: '5:00 AM - 10:00 PM',
    fare: 'Bs. 2.50',
    color: '#3B82F6',
    stops: [
      'Terminal Pampatar',
      'Plaza Mayor',
      'Centro de Salud',
      'Plaza Bolívar',
      'Mercado Municipal',
      'Centro Comercial Sambil',
      'Terminal Porlamar'
    ]
  },
  {
    id: 'ruta-2',
    name: 'Pampatar - Playa El Agua',
    description: 'Ruta turística hacia las mejores playas',
    frequency: '30-45 min',
    operatingHours: '6:00 AM - 8:00 PM',
    fare: 'Bs. 3.00',
    color: '#10B981',
    stops: [
      'Terminal Pampatar',
      'El Tirano',
      'Pedro González',
      'Manzanillo',
      'Playa El Agua'
    ]
  },
  {
    id: 'ruta-3',
    name: 'Circuito Urbano',
    description: 'Recorrido por la zona urbana de Pampatar',
    frequency: '10-15 min',
    operatingHours: '5:30 AM - 11:00 PM',
    fare: 'Bs. 2.00',
    color: '#F59E0B',
    stops: [
      'Terminal Pampatar',
      'Hospital Central',
      'Universidad',
      'Plaza de Armas',
      'Terminal Pampatar'
    ]
  }
];

const RouteList = () => {
  return (
    <div className="p-4 pb-20 space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Rutas de Transporte</h2>
        <p className="text-gray-600">Municipio Maneiro, Nueva Esparta</p>
      </div>

      {routes.map((route) => (
        <Card key={route.id} className="p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div 
                className="w-4 h-8 rounded"
                style={{ backgroundColor: route.color }}
              />
              <div>
                <h3 className="font-bold text-lg">{route.name}</h3>
                <p className="text-gray-600 text-sm">{route.description}</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Bus size={12} className="mr-1" />
              Activa
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <Clock size={16} className="mx-auto mb-1 text-blue-600" />
              <p className="text-xs text-gray-600">Frecuencia</p>
              <p className="font-semibold text-sm">{route.frequency}</p>
            </div>
            <div className="text-center">
              <MapPin size={16} className="mx-auto mb-1 text-green-600" />
              <p className="text-xs text-gray-600">Tarifa</p>
              <p className="font-semibold text-sm">{route.fare}</p>
            </div>
            <div className="text-center">
              <div className="w-4 h-4 mx-auto mb-1 bg-yellow-500 rounded-full" />
              <p className="text-xs text-gray-600">Horario</p>
              <p className="font-semibold text-xs">{route.operatingHours}</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2 text-sm">Paradas principales:</h4>
            <div className="flex flex-wrap gap-2">
              {route.stops.map((stop, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {stop}
                </Badge>
              ))}
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
