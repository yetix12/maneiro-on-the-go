
import React from 'react';
import { Button } from '@/components/ui/button';
import { Navigation, Locate, LocateOff } from 'lucide-react';

interface MapControlsProps {
  followUser: boolean;
  onToggleFollow: () => void;
}

const MapControls: React.FC<MapControlsProps> = ({ followUser, onToggleFollow }) => {
  return (
    <div className="absolute top-4 right-4 space-y-2 z-30">
      <Button 
        size="sm" 
        className={`shadow-lg ${
          followUser 
            ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
            : 'bg-card text-foreground hover:bg-secondary'
        }`}
        onClick={onToggleFollow}
        title={followUser ? 'Seguimiento GPS activo - toca para desactivar' : 'Seguimiento GPS inactivo - toca para activar'}
      >
        {followUser ? <Locate size={16} /> : <LocateOff size={16} />}
        <span className="ml-1 text-xs">
          {followUser ? 'GPS Fijo' : 'Libre'}
        </span>
      </Button>
    </div>
  );
};

export default MapControls;
