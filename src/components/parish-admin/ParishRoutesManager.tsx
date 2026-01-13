
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
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

  const [newRoute, setNewRoute] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    short_route: '',
    long_route: '',
    route_identification: ''
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
        parroquia_id: parroquiaId
      }]);

      if (error) throw error;

      toast({ title: "Éxito", description: "Ruta creada correctamente" });
      setNewRoute({
        name: '',
        description: '',
        color: '#3B82F6',
        short_route: '',
        long_route: '',
        route_identification: ''
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
          route_identification: editRouteData.route_identification
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestión de Rutas</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? <X className="mr-2" /> : <Plus className="mr-2" />}
          {showForm ? 'Cancelar' : 'Nueva Ruta'}
        </Button>
      </div>

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
          <CardTitle>Rutas de la Parroquia ({routes.length})</CardTitle>
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
                  <TableHead>Tarifa Corta</TableHead>
                  <TableHead>Tarifa Larga</TableHead>
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
                    <TableCell>
                      {editingRoute === route.id ? (
                        <Input 
                          value={editRouteData.short_route || ''} 
                          onChange={(e) => setEditRouteData({...editRouteData, short_route: e.target.value})}
                        />
                      ) : (
                        route.short_route || '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {editingRoute === route.id ? (
                        <Input 
                          value={editRouteData.long_route || ''} 
                          onChange={(e) => setEditRouteData({...editRouteData, long_route: e.target.value})}
                        />
                      ) : (
                        route.long_route || '-'
                      )}
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
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
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
