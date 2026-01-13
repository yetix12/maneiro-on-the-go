
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Search, X, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface ParishUsersManagerProps {
  parroquiaId?: string;
}

const ParishUsersManager: React.FC<ParishUsersManagerProps> = ({ parroquiaId }) => {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const [newUser, setNewUser] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    phone: '',
    user_type: 'passenger',
    direccion: ''
  });

  useEffect(() => {
    if (parroquiaId) {
      loadUsers();
    }
  }, [parroquiaId]);

  const loadUsers = async () => {
    if (!parroquiaId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('parroquia_id', parroquiaId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const handleAddUser = async () => {
    const trimmedEmail = newUser.email.trim();
    const trimmedName = newUser.name.trim();

    if (!trimmedName || !trimmedEmail || !newUser.password) {
      toast({ title: "Error", description: "Nombre, email y contraseña son obligatorios", variant: "destructive" });
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      toast({ title: "Error", description: "El formato del email no es válido", variant: "destructive" });
      return;
    }

    if (newUser.password.length < 6) {
      toast({ title: "Error", description: "La contraseña debe tener al menos 6 caracteres", variant: "destructive" });
      return;
    }

    // Only allow passenger and driver creation
    if (!['passenger', 'driver'].includes(newUser.user_type)) {
      toast({ title: "Error", description: "Solo puedes crear pasajeros o conductores", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: newUser.password,
        options: {
          data: {
            username: newUser.username.trim() || trimmedEmail.split('@')[0],
            full_name: trimmedName,
            user_type: newUser.user_type,
            phone: newUser.phone.trim() || null,
            parroquia_id: parroquiaId,
            direccion: newUser.direccion.trim() || null
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (authError) throw authError;

      // If driver, add driver role
      if (newUser.user_type === 'driver' && authData.user) {
        await supabase.from('user_roles').insert({
          user_id: authData.user.id,
          role: 'driver',
          parroquia_id: parroquiaId
        });
      }

      toast({ title: "Éxito", description: `${newUser.user_type === 'driver' ? 'Conductor' : 'Pasajero'} creado correctamente` });
      
      setNewUser({
        name: '',
        username: '',
        email: '',
        password: '',
        phone: '',
        user_type: 'passenger',
        direccion: ''
      });
      setShowForm(false);
      loadUsers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editingUser.full_name,
          username: editingUser.username,
          phone: editingUser.phone,
          direccion: editingUser.direccion
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      toast({ title: "Éxito", description: "Usuario actualizado correctamente" });
      setEditingUser(null);
      loadUsers();
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
    
    return matchesSearch && matchesType;
  });

  const getUserTypeLabel = (type: string) => {
    switch (type) {
      case 'driver': return 'Conductor';
      case 'passenger': return 'Pasajero';
      case 'admin_parroquia': return 'Admin Parroquia';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? <X className="mr-2" /> : <Plus className="mr-2" />}
          {showForm ? 'Cancelar' : 'Nuevo Usuario'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Crear Nuevo Usuario</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Tipo de Usuario *</Label>
                <Select value={newUser.user_type} onValueChange={(v) => setNewUser({...newUser, user_type: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="passenger">Pasajero</SelectItem>
                    <SelectItem value="driver">Conductor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nombre Completo *</Label>
                <Input 
                  value={newUser.name} 
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  placeholder="Juan Pérez"
                />
              </div>
              <div>
                <Label>Usuario</Label>
                <Input 
                  value={newUser.username} 
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  placeholder="juanperez"
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input 
                  type="email"
                  value={newUser.email} 
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  placeholder="juan@email.com"
                />
              </div>
              <div>
                <Label>Contraseña *</Label>
                <Input 
                  type="password"
                  value={newUser.password} 
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input 
                  value={newUser.phone} 
                  onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                  placeholder="0412-1234567"
                />
              </div>
              <div className="md:col-span-2">
                <Label>Dirección</Label>
                <Input 
                  value={newUser.direccion} 
                  onChange={(e) => setNewUser({...newUser, direccion: e.target.value})}
                  placeholder="Calle Principal, Casa #123"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleAddUser} disabled={loading} className="w-full">
                  <Plus size={16} className="mr-2" />
                  Crear {newUser.user_type === 'driver' ? 'Conductor' : 'Pasajero'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Usuarios Registrados ({filteredUsers.length})</CardTitle>
            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  placeholder="Buscar usuarios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="passenger">Pasajeros</SelectItem>
                  <SelectItem value="driver">Conductores</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
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
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>
                      {editingUser?.id === user.id ? (
                        <Input 
                          value={editingUser.full_name || ''} 
                          onChange={(e) => setEditingUser({...editingUser, full_name: e.target.value})}
                        />
                      ) : (
                        user.full_name || '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {editingUser?.id === user.id ? (
                        <Input 
                          value={editingUser.username || ''} 
                          onChange={(e) => setEditingUser({...editingUser, username: e.target.value})}
                        />
                      ) : (
                        user.username || '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.user_type === 'driver' 
                          ? 'bg-orange-100 text-orange-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {getUserTypeLabel(user.user_type)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {editingUser?.id === user.id ? (
                        <Input 
                          value={editingUser.phone || ''} 
                          onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})}
                        />
                      ) : (
                        user.phone || '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {editingUser?.id === user.id ? (
                        <Input 
                          value={editingUser.direccion || ''} 
                          onChange={(e) => setEditingUser({...editingUser, direccion: e.target.value})}
                        />
                      ) : (
                        user.direccion || '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingUser?.id === user.id ? (
                        <div className="space-x-2">
                          <Button size="sm" onClick={handleUpdateUser} disabled={loading}>
                            <Save size={16} />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingUser(null)}>
                            <X size={16} />
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => setEditingUser({...user})}>
                          <Edit size={16} />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No se encontraron usuarios
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

export default ParishUsersManager;
