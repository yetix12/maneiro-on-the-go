import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Save, X, Search, Car, Eye, Power, PowerOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface User {
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
  created_at: string;
}

interface Vehicle {
  id: string;
  license_plate: string;
  model: string | null;
  driver_id: string | null;
  capacity: number | null;
  status: string | null;
  route_id: string | null;
}

interface Route {
  id: string;
  name: string;
}

interface ParishUsersManagerProps {
  parroquiaId?: string;
}

const ParishUsersManager: React.FC<ParishUsersManagerProps> = ({ parroquiaId }) => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<User>>({});

  // Vehicle assignment
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

  // User detail dialog
  const [userDetailDialog, setUserDetailDialog] = useState<User | null>(null);

  const [newUser, setNewUser] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    phone: '',
    user_type: 'passenger',
    direccion: '',
    calle: '',
    sector: '',
    fecha_nacimiento: ''
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
      const [usersRes, vehiclesRes, routesRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('parroquia_id', parroquiaId).order('created_at', { ascending: false }),
        supabase.from('vehicles').select('id, license_plate, model, driver_id, capacity, status, route_id'),
        supabase.from('bus_routes').select('id, name').eq('parroquia_id', parroquiaId).eq('is_active', true)
      ]);

      if (usersRes.error) throw usersRes.error;
      setUsers(usersRes.data || []);
      setVehicles(vehiclesRes.data || []);
      setRoutes(routesRes.data || []);
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
            direccion: newUser.direccion.trim() || null,
            calle: newUser.calle.trim() || null,
            sector: newUser.sector.trim() || null,
            fecha_nacimiento: newUser.fecha_nacimiento || null
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (authError) throw authError;

      toast({ title: "Éxito", description: `${newUser.user_type === 'driver' ? 'Conductor' : 'Pasajero'} creado correctamente` });
      
      if (newUser.user_type === 'driver' && authData.user) {
        setSelectedDriverId(authData.user.id);
        setVehicleDialogOpen(true);
      }
      
      setNewUser({
        name: '',
        username: '',
        email: '',
        password: '',
        phone: '',
        user_type: 'passenger',
        direccion: '',
        calle: '',
        sector: '',
        fecha_nacimiento: ''
      });
      setShowForm(false);
      loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
          direccion: editData.direccion,
          calle: editData.calle,
          sector: editData.sector,
          fecha_nacimiento: editData.fecha_nacimiento
        })
        .eq('id', editingId);

      if (error) throw error;

      toast({ title: "Éxito", description: "Usuario actualizado" });
      setEditingId(null);
      loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;

    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;

      toast({ title: "Éxito", description: "Usuario eliminado" });
      loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      const newActiveState = user.is_active === false ? true : false;
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: newActiveState })
        .eq('id', user.id);

      if (error) throw error;

      toast({ 
        title: "Éxito", 
        description: `Usuario ${newActiveState ? 'activado' : 'desactivado'} correctamente` 
      });
      loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleAssignVehicle = async () => {
    if (!selectedDriverId || !selectedVehicleId) {
      toast({ title: "Error", description: "Selecciona un vehículo", variant: "destructive" });
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
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleCreateAndAssignVehicle = async () => {
    if (!selectedDriverId || !newVehicle.license_plate) {
      toast({ title: "Error", description: "La placa es obligatoria", variant: "destructive" });
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
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const openVehicleDialog = (driverId: string) => {
    setSelectedDriverId(driverId);
    setVehicleDialogOpen(true);
  };

  const availableVehicles = vehicles.filter(v => !v.driver_id);

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (user.username?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (user.phone || '').includes(searchTerm);
    
    const matchesType = filterType === 'all' || user.user_type === filterType;
    
    return matchesSearch && matchesType;
  });

  const getUserTypeLabel = (type: string | null) => {
    switch (type) {
      case 'driver': return 'Conductor';
      case 'passenger': return 'Pasajero';
      case 'admin_parroquia': return 'Admin Municipio';
      default: return type || 'Sin tipo';
    }
  };

  const getUserTypeColor = (type: string | null) => {
    switch (type) {
      case 'admin_parroquia': return 'bg-blue-100 text-blue-700';
      case 'driver': return 'bg-orange-100 text-orange-700';
      case 'passenger': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getDriverVehicle = (driverId: string) => {
    return vehicles.find(v => v.driver_id === driverId);
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

      {/* User Detail Dialog */}
      <Dialog open={!!userDetailDialog} onOpenChange={() => setUserDetailDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Información del Usuario</DialogTitle>
          </DialogHeader>
          {userDetailDialog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Nombre Completo</Label>
                  <p className="font-medium">{userDetailDialog.full_name || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Usuario</Label>
                  <p className="font-medium">{userDetailDialog.username || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Tipo</Label>
                  <Badge className={getUserTypeColor(userDetailDialog.user_type)}>
                    {getUserTypeLabel(userDetailDialog.user_type)}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Estado</Label>
                  <Badge variant={userDetailDialog.is_active !== false ? 'default' : 'destructive'}>
                    {userDetailDialog.is_active !== false ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Teléfono</Label>
                  <p className="font-medium">{userDetailDialog.phone || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Dirección</Label>
                  <p className="font-medium">{userDetailDialog.direccion || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Calle</Label>
                  <p className="font-medium">{userDetailDialog.calle || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Sector</Label>
                  <p className="font-medium">{userDetailDialog.sector || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Fecha de Nacimiento</Label>
                  <p className="font-medium">
                    {userDetailDialog.fecha_nacimiento 
                      ? `${userDetailDialog.fecha_nacimiento} (${calculateAge(userDetailDialog.fecha_nacimiento)} años)` 
                      : '-'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Registro</Label>
                  <p className="font-medium">
                    {new Date(userDetailDialog.created_at).toLocaleDateString('es-VE')}
                  </p>
                </div>
              </div>
              
              {userDetailDialog.user_type === 'driver' && (
                <div className="border-t pt-4">
                  <Label className="text-muted-foreground text-xs">Vehículo Asignado</Label>
                  {(() => {
                    const vehicle = getDriverVehicle(userDetailDialog.id);
                    if (vehicle) {
                      return (
                        <div className="bg-muted p-3 rounded-lg mt-1">
                          <p className="font-medium">Placa: {vehicle.license_plate}</p>
                          <p className="text-sm text-muted-foreground">Modelo: {vehicle.model || '-'}</p>
                          <p className="text-sm text-muted-foreground">Capacidad: {vehicle.capacity || 30} pasajeros</p>
                          <p className="text-sm text-muted-foreground">Estado: {vehicle.status || 'active'}</p>
                        </div>
                      );
                    }
                    return <p className="text-muted-foreground">Sin vehículo asignado</p>;
                  })()}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <div>
                <Label>Fecha de Nacimiento</Label>
                <Input 
                  type="date"
                  value={newUser.fecha_nacimiento} 
                  onChange={(e) => setNewUser({...newUser, fecha_nacimiento: e.target.value})}
                />
              </div>
              <div>
                <Label>Sector</Label>
                <Input 
                  value={newUser.sector} 
                  onChange={(e) => setNewUser({...newUser, sector: e.target.value})}
                  placeholder="Centro"
                />
              </div>
              <div>
                <Label>Calle</Label>
                <Input 
                  value={newUser.calle} 
                  onChange={(e) => setNewUser({...newUser, calle: e.target.value})}
                  placeholder="Calle Principal"
                />
              </div>
              <div className="md:col-span-2">
                <Label>Dirección Completa</Label>
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
                  <TableHead>Estado</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Vehículo</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>
                      {editingId === user.id ? (
                        <Input 
                          value={editData.full_name || ''} 
                          onChange={(e) => setEditData({...editData, full_name: e.target.value})}
                        />
                      ) : (
                        user.full_name || '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === user.id ? (
                        <Input 
                          value={editData.username || ''} 
                          onChange={(e) => setEditData({...editData, username: e.target.value})}
                        />
                      ) : (
                        user.username || '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUserTypeColor(user.user_type)}`}>
                        {getUserTypeLabel(user.user_type)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active !== false ? 'default' : 'destructive'}>
                        {user.is_active !== false ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {editingId === user.id ? (
                        <Input 
                          value={editData.phone || ''} 
                          onChange={(e) => setEditData({...editData, phone: e.target.value})}
                        />
                      ) : (
                        user.phone || '-'
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
                    <TableCell className="text-right space-x-1">
                      {editingId === user.id ? (
                        <>
                          <Button size="sm" onClick={handleSave} disabled={loading}>
                            <Save size={16} />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                            <X size={16} />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => setUserDetailDialog(user)}>
                            <Eye size={16} />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleEdit(user)}>
                            <Edit size={16} />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleToggleActive(user)}
                          >
                            {user.is_active !== false ? <PowerOff size={16} /> : <Power size={16} />}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => handleDelete(user.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
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
