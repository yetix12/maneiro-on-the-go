
import { useEffect, useRef, useState } from 'react';
import { useMapData, maneiroArea, RouteData, VehicleData } from '@/hooks/useMapData';
import { getAdminPointsOfInterest } from './mapData';

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

  const { routes, vehicles, loading } = useMapData();

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
  };

  const updateMapContent = (mapInstance: google.maps.Map, routesData: RouteData[], vehiclesData: VehicleData[]) => {
    clearMapElements();
    const newMarkers: google.maps.Marker[] = [];
    const newPolylines: google.maps.Polyline[] = [];
    const newPolygons: google.maps.Polygon[] = [];

    if (showMap) {
      // Add routes from database
      routesData.forEach((route) => {
        const shouldShowRoute = selectedRoute === null || selectedRoute === route.id;
        
        if (shouldShowRoute && route.stops.length > 0) {
          // Add stop markers
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
                  ${route.route_identification ? `<p style="margin: 2px 0 0 0; font-size: 11px; color: #666;">${route.route_identification}</p>` : ''}
                </div>
              `,
            });

            marker.addListener('click', () => {
              infoWindow.open(mapInstance, marker);
            });
          });

          // Add route polyline
          if (route.stops.length > 1) {
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
        }
      });

      // Add active vehicles from database
      vehiclesData.forEach((vehicle) => {
        const route = routesData.find(r => r.id === vehicle.routeId);
        const shouldShowVehicle = selectedRoute === null || selectedRoute === vehicle.routeId;
        
        // Only show vehicles with coordinates
        if (shouldShowVehicle && vehicle.lat && vehicle.lng) {
          const marker = new google.maps.Marker({
            position: { lat: vehicle.lat, lng: vehicle.lng },
            map: mapInstance,
            title: `Vehículo ${vehicle.license_plate}`,
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
                <h3 style="margin: 0; color: ${route?.color || '#3B82F6'};">${vehicle.license_plate}</h3>
                <p style="margin: 4px 0; font-size: 12px;"><strong>Modelo:</strong> ${vehicle.model || 'N/A'}</p>
                <p style="margin: 4px 0; font-size: 12px;"><strong>Conductor:</strong> ${vehicle.driver || 'Sin asignar'}</p>
                <p style="margin: 4px 0; font-size: 12px;"><strong>Estado:</strong> ${vehicle.status}</p>
                <p style="margin: 4px 0; font-size: 12px;"><strong>Ruta:</strong> ${route?.name || 'Sin ruta'}</p>
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

    // Add admin points of interest
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

    // Add user location marker
    if (userLocation) {
      const userMarker = new google.maps.Marker({
        position: { lat: userLocation.latitude, lng: userLocation.longitude },
        map: mapInstance,
        title: 'Tu ubicación',
        icon: {
          url: 'data:image/svg+xml;base64,' + btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="18" fill="#4285F4" fill-opacity="0.2" stroke="#4285F4" stroke-width="2"/>
              <circle cx="20" cy="14" r="6" fill="#4285F4"/>
              <path d="M8 32 C8 24 12 20 20 20 C28 20 32 24 32 32" fill="#4285F4"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(40, 40),
          anchor: new google.maps.Point(20, 20),
        },
      });
      newMarkers.push(userMarker);

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
    if (map && isMapInitialized && !loading) {
      updateMapContent(map, routes, vehicles);
    }
  }, [showMap, selectedRoute, userLocation, map, isMapInitialized, routes, vehicles, loading]);

  return { mapRef, map, initializeMap, routes, loading };
};
