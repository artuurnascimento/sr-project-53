import { useState } from 'react';
import { Plus, Edit, Trash2, Search, UserPlus, Shield, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AdminLayout from '@/components/layout/AdminLayout';
import { useProfiles, useUpdateProfile, useDeleteProfile } from '@/hooks/useProfiles';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

const Registrations = () => {
  const queryClient = useQueryClient();
  const { profile: currentUserProfile } = useAuth();
  const { data: profiles, isLoading } = useProfiles();
  const updateProfile = useUpdateProfile();
  const deleteProfile = useDeleteProfile();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isCreating, setIsCreating] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    employee_id: '',
    department: '',
    position: '',
    role: 'employee' as 'employee' | 'admin' | 'manager',
    is_active: true,
  });

  const isAdmin = currentUserProfile?.role === 'admin';
  const isManager = currentUserProfile?.role === 'manager';

  // Verificar se pode editar/deletar um perfil
  const canModifyProfile = (targetProfile: any) => {
    if (isAdmin) return true; // Admin pode tudo
    if (isManager) {
      // Gerente só pode modificar colaboradores
      return targetProfile.role === 'employee';
    }
    return false;
  };

  // Verificar se pode criar um cargo específico
  const canCreateRole = (role: string) => {
    if (isAdmin) return true; // Admin pode criar qualquer cargo
    if (isManager) {
      // Gerente só pode criar colaboradores
      return role === 'employee';
    }
    return false;
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      password: '',
      employee_id: '',
      department: '',
      position: '',
      role: 'employee',
      is_active: true,
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.password || formData.password.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    // Validar permissão para criar este cargo
    if (!canCreateRole(formData.role)) {
      toast.error('Você não tem permissão para criar este tipo de cargo');
      return;
    }

    setIsCreating(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          employee_id: formData.employee_id.trim() || undefined,
          department: formData.department || undefined,
          position: formData.position || undefined,
          role: formData.role,
          is_active: formData.is_active,
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Erro ao criar colaborador');
      }

      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast.success('Colaborador criado com sucesso!');
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Error creating profile:', error);
      
      if (error.message?.includes('duplicate key') || error.message?.includes('already registered')) {
        toast.error('Email ou ID de funcionário já cadastrado');
      } else if (error.message?.includes('Only admins and managers')) {
        toast.error('Você não tem permissão para criar usuários');
      } else if (error.message?.includes('Managers can only create employees')) {
        toast.error('Gerentes só podem criar colaboradores');
      } else {
        toast.error('Erro ao criar colaborador: ' + (error.message || 'Erro desconhecido'));
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile) return;
    
    // Validar permissão para editar
    if (!canModifyProfile(selectedProfile)) {
      toast.error('Você não tem permissão para editar este usuário');
      return;
    }

    // Validar permissão para alterar cargo
    if (selectedProfile.role !== formData.role && !canCreateRole(formData.role)) {
      toast.error('Você não tem permissão para alterar para este cargo');
      return;
    }
    
    const employeeId = formData.employee_id.trim() || `EMP${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    
    await updateProfile.mutateAsync({
      id: selectedProfile.id,
      full_name: formData.full_name,
      email: formData.email,
      employee_id: employeeId,
      department: formData.department || null,
      position: formData.position || null,
      role: formData.role,
      is_active: formData.is_active,
    });
    
    setIsEditDialogOpen(false);
    setSelectedProfile(null);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    const targetProfile = profiles?.find(p => p.id === id);
    
    if (!targetProfile) return;
    
    // Validar permissão para deletar
    if (!canModifyProfile(targetProfile)) {
      toast.error('Você não tem permissão para remover este usuário');
      return;
    }
    
    if (confirm('Tem certeza que deseja remover este colaborador?')) {
      await deleteProfile.mutateAsync(id);
    }
  };

  const openEditDialog = (profile: any) => {
    // Validar permissão para editar
    if (!canModifyProfile(profile)) {
      toast.error('Você não tem permissão para editar este usuário');
      return;
    }
    
    setSelectedProfile(profile);
    setFormData({
      full_name: profile.full_name,
      email: profile.email,
      password: '',
      employee_id: profile.employee_id || '',
      department: profile.department || '',
      position: profile.position || '',
      role: profile.role,
      is_active: profile.is_active,
    });
    setIsEditDialogOpen(true);
  };

  const getDepartments = () => {
    if (!profiles) return [];
    const departments = [...new Set(profiles.map(p => p.department).filter(Boolean))];
    return departments;
  };

  const filteredProfiles = profiles?.filter(profile => {
    const searchMatch = !searchTerm || 
      profile.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.employee_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const departmentMatch = departmentFilter === 'all' || profile.department === departmentFilter;
    const roleMatch = roleFilter === 'all' || profile.role === roleFilter;
    
    return searchMatch && departmentMatch && roleMatch;
  }) || [];

  const getRoleBadge = (role: string) => {
    const variants = {
      'admin': 'destructive',
      'manager': 'default',
      'employee': 'secondary'
    } as const;

    const labels = {
      'admin': 'Administrador',
      'manager': 'Gerente',
      'employee': 'Colaborador'
    };

    return (
      <Badge variant={variants[role as keyof typeof variants]}>
        {labels[role as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <AdminLayout>
        <div className="space-y-6">
          {/* Permission Info Alert */}
          {isManager && (
            <Alert className="bg-blue-50 border-blue-200">
              <Shield className="h-5 w-5 text-blue-600" />
              <AlertDescription className="text-sm text-blue-900">
                <p className="font-medium mb-1">Permissões de Gerente</p>
                <ul className="text-blue-800 space-y-1 list-disc list-inside text-xs">
                  <li>Você pode criar apenas <strong>Colaboradores</strong></li>
                  <li>Você pode editar e remover apenas <strong>Colaboradores</strong></li>
                  <li>Não é possível modificar Administradores ou outros Gerentes</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Header */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold">Cadastros</h1>
              <p className="text-sm lg:text-base text-muted-foreground mt-1">
                Gerencie colaboradores e suas informações
              </p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full lg:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Colaborador
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Novo Colaborador</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nome Completo *</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Senha Inicial *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      minLength={6}
                    />
                    <p className="text-xs text-muted-foreground">
                      O colaborador poderá alterar a senha após o primeiro login
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="employee_id">ID do Funcionário</Label>
                    <Input
                      id="employee_id"
                      placeholder="Deixe vazio para gerar automaticamente"
                      value={formData.employee_id}
                      onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Se não informado, será gerado automaticamente
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="department">Departamento</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="position">Cargo</Label>
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="role">Função no Sistema *</Label>
                    <Select 
                      value={formData.role} 
                      onValueChange={(value: any) => setFormData({ ...formData, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">Colaborador</SelectItem>
                        {isAdmin && (
                          <>
                            <SelectItem value="manager">Gerente</SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    {isManager && (
                      <p className="text-xs text-muted-foreground">
                        Como gerente, você só pode criar colaboradores
                      </p>
                    )}
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isCreating}>
                    {isCreating ? 'Criando...' : 'Criar Colaborador'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filtros</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <div className="flex-1">
                <Label className="text-sm font-medium">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Nome, email ou ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex-1">
                <Label className="text-sm font-medium">Departamento</Label>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {getDepartments().map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label className="text-sm font-medium">Função</Label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="employee">Colaborador</SelectItem>
                    <SelectItem value="manager">Gerente</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Profiles Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Colaboradores ({filteredProfiles.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Carregando colaboradores...</p>
                </div>
              ) : filteredProfiles.length > 0 ? (
                <>
                  {/* Mobile Cards */}
                  <div className="lg:hidden space-y-3">
                    {filteredProfiles.map((profile) => {
                      const canModify = canModifyProfile(profile);
                      
                      return (
                        <div key={profile.id} className="p-4 rounded-lg border bg-card space-y-3">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-12 w-12 flex-shrink-0">
                              <AvatarImage src={profile.avatar_url || ''} />
                              <AvatarFallback className="text-xs">
                                {profile.full_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">{profile.full_name}</div>
                              <div className="text-xs text-muted-foreground truncate">{profile.email}</div>
                              {profile.employee_id && (
                                <div className="text-xs text-muted-foreground">ID: {profile.employee_id}</div>
                              )}
                            </div>
                            <Badge variant={profile.is_active ? 'default' : 'secondary'} className="text-xs flex-shrink-0">
                              {profile.is_active ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">Depto:</span>
                              <div className="mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {profile.department || 'N/A'}
                                </Badge>
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Cargo:</span>
                              <div className="mt-1 font-medium truncate">{profile.position || 'N/A'}</div>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2 border-t">
                            <div className="flex-1">{getRoleBadge(profile.role)}</div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(profile)}
                              disabled={!canModify}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(profile.id)}
                              disabled={deleteProfile.isPending || !canModify}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          {!canModify && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Sem permissão para modificar
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop Table */}
                  <div className="hidden lg:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Colaborador</TableHead>
                          <TableHead>Departamento</TableHead>
                          <TableHead>Cargo</TableHead>
                          <TableHead>Função</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProfiles.map((profile) => {
                          const canModify = canModifyProfile(profile);
                          
                          return (
                            <TableRow key={profile.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={profile.avatar_url || ''} />
                                    <AvatarFallback>
                                      {profile.full_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">{profile.full_name}</div>
                                    <div className="text-sm text-muted-foreground">{profile.email}</div>
                                    {profile.employee_id && (
                                      <div className="text-xs text-muted-foreground">
                                        ID: {profile.employee_id}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {profile.department || 'N/A'}
                                </Badge>
                              </TableCell>
                              <TableCell>{profile.position || 'N/A'}</TableCell>
                              <TableCell>{getRoleBadge(profile.role)}</TableCell>
                              <TableCell>
                                <Badge variant={profile.is_active ? 'default' : 'secondary'}>
                                  {profile.is_active ? 'Ativo' : 'Inativo'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openEditDialog(profile)}
                                    disabled={!canModify}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDelete(profile.id)}
                                    disabled={deleteProfile.isPending || !canModify}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhum colaborador encontrado</h3>
                  <p className="text-muted-foreground mb-4 text-sm">
                    {searchTerm || departmentFilter !== 'all' || roleFilter !== 'all'
                      ? 'Nenhum colaborador corresponde aos filtros selecionados.'
                      : 'Comece adicionando o primeiro colaborador.'
                    }
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Colaborador
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar Colaborador</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleEdit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_full_name">Nome Completo</Label>
                  <Input
                    id="edit_full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit_email">Email</Label>
                  <Input
                    id="edit_email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit_employee_id">ID do Funcionário</Label>
                  <Input
                    id="edit_employee_id"
                    placeholder="Deixe vazio para gerar automaticamente"
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit_department">Departamento</Label>
                  <Input
                    id="edit_department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit_position">Cargo</Label>
                  <Input
                    id="edit_position"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit_role">Função no Sistema</Label>
                  <Select 
                    value={formData.role} 
                    onValueChange={(value: any) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Colaborador</SelectItem>
                      {isAdmin && (
                        <>
                          <SelectItem value="manager">Gerente</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  {isManager && formData.role !== 'employee' && (
                    <p className="text-xs text-orange-600">
                      ⚠️ Você não pode alterar para este cargo
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit_status">Status</Label>
                  <Select 
                    value={formData.is_active ? 'active' : 'inactive'} 
                    onValueChange={(value) => setFormData({ ...formData, is_active: value === 'active' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      setIsEditDialogOpen(false);
                      setSelectedProfile(null);
                      resetForm();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1" disabled={updateProfile.isPending}>
                    {updateProfile.isPending ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
    </AdminLayout>
  );
};

export default Registrations;