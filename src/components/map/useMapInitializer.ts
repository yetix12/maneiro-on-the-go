
import { useEffect, useRef, useState, useCallback } from 'react';
import { useMapData, RouteData, VehicleData } from '@/hooks/useMapData';
import { useDirectionsService } from '@/hooks/useDirectionsService';
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
  followUser: boolean;
}

export const useMapInitializer = ({ userLocation, selectedRoute, onVehicleSelect, followUser }: UseMapInitializerProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const lastPanRef = useRef<{ lat: number; lng: number } | null>(null);

  const { routes, vehicles, loading, refetch } = useMapData();
  const { getDirectionsPath } = useDirectionsService();

  // Auto-refresh every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 8000);
    return () => clearInterval(interval);
  }, [refetch]);

  const clearMapElements = useCallback(() => {
    markersRef.current.forEach(marker => marker.setMap(null));
    polylinesRef.current.forEach(polyline => polyline.setMap(null));
    markersRef.current = [];
    polylinesRef.current = [];
  }, []);

  const initializeMap = useCallback(() => {
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

    mapInstanceRef.current = mapInstance;
    setIsMapInitialized(true);
  }, [isMapInitialized]);

  // Snap a point to the nearest segment on a polyline path, returns snapped position + rotation
  const snapToPolyline = useCallback((
    vehicleLat: number, vehicleLng: number, 
    path: google.maps.LatLng[]
  ): { lat: number; lng: number; rotation: number } | null => {
    if (path.length < 2) return null;

    let bestDist = Infinity;
    let bestPoint = { lat: vehicleLat, lng: vehicleLng };
    let bestRotation = 0;
    const SNAP_THRESHOLD = 0.002; // ~200m in degrees, max distance to snap

    for (let i = 0; i < path.length - 1; i++) {
      const aLat = path[i].lat(), aLng = path[i].lng();
      const bLat = path[i + 1].lat(), bLng = path[i + 1].lng();

      // Project point onto segment
      const dx = bLng - aLng, dy = bLat - aLat;
      const lenSq = dx * dx + dy * dy;
      if (lenSq === 0) continue;

      let t = ((vehicleLng - aLng) * dx + (vehicleLat - aLat) * dy) / lenSq;
      t = Math.max(0, Math.min(1, t));

      const projLat = aLat + t * dy;
      const projLng = aLng + t * dx;
      const dist = Math.sqrt(Math.pow(projLat - vehicleLat, 2) + Math.pow(projLng - vehicleLng, 2));

      if (dist < bestDist) {
        bestDist = dist;
        bestPoint = { lat: projLat, lng: projLng };
        bestRotation = Math.atan2(dx, dy) * (180 / Math.PI);
      }
    }

    if (bestDist > SNAP_THRESHOLD) return null;
    return { ...bestPoint, rotation: bestRotation };
  }, []);

  const updateMapContent = useCallback(async (mapInstance: google.maps.Map, routesData: RouteData[], vehiclesData: VehicleData[]) => {
    clearMapElements();
    const newMarkers: google.maps.Marker[] = [];
    const newPolylines: google.maps.Polyline[] = [];
    const routePaths: Record<string, google.maps.LatLng[]> = {};

    // Add routes from database
    for (const route of routesData) {
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

        // Add route polyline - use Directions API or waypoints
        if (route.stops.length > 1) {
          try {
            const path = await getDirectionsPath(route.id, route.stops, route.waypoints);
            
            if (path.length > 0) {
              routePaths[route.id] = path;
              const routePath = new google.maps.Polyline({
                path: path,
                geodesic: true,
                strokeColor: route.color,
                strokeOpacity: selectedRoute === null || selectedRoute === route.id ? 0.8 : 0.3,
                strokeWeight: selectedRoute === route.id ? 4 : 2,
              });
              routePath.setMap(mapInstance);
              newPolylines.push(routePath);
            }
          } catch (error) {
            // Fallback to straight lines
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
      }
    }

    // Add active vehicles from database
    vehiclesData.forEach((vehicle) => {
      const route = routesData.find(r => r.id === vehicle.routeId);
      const shouldShowVehicle = selectedRoute === null || selectedRoute === vehicle.routeId;
      
      if (shouldShowVehicle && vehicle.lat && vehicle.lng) {
        const routeColor = route?.color || '#3B82F6';
        
        // Try to snap vehicle to its route polyline
        let vehiclePos = { lat: vehicle.lat, lng: vehicle.lng };
        let rotation = 0;

        const routePath = vehicle.routeId ? routePaths[vehicle.routeId] : null;
        if (routePath && routePath.length >= 2) {
          const snapped = snapToPolyline(vehicle.lat, vehicle.lng, routePath);
          if (snapped) {
            vehiclePos = { lat: snapped.lat, lng: snapped.lng };
            rotation = snapped.rotation;
          }
        }

        // Fallback rotation from stops if no snap
        if (rotation === 0 && route && route.stops.length > 1) {
          let minDist = Infinity;
          let nearestIdx = 0;
          route.stops.forEach((stop, idx) => {
            const dist = Math.sqrt(
              Math.pow(stop.lat - vehicle.lat!, 2) + Math.pow(stop.lng - vehicle.lng!, 2)
            );
            if (dist < minDist) {
              minDist = dist;
              nearestIdx = idx;
            }
          });
          const nextIdx = Math.min(nearestIdx + 1, route.stops.length - 1);
          if (nextIdx !== nearestIdx) {
            const dx = route.stops[nextIdx].lng - vehicle.lng!;
            const dy = route.stops[nextIdx].lat - vehicle.lat!;
            rotation = Math.atan2(dx, dy) * (180 / Math.PI);
          }
        }
        
        const busSvg = `
          <svg xmlns="http://www.w3.org/2000/svg" width="44" height="56" viewBox="0 0 44 56">
            <polygon points="22,0 30,14 14,14" fill="${routeColor}" stroke="#000" stroke-width="1.5"/>
            <line x1="22" y1="52" x2="22" y2="44" stroke="${routeColor}" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
            <circle cx="22" cy="54" r="2" fill="${routeColor}" opacity="0.3"/>
            <rect x="10" y="14" width="24" height="30" rx="5" ry="5" fill="${routeColor}" stroke="#000" stroke-width="2"/>
            <rect x="14" y="18" width="16" height="8" rx="2" ry="2" fill="white" opacity="0.9"/>
            <rect x="14" y="30" width="6" height="5" rx="1" fill="white" opacity="0.7"/>
            <rect x="24" y="30" width="6" height="5" rx="1" fill="white" opacity="0.7"/>
            <circle cx="14" cy="42" r="2.5" fill="#333" stroke="#000" stroke-width="1"/>
            <circle cx="30" cy="42" r="2.5" fill="#333" stroke="#000" stroke-width="1"/>
          </svg>
        `;

        const marker = new google.maps.Marker({
          position: vehiclePos,
          map: mapInstance,
          title: `Vehículo ${vehicle.license_plate}`,
          icon: {
            url: 'data:image/svg+xml;base64,' + btoa(busSvg),
            scaledSize: new google.maps.Size(44, 56),
            anchor: new google.maps.Point(22, 28),
          },
        });
        newMarkers.push(marker);

        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px;">
              <h3 style="margin: 0; color: ${routeColor};">${vehicle.license_plate}</h3>
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

      // Only pan to user location if follow mode is active
      if (followUser) {
        const newPos = { lat: userLocation.latitude, lng: userLocation.longitude };
        if (!lastPanRef.current || lastPanRef.current.lat !== newPos.lat || lastPanRef.current.lng !== newPos.lng) {
          mapInstance.panTo(newPos);
          lastPanRef.current = newPos;
        }
      }
    }

    markersRef.current = newMarkers;
    polylinesRef.current = newPolylines;
  }, [clearMapElements, snapToPolyline, selectedRoute, userLocation, followUser, onVehicleSelect, getDirectionsPath]);

  useEffect(() => {
    if (mapRef.current && !isMapInitialized) {
      initializeMap();
    }
  }, [mapRef.current, isMapInitialized, initializeMap]);

  useEffect(() => {
    if (mapInstanceRef.current && isMapInitialized && !loading) {
      updateMapContent(mapInstanceRef.current, routes, vehicles);
    }
  }, [selectedRoute, userLocation, isMapInitialized, routes, vehicles, loading, updateMapContent]);

  return { mapRef, map: mapInstanceRef.current, initializeMap, routes, loading };
};
