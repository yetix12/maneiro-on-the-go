import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Shield, Building2 } from 'lucide-react';
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
  parroquia?: {
    nombre: string;
  };
}

interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
}

interface Parroquia {
  id: string;
  nombre: string;
}

const AdminsManager: React.FC = () => {
  const { toast } = useToast();
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [parroquias, setParroquias] = useState<Parroquia[]>([]);
  const [loading, setLoading] = useState(false);
  const [newRole, setNewRole] = useState({
    user_id: '',
    role: 'admin_parroquia' as 'admin_general' | 'admin_parroquia',
    parroquia_id: ''
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

      // Load parroquias
      const { data: parroquiasData, error: parroquiasError } = await supabase
        .from('parroquias')
        .select('id, nombre')
        .eq('is_active', true);

      if (parroquiasError) throw parroquiasError;

      // Merge roles with profiles and parroquias
      const enrichedRoles = (rolesData || []).map(role => {
        const profile = profilesData?.find(p => p.id === role.user_id);
        const parroquia = parroquiasData?.find(p => p.id === role.parroquia_id);
        return {
          ...role,
          profile: profile || { full_name: null, username: null },
          parroquia: parroquia || { nombre: '' }
        };
      });

      setUserRoles(enrichedRoles);
      setProfiles(profilesData || []);
      setParroquias(parroquiasData || []);
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
        description: "Selecciona una parroquia para el administrador de parroquia",
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

      // Also update profile user_type
      await supabase
        .from('profiles')
        .update({ user_type: newRole.role })
        .eq('id', newRole.user_id);

      toast({ title: "Éxito", description: "Rol asignado exitosamente" });
      setNewRole({ user_id: '', role: 'admin_parroquia', parroquia_id: '' });
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo asignar el rol",
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield size={24} />
            Asignar Nuevo Administrador
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <SelectItem value="admin_general">Administrador General</SelectItem>
                  <SelectItem value="admin_parroquia">Administrador de Parroquia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newRole.role === 'admin_parroquia' && (
              <div>
                <Label>Parroquia *</Label>
                <Select
                  value={newRole.parroquia_id}
                  onValueChange={(value) => setNewRole({ ...newRole, parroquia_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar parroquia" />
                  </SelectTrigger>
                  <SelectContent>
                    {parroquias.map((parroquia) => (
                      <SelectItem key={parroquia.id} value={parroquia.id}>
                        {parroquia.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-end">
              <Button onClick={handleAddRole} className="w-full">
                <Plus size={16} className="mr-2" />
                Asignar Rol
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Administradores del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Parroquia</TableHead>
                <TableHead>Fecha Asignación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userRoles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>
                    {role.profile?.full_name || role.profile?.username || 'Usuario'}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      role.role === 'admin_general' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {role.role === 'admin_general' ? 'Admin General' : 'Admin Parroquia'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {role.parroquia?.nombre || '-'}
                  </TableCell>
                  <TableCell>
                    {new Date(role.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => handleDeleteRole(role.id, role.user_id)}
                    >
                      <Trash2 size={16} />
                    </Button>
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
