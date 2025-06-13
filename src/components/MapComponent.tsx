
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

// Datos mejorados específicos de Maneiro
const busRoutes = [
  {
    id: 'ruta-1',
    name: 'Pampatar - Porlamar',
    color: '#3B82F6',
    stops: [
      { id: 'stop-1', name: 'Terminal Pampatar', lat: 11.0047, lng: -63.8697 },
      { id: 'stop-2', name: 'Castillo San Carlos', lat: 11.0089, lng: -63.8658 },
      { id: 'stop-3', name: 'Plaza Bolívar Pampatar', lat: 11.0125, lng: -63.8542 },
      { id: 'stop-4', name: 'Centro de Salud', lat: 11.0167, lng: -63.8465 },
      { id: 'stop-5', name: 'Mercado Municipal', lat: 11.0203, lng: -63.8387 },
      { id: 'stop-6', name: 'Sambil Margarita', lat: 10.9577, lng: -63.8497 },
    ]
  },
  {
    id: 'ruta-2',
    name: 'Pampatar - Playa El Agua',
    color: '#10B981',
    stops: [
      { id: 'stop-7', name: 'Terminal Pampatar', lat: 11.0047, lng: -63.8697 },
      { id: 'stop-8', name: 'El Tirano', lat: 11.0435, lng: -63.8156 },
      { id: 'stop-9', name: 'Pedro González', lat: 11.0654, lng: -63.8001 },
      { id: 'stop-10', name: 'Manzanillo', lat: 11.0745, lng: -63.7898 },
      { id: 'stop-11', name: 'Playa El Agua', lat: 11.0856, lng: -63.7944 },
    ]
  },
  {
    id: 'ruta-3',
    name: 'Circuito Urbano Pampatar',
    color: '#F59E0B',
    stops: [
      { id: 'stop-12', name: 'Terminal Pampatar', lat: 11.0047, lng: -63.8697 },
      { id: 'stop-13', name: 'Hospital Central', lat: 11.0012, lng: -63.8721 },
      { id: 'stop-14', name: 'Universidad', lat: 11.0089, lng: -63.8745 },
      { id: 'stop-15', name: 'Plaza de Armas', lat: 11.0125, lng: -63.8689 },
    ]
  }
];

const activeVehicles = [
  { id: 'bus-1', routeId: 'ruta-1', lat: 11.0089, lng: -63.8620, status: 'En ruta', driver: 'Carlos M.' },
  { id: 'bus-2', routeId: 'ruta-1', lat: 11.0167, lng: -63.8465, status: 'En parada', driver: 'María G.' },
  { id: 'bus-3', routeId: 'ruta-2', lat: 11.0241, lng: -63.8376, status: 'En ruta', driver: 'José R.' },
  { id: 'bus-4', routeId: 'ruta-3', lat: 11.0089, lng: -63.8745, status: 'En parada', driver: 'Ana L.' },
];

// Puntos de interés de Maneiro
const pointsOfInterest = [
  { name: 'Castillo San Carlos Borromeo', lat: 11.0089, lng: -63.8658, type: 'historic' },
  { name: 'Iglesia del Cristo del Buen Viaje', lat: 11.0125, lng: -63.8542, type: 'religious' },
  { name: 'Mercado Municipal', lat: 11.0203, lng: -63.8387, type: 'commercial' },
  { name: 'Playa El Agua', lat: 11.0856, lng: -63.7944, type: 'beach' },
  { name: 'Playa Parguito', lat: 11.0756, lng: -63.7856, type: 'beach' },
];

