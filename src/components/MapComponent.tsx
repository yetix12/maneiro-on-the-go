
import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navigation, MapPin, Bus } from 'lucide-react';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface MapComponentProps {
  userLocation: LocationData | null;
}

// Datos simulados de rutas y paradas de Maneiro
const busRoutes = [
  {
    id: 'ruta-1',
    name: 'Pampatar - Porlamar',
    color: '#3B82F6',
    stops: [
      { id: 'stop-1', name: 'Terminal Pampatar', lat: 11.0047, lng: -63.8697 },
      { id: 'stop-2', name: 'Plaza Bolívar', lat: 11.0125, lng: -63.8542 },
      { id: 'stop-3', name: 'Centro Comercial', lat: 11.0203, lng: -63.8387 },
      { id: 'stop-4', name: 'Terminal Porlamar', lat: 10.9577, lng: -63.8497 },
    ]
  },
  {
    id: 'ruta-2',
    name: 'Pampatar - Playa El Agua',
    color: '#10B981',
    stops: [
      { id: 'stop-5', name: 'Terminal Pampatar', lat: 11.0047, lng: -63.8697 },
      { id: 'stop-6', name: 'El Tirano', lat: 11.0435, lng: -63.8156 },
      { id: 'stop-7', name: 'Playa El Agua', lat: 11.0856, lng: -63.7944 },
    ]
  }
];

const activeVehicles = [
  { id: 'bus-1', routeId: 'ruta-1', lat: 11.0089, lng: -63.8620, status: 'En ruta' },
  { id: 'bus-2', routeId: 'ruta-1', lat: 11.0167, lng: -63.8465, status: 'En parada' },
  { id: 'bus-3', routeId: 'ruta-2', lat: 11.0241, lng: -63.8376, status: 'En ruta' },
];

const MapComponent: React.FC<MapComponentProps> = ({ userLocation }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);

  return (
    <div className="relative h-full">
      {/* Mapa simulado con SVG */}
      <div ref={mapRef} className="w-full h-full bg-gradient-to-br from-blue-100 to-green-100 relative overflow-hidden">
        
        {/* Simulación del mapa base */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 600">
          {/* Fondo del mar */}
          <rect x="0" y="0" width="400" height="600" fill="url(#oceanGradient)" />
          
          {/* Isla de Margarita simplificada */}
          <path 
            d="M 50 150 Q 100 100 200 120 Q 300 140 350 200 Q 370 300 320 400 Q 250 450 150 430 Q 80 380 50 300 Q 30 250 50 150"
            fill="#E5F3E5"
            stroke="#059669"
            strokeWidth="2"
          />
          
          {/* Gradientes */}
          <defs>
            <linearGradient id="oceanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0EA5E9" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
            <radialGradient id="userLocationGradient">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#EF4444" stopOpacity="0.3" />
            </radialGradient>
          </defs>
          
          {/* Rutas de transporte */}
          {busRoutes.map((route) => (
            <g key={route.id}>
              {route.stops.map((stop, index) => {
                if (index === route.stops.length - 1) return null;
                const nextStop = route.stops[index + 1];
                const x1 = ((stop.lng + 63.9) * 400);
                const y1 = ((11.1 - stop.lat) * 600);
                const x2 = ((nextStop.lng + 63.9) * 400);
                const y2 = ((11.1 - nextStop.lat) * 600);
                
                return (
                  <line
                    key={`${route.id}-line-${index}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={selectedRoute === route.id ? route.color : '#94A3B8'}
                    strokeWidth={selectedRoute === route.id ? "4" : "2"}
                    strokeDasharray={selectedRoute === route.id ? "0" : "5,5"}
                    opacity={selectedRoute === null || selectedRoute === route.id ? 1 : 0.3}
                  />
                );
              })}
              
              {/* Paradas */}
              {route.stops.map((stop) => {
                const x = ((stop.lng + 63.9) * 400);
                const y = ((11.1 - stop.lat) * 600);
                
                return (
                  <circle
                    key={`${route.id}-stop-${stop.id}`}
                    cx={x}
                    cy={y}
                    r={selectedRoute === route.id ? "8" : "5"}
                    fill={route.color}
                    stroke="white"
                    strokeWidth="2"
                    opacity={selectedRoute === null || selectedRoute === route.id ? 1 : 0.3}
                  />
                );
              })}
            </g>
          ))}
          
          {/* Vehículos activos */}
          {activeVehicles.map((vehicle) => {
            const route = busRoutes.find(r => r.id === vehicle.routeId);
            const x = ((vehicle.lng + 63.9) * 400);
            const y = ((11.1 - vehicle.lat) * 600);
            
            return (
              <g key={vehicle.id}>
                <circle
                  cx={x}
                  cy={y}
                  r="12"
                  fill={route?.color || '#3B82F6'}
                  className="vehicle-marker"
                />
                <text
                  x={x}
                  y={y + 4}
                  textAnchor="middle"
                  fill="white"
                  fontSize="10"
                  fontWeight="bold"
                >
                  🚌
                </text>
              </g>
            );
          })}
          
          {/* Ubicación del usuario */}
          {userLocation && (
            <g>
              <circle
                cx={(userLocation.longitude + 63.9) * 400}
                cy={(11.1 - userLocation.latitude) * 600}
                r="15"
                fill="url(#userLocationGradient)"
              />
              <circle
                cx={(userLocation.longitude + 63.9) * 400}
                cy={(11.1 - userLocation.latitude) * 600}
                r="8"
                fill="#EF4444"
              />
              <circle
                cx={(userLocation.longitude + 63.9) * 400}
                cy={(11.1 - userLocation.latitude) * 600}
                r="3"
                fill="white"
              />
            </g>
          )}
        </svg>
      </div>

      {/* Controles del mapa */}
      <div className="absolute top-4 right-4 space-y-2">
        <Button
          size="sm"
          className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg"
        >
          <Navigation size={16} />
        </Button>
      </div>

      {/* Selector de rutas */}
      <Card className="absolute bottom-20 left-4 right-4 p-4">
        <h3 className="font-semibold mb-3">Rutas Disponibles</h3>
        <div className="space-y-2">
          {busRoutes.map((route) => (
            <Button
              key={route.id}
              variant={selectedRoute === route.id ? 'default' : 'outline'}
              className="w-full justify-start"
              onClick={() => setSelectedRoute(selectedRoute === route.id ? null : route.id)}
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
    </div>
  );
};

export default MapComponent;
