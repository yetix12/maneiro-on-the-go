import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Save, Clock, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface ParishRoutesManagerProps {
  parroquiaId?: string;
}

const ParishRoutesManager: React.FC<ParishRoutesManagerProps> = ({ parroquiaId }) => {
  const { toast } = useToast();
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Dialogs
  const [createRouteDialogOpen, setCreateRouteDialogOpen] = useState(false);
  const [editRouteDialogOpen, setEditRouteDialogOpen] = useState(false);
  const [bulkFareDialogOpen, setBulkFareDialogOpen] = useState(false);

  // Edit state
  const [editingRoute, setEditingRoute] = useState<any>(null);

  // Multi-route selection for bulk fare editing
  const [selectedRouteIds, setSelectedRouteIds] = useState<string[]>([]);
  const [bulkFares, setBulkFares] = useState({ short_route: '', long_route: '' });

  const [newRoute, setNewRoute] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    short_route: '',
    long_route: '',
    route_identification: '',
    frequency_minutes: '15',
    departure_time: '05:30',
    arrival_time: '21:00'
  });

  useEffect(() => {
    if (parroquiaId) {
      loadRoutes();
    }
  }, [parroquiaId]);

  const loadRoutes = async () => {
    if (!parroquiaId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bus_routes')
        .select('*')
        .eq('parroquia_id', parroquiaId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setRoutes(data || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoute = async () => {
    if (!newRoute.name.trim()) {
      toast({ title: "Error", description: "El nombre es obligatorio", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.from('bus_routes').insert([{
        ...newRoute,
        parroquia_id: parroquiaId,
        frequency_minutes: parseInt(newRoute.frequency_minutes) || 15
      }]);

      if (error) throw error;

      toast({ title: "Éxito", description: "Ruta creada correctamente" });
      resetNewRouteForm();
      setCreateRouteDialogOpen(false);
      loadRoutes();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resetNewRouteForm = () => {
    setNewRoute({
      name: '',
      description: '',
      color: '#3B82F6',
      short_route: '',
      long_route: '',
      route_identification: '',
      frequency_minutes: '15',
      departure_time: '05:30',
      arrival_time: '21:00'
    });
  };

  const openEditDialog = (route: any) => {
    setEditingRoute({ ...route });
    setEditRouteDialogOpen(true);
  };

  const handleSaveRoute = async () => {
    if (!editingRoute) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('bus_routes')
        .update({
          name: editingRoute.name,
          description: editingRoute.description,
          color: editingRoute.color,
          short_route: editingRoute.short_route,
          long_route: editingRoute.long_route,
          route_identification: editingRoute.route_identification,
          frequency_minutes: editingRoute.frequency_minutes,
          departure_time: editingRoute.departure_time,
          arrival_time: editingRoute.arrival_time
        })
        .eq('id', editingRoute.id);

      if (error) throw error;

      toast({ title: "Éxito", description: "Ruta actualizada" });
      setEditRouteDialogOpen(false);
      setEditingRoute(null);
      loadRoutes();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoute = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta ruta?')) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('bus_routes')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast({ title: "Éxito", description: "Ruta eliminada" });
      loadRoutes();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkFareUpdate = async () => {
    const updateData: any = {};
    if (bulkFares.short_route) updateData.short_route = bulkFares.short_route;
    if (bulkFares.long_route) updateData.long_route = bulkFares.long_route;

    if (Object.keys(updateData).length === 0) {
      toast({ title: "Error", description: "Ingrese al menos una tarifa", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase
        .from('bus_routes')
        .update(updateData)
        .in('id', selectedRouteIds);

      if (error) throw error;

      toast({ title: "Éxito", description: `Tarifas actualizadas en ${selectedRouteIds.length} rutas` });
      setBulkFareDialogOpen(false);
      setBulkFares({ short_route: '', long_route: '' });
      setSelectedRouteIds([]);
      loadRoutes();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Route Dialog */}
      <Dialog open={createRouteDialogOpen} onOpenChange={setCreateRouteDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crear Nueva Ruta</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Nombre *</Label>
              <Input value={newRoute.name} onChange={(e) => setNewRoute({ ...newRoute, name: e.target.value })} placeholder="Nombre de la ruta" />
            </div>
            <div>
              <Label>Identificación</Label>
              <Input value={newRoute.route_identification} onChange={(e) => setNewRoute({ ...newRoute, route_identification: e.target.value })} placeholder="Ej: Ruta 4A" />
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex gap-2">
                <Input type="color" value={newRoute.color} onChange={(e) => setNewRoute({ ...newRoute, color: e.target.value })} className="w-16 h-10" />
                <Input value={newRoute.color} onChange={(e) => setNewRoute({ ...newRoute, color: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Tarifa Corta (Bs)</Label>
              <Input value={newRoute.short_route} onChange={(e) => setNewRoute({ ...newRoute, short_route: e.target.value })} placeholder="Ej: 2.50" />
            </div>
            <div>
              <Label>Tarifa Larga (Bs)</Label>
              <Input value={newRoute.long_route} onChange={(e) => setNewRoute({ ...newRoute, long_route: e.target.value })} placeholder="Ej: 4.00" />
            </div>
            <div>
              <Label>Frecuencia (min)</Label>
              <Input type="number" value={newRoute.frequency_minutes} onChange={(e) => setNewRoute({ ...newRoute, frequency_minutes: e.target.value })} placeholder="15" />
            </div>
            <div>
              <Label>Hora de Salida</Label>
              <Input type="time" value={newRoute.departure_time} onChange={(e) => setNewRoute({ ...newRoute, departure_time: e.target.value })} />
            </div>
            <div>
              <Label>Hora de Llegada</Label>
              <Input type="time" value={newRoute.arrival_time} onChange={(e) => setNewRoute({ ...newRoute, arrival_time: e.target.value })} />
            </div>
            <div className="md:col-span-3">
              <Label>Descripción</Label>
              <Input value={newRoute.description} onChange={(e) => setNewRoute({ ...newRoute, description: e.target.value })} placeholder="Descripción de la ruta" />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => { setCreateRouteDialogOpen(false); resetNewRouteForm(); }}>Cancelar</Button>
            <Button onClick={handleAddRoute} disabled={loading}><Plus size={16} className="mr-2" />Crear Ruta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Route Dialog (includes tariffs, schedules, frequency) */}
      <Dialog open={editRouteDialogOpen} onOpenChange={setEditRouteDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock size={20} />
              Configurar Ruta (Tarifas, Horarios y Frecuencia)
            </DialogTitle>
          </DialogHeader>
          {editingRoute && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Nombre</Label>
                <Input value={editingRoute.name || ''} onChange={(e) => setEditingRoute({ ...editingRoute, name: e.target.value })} />
              </div>
              <div>
                <Label>Identificación</Label>
                <Input value={editingRoute.route_identification || ''} onChange={(e) => setEditingRoute({ ...editingRoute, route_identification: e.target.value })} />
              </div>
              <div>
                <Label>Color</Label>
                <div className="flex gap-2">
                  <Input type="color" value={editingRoute.color || '#3B82F6'} onChange={(e) => setEditingRoute({ ...editingRoute, color: e.target.value })} className="w-16 h-10" />
                  <Input value={editingRoute.color || ''} onChange={(e) => setEditingRoute({ ...editingRoute, color: e.target.value })} />
                </div>
              </div>
              <div>
                <Label className="flex items-center gap-1"><DollarSign size={14} /> Tarifa Corta (Bs)</Label>
                <Input value={editingRoute.short_route || ''} onChange={(e) => setEditingRoute({ ...editingRoute, short_route: e.target.value })} placeholder="Ej: 2.50" />
              </div>
              <div>
                <Label className="flex items-center gap-1"><DollarSign size={14} /> Tarifa Larga (Bs)</Label>
                <Input value={editingRoute.long_route || ''} onChange={(e) => setEditingRoute({ ...editingRoute, long_route: e.target.value })} placeholder="Ej: 4.00" />
              </div>
              <div>
                <Label className="flex items-center gap-1"><Clock size={14} /> Frecuencia (min)</Label>
                <Input type="number" value={editingRoute.frequency_minutes || 15} onChange={(e) => setEditingRoute({ ...editingRoute, frequency_minutes: parseInt(e.target.value) || 15 })} placeholder="15" />
              </div>
              <div>
                <Label>Hora de Salida</Label>
                <Input type="time" value={editingRoute.departure_time || '05:30'} onChange={(e) => setEditingRoute({ ...editingRoute, departure_time: e.target.value })} />
              </div>
              <div>
                <Label>Hora de Llegada</Label>
                <Input type="time" value={editingRoute.arrival_time || '21:00'} onChange={(e) => setEditingRoute({ ...editingRoute, arrival_time: e.target.value })} />
              </div>
              <div className="md:col-span-3">
                <Label>Descripción</Label>
                <Input value={editingRoute.description || ''} onChange={(e) => setEditingRoute({ ...editingRoute, description: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setEditRouteDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveRoute} disabled={loading}><Save size={16} className="mr-2" />Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Fare Dialog */}
      <Dialog open={bulkFareDialogOpen} onOpenChange={setBulkFareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Tarifas de {selectedRouteIds.length} Rutas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nueva Tarifa Corta (Bs)</Label>
              <Input value={bulkFares.short_route} onChange={(e) => setBulkFares({ ...bulkFares, short_route: e.target.value })} placeholder="Ej: 2.50" />
            </div>
            <div>
              <Label>Nueva Tarifa Larga (Bs)</Label>
              <Input value={bulkFares.long_route} onChange={(e) => setBulkFares({ ...bulkFares, long_route: e.target.value })} placeholder="Ej: 4.00" />
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleBulkFareUpdate}>
                <Save size={16} className="mr-2" />Guardar Cambios
              </Button>
              <Button variant="outline" onClick={() => setBulkFareDialogOpen(false)}>Cancelar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestión de Rutas</h1>
        <Button onClick={() => setCreateRouteDialogOpen(true)}>
          <Plus className="mr-2" size={16} />Nueva Ruta
        </Button>
      </div>

      {/* Bulk Fare Editing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign size={20} />
            Edición Masiva de Tarifas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (selectedRouteIds.length === routes.length) {
                    setSelectedRouteIds([]);
                  } else {
                    setSelectedRouteIds(routes.map(r => r.id));
                  }
                }}
              >
                {selectedRouteIds.length === routes.length ? 'Deseleccionar Todas' : 'Seleccionar Todas'}
              </Button>
              {selectedRouteIds.length > 0 && (
                <Button onClick={() => setBulkFareDialogOpen(true)}>
                  <DollarSign size={16} className="mr-2" />
                  Editar Tarifas ({selectedRouteIds.length} rutas)
                </Button>
              )}
            </div>
            <div className="border rounded p-3 max-h-48 overflow-y-auto">
              {routes.map(route => (
                <div key={route.id} className="flex items-center gap-2 py-1">
                  <Checkbox
                    id={`route-select-${route.id}`}
                    checked={selectedRouteIds.includes(route.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedRouteIds([...selectedRouteIds, route.id]);
                      } else {
                        setSelectedRouteIds(selectedRouteIds.filter(id => id !== route.id));
                      }
                    }}
                  />
                  <label htmlFor={`route-select-${route.id}`} className="text-sm cursor-pointer flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: route.color }} />
                    {route.name}
                    <span className="text-xs text-muted-foreground">
                      (Corta: {route.short_route || '-'} | Larga: {route.long_route || '-'})
                    </span>
                  </label>
                </div>
              ))}
              {routes.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No hay rutas registradas</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Routes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Rutas Registradas ({routes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : (
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
                    <TableCell className="font-medium">{route.name}</TableCell>
                    <TableCell>{route.route_identification || '-'}</TableCell>
                    <TableCell>{route.short_route || '-'}</TableCell>
                    <TableCell>{route.long_route || '-'}</TableCell>
                    <TableCell>{route.frequency_minutes || 15} min</TableCell>
                    <TableCell className="text-xs">{route.departure_time?.slice(0, 5) || '05:30'} - {route.arrival_time?.slice(0, 5) || '21:00'}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(route)}>
                        <Edit size={16} />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteRoute(route.id)}>
                        <Trash2 size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {routes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No hay rutas registradas
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

export default ParishRoutesManager;
