import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Search, Users, MapPin, Bus, Car, AlertCircle, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface ParishStatisticsProps {
  parroquiaId?: string;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const ParishStatistics: React.FC<ParishStatisticsProps> = ({ parroquiaId }) => {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterAddress, setFilterAddress] = useState('');

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPassengers: 0,
    totalDrivers: 0,
    totalRoutes: 0,
    totalStops: 0,
    usersWithAddress: 0,
    activeUsers: 0,
    totalVehicles: 0
  });

  useEffect(() => {
    if (parroquiaId) {
      loadData();
    }
  }, [parroquiaId]);

  const loadData = async () => {
    if (!parroquiaId) return;

    setLoading(true);
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .eq('parroquia_id', parroquiaId)
        .order('full_name');

      if (usersError) throw usersError;

      const usersList = usersData || [];
      setUsers(usersList);

      const passengers = usersList.filter(u => u.user_type === 'passenger');
      const drivers = usersList.filter(u => u.user_type === 'driver');
      const withAddress = usersList.filter(u => u.direccion);
      const active = usersList.filter(u => u.is_active !== false);

      const { count: routesCount } = await supabase
        .from('bus_routes')
        .select('*', { count: 'exact', head: true })
        .eq('parroquia_id', parroquiaId)
        .eq('is_active', true);

      const { data: routeIds } = await supabase
        .from('bus_routes')
        .select('id')
        .eq('parroquia_id', parroquiaId)
        .eq('is_active', true);

      let stopsCount = 0;
      let vehiclesCount = 0;
      if (routeIds && routeIds.length > 0) {
        const { count } = await supabase
          .from('bus_stops')
          .select('*', { count: 'exact', head: true })
          .in('route_id', routeIds.map(r => r.id));
        stopsCount = count || 0;

        const { count: vCount } = await supabase
          .from('vehicles')
          .select('*', { count: 'exact', head: true })
          .in('route_id', routeIds.map(r => r.id));
        vehiclesCount = vCount || 0;
      }

      setStats({
        totalUsers: usersList.length,
        totalPassengers: passengers.length,
        totalDrivers: drivers.length,
        totalRoutes: routesCount || 0,
        totalStops: stopsCount,
        usersWithAddress: withAddress.length,
        activeUsers: active.length,
        totalVehicles: vehiclesCount
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm);
    const matchesType = filterType === 'all' || user.user_type === filterType;
    const matchesAddress = !filterAddress || 
      user.direccion?.toLowerCase().includes(filterAddress.toLowerCase());
    return matchesSearch && matchesType && matchesAddress;
  });

  const getUserTypeLabel = (type: string) => {
    switch (type) {
      case 'driver': return 'Conductor';
      case 'passenger': return 'Pasajero';
      case 'admin_parroquia': return 'Admin';
      default: return type;
    }
  };

  const calculateAge = (birthDate: string | null): number | null => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  // Chart data
  const userTypeData = [
    { name: 'Pasajeros', value: stats.totalPassengers },
    { name: 'Conductores', value: stats.totalDrivers }
  ].filter(d => d.value > 0);

  const routeStopData = [
    { name: 'Rutas', value: stats.totalRoutes },
    { name: 'Paradas', value: stats.totalStops },
    { name: 'Vehículos', value: stats.totalVehicles }
  ];

  // Age distribution
  const ageGroups = users.reduce((acc, user) => {
    const age = calculateAge(user.fecha_nacimiento);
    if (age === null) {
      acc['Sin datos'] = (acc['Sin datos'] || 0) + 1;
    } else if (age < 18) {
      acc['<18'] = (acc['<18'] || 0) + 1;
    } else if (age < 30) {
      acc['18-29'] = (acc['18-29'] || 0) + 1;
    } else if (age < 45) {
      acc['30-44'] = (acc['30-44'] || 0) + 1;
    } else if (age < 60) {
      acc['45-59'] = (acc['45-59'] || 0) + 1;
    } else {
      acc['60+'] = (acc['60+'] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const ageData = Object.entries(ageGroups).map(([name, value]) => ({ name, value }));

  // Generate insights
  const generateInsights = () => {
    const insights: string[] = [];
    if (stats.totalUsers > 0) {
      const passengerPercent = ((stats.totalPassengers / stats.totalUsers) * 100).toFixed(1);
      insights.push(`📊 ${passengerPercent}% de los usuarios son pasajeros (${stats.totalPassengers} de ${stats.totalUsers}).`);
    }
    if (stats.activeUsers > 0) {
      const activePercent = ((stats.activeUsers / stats.totalUsers) * 100).toFixed(1);
      insights.push(`✅ ${activePercent}% de usuarios activos en el municipio.`);
    }
    if (stats.totalRoutes > 0 && stats.totalStops > 0) {
      const avgStops = (stats.totalStops / stats.totalRoutes).toFixed(1);
      insights.push(`🚌 Promedio de ${avgStops} paradas por ruta.`);
    }
    if (stats.totalDrivers > 0 && stats.totalVehicles > 0) {
      const ratio = (stats.totalVehicles / stats.totalDrivers).toFixed(2);
      insights.push(`🚗 Ratio vehículo/conductor: ${ratio}.`);
    }
    return insights;
  };

  const insights = generateInsights();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Estadísticas del Municipio</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <Card><CardContent className="p-3"><div className="flex items-center gap-2"><Users size={18} className="text-blue-600" /><div><p className="text-xs text-muted-foreground">Total</p><p className="text-xl font-bold">{stats.totalUsers}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-3"><div className="flex items-center gap-2"><Users size={18} className="text-green-600" /><div><p className="text-xs text-muted-foreground">Pasajeros</p><p className="text-xl font-bold">{stats.totalPassengers}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-3"><div className="flex items-center gap-2"><Bus size={18} className="text-orange-600" /><div><p className="text-xs text-muted-foreground">Conductores</p><p className="text-xl font-bold">{stats.totalDrivers}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-3"><div className="flex items-center gap-2"><Bus size={18} className="text-purple-600" /><div><p className="text-xs text-muted-foreground">Rutas</p><p className="text-xl font-bold">{stats.totalRoutes}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-3"><div className="flex items-center gap-2"><MapPin size={18} className="text-red-600" /><div><p className="text-xs text-muted-foreground">Paradas</p><p className="text-xl font-bold">{stats.totalStops}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-3"><div className="flex items-center gap-2"><Car size={18} className="text-cyan-600" /><div><p className="text-xs text-muted-foreground">Vehículos</p><p className="text-xl font-bold">{stats.totalVehicles}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-3"><div className="flex items-center gap-2"><TrendingUp size={18} className="text-emerald-600" /><div><p className="text-xs text-muted-foreground">Activos</p><p className="text-xl font-bold">{stats.activeUsers}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-3"><div className="flex items-center gap-2"><MapPin size={18} className="text-teal-600" /><div><p className="text-xs text-muted-foreground">Con Dirección</p><p className="text-xl font-bold">{stats.usersWithAddress}</p></div></div></CardContent></Card>
      </div>

      {/* Insights */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader><CardTitle className="flex items-center gap-2"><AlertCircle size={20} />Análisis del Municipio</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {insights.map((insight, i) => <p key={i} className="text-sm">{insight}</p>)}
            {insights.length === 0 && <p className="text-sm text-muted-foreground">No hay suficientes datos.</p>}
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle>Distribución de Usuarios</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={userTypeData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {userTypeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Infraestructura</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={routeStopData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Distribución por Edad</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader><CardTitle>Filtros de Población</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input placeholder="Nombre, usuario, teléfono..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div>
              <Label>Tipo de Usuario</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="passenger">Pasajeros</SelectItem>
                  <SelectItem value="driver">Conductores</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Filtrar por Dirección</Label>
              <Input placeholder="Sector, calle, zona..." value={filterAddress} onChange={(e) => setFilterAddress(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader><CardTitle>Población del Municipio ({filteredUsers.length} resultados)</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="text-center py-8">Cargando...</div> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Registro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map(user => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name || '-'}</TableCell>
                    <TableCell>{user.username || '-'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.user_type === 'driver' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                        {getUserTypeLabel(user.user_type)}
                      </span>
                    </TableCell>
                    <TableCell>{user.phone || '-'}</TableCell>
                    <TableCell className="max-w-xs truncate">{user.direccion || '-'}</TableCell>
                    <TableCell className="text-gray-500 text-sm">{new Date(user.created_at).toLocaleDateString('es-VE')}</TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">No se encontraron usuarios</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ParishStatistics;
