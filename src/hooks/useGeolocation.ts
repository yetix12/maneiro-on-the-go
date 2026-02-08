
import { useState, useEffect, useCallback } from 'react';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export const useGeolocation = () => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const getCurrentPosition = useCallback(async () => {
    try {
      setIsLoading(true);

      // Use the browser's native Geolocation API for better accuracy
      if (!navigator.geolocation) {
        setError('Geolocalización no soportada en este navegador');
        return;
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      });

      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });
      setError(null);
      setPermissionGranted(true);
    } catch (err: any) {
      console.error('Error getting location:', err);
      if (err.code === 1) {
        setError('Permisos de ubicación denegados');
        setPermissionGranted(false);
      } else if (err.code === 2) {
        setError('Ubicación no disponible');
      } else if (err.code === 3) {
        setError('Tiempo de espera agotado');
      } else {
        setError('Error al obtener la ubicación');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      });
      
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });
      setPermissionGranted(true);
      setError(null);
      return true;
    } catch {
      setPermissionGranted(false);
      setError('Permisos de ubicación denegados');
      return false;
    }
  }, []);

  useEffect(() => {
    getCurrentPosition();
    const interval = setInterval(getCurrentPosition, 30000);
    return () => clearInterval(interval);
  }, [getCurrentPosition]);

  return { location, error, isLoading, getCurrentPosition, requestPermission, permissionGranted };
};
