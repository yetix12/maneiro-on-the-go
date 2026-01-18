import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface Municipio {
  id: string;
  nombre: string;
  municipio: string | null;
  estado: string | null;
  descripcion: string | null;
}

const MunicipiosManager: React.FC = () => {
  const { toast } = useToast();
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newMunicipio, setNewMunicipio] = useState({
    nombre: '',
    municipio: '',
    estado: 'Nueva Esparta',
    descripcion: ''
  });
  const [editData, setEditData] = useState<Partial<Municipio>>({});

  useEffect(() => {
    loadMunicipios();
  }, []);

  const loadMunicipios = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('parroquias')
        .select('id, nombre, municipio, estado, descripcion')
        .order('nombre');

      if (error) throw error;
      setMunicipios(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar los municipios",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newMunicipio.nombre) {
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
        .insert([newMunicipio]);

      if (error) throw error;

      toast({ title: "Éxito", description: "Municipio creado exitosamente" });
      setNewMunicipio({ nombre: '', municipio: '', estado: 'Nueva Esparta', descripcion: '' });
      loadMunicipios();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el municipio",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (municipio: Municipio) => {
    setEditingId(municipio.id);
    setEditData(municipio);
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
          descripcion: editData.descripcion
        })
        .eq('id', editingId);

      if (error) throw error;

      toast({ title: "Éxito", description: "Municipio actualizado" });
      setEditingId(null);
      loadMunicipios();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este municipio?')) return;

    try {
      const { error } = await supabase
        .from('parroquias')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({ title: "Éxito", description: "Municipio eliminado" });
      loadMunicipios();
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
          <CardTitle>Agregar Nuevo Municipio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Nombre *</Label>
              <Input
                value={newMunicipio.nombre}
                onChange={(e) => setNewMunicipio({ ...newMunicipio, nombre: e.target.value })}
                placeholder="Nombre del municipio"
              />
            </div>
            <div>
              <Label>Zona/Área</Label>
              <Input
                value={newMunicipio.municipio}
                onChange={(e) => setNewMunicipio({ ...newMunicipio, municipio: e.target.value })}
                placeholder="Zona o área"
              />
            </div>
            <div>
              <Label>Estado</Label>
              <Input
                value={newMunicipio.estado}
                onChange={(e) => setNewMunicipio({ ...newMunicipio, estado: e.target.value })}
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
          <CardTitle>Municipios Registrados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Zona/Área</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {municipios.map((municipio) => (
                <TableRow key={municipio.id}>
                  <TableCell>
                    {editingId === municipio.id ? (
                      <Input
                        value={editData.nombre || ''}
                        onChange={(e) => setEditData({ ...editData, nombre: e.target.value })}
                      />
                    ) : (
                      municipio.nombre
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === municipio.id ? (
                      <Input
                        value={editData.municipio || ''}
                        onChange={(e) => setEditData({ ...editData, municipio: e.target.value })}
                      />
                    ) : (
                      municipio.municipio || '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === municipio.id ? (
                      <Input
                        value={editData.estado || ''}
                        onChange={(e) => setEditData({ ...editData, estado: e.target.value })}
                      />
                    ) : (
                      municipio.estado || '-'
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {editingId === municipio.id ? (
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
                        <Button size="sm" variant="outline" onClick={() => handleEdit(municipio)}>
                          <Edit size={16} />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(municipio.id)}>
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

export default MunicipiosManager;
