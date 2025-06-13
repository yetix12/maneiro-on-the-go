
import { useState, useEffect } from 'react';
import { Geolocation } from '@capacitor/geolocation';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export const useGeolocation = () => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getCurrentPosition();
    // Actualizar posición cada 30 segundos
    const interval = setInterval(getCurrentPosition, 30000);
    return () => clearInterval(interval);
  }, []);

  const getCurrentPosition = async () => {
    try {
      setIsLoading(true);
      const permissions = await Geolocation.requestPermissions();
      
      if (permissions.location === 'granted') {
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
        });
        
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setError(null);
      } else {
        setError('Permisos de ubicación denegados');
      }
    } catch (err) {
      console.error('Error getting location:', err);
      setError('Error al obtener la ubicación');
      // Fallback para web development - ubicación aproximada de Maneiro
      setLocation({
        latitude: 11.0047,
        longitude: -63.8697,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { location, error, isLoading, getCurrentPosition };
};
