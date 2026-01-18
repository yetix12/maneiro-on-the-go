import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, UserPlus, Phone, MapPin, Home } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Municipio {
  id: string;
  nombre: string;
  municipio: string | null;
}

interface RegisterDialogProps {
  disabled?: boolean;
}

const RegisterDialog: React.FC<RegisterDialogProps> = ({ disabled = false }) => {
  const { signUp, loading } = useAuth();
  const [showRegister, setShowRegister] = useState(false);
  const [error, setError] = useState('');
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [loadingMunicipios, setLoadingMunicipios] = useState(false);
  
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    phone: '',
    parroquia_id: '',
    direccion: ''
  });

  // Cargar municipios cuando se abre el diálogo
  useEffect(() => {
    if (showRegister) {
      loadMunicipios();
    }
  }, [showRegister]);

  const loadMunicipios = async () => {
    setLoadingMunicipios(true);
    try {
      const { data, error } = await supabase
        .from('parroquias')
        .select('id, nombre, municipio')
        .eq('is_active', true)
        .order('nombre');
      
      if (error) {
        console.error('Error loading municipios:', error);
      } else {
        setMunicipios(data || []);
      }
    } catch (err) {
      console.error('Error loading municipios:', err);
    } finally {
      setLoadingMunicipios(false);
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const trimmedEmail = email.trim().toLowerCase();
    
    if (!trimmedEmail || trimmedEmail.length < 5) return false;
    if (!emailRegex.test(trimmedEmail)) return false;
    if (trimmedEmail.indexOf('@') === -1) return false;
    if (trimmedEmail.lastIndexOf('.') < trimmedEmail.indexOf('@')) return false;
    
    return true;
  };

  const validatePhone = (phone: string) => {
    // Acepta números con o sin código de país, espacios o guiones
    const phoneRegex = /^[\d\s\-+()]{7,20}$/;
    return phone === '' || phoneRegex.test(phone.trim());
  };

  const handleRegister = async () => {
    setError('');
    
    // Validar campos obligatorios
    if (!registerData.email || !registerData.password || !registerData.name || !registerData.username) {
      setError('Nombre, email, usuario y contraseña son obligatorios');
      return;
    }

    // Validar municipio
    if (!registerData.parroquia_id) {
      setError('Por favor selecciona tu municipio de residencia');
      return;
    }

    // Limpiar y validar email
    const emailTrimmed = registerData.email.trim().toLowerCase();
    if (!validateEmail(emailTrimmed)) {
      setError('Por favor ingresa un email válido (ejemplo: usuario@correo.com)');
      return;
    }

    // Validar teléfono si se proporciona
    if (registerData.phone && !validatePhone(registerData.phone)) {
      setError('Por favor ingresa un número de teléfono válido');
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
      const { error } = await signUp(emailTrimmed, registerData.password, {
        username: registerData.username.trim(),
        full_name: registerData.name.trim(),
        user_type: 'passenger',
        phone: registerData.phone.trim() || undefined,
        parroquia_id: registerData.parroquia_id,
        direccion: registerData.direccion.trim() || undefined
      });
      
      if (error) {
        console.error('Registration error details:', error);
        
        if (error.message.includes('email_address_invalid') || error.message.includes('Email address') && error.message.includes('invalid')) {
          setError('El formato del email no es válido. Verifica que sea un correo electrónico real');
        } else if (error.message.includes('User already registered') || error.message.includes('already registered')) {
          setError('Este email ya está registrado. Intenta iniciar sesión.');
        } else if (error.message.includes('Password should be at least')) {
          setError('La contraseña debe tener al menos 6 caracteres');
        } else if (error.message.includes('signup_disabled')) {
          setError('El registro está temporalmente deshabilitado. Intenta más tarde.');
        } else {
          setError(error.message || 'Error al registrarse. Por favor intenta nuevamente.');
        }
      } else {
        setShowRegister(false);
        resetForm();
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
      confirmPassword: '',
      phone: '',
      parroquia_id: '',
      direccion: ''
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
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registro de Pasajero</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Nombre completo */}
          <div>
            <Label htmlFor="name">Nombre completo *</Label>
            <Input
              id="name"
              value={registerData.name}
              onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
              placeholder="Tu nombre completo"
              required
            />
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="reg-email">Email *</Label>
            <Input
              id="reg-email"
              type="email"
              value={registerData.email} 
              onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
              placeholder="usuario@ejemplo.com"
              required
            />
          </div>

          {/* Usuario */}
          <div>
            <Label htmlFor="reg-username">Nombre de usuario *</Label>
            <Input
              id="reg-username"
              value={registerData.username}
              onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
              placeholder="Nombre de usuario único"
              required
            />
          </div>

          {/* Teléfono */}
          <div>
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone size={14} />
              Teléfono
            </Label>
            <Input
              id="phone"
              type="tel"
              value={registerData.phone}
              onChange={(e) => setRegisterData({...registerData, phone: e.target.value})}
              placeholder="+58 412 123 4567"
            />
          </div>

          {/* Municipio */}
          <div>
            <Label htmlFor="municipio" className="flex items-center gap-2">
              <MapPin size={14} />
              Municipio de residencia *
            </Label>
            <Select
              value={registerData.parroquia_id}
              onValueChange={(value) => setRegisterData({...registerData, parroquia_id: value})}
            >
              <SelectTrigger id="municipio">
                <SelectValue placeholder={loadingMunicipios ? "Cargando..." : "Selecciona tu municipio"} />
              </SelectTrigger>
              <SelectContent>
                {municipios.map((municipio) => (
                  <SelectItem key={municipio.id} value={municipio.id}>
                    {municipio.nombre} {municipio.municipio ? `(${municipio.municipio})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dirección */}
          <div>
            <Label htmlFor="direccion" className="flex items-center gap-2">
              <Home size={14} />
              Dirección
            </Label>
            <Input
              id="direccion"
              value={registerData.direccion}
              onChange={(e) => setRegisterData({...registerData, direccion: e.target.value})}
              placeholder="Tu dirección de residencia"
            />
          </div>

          {/* Contraseña */}
          <div>
            <Label htmlFor="reg-password">Contraseña *</Label>
            <Input
              id="reg-password"
              type="password"
              value={registerData.password}
              onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
              placeholder="Mínimo 6 caracteres"
              required
            />
          </div>

          {/* Confirmar contraseña */}
          <div>
            <Label htmlFor="confirm-password">Confirmar contraseña *</Label>
            <Input
              id="confirm-password"
              type="password"
              value={registerData.confirmPassword}
              onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
              placeholder="Confirma tu contraseña"
              required
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-md">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Botón de registro */}
          <Button onClick={handleRegister} className="w-full" disabled={loading}>
            {loading ? 'Registrando...' : 'Registrarse'}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            * Campos obligatorios
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RegisterDialog;
