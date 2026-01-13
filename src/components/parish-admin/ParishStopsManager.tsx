
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
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
  const [editingStop, setEditingStop] = useState<string | null>(null);
  const [editStopData, setEditStopData] = useState<any>({});
  const [showForm, setShowForm] = useState(false);

  const [newStop, setNewStop] = useState({
    name: '',
    latitude: '',
    longitude: '',
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

  const handleAddStop = async () => {
    if (!newStop.name.trim() || !newStop.latitude || !newStop.longitude) {
      toast({ title: "Error", description: "Nombre, latitud y longitud son obligatorios", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.from('bus_stops').insert([{
        name: newStop.name.trim(),
        latitude: parseFloat(newStop.latitude),
        longitude: parseFloat(newStop.longitude),
        stop_order: parseInt(newStop.stop_order) || 0,
        route_id: newStop.route_id || null
      }]);

      if (error) throw error;

      toast({ title: "Éxito", description: "Parada creada correctamente" });
      setNewStop({
        name: '',
        latitude: '',
        longitude: '',
        stop_order: '',
        route_id: ''
      });
      setShowForm(false);
      loadStops();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStop = async () => {
    if (!editingStop) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('bus_stops')
        .update({
          name: editStopData.name,
          latitude: parseFloat(editStopData.latitude),
          longitude: parseFloat(editStopData.longitude),
          stop_order: parseInt(editStopData.stop_order) || 0,
          route_id: editStopData.route_id || null
        })
        .eq('id', editingStop);

      if (error) throw error;

      toast({ title: "Éxito", description: "Parada actualizada" });
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestión de Paradas</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? <X className="mr-2" /> : <Plus className="mr-2" />}
          {showForm ? 'Cancelar' : 'Nueva Parada'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Crear Nueva Parada</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Label>Nombre *</Label>
                <Input 
                  value={newStop.name} 
                  onChange={(e) => setNewStop({...newStop, name: e.target.value})}
                  placeholder="Nombre de la parada"
                />
              </div>
              <div>
                <Label>Latitud *</Label>
                <Input 
                  type="number"
                  step="0.000001"
                  value={newStop.latitude} 
                  onChange={(e) => setNewStop({...newStop, latitude: e.target.value})}
                  placeholder="10.123456"
                />
              </div>
              <div>
                <Label>Longitud *</Label>
                <Input 
                  type="number"
                  step="0.000001"
                  value={newStop.longitude} 
                  onChange={(e) => setNewStop({...newStop, longitude: e.target.value})}
                  placeholder="-63.123456"
                />
              </div>
              <div>
                <Label>Orden</Label>
                <Input 
                  type="number"
                  value={newStop.stop_order} 
                  onChange={(e) => setNewStop({...newStop, stop_order: e.target.value})}
                  placeholder="1"
                />
              </div>
              <div>
                <Label>Ruta</Label>
                <Select value={newStop.route_id} onValueChange={(v) => setNewStop({...newStop, route_id: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar ruta" />
                  </SelectTrigger>
                  <SelectContent>
                    {routes.map(route => (
                      <SelectItem key={route.id} value={route.id}>
                        <span className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: route.color }}
                          />
                          {route.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleAddStop} disabled={loading} className="mt-4">
              <Plus size={16} className="mr-2" />
              Agregar Parada
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Paradas de la Parroquia ({stops.length})</CardTitle>
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
                    <TableCell>
                      {editingStop === stop.id ? (
                        <Input 
                          value={editStopData.name || ''} 
                          onChange={(e) => setEditStopData({...editStopData, name: e.target.value})}
                        />
                      ) : (
                        stop.name
                      )}
                    </TableCell>
                    <TableCell>
                      {editingStop === stop.id ? (
                        <Input 
                          type="number"
                          step="0.000001"
                          value={editStopData.latitude || ''} 
                          onChange={(e) => setEditStopData({...editStopData, latitude: e.target.value})}
                        />
                      ) : (
                        stop.latitude
                      )}
                    </TableCell>
                    <TableCell>
                      {editingStop === stop.id ? (
                        <Input 
                          type="number"
                          step="0.000001"
                          value={editStopData.longitude || ''} 
                          onChange={(e) => setEditStopData({...editStopData, longitude: e.target.value})}
                        />
                      ) : (
                        stop.longitude
                      )}
                    </TableCell>
                    <TableCell>
                      {editingStop === stop.id ? (
                        <Input 
                          type="number"
                          value={editStopData.stop_order || ''} 
                          onChange={(e) => setEditStopData({...editStopData, stop_order: e.target.value})}
                          className="w-16"
                        />
                      ) : (
                        stop.stop_order || '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {editingStop === stop.id ? (
                        <Select 
                          value={editStopData.route_id || ''} 
                          onValueChange={(v) => setEditStopData({...editStopData, route_id: v})}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {routes.map(route => (
                              <SelectItem key={route.id} value={route.id}>
                                {route.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        stop.bus_routes && (
                          <span className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: stop.bus_routes.color }}
                            />
                            {stop.bus_routes.name}
                          </span>
                        )
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {editingStop === stop.id ? (
                        <>
                          <Button size="sm" onClick={handleSaveStop} disabled={loading}>
                            <Save size={16} />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingStop(null)}>
                            <X size={16} />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => { 
                              setEditingStop(stop.id); 
                              setEditStopData(stop); 
                            }}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => handleDeleteStop(stop.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </>
                      )}
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
