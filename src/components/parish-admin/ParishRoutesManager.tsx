import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Save, X, Clock, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface ParishRoutesManagerProps {
  parroquiaId?: string;
}

const ParishRoutesManager: React.FC<ParishRoutesManagerProps> = ({ parroquiaId }) => {
  const { toast } = useToast();
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingRoute, setEditingRoute] = useState<string | null>(null);
  const [editRouteData, setEditRouteData] = useState<any>({});
  const [showForm, setShowForm] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');

  // Multi-route selection for bulk fare editing
  const [selectedRouteIds, setSelectedRouteIds] = useState<string[]>([]);
  const [bulkFareDialogOpen, setBulkFareDialogOpen] = useState(false);
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
      setShowForm(false);
      loadRoutes();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRoute = async () => {
    if (!editingRoute) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('bus_routes')
        .update({
          name: editRouteData.name,
          description: editRouteData.description,
          color: editRouteData.color,
          short_route: editRouteData.short_route,
          long_route: editRouteData.long_route,
          route_identification: editRouteData.route_identification,
          frequency_minutes: editRouteData.frequency_minutes,
          departure_time: editRouteData.departure_time,
          arrival_time: editRouteData.arrival_time
        })
        .eq('id', editingRoute);

      if (error) throw error;

      toast({ title: "Éxito", description: "Ruta actualizada" });
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestión de Rutas</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? <X className="mr-2" /> : <Plus className="mr-2" />}
          {showForm ? 'Cancelar' : 'Nueva Ruta'}
        </Button>
      </div>

      {/* Route Configuration Card */}
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

      {/* Bulk Fare Dialog */}
      <Dialog open={bulkFareDialogOpen} onOpenChange={setBulkFareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Tarifas de {selectedRouteIds.length} Rutas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nueva Tarifa Corta (Bs)</Label>
              <Input 
                value={bulkFares.short_route} 
                onChange={(e) => setBulkFares({...bulkFares, short_route: e.target.value})}
                placeholder="Ej: 2.50"
              />
            </div>
            <div>
              <Label>Nueva Tarifa Larga (Bs)</Label>
              <Input 
                value={bulkFares.long_route} 
                onChange={(e) => setBulkFares({...bulkFares, long_route: e.target.value})}
                placeholder="Ej: 4.00"
              />
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

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Crear Nueva Ruta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Nombre *</Label>
                <Input 
                  value={newRoute.name} 
                  onChange={(e) => setNewRoute({...newRoute, name: e.target.value})}
                  placeholder="Nombre de la ruta"
                />
              </div>
              <div>
                <Label>Identificación</Label>
                <Input 
                  value={newRoute.route_identification} 
                  onChange={(e) => setNewRoute({...newRoute, route_identification: e.target.value})}
                  placeholder="Ej: Ruta 4A"
                />
              </div>
              <div>
                <Label>Color</Label>
                <div className="flex gap-2">
                  <Input 
                    type="color" 
                    value={newRoute.color} 
                    onChange={(e) => setNewRoute({...newRoute, color: e.target.value})}
                    className="w-16 h-10"
                  />
                  <Input 
                    value={newRoute.color} 
                    onChange={(e) => setNewRoute({...newRoute, color: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label>Tarifa Corta (Bs)</Label>
                <Input 
                  value={newRoute.short_route} 
                  onChange={(e) => setNewRoute({...newRoute, short_route: e.target.value})}
                  placeholder="Ej: 2.50"
                />
              </div>
              <div>
                <Label>Tarifa Larga (Bs)</Label>
                <Input 
                  value={newRoute.long_route} 
                  onChange={(e) => setNewRoute({...newRoute, long_route: e.target.value})}
                  placeholder="Ej: 4.00"
                />
              </div>
              <div>
                <Label>Frecuencia (min)</Label>
                <Input 
                  type="number"
                  value={newRoute.frequency_minutes} 
                  onChange={(e) => setNewRoute({...newRoute, frequency_minutes: e.target.value})}
                  placeholder="15"
                />
              </div>
              <div>
                <Label>Hora de Salida</Label>
                <Input 
                  type="time"
                  value={newRoute.departure_time} 
                  onChange={(e) => setNewRoute({...newRoute, departure_time: e.target.value})}
                />
              </div>
              <div>
                <Label>Hora de Llegada</Label>
                <Input 
                  type="time"
                  value={newRoute.arrival_time} 
                  onChange={(e) => setNewRoute({...newRoute, arrival_time: e.target.value})}
                />
              </div>
              <div>
                <Label>Descripción</Label>
                <Input 
                  value={newRoute.description} 
                  onChange={(e) => setNewRoute({...newRoute, description: e.target.value})}
                  placeholder="Descripción de la ruta"
                />
              </div>
            </div>
            <Button onClick={handleAddRoute} disabled={loading} className="mt-4">
              <Plus size={16} className="mr-2" />
              Agregar Ruta
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Rutas del Municipio ({routes.length})</CardTitle>
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
                    <TableCell>
                      {editingRoute === route.id ? (
                        <Input 
                          type="color" 
                          value={editRouteData.color || '#3B82F6'} 
                          onChange={(e) => setEditRouteData({...editRouteData, color: e.target.value})}
                          className="w-12 h-8"
                        />
                      ) : (
                        <div 
                          className="w-6 h-6 rounded-full border" 
                          style={{ backgroundColor: route.color }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {editingRoute === route.id ? (
                        <Input 
                          value={editRouteData.name || ''} 
                          onChange={(e) => setEditRouteData({...editRouteData, name: e.target.value})}
                        />
                      ) : (
                        route.name
                      )}
                    </TableCell>
                    <TableCell>
                      {editingRoute === route.id ? (
                        <Input 
                          value={editRouteData.route_identification || ''} 
                          onChange={(e) => setEditRouteData({...editRouteData, route_identification: e.target.value})}
                        />
                      ) : (
                        route.route_identification || '-'
                      )}
                    </TableCell>
                    <TableCell>{route.short_route || '-'}</TableCell>
                    <TableCell>{route.long_route || '-'}</TableCell>
                    <TableCell>{route.frequency_minutes || 15} min</TableCell>
                    <TableCell className="text-xs">
                      {route.departure_time?.slice(0,5) || '05:30'} - {route.arrival_time?.slice(0,5) || '21:00'}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {editingRoute === route.id ? (
                        <>
                          <Button size="sm" onClick={handleSaveRoute} disabled={loading}>
                            <Save size={16} />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingRoute(null)}>
                            <X size={16} />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => { 
                              setEditingRoute(route.id); 
                              setEditRouteData(route); 
                            }}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => handleDeleteRoute(route.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </>
                      )}
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
