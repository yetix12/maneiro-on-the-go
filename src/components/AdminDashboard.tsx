
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LogOut, Plus, Edit, Trash2, Save, MapPin, Image } from 'lucide-react';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('routes');
  
  // Estado para rutas
  const [routes, setRoutes] = useState([
    {
      id: 'ruta-1',
      name: 'Pampatar - Porlamar',
      description: 'Conecta el centro histórico con la zona comercial',
      frequency: '15-20 min',
      operatingHours: '5:00 AM - 10:00 PM',
      fare: 'Bs. 2.50',
      color: '#3B82F6',
      stops: ['Terminal Pampatar', 'Plaza Bolívar', 'Centro Comercial', 'Terminal Porlamar']
    },
    {
      id: 'ruta-2',
      name: 'Pampatar - Playa El Agua',
      description: 'Ruta turística hacia las mejores playas',
      frequency: '30-45 min',
      operatingHours: '6:00 AM - 8:00 PM',
      fare: 'Bs. 3.00',
      color: '#10B981',
      stops: ['Terminal Pampatar', 'El Tirano', 'Pedro González', 'Manzanillo', 'Playa El Agua']
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

  const [editingRoute, setEditingRoute] = useState<any>(null);
  const [editingImage, setEditingImage] = useState<any>(null);
  const [newImage, setNewImage] = useState({ title: '', description: '', url: '', category: '' });

  const handleSaveRoute = (route: any) => {
    setRoutes(routes.map(r => r.id === route.id ? route : r));
    setEditingRoute(null);
  };

  const handleDeleteRoute = (id: string) => {
    setRoutes(routes.filter(r => r.id !== id));
  };

  const handleAddImage = () => {
    if (newImage.title && newImage.url) {
      setImages([...images, { ...newImage, id: Date.now().toString() }]);
      setNewImage({ title: '', description: '', url: '', category: '' });
    }
  };

  const handleDeleteImage = (id: string) => {
    setImages(images.filter(img => img.id !== id));
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
        <div className="flex space-x-4 mb-6">
          <Button
            variant={activeTab === 'routes' ? 'default' : 'outline'}
            onClick={() => setActiveTab('routes')}
            className="flex items-center gap-2"
          >
            <MapPin size={16} />
            Gestionar Rutas
          </Button>
          <Button
            variant={activeTab === 'images' ? 'default' : 'outline'}
            onClick={() => setActiveTab('images')}
            className="flex items-center gap-2"
          >
            <Image size={16} />
            Gestionar Imágenes
          </Button>
        </div>

        {activeTab === 'routes' && (
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
                            Guardar
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
        )}

        {activeTab === 'images' && (
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
                    <Label>URL de la Imagen</Label>
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
                  <Plus size={16} className="mr-1" />
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
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
