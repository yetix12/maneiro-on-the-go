
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Save, X, Eye, User, Car } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface ParishVehiclesManagerProps {
  parroquiaId?: string;
}

interface Driver {
  id: string;
  full_name: string | null;
  username: string | null;
  phone: string | null;
}

const ParishVehiclesManager: React.FC<ParishVehiclesManagerProps> = ({ parroquiaId }) => {
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [editingVehicle, setEditingVehicle] = useState<string | null>(null);
  const [editVehicleData, setEditVehicleData] = useState<any>({});
  const [vehicleDetailDialog, setVehicleDetailDialog] = useState<any>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    license_plate: '',
    model: '',
    capacity: '30',
    status: 'active',
    route_id: '',
    driver_id: ''
  });

  useEffect(() => {
    if (parroquiaId) {
      loadVehicles();
      loadRoutes();
      loadDrivers();
    }
  }, [parroquiaId]);

  const loadVehicles = async () => {
    if (!parroquiaId) return;
    
    // Cargar vehículos que pertenecen a rutas de esta parroquia o conductores de esta parroquia
    const { data: routeVehicles } = await supabase
      .from('vehicles')
      .select('*, bus_routes!inner(name, parroquia_id)')
      .eq('bus_routes.parroquia_id', parroquiaId);

    const { data: driverVehicles } = await supabase
      .from('vehicles')
      .select('*, bus_routes(name)')
      .in('driver_id', (await supabase
        .from('profiles')
        .select('id')
        .eq('parroquia_id', parroquiaId)
        .eq('user_type', 'driver')).data?.map(d => d.id) || []);

    // Combinar y eliminar duplicados
    const allVehicles = [...(routeVehicles || []), ...(driverVehicles || [])];
    const uniqueVehicles = allVehicles.filter((v, i, arr) => 
      arr.findIndex(x => x.id === v.id) === i
    );
    
    setVehicles(uniqueVehicles);
  };

  const loadRoutes = async () => {
    if (!parroquiaId) return;
    const { data } = await supabase
      .from('bus_routes')
      .select('id, name, color')
      .eq('parroquia_id', parroquiaId)
      .eq('is_active', true);
    setRoutes(data || []);
  };

  const loadDrivers = async () => {
    if (!parroquiaId) return;
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, username, phone')
      .eq('parroquia_id', parroquiaId)
      .eq('user_type', 'driver');
    setDrivers(data || []);
  };

  const getDriverForVehicle = (driverId: string | null): Driver | undefined => {
    return drivers.find(d => d.id === driverId);
  };

  const handleAddVehicle = async () => {
    if (!newVehicle.license_plate) {
      toast({ title: "Error", description: "La placa es obligatoria", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from('vehicles').insert([{
      license_plate: newVehicle.license_plate,
      model: newVehicle.model,
      capacity: parseInt(newVehicle.capacity) || 30,
      status: newVehicle.status,
      route_id: newVehicle.route_id || null,
      driver_id: newVehicle.driver_id || null
    }]);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Éxito", description: "Vehículo creado" });
      setNewVehicle({ license_plate: '', model: '', capacity: '30', status: 'active', route_id: '', driver_id: '' });
      setAddDialogOpen(false);
      loadVehicles();
    }
  };

  const handleSaveVehicle = async () => {
    if (!editingVehicle) return;
    
    const { error } = await supabase.from('vehicles').update({
      license_plate: editVehicleData.license_plate,
      model: editVehicleData.model,
      capacity: editVehicleData.capacity,
      status: editVehicleData.status,
      route_id: editVehicleData.route_id || null,
      driver_id: editVehicleData.driver_id || null
    }).eq('id', editingVehicle);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Éxito", description: "Vehículo actualizado" });
      setEditingVehicle(null);
      setEditDialogOpen(false);
      loadVehicles();
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!confirm('¿Eliminar este vehículo?')) return;
    const { error } = await supabase.from('vehicles').delete().eq('id', id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Éxito", description: "Vehículo eliminado" });
      loadVehicles();
    }
  };

  const openEditDialog = (vehicle: any) => {
    setEditingVehicle(vehicle.id);
    setEditVehicleData({
      ...vehicle,
      driver_id: vehicle.driver_id || ''
    });
    setEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Car className="h-6 w-6" />
          Gestión de Vehículos
        </h2>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus size={16} className="mr-2" />
          Nuevo Vehículo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vehículos Registrados ({vehicles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Placa</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Capacidad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Conductor</TableHead>
                <TableHead>Ruta</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No hay vehículos registrados en este municipio
                  </TableCell>
                </TableRow>
              ) : (
                vehicles.map(v => {
                  const driver = getDriverForVehicle(v.driver_id);
                  return (
                    <TableRow key={v.id}>
                      <TableCell className="font-mono font-bold">{v.license_plate}</TableCell>
                      <TableCell>{v.model || '-'}</TableCell>
                      <TableCell>{v.capacity} pasajeros</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          v.status === 'active' ? 'bg-green-100 text-green-700' :
                          v.status === 'maintenance' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {v.status === 'active' ? 'Activo' : v.status === 'maintenance' ? 'Mantenimiento' : 'Inactivo'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {driver ? (
                          <span className="text-sm">{driver.full_name || driver.username || 'Sin nombre'}</span>
                        ) : (
                          <span className="text-muted-foreground text-xs">Sin asignar</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {v.bus_routes?.name || '-'}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button size="sm" variant="outline" onClick={() => setVehicleDetailDialog({ vehicle: v, driver })} title="Ver información">
                          <Eye size={16} />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openEditDialog(v)} title="Editar">
                          <Edit size={16} />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteVehicle(v.id)} title="Eliminar">
                          <Trash2 size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog para agregar vehículo */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Car size={20} />
              Nuevo Vehículo
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Placa *</Label>
                <Input 
                  value={newVehicle.license_plate} 
                  onChange={(e) => setNewVehicle({...newVehicle, license_plate: e.target.value.toUpperCase()})} 
                  placeholder="ABC-123"
                />
              </div>
              <div>
                <Label>Modelo</Label>
                <Input 
                  value={newVehicle.model} 
                  onChange={(e) => setNewVehicle({...newVehicle, model: e.target.value})} 
                  placeholder="Toyota Hiace"
                />
              </div>
              <div>
                <Label>Capacidad</Label>
                <Input 
                  type="number" 
                  value={newVehicle.capacity} 
                  onChange={(e) => setNewVehicle({...newVehicle, capacity: e.target.value})} 
                />
              </div>
              <div>
                <Label>Estado</Label>
                <Select value={newVehicle.status} onValueChange={(v) => setNewVehicle({...newVehicle, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                    <SelectItem value="maintenance">Mantenimiento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ruta</Label>
                <Select value={newVehicle.route_id || "__none__"} onValueChange={(v) => setNewVehicle({...newVehicle, route_id: v === "__none__" ? "" : v})}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sin ruta</SelectItem>
                    {routes.map(r => (
                      <SelectItem key={r.id} value={r.id}>
                        <span className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: r.color }} />
                          {r.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Conductor</Label>
                <Select value={newVehicle.driver_id || "__none__"} onValueChange={(v) => setNewVehicle({...newVehicle, driver_id: v === "__none__" ? "" : v})}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sin asignar</SelectItem>
                    {drivers.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.full_name || d.username || 'Sin nombre'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleAddVehicle}>
                <Plus size={16} className="mr-2" />
                Crear Vehículo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar vehículo */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit size={20} />
              Editar Vehículo
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Placa *</Label>
                <Input 
                  value={editVehicleData.license_plate || ''} 
                  onChange={(e) => setEditVehicleData({...editVehicleData, license_plate: e.target.value.toUpperCase()})} 
                />
              </div>
              <div>
                <Label>Modelo</Label>
                <Input 
                  value={editVehicleData.model || ''} 
                  onChange={(e) => setEditVehicleData({...editVehicleData, model: e.target.value})} 
                />
              </div>
              <div>
                <Label>Capacidad</Label>
                <Input 
                  type="number" 
                  value={editVehicleData.capacity || 30} 
                  onChange={(e) => setEditVehicleData({...editVehicleData, capacity: parseInt(e.target.value) || 30})} 
                />
              </div>
              <div>
                <Label>Estado</Label>
                <Select value={editVehicleData.status || 'active'} onValueChange={(v) => setEditVehicleData({...editVehicleData, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                    <SelectItem value="maintenance">Mantenimiento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ruta</Label>
                <Select value={editVehicleData.route_id || "__none__"} onValueChange={(v) => setEditVehicleData({...editVehicleData, route_id: v === "__none__" ? "" : v})}>
                  <SelectTrigger><SelectValue placeholder="Sin ruta" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sin ruta</SelectItem>
                    {routes.map(r => (
                      <SelectItem key={r.id} value={r.id}>
                        <span className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: r.color }} />
                          {r.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Conductor</Label>
                <Select value={editVehicleData.driver_id || "__none__"} onValueChange={(v) => setEditVehicleData({...editVehicleData, driver_id: v === "__none__" ? "" : v})}>
                  <SelectTrigger><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sin asignar</SelectItem>
                    {drivers.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.full_name || d.username || 'Sin nombre'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSaveVehicle}>
                <Save size={16} className="mr-2" />
                Guardar Cambios
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para información completa del vehículo */}
      <Dialog open={!!vehicleDetailDialog} onOpenChange={() => setVehicleDetailDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Car size={20} />
              Información del Vehículo
            </DialogTitle>
          </DialogHeader>
          {vehicleDetailDialog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Placa</Label>
                  <p className="font-mono font-bold text-lg">{vehicleDetailDialog.vehicle.license_plate}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Modelo</Label>
                  <p className="font-medium">{vehicleDetailDialog.vehicle.model || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Capacidad</Label>
                  <p className="font-medium">{vehicleDetailDialog.vehicle.capacity} pasajeros</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Estado</Label>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    vehicleDetailDialog.vehicle.status === 'active' ? 'bg-green-100 text-green-700' :
                    vehicleDetailDialog.vehicle.status === 'maintenance' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {vehicleDetailDialog.vehicle.status === 'active' ? 'Activo' : vehicleDetailDialog.vehicle.status === 'maintenance' ? 'Mantenimiento' : 'Inactivo'}
                  </span>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground text-xs">Ruta Asignada</Label>
                  <p className="font-medium">{vehicleDetailDialog.vehicle.bus_routes?.name || 'Sin ruta asignada'}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <User size={16} />
                  Conductor Asignado
                </h4>
                {vehicleDetailDialog.driver ? (
                  <div className="grid grid-cols-2 gap-4 bg-muted/30 p-3 rounded-lg">
                    <div>
                      <Label className="text-muted-foreground text-xs">Nombre</Label>
                      <p className="font-medium">{vehicleDetailDialog.driver.full_name || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Usuario</Label>
                      <p className="font-medium">{vehicleDetailDialog.driver.username || '-'}</p>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-muted-foreground text-xs">Teléfono</Label>
                      <p className="font-medium">{vehicleDetailDialog.driver.phone || '-'}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No hay conductor asignado a este vehículo</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ParishVehiclesManager;
