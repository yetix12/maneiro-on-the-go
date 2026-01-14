import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Save, X, Search, Car } from 'lucide-react';
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

interface Vehicle {
  id: string;
  license_plate: string;
  model: string | null;
  driver_id: string | null;
}

interface Route {
  id: string;
  name: string;
}

const UsersManager: React.FC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [parroquias, setParroquias] = useState<Parroquia[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterParroquia, setFilterParroquia] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<User>>({});
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [showCreateVehicle, setShowCreateVehicle] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    license_plate: '',
    model: '',
    capacity: '30',
    route_id: ''
  });
  
  // New user form
  const [newUser, setNewUser] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    phone: '',
    parroquia_id: '',
    user_type: 'passenger' as 'passenger' | 'driver' | 'admin_parroquia'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, parroquiasRes, vehiclesRes, routesRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('parroquias').select('id, nombre').eq('is_active', true),
        supabase.from('vehicles').select('id, license_plate, model, driver_id'),
        supabase.from('bus_routes').select('id, name').eq('is_active', true)
      ]);

      if (usersRes.error) throw usersRes.error;
      if (parroquiasRes.error) throw parroquiasRes.error;

      // Enrich users with parroquia name
      const enrichedUsers = (usersRes.data || []).map(user => {
        const parroquia = parroquiasRes.data?.find(p => p.id === user.parroquia_id);
        return { ...user, parroquia };
      });

      setUsers(enrichedUsers);
      setParroquias(parroquiasRes.data || []);
      setVehicles(vehiclesRes.data || []);
      setRoutes(routesRes.data || []);
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

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const handleAddUser = async () => {
    const trimmedEmail = newUser.email.trim();
    const trimmedName = newUser.name.trim();
    const trimmedPassword = newUser.password;

    if (!trimmedName || !trimmedEmail || !trimmedPassword) {
      toast({
        title: "Error",
        description: "Nombre, email y contraseña son obligatorios",
        variant: "destructive"
      });
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      toast({
        title: "Error",
        description: "El formato del email no es válido",
        variant: "destructive"
      });
      return;
    }

    if (trimmedPassword.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive"
      });
      return;
    }

    // Admin de parroquia requiere parroquia
    if (newUser.user_type === 'admin_parroquia' && !newUser.parroquia_id) {
      toast({
        title: "Error",
        description: "Debe seleccionar una parroquia para el administrador",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: trimmedPassword,
        options: {
          data: {
            username: newUser.username.trim() || trimmedEmail.split('@')[0],
            full_name: trimmedName,
            user_type: newUser.user_type,
            phone: newUser.phone.trim() || null,
            parroquia_id: newUser.parroquia_id || null
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (authError) throw authError;

      // Si es admin_parroquia, agregar rol en user_roles
      if (newUser.user_type === 'admin_parroquia' && authData.user) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: 'admin_parroquia' as const,
            parroquia_id: newUser.parroquia_id
          });

        if (roleError) {
          console.error('Error al asignar rol:', roleError);
        }
      }

      const typeLabels: Record<string, string> = {
        passenger: 'Pasajero',
        driver: 'Conductor',
        admin_parroquia: 'Administrador de Parroquia'
      };

      toast({ title: "Éxito", description: `${typeLabels[newUser.user_type]} creado exitosamente` });
      
      // Si es conductor, abrir diálogo para asignar vehículo
      if (newUser.user_type === 'driver' && authData.user) {
        setSelectedDriverId(authData.user.id);
        setVehicleDialogOpen(true);
      }
      
      setNewUser({ name: '', username: '', email: '', password: '', phone: '', parroquia_id: '', user_type: 'passenger' });
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el usuario",
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
      const updateData: any = {
        full_name: editData.full_name,
        username: editData.username,
        phone: editData.phone,
        user_type: editData.user_type,
        parroquia_id: editData.parroquia_id || null
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', editingId);

      if (error) throw error;

      // Si cambió a admin_parroquia, crear rol
      if (editData.user_type === 'admin_parroquia' && editData.parroquia_id) {
        // Verificar si ya tiene rol
        const { data: existingRole } = await supabase
          .from('user_roles')
          .select('id')
          .eq('user_id', editingId)
          .eq('role', 'admin_parroquia')
          .single();

        if (!existingRole) {
          await supabase.from('user_roles').insert({
            user_id: editingId,
            role: 'admin_parroquia',
            parroquia_id: editData.parroquia_id
          });
        } else {
          await supabase.from('user_roles')
            .update({ parroquia_id: editData.parroquia_id })
            .eq('user_id', editingId)
            .eq('role', 'admin_parroquia');
        }
      }

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

  const handleAssignVehicle = async () => {
    if (!selectedDriverId || !selectedVehicleId) {
      toast({
        title: "Error",
        description: "Selecciona un vehículo",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('vehicles')
        .update({ driver_id: selectedDriverId })
        .eq('id', selectedVehicleId);

      if (error) throw error;

      toast({ title: "Éxito", description: "Vehículo asignado al conductor" });
      setVehicleDialogOpen(false);
      setSelectedDriverId(null);
      setSelectedVehicleId('');
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo asignar el vehículo",
        variant: "destructive"
      });
    }
  };

  const handleCreateAndAssignVehicle = async () => {
    if (!selectedDriverId || !newVehicle.license_plate) {
      toast({
        title: "Error",
        description: "La placa es obligatoria",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase.from('vehicles').insert([{
        license_plate: newVehicle.license_plate,
        model: newVehicle.model,
        capacity: parseInt(newVehicle.capacity) || 30,
        route_id: newVehicle.route_id || null,
        driver_id: selectedDriverId
      }]);

      if (error) throw error;

      toast({ title: "Éxito", description: "Vehículo creado y asignado al conductor" });
      setVehicleDialogOpen(false);
      setSelectedDriverId(null);
      setNewVehicle({ license_plate: '', model: '', capacity: '30', route_id: '' });
      setShowCreateVehicle(false);
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el vehículo",
        variant: "destructive"
      });
    }
  };

  const openVehicleDialog = (driverId: string) => {
    setSelectedDriverId(driverId);
    setVehicleDialogOpen(true);
  };

  // Get available vehicles (not assigned to any driver)
  const availableVehicles = vehicles.filter(v => !v.driver_id);

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

  const getUserTypeCreateLabel = () => {
    switch (newUser.user_type) {
      case 'passenger': return 'Pasajero';
      case 'driver': return 'Conductor';
      case 'admin_parroquia': return 'Admin de Parroquia';
      default: return 'Usuario';
    }
  };

  // Get vehicle assigned to a driver
  const getDriverVehicle = (driverId: string) => {
    return vehicles.find(v => v.driver_id === driverId);
  };

  return (
    <div className="space-y-6">
      {/* Vehicle Assignment Dialog */}
      <Dialog open={vehicleDialogOpen} onOpenChange={setVehicleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Vehículo al Conductor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!showCreateVehicle ? (
              <>
                <div>
                  <Label>Seleccionar Vehículo Existente</Label>
                  <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar vehículo" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableVehicles.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.license_plate} - {v.model || 'Sin modelo'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAssignVehicle} disabled={!selectedVehicleId}>
                    Asignar Vehículo
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateVehicle(true)}>
                    Crear Nuevo Vehículo
                  </Button>
                  <Button variant="ghost" onClick={() => setVehicleDialogOpen(false)}>
                    Omitir
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Placa *</Label>
                    <Input
                      value={newVehicle.license_plate}
                      onChange={(e) => setNewVehicle({ ...newVehicle, license_plate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Modelo</Label>
                    <Input
                      value={newVehicle.model}
                      onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Capacidad</Label>
                    <Input
                      type="number"
                      value={newVehicle.capacity}
                      onChange={(e) => setNewVehicle({ ...newVehicle, capacity: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Ruta</Label>
                    <Select
                      value={newVehicle.route_id}
                      onValueChange={(v) => setNewVehicle({ ...newVehicle, route_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {routes.map((r) => (
                          <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreateAndAssignVehicle}>
                    Crear y Asignar
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateVehicle(false)}>
                    Volver
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create User Form */}
      <Card>
        <CardHeader>
          <CardTitle>Crear Nuevo Usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tipo de usuario selector */}
            <div className="md:col-span-3">
              <Label>Tipo de Usuario *</Label>
              <Select
                value={newUser.user_type}
                onValueChange={(value: 'passenger' | 'driver' | 'admin_parroquia') => 
                  setNewUser({ ...newUser, user_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="passenger">Pasajero</SelectItem>
                  <SelectItem value="driver">Conductor</SelectItem>
                  <SelectItem value="admin_parroquia">Administrador de Parroquia</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Nota: Los Administradores Generales solo pueden ser creados desde la base de datos.
              </p>
            </div>
            
            <div>
              <Label>Nombre Completo *</Label>
              <Input
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                placeholder="Nombre del usuario"
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
              <Label>Usuario</Label>
              <Input
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                placeholder="nombre_usuario"
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
              <Label>Parroquia {newUser.user_type === 'admin_parroquia' ? '*' : ''}</Label>
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
              <Button onClick={handleAddUser} disabled={loading} className="w-full">
                <Plus size={16} className="mr-2" />
                Crear {getUserTypeCreateLabel()}
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
                <TableHead>Vehículo</TableHead>
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
                  <TableCell>
                    {editingId === user.id ? (
                      <Input
                        value={editData.username || ''}
                        onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                      />
                    ) : (
                      user.username || '-'
                    )}
                  </TableCell>
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
                          <SelectItem value="admin_parroquia">Admin Parroquia</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className={`px-2 py-1 rounded-full text-xs ${getUserTypeColor(user.user_type)}`}>
                        {getUserTypeLabel(user.user_type)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === user.id ? (
                      <Input
                        value={editData.phone || ''}
                        onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      />
                    ) : (
                      user.phone || '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === user.id ? (
                      <Select
                        value={editData.parroquia_id || ''}
                        onValueChange={(value) => setEditData({ ...editData, parroquia_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          {parroquias.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      user.parroquia?.nombre || '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {user.user_type === 'driver' ? (
                      getDriverVehicle(user.id) ? (
                        <span className="text-sm">{getDriverVehicle(user.id)?.license_plate}</span>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => openVehicleDialog(user.id)}>
                          <Car size={14} className="mr-1" />
                          Asignar
                        </Button>
                      )
                    ) : '-'}
                  </TableCell>
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
