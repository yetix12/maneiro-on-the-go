import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Users, Map, MapPin, Search, Filter } from 'lucide-react';

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
  parroquia?: { nombre: string };
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const StatisticsPanel: React.FC = () => {
  const [parroquias, setParroquias] = useState<Parroquia[]>([]);
  const [selectedParroquia, setSelectedParroquia] = useState<string>('all');
  const [stats, setStats] = useState<ParroquiaStats | null>(null);
  const [allStats, setAllStats] = useState<any[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

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

  const loadUsers = async () => {
    try {
      let query = supabase
        .from('profiles')
        .select('id, full_name, username, user_type, phone, direccion, calle, sector, fecha_nacimiento, parroquia_id')
        .order('full_name');

      if (selectedParroquia !== 'all') {
        query = query.eq('parroquia_id', selectedParroquia);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Enrich with parroquia names
      const { data: parroquiasData } = await supabase.from('parroquias').select('id, nombre');
      const enrichedUsers = (data || []).map(user => ({
        ...user,
        parroquia: parroquiasData?.find(p => p.id === user.parroquia_id)
      }));

      setUsers(enrichedUsers);
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

  // Calculate age from birth date
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

  // Filter users
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
                      'bg-green-100 text-green-700'
                    }`}>
                      {getUserTypeLabel(user.user_type)}
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
            Mostrando {Math.min(filteredUsers.length, 50)} de {filteredUsers.length} usuarios
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatisticsPanel;
