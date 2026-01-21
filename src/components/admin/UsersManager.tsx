import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Save, X, Search, Car, Eye, Power, PowerOff, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface User {
  id: string;
  full_name: string | null;
  username: string | null;
  user_type: string | null;
  phone: string | null;
  parroquia_id: string | null;
  direccion: string | null;
  calle: string | null;
  sector: string | null;
  fecha_nacimiento: string | null;
  is_active?: boolean | null;
  parroquia?: { nombre: string };
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
  capacity: number | null;
  status: string | null;
  route_id: string | null;
}

interface Route {
  id: string;
  name: string;
}

interface DriverPayment {
  id?: string;
  driver_id: string;
  payment_method: 'pago_movil' | 'transferencia';
  pm_telefono?: string;
  pm_cedula?: string;
  pm_banco?: string;
  tf_banco?: string;
  tf_tipo_cuenta?: string;
  tf_numero_cuenta?: string;
  tf_titular?: string;
  tf_cedula?: string;
}

const BANCOS = [
  'Banco de Venezuela',
  'Banesco',
  'BBVA Provincial',
  'Banco Mercantil',
  'Banco Nacional de Crédito (BNC)',
  'Banco del Tesoro',
  'Banco Bicentenario',
  'Banco Exterior',
  'Banco Caroní',
  'Banco Activo',
  'Bancamiga',
  '100% Banco',
  'Banco del Caribe'
];

