
import React from 'react';
import { Button } from '@/components/ui/button';
import { Navigation, Map, MapOff, Eye, EyeOff } from 'lucide-react';

interface MapControlsProps {
  showMap: boolean;
  onToggleMap: () => void;
}

const MapControls: React.FC<MapControlsProps> = ({ showMap, onToggleMap }) => {
  return (
    <div className="absolute top-4 right-4 space-y-2">
      <Button 
        size="sm" 
        className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg"
        onClick={onToggleMap}
      >
        {showMap ? <EyeOff size={16} /> : <Eye size={16} />}
        <span className="ml-1 text-xs">
          {showMap ? 'Ocultar Mapa' : 'Mostrar Mapa'}
        </span>
      </Button>
      <Button size="sm" className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg">
        <Navigation size={16} />
      </Button>
    </div>
  );
};

export default MapControls;
