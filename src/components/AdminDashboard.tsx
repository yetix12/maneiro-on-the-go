import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, Plus, Edit, Trash2, Save, MapPin, Image, Users, Map, Upload, Camera } from 'lucide-react';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  // Estado para rutas
  const [routes, setRoutes] = useState([
    {
      id: 'ruta-1',
      name: 'Pampatar - Porlamar',
      description: 'Conecta el centro histórico con la zona comercial',
      frequency: '15-20 min',
      operatingHours: '5:00 AM - 10:00 PM',
      fare: 'Bs. 2.50',
      color: '#3B82F6'
    },
    {
      id: 'ruta-2',
      name: 'Pampatar - Playa El Agua',
      description: 'Ruta turística hacia las mejores playas',
      frequency: '30-45 min',
      operatingHours: '6:00 AM - 8:00 PM',
      fare: 'Bs. 3.00',
      color: '#10B981'
    }
  ]);

  // Estado para usuarios con contraseñas
  const [users, setUsers] = useState([
    {
      id: '1',
      name: 'Pakito',
      username: 'pakito',
      password: '123456',
      type: 'passenger',
      email: 'pakito@email.com',
      phone: '+58 424-123-4567'
    },
    {
      id: '2',
      name: 'Pablo',
      username: 'pablo',
      password: '123456',
      type: 'driver',
      email: 'pablo@email.com',
      phone: '+58 416-765-4321',
      vehicle: 'BUS-001'
    }
  ]);

  // Estado para imágenes
  const [images, setImages] = useState([
    {
      id: '1',
      title: 'Terminal Pampatar',
      description: 'Estación principal de autobuses',
      url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500',
      category: 'Terminal'
    },
    {
      id: '2',
      title: 'Playa El Agua',
      description: 'Hermosa playa de Maneiro',
      url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500',
      category: 'Turismo'
    }
  ]);

  // Estado para puntos de interés
  const [pointsOfInterest, setPointsOfInterest] = useState([
    {
      id: '1',
      name: 'Hospital Central',
      description: 'Centro médico principal',
      lat: 11.0150,
      lng: -63.8500,
      category: 'Salud'
    },
    {
      id: '2',
      name: 'Universidad UPEL',
      description: 'Instituto universitario',
      lat: 11.0200,
      lng: -63.8400,
      category: 'Educación'
    }
  ]);

  const [editingRoute, setEditingRoute] = useState<any>(null);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newImage, setNewImage] = useState({ title: '', description: '', url: '', category: '' });
  const [newUser, setNewUser] = useState({ 
    name: '', 
    username: '', 
    password: '',
    type: 'passenger', 
    email: '', 
    phone: '', 
    vehicle: '' 
  });
  const [newPointOfInterest, setNewPointOfInterest] = useState({
    name: '',
    description: '',
    lat: 0,
    lng: 0,
    category: ''
  });

  const handleSaveRoute = (route: any) => {
    setRoutes(routes.map(r => r.id === route.id ? route : r));
    setEditingRoute(null);
    // Simular actualización en tiempo real para todos los usuarios
    console.log('Ruta actualizada y sincronizada con todos los usuarios:', route);
  };

  const handleDeleteRoute = (id: string) => {
    setRoutes(routes.filter(r => r.id !== id));
  };

  const handleAddUser = () => {
    if (newUser.name && newUser.username && newUser.email && newUser.password) {
      const user = { 
        ...newUser, 
        id: Date.now().toString() 
      };
      setUsers([...users, user]);
      setNewUser({ name: '', username: '', password: '', type: 'passenger', email: '', phone: '', vehicle: '' });
      // Guardar usuario en localStorage para persistencia
      const savedUsers = JSON.parse(localStorage.getItem('app_users') || '[]');
      savedUsers.push(user);
      localStorage.setItem('app_users', JSON.stringify(savedUsers));
      console.log('Usuario guardado y disponible para login:', user);
    }
  };

  const handleSaveUser = (user: any) => {
    setUsers(users.map(u => u.id === user.id ? user : u));
    setEditingUser(null);
    // Actualizar en localStorage
    const savedUsers = JSON.parse(localStorage.getItem('app_users') || '[]');
    const updatedUsers = savedUsers.map((u: any) => u.id === user.id ? user : u);
    localStorage.setItem('app_users', JSON.stringify(updatedUsers));
  };

  const handleDeleteUser = (id: string) => {
    setUsers(users.filter(u => u.id !== id));
    // Eliminar de localStorage
    const savedUsers = JSON.parse(localStorage.getItem('app_users') || '[]');
    const filteredUsers = savedUsers.filter((u: any) => u.id !== id);
    localStorage.setItem('app_users', JSON.stringify(filteredUsers));
  };

  const handleAddImage = () => {
    if (newImage.title && newImage.url) {
      setImages([...images, { ...newImage, id: Date.now().toString() }]);
      setNewImage({ title: '', description: '', url: '', category: '' });
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

  const handleDeleteImage = (id: string) => {
    setImages(images.filter(img => img.id !== id));
  };

  const handleAddPointOfInterest = () => {
    if (newPointOfInterest.name && newPointOfInterest.lat && newPointOfInterest.lng) {
      setPointsOfInterest([...pointsOfInterest, { 
        ...newPointOfInterest, 
        id: Date.now().toString() 
      }]);
      setNewPointOfInterest({ name: '', description: '', lat: 0, lng: 0, category: '' });
    }
  };

  const handleDeletePointOfInterest = (id: string) => {
    setPointsOfInterest(pointsOfInterest.filter(poi => poi.id !== id));
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
        <Tabs defaultValue="routes" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
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
            <TabsTrigger value="map" className="flex items-center gap-2">
              <Map size={16} />
              Mapa
            </TabsTrigger>
          </TabsList>

          <TabsContent value="routes">
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Rutas de Transporte</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {routes.map((route) => (
                    <Card key={route.id} className="p-4">
                      {editingRoute?.id === route.id ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Nombre de la Ruta</Label>
                              <Input
                                value={editingRoute.name}
                                onChange={(e) => setEditingRoute({...editingRoute, name: e.target.value})}
                              />
                            </div>
                            <div>
                              <Label>Frecuencia</Label>
                              <Input
                                value={editingRoute.frequency}
                                onChange={(e) => setEditingRoute({...editingRoute, frequency: e.target.value})}
                              />
                            </div>
                            <div>
                              <Label>Horarios</Label>
                              <Input
                                value={editingRoute.operatingHours}
                                onChange={(e) => setEditingRoute({...editingRoute, operatingHours: e.target.value})}
                              />
                            </div>
                            <div>
                              <Label>Tarifa</Label>
                              <Input
                                value={editingRoute.fare}
                                onChange={(e) => setEditingRoute({...editingRoute, fare: e.target.value})}
                              />
                            </div>
                          </div>
                          <div>
                            <Label>Descripción</Label>
                            <Input
                              value={editingRoute.description}
                              onChange={(e) => setEditingRoute({...editingRoute, description: e.target.value})}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={() => handleSaveRoute(editingRoute)}>
                              <Save size={16} className="mr-1" />
                              Guardar Cambios
                            </Button>
                            <Button variant="outline" onClick={() => setEditingRoute(null)}>
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-lg">{route.name}</h3>
                            <p className="text-gray-600">{route.description}</p>
                            <div className="mt-2 text-sm text-gray-500">
                              <p>Frecuencia: {route.frequency}</p>
                              <p>Horario: {route.operatingHours}</p>
                              <p>Tarifa: {route.fare}</p>
                            </div>
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
                      )}
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
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
                      <Label>Contraseña</Label>
                      <Input
                        value={newUser.password}
                        onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                        placeholder="Contraseña"
                        type="password"
                      />
                    </div>
                    <div>
                      <Label>Tipo de Usuario</Label>
                      <select 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={newUser.type}
                        onChange={(e) => setNewUser({...newUser, type: e.target.value})}
                      >
                        <option value="passenger">Pasajero</option>
                        <option value="driver">Conductor</option>
                      </select>
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
                  <Button onClick={handleAddUser}>
                    <Plus size={16} className="mr-1" />
                    Agregar Usuario
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Lista de Usuarios</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Teléfono</TableHead>
                        <TableHead>Vehículo</TableHead>
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
                                  <option value="passenger">Pasajero</option>
                                  <option value="driver">Conductor</option>
                                </select>
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={editingUser.email}
                                  onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={editingUser.phone}
                                  onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={editingUser.vehicle || ''}
                                  onChange={(e) => setEditingUser({...editingUser, vehicle: e.target.value})}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button size="sm" onClick={() => handleSaveUser(editingUser)}>
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
                                  user.type === 'driver' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {user.type === 'driver' ? 'Conductor' : 'Pasajero'}
                                </span>
                              </TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>{user.phone}</TableCell>
                              <TableCell>{user.vehicle || '-'}</TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button size="sm" variant="outline" onClick={() => setEditingUser(user)}>
                                    <Edit size={14} />
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => handleDeleteUser(user.id)}>
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
                  <CardTitle>Galería de Imágenes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Imagen</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {images.map((image) => (
                        <TableRow key={image.id}>
                          <TableCell>
                            <img src={image.url} alt={image.title} className="w-16 h-16 object-cover rounded" />
                          </TableCell>
                          <TableCell>{image.title}</TableCell>
                          <TableCell>{image.category}</TableCell>
                          <TableCell>{image.description}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteImage(image.id)}>
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

          <TabsContent value="map">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Agregar Punto de Interés</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label>Nombre</Label>
                      <Input
                        value={newPointOfInterest.name}
                        onChange={(e) => setNewPointOfInterest({...newPointOfInterest, name: e.target.value})}
                        placeholder="Nombre del lugar"
                      />
                    </div>
                    <div>
                      <Label>Categoría</Label>
                      <Input
                        value={newPointOfInterest.category}
                        onChange={(e) => setNewPointOfInterest({...newPointOfInterest, category: e.target.value})}
                        placeholder="Ej: Salud, Educación, etc."
                      />
                    </div>
                    <div>
                      <Label>Latitud</Label>
                      <Input
                        value={newPointOfInterest.lat}
                        onChange={(e) => setNewPointOfInterest({...newPointOfInterest, lat: parseFloat(e.target.value)})}
                        placeholder="11.0000"
                        type="number"
                        step="0.0001"
                      />
                    </div>
                    <div>
                      <Label>Longitud</Label>
                      <Input
                        value={newPointOfInterest.lng}
                        onChange={(e) => setNewPointOfInterest({...newPointOfInterest, lng: parseFloat(e.target.value)})}
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
                          <TableCell>{poi.category}</TableCell>
                          <TableCell>{poi.lat.toFixed(4)}, {poi.lng.toFixed(4)}</TableCell>
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
