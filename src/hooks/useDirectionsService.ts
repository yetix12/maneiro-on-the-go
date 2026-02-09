import { useCallback, useRef } from 'react';
import { StopData, WaypointData } from './useMapData';

interface DirectionsResult {
  path: google.maps.LatLng[];
  routeId: string;
}

export const useDirectionsService = () => {
  const cacheRef = useRef<Map<string, google.maps.LatLng[]>>(new Map());
  const serviceRef = useRef<google.maps.DirectionsService | null>(null);

  const getService = useCallback(() => {
    if (!serviceRef.current) {
      serviceRef.current = new google.maps.DirectionsService();
    }
    return serviceRef.current;
  }, []);

  const getCacheKey = (routeId: string, stops: StopData[], waypoints: WaypointData[]) => {
    const stopsKey = stops.map(s => `${s.lat},${s.lng}`).join('|');
    const wpKey = waypoints.map(w => `${w.lat},${w.lng}`).join('|');
    return `${routeId}:${stopsKey}:${wpKey}`;
  };

  const getDirectionsPath = useCallback(async (
    routeId: string,
    stops: StopData[],
    waypoints: WaypointData[]
  ): Promise<google.maps.LatLng[]> => {
    if (stops.length < 2) return [];

    const cacheKey = getCacheKey(routeId, stops, waypoints);
    const cached = cacheRef.current.get(cacheKey);
    if (cached) return cached;

    // If there are custom waypoints, use them as the path directly (manual mode)
    if (waypoints.length > 0) {
      const manualPath = waypoints
        .sort((a, b) => a.waypoint_order - b.waypoint_order)
        .map(wp => new google.maps.LatLng(wp.lat, wp.lng));
      cacheRef.current.set(cacheKey, manualPath);
      return manualPath;
    }

    // Otherwise use Google Directions API
    const service = getService();
    const origin = stops[0];
    const destination = stops[stops.length - 1];
    
    // Use intermediate stops as waypoints for the Directions API
    const intermediateStops = stops.slice(1, -1).map(stop => ({
      location: new google.maps.LatLng(stop.lat, stop.lng),
      stopover: true
    }));

    try {
      const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
        service.route(
          {
            origin: new google.maps.LatLng(origin.lat, origin.lng),
            destination: new google.maps.LatLng(destination.lat, destination.lng),
            waypoints: intermediateStops.slice(0, 23), // Google limits to 23 waypoints
            travelMode: google.maps.TravelMode.DRIVING,
            optimizeWaypoints: false,
          },
          (response, status) => {
            if (status === google.maps.DirectionsStatus.OK && response) {
              resolve(response);
            } else {
              reject(new Error(`Directions API failed: ${status}`));
            }
          }
        );
      });

      // Extract the full path from all route legs
      const path: google.maps.LatLng[] = [];
      result.routes[0].legs.forEach(leg => {
        leg.steps.forEach(step => {
          step.path.forEach(point => {
            path.push(point);
          });
        });
      });

      cacheRef.current.set(cacheKey, path);
      return path;
    } catch (error) {
      console.warn(`Directions API failed for route ${routeId}, falling back to straight lines:`, error);
      // Fallback to straight lines between stops
      const fallbackPath = stops.map(s => new google.maps.LatLng(s.lat, s.lng));
      cacheRef.current.set(cacheKey, fallbackPath);
      return fallbackPath;
    }
  }, [getService]);

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  return { getDirectionsPath, clearCache };
};
