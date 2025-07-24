
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import LoginForm from '@/components/auth/LoginForm';
import AppHeader from '@/components/auth/AppHeader';
import { useAuth } from '@/hooks/useAuth';
import { User } from 'lucide-react';

const LoginScreen: React.FC = () => {
  const { loading, signIn } = useAuth();
  const [isPassengerLogin, setIsPassengerLogin] = useState(false);

  const handlePassengerLogin = async () => {
    setIsPassengerLogin(true);
    // Usar credenciales de pasajero válidas
    await signIn('pasajero@test.com', 'password123');
    setIsPassengerLogin(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-yellow-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 shadow-xl">
        <AppHeader />
        
        <LoginForm />

        <div className="mt-6 pt-4 border-t border-gray-200">
          <Button
            onClick={handlePassengerLogin}
            disabled={loading || isPassengerLogin}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            variant="default"
          >
            <User className="w-4 h-4 mr-2" />
            {isPassengerLogin ? 'Entrando como Pasajero...' : 'Pasajero'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default LoginScreen;