const MapComponent: React.FC<MapComponentProps> = ({ userLocation }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

  return (
    <div className="relative h-full">
      {/* Mapa mejorado con representación más detallada de Maneiro */}
      <div ref={mapRef} className="w-full h-full bg-gradient-to-br from-blue-200 to-blue-400 relative overflow-hidden">
        
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 600">
          {/* Gradientes mejorados */}
          <defs>
            <linearGradient id="oceanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284C7" />
              <stop offset="50%" stopColor="#0EA5E9" />
              <stop offset="100%" stopColor="#38BDF8" />
            </linearGradient>
            <linearGradient id="islandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22C55E" />
              <stop offset="50%" stopColor="#16A34A" />
              <stop offset="100%" stopColor="#15803D" />
            </linearGradient>
            <radialGradient id="userLocationGradient">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#EF4444" stopOpacity="0.2" />
            </radialGradient>
            <pattern id="beachPattern" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
              <rect width="4" height="4" fill="#FED7AA"/>
              <circle cx="2" cy="2" r="0.5" fill="#F97316"/>
            </pattern>
          </defs>
          
          {/* Fondo del mar con ondas */}
          <rect x="0" y="0" width="400" height="600" fill="url(#oceanGradient)" />
          
          {/* Ondas del mar */}
          <path d="M 0 100 Q 100 90 200 100 T 400 100 L 400 0 L 0 0 Z" fill="#0284C7" opacity="0.3"/>
          <path d="M 0 580 Q 100 570 200 580 T 400 580 L 400 600 L 0 600 Z" fill="#0284C7" opacity="0.3"/>
          
          {/* Isla de Margarita - Maneiro más detallado */}
          <path 
            d="M 80 180 Q 120 120 180 140 Q 240 160 300 180 Q 340 220 320 280 Q 300 340 260 380 Q 200 420 140 400 Q 100 360 80 300 Q 60 240 80 180"
            fill="url(#islandGradient)"
            stroke="#059669"
            strokeWidth="2"
          />
          
          {/* Zona urbana de Pampatar */}
          <rect x="170" y="240" width="60" height="40" fill="#D1D5DB" opacity="0.7" rx="2"/>
          <rect x="175" y="245" width="8" height="8" fill="#374151" rx="1"/>
          <rect x="185" y="245" width="8" height="8" fill="#374151" rx="1"/>
          <rect x="195" y="245" width="8" height="8" fill="#374151" rx="1"/>
          <rect x="175" y="255" width="8" height="8" fill="#374151" rx="1"/>
          <rect x="185" y="255" width="8" height="8" fill="#374151" rx="1"/>
          <rect x="195" y="255" width="8" height="8" fill="#374151" rx="1"/>
          
          {/* Playas */}
          <ellipse cx="280" cy="160" rx="20" ry="8" fill="url(#beachPattern)"/>
          <ellipse cx="300" cy="170" rx="25" ry="10" fill="url(#beachPattern)"/>
          
          {/* Rutas de transporte mejoradas */}
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
                    stroke={selectedRoute === route.id ? route.color : '#64748B'}
                    strokeWidth={selectedRoute === route.id ? "5" : "3"}
                    strokeDasharray={selectedRoute === route.id ? "0" : "8,4"}
                    opacity={selectedRoute === null || selectedRoute === route.id ? 0.9 : 0.4}
                  />
                );
              })}
              
              {/* Paradas mejoradas */}
              {route.stops.map((stop) => {
                const x = ((stop.lng + 63.9) * 400);
                const y = ((11.1 - stop.lat) * 600);
                
                return (
                  <g key={`${route.id}-stop-${stop.id}`}>
                    <circle
                      cx={x}
                      cy={y}
                      r={selectedRoute === route.id ? "10" : "7"}
                      fill="white"
                      stroke={route.color}
                      strokeWidth="3"
                      opacity={selectedRoute === null || selectedRoute === route.id ? 1 : 0.5}
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r={selectedRoute === route.id ? "6" : "4"}
                      fill={route.color}
                      opacity={selectedRoute === null || selectedRoute === route.id ? 1 : 0.5}
                    />
                  </g>
                );
              })}
            </g>
          ))}
          
          {/* Puntos de interés */}
          {pointsOfInterest.map((poi, index) => {
            const x = ((poi.lng + 63.9) * 400);
            const y = ((11.1 - poi.lat) * 600);
            let color = '#8B5CF6';
            
            switch(poi.type) {
              case 'historic': color = '#92400E'; break;
              case 'religious': color = '#7C3AED'; break;
              case 'commercial': color = '#059669'; break;
              case 'beach': color = '#0EA5E9'; break;
            }
            
            return (
              <g key={`poi-${index}`}>
                <circle cx={x} cy={y} r="5" fill={color} opacity="0.8"/>
                <circle cx={x} cy={y} r="2" fill="white"/>
              </g>
            );
          })}
          
          {/* Vehículos activos mejorados */}
          {activeVehicles.map((vehicle) => {
            const route = busRoutes.find(r => r.id === vehicle.routeId);
            const x = ((vehicle.lng + 63.9) * 400);
            const y = ((11.1 - vehicle.lat) * 600);
            
            return (
              <g key={vehicle.id} className="cursor-pointer" onClick={() => setSelectedVehicle(vehicle)}>
                <circle
                  cx={x}
                  cy={y}
                  r="16"
                  fill={route?.color || '#3B82F6'}
                  className="vehicle-marker animate-pulse"
                />
                <circle
                  cx={x}
                  cy={y}
                  r="12"
                  fill="white"
                />
                <text
                  x={x}
                  y={y + 4}
                  textAnchor="middle"
                  fill={route?.color || '#3B82F6'}
                  fontSize="12"
                  fontWeight="bold"
                >
                  🚌
                </text>
              </g>
            );
          })}
          
          {/* Ubicación del usuario mejorada */}
          {userLocation && (
            <g>
              <circle
                cx={(userLocation.longitude + 63.9) * 400}
                cy={(11.1 - userLocation.latitude) * 600}
                r="20"
                fill="url(#userLocationGradient)"
                className="animate-pulse"
              />
              <circle
                cx={(userLocation.longitude + 63.9) * 400}
                cy={(11.1 - userLocation.latitude) * 600}
                r="10"
                fill="#EF4444"
              />
              <circle
                cx={(userLocation.longitude + 63.9) * 400}
                cy={(11.1 - userLocation.latitude) * 600}
                r="4"
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

      {/* Información de vehículo seleccionado */}
      {selectedVehicle && (
        <Card className="absolute top-4 left-4 p-4 max-w-xs">
          <h3 className="font-semibold mb-2">Información del Vehículo</h3>
          <p className="text-sm"><strong>ID:</strong> {selectedVehicle.id}</p>
          <p className="text-sm"><strong>Conductor:</strong> {selectedVehicle.driver}</p>
          <p className="text-sm"><strong>Estado:</strong> {selectedVehicle.status}</p>
          <Button size="sm" className="mt-2" onClick={() => setSelectedVehicle(null)}>
            Cerrar
          </Button>
        </Card>
      )}

      {/* Selector de rutas mejorado */}
      <Card className="absolute bottom-24 left-4 right-4 p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Bus size={18} />
          Rutas de Transporte
        </h3>
        <div className="space-y-2">
          <Button
            variant={selectedRoute === null ? 'default' : 'outline'}
            className="w-full justify-start text-sm"
            onClick={() => setSelectedRoute(null)}
          >
            🗺️ Ver todas las rutas
          </Button>
          {busRoutes.map((route) => (
            <Button
              key={route.id}
              variant={selectedRoute === route.id ? 'default' : 'outline'}
              className="w-full justify-start text-sm"
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
