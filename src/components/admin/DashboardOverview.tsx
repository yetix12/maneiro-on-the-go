import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Map, MapPin, Building2, Bus, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Municipio {
  id: string;
  nombre: string;
}

interface Stats {
  totalUsers: number;
  totalPassengers: number;
  totalDrivers: number;
  totalRoutes: number;
  totalStops: number;
  totalVehicles: number;
  totalImages: number;
}

const DashboardOverview: React.FC = () => {
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [selectedMunicipio, setSelectedMunicipio] = useState<string>('all');
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalPassengers: 0,
    totalDrivers: 0,
    totalRoutes: 0,
    totalStops: 0,
    totalVehicles: 0,
    totalImages: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMunicipios();
  }, []);

  useEffect(() => {
    loadStats();
  }, [selectedMunicipio]);

  const loadMunicipios = async () => {
    const { data } = await supabase
      .from('parroquias')
      .select('id, nombre')
      .eq('is_active', true)
      .order('nombre');
    setMunicipios(data || []);
  };

  const loadStats = async () => {
    setLoading(true);
    try {
      // Build queries based on filter
      const municipioFilter = selectedMunicipio !== 'all' ? selectedMunicipio : null;

      // Profiles queries
      let profilesQuery = supabase.from('profiles').select('*', { count: 'exact', head: true });
      let passengersQuery = supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('user_type', 'passenger');
      let driversQuery = supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('user_type', 'driver');

      if (municipioFilter) {
        profilesQuery = profilesQuery.eq('parroquia_id', municipioFilter);
        passengersQuery = passengersQuery.eq('parroquia_id', municipioFilter);
        driversQuery = driversQuery.eq('parroquia_id', municipioFilter);
      }

      // Routes query
      let routesQuery = supabase.from('bus_routes').select('*', { count: 'exact', head: true }).eq('is_active', true);
      if (municipioFilter) {
        routesQuery = routesQuery.eq('parroquia_id', municipioFilter);
      }

      // For stops, we need to filter by routes that belong to the municipio
      let stopsCount = 0;
      if (municipioFilter) {
        // Get routes for the municipio first
        const { data: routesData } = await supabase
          .from('bus_routes')
          .select('id')
          .eq('parroquia_id', municipioFilter)
          .eq('is_active', true);
        
        if (routesData && routesData.length > 0) {
          const routeIds = routesData.map(r => r.id);
          const { count } = await supabase
            .from('bus_stops')
            .select('*', { count: 'exact', head: true })
            .in('route_id', routeIds);
          stopsCount = count || 0;
        }
      } else {
        const { count } = await supabase.from('bus_stops').select('*', { count: 'exact', head: true });
        stopsCount = count || 0;
      }

      // Vehicles - filter by route's municipio if needed
      let vehiclesCount = 0;
      if (municipioFilter) {
        const { data: routesData } = await supabase
          .from('bus_routes')
          .select('id')
          .eq('parroquia_id', municipioFilter)
          .eq('is_active', true);
        
        if (routesData && routesData.length > 0) {
          const routeIds = routesData.map(r => r.id);
          const { count } = await supabase
            .from('vehicles')
            .select('*', { count: 'exact', head: true })
            .in('route_id', routeIds);
          vehiclesCount = count || 0;
        }
      } else {
        const { count } = await supabase.from('vehicles').select('*', { count: 'exact', head: true });
        vehiclesCount = count || 0;
      }

      // Images - filter by municipio
      let imagesQuery = supabase.from('galeria_maneiro').select('*', { count: 'exact', head: true });
      if (municipioFilter) {
        imagesQuery = imagesQuery.eq('parroquia_id', municipioFilter);
      }

      const [
        { count: usersCount },
        { count: passengersCount },
        { count: driversCount },
        { count: routesCount },
        { count: imagesCount },
      ] = await Promise.all([
        profilesQuery,
        passengersQuery,
        driversQuery,
        routesQuery,
        imagesQuery,
      ]);

      setStats({
        totalUsers: usersCount || 0,
        totalPassengers: passengersCount || 0,
        totalDrivers: driversCount || 0,
        totalRoutes: routesCount || 0,
        totalStops: stopsCount,
        totalVehicles: vehiclesCount,
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
    { label: 'Vehículos', value: stats.totalVehicles, icon: Bus, color: 'bg-teal-500' },
    { label: 'Imágenes', value: stats.totalImages, icon: Image, color: 'bg-amber-500' },
  ];

  if (loading && municipios.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(7)].map((_, i) => (
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Panel de Control</h2>
          <p className="text-muted-foreground">Resumen general del sistema</p>
        </div>
        <Select value={selectedMunicipio} onValueChange={setSelectedMunicipio}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filtrar por municipio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los Municipios</SelectItem>
            {municipios.map((m) => (
              <SelectItem key={m.id} value={m.id}>{m.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">{loading ? '...' : stat.value}</p>
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
