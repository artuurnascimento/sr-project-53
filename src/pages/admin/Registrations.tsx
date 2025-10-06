import { useState } from 'react';
import { Plus, Edit, Trash2, Search, UserPlus, Mail, Phone, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import AdminLayout from '@/components/layout/AdminLayout';
import { useProfiles, useCreateProfile, useUpdateProfile, useDeleteProfile } from '@/hooks/useProfiles';

const Registrations = () => {
  const { data: profiles, isLoading } = useProfiles();
  const createProfile = useCreateProfile();
  const updateProfile = useUpdateProfile();
  const deleteProfile = useDeleteProfile();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    employee_id: '',
    department: '',
    position: '',
    role: 'employee' as 'employee' | 'admin' | 'manager',
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      employee_id: '',
      department: '',
      position: '',
      role: 'employee',
      is_active: true,
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generate a temporary user_id (in real implementation, this would be handled by auth)
    const tempUserId = crypto.randomUUID();
    
    await createProfile.mutateAsync({
      ...formData,
      user_id: tempUserId,
    });
    
    setIsCreateDialogOpen(false);
    resetForm();
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile) return;
    
    await updateProfile.mutateAsync({
      id: selectedProfile.id,
      ...formData,
    });
    
    setIsEditDialogOpen(false);
    setSelectedProfile(null);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este colaborador?')) {
      await deleteProfile.mutateAsync(id);
    }
  };

  const openEditDialog = (profile: any) => {
    setSelectedProfile(profile);
    setFormData({
      full_name: profile.full_name,
      email: profile.email,
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Cadastros</h1>
              <p className="text-muted-foreground">
                Gerencie colaboradores e suas informações
              </p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Colaborador
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Novo Colaborador</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nome Completo</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="employee_id">ID do Funcionário</Label>
                    <Input
                      id="employee_id"
                      value={formData.employee_id}
                      onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    />
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
                    <Label htmlFor="role">Função</Label>
                    <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">Colaborador</SelectItem>
                        <SelectItem value="manager">Gerente</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={createProfile.isPending}>
                    {createProfile.isPending ? 'Criando...' : 'Criar Colaborador'}
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
                    {filteredProfiles.map((profile) => (
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
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(profile.id)}
                            disabled={deleteProfile.isPending}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
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
                        {filteredProfiles.map((profile) => (
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
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(profile.id)}
                                  disabled={deleteProfile.isPending}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
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
            <DialogContent className="max-w-md">
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
                  <Label htmlFor="edit_role">Função</Label>
                  <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Colaborador</SelectItem>
                      <SelectItem value="manager">Gerente</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
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