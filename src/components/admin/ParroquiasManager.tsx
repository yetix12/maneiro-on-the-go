import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface Parroquia {
  id: string;
  nombre: string;
  municipio: string | null;
  estado: string | null;
  descripcion: string | null;
  is_active: boolean;
}

const ParroquiasManager: React.FC = () => {
  const { toast } = useToast();
  const [parroquias, setParroquias] = useState<Parroquia[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newParroquia, setNewParroquia] = useState({
    nombre: '',
    municipio: '',
    estado: 'Nueva Esparta',
    descripcion: ''
  });
  const [editData, setEditData] = useState<Partial<Parroquia>>({});

  useEffect(() => {
    loadParroquias();
  }, []);

  const loadParroquias = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('parroquias')
        .select('*')
        .order('nombre');

      if (error) throw error;
      setParroquias(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar las parroquias",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newParroquia.nombre) {
      toast({
        title: "Error",
        description: "El nombre es obligatorio",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('parroquias')
        .insert([newParroquia]);

      if (error) throw error;

      toast({ title: "Éxito", description: "Parroquia creada exitosamente" });
      setNewParroquia({ nombre: '', municipio: '', estado: 'Nueva Esparta', descripcion: '' });
      loadParroquias();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la parroquia",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (parroquia: Parroquia) => {
    setEditingId(parroquia.id);
    setEditData(parroquia);
  };

  const handleSave = async () => {
    if (!editingId || !editData.nombre) return;

    try {
      const { error } = await supabase
        .from('parroquias')
        .update({
          nombre: editData.nombre,
          municipio: editData.municipio,
          estado: editData.estado,
          descripcion: editData.descripcion,
          is_active: editData.is_active
        })
        .eq('id', editingId);

      if (error) throw error;

      toast({ title: "Éxito", description: "Parroquia actualizada" });
      setEditingId(null);
      loadParroquias();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta parroquia?')) return;

    try {
      const { error } = await supabase
        .from('parroquias')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({ title: "Éxito", description: "Parroquia eliminada" });
      loadParroquias();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Agregar Nueva Parroquia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Nombre *</Label>
              <Input
                value={newParroquia.nombre}
                onChange={(e) => setNewParroquia({ ...newParroquia, nombre: e.target.value })}
                placeholder="Nombre de la parroquia"
              />
            </div>
            <div>
              <Label>Municipio</Label>
              <Input
                value={newParroquia.municipio}
                onChange={(e) => setNewParroquia({ ...newParroquia, municipio: e.target.value })}
                placeholder="Municipio"
              />
            </div>
            <div>
              <Label>Estado</Label>
              <Input
                value={newParroquia.estado}
                onChange={(e) => setNewParroquia({ ...newParroquia, estado: e.target.value })}
                placeholder="Estado"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAdd} className="w-full">
                <Plus size={16} className="mr-2" />
                Agregar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Parroquias Registradas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Municipio</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Activa</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parroquias.map((parroquia) => (
                <TableRow key={parroquia.id}>
                  <TableCell>
                    {editingId === parroquia.id ? (
                      <Input
                        value={editData.nombre || ''}
                        onChange={(e) => setEditData({ ...editData, nombre: e.target.value })}
                      />
                    ) : (
                      parroquia.nombre
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === parroquia.id ? (
                      <Input
                        value={editData.municipio || ''}
                        onChange={(e) => setEditData({ ...editData, municipio: e.target.value })}
                      />
                    ) : (
                      parroquia.municipio || '-'
                    )}
                  </TableCell>
                  <TableCell>{parroquia.estado || '-'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      parroquia.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {parroquia.is_active ? 'Activa' : 'Inactiva'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {editingId === parroquia.id ? (
                      <>
                        <Button size="sm" onClick={handleSave}>
                          <Save size={16} />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                          <X size={16} />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(parroquia)}>
                          <Edit size={16} />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(parroquia.id)}>
                          <Trash2 size={16} />
                        </Button>
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
};

export default ParroquiasManager;
