
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Bus, User, Lock, AlertCircle, UserPlus, Download } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (userType: 'passenger' | 'driver' | 'admin', userInfo: any) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  
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
    setIsLoading(true);
    setError('');

    // Simular delay de autenticación
    setTimeout(() => {
      // Credenciales para pasajero
      if (username === 'pakito' && password === '12345678') {
        onLogin('passenger', {
          username: 'pakito',
          id: '12345678',
          name: 'Pakito',
          type: 'passenger'
        });
      }
      // Credenciales para conductor
      else if (username === 'pablo' && password === '12345678') {
        onLogin('driver', {
          username: 'pablo',
          id: 'driver-001',
          name: 'Pablo',
          type: 'driver'
        });
      }
      // Credenciales para administrador
      else if (username === 'admin' && password === 'admin') {
        onLogin('admin', {
          username: 'admin',
          id: 'admin-001',
          name: 'Administrador',
          type: 'admin'
        });
      }
      else {
        setError('Usuario o contraseña incorrectos');
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleRegister = () => {
    if (registerData.password !== registerData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    // Aquí se conectaría con Supabase para guardar el usuario
    console.log('Registrando usuario:', registerData);
    alert('Registro exitoso! Conecta Supabase para guardar los datos.');
    setShowRegister(false);
  };

  const handleDownloadAPK = () => {
    alert('Para generar APK necesitas conectar Supabase y configurar Capacitor');
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
            <Label htmlFor="username" className="flex items-center gap-2">
              <User size={16} />
              Usuario
            </Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ingresa tu usuario"
              required
              disabled={isLoading}
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
              disabled={isLoading}
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
            disabled={isLoading}
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </Button>
        </form>

        <div className="mt-4 space-y-2">
          <Dialog open={showRegister} onOpenChange={setShowRegister}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
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
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                    placeholder="tu@email.com"
                  />
                </div>
                <div>
                  <Label htmlFor="reg-username">Usuario</Label>
                  <Input
                    id="reg-username"
                    value={registerData.username}
                    onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
                    placeholder="Nombre de usuario"
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
                  />
                </div>
                <Button onClick={handleRegister} className="w-full">
                  Registrarse
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button 
            variant="outline" 
            className="w-full"
            onClick={handleDownloadAPK}
          >
            <Download size={16} className="mr-2" />
            Descargar APK
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default LoginScreen;
