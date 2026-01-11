import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Users, Map, MapPin, Building2 } from 'lucide-react';

interface Parroquia {
  id: string;
  nombre: string;
}

interface ParroquiaStats {
  total_usuarios: number;
  total_pasajeros: number;
  total_conductores: number;
  total_rutas: number;
  total_paradas: number;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const StatisticsPanel: React.FC = () => {
  const [parroquias, setParroquias] = useState<Parroquia[]>([]);
  const [selectedParroquia, setSelectedParroquia] = useState<string>('all');
  const [stats, setStats] = useState<ParroquiaStats | null>(null);
  const [allStats, setAllStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadParroquias();
    loadAllStats();
  }, []);

  useEffect(() => {
    if (selectedParroquia && selectedParroquia !== 'all') {
      loadParroquiaStats(selectedParroquia);
    } else {
      setStats(null);
    }
  }, [selectedParroquia]);

  const loadParroquias = async () => {
    try {
      const { data, error } = await supabase
        .from('parroquias')
        .select('id, nombre')
        .eq('is_active', true);

      if (error) throw error;
      setParroquias(data || []);
    } catch (error) {
      console.error('Error loading parroquias:', error);
    }
  };

  const loadAllStats = async () => {
    setLoading(true);
    try {
      // Get stats for each parroquia
      const { data: parroquiasData } = await supabase
        .from('parroquias')
        .select('id, nombre')
        .eq('is_active', true);

      if (!parroquiasData) return;

      const statsPromises = parroquiasData.map(async (p) => {
        const { data, error } = await supabase
          .rpc('get_parroquia_statistics', { _parroquia_id: p.id });

        if (error || !data || data.length === 0) {
          return {
            nombre: p.nombre,
            usuarios: 0,
            pasajeros: 0,
            conductores: 0,
            rutas: 0
          };
        }

        return {
          nombre: p.nombre,
          usuarios: Number(data[0].total_usuarios) || 0,
          pasajeros: Number(data[0].total_pasajeros) || 0,
          conductores: Number(data[0].total_conductores) || 0,
          rutas: Number(data[0].total_rutas) || 0
        };
      });

      const results = await Promise.all(statsPromises);
      setAllStats(results);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadParroquiaStats = async (parroquiaId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('get_parroquia_statistics', { _parroquia_id: parroquiaId });

      if (error) throw error;
      if (data && data.length > 0) {
        setStats({
          total_usuarios: Number(data[0].total_usuarios) || 0,
          total_pasajeros: Number(data[0].total_pasajeros) || 0,
          total_conductores: Number(data[0].total_conductores) || 0,
          total_rutas: Number(data[0].total_rutas) || 0,
          total_paradas: Number(data[0].total_paradas) || 0
        });
      }
    } catch (error) {
      console.error('Error loading parroquia stats:', error);
    }
  };

  const pieData = stats ? [
    { name: 'Pasajeros', value: stats.total_pasajeros },
    { name: 'Conductores', value: stats.total_conductores },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Estadísticas</h2>
          <p className="text-muted-foreground">Análisis de datos por parroquia</p>
        </div>
        <Select value={selectedParroquia} onValueChange={setSelectedParroquia}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Seleccionar parroquia" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las parroquias</SelectItem>
            {parroquias.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Individual parroquia stats */}
      {stats && selectedParroquia !== 'all' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Usuarios</p>
                  <p className="text-2xl font-bold">{stats.total_usuarios}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pasajeros</p>
                  <p className="text-2xl font-bold">{stats.total_pasajeros}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Users size={20} className="text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Conductores</p>
                  <p className="text-2xl font-bold">{stats.total_conductores}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Map size={20} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rutas</p>
                  <p className="text-2xl font-bold">{stats.total_rutas}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <MapPin size={20} className="text-pink-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Paradas</p>
                  <p className="text-2xl font-bold">{stats.total_paradas}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart - Users by parroquia */}
        <Card>
          <CardHeader>
            <CardTitle>Usuarios por Parroquia</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={allStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nombre" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="usuarios" fill="#3B82F6" name="Total Usuarios" />
                <Bar dataKey="pasajeros" fill="#10B981" name="Pasajeros" />
                <Bar dataKey="conductores" fill="#F59E0B" name="Conductores" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie chart - User distribution for selected parroquia */}
        {stats && pieData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Distribución de Usuarios</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Routes by parroquia */}
        <Card className={stats && pieData.length > 0 ? '' : 'lg:col-span-1'}>
          <CardHeader>
            <CardTitle>Rutas por Parroquia</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={allStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="nombre" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="rutas" fill="#8B5CF6" name="Rutas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StatisticsPanel;
