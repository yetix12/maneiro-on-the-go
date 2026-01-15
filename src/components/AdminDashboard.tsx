import React, { useState, useEffect } from 'react';
import AdminSidebar from './admin/AdminSidebar';
import DashboardOverview from './admin/DashboardOverview';
import ParroquiasManager from './admin/ParroquiasManager';
import AdminsManager from './admin/AdminsManager';
import UsersManager from './admin/UsersManager';
import StatisticsPanel from './admin/StatisticsPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Edit, Trash2, Save, X, Upload, Clock, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Routes state
  const [routes, setRoutes] = useState<any[]>([]);
  const [editingRoute, setEditingRoute] = useState<string | null>(null);
  const [editRouteData, setEditRouteData] = useState<any>({});
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [newRoute, setNewRoute] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    short_route: '',
    long_route: '',
    route_identification: '',
    parroquia_id: '',
    frequency_minutes: '15',
    departure_time: '05:30',
    arrival_time: '21:00'
  });

  // Bus stops state
  const [busStops, setBusStops] = useState<any[]>([]);
  const [newBusStop, setNewBusStop] = useState({
    name: '',
    latitude: '',
    longitude: '',
    stop_order: '',
    route_id: ''
  });

  // Vehicles state
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [editingVehicle, setEditingVehicle] = useState<string | null>(null);
  const [editVehicleData, setEditVehicleData] = useState<any>({});
  const [newVehicle, setNewVehicle] = useState({
    license_plate: '',
    model: '',
    capacity: '30',
    status: 'active',
    route_id: ''
  });

  // Gallery state
  const [images, setImages] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [newImage, setNewImage] = useState({
    titulo: '',
    descripcion: '',
    imagen_url: '',
    categoria: '',
    bus_stop_ids: [] as string[]
  });

  // Parroquias for selects
  const [parroquias, setParroquias] = useState<any[]>([]);

  useEffect(() => {
    loadParroquias();
    loadRoutes();
    loadBusStops();
    loadVehicles();
    loadImages();
  }, []);

  const loadParroquias = async () => {
    const { data } = await supabase
      .from('parroquias')
      .select('id, nombre')
      .eq('is_active', true);
    setParroquias(data || []);
  };

  const loadRoutes = async () => {
    const { data } = await supabase
      .from('bus_routes')
      .select('*')
      .eq('is_active', true)
      .order('name');
    setRoutes(data || []);
  };

  const loadBusStops = async () => {
    const { data } = await supabase
      .from('bus_stops')
      .select('*, bus_routes(name, color)')
      .order('stop_order');
    setBusStops(data || []);
  };

  const loadVehicles = async () => {
    const { data } = await supabase
      .from('vehicles')
      .select('*, bus_routes(name)')
      .order('license_plate');
    setVehicles(data || []);
  };

  const loadImages = async () => {
    const { data } = await supabase
      .from('galeria_maneiro')
      .select('*')
      .order('created_at', { ascending: false });
    setImages(data || []);
  };

  // Route handlers
  const handleAddRoute = async () => {
    if (!newRoute.name) {
      toast({ title: "Error", description: "El nombre es obligatorio", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from('bus_routes').insert([{
      ...newRoute,
      frequency_minutes: parseInt(newRoute.frequency_minutes) || 15
    }]);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Éxito", description: "Ruta creada" });
      setNewRoute({ name: '', description: '', color: '#3B82F6', short_route: '', long_route: '', route_identification: '', parroquia_id: '', frequency_minutes: '15', departure_time: '05:30', arrival_time: '21:00' });
      loadRoutes();
    }
  };

  const handleSaveRoute = async () => {
    if (!editingRoute) return;
    const { error } = await supabase.from('bus_routes').update(editRouteData).eq('id', editingRoute);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Éxito", description: "Ruta actualizada" });
      setEditingRoute(null);
      loadRoutes();
    }
  };

  const handleDeleteRoute = async (id: string) => {
    if (!confirm('¿Eliminar esta ruta?')) return;
    const { error } = await supabase.from('bus_routes').update({ is_active: false }).eq('id', id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Éxito", description: "Ruta eliminada" });
      loadRoutes();
    }
  };

  // Bus stop handlers
  const handleAddBusStop = async () => {
    if (!newBusStop.name || !newBusStop.latitude || !newBusStop.longitude) {
      toast({ title: "Error", description: "Complete los campos obligatorios", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from('bus_stops').insert([{
      name: newBusStop.name,
      latitude: parseFloat(newBusStop.latitude),
      longitude: parseFloat(newBusStop.longitude),
      stop_order: parseInt(newBusStop.stop_order) || 0,
      route_id: newBusStop.route_id || null
    }]);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Éxito", description: "Parada creada" });
      setNewBusStop({ name: '', latitude: '', longitude: '', stop_order: '', route_id: '' });
      loadBusStops();
    }
  };

  const handleDeleteBusStop = async (id: string) => {
    if (!confirm('¿Eliminar esta parada?')) return;
    const { error } = await supabase.from('bus_stops').delete().eq('id', id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Éxito", description: "Parada eliminada" });
      loadBusStops();
    }
  };

  // Vehicle handlers
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
      route_id: newVehicle.route_id || null
    }]);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Éxito", description: "Vehículo creado" });
      setNewVehicle({ license_plate: '', model: '', capacity: '30', status: 'active', route_id: '' });
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

  // Gallery handlers
  const handleAddImage = async () => {
    if (!newImage.titulo || !newImage.imagen_url) {
      toast({ title: "Error", description: "Título y URL son obligatorios", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from('galeria_maneiro').insert([newImage]);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Éxito", description: "Imagen agregada" });
      setNewImage({ titulo: '', descripcion: '', imagen_url: '', categoria: '', bus_stop_ids: [] });
      loadImages();
    }
  };

  const handleDeleteImage = async (id: string) => {
    if (!confirm('¿Eliminar esta imagen?')) return;
    const { error } = await supabase.from('galeria_maneiro').delete().eq('id', id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Éxito", description: "Imagen eliminada" });
      loadImages();
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'parroquias':
        return <ParroquiasManager />;
      case 'admins':
        return <AdminsManager />;
      case 'users':
        return <UsersManager />;
      case 'statistics':
        return <StatisticsPanel />;
      case 'routes':
        return (
          <div className="space-y-6">
            {/* Selector de Ruta para Editar Tarifas/Horarios */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock size={20} />
                  Configurar Ruta (Tarifas, Horarios y Frecuencia)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Seleccionar Ruta</Label>
                    <Select value={selectedRouteId} onValueChange={(v) => {
                      setSelectedRouteId(v);
                      const route = routes.find(r => r.id === v);
                      if (route) setEditRouteData(route);
                    }}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar ruta para editar" /></SelectTrigger>
                      <SelectContent>
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
                  
                  {selectedRouteId && editRouteData && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/30">
                      <div>
                        <Label className="flex items-center gap-1"><DollarSign size={14} /> Tarifa Corta (Bs)</Label>
                        <Input 
                          value={editRouteData.short_route || ''} 
                          onChange={(e) => setEditRouteData({...editRouteData, short_route: e.target.value})} 
                          placeholder="Ej: 2.50" 
                        />
                      </div>
                      <div>
                        <Label className="flex items-center gap-1"><DollarSign size={14} /> Tarifa Larga (Bs)</Label>
                        <Input 
                          value={editRouteData.long_route || ''} 
                          onChange={(e) => setEditRouteData({...editRouteData, long_route: e.target.value})} 
                          placeholder="Ej: 4.00" 
                        />
                      </div>
                      <div>
                        <Label className="flex items-center gap-1"><Clock size={14} /> Frecuencia (min)</Label>
                        <Input 
                          type="number" 
                          value={editRouteData.frequency_minutes || 15} 
                          onChange={(e) => setEditRouteData({...editRouteData, frequency_minutes: parseInt(e.target.value) || 15})} 
                          placeholder="15" 
                        />
                      </div>
                      <div>
                        <Label>Hora de Salida</Label>
                        <Input 
                          type="time" 
                          value={editRouteData.departure_time || '05:30'} 
                          onChange={(e) => setEditRouteData({...editRouteData, departure_time: e.target.value})} 
                        />
                      </div>
                      <div>
                        <Label>Hora de Llegada</Label>
                        <Input 
                          type="time" 
                          value={editRouteData.arrival_time || '21:00'} 
                          onChange={(e) => setEditRouteData({...editRouteData, arrival_time: e.target.value})} 
                        />
                      </div>
                      <div className="flex items-end">
                        <Button onClick={async () => {
                          const { error } = await supabase.from('bus_routes').update({
                            short_route: editRouteData.short_route,
                            long_route: editRouteData.long_route,
                            frequency_minutes: editRouteData.frequency_minutes,
                            departure_time: editRouteData.departure_time,
                            arrival_time: editRouteData.arrival_time
                          }).eq('id', selectedRouteId);
                          if (error) {
                            toast({ title: "Error", description: error.message, variant: "destructive" });
                          } else {
                            toast({ title: "Éxito", description: "Configuración actualizada" });
                            loadRoutes();
                          }
                        }} className="w-full">
                          <Save size={16} className="mr-2" />Guardar Cambios
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Agregar Nueva Ruta</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Nombre *</Label>
                    <Input value={newRoute.name} onChange={(e) => setNewRoute({...newRoute, name: e.target.value})} placeholder="Nombre de la ruta" />
                  </div>
                  <div>
                    <Label>Identificación</Label>
                    <Input value={newRoute.route_identification} onChange={(e) => setNewRoute({...newRoute, route_identification: e.target.value})} placeholder="Ej: Ruta 4A" />
                  </div>
                  <div>
                    <Label>Color</Label>
                    <div className="flex gap-2">
                      <Input type="color" value={newRoute.color} onChange={(e) => setNewRoute({...newRoute, color: e.target.value})} className="w-16" />
                      <Input value={newRoute.color} onChange={(e) => setNewRoute({...newRoute, color: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <Label>Tarifa Corta (Bs)</Label>
                    <Input value={newRoute.short_route} onChange={(e) => setNewRoute({...newRoute, short_route: e.target.value})} placeholder="Ej: 2.50" />
                  </div>
                  <div>
                    <Label>Tarifa Larga (Bs)</Label>
                    <Input value={newRoute.long_route} onChange={(e) => setNewRoute({...newRoute, long_route: e.target.value})} placeholder="Ej: 4.00" />
                  </div>
                  <div>
                    <Label>Frecuencia (min)</Label>
                    <Input type="number" value={newRoute.frequency_minutes} onChange={(e) => setNewRoute({...newRoute, frequency_minutes: e.target.value})} placeholder="15" />
                  </div>
                  <div>
                    <Label>Hora de Salida</Label>
                    <Input type="time" value={newRoute.departure_time} onChange={(e) => setNewRoute({...newRoute, departure_time: e.target.value})} />
                  </div>
                  <div>
                    <Label>Hora de Llegada</Label>
                    <Input type="time" value={newRoute.arrival_time} onChange={(e) => setNewRoute({...newRoute, arrival_time: e.target.value})} />
                  </div>
                  <div>
                    <Label>Parroquia</Label>
                    <Select value={newRoute.parroquia_id} onValueChange={(v) => setNewRoute({...newRoute, parroquia_id: v})}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>
                        {parroquias.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label>Descripción</Label>
                    <Input value={newRoute.description} onChange={(e) => setNewRoute({...newRoute, description: e.target.value})} placeholder="Descripción de la ruta" />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleAddRoute} className="w-full"><Plus size={16} className="mr-2" />Agregar</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Rutas Registradas</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Color</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Corta (Bs)</TableHead>
                      <TableHead>Larga (Bs)</TableHead>
                      <TableHead>Frecuencia</TableHead>
                      <TableHead>Horario</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {routes.map(route => (
                      <TableRow key={route.id}>
                        <TableCell><div className="w-6 h-6 rounded-full" style={{ backgroundColor: route.color }} /></TableCell>
                        <TableCell>{editingRoute === route.id ? <Input value={editRouteData.name} onChange={(e) => setEditRouteData({...editRouteData, name: e.target.value})} /> : route.name}</TableCell>
                        <TableCell>{route.route_identification || '-'}</TableCell>
                        <TableCell>{route.short_route || '-'}</TableCell>
                        <TableCell>{route.long_route || '-'}</TableCell>
                        <TableCell>{route.frequency_minutes || 15} min</TableCell>
                        <TableCell className="text-xs">{route.departure_time?.slice(0,5) || '05:30'} - {route.arrival_time?.slice(0,5) || '21:00'}</TableCell>
                        <TableCell className="text-right space-x-2">
                          {editingRoute === route.id ? (
                            <>
                              <Button size="sm" onClick={handleSaveRoute}><Save size={16} /></Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingRoute(null)}><X size={16} /></Button>
                            </>
                          ) : (
                            <>
                              <Button size="sm" variant="outline" onClick={() => { setEditingRoute(route.id); setEditRouteData(route); }}><Edit size={16} /></Button>
                              <Button size="sm" variant="destructive" onClick={() => handleDeleteRoute(route.id)}><Trash2 size={16} /></Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        );
      case 'bus-stops':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Agregar Parada</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <Label>Nombre *</Label>
                    <Input value={newBusStop.name} onChange={(e) => setNewBusStop({...newBusStop, name: e.target.value})} />
                  </div>
                  <div>
                    <Label>Latitud *</Label>
                    <Input type="number" step="0.000001" value={newBusStop.latitude} onChange={(e) => setNewBusStop({...newBusStop, latitude: e.target.value})} />
                  </div>
                  <div>
                    <Label>Longitud *</Label>
                    <Input type="number" step="0.000001" value={newBusStop.longitude} onChange={(e) => setNewBusStop({...newBusStop, longitude: e.target.value})} />
                  </div>
                  <div>
                    <Label>Orden</Label>
                    <Input type="number" value={newBusStop.stop_order} onChange={(e) => setNewBusStop({...newBusStop, stop_order: e.target.value})} />
                  </div>
                  <div>
                    <Label>Ruta</Label>
                    <Select value={newBusStop.route_id} onValueChange={(v) => setNewBusStop({...newBusStop, route_id: v})}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>
                        {routes.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleAddBusStop} className="mt-4"><Plus size={16} className="mr-2" />Agregar Parada</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Paradas Registradas ({busStops.length})</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Latitud</TableHead>
                      <TableHead>Longitud</TableHead>
                      <TableHead>Orden</TableHead>
                      <TableHead>Ruta</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {busStops.map(stop => (
                      <TableRow key={stop.id}>
                        <TableCell>{stop.name}</TableCell>
                        <TableCell>{stop.latitude}</TableCell>
                        <TableCell>{stop.longitude}</TableCell>
                        <TableCell>{stop.stop_order || '-'}</TableCell>
                        <TableCell>
                          {stop.bus_routes && (
                            <span className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stop.bus_routes.color }} />
                              {stop.bus_routes.name}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteBusStop(stop.id)}><Trash2 size={16} /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        );
      case 'vehicles':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Agregar Vehículo</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <Label>Placa *</Label>
                    <Input value={newVehicle.license_plate} onChange={(e) => setNewVehicle({...newVehicle, license_plate: e.target.value})} />
                  </div>
                  <div>
                    <Label>Modelo</Label>
                    <Input value={newVehicle.model} onChange={(e) => setNewVehicle({...newVehicle, model: e.target.value})} />
                  </div>
                  <div>
                    <Label>Capacidad</Label>
                    <Input type="number" value={newVehicle.capacity} onChange={(e) => setNewVehicle({...newVehicle, capacity: e.target.value})} />
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
                    <Select value={newVehicle.route_id} onValueChange={(v) => setNewVehicle({...newVehicle, route_id: v})}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>
                        {routes.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleAddVehicle} className="mt-4"><Plus size={16} className="mr-2" />Agregar Vehículo</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Vehículos Registrados ({vehicles.length})</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Placa</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead>Capacidad</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Ruta</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicles.map(v => (
                      <TableRow key={v.id}>
                        <TableCell className="font-mono">
                          {editingVehicle === v.id ? (
                            <Input value={editVehicleData.license_plate} onChange={(e) => setEditVehicleData({...editVehicleData, license_plate: e.target.value})} />
                          ) : v.license_plate}
                        </TableCell>
                        <TableCell>
                          {editingVehicle === v.id ? (
                            <Input value={editVehicleData.model || ''} onChange={(e) => setEditVehicleData({...editVehicleData, model: e.target.value})} />
                          ) : (v.model || '-')}
                        </TableCell>
                        <TableCell>
                          {editingVehicle === v.id ? (
                            <Input type="number" value={editVehicleData.capacity} onChange={(e) => setEditVehicleData({...editVehicleData, capacity: parseInt(e.target.value) || 30})} className="w-20" />
                          ) : v.capacity}
                        </TableCell>
                        <TableCell>
                          {editingVehicle === v.id ? (
                            <Select value={editVehicleData.status} onValueChange={(val) => setEditVehicleData({...editVehicleData, status: val})}>
                              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Activo</SelectItem>
                                <SelectItem value="inactive">Inactivo</SelectItem>
                                <SelectItem value="maintenance">Mantenimiento</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              v.status === 'active' ? 'bg-green-100 text-green-700' :
                              v.status === 'maintenance' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {v.status === 'active' ? 'Activo' : v.status === 'maintenance' ? 'Mantenimiento' : 'Inactivo'}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingVehicle === v.id ? (
                            <Select value={editVehicleData.route_id || ''} onValueChange={(val) => setEditVehicleData({...editVehicleData, route_id: val})}>
                              <SelectTrigger className="w-32"><SelectValue placeholder="Ninguna" /></SelectTrigger>
                              <SelectContent>
                                {routes.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          ) : (v.bus_routes?.name || '-')}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          {editingVehicle === v.id ? (
                            <>
                              <Button size="sm" onClick={async () => {
                                const { error } = await supabase.from('vehicles').update({
                                  license_plate: editVehicleData.license_plate,
                                  model: editVehicleData.model,
                                  capacity: editVehicleData.capacity,
                                  status: editVehicleData.status,
                                  route_id: editVehicleData.route_id || null
                                }).eq('id', v.id);
                                if (error) {
                                  toast({ title: "Error", description: error.message, variant: "destructive" });
                                } else {
                                  toast({ title: "Éxito", description: "Vehículo actualizado" });
                                  setEditingVehicle(null);
                                  loadVehicles();
                                }
                              }}><Save size={16} /></Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingVehicle(null)}><X size={16} /></Button>
                            </>
                          ) : (
                            <>
                              <Button size="sm" variant="outline" onClick={() => { setEditingVehicle(v.id); setEditVehicleData(v); }}><Edit size={16} /></Button>
                              <Button size="sm" variant="destructive" onClick={() => handleDeleteVehicle(v.id)}><Trash2 size={16} /></Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        );
      case 'gallery':
        const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0];
          if (!file) return;
          
          setUploading(true);
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}.${fileExt}`;
          
          const { data, error } = await supabase.storage
            .from('gallery')
            .upload(fileName, file);
          
          if (error) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
          } else {
            const { data: { publicUrl } } = supabase.storage.from('gallery').getPublicUrl(fileName);
            setNewImage({ ...newImage, imagen_url: publicUrl });
            toast({ title: "Éxito", description: "Imagen subida correctamente" });
          }
          setUploading(false);
        };

        return (
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Agregar Imagen</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Título *</Label>
                    <Input value={newImage.titulo} onChange={(e) => setNewImage({...newImage, titulo: e.target.value})} />
                  </div>
                  <div>
                    <Label>Categoría</Label>
                    <Input value={newImage.categoria} onChange={(e) => setNewImage({...newImage, categoria: e.target.value})} placeholder="Ej: Turismo, Transporte" />
                  </div>
                </div>
                
                <div className="mt-4 space-y-4">
                  <div>
                    <Label>Subir Imagen desde Dispositivo</Label>
                    <div className="flex gap-2 mt-1">
                      <Input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="flex-1"
                      />
                      {uploading && <span className="text-sm text-muted-foreground flex items-center">Subiendo...</span>}
                    </div>
                  </div>
                  
                  <div>
                    <Label>O ingresar URL directamente</Label>
                    <Input 
                      value={newImage.imagen_url} 
                      onChange={(e) => setNewImage({...newImage, imagen_url: e.target.value})} 
                      placeholder="https://..." 
                    />
                  </div>

                  {newImage.imagen_url && (
                    <div className="border rounded p-2">
                      <p className="text-sm text-muted-foreground mb-2">Vista previa:</p>
                      <img src={newImage.imagen_url} alt="Preview" className="max-h-32 object-contain" />
                    </div>
                  )}
                  
                  <div>
                    <Label>Vincular con Paradas (opcional)</Label>
                    <div className="border rounded p-3 max-h-40 overflow-y-auto mt-1">
                      {busStops.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No hay paradas disponibles</p>
                      ) : (
                        busStops.map(stop => (
                          <div key={stop.id} className="flex items-center gap-2 py-1">
                            <Checkbox
                              id={`stop-${stop.id}`}
                              checked={newImage.bus_stop_ids.includes(stop.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setNewImage({...newImage, bus_stop_ids: [...newImage.bus_stop_ids, stop.id]});
                                } else {
                                  setNewImage({...newImage, bus_stop_ids: newImage.bus_stop_ids.filter(id => id !== stop.id)});
                                }
                              }}
                            />
                            <label htmlFor={`stop-${stop.id}`} className="text-sm cursor-pointer">
                              {stop.name}
                              {stop.bus_routes && (
                                <span className="text-xs text-muted-foreground ml-2">({stop.bus_routes.name})</span>
                              )}
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                    {newImage.bus_stop_ids.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {newImage.bus_stop_ids.length} parada(s) seleccionada(s)
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label>Descripción</Label>
                    <Input value={newImage.descripcion} onChange={(e) => setNewImage({...newImage, descripcion: e.target.value})} />
                  </div>
                </div>
                
                <Button onClick={handleAddImage} className="mt-4" disabled={!newImage.titulo || !newImage.imagen_url}>
                  <Plus size={16} className="mr-2" />Agregar Imagen
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Galería ({images.length} imágenes)</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {images.map(img => (
                    <Card key={img.id} className="overflow-hidden">
                      <div className="aspect-video bg-muted relative">
                        {img.imagen_url && (
                          <img src={img.imagen_url} alt={img.titulo} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <CardContent className="p-3">
                        <h4 className="font-medium truncate">{img.titulo}</h4>
                        {img.categoria && <p className="text-xs text-muted-foreground">{img.categoria}</p>}
                        {img.bus_stop_ids && img.bus_stop_ids.length > 0 && (
                          <p className="text-xs text-blue-600 mt-1">
                            📍 {img.bus_stop_ids.length} parada(s) vinculada(s)
                          </p>
                        )}
                        <Button size="sm" variant="destructive" className="w-full mt-2" onClick={() => handleDeleteImage(img.id)}>
                          <Trash2 size={14} className="mr-1" />Eliminar
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onLogout={onLogout}
      />
      <main className="flex-1 p-6 overflow-auto">
        {renderContent()}
      </main>
    </div>
  );
};

export default AdminDashboard;
