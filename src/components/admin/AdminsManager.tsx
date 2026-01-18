import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Shield, Edit, Save, X, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  parroquia_id: string | null;
  created_at: string;
  profile?: {
    full_name: string | null;
    username: string | null;
  };
  municipio?: {
    nombre: string;
  };
}

interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
}

interface Municipio {
  id: string;
  nombre: string;
}

const AdminsManager: React.FC = () => {
  const { toast } = useToast();
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{
    parroquia_id?: string | null;
    full_name?: string | null;
  }>({});
  const [newRole, setNewRole] = useState({
    user_id: '',
    role: 'admin_parroquia' as 'admin_general' | 'admin_parroquia',
    parroquia_id: '',
    new_name: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load user roles with profiles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .in('role', ['admin_general', 'admin_parroquia']);

      if (rolesError) throw rolesError;

      // Load all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, username');

      if (profilesError) throw profilesError;

      // Load municipios
      const { data: municipiosData, error: municipiosError } = await supabase
        .from('parroquias')
        .select('id, nombre')
        .eq('is_active', true);

      if (municipiosError) throw municipiosError;

      // Merge roles with profiles and municipios
      const enrichedRoles = (rolesData || []).map(role => {
        const profile = profilesData?.find(p => p.id === role.user_id);
        const municipio = municipiosData?.find(m => m.id === role.parroquia_id);
        return {
          ...role,
          profile: profile || { full_name: null, username: null },
          municipio: municipio || { nombre: '' }
        };
      });

      setUserRoles(enrichedRoles);
      setProfiles(profilesData || []);
      setMunicipios(municipiosData || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar los datos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddRole = async () => {
    if (!newRole.user_id || !newRole.role) {
      toast({
        title: "Error",
        description: "Selecciona un usuario y un rol",
        variant: "destructive"
      });
      return;
    }

    if (newRole.role === 'admin_parroquia' && !newRole.parroquia_id) {
      toast({
        title: "Error",
        description: "Selecciona un municipio para el administrador de municipio",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('user_roles')
        .insert([{
          user_id: newRole.user_id,
          role: newRole.role,
          parroquia_id: newRole.role === 'admin_parroquia' ? newRole.parroquia_id : null
        }]);

      if (error) throw error;

      // Also update profile user_type and name if new_name is provided
      const updateData: any = { user_type: newRole.role };
      if (newRole.new_name.trim()) {
        updateData.full_name = newRole.new_name.trim();
      }

      await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', newRole.user_id);

      toast({ title: "Éxito", description: "Rol asignado exitosamente" });
      setNewRole({ user_id: '', role: 'admin_parroquia', parroquia_id: '', new_name: '' });
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo asignar el rol",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (role: UserRole) => {
    setEditingId(role.id);
    setEditData({
      parroquia_id: role.parroquia_id,
      full_name: role.profile?.full_name || ''
    });
  };

  const handleSave = async () => {
    if (!editingId) return;

    try {
      const role = userRoles.find(r => r.id === editingId);
      if (!role) return;

      // Update role municipio if applicable
      if (role.role === 'admin_parroquia') {
        const { error } = await supabase
          .from('user_roles')
          .update({ parroquia_id: editData.parroquia_id || null })
          .eq('id', editingId);

        if (error) throw error;
      }

      // Update profile name
      if (editData.full_name !== undefined) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ full_name: editData.full_name })
          .eq('id', role.user_id);

        if (profileError) throw profileError;
      }

      toast({ title: "Éxito", description: "Administrador actualizado" });
      setEditingId(null);
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar",
        variant: "destructive"
      });
    }
  };

  const handleDeleteRole = async (id: string, userId: string) => {
    if (!confirm('¿Estás seguro de eliminar este rol de administrador?')) return;

    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Reset user type to passenger
      await supabase
        .from('profiles')
        .update({ user_type: 'passenger' })
        .eq('id', userId);

      toast({ title: "Éxito", description: "Rol eliminado" });
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el rol",
        variant: "destructive"
      });
    }
  };

  // Filter profiles that don't have admin roles yet
  const availableProfiles = profiles.filter(
    profile => !userRoles.some(role => role.user_id === profile.id)
  );

  // Get selected profile for new name hint
  const selectedProfile = profiles.find(p => p.id === newRole.user_id);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield size={24} />
            Agregar Administrador
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label>Usuario *</Label>
              <Select
                value={newRole.user_id}
                onValueChange={(value) => setNewRole({ ...newRole, user_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar usuario" />
                </SelectTrigger>
                <SelectContent>
                  {availableProfiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.full_name || profile.username || 'Usuario sin nombre'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Rol *</Label>
              <Select
                value={newRole.role}
                onValueChange={(value: 'admin_general' | 'admin_parroquia') => setNewRole({ ...newRole, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin_parroquia">Administrador de Municipio</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Los Admin General solo se crean desde la base de datos.
              </p>
            </div>
            {newRole.role === 'admin_parroquia' && (
              <div>
                <Label>Municipio *</Label>
                <Select
                  value={newRole.parroquia_id}
                  onValueChange={(value) => setNewRole({ ...newRole, parroquia_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar municipio" />
                  </SelectTrigger>
                  <SelectContent>
                    {municipios.map((municipio) => (
                      <SelectItem key={municipio.id} value={municipio.id}>
                        {municipio.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label className="flex items-center gap-1">
                <UserPlus size={14} />
                Nuevo Nombre (opcional)
              </Label>
              <Input
                value={newRole.new_name}
                onChange={(e) => setNewRole({ ...newRole, new_name: e.target.value })}
                placeholder={selectedProfile?.full_name || "Nombre del usuario"}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Deja vacío para mantener el nombre actual
              </p>
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddRole} className="w-full bg-green-600 hover:bg-green-700">
                <Plus size={16} className="mr-2" />
                Agregar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Editar Administradores</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Municipio</TableHead>
                <TableHead>Fecha Asignación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userRoles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>
                    {editingId === role.id ? (
                      <Input
                        value={editData.full_name || ''}
                        onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                        placeholder="Nombre completo"
                      />
                    ) : (
                      role.profile?.full_name || role.profile?.username || 'Usuario'
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      role.role === 'admin_general' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {role.role === 'admin_general' ? 'Admin General' : 'Admin Municipio'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {editingId === role.id && role.role === 'admin_parroquia' ? (
                      <Select
                        value={editData.parroquia_id || ''}
                        onValueChange={(value) => setEditData({ ...editData, parroquia_id: value })}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {municipios.map((m) => (
                            <SelectItem key={m.id} value={m.id}>{m.nombre}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      role.municipio?.nombre || '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(role.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {editingId === role.id ? (
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
                        <Button size="sm" variant="outline" onClick={() => handleEdit(role)}>
                          <Edit size={16} />
                        </Button>
                        {role.role !== 'admin_general' && (
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => handleDeleteRole(role.id, role.user_id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        )}
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {userRoles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No hay administradores asignados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminsManager;
