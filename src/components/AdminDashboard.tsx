import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, Plus, Edit, Trash2, Save, MapPin, Image, Users, Map, Upload, Camera, Eye, EyeOff } from 'lucide-react';
import { getAdminPointsOfInterest, saveAdminPointsOfInterest } from './map/mapData';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import AdminDiagnostic from './AdminDiagnostic';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const { toast } = useToast();
  
  // Estado para rutas
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Estado para usuarios
  const [users, setUsers] = useState<any[]>([]);

  // Estado para imágenes
  const [images, setImages] = useState<any[]>([]);

  // Estado para puntos de interés
  const [pointsOfInterest, setPointsOfInterest] = useState(() => getAdminPointsOfInterest());

  // Estados para paradas de autobús
  const [busStops, setBusStops] = useState<any[]>([]);
  const [newBusStop, setNewBusStop] = useState({
    name: '',
    latitude: '',
    longitude: '',
    stop_order: '',
    route_id: ''
  });

  const [editingRoute, setEditingRoute] = useState<any>(null);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newImage, setNewImage] = useState({ title: '', description: '', url: '', category: '' });
  const [newUser, setNewUser] = useState({ 
    name: '', 
    username: '', 
    email: '',
    password: '',
    type: 'driver', 
    phone: '', 
    vehicle: '' 
  });
  const [newRoute, setNewRoute] = useState({
    name: '',
    frequency: '',
    operatingHours: '',
    shortRoute: '', // Antes era "fare", ahora será "Ruta corta"
    longRoute: '', // Nuevo campo para "Ruta larga expresado en Bs"
    routeIdentification: '', // Nuevo campo para "Identificación de la ruta"
    description: '',
    color: '#3B82F6'
  });
  const [newPointOfInterest, setNewPointOfInterest] = useState({
    name: '',
    description: '',
    lat: 0,
    lng: 0,
    category: ''
  });

  // Estados para mostrar/ocultar contraseñas
  const [showPassword, setShowPassword] = useState<{[key: string]: boolean}>({});
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Cargar usuarios desde Supabase
  useEffect(() => {
    loadUsers();
    loadRoutes();
    loadBusStops();
    loadImages();
  }, []);

  const loadRoutes = async () => {
    try {
      const { data: routesData, error } = await supabase
        .from('bus_routes')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setRoutes(routesData || []);
    } catch (error) {
      console.error('Error loading routes:', error);
    }
  };

  const loadBusStops = async () => {
    try {
      const { data: busStopsData, error } = await supabase
        .from('bus_stops')
        .select('*');

      if (error) throw error;
      setBusStops(busStopsData || []);
    } catch (error) {
      console.error('Error loading bus stops:', error);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) throw error;

      // Formatear los datos para mostrar en la tabla
      const formattedUsers = profiles.map(profile => ({
        id: profile.id,
        name: profile.full_name || profile.username || 'Sin nombre',
        username: profile.username || 'Sin username',
        email: 'N/A', // No tenemos acceso al email desde profiles
        password: '******', // Por seguridad no mostramos la contraseña real
        type: profile.user_type || 'passenger',
        phone: profile.phone || 'N/A',
        vehicle: profile.user_type === 'driver' ? 'N/A' : ''
      }));

      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para validar que solo se ingresen números en contraseña
  const handlePasswordChange = (value: string, setter: Function) => {
    const numbersOnly = value.replace(/[^0-9]/g, '');
    setter(numbersOnly);
  };

  const handleSaveRoute = (route: any) => {
    setRoutes(routes.map(r => r.id === route.id ? route : r));
    setEditingRoute(null);
    console.log('Ruta actualizada y sincronizada con todos los usuarios:', route);
  };

  const handleDeleteRoute = (id: string) => {
    setRoutes(routes.filter(r => r.id !== id));
  };

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.username || !newUser.email || !newUser.password) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos obligatorios",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      // Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            username: newUser.username,
            full_name: newUser.name,
            user_type: newUser.type
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Actualizar o insertar el perfil del usuario
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            username: newUser.username,
            full_name: newUser.name,
            user_type: newUser.type,
            phone: newUser.phone || null
          });

        if (profileError) throw profileError;

        toast({
          title: "Éxito",
          description: "Usuario creado exitosamente",
          variant: "default"
        });

        // Limpiar formulario
        setNewUser({ 
          name: '', 
          username: '', 
          email: '',
          password: '',
          type: 'driver', 
          phone: '', 
          vehicle: '' 
        });

        // Recargar lista de usuarios
        await loadUsers();
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el usuario",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUser = async (user: any) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          username: user.username,
          full_name: user.name,
          user_type: user.type,
          phone: user.phone || null
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Usuario actualizado exitosamente",
        variant: "default"
      });

      setEditingUser(null);
      await loadUsers();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el usuario",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Usuario eliminado exitosamente",
        variant: "default"
      });

      await loadUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el usuario",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadImages = async () => {
    try {
      const { data: galleryData, error } = await supabase
        .from('galeria_maneiro')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Formatear datos para compatibilidad con el componente existente
      const formattedImages = galleryData?.map(item => ({
        id: item.id,
        title: item.titulo,
        description: item.descripcion,
        url: item.imagen_url,
        category: item.categoria
      })) || [];
      
      setImages(formattedImages);
    } catch (error) {
      console.error('Error loading images:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las imágenes",
        variant: "destructive"
      });
    }
  };

  const handleAddImage = async () => {
    if (!newImage.title || !newImage.url || !newImage.category) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos obligatorios",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('galeria_maneiro')
        .insert([{
          titulo: newImage.title,
          descripcion: newImage.description,
          imagen_url: newImage.url,
          categoria: newImage.category
        }])
        .select();

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Imagen agregada exitosamente",
        variant: "default"
      });

      setNewImage({ title: '', description: '', url: '', category: '' });
      await loadImages();
    } catch (error: any) {
      console.error('Error adding image:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo agregar la imagen",
        variant: "destructive"
      });
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setNewImage({
          ...newImage,
          url: e.target?.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteImage = async (id: string) => {
    try {
      const { error } = await supabase
        .from('galeria_maneiro')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Imagen eliminada exitosamente",
        variant: "default"
      });

      await loadImages();
    } catch (error: any) {
      console.error('Error deleting image:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la imagen",
        variant: "destructive"
      });
    }
  };

  const handleAddPointOfInterest = () => {
    if (newPointOfInterest.name && newPointOfInterest.lat && newPointOfInterest.lng) {
      const newPoint = { 
        ...newPointOfInterest, 
        id: Date.now().toString() 
      };
      const updatedPoints = [...pointsOfInterest, newPoint];
      setPointsOfInterest(updatedPoints);
      saveAdminPointsOfInterest(updatedPoints);
      setNewPointOfInterest({ name: '', description: '', lat: 0, lng: 0, category: '' });
      console.log('Punto de interés agregado:', newPoint);
    }
  };

  const handleDeletePointOfInterest = (id: string) => {
    const updatedPoints = pointsOfInterest.filter(poi => poi.id !== id);
    setPointsOfInterest(updatedPoints);
    saveAdminPointsOfInterest(updatedPoints);
  };

  const handleAddBusStop = async () => {
    if (!newBusStop.name || !newBusStop.latitude || !newBusStop.longitude || !newBusStop.stop_order || !newBusStop.route_id) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos obligatorios (nombre, latitud, longitud, orden de parada y ruta)",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('bus_stops')
        .insert([{
          name: newBusStop.name,
          latitude: parseFloat(newBusStop.latitude),
          longitude: parseFloat(newBusStop.longitude),
          stop_order: parseInt(newBusStop.stop_order),
          route_id: newBusStop.route_id
        }])
        .select();

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Parada de autobús agregada exitosamente",
        variant: "default"
      });

      setNewBusStop({
        name: '',
        latitude: '',
        longitude: '',
        stop_order: '',
        route_id: ''
      });

      await loadBusStops();
    } catch (error: any) {
      console.error('Error adding bus stop:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo agregar la parada",
        variant: "destructive"
      });
    }
  };

  const handleDeleteBusStop = async (id: string) => {
    try {
      const { error } = await supabase
        .from('bus_stops')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Parada eliminada exitosamente",
        variant: "default"
      });

      await loadBusStops();
    } catch (error: any) {
      console.error('Error deleting bus stop:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la parada",
        variant: "destructive"
      });
    }
  };

  const handleAddRoute = async () => {
    if (!newRoute.name || !newRoute.frequency || !newRoute.operatingHours || !newRoute.shortRoute || !newRoute.longRoute || !newRoute.routeIdentification) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos obligatorios",
        variant: "destructive"
      });
      return;
    }

    try {
      // Guardar en la base de datos
      const { data, error } = await supabase
        .from('bus_routes')
        .insert([
          {
            name: newRoute.name,
            description: newRoute.description,
            color: newRoute.color,
            short_route: newRoute.shortRoute,
            long_route: newRoute.longRoute,
            route_identification: newRoute.routeIdentification
          }
        ])
        .select();

      if (error) throw error;

      setNewRoute({
        name: '',
        frequency: '',
        operatingHours: '',
        shortRoute: '',
        longRoute: '',
        routeIdentification: '',
        description: '',
        color: '#3B82F6'
      });
      
      toast({
        title: "Éxito",
        description: "Ruta agregada exitosamente",
        variant: "default"
      });

      await loadRoutes();
    } catch (error: any) {
      console.error('Error adding route:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo agregar la ruta",
        variant: "destructive"
      });
    }
  };

  const togglePasswordVisibility = (userId: string) => {
    setShowPassword(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Panel de Administración</h1>
            <p className="text-purple-100 text-sm">Transporte Maneiro - Admin</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onLogout}
            className="bg-white/20 border-white/30 text-white hover:bg-white/30"
          >
            <LogOut size={16} className="mr-1" />
            Salir
          </Button>
        </div>
      </div>

      <div className="p-6">
        <Tabs defaultValue="diagnostic" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="diagnostic" className="flex items-center gap-2">
              🔧 Diagnóstico
            </TabsTrigger>
            <TabsTrigger value="routes" className="flex items-center gap-2">
              <MapPin size={16} />
              Rutas
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users size={16} />
              Usuarios
            </TabsTrigger>
            <TabsTrigger value="images" className="flex items-center gap-2">
              <Image size={16} />
              Imágenes
            </TabsTrigger>
            <TabsTrigger value="bus-stops" className="flex items-center gap-2">
              <MapPin size={16} />
              Paradas
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-2">
              <Map size={16} />
              Mapa
            </TabsTrigger>
          </TabsList>

          <TabsContent value="diagnostic">
            <AdminDiagnostic />
          </TabsContent>

          <TabsContent value="routes">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Agregar Nueva Ruta</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label>Nombre de la Ruta</Label>
                      <Input
                        value={newRoute.name}
                        onChange={(e) => setNewRoute({...newRoute, name: e.target.value})}
                        placeholder="Ej: Pampatar - Porlamar"
                      />
                    </div>
                    <div>
                      <Label>Frecuencia</Label>
                      <Input
                        value={newRoute.frequency}
                        onChange={(e) => setNewRoute({...newRoute, frequency: e.target.value})}
                        placeholder="Ej: 15-20 min"
                      />
                    </div>
                    <div>
                      <Label>Horarios</Label>
                      <Input
                        value={newRoute.operatingHours}
                        onChange={(e) => setNewRoute({...newRoute, operatingHours: e.target.value})}
                        placeholder="Ej: 5:00 AM - 10:00 PM"
                      />
                    </div>
                    <div>
                      <Label>Ruta corta</Label>
                      <Input
                        value={newRoute.shortRoute}
                        onChange={(e) => setNewRoute({...newRoute, shortRoute: e.target.value})}
                        placeholder="Ej: Bs. 2.50"
                      />
                    </div>
                    <div>
                      <Label>Ruta larga expresado en Bs</Label>
                      <Input
                        value={newRoute.longRoute}
                        onChange={(e) => setNewRoute({...newRoute, longRoute: e.target.value})}
                        placeholder="Ej: Bs. 4.00"
                      />
                    </div>
                    <div>
                      <Label>Identificación de la ruta</Label>
                      <Input
                        value={newRoute.routeIdentification}
                        onChange={(e) => setNewRoute({...newRoute, routeIdentification: e.target.value})}
                        placeholder="Ej: Ruta 4a"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Descripción</Label>
                      <Input
                        value={newRoute.description}
                        onChange={(e) => setNewRoute({...newRoute, description: e.target.value})}
                        placeholder="Descripción de la ruta"
                      />
                    </div>
                    <div>
                      <Label>Color de la Línea</Label>
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
                          placeholder="#3B82F6"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                  <Button onClick={handleAddRoute}>
                    <Plus size={16} className="mr-1" />
                    Agregar Ruta
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Rutas de Transporte</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {routes.map((route) => (
                      <Card key={route.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-lg">{route.name}</h3>
                            <p className="text-gray-600">{route.description}</p>
                            {route.route_identification && (
                              <p className="text-sm text-blue-600">ID: {route.route_identification}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => setEditingRoute(route)}>
                              <Edit size={16} />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteRoute(route.id)}>
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="bus-stops">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Agregar Parada de Autobús</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label>Nombre de la Parada</Label>
                      <Input
                        value={newBusStop.name}
                        onChange={(e) => setNewBusStop({...newBusStop, name: e.target.value})}
                        placeholder="Ej: Parada Central"
                      />
                    </div>
                    <div>
                      <Label>Ruta</Label>
                      <select 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={newBusStop.route_id}
                        onChange={(e) => setNewBusStop({...newBusStop, route_id: e.target.value})}
                      >
                        <option value="">Seleccionar ruta</option>
                        {routes.map((route) => (
                          <option key={route.id} value={route.id}>
                            ● {route.route_identification || route.name} ({route.color})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Orden de Parada</Label>
                      <Input
                        type="number"
                        value={newBusStop.stop_order}
                        onChange={(e) => setNewBusStop({...newBusStop, stop_order: e.target.value})}
                        placeholder="1, 2, 3..."
                        min="1"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Orden en que aparece la parada en la ruta
                      </p>
                    </div>
                    <div>
                      <Label>Latitud</Label>
                      <Input
                        type="number"
                        step="0.000001"
                        value={newBusStop.latitude}
                        onChange={(e) => setNewBusStop({...newBusStop, latitude: e.target.value})}
                        placeholder="11.0047"
                      />
                    </div>
                    <div>
                      <Label>Longitud</Label>
                      <Input
                        type="number"
                        step="0.000001"
                        value={newBusStop.longitude}
                        onChange={(e) => setNewBusStop({...newBusStop, longitude: e.target.value})}
                        placeholder="-63.8697"
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddBusStop}>
                    <Plus size={16} className="mr-1" />
                    Agregar Parada
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Paradas de Autobús</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Ruta</TableHead>
                        <TableHead>Orden</TableHead>
                        <TableHead>Coordenadas</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {busStops.map((stop) => {
                        const route = routes.find(r => r.id === stop.route_id);
                        return (
                          <TableRow key={stop.id}>
                            <TableCell className="font-medium">{stop.name}</TableCell>
                            <TableCell>
                              {route ? (
                                <span className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: route.color }}
                                  />
                                  {route.route_identification || route.name}
                                </span>
                              ) : (
                                <span className="text-gray-400">Sin ruta</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                #{stop.stop_order}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs">
                              {stop.latitude?.toFixed(4)}, {stop.longitude?.toFixed(4)}
                            </TableCell>
                            <TableCell>
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                onClick={() => handleDeleteBusStop(stop.id)}
                              >
                                <Trash2 size={14} />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Agregar Nuevo Usuario</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label>Nombre Completo</Label>
                      <Input
                        value={newUser.name}
                        onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                        placeholder="Nombre completo"
                      />
                    </div>
                    <div>
                      <Label>Usuario</Label>
                      <Input
                        value={newUser.username}
                        onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                        placeholder="Nombre de usuario"
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        value={newUser.email}
                        onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                        placeholder="email@ejemplo.com"
                        type="email"
                      />
                    </div>
                    <div>
                      <Label>Contraseña (Solo números)</Label>
                      <div className="relative">
                        <Input
                          value={newUser.password}
                          onChange={(e) => handlePasswordChange(e.target.value, (value: string) => setNewUser({...newUser, password: value}))}
                          placeholder="Solo números"
                          type={showNewPassword ? "text" : "password"}
                          inputMode="numeric"
                          pattern="[0-9]*"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label>Tipo de Usuario</Label>
                      <select 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={newUser.type}
                        onChange={(e) => setNewUser({...newUser, type: e.target.value})}
                      >
                        <option value="driver">Conductor</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </div>
                    <div>
                      <Label>Teléfono</Label>
                      <Input
                        value={newUser.phone}
                        onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                        placeholder="+58 424-123-4567"
                      />
                    </div>
                    {newUser.type === 'driver' && (
                      <div className="col-span-2">
                        <Label>Vehículo Asignado</Label>
                        <Input
                          value={newUser.vehicle}
                          onChange={(e) => setNewUser({...newUser, vehicle: e.target.value})}
                          placeholder="BUS-001"
                        />
                      </div>
                    )}
                  </div>
                  <Button onClick={handleAddUser} disabled={loading}>
                    <Plus size={16} className="mr-1" />
                    {loading ? 'Creando...' : 'Agregar Usuario'}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Lista de Usuarios</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2">Cargando usuarios...</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Usuario</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Teléfono</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id}>
                            {editingUser?.id === user.id ? (
                              <>
                                <TableCell>
                                  <Input
                                    value={editingUser.name}
                                    onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={editingUser.username}
                                    onChange={(e) => setEditingUser({...editingUser, username: e.target.value})}
                                  />
                                </TableCell>
                                <TableCell>
                                  <select 
                                    className="w-full px-2 py-1 border rounded"
                                    value={editingUser.type}
                                    onChange={(e) => setEditingUser({...editingUser, type: e.target.value})}
                                  >
                                    <option value="driver">Conductor</option>
                                    <option value="admin">Administrador</option>
                                  </select>
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={editingUser.phone}
                                    onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})}
                                  />
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button size="sm" onClick={() => handleSaveUser(editingUser)} disabled={loading}>
                                      <Save size={14} />
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => setEditingUser(null)}>
                                      Cancelar
                                    </Button>
                                  </div>
                                </TableCell>
                              </>
                            ) : (
                              <>
                                <TableCell>{user.name}</TableCell>
                                <TableCell>{user.username}</TableCell>
                                <TableCell>
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    user.type === 'driver' ? 'bg-green-100 text-green-800' : 
                                    user.type === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {user.type === 'driver' ? 'Conductor' : 
                                     user.type === 'admin' ? 'Administrador' : 'Usuario'}
                                  </span>
                                </TableCell>
                                <TableCell>{user.phone}</TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button size="sm" variant="outline" onClick={() => setEditingUser(user)}>
                                      <Edit size={14} />
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleDeleteUser(user.id)} disabled={loading}>
                                      <Trash2 size={14} />
                                    </Button>
                                  </div>
                                </TableCell>
                              </>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="images">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Agregar Nueva Imagen</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label>Título</Label>
                      <Input
                        value={newImage.title}
                        onChange={(e) => setNewImage({...newImage, title: e.target.value})}
                        placeholder="Título de la imagen"
                      />
                    </div>
                    <div>
                      <Label>Categoría</Label>
                      <Input
                        value={newImage.category}
                        onChange={(e) => setNewImage({...newImage, category: e.target.value})}
                        placeholder="Ej: Terminal, Turismo, etc."
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Subir Imagen desde Dispositivo</Label>
                      <div className="flex gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="flex-1"
                        />
                        <Button size="sm" variant="outline">
                          <Upload size={16} className="mr-1" />
                          Subir
                        </Button>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <Label>O URL de la Imagen</Label>
                      <Input
                        value={newImage.url}
                        onChange={(e) => setNewImage({...newImage, url: e.target.value})}
                        placeholder="https://ejemplo.com/imagen.jpg"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Descripción</Label>
                      <Input
                        value={newImage.description}
                        onChange={(e) => setNewImage({...newImage, description: e.target.value})}
                        placeholder="Descripción de la imagen"
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddImage}>
                    <Camera size={16} className="mr-1" />
                    Agregar Imagen
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Galería de Maneiro</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {images.map((image) => (
                      <Card key={image.id} className="overflow-hidden">
                        <img 
                          src={image.url} 
                          alt={image.title} 
                          className="w-full h-48 object-cover"
                        />
                        <CardContent className="p-4">
                          <h3 className="font-bold text-lg mb-2">{image.title}</h3>
                          <p className="text-gray-600 text-sm mb-2">{image.description}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                              {image.category}
                            </span>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteImage(image.id)}>
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="map">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Agregar Punto de Interés</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label>Nombre del Punto</Label>
                      <Input
                        value={newPointOfInterest.name}
                        onChange={(e) => setNewPointOfInterest({...newPointOfInterest, name: e.target.value})}
                        placeholder="Ej: Centro Comercial"
                      />
                    </div>
                    <div>
                      <Label>Categoría</Label>
                      <select 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={newPointOfInterest.category}
                        onChange={(e) => setNewPointOfInterest({...newPointOfInterest, category: e.target.value})}
                      >
                        <option value="">Seleccionar categoría</option>
                        <option value="Comercial">Comercial</option>
                        <option value="Turístico">Turístico</option>
                        <option value="Educativo">Educativo</option>
                        <option value="Salud">Salud</option>
                      </select>
                    </div>
                    <div>
                      <Label>Latitud</Label>
                      <Input
                        value={newPointOfInterest.lat}
                        onChange={(e) => setNewPointOfInterest({...newPointOfInterest, lat: parseFloat(e.target.value) || 0})}
                        placeholder="11.0000"
                        type="number"
                        step="0.0001"
                      />
                    </div>
                    <div>
                      <Label>Longitud</Label>
                      <Input
                        value={newPointOfInterest.lng}
                        onChange={(e) => setNewPointOfInterest({...newPointOfInterest, lng: parseFloat(e.target.value) || 0})}
                        placeholder="-63.8500"
                        type="number"
                        step="0.0001"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Descripción</Label>
                      <Input
                        value={newPointOfInterest.description}
                        onChange={(e) => setNewPointOfInterest({...newPointOfInterest, description: e.target.value})}
                        placeholder="Descripción del punto de interés"
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddPointOfInterest}>
                    <Plus size={16} className="mr-1" />
                    Agregar Punto de Interés
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Puntos de Interés</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Coordenadas</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pointsOfInterest.map((poi) => (
                        <TableRow key={poi.id}>
                          <TableCell>{poi.name}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs ${
                              poi.category === 'Turístico' ? 'bg-blue-100 text-blue-800' :
                              poi.category === 'Comercial' ? 'bg-green-100 text-green-800' :
                              poi.category === 'Educativo' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {poi.category}
                            </span>
                          </TableCell>
                          <TableCell>{poi.lat?.toFixed(4)}, {poi.lng?.toFixed(4)}</TableCell>
                          <TableCell>{poi.description}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="destructive" onClick={() => handleDeletePointOfInterest(poi.id)}>
                              <Trash2 size={16} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
