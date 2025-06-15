/// <reference types="google.maps" />

import React, { useEffect, useRef, useState } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navigation, MapPin, Bus, Loader2 } from 'lucide-react';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface MapComponentProps {
  userLocation: LocationData | null;
}

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

// Coordenadas del área de Maneiro
const maneiroArea = [
  { lat: 11.0200, lng: -63.8800 },
  { lat: 11.0200, lng: -63.8500 },
  { lat: 10.9800, lng: -63.8500 },
  { lat: 10.9800, lng: -63.8800 },
  { lat: 11.0200, lng: -63.8800 }
];

const GoogleMapComponent: React.FC<MapComponentProps> = ({ userLocation }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [isMapInitialized, setIsMapInitialized] = useState(false);

  const initializeMap = () => {
    if (!mapRef.current || isMapInitialized) return;

    const mapInstance = new google.maps.Map(mapRef.current, {
      center: { lat: 11.0047, lng: -63.8697 },
      zoom: 13,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      styles: [
        {
          featureType: 'water',
          elementType: 'geometry',
          stylers: [{ color: '#4FC3F7' }]
        },
        {
          featureType: 'landscape',
          elementType: 'geometry',
          stylers: [{ color: '#81C784' }]
        }
      ]
    });

    setMap(mapInstance);
    setIsMapInitialized(true);

    // Agregar polígono para destacar la zona de Maneiro
    const maneiroPolygon = new google.maps.Polygon({
      paths: maneiroArea,
      strokeColor: '#F44336',
      strokeOpacity: 0.8,
      strokeWeight: 3,
      fillColor: '#F44336',
      fillOpacity: 0.2,
    });
    maneiroPolygon.setMap(mapInstance);

    // Agregar marcador para Maneiro
    const maneiroMarker = new google.maps.Marker({
      position: { lat: 11.0000, lng: -63.8650 },
      map: mapInstance,
      title: 'Maneiro',
      icon: {
        url: 'data:image/svg+xml;base64,' + btoa(`
          <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
            <circle cx="15" cy="15" r="12" fill="#F44336" stroke="white" stroke-width="2"/>
            <text x="15" y="19" text-anchor="middle" fill="white" font-size="8" font-weight="bold">M</text>
          </svg>
        `),
        scaledSize: new google.maps.Size(30, 30),
      },
    });

    // Agregar paradas de autobús
    busRoutes.forEach((route) => {
      route.stops.forEach((stop) => {
        const marker = new google.maps.Marker({
          position: { lat: stop.lat, lng: stop.lng },
          map: mapInstance,
          title: stop.name,
          icon: {
            url: 'data:image/svg+xml;base64,' + btoa(`
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="8" fill="white" stroke="${route.color}" stroke-width="2"/>
                <circle cx="10" cy="10" r="4" fill="${route.color}"/>
              </svg>
            `),
            scaledSize: new google.maps.Size(20, 20),
          },
        });

        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px;">
              <h3 style="margin: 0; color: ${route.color};">${stop.name}</h3>
              <p style="margin: 4px 0 0 0; font-size: 12px;">Ruta: ${route.name}</p>
            </div>
          `,
        });

        marker.addListener('click', () => {
          infoWindow.open(mapInstance, marker);
        });
      });

      // Agregar líneas de ruta
      const routePath = new google.maps.Polyline({
        path: route.stops.map(stop => ({ lat: stop.lat, lng: stop.lng })),
        geodesic: true,
        strokeColor: route.color,
        strokeOpacity: selectedRoute === null || selectedRoute === route.id ? 0.8 : 0.3,
        strokeWeight: selectedRoute === route.id ? 4 : 2,
      });
      routePath.setMap(mapInstance);
    });

    // Agregar vehículos activos
    activeVehicles.forEach((vehicle) => {
      const route = busRoutes.find(r => r.id === vehicle.routeId);
      const marker = new google.maps.Marker({
        position: { lat: vehicle.lat, lng: vehicle.lng },
        map: mapInstance,
        title: `Vehículo ${vehicle.id}`,
        icon: {
          url: 'data:image/svg+xml;base64,' + btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
              <circle cx="15" cy="15" r="12" fill="${route?.color || '#3B82F6'}" stroke="white" stroke-width="2"/>
              <text x="15" y="19" text-anchor="middle" fill="white" font-size="10" font-weight="bold">BUS</text>
            </svg>
          `),
          scaledSize: new google.maps.Size(30, 30),
        },
        animation: google.maps.Animation.BOUNCE,
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <h3 style="margin: 0; color: ${route?.color || '#3B82F6'};">Vehículo ${vehicle.id}</h3>
            <p style="margin: 4px 0; font-size: 12px;"><strong>Conductor:</strong> ${vehicle.driver}</p>
            <p style="margin: 4px 0; font-size: 12px;"><strong>Estado:</strong> ${vehicle.status}</p>
            <p style="margin: 4px 0; font-size: 12px;"><strong>Ruta:</strong> ${route?.name}</p>
          </div>
        `,
      });

      marker.addListener('click', () => {
        setSelectedVehicle(vehicle);
        infoWindow.open(mapInstance, marker);
      });
    });

    // Agregar ubicación del usuario si está disponible
    if (userLocation) {
      const userMarker = new google.maps.Marker({
        position: { lat: userLocation.latitude, lng: userLocation.longitude },
        map: mapInstance,
        title: 'Tu ubicación',
        icon: {
          url: 'data:image/svg+xml;base64,' + btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="8" fill="#F44336" stroke="white" stroke-width="2"/>
              <circle cx="12" cy="12" r="3" fill="white"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(24, 24),
        },
        animation: google.maps.Animation.BOUNCE,
      });
    }
  };

  useEffect(() => {
    if (mapRef.current && !isMapInitialized) {
      initializeMap();
    }
  }, [mapRef.current, isMapInitialized]);

  const render = (status: Status) => {
    switch (status) {
      case Status.LOADING:
        return (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin" size={32} />
            <span className="ml-2">Cargando mapa...</span>
          </div>
        );
      case Status.FAILURE:
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-red-500">Error al cargar el mapa</p>
          </div>
        );
      case Status.SUCCESS:
        return (
          <div className="relative h-full">
            <div ref={mapRef} className="w-full h-full" />
            
            {/* Controles del mapa */}
            <div className="absolute top-4 right-4 space-y-2">
              <Button size="sm" className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg">
                <Navigation size={16} />
              </Button>
            </div>

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
                  </div>
                ))}
              </div>
            </Card>
          </div>
        );
    }
  };

  return (
    <Wrapper 
      apiKey="AIzaSyDGan9WbWLJW1guKw1T_uInSql4bZrGP9Y" 
      render={render}
    />
  );
};

export default GoogleMapComponent;
