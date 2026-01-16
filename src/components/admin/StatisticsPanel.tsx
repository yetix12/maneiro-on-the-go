import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Users, Map, MapPin, Search, Filter, TrendingUp, TrendingDown, Car, Image, AlertCircle } from 'lucide-react';

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

interface UserData {
  id: string;
  full_name: string | null;
  username: string | null;
  user_type: string | null;
  phone: string | null;
  direccion: string | null;
  calle: string | null;
  sector: string | null;
  fecha_nacimiento: string | null;
  is_active?: boolean | null;
  parroquia?: { nombre: string };
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const StatisticsPanel: React.FC = () => {
  const [parroquias, setParroquias] = useState<Parroquia[]>([]);
  const [selectedParroquia, setSelectedParroquia] = useState<string>('all');
  const [stats, setStats] = useState<ParroquiaStats | null>(null);
  const [allStats, setAllStats] = useState<any[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalVehicles, setTotalVehicles] = useState(0);
  const [activeVehicles, setActiveVehicles] = useState(0);
  const [totalImages, setTotalImages] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [inactiveUsers, setInactiveUsers] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUserType, setFilterUserType] = useState<string>('all');
  const [filterCalle, setFilterCalle] = useState('');
  const [filterSector, setFilterSector] = useState('');
  const [filterAgeMin, setFilterAgeMin] = useState('');
  const [filterAgeMax, setFilterAgeMax] = useState('');

  useEffect(() => {
    loadParroquias();
    loadAllStats();
    loadUsers();
    loadAdditionalStats();
  }, []);

