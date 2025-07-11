
import React from 'react';
import { Card } from '@/components/ui/card';
import LoginForm from '@/components/auth/LoginForm';
import RegisterDialog from '@/components/auth/RegisterDialog';
import APKInstructionsDialog from '@/components/auth/APKInstructionsDialog';
import AppHeader from '@/components/auth/AppHeader';
import TestUserInfo from '@/components/auth/TestUserInfo';
import { useAuth } from '@/hooks/useAuth';

const LoginScreen: React.FC = () => {
  const { loading } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-yellow-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 shadow-xl">
        <AppHeader />
        
        <LoginForm />

        <div className="mt-4 space-y-2">
          <RegisterDialog disabled={loading} />
          <APKInstructionsDialog disabled={loading} />
        </div>

        <TestUserInfo />
      </Card>
    </div>
  );
};

export default LoginScreen;
