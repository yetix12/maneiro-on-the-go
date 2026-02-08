
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { MapPin, Route, Bus, Info, X, ChevronRight, ChevronLeft } from 'lucide-react';

interface OnboardingDialogProps {
  open: boolean;
  onClose: (dontShowAgain: boolean) => void;
}

const steps = [
  {
    icon: MapPin,
    title: '🗺️ Mapa en Tiempo Real',
    description: 'Visualiza tu ubicación y la de los vehículos de transporte en tiempo real. Puedes activar o desactivar el seguimiento GPS con el botón en la esquina superior derecha.',
    example: 'Ejemplo: Abre el mapa y verás un ícono azul con tu ubicación. Los autobuses activos aparecerán con el color de su ruta.',
  },
  {
    icon: Route,
    title: '🚏 Rutas y Paradas',
    description: 'Explora todas las rutas disponibles con sus paradas. Toca cualquier parada para ver su información detallada incluyendo fotos y coordenadas.',
    example: 'Ejemplo: Ve a "Rutas", selecciona la Ruta 25A y toca una parada para ver su ubicación exacta y fotos.',
  },
  {
    icon: Bus,
    title: '🚌 Seguimiento de Vehículos',
    description: 'En la pestaña "Vehículos" puedes ver todos los autobuses activos, su estado actual y los métodos de pago del conductor.',
    example: 'Ejemplo: Busca un vehículo activo para ver qué ruta cubre y si el conductor acepta Pago Móvil.',
  },
  {
    icon: Info,
    title: '📋 Información por Ruta',
    description: 'En "Información" encontrarás carpetas organizadas por ruta con todos los detalles: paradas, tarifas, frecuencia y fotos.',
    example: 'Ejemplo: Toca la carpeta de una ruta para ver el listado completo de paradas con toda su información.',
  },
];

const OnboardingDialog: React.FC<OnboardingDialogProps> = ({ open, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const step = steps[currentStep];
  const Icon = step.icon;
  const isLast = currentStep === steps.length - 1;
  const isFirst = currentStep === 0;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose(dontShowAgain)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg">Bienvenido a Transporte Maneiro</DialogTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onClose(dontShowAgain)}>
              <X size={18} />
            </Button>
          </div>
        </DialogHeader>

        <div className="py-4">
          {/* Step indicator */}
          <div className="flex justify-center gap-2 mb-6">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all ${
                  idx === currentStep ? 'w-8 bg-primary' : 'w-2 bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Step content */}
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Icon size={32} className="text-primary" />
            </div>
            <h3 className="text-xl font-bold">{step.title}</h3>
            <p className="text-muted-foreground">{step.description}</p>
            <div className="bg-secondary rounded-lg p-3 text-sm text-left">
              <p className="text-muted-foreground italic">{step.example}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="dontShow"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked === true)}
            />
            <label htmlFor="dontShow" className="text-sm text-muted-foreground cursor-pointer">
              No volver a mostrar
            </label>
          </div>

          <div className="flex gap-2">
            {!isFirst && (
              <Button variant="outline" size="sm" onClick={() => setCurrentStep(currentStep - 1)}>
                <ChevronLeft size={16} />
                Anterior
              </Button>
            )}
            {isLast ? (
              <Button size="sm" onClick={() => onClose(dontShowAgain)}>
                ¡Empezar!
              </Button>
            ) : (
              <Button size="sm" onClick={() => setCurrentStep(currentStep + 1)}>
                Siguiente
                <ChevronRight size={16} />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingDialog;
