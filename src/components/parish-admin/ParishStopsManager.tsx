import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface ParishStopsManagerProps {
  parroquiaId?: string;
}

const ParishStopsManager: React.FC<ParishStopsManagerProps> = ({ parroquiaId }) => {
  const { toast } = useToast();
  const [stops, setStops] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Dialogs
  const [createStopDialogOpen, setCreateStopDialogOpen] = useState(false);
  const [editStopDialogOpen, setEditStopDialogOpen] = useState(false);

  // Edit state
  const [editingStop, setEditingStop] = useState<any>(null);

  const [newStop, setNewStop] = useState({
    name: '',
    coordinates: '', // Single field for "lat, lng"
    stop_order: '',
    route_id: ''
  });

  useEffect(() => {
    if (parroquiaId) {
      loadRoutes();
      loadStops();
    }
  }, [parroquiaId]);

  const loadRoutes = async () => {
    if (!parroquiaId) return;

    const { data } = await supabase
      .from('bus_routes')
      .select('id, name, color')
      .eq('parroquia_id', parroquiaId)
      .eq('is_active', true)
      .order('name');

    setRoutes(data || []);
  };

  const loadStops = async () => {
    if (!parroquiaId) return;

    setLoading(true);
    try {
      // Get stops for routes in this parish
      const { data: routeIds } = await supabase
        .from('bus_routes')
        .select('id')
        .eq('parroquia_id', parroquiaId)
        .eq('is_active', true);

      if (!routeIds || routeIds.length === 0) {
        setStops([]);
        return;
      }

      const { data, error } = await supabase
        .from('bus_stops')
        .select('*, bus_routes(name, color)')
        .in('route_id', routeIds.map(r => r.id))
        .order('stop_order');

      if (error) throw error;
      setStops(data || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Parse coordinates from single field
  const parseCoordinates = (coordStr: string): { lat: number; lng: number } | null => {
    const trimmed = coordStr.trim();
    const parts = trimmed.split(',').map(p => p.trim());
    if (parts.length === 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
    return null;
  };

  const handleAddStop = async () => {
    if (!newStop.name.trim() || !newStop.coordinates) {
      toast({ title: "Error", description: "Nombre y coordenadas son obligatorios", variant: "destructive" });
      return;
    }

    const coords = parseCoordinates(newStop.coordinates);
    if (!coords) {
      toast({ title: "Error", description: "Formato de coordenadas inválido. Use: latitud, longitud (ej: 10.963742, -63.842669)", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.from('bus_stops').insert([{
        name: newStop.name.trim(),
        latitude: coords.lat,
        longitude: coords.lng,
        stop_order: parseInt(newStop.stop_order) || 0,
        route_id: newStop.route_id || null
      }]);

      if (error) throw error;

      toast({ title: "Éxito", description: "Parada creada correctamente" });
      resetNewStopForm();
      setCreateStopDialogOpen(false);
      loadStops();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resetNewStopForm = () => {
    setNewStop({
      name: '',
      coordinates: '',
      stop_order: '',
      route_id: ''
    });
  };

  const openEditDialog = (stop: any) => {
    setEditingStop({
      ...stop,
      coordinates: `${stop.latitude}, ${stop.longitude}`
    });
    setEditStopDialogOpen(true);
  };

  const handleSaveStop = async () => {
    if (!editingStop) return;

    const coords = parseCoordinates(editingStop.coordinates);
    if (!coords) {
      toast({ title: "Error", description: "Formato de coordenadas inválido", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('bus_stops')
        .update({
          name: editingStop.name,
          latitude: coords.lat,
          longitude: coords.lng,
          stop_order: parseInt(editingStop.stop_order) || 0,
          route_id: editingStop.route_id || null
        })
        .eq('id', editingStop.id);

      if (error) throw error;

      toast({ title: "Éxito", description: "Parada actualizada" });
      setEditStopDialogOpen(false);
      setEditingStop(null);
      loadStops();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStop = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta parada?')) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('bus_stops')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({ title: "Éxito", description: "Parada eliminada" });
      loadStops();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Stop Dialog */}
      <Dialog open={createStopDialogOpen} onOpenChange={setCreateStopDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Crear Nueva Parada</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Nombre *</Label>
              <Input
                value={newStop.name}
                onChange={(e) => setNewStop({ ...newStop, name: e.target.value })}
                placeholder="Nombre de la parada"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Coordenadas * (lat, lng)</Label>
              <Input
                value={newStop.coordinates}
                onChange={(e) => setNewStop({ ...newStop, coordinates: e.target.value })}
                placeholder="10.963742, -63.842669"
              />
              <p className="text-xs text-muted-foreground mt-1">Formato: latitud, longitud</p>
            </div>
            <div>
              <Label>Orden</Label>
              <Input
                type="number"
                value={newStop.stop_order}
                onChange={(e) => setNewStop({ ...newStop, stop_order: e.target.value })}
                placeholder="1"
              />
            </div>
            <div>
              <Label>Ruta</Label>
              <Select value={newStop.route_id} onValueChange={(v) => setNewStop({ ...newStop, route_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar ruta" />
                </SelectTrigger>
                <SelectContent>
                  {routes.map(route => (
                    <SelectItem key={route.id} value={route.id}>
                      <span className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: route.color }} />
                        {route.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => { setCreateStopDialogOpen(false); resetNewStopForm(); }}>Cancelar</Button>
            <Button onClick={handleAddStop} disabled={loading}><Plus size={16} className="mr-2" />Agregar Parada</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Stop Dialog */}
      <Dialog open={editStopDialogOpen} onOpenChange={setEditStopDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Parada</DialogTitle>
          </DialogHeader>
          {editingStop && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Nombre</Label>
                <Input
                  value={editingStop.name || ''}
                  onChange={(e) => setEditingStop({ ...editingStop, name: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Coordenadas (lat, lng)</Label>
                <Input
                  value={editingStop.coordinates || ''}
                  onChange={(e) => setEditingStop({ ...editingStop, coordinates: e.target.value })}
                  placeholder="10.963742, -63.842669"
                />
                <p className="text-xs text-muted-foreground mt-1">Formato: latitud, longitud</p>
              </div>
              <div>
                <Label>Orden</Label>
                <Input
                  type="number"
                  value={editingStop.stop_order || ''}
                  onChange={(e) => setEditingStop({ ...editingStop, stop_order: e.target.value })}
                />
              </div>
              <div>
                <Label>Ruta</Label>
                <Select
                  value={editingStop.route_id || ''}
                  onValueChange={(v) => setEditingStop({ ...editingStop, route_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {routes.map(route => (
                      <SelectItem key={route.id} value={route.id}>
                        <span className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: route.color }} />
                          {route.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setEditStopDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveStop} disabled={loading}><Save size={16} className="mr-2" />Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestión de Paradas</h1>
        <Button onClick={() => setCreateStopDialogOpen(true)}>
          <Plus className="mr-2" size={16} />Nueva Parada
        </Button>
      </div>

      {/* Stops Table */}
      <Card>
        <CardHeader>
          <CardTitle>Paradas del Municipio ({stops.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : (
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
                {stops.map(stop => (
                  <TableRow key={stop.id}>
                    <TableCell className="font-medium">{stop.name}</TableCell>
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
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(stop)}>
                        <Edit size={16} />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteStop(stop.id)}>
                        <Trash2 size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {stops.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No hay paradas registradas
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

export default ParishStopsManager;
