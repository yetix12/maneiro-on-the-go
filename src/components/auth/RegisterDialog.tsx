
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertCircle, UserPlus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface RegisterDialogProps {
  disabled?: boolean;
}

const RegisterDialog: React.FC<RegisterDialogProps> = ({ disabled = false }) => {
  const { signUp, loading } = useAuth();
  const [showRegister, setShowRegister] = useState(false);
  const [error, setError] = useState('');
  
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRegister = async () => {
    setError('');
    
    // Validar que todos los campos estén llenos
    if (!registerData.email || !registerData.password || !registerData.name || !registerData.username) {
      setError('Todos los campos son obligatorios');
      return;
    }

    // Validar formato de email
    if (!validateEmail(registerData.email)) {
      setError('Por favor ingresa un email válido');
      return;
    }

    // Validar longitud de contraseña
    if (registerData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    try {
      const { error } = await signUp(registerData.email.trim().toLowerCase(), registerData.password, {
        username: registerData.username.trim(),
        full_name: registerData.name.trim(),
        user_type: 'passenger'
      });
      
      if (error) {
        // Manejar errores específicos de Supabase
        if (error.message.includes('Email address') && error.message.includes('invalid')) {
          setError('El formato del email no es válido. Por favor verifica e intenta nuevamente.');
        } else if (error.message.includes('User already registered')) {
          setError('Este email ya está registrado. Intenta iniciar sesión.');
        } else if (error.message.includes('Password should be at least')) {
          setError('La contraseña debe tener al menos 6 caracteres');
        } else {
          setError(error.message || 'Error al registrarse. Por favor intenta nuevamente.');
        }
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
    } catch (err) {
      console.error('Registration error:', err);
      setError('Error inesperado al registrarse. Por favor intenta nuevamente.');
    }
  };

  const resetForm = () => {
    setRegisterData({
      name: '',
      email: '',
      username: '',
      password: '',
      confirmPassword: ''
    });
    setError('');
  };

  return (
    <Dialog open={showRegister} onOpenChange={(open) => {
      setShowRegister(open);
      if (!open) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full" disabled={disabled}>
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
  );
};

export default RegisterDialog;