  useEffect(() => {
    if (selectedParroquia && selectedParroquia !== 'all') {
      loadParroquiaStats(selectedParroquia);
    } else {
      setStats(null);
    }
    loadUsers();
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

  const loadAdditionalStats = async () => {
    try {
      const [vehiclesRes, imagesRes] = await Promise.all([
        supabase.from('vehicles').select('id, status'),
        supabase.from('galeria_maneiro').select('id')
      ]);

      setTotalVehicles(vehiclesRes.data?.length || 0);
      setActiveVehicles(vehiclesRes.data?.filter(v => v.status === 'active').length || 0);
      setTotalImages(imagesRes.data?.length || 0);
    } catch (error) {
      console.error('Error loading additional stats:', error);
    }
  };

  const loadUsers = async () => {
    try {
      let query = supabase
        .from('profiles')
        .select('id, full_name, username, user_type, phone, direccion, calle, sector, fecha_nacimiento, parroquia_id, is_active')
        .order('full_name');

      if (selectedParroquia !== 'all') {
        query = query.eq('parroquia_id', selectedParroquia);
      }

      const { data, error } = await query;
      if (error) throw error;

      const { data: parroquiasData } = await supabase.from('parroquias').select('id, nombre');
      const enrichedUsers = (data || []).map(user => ({
        ...user,
        parroquia: parroquiasData?.find(p => p.id === user.parroquia_id)
      }));

      setUsers(enrichedUsers);
      setActiveUsers(enrichedUsers.filter(u => u.is_active !== false).length);
      setInactiveUsers(enrichedUsers.filter(u => u.is_active === false).length);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadAllStats = async () => {
    setLoading(true);
    try {
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
            rutas: 0,
            paradas: 0
          };
        }

        return {
          nombre: p.nombre,
          usuarios: Number(data[0].total_usuarios) || 0,
          pasajeros: Number(data[0].total_pasajeros) || 0,
          conductores: Number(data[0].total_conductores) || 0,
          rutas: Number(data[0].total_rutas) || 0,
          paradas: Number(data[0].total_paradas) || 0
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

  const calculateAge = (birthDate: string | null): number | null => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (user.username?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesType = filterUserType === 'all' || user.user_type === filterUserType;
    
    const matchesCalle = !filterCalle || 
      (user.calle?.toLowerCase() || '').includes(filterCalle.toLowerCase()) ||
      (user.direccion?.toLowerCase() || '').includes(filterCalle.toLowerCase());
    
    const matchesSector = !filterSector || 
      (user.sector?.toLowerCase() || '').includes(filterSector.toLowerCase());

    const age = calculateAge(user.fecha_nacimiento);
    const matchesAgeMin = !filterAgeMin || (age !== null && age >= parseInt(filterAgeMin));
    const matchesAgeMax = !filterAgeMax || (age !== null && age <= parseInt(filterAgeMax));

    return matchesSearch && matchesType && matchesCalle && matchesSector && matchesAgeMin && matchesAgeMax;
  });

  const pieData = stats ? [
    { name: 'Pasajeros', value: stats.total_pasajeros },
    { name: 'Conductores', value: stats.total_conductores },
  ].filter(d => d.value > 0) : [];

  const getUserTypeLabel = (type: string | null) => {
    switch (type) {
      case 'admin_general': return 'Admin General';
      case 'admin_parroquia': return 'Admin Parroquia';
      case 'driver': return 'Conductor';
      case 'passenger': return 'Pasajero';
      default: return 'Sin tipo';
    }
  };

  // Calculate totals
  const totalUsuarios = allStats.reduce((sum, s) => sum + s.usuarios, 0);
  const totalPasajeros = allStats.reduce((sum, s) => sum + s.pasajeros, 0);
  const totalConductores = allStats.reduce((sum, s) => sum + s.conductores, 0);
  const totalRutas = allStats.reduce((sum, s) => sum + s.rutas, 0);
  const totalParadas = allStats.reduce((sum, s) => sum + s.paradas, 0);

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
    
    // User insights
    if (totalUsuarios > 0) {
      const passengerPercent = ((totalPasajeros / totalUsuarios) * 100).toFixed(1);
      const driverPercent = ((totalConductores / totalUsuarios) * 100).toFixed(1);
      insights.push(`📊 De ${totalUsuarios} usuarios registrados, ${passengerPercent}% son pasajeros y ${driverPercent}% son conductores.`);
    }

    // Active users insight
    if (activeUsers > 0 || inactiveUsers > 0) {
      const activePercent = ((activeUsers / (activeUsers + inactiveUsers)) * 100).toFixed(1);
      insights.push(`✅ ${activePercent}% de los usuarios están activos (${activeUsers} de ${activeUsers + inactiveUsers}).`);
    }

    // Route coverage
    if (totalRutas > 0 && totalParadas > 0) {
      const avgStopsPerRoute = (totalParadas / totalRutas).toFixed(1);
      insights.push(`🚌 Promedio de ${avgStopsPerRoute} paradas por ruta. Total: ${totalRutas} rutas y ${totalParadas} paradas.`);
    }

    // Vehicle insights
    if (totalVehicles > 0) {
      const activeVehiclePercent = ((activeVehicles / totalVehicles) * 100).toFixed(1);
      insights.push(`🚗 ${activeVehiclePercent}% de los vehículos están activos (${activeVehicles} de ${totalVehicles}).`);
    }

    // Driver to vehicle ratio
    if (totalConductores > 0 && totalVehicles > 0) {
      const ratio = (totalVehicles / totalConductores).toFixed(2);
      if (parseFloat(ratio) < 1) {
        insights.push(`⚠️ Hay más conductores (${totalConductores}) que vehículos (${totalVehicles}). Ratio: ${ratio} vehículos por conductor.`);
      } else {
        insights.push(`✅ Ratio vehículo/conductor: ${ratio}. Cobertura adecuada.`);
      }
    }

    // Parroquia comparison
    if (allStats.length > 1) {
      const maxUsers = Math.max(...allStats.map(s => s.usuarios));
      const minUsers = Math.min(...allStats.filter(s => s.usuarios > 0).map(s => s.usuarios));
      const topParroquia = allStats.find(s => s.usuarios === maxUsers);
      if (topParroquia) {
        insights.push(`🏆 ${topParroquia.nombre} lidera con ${topParroquia.usuarios} usuarios registrados.`);
      }
    }

    // Gallery content
    if (totalImages > 0) {
      insights.push(`🖼️ La galería cuenta con ${totalImages} imágenes para información turística y de transporte.`);
    }

    return insights;
  };

  const insights = generateInsights();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Estadísticas y Análisis</h2>
          <p className="text-muted-foreground">Análisis detallado de datos por parroquia con explicaciones</p>
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

      {/* Global Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-blue-600" />
              <div>
                <p className="text-xs text-muted-foreground">Total Usuarios</p>
                <p className="text-xl font-bold">{totalUsuarios}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Pasajeros</p>
                <p className="text-xl font-bold">{totalPasajeros}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-orange-600" />
              <div>
                <p className="text-xs text-muted-foreground">Conductores</p>
                <p className="text-xl font-bold">{totalConductores}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Map size={18} className="text-purple-600" />
              <div>
                <p className="text-xs text-muted-foreground">Rutas</p>
                <p className="text-xl font-bold">{totalRutas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-pink-600" />
              <div>
                <p className="text-xs text-muted-foreground">Paradas</p>
                <p className="text-xl font-bold">{totalParadas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Car size={18} className="text-cyan-600" />
              <div>
                <p className="text-xs text-muted-foreground">Vehículos</p>
                <p className="text-xl font-bold">{totalVehicles}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-600" />
              <div>
                <p className="text-xs text-muted-foreground">Activos</p>
                <p className="text-xl font-bold">{activeUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Image size={18} className="text-indigo-600" />
              <div>
                <p className="text-xs text-muted-foreground">Imágenes</p>
                <p className="text-xl font-bold">{totalImages}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights Section */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle size={20} />
            Análisis y Explicación de Datos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {insights.map((insight, index) => (
              <p key={index} className="text-sm">{insight}</p>
            ))}
            {insights.length === 0 && (
              <p className="text-sm text-muted-foreground">No hay suficientes datos para generar análisis.</p>
            )}
          </div>
        </CardContent>
      </Card>

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
                <Legend />
                <Bar dataKey="usuarios" fill="#3B82F6" name="Total Usuarios" />
                <Bar dataKey="pasajeros" fill="#10B981" name="Pasajeros" />
                <Bar dataKey="conductores" fill="#F59E0B" name="Conductores" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Age distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Edad</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ageData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {ageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
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

        {/* Routes and Stops by parroquia */}
        <Card>
          <CardHeader>
            <CardTitle>Rutas y Paradas por Parroquia</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={allStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="nombre" type="category" width={80} />
                <Tooltip />
                <Legend />
                <Bar dataKey="rutas" fill="#8B5CF6" name="Rutas" />
                <Bar dataKey="paradas" fill="#EC4899" name="Paradas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed User Data with Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter size={20} />
            Datos de Usuarios (Filtros Detallados)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Buscar nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterUserType} onValueChange={setFilterUserType}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de usuario" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="passenger">Pasajeros</SelectItem>
                <SelectItem value="driver">Conductores</SelectItem>
                <SelectItem value="admin_parroquia">Admin Parroquia</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Filtrar por calle"
              value={filterCalle}
              onChange={(e) => setFilterCalle(e.target.value)}
            />
            <Input
              placeholder="Filtrar por sector"
              value={filterSector}
              onChange={(e) => setFilterSector(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Edad mínima"
              value={filterAgeMin}
              onChange={(e) => setFilterAgeMin(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Edad máxima"
              value={filterAgeMax}
              onChange={(e) => setFilterAgeMax(e.target.value)}
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Parroquia</TableHead>
                <TableHead>Calle/Dirección</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead>Edad</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.slice(0, 50).map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.full_name || '-'}</TableCell>
                  <TableCell>{user.username || '-'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      user.user_type === 'driver' ? 'bg-orange-100 text-orange-700' :
                      user.user_type === 'admin_parroquia' ? 'bg-blue-100 text-blue-700' :
                      user.user_type === 'admin_general' ? 'bg-purple-100 text-purple-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {getUserTypeLabel(user.user_type)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      user.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {user.is_active !== false ? 'Activo' : 'Inactivo'}
                    </span>
                  </TableCell>
                  <TableCell>{user.phone || '-'}</TableCell>
                  <TableCell>{user.parroquia?.nombre || '-'}</TableCell>
                  <TableCell>{user.calle || user.direccion || '-'}</TableCell>
                  <TableCell>{user.sector || '-'}</TableCell>
                  <TableCell>
                    {user.fecha_nacimiento ? calculateAge(user.fecha_nacimiento) : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <p className="text-sm text-muted-foreground mt-4">
            Mostrando {Math.min(filteredUsers.length, 50)} de {filteredUsers.length} usuarios filtrados
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatisticsPanel;
