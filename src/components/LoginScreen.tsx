
import React from 'react';
import { Card } from '@/components/ui/card';
import LoginForm from '@/components/auth/LoginForm';
import AppHeader from '@/components/auth/AppHeader';

const LoginScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-yellow-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 shadow-xl">
        <AppHeader />
        
        <div className="mb-4 text-center">
          <p className="text-sm text-gray-600">
            Acceso exclusivo para conductores y administradores
          </p>
        </div>
        
        <LoginForm />
      </Card>
    </div>
  );
};

export default LoginScreen;
