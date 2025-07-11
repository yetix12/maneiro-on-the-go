
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Download, AlertCircle, Github, Terminal } from 'lucide-react';

interface APKInstructionsDialogProps {
  disabled?: boolean;
}

const APKInstructionsDialog: React.FC<APKInstructionsDialogProps> = ({ disabled = false }) => {
  const [showAPKInstructions, setShowAPKInstructions] = useState(false);

  return (
    <Dialog open={showAPKInstructions} onOpenChange={setShowAPKInstructions}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full"
          disabled={disabled}
        >
          <Download size={16} className="mr-2" />
          Generar APK
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download size={20} />
            Instrucciones para Generar APK
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="bg-green-50 p-4 rounded-md border border-green-200">
            <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
              <AlertCircle size={16} />
              ¡Buenas noticias!
            </div>
            <p className="text-green-600">
              Tu proyecto ya tiene Supabase conectado y Capacitor configurado. Solo necesitas seguir estos pasos:
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold flex items-center gap-2 mb-2">
                <Github size={16} />
                1. Exportar a GitHub
              </h3>
              <p className="text-gray-600 mb-2">
                Usa el botón "Export to Github" en la parte superior derecha para transferir tu proyecto a GitHub
              </p>
            </div>

            <div>
              <h3 className="font-semibold flex items-center gap-2 mb-2">
                <Terminal size={16} />
                2. Comandos en tu terminal local
              </h3>
              <div className="bg-gray-900 text-green-400 p-3 rounded-md font-mono text-xs space-y-1">
                <div># Clonar tu repositorio</div>
                <div>git clone [tu-repo-url]</div>
                <div>cd [nombre-proyecto]</div>
                <br />
                <div># Instalar dependencias</div>
                <div>npm install</div>
                <br />
                <div># Agregar plataforma Android</div>
                <div>npx cap add android</div>
                <br />
                <div># Construir la aplicación</div>
                <div>npm run build</div>
                <br />
                <div># Sincronizar con Capacitor</div>
                <div>npx cap sync</div>
                <br />
                <div># Abrir en Android Studio</div>
                <div>npx cap open android</div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">3. Generar APK en Android Studio</h3>
              <ul className="text-gray-600 space-y-1 ml-4 list-disc">
                <li>Ve a Build → Build Bundle(s) / APK(s) → Build APK(s)</li>
                <li>El APK se generará en: android/app/build/outputs/apk/debug/</li>
              </ul>
            </div>

            <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
              <h4 className="font-medium text-blue-700 mb-2">Requisitos:</h4>
              <ul className="text-blue-600 space-y-1 ml-4 list-disc text-xs">
                <li>Android Studio instalado</li>
                <li>Java JDK 11 o superior</li>
                <li>Android SDK configurado</li>
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default APKInstructionsDialog;
