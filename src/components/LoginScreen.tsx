
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Bus, User, Lock, AlertCircle, UserPlus, Download, Mail, Github, Terminal } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const LoginScreen: React.FC = () => {
  const { signIn, signUp, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [showAPKInstructions, setShowAPKInstructions] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  
  // Estados para el registro
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningIn(true);
    setError('');

    const { error } = await signIn(email, password);
    
    if (error) {
      setError('Usuario o contraseña incorrectos');
    }
    
    setIsSigningIn(false);
  };

  const handleRegister = async () => {
    setError('');
    
    if (registerData.password !== registerData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (!registerData.email || !registerData.password || !registerData.name || !registerData.username) {
      setError('Todos los campos son obligatorios');
      return;
    }

    const { error } = await signUp(registerData.email, registerData.password, {
      username: registerData.username,
      full_name: registerData.name,
      user_type: 'passenger'
    });
    
    if (error) {
      setError(error.message || 'Error al registrarse');
    } else {
      setShowRegister(false);
      setRegisterData({
        name: '',
        email: '',
        username: '',
        password: '',
        confirmPassword: ''
      });
    }
  };

  const handleDownloadAPK = () => {
    setShowAPKInstructions(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-yellow-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 shadow-xl">
        <div className="text-center mb-6">
          <div className="caribbean-gradient rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <Bus size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Transporte Maneiro</h1>
          <p className="text-gray-600 text-sm">Nueva Esparta, Venezuela</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail size={16} />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              disabled={loading || isSigningIn}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2">
              <Lock size={16} />
              Contraseña
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresa tu contraseña"
              required
              disabled={loading || isSigningIn}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-md">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full caribbean-gradient"
            disabled={loading || isSigningIn}
          >
            {isSigningIn ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </Button>
        </form>

        <div className="mt-4 space-y-2">
          <Dialog open={showRegister} onOpenChange={setShowRegister}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full" disabled={loading}>
                <UserPlus size={16} className="mr-2" />
                Registrarse como Pasajero
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registro de Pasajero</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre completo</Label>
                  <Input
                    id="name"
                    value={registerData.name}
                    onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                    placeholder="Tu nombre completo"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="reg-email">Email</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                    placeholder="tu@email.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="reg-username">Usuario</Label>
                  <Input
                    id="reg-username"
                    value={registerData.username}
                    onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
                    placeholder="Nombre de usuario"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="reg-password">Contraseña</Label>
                  <Input
                    id="reg-password"
                    type="password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                    placeholder="Contraseña"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-password">Confirmar contraseña</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                    placeholder="Confirma tu contraseña"
                    required
                  />
                </div>
                {error && (
                  <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-md">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}
                <Button onClick={handleRegister} className="w-full" disabled={loading}>
                  {loading ? 'Registrando...' : 'Registrarse'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showAPKInstructions} onOpenChange={setShowAPKInstructions}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleDownloadAPK}
                disabled={loading}
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
        </div>

        <div className="mt-4 text-center text-sm text-gray-600">
          <p>Usuarios de prueba:</p>
          <p className="text-xs">Admin: admin@test.com / admin123</p>
          <p className="text-xs">Conductor: driver@test.com / driver123</p>
        </div>
      </Card>
    </div>
  );
};

export default LoginScreen;
