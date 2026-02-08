
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation } from 'lucide-react';

interface GpsPermissionDialogProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

const GpsPermissionDialog: React.FC<GpsPermissionDialogProps> = ({ open, onAccept, onDecline }) => {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onDecline()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <MapPin className="text-primary" size={24} />
            Activar ubicación GPS
          </DialogTitle>
          <DialogDescription className="text-base">
            Para mostrarte las rutas y vehículos cercanos necesitamos acceder a tu ubicación.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 py-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary">
            <Navigation className="text-primary mt-0.5 flex-shrink-0" size={20} />
            <div>
              <p className="font-medium text-sm">¿Para qué usamos tu ubicación?</p>
              <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                <li>• Ver tu posición en el mapa</li>
                <li>• Encontrar las paradas más cercanas</li>
                <li>• Seguir los vehículos en tiempo real</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onDecline} className="flex-1">
            Ahora no
          </Button>
          <Button onClick={onAccept} className="flex-1">
            Activar GPS
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GpsPermissionDialog;
