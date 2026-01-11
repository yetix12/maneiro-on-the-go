import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Save, X, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface User {
  id: string;
  full_name: string | null;
  username: string | null;
  user_type: string | null;
  phone: string | null;
  parroquia_id: string | null;
  direccion: string | null;
  parroquia?: {
    nombre: string;
  };
}

interface Parroquia {
  id: string;
  nombre: string;
}

const UsersManager: React.FC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [parroquias, setParroquias] = useState<Parroquia[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterParroquia, setFilterParroquia] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<User>>({});
  
  // New user form for creating drivers
  const [newUser, setNewUser] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    phone: '',
    parroquia_id: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      const { data: parroquiasData, error: parroquiasError } = await supabase
        .from('parroquias')
        .select('id, nombre')
        .eq('is_active', true);

      if (parroquiasError) throw parroquiasError;

      // Enrich users with parroquia name
      const enrichedUsers = (usersData || []).map(user => {
        const parroquia = parroquiasData?.find(p => p.id === user.parroquia_id);
        return { ...user, parroquia };
      });

      setUsers(enrichedUsers);
      setParroquias(parroquiasData || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar los usuarios",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddDriver = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast({
        title: "Error",
        description: "Nombre, email y contraseña son obligatorios",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            username: newUser.username || newUser.email.split('@')[0],
            full_name: newUser.name,
            user_type: 'driver',
            phone: newUser.phone || null,
            parroquia_id: newUser.parroquia_id || null
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (authError) throw authError;

      toast({ title: "Éxito", description: "Conductor creado exitosamente" });
      setNewUser({ name: '', username: '', email: '', password: '', phone: '', parroquia_id: '' });
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el conductor",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingId(user.id);
    setEditData(user);
  };

  const handleSave = async () => {
    if (!editingId) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editData.full_name,
          username: editData.username,
          phone: editData.phone,
          user_type: editData.user_type,
          parroquia_id: editData.parroquia_id
        })
        .eq('id', editingId);

      if (error) throw error;

      toast({ title: "Éxito", description: "Usuario actualizado" });
      setEditingId(null);
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({ title: "Éxito", description: "Usuario eliminado" });
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar",
        variant: "destructive"
      });
    }
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (user.username?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || user.user_type === filterType;
    const matchesParroquia = filterParroquia === 'all' || user.parroquia_id === filterParroquia;

    return matchesSearch && matchesType && matchesParroquia;
  });

  const getUserTypeLabel = (type: string | null) => {
    switch (type) {
      case 'admin_general': return 'Admin General';
      case 'admin_parroquia': return 'Admin Parroquia';
      case 'driver': return 'Conductor';
      case 'passenger': return 'Pasajero';
      default: return 'Sin tipo';
    }
  };

  const getUserTypeColor = (type: string | null) => {
    switch (type) {
      case 'admin_general': return 'bg-purple-100 text-purple-700';
      case 'admin_parroquia': return 'bg-blue-100 text-blue-700';
      case 'driver': return 'bg-orange-100 text-orange-700';
      case 'passenger': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Driver Form */}
      <Card>
        <CardHeader>
          <CardTitle>Crear Nuevo Conductor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Nombre Completo *</Label>
              <Input
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                placeholder="Nombre del conductor"
              />
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="email@ejemplo.com"
              />
            </div>
            <div>
              <Label>Contraseña *</Label>
              <Input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input
                value={newUser.phone}
                onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                placeholder="+58 412 123 4567"
              />
            </div>
            <div>
              <Label>Parroquia</Label>
              <Select
                value={newUser.parroquia_id}
                onValueChange={(value) => setNewUser({ ...newUser, parroquia_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar parroquia" />
                </SelectTrigger>
                <SelectContent>
                  {parroquias.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddDriver} disabled={loading} className="w-full">
                <Plus size={16} className="mr-2" />
                Crear Conductor
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="passenger">Pasajeros</SelectItem>
                <SelectItem value="driver">Conductores</SelectItem>
                <SelectItem value="admin_parroquia">Admin Parroquia</SelectItem>
                <SelectItem value="admin_general">Admin General</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterParroquia} onValueChange={setFilterParroquia}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por parroquia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las parroquias</SelectItem>
                {parroquias.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Parroquia</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    {editingId === user.id ? (
                      <Input
                        value={editData.full_name || ''}
                        onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                      />
                    ) : (
                      user.full_name || 'Sin nombre'
                    )}
                  </TableCell>
                  <TableCell>{user.username || '-'}</TableCell>
                  <TableCell>
                    {editingId === user.id ? (
                      <Select
                        value={editData.user_type || 'passenger'}
                        onValueChange={(value) => setEditData({ ...editData, user_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="passenger">Pasajero</SelectItem>
                          <SelectItem value="driver">Conductor</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className={`px-2 py-1 rounded-full text-xs ${getUserTypeColor(user.user_type)}`}>
                        {getUserTypeLabel(user.user_type)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{user.phone || '-'}</TableCell>
                  <TableCell>{user.parroquia?.nombre || '-'}</TableCell>
                  <TableCell className="text-right space-x-2">
                    {editingId === user.id ? (
                      <>
                        <Button size="sm" onClick={handleSave}>
                          <Save size={16} />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                          <X size={16} />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(user)}>
                          <Edit size={16} />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(user.id)}>
                          <Trash2 size={16} />
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <p className="text-sm text-muted-foreground mt-4">
            Mostrando {filteredUsers.length} de {users.length} usuarios
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsersManager;
