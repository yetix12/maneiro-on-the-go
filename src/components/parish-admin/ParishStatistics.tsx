
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Users, MapPin, Bus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface ParishStatisticsProps {
  parroquiaId?: string;
}

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
    usersWithAddress: 0
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
      // Load users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .eq('parroquia_id', parroquiaId)
        .order('full_name');

      if (usersError) throw usersError;

      const usersList = usersData || [];
      setUsers(usersList);

      // Calculate stats
      const passengers = usersList.filter(u => u.user_type === 'passenger');
      const drivers = usersList.filter(u => u.user_type === 'driver');
      const withAddress = usersList.filter(u => u.direccion);

      // Load routes count
      const { count: routesCount } = await supabase
        .from('bus_routes')
        .select('*', { count: 'exact', head: true })
        .eq('parroquia_id', parroquiaId)
        .eq('is_active', true);

      // Load stops count
      const { data: routeIds } = await supabase
        .from('bus_routes')
        .select('id')
        .eq('parroquia_id', parroquiaId)
        .eq('is_active', true);

      let stopsCount = 0;
      if (routeIds && routeIds.length > 0) {
        const { count } = await supabase
          .from('bus_stops')
          .select('*', { count: 'exact', head: true })
          .in('route_id', routeIds.map(r => r.id));
        stopsCount = count || 0;
      }

      setStats({
        totalUsers: usersList.length,
        totalPassengers: passengers.length,
        totalDrivers: drivers.length,
        totalRoutes: routesCount || 0,
        totalStops: stopsCount,
        usersWithAddress: withAddress.length
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

  // Get unique addresses for suggestions
  const uniqueAddresses = [...new Set(users
    .map(u => u.direccion)
    .filter(Boolean)
  )];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Estadísticas de la Parroquia</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
                <p className="text-xs text-gray-500">Total Usuarios</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalPassengers}</p>
                <p className="text-xs text-gray-500">Pasajeros</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Bus className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalDrivers}</p>
                <p className="text-xs text-gray-500">Conductores</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Bus className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalRoutes}</p>
                <p className="text-xs text-gray-500">Rutas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <MapPin className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalStops}</p>
                <p className="text-xs text-gray-500">Paradas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 rounded-lg">
                <MapPin className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.usersWithAddress}</p>
                <p className="text-xs text-gray-500">Con Dirección</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Población</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  placeholder="Nombre, usuario, teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>Tipo de Usuario</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="passenger">Pasajeros</SelectItem>
                  <SelectItem value="driver">Conductores</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Filtrar por Dirección</Label>
              <Input
                placeholder="Sector, calle, zona..."
                value={filterAddress}
                onChange={(e) => setFilterAddress(e.target.value)}
                list="address-suggestions"
              />
              <datalist id="address-suggestions">
                {uniqueAddresses.slice(0, 10).map((addr, i) => (
                  <option key={i} value={addr} />
                ))}
              </datalist>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Población de la Parroquia ({filteredUsers.length} resultados)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : (
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
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.user_type === 'driver' 
                          ? 'bg-orange-100 text-orange-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {getUserTypeLabel(user.user_type)}
                      </span>
                    </TableCell>
                    <TableCell>{user.phone || '-'}</TableCell>
                    <TableCell className="max-w-xs truncate">{user.direccion || '-'}</TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {new Date(user.created_at).toLocaleDateString('es-VE')}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No se encontraron usuarios con los filtros aplicados
                    </TableCell>
                  </TableRow>
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
