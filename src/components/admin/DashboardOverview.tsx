import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Map, MapPin, Building2, Bus, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Stats {
  totalUsers: number;
  totalPassengers: number;
  totalDrivers: number;
  totalRoutes: number;
  totalStops: number;
  totalParroquias: number;
  totalVehicles: number;
  totalImages: number;
}

const DashboardOverview: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalPassengers: 0,
    totalDrivers: 0,
    totalRoutes: 0,
    totalStops: 0,
    totalParroquias: 0,
    totalVehicles: 0,
    totalImages: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [
        { count: usersCount },
        { count: passengersCount },
        { count: driversCount },
        { count: routesCount },
        { count: stopsCount },
        { count: parroquiasCount },
        { count: vehiclesCount },
        { count: imagesCount },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('user_type', 'passenger'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('user_type', 'driver'),
        supabase.from('bus_routes').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('bus_stops').select('*', { count: 'exact', head: true }),
        supabase.from('parroquias').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('vehicles').select('*', { count: 'exact', head: true }),
        supabase.from('galeria_maneiro').select('*', { count: 'exact', head: true }),
      ]);

      setStats({
        totalUsers: usersCount || 0,
        totalPassengers: passengersCount || 0,
        totalDrivers: driversCount || 0,
        totalRoutes: routesCount || 0,
        totalStops: stopsCount || 0,
        totalParroquias: parroquiasCount || 0,
        totalVehicles: vehiclesCount || 0,
        totalImages: imagesCount || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Usuarios', value: stats.totalUsers, icon: Users, color: 'bg-blue-500' },
    { label: 'Pasajeros', value: stats.totalPassengers, icon: Users, color: 'bg-green-500' },
    { label: 'Conductores', value: stats.totalDrivers, icon: Users, color: 'bg-orange-500' },
    { label: 'Rutas Activas', value: stats.totalRoutes, icon: Map, color: 'bg-purple-500' },
    { label: 'Paradas', value: stats.totalStops, icon: MapPin, color: 'bg-pink-500' },
    { label: 'Parroquias', value: stats.totalParroquias, icon: Building2, color: 'bg-indigo-500' },
    { label: 'Vehículos', value: stats.totalVehicles, icon: Bus, color: 'bg-teal-500' },
    { label: 'Imágenes', value: stats.totalImages, icon: Image, color: 'bg-amber-500' },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Panel de Control</h2>
        <p className="text-muted-foreground">Resumen general del sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <stat.icon size={24} className="text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DashboardOverview;
