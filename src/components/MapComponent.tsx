
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

// Coordenadas específicas de la zona de Maneiro para marcar con línea roja
const maneiroArea = [
  { lat: 11.0200, lng: -63.8800 }, // Punto norte
  { lat: 11.0200, lng: -63.8500 }, // Punto noreste
  { lat: 10.9800, lng: -63.8500 }, // Punto sureste
  { lat: 10.9800, lng: -63.8800 }, // Punto suroeste
  { lat: 11.0200, lng: -63.8800 }  // Cerrar el polígono
];

// Datos de rutas mejorados
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
  }
];

const activeVehicles = [
  { id: 'bus-1', routeId: 'ruta-1', lat: 11.0089, lng: -63.8620, status: 'En ruta', driver: 'Carlos M.' },
  { id: 'bus-2', routeId: 'ruta-1', lat: 11.0167, lng: -63.8465, status: 'En parada', driver: 'María G.' },
  { id: 'bus-3', routeId: 'ruta-2', lat: 11.0241, lng: -63.8376, status: 'En ruta', driver: 'José R.' },
];

const MapComponent: React.FC<MapComponentProps> = ({ userLocation }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

  return (
    <div className="relative h-full">
      {/* Mapa estilo Google Maps de la Isla de Margarita */}
      <div ref={mapRef} className="w-full h-full bg-blue-300 relative overflow-hidden">
        
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 600">
          <defs>
            {/* Gradientes para el océano */}
            <radialGradient id="oceanGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#4FC3F7" />
              <stop offset="50%" stopColor="#29B6F6" />
              <stop offset="100%" stopColor="#0288D1" />
            </radialGradient>
            
            {/* Gradiente para la isla */}
            <linearGradient id="islandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#81C784" />
              <stop offset="30%" stopColor="#66BB6A" />
              <stop offset="70%" stopColor="#4CAF50" />
              <stop offset="100%" stopColor="#388E3C" />
            </linearGradient>
            
            {/* Patrón para playas */}
            <pattern id="beachPattern" x="0" y="0" width="3" height="3" patternUnits="userSpaceOnUse">
              <rect width="3" height="3" fill="#FFF8E1"/>
              <circle cx="1.5" cy="1.5" r="0.3" fill="#FFB74D"/>
            </pattern>
            
            {/* Sombra para la isla */}
            <filter id="islandShadow">
              <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="#2E7D32" floodOpacity="0.3"/>
            </filter>
          </defs>
          
          {/* Fondo del océano Caribe */}
          <rect x="0" y="0" width="800" height="600" fill="url(#oceanGradient)" />
          
          {/* Ondas del mar */}
          <path d="M 0 50 Q 200 40 400 50 T 800 50" stroke="#81D4FA" strokeWidth="2" fill="none" opacity="0.6"/>
          <path d="M 0 550 Q 200 540 400 550 T 800 550" stroke="#81D4FA" strokeWidth="2" fill="none" opacity="0.6"/>
          
          {/* Isla de Margarita - forma más realista */}
          <path 
            d="M 150 200 
               Q 180 120 280 140 
               Q 380 160 480 180 
               Q 580 200 620 260 
               Q 640 320 600 380 
               Q 560 440 480 460 
               Q 400 480 320 470 
               Q 240 460 180 420 
               Q 120 380 100 320 
               Q 80 260 120 220 
               Z"
            fill="url(#islandGradient)"
            stroke="#2E7D32"
            strokeWidth="2"
            filter="url(#islandShadow)"
          />
          
          {/* Zona de Maneiro marcada con línea roja gruesa */}
          <path
            d={maneiroArea.map((point, index) => {
              const x = ((point.lng + 64) * 800 / 1.5);
              const y = ((11.2 - point.lat) * 600 / 0.6);
              return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
            }).join(' ') + ' Z'}
            fill="rgba(244, 67, 54, 0.2)"
            stroke="#F44336"
            strokeWidth="4"
            strokeDasharray="8,4"
          />
          
          {/* Etiqueta para Maneiro */}
          <text x="320" y="280" textAnchor="middle" fill="#D32F2F" fontSize="14" fontWeight="bold">
            MANEIRO
          </text>
          
          {/* Ciudades principales */}
          <circle cx="400" cy="340" r="3" fill="#1976D2"/>
          <text x="410" y="345" fill="#1976D2" fontSize="10" fontWeight="bold">Porlamar</text>
          
          <circle cx="320" cy="260" r="3" fill="#1976D2"/>
          <text x="330" y="255" fill="#1976D2" fontSize="10" fontWeight="bold">Pampatar</text>
          
          <circle cx="520" cy="200" r="3" fill="#1976D2"/>
          <text x="530" y="195" fill="#1976D2" fontSize="10" fontWeight="bold">Juan Griego</text>
          
          {/* Playas principales */}
          <ellipse cx="480" cy="180" rx="25" ry="8" fill="url(#beachPattern)"/>
          <text x="480" y="170" textAnchor="middle" fill="#F57C00" fontSize="8">Playa El Agua</text>
          
          <ellipse cx="420" cy="160" rx="20" ry="6" fill="url(#beachPattern)"/>
          <text x="420" y="150" textAnchor="middle" fill="#F57C00" fontSize="8">Parguito</text>
          
          {/* Carreteras principales */}
          <path d="M 320 260 Q 360 300 400 340" stroke="#757575" strokeWidth="3" fill="none"/>
          <path d="M 320 260 Q 400 230 480 180" stroke="#757575" strokeWidth="3" fill="none"/>
          <path d="M 400 340 Q 460 270 520 200" stroke="#757575" strokeWidth="3" fill="none"/>
          
          {/* Rutas de transporte */}
          {busRoutes.map((route) => (
            <g key={route.id}>
              {route.stops.map((stop, index) => {
                if (index === route.stops.length - 1) return null;
                const nextStop = route.stops[index + 1];
                const x1 = ((stop.lng + 64) * 800 / 1.5);
                const y1 = ((11.2 - stop.lat) * 600 / 0.6);
                const x2 = ((nextStop.lng + 64) * 800 / 1.5);
                const y2 = ((11.2 - nextStop.lat) * 600 / 0.6);
                
                return (
                  <line
                    key={`${route.id}-line-${index}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={selectedRoute === route.id ? route.color : '#64748B'}
                    strokeWidth={selectedRoute === route.id ? "4" : "2"}
                    strokeDasharray="5,3"
                    opacity={selectedRoute === null || selectedRoute === route.id ? 0.8 : 0.4}
                  />
                );
              })}
              
              {/* Paradas */}
              {route.stops.map((stop) => {
                const x = ((stop.lng + 64) * 800 / 1.5);
                const y = ((11.2 - stop.lat) * 600 / 0.6);
                
                return (
                  <g key={`${route.id}-stop-${stop.id}`}>
                    <circle
                      cx={x}
                      cy={y}
                      r={selectedRoute === route.id ? "8" : "5"}
                      fill="white"
                      stroke={route.color}
                      strokeWidth="2"
                      opacity={selectedRoute === null || selectedRoute === route.id ? 1 : 0.5}
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r={selectedRoute === route.id ? "4" : "2"}
                      fill={route.color}
                      opacity={selectedRoute === null || selectedRoute === route.id ? 1 : 0.5}
                    />
                  </g>
                );
              })}
            </g>
          ))}
          
          {/* Vehículos activos */}
          {activeVehicles.map((vehicle) => {
            const route = busRoutes.find(r => r.id === vehicle.routeId);
            const x = ((vehicle.lng + 64) * 800 / 1.5);
            const y = ((11.2 - vehicle.lat) * 600 / 0.6);
            
            return (
              <g key={vehicle.id} className="cursor-pointer" onClick={() => setSelectedVehicle(vehicle)}>
                <circle
                  cx={x}
                  cy={y}
                  r="12"
                  fill={route?.color || '#3B82F6'}
                  className="animate-pulse"
                />
                <circle cx={x} cy={y} r="8" fill="white" />
                <text x={x} y={y + 3} textAnchor="middle" fill={route?.color || '#3B82F6'} fontSize="10">🚌</text>
              </g>
            );
          })}
          
          {/* Ubicación del usuario */}
          {userLocation && (
            <g>
              <circle
                cx={(userLocation.longitude + 64) * 800 / 1.5}
                cy={(11.2 - userLocation.latitude) * 600 / 0.6}
                r="15"
                fill="rgba(244, 67, 54, 0.3)"
                className="animate-pulse"
              />
              <circle
                cx={(userLocation.longitude + 64) * 800 / 1.5}
                cy={(11.2 - userLocation.latitude) * 600 / 0.6}
                r="8"
                fill="#F44336"
              />
              <circle
                cx={(userLocation.longitude + 64) * 800 / 1.5}
                cy={(11.2 - userLocation.latitude) * 600 / 0.6}
                r="3"
                fill="white"
              />
            </g>
          )}
        </svg>
      </div>

      {/* Controles del mapa */}
      <div className="absolute top-4 right-4 space-y-2">
        <Button size="sm" className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg">
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

      {/* Selector de rutas */}
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
