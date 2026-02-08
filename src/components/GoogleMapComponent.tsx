
/// <reference types="google.maps" />

import React, { useState, useRef, useEffect } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { Loader2 } from 'lucide-react';
import MapControls from './map/MapControls';
import RouteSelector from './map/RouteSelector';
import { useMapInitializer } from './map/useMapInitializer';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface MapComponentProps {
  userLocation: LocationData | null;
}

const MapInner: React.FC<MapComponentProps> = ({ userLocation }) => {
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [followUser, setFollowUser] = useState(false);

  const { mapRef } = useMapInitializer({
    userLocation,
    selectedRoute,
    onVehicleSelect: setSelectedVehicle,
    followUser,
  });

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="absolute inset-0" />
      <div className="absolute inset-0 pointer-events-none z-[500]">
        <div className="pointer-events-auto">
          <MapControls
            followUser={followUser}
            onToggleFollow={() => setFollowUser(prev => !prev)}
          />
        </div>
        <div className="pointer-events-auto">
          <RouteSelector
            selectedRoute={selectedRoute}
            onRouteSelect={setSelectedRoute}
          />
        </div>
      </div>
    </div>
  );
};

const GoogleMapComponent: React.FC<MapComponentProps> = ({ userLocation }) => {
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
            <p className="text-destructive">Error al cargar el mapa</p>
          </div>
        );
      case Status.SUCCESS:
        return <MapInner userLocation={userLocation} />;
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
