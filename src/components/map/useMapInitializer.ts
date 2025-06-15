
import { useEffect, useRef, useState } from 'react';
import { busRoutes, activeVehicles, maneiroArea } from './mapData';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface UseMapInitializerProps {
  userLocation: LocationData | null;
  selectedRoute: string | null;
  onVehicleSelect: (vehicle: any) => void;
}

export const useMapInitializer = ({ userLocation, selectedRoute, onVehicleSelect }: UseMapInitializerProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
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
        onVehicleSelect(vehicle);
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

  return { mapRef, map, initializeMap };
};
