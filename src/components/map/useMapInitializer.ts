
import { useEffect, useRef, useState } from 'react';
import { busRoutes, activeVehicles, maneiroArea, getAdminPointsOfInterest } from './mapData';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface UseMapInitializerProps {
  userLocation: LocationData | null;
  selectedRoute: string | null;
  onVehicleSelect: (vehicle: any) => void;
  showMap: boolean;
}

export const useMapInitializer = ({ userLocation, selectedRoute, onVehicleSelect, showMap }: UseMapInitializerProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [polylines, setPolylines] = useState<google.maps.Polyline[]>([]);
  const [polygons, setPolygons] = useState<google.maps.Polygon[]>([]);

  const clearMapElements = () => {
    markers.forEach(marker => marker.setMap(null));
    polylines.forEach(polyline => polyline.setMap(null));
    polygons.forEach(polygon => polygon.setMap(null));
    setMarkers([]);
    setPolylines([]);
    setPolygons([]);
  };

  const initializeMap = () => {
    if (!mapRef.current || isMapInitialized) return;

    const mapInstance = new google.maps.Map(mapRef.current, {
      center: { lat: 11.0047, lng: -63.8697 },
      zoom: 13,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      styles: showMap ? [
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
      ] : [
        {
          featureType: 'all',
          elementType: 'all',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    setMap(mapInstance);
    setIsMapInitialized(true);
    updateMapContent(mapInstance);
  };

  const updateMapContent = (mapInstance: google.maps.Map) => {
    clearMapElements();
    const newMarkers: google.maps.Marker[] = [];
    const newPolylines: google.maps.Polyline[] = [];
    const newPolygons: google.maps.Polygon[] = [];

    if (showMap) {
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
      newPolygons.push(maneiroPolygon);

      // Agregar marcador para Maneiro
      const maneiroMarker = new google.maps.Marker({
        position: { lat: 11.0050, lng: -63.8650 },
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
      newMarkers.push(maneiroMarker);

      // Agregar rutas solo si no hay ruta específica seleccionada o coincide
      busRoutes.forEach((route) => {
        const shouldShowRoute = selectedRoute === null || selectedRoute === route.id;
        
        if (shouldShowRoute) {
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
            newMarkers.push(marker);

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
          newPolylines.push(routePath);
        }
      });

      // Agregar vehículos activos
      activeVehicles.forEach((vehicle) => {
        const route = busRoutes.find(r => r.id === vehicle.routeId);
        const shouldShowVehicle = selectedRoute === null || selectedRoute === vehicle.routeId;
        
        if (shouldShowVehicle) {
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
          newMarkers.push(marker);

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
        }
      });
    }

    // Agregar puntos de interés del admin (siempre visibles)
    const adminPoints = getAdminPointsOfInterest();
    adminPoints.forEach((point: any) => {
      const marker = new google.maps.Marker({
        position: { lat: parseFloat(point.lat), lng: parseFloat(point.lng) },
        map: mapInstance,
        title: point.name,
        icon: {
          url: 'data:image/svg+xml;base64,' + btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25">
              <circle cx="12.5" cy="12.5" r="10" fill="#FF6B35" stroke="white" stroke-width="2"/>
              <text x="12.5" y="17" text-anchor="middle" fill="white" font-size="8" font-weight="bold">POI</text>
            </svg>
          `),
          scaledSize: new google.maps.Size(25, 25),
        },
      });
      newMarkers.push(marker);

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <h3 style="margin: 0; color: #FF6B35;">${point.name}</h3>
            <p style="margin: 4px 0; font-size: 12px;"><strong>Categoría:</strong> ${point.category}</p>
            <p style="margin: 4px 0; font-size: 12px;">${point.description}</p>
          </div>
        `,
      });

      marker.addListener('click', () => {
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
              <circle cx="12" cy="12" r="8" fill="#00E676" stroke="white" stroke-width="2"/>
              <circle cx="12" cy="12" r="3" fill="white"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(24, 24),
        },
        animation: google.maps.Animation.BOUNCE,
      });
      newMarkers.push(userMarker);

      // Centrar mapa en la ubicación del usuario
      mapInstance.panTo({ lat: userLocation.latitude, lng: userLocation.longitude });
    }

    setMarkers(newMarkers);
    setPolylines(newPolylines);
    setPolygons(newPolygons);
  };

  useEffect(() => {
    if (mapRef.current && !isMapInitialized) {
      initializeMap();
    }
  }, [mapRef.current, isMapInitialized]);

  useEffect(() => {
    if (map && isMapInitialized) {
      updateMapContent(map);
    }
  }, [showMap, selectedRoute, userLocation, map, isMapInitialized]);

  return { mapRef, map, initializeMap };
};
