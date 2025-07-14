
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginScreen from "./components/LoginScreen";
import DriverDashboard from "./components/DriverDashboard";
import AdminDashboard from "./components/AdminDashboard";
import { AuthProvider, useAuth } from "./hooks/useAuth";

const queryClient = new QueryClient();

const AppContent = () => {
  const { user, loading, signOut } = useAuth();

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, mostrar login
  if (!user) {
    return <LoginScreen />;
  }

  // Si es administrador, mostrar dashboard del administrador
  if (user.type === 'admin') {
    return <AdminDashboard onLogout={signOut} />;
  }

  // Si es conductor, mostrar dashboard del conductor
  if (user.type === 'driver') {
    return <DriverDashboard driverInfo={user} onLogout={signOut} />;
  }

  // Si es pasajero, mostrar la aplicación normal
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index onLogout={signOut} />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <AppContent />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
