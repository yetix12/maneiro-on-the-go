
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Bus, MapPin, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ParishDashboardOverviewProps {
  parroquiaId?: string;
  parroquiaName: string;
}

interface Statistics {
  totalUsers: number;
  totalPassengers: number;
  totalDrivers: number;
  totalRoutes: number;
  totalStops: number;
}

const ParishDashboardOverview: React.FC<ParishDashboardOverviewProps> = ({ parroquiaId, parroquiaName }) => {
  const [stats, setStats] = useState<Statistics>({
    totalUsers: 0,
    totalPassengers: 0,
    totalDrivers: 0,
    totalRoutes: 0,
    totalStops: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (parroquiaId) {
      loadStatistics();
    }
  }, [parroquiaId]);

  const loadStatistics = async () => {
    if (!parroquiaId) return;

    try {
      // Fetch statistics using the database function
      const { data, error } = await supabase.rpc('get_parroquia_statistics', {
        _parroquia_id: parroquiaId
      });

      if (error) {
        console.error('Error loading statistics:', error);
        return;
      }

      if (data && data.length > 0) {
        const statsData = data[0];
        setStats({
          totalUsers: Number(statsData.total_usuarios) || 0,
          totalPassengers: Number(statsData.total_pasajeros) || 0,
          totalDrivers: Number(statsData.total_conductores) || 0,
          totalRoutes: Number(statsData.total_rutas) || 0,
          totalStops: Number(statsData.total_paradas) || 0
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { 
      title: 'Total Usuarios', 
      value: stats.totalUsers, 
      icon: Users, 
      color: 'bg-blue-500',
      description: 'Usuarios registrados en la parroquia'
    },
    { 
      title: 'Pasajeros', 
      value: stats.totalPassengers, 
      icon: Users, 
      color: 'bg-green-500',
      description: 'Pasajeros activos'
    },
    { 
      title: 'Conductores', 
      value: stats.totalDrivers, 
      icon: Bus, 
      color: 'bg-orange-500',
      description: 'Conductores registrados'
    },
    { 
      title: 'Rutas', 
      value: stats.totalRoutes, 
      icon: TrendingUp, 
      color: 'bg-purple-500',
      description: 'Rutas activas'
    },
    { 
      title: 'Paradas', 
      value: stats.totalStops, 
      icon: MapPin, 
      color: 'bg-red-500',
      description: 'Paradas de bus'
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Bienvenido al Panel de {parroquiaName || 'la Parroquia'}
        </h1>
        <p className="text-gray-600 mt-2">
          Gestiona usuarios, rutas y paradas de tu parroquia
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {statCards.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.color}`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-gray-600">
              Usa el menú lateral para acceder a las diferentes secciones:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li><strong>Usuarios:</strong> Crear y gestionar conductores y pasajeros</li>
              <li><strong>Rutas:</strong> Añadir y editar rutas de transporte</li>
              <li><strong>Paradas:</strong> Gestionar las paradas de cada ruta</li>
              <li><strong>Estadísticas:</strong> Ver datos detallados de la población</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Información de la Parroquia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Nombre</p>
                <p className="font-medium">{parroquiaName || 'Cargando...'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">ID de Parroquia</p>
                <p className="font-mono text-sm text-gray-600">{parroquiaId || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ParishDashboardOverview;
