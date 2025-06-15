
import React from 'react';
import { Button } from '@/components/ui/button';
import { Navigation } from 'lucide-react';

const MapControls: React.FC = () => {
  return (
    <div className="absolute top-4 right-4 space-y-2">
      <Button size="sm" className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg">
        <Navigation size={16} />
      </Button>
    </div>
  );
};

export default MapControls;