const UsersManager: React.FC = () => {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [parroquias, setParroquias] = useState<Parroquia[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterParroquia, setFilterParroquia] = useState<string>('all');

  // Dialogs
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false);
  const [userDetailDialog, setUserDetailDialog] = useState<User | null>(null);
  
  // Edit state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editData, setEditData] = useState<Partial<User>>({});
  
  // Vehicle assignment
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [showCreateVehicle, setShowCreateVehicle] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    license_plate: '',
    model: '',
    capacity: '30',
    route_id: ''
  });

  // Driver payment
  const [driverPayment, setDriverPayment] = useState<Partial<DriverPayment>>({
    payment_method: 'pago_movil'
  });
  const [driverPayments, setDriverPayments] = useState<Record<string, DriverPayment>>({});
  
  // New user form
  const [newUser, setNewUser] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    phone: '',
    parroquia_id: '',
    user_type: 'passenger' as 'passenger' | 'driver' | 'admin_parroquia',
    direccion: '',
    calle: '',
    sector: '',
    fecha_nacimiento: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, parroquiasRes, vehiclesRes, routesRes, paymentsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('parroquias').select('id, nombre').eq('is_active', true),
        supabase.from('vehicles').select('id, license_plate, model, driver_id, capacity, status, route_id'),
        supabase.from('bus_routes').select('id, name').eq('is_active', true),
        supabase.from('driver_payments').select('*')
      ]);

      if (usersRes.error) throw usersRes.error;
      if (parroquiasRes.error) throw parroquiasRes.error;

      const enrichedUsers = (usersRes.data || []).map(user => {
        const parroquia = parroquiasRes.data?.find(p => p.id === user.parroquia_id);
        return { ...user, parroquia };
      });

      setUsers(enrichedUsers);
      setParroquias(parroquiasRes.data || []);
      setVehicles(vehiclesRes.data || []);
      setRoutes(routesRes.data || []);
      
      // Build payments map
      const paymentsMap: Record<string, DriverPayment> = {};
      (paymentsRes.data || []).forEach((p: any) => {
        paymentsMap[p.driver_id] = p;
      });
      setDriverPayments(paymentsMap);
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
    const trimmedPassword = newUser.password;

    if (!trimmedName || !trimmedEmail || !trimmedPassword) {
      toast({ title: "Error", description: "Nombre, email y contraseña son obligatorios", variant: "destructive" });
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      toast({ title: "Error", description: "El formato del email no es válido", variant: "destructive" });
      return;
    }

    if (trimmedPassword.length < 6) {
      toast({ title: "Error", description: "La contraseña debe tener al menos 6 caracteres", variant: "destructive" });
      return;
    }

    if (newUser.user_type === 'admin_parroquia' && !newUser.parroquia_id) {
      toast({ title: "Error", description: "Debe seleccionar un municipio para el administrador", variant: "destructive" });
      return;
    }

    // Validate payment data for drivers
    if (newUser.user_type === 'driver') {
      if (!driverPayment.payment_method) {
        toast({ title: "Error", description: "Debe seleccionar un método de pago", variant: "destructive" });
        return;
      }
      if (driverPayment.payment_method === 'pago_movil') {
        if (!driverPayment.pm_telefono || !driverPayment.pm_cedula || !driverPayment.pm_banco) {
          toast({ title: "Error", description: "Complete todos los datos de Pago Móvil", variant: "destructive" });
          return;
        }
      } else {
        if (!driverPayment.tf_banco || !driverPayment.tf_numero_cuenta || !driverPayment.tf_titular || !driverPayment.tf_cedula) {
          toast({ title: "Error", description: "Complete todos los datos de Transferencia", variant: "destructive" });
          return;
        }
      }
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
            parroquia_id: newUser.parroquia_id || null,
            direccion: newUser.direccion.trim() || null,
            calle: newUser.calle.trim() || null,
            sector: newUser.sector.trim() || null
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (authError) throw authError;

      if (newUser.user_type === 'admin_parroquia' && authData.user) {
        await supabase.from('user_roles').insert({
          user_id: authData.user.id,
          role: 'admin_parroquia' as const,
          parroquia_id: newUser.parroquia_id
        });
      }

      // Save driver payment info
      if (newUser.user_type === 'driver' && authData.user) {
        await supabase.from('driver_payments').insert({
          driver_id: authData.user.id,
          payment_method: driverPayment.payment_method,
          pm_telefono: driverPayment.pm_telefono || null,
          pm_cedula: driverPayment.pm_cedula || null,
          pm_banco: driverPayment.pm_banco || null,
          tf_banco: driverPayment.tf_banco || null,
          tf_tipo_cuenta: driverPayment.tf_tipo_cuenta || null,
          tf_numero_cuenta: driverPayment.tf_numero_cuenta || null,
          tf_titular: driverPayment.tf_titular || null,
          tf_cedula: driverPayment.tf_cedula || null
        });

        setSelectedDriverId(authData.user.id);
        setVehicleDialogOpen(true);
      }

      toast({ title: "Éxito", description: "Usuario creado exitosamente" });
      setCreateUserDialogOpen(false);
      resetNewUserForm();
      loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resetNewUserForm = () => {
    setNewUser({
      name: '', username: '', email: '', password: '', phone: '',
      parroquia_id: '', user_type: 'passenger', direccion: '', calle: '', sector: '', fecha_nacimiento: ''
    });
    setDriverPayment({ payment_method: 'pago_movil' });
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setEditData({ ...user });
    
    // Load payment info if driver
    if (user.user_type === 'driver' && driverPayments[user.id]) {
      setDriverPayment(driverPayments[user.id]);
    } else {
      setDriverPayment({ payment_method: 'pago_movil' });
    }
    
    setEditUserDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    if (editingUser.user_type === 'admin_general' && editData.user_type !== 'admin_general') {
      toast({ title: "Error", description: "No se puede cambiar el tipo del Administrador General", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      
      const updateData: any = {
        full_name: editData.full_name,
        username: editData.username,
        phone: editData.phone,
        user_type: editData.user_type,
        parroquia_id: editData.parroquia_id || null,
        direccion: editData.direccion,
        calle: editData.calle,
        sector: editData.sector,
        is_active: editData.is_active
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', editingUser.id);

      if (error) throw error;

      // Handle admin role
      if (editData.user_type === 'admin_parroquia' && editData.parroquia_id) {
        const { data: existingRole } = await supabase
          .from('user_roles')
          .select('id')
          .eq('user_id', editingUser.id)
          .eq('role', 'admin_parroquia')
          .single();

        if (!existingRole) {
          await supabase.from('user_roles').insert({
            user_id: editingUser.id,
            role: 'admin_parroquia',
            parroquia_id: editData.parroquia_id
          });
        } else {
          await supabase.from('user_roles')
            .update({ parroquia_id: editData.parroquia_id })
            .eq('user_id', editingUser.id)
            .eq('role', 'admin_parroquia');
        }
      }

      // Update driver payment info
      if (editData.user_type === 'driver') {
        const existingPayment = driverPayments[editingUser.id];
        const paymentData = {
          driver_id: editingUser.id,
          payment_method: driverPayment.payment_method!,
          pm_telefono: driverPayment.pm_telefono || null,
          pm_cedula: driverPayment.pm_cedula || null,
          pm_banco: driverPayment.pm_banco || null,
          tf_banco: driverPayment.tf_banco || null,
          tf_tipo_cuenta: driverPayment.tf_tipo_cuenta || null,
          tf_numero_cuenta: driverPayment.tf_numero_cuenta || null,
          tf_titular: driverPayment.tf_titular || null,
          tf_cedula: driverPayment.tf_cedula || null
        };

        if (existingPayment) {
          await supabase.from('driver_payments').update(paymentData).eq('driver_id', editingUser.id);
        } else {
          await supabase.from('driver_payments').insert(paymentData);
        }
      }

      toast({ title: "Éxito", description: "Usuario actualizado" });
      setEditUserDialogOpen(false);
      setEditingUser(null);
      loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const user = users.find(u => u.id === id);
    if (user?.user_type === 'admin_general') {
      toast({ title: "Error", description: "No se puede eliminar al Administrador General", variant: "destructive" });
      return;
    }

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
    if (user.user_type === 'admin_general') {
      toast({ title: "Error", description: "No se puede desactivar al Administrador General", variant: "destructive" });
      return;
    }

    try {
      const newActiveState = user.is_active === false ? true : false;
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: newActiveState })
        .eq('id', user.id);

      if (error) throw error;
      toast({ title: "Éxito", description: `Usuario ${newActiveState ? 'activado' : 'desactivado'} correctamente` });
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
      toast({ title: "Éxito", description: "Vehículo creado y asignado" });
      setVehicleDialogOpen(false);
      setSelectedDriverId(null);
      setNewVehicle({ license_plate: '', model: '', capacity: '30', route_id: '' });
      setShowCreateVehicle(false);
      loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const availableVehicles = vehicles.filter(v => !v.driver_id);

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
      case 'admin_parroquia': return 'Admin Municipio';
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

  const getDriverVehicle = (driverId: string) => vehicles.find(v => v.driver_id === driverId);

  const calculateAge = (birthDate: string | null): number | null => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  return (
    <div className="space-y-6">
      {/* Create User Dialog */}
      <Dialog open={createUserDialogOpen} onOpenChange={setCreateUserDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Usuario</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Tipo de Usuario *</Label>
              <Select value={newUser.user_type} onValueChange={(v: any) => setNewUser({ ...newUser, user_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="passenger">Pasajero</SelectItem>
                  <SelectItem value="driver">Conductor</SelectItem>
                  <SelectItem value="admin_parroquia">Administrador de Municipio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nombre Completo *</Label>
              <Input value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} placeholder="Juan Pérez" />
            </div>
            <div>
              <Label>Usuario</Label>
              <Input value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} placeholder="juanperez" />
            </div>
            <div>
              <Label>Email *</Label>
              <Input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="juan@email.com" />
            </div>
            <div>
              <Label>Contraseña *</Label>
              <Input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} placeholder="Mínimo 6 caracteres" />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input value={newUser.phone} onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })} placeholder="0412-1234567" />
            </div>
            <div>
              <Label>Municipio {newUser.user_type === 'admin_parroquia' && '*'}</Label>
              <Select value={newUser.parroquia_id} onValueChange={(v) => setNewUser({ ...newUser, parroquia_id: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {parroquias.map((p) => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fecha de Nacimiento</Label>
              <Input type="date" value={newUser.fecha_nacimiento} onChange={(e) => setNewUser({ ...newUser, fecha_nacimiento: e.target.value })} />
            </div>
            <div>
              <Label>Sector</Label>
              <Input value={newUser.sector} onChange={(e) => setNewUser({ ...newUser, sector: e.target.value })} placeholder="Centro" />
            </div>
            <div>
              <Label>Calle</Label>
              <Input value={newUser.calle} onChange={(e) => setNewUser({ ...newUser, calle: e.target.value })} placeholder="Calle Principal" />
            </div>
            <div className="md:col-span-2">
              <Label>Dirección Completa</Label>
              <Input value={newUser.direccion} onChange={(e) => setNewUser({ ...newUser, direccion: e.target.value })} placeholder="Calle Principal, Casa #123" />
            </div>

            {/* Driver Payment Section */}
            {newUser.user_type === 'driver' && (
              <div className="md:col-span-2 border-t pt-4 mt-2">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><CreditCard size={18} /> Información de Pago</h3>
                <div className="space-y-4">
                  <div>
                    <Label>Método de Pago *</Label>
                    <Select value={driverPayment.payment_method} onValueChange={(v: any) => setDriverPayment({ ...driverPayment, payment_method: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pago_movil">Pago Móvil</SelectItem>
                        <SelectItem value="transferencia">Transferencia Bancaria</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {driverPayment.payment_method === 'pago_movil' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                      <div>
                        <Label>Teléfono *</Label>
                        <Input value={driverPayment.pm_telefono || ''} onChange={(e) => setDriverPayment({ ...driverPayment, pm_telefono: e.target.value })} placeholder="0412-1234567" />
                      </div>
                      <div>
                        <Label>Cédula *</Label>
                        <Input value={driverPayment.pm_cedula || ''} onChange={(e) => setDriverPayment({ ...driverPayment, pm_cedula: e.target.value })} placeholder="V-12345678" />
                      </div>
                      <div>
                        <Label>Banco *</Label>
                        <Select value={driverPayment.pm_banco || ''} onValueChange={(v) => setDriverPayment({ ...driverPayment, pm_banco: v })}>
                          <SelectTrigger><SelectValue placeholder="Seleccionar banco" /></SelectTrigger>
                          <SelectContent>
                            {BANCOS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {driverPayment.payment_method === 'transferencia' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                      <div>
                        <Label>Banco *</Label>
                        <Select value={driverPayment.tf_banco || ''} onValueChange={(v) => setDriverPayment({ ...driverPayment, tf_banco: v })}>
                          <SelectTrigger><SelectValue placeholder="Seleccionar banco" /></SelectTrigger>
                          <SelectContent>
                            {BANCOS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Tipo de Cuenta</Label>
                        <Select value={driverPayment.tf_tipo_cuenta || ''} onValueChange={(v) => setDriverPayment({ ...driverPayment, tf_tipo_cuenta: v })}>
                          <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="corriente">Corriente</SelectItem>
                            <SelectItem value="ahorro">Ahorro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Número de Cuenta *</Label>
                        <Input value={driverPayment.tf_numero_cuenta || ''} onChange={(e) => setDriverPayment({ ...driverPayment, tf_numero_cuenta: e.target.value })} placeholder="01020123456789012345" />
                      </div>
                      <div>
                        <Label>Titular *</Label>
                        <Input value={driverPayment.tf_titular || ''} onChange={(e) => setDriverPayment({ ...driverPayment, tf_titular: e.target.value })} placeholder="Juan Pérez" />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Cédula del Titular *</Label>
                        <Input value={driverPayment.tf_cedula || ''} onChange={(e) => setDriverPayment({ ...driverPayment, tf_cedula: e.target.value })} placeholder="V-12345678" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => { setCreateUserDialogOpen(false); resetNewUserForm(); }}>Cancelar</Button>
            <Button onClick={handleAddUser} disabled={loading}><Plus size={16} className="mr-2" />Crear Usuario</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editUserDialogOpen} onOpenChange={setEditUserDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nombre Completo</Label>
                <Input value={editData.full_name || ''} onChange={(e) => setEditData({ ...editData, full_name: e.target.value })} />
              </div>
              <div>
                <Label>Usuario</Label>
                <Input value={editData.username || ''} onChange={(e) => setEditData({ ...editData, username: e.target.value })} />
              </div>
              <div>
                <Label>Tipo de Usuario</Label>
                <Select 
                  value={editData.user_type || 'passenger'} 
                  onValueChange={(v) => setEditData({ ...editData, user_type: v })}
                  disabled={editingUser.user_type === 'admin_general'}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="passenger">Pasajero</SelectItem>
                    <SelectItem value="driver">Conductor</SelectItem>
                    <SelectItem value="admin_parroquia">Admin Municipio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Estado</Label>
                <Select 
                  value={editData.is_active !== false ? 'active' : 'inactive'} 
                  onValueChange={(v) => setEditData({ ...editData, is_active: v === 'active' })}
                  disabled={editingUser.user_type === 'admin_general'}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input value={editData.phone || ''} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} />
              </div>
              <div>
                <Label>Municipio</Label>
                <Select value={editData.parroquia_id || ''} onValueChange={(v) => setEditData({ ...editData, parroquia_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {parroquias.map((p) => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Sector</Label>
                <Input value={editData.sector || ''} onChange={(e) => setEditData({ ...editData, sector: e.target.value })} />
              </div>
              <div>
                <Label>Calle</Label>
                <Input value={editData.calle || ''} onChange={(e) => setEditData({ ...editData, calle: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Label>Dirección</Label>
                <Input value={editData.direccion || ''} onChange={(e) => setEditData({ ...editData, direccion: e.target.value })} />
              </div>

              {/* Vehicle info for drivers */}
              {editData.user_type === 'driver' && (
                <div className="md:col-span-2 border-t pt-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2"><Car size={18} /> Vehículo Asignado</h3>
                  {(() => {
                    const vehicle = getDriverVehicle(editingUser.id);
                    if (vehicle) {
                      return (
                        <div className="p-3 bg-muted rounded-lg">
                          <p>Placa: <strong>{vehicle.license_plate}</strong></p>
                          <p>Modelo: {vehicle.model || '-'}</p>
                          <p>Capacidad: {vehicle.capacity || 30}</p>
                        </div>
                      );
                    }
                    return (
                      <Button variant="outline" onClick={() => {
                        setSelectedDriverId(editingUser.id);
                        setVehicleDialogOpen(true);
                      }}>
                        <Car size={16} className="mr-2" />Asignar Vehículo
                      </Button>
                    );
                  })()}
                </div>
              )}

              {/* Payment info for drivers */}
              {editData.user_type === 'driver' && (
                <div className="md:col-span-2 border-t pt-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2"><CreditCard size={18} /> Información de Pago</h3>
                  <div className="space-y-4">
                    <div>
                      <Label>Método de Pago</Label>
                      <Select value={driverPayment.payment_method} onValueChange={(v: any) => setDriverPayment({ ...driverPayment, payment_method: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pago_movil">Pago Móvil</SelectItem>
                          <SelectItem value="transferencia">Transferencia Bancaria</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {driverPayment.payment_method === 'pago_movil' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                        <div>
                          <Label>Teléfono</Label>
                          <Input value={driverPayment.pm_telefono || ''} onChange={(e) => setDriverPayment({ ...driverPayment, pm_telefono: e.target.value })} />
                        </div>
                        <div>
                          <Label>Cédula</Label>
                          <Input value={driverPayment.pm_cedula || ''} onChange={(e) => setDriverPayment({ ...driverPayment, pm_cedula: e.target.value })} />
                        </div>
                        <div>
                          <Label>Banco</Label>
                          <Select value={driverPayment.pm_banco || ''} onValueChange={(v) => setDriverPayment({ ...driverPayment, pm_banco: v })}>
                            <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                            <SelectContent>
                              {BANCOS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {driverPayment.payment_method === 'transferencia' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                        <div>
                          <Label>Banco</Label>
                          <Select value={driverPayment.tf_banco || ''} onValueChange={(v) => setDriverPayment({ ...driverPayment, tf_banco: v })}>
                            <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                            <SelectContent>
                              {BANCOS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Tipo de Cuenta</Label>
                          <Select value={driverPayment.tf_tipo_cuenta || ''} onValueChange={(v) => setDriverPayment({ ...driverPayment, tf_tipo_cuenta: v })}>
                            <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="corriente">Corriente</SelectItem>
                              <SelectItem value="ahorro">Ahorro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Número de Cuenta</Label>
                          <Input value={driverPayment.tf_numero_cuenta || ''} onChange={(e) => setDriverPayment({ ...driverPayment, tf_numero_cuenta: e.target.value })} />
                        </div>
                        <div>
                          <Label>Titular</Label>
                          <Input value={driverPayment.tf_titular || ''} onChange={(e) => setDriverPayment({ ...driverPayment, tf_titular: e.target.value })} />
                        </div>
                        <div className="md:col-span-2">
                          <Label>Cédula del Titular</Label>
                          <Input value={driverPayment.tf_cedula || ''} onChange={(e) => setDriverPayment({ ...driverPayment, tf_cedula: e.target.value })} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setEditUserDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={loading}><Save size={16} className="mr-2" />Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                    <SelectTrigger><SelectValue placeholder="Seleccionar vehículo" /></SelectTrigger>
                    <SelectContent>
                      {availableVehicles.map((v) => (
                        <SelectItem key={v.id} value={v.id}>{v.license_plate} - {v.model || 'Sin modelo'}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAssignVehicle} disabled={!selectedVehicleId}>Asignar Vehículo</Button>
                  <Button variant="outline" onClick={() => setShowCreateVehicle(true)}>Crear Nuevo</Button>
                  <Button variant="ghost" onClick={() => setVehicleDialogOpen(false)}>Omitir</Button>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Placa *</Label>
                    <Input value={newVehicle.license_plate} onChange={(e) => setNewVehicle({ ...newVehicle, license_plate: e.target.value })} />
                  </div>
                  <div>
                    <Label>Modelo</Label>
                    <Input value={newVehicle.model} onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })} />
                  </div>
                  <div>
                    <Label>Capacidad</Label>
                    <Input type="number" value={newVehicle.capacity} onChange={(e) => setNewVehicle({ ...newVehicle, capacity: e.target.value })} />
                  </div>
                  <div>
                    <Label>Ruta</Label>
                    <Select value={newVehicle.route_id} onValueChange={(v) => setNewVehicle({ ...newVehicle, route_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>
                        {routes.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreateAndAssignVehicle}>Crear y Asignar</Button>
                  <Button variant="outline" onClick={() => setShowCreateVehicle(false)}>Volver</Button>
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
                  <Badge className={getUserTypeColor(userDetailDialog.user_type)}>{getUserTypeLabel(userDetailDialog.user_type)}</Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Estado</Label>
                  <Badge variant={userDetailDialog.is_active !== false ? 'default' : 'destructive'}>
                    {userDetailDialog.is_active !== false ? 'Activo' : 'Desactivado'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Teléfono</Label>
                  <p className="font-medium">{userDetailDialog.phone || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Municipio</Label>
                  <p className="font-medium">{userDetailDialog.parroquia?.nombre || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Dirección</Label>
                  <p className="font-medium">{userDetailDialog.direccion || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Sector</Label>
                  <p className="font-medium">{userDetailDialog.sector || '-'}</p>
                </div>
              </div>
              
              {userDetailDialog.user_type === 'driver' && (
                <>
                  <div className="border-t pt-4">
                    <Label className="text-muted-foreground text-xs">Vehículo Asignado</Label>
                    {(() => {
                      const vehicle = getDriverVehicle(userDetailDialog.id);
                      if (vehicle) {
                        return (
                          <div className="bg-muted p-3 rounded-lg mt-1">
                            <p className="font-medium">Placa: {vehicle.license_plate}</p>
                            <p className="text-sm text-muted-foreground">Modelo: {vehicle.model || '-'}</p>
                            <p className="text-sm text-muted-foreground">Capacidad: {vehicle.capacity || 30}</p>
                          </div>
                        );
                      }
                      return <p className="text-muted-foreground">Sin vehículo asignado</p>;
                    })()}
                  </div>
                  <div className="border-t pt-4">
                    <Label className="text-muted-foreground text-xs">Información de Pago</Label>
                    {(() => {
                      const payment = driverPayments[userDetailDialog.id];
                      if (payment) {
                        return (
                          <div className="bg-muted p-3 rounded-lg mt-1">
                            <p className="font-medium">Método: {payment.payment_method === 'pago_movil' ? 'Pago Móvil' : 'Transferencia'}</p>
                            {payment.payment_method === 'pago_movil' ? (
                              <>
                                <p className="text-sm">Tel: {payment.pm_telefono}</p>
                                <p className="text-sm">Cédula: {payment.pm_cedula}</p>
                                <p className="text-sm">Banco: {payment.pm_banco}</p>
                              </>
                            ) : (
                              <>
                                <p className="text-sm">Banco: {payment.tf_banco}</p>
                                <p className="text-sm">Cuenta: {payment.tf_numero_cuenta}</p>
                                <p className="text-sm">Titular: {payment.tf_titular}</p>
                              </>
                            )}
                          </div>
                        );
                      }
                      return <p className="text-muted-foreground">Sin información de pago</p>;
                    })()}
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
        <Button onClick={() => setCreateUserDialogOpen(true)}>
          <Plus className="mr-2" size={16} />Nuevo Usuario
        </Button>
      </div>

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
              <Input placeholder="Buscar por nombre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger><SelectValue placeholder="Filtrar por tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="passenger">Pasajeros</SelectItem>
                <SelectItem value="driver">Conductores</SelectItem>
                <SelectItem value="admin_parroquia">Admin Municipio</SelectItem>
                <SelectItem value="admin_general">Admin General</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterParroquia} onValueChange={setFilterParroquia}>
              <SelectTrigger><SelectValue placeholder="Filtrar por municipio" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los municipios</SelectItem>
                {parroquias.map((p) => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Municipio</TableHead>
                <TableHead>Vehículo</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.full_name || 'Sin nombre'}</TableCell>
                  <TableCell>{user.username || '-'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${getUserTypeColor(user.user_type)}`}>
                      {getUserTypeLabel(user.user_type)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {user.is_active !== false ? (
                      <Badge variant="default">Activo</Badge>
                    ) : (
                      <Badge variant="destructive">Desactivado</Badge>
                    )}
                  </TableCell>
                  <TableCell>{user.phone || '-'}</TableCell>
                  <TableCell>{user.parroquia?.nombre || '-'}</TableCell>
                  <TableCell>
                    {user.user_type === 'driver' ? (
                      getDriverVehicle(user.id) ? (
                        <span className="text-sm">{getDriverVehicle(user.id)?.license_plate}</span>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => {
                          setSelectedDriverId(user.id);
                          setVehicleDialogOpen(true);
                        }}>
                          <Car size={14} className="mr-1" />Asignar
                        </Button>
                      )
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="sm" variant="ghost" onClick={() => setUserDetailDialog(user)}>
                      <Eye size={16} />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openEditDialog(user)}>
                      <Edit size={16} />
                    </Button>
                    {user.user_type !== 'admin_general' && (
                      <Button 
                        size="sm" 
                        variant={user.is_active !== false ? 'outline' : 'default'}
                        onClick={() => handleToggleActive(user)}
                        className={user.is_active === false ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                      >
                        {user.is_active !== false ? <PowerOff size={16} /> : <Power size={16} />}
                      </Button>
                    )}
                    {user.user_type !== 'admin_general' && (
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(user.id)}>
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No se encontraron usuarios
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsersManager;
