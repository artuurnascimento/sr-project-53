import { useState } from 'react';
import { Plus, Edit, Trash2, MapPin, Building, Home, Check, X, Shield, ShieldOff, Navigation, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AdminLayout from '@/components/layout/AdminLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WorkLocation {
  id: string;
  name: string;
  type: string;
  latitude?: number;
  longitude?: number;
  radius_meters?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface GeofencingConfig {
  enabled: boolean;
  default_radius: number;
}

const WorkLocations = () => {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<WorkLocation | null>(null);
  const [isGettingCurrentLocation, setIsGettingCurrentLocation] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'office',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    radius_meters: 100,
    is_active: true,
  });

  // Fetch geofencing config
  const { data: geofencingConfig } = useQuery({
    queryKey: ['geofencing_config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_config')
        .select('value')
        .eq('key', 'geofencing')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      const value = data?.value as unknown;
      return (value as GeofencingConfig) || { enabled: false, default_radius: 100 };
    },
  });

  // Update geofencing config mutation
  const updateGeofencingConfig = useMutation({
    mutationFn: async (config: GeofencingConfig) => {
      const { data, error } = await supabase
        .from('site_config')
        .upsert({
          key: 'geofencing',
          value: config as any,
          description: 'Configuração de geofencing para batimento de ponto'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geofencing_config'] });
      toast.success('Configuração atualizada com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar configuração: ' + error.message);
    },
  });

  // Fetch work locations
  const { data: locations, isLoading } = useQuery({
    queryKey: ['work_locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('work_locations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as WorkLocation[];
    },
  });

  // Create location mutation
  const createLocation = useMutation({
    mutationFn: async (location: Omit<WorkLocation, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('work_locations')
        .insert([location])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work_locations'] });
      toast.success('Localização criada com sucesso!');
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error('Erro ao criar localização: ' + error.message);
    },
  });

  // Update location mutation
  const updateLocation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<WorkLocation> & { id: string }) => {
      const { data, error } = await supabase
        .from('work_locations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work_locations'] });
      toast.success('Localização atualizada com sucesso!');
      setIsEditDialogOpen(false);
      setSelectedLocation(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar localização: ' + error.message);
    },
  });

  // Delete location mutation
  const deleteLocation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('work_locations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work_locations'] });
      toast.success('Localização removida com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao remover localização: ' + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'office',
      latitude: undefined,
      longitude: undefined,
      radius_meters: 100,
      is_active: true,
    });
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalização não suportada');
      return;
    }

    setIsGettingCurrentLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData({
          ...formData,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setIsGettingCurrentLocation(false);
        toast.success('Localização atual capturada!');
      },
      (error) => {
        setIsGettingCurrentLocation(false);
        toast.error('Erro ao obter localização');
        console.error('Geolocation error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (geofencingConfig?.enabled && (!formData.latitude || !formData.longitude)) {
      toast.error('Defina as coordenadas da localização');
      return;
    }
    
    await createLocation.mutateAsync(formData);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocation) return;
    
    if (geofencingConfig?.enabled && (!formData.latitude || !formData.longitude)) {
      toast.error('Defina as coordenadas da localização');
      return;
    }
    
    await updateLocation.mutateAsync({
      id: selectedLocation.id,
      ...formData,
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover esta localização?')) {
      await deleteLocation.mutateAsync(id);
    }
  };

  const openEditDialog = (location: WorkLocation) => {
    setSelectedLocation(location);
    setFormData({
      name: location.name,
      type: location.type,
      latitude: location.latitude,
      longitude: location.longitude,
      radius_meters: location.radius_meters || 100,
      is_active: location.is_active,
    });
    setIsEditDialogOpen(true);
  };

  const toggleLocationStatus = async (id: string, currentStatus: boolean) => {
    await updateLocation.mutateAsync({
      id,
      is_active: !currentStatus,
    });
  };

  const toggleGeofencing = async (enabled: boolean) => {
    await updateGeofencingConfig.mutateAsync({
      enabled,
      default_radius: geofencingConfig?.default_radius || 100,
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'office':
        return <Building className="h-5 w-5" />;
      case 'home_office':
        return <Home className="h-5 w-5" />;
      case 'field':
        return <MapPin className="h-5 w-5" />;
      default:
        return <MapPin className="h-5 w-5" />;
    }
  };

  const getTypeName = (type: string) => {
    const names = {
      'office': 'Escritório',
      'home_office': 'Home Office',
      'field': 'Campo/Externo',
    };
    return names[type as keyof typeof names] || type;
  };

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6 p-4 md:p-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-3xl font-bold">Localizações de Trabalho</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Configure os locais permitidos para batimento de ponto
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Nova Localização
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nova Localização</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Localização</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Escritório Central"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="office">Escritório</SelectItem>
                      <SelectItem value="home_office">Home Office</SelectItem>
                      <SelectItem value="field">Campo/Externo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {geofencingConfig?.enabled && (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Coordenadas GPS</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={getCurrentLocation}
                          disabled={isGettingCurrentLocation}
                        >
                          {isGettingCurrentLocation ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Obtendo...
                            </>
                          ) : (
                            <>
                              <Navigation className="h-4 w-4 mr-2" />
                              Usar Atual
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="latitude" className="text-xs">Latitude</Label>
                          <Input
                            id="latitude"
                            type="number"
                            step="any"
                            placeholder="-8.0000"
                            value={formData.latitude || ''}
                            onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                            required={geofencingConfig?.enabled}
                          />
                        </div>
                        <div>
                          <Label htmlFor="longitude" className="text-xs">Longitude</Label>
                          <Input
                            id="longitude"
                            type="number"
                            step="any"
                            placeholder="-35.0000"
                            value={formData.longitude || ''}
                            onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                            required={geofencingConfig?.enabled}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="radius">Raio Permitido (metros)</Label>
                      <Input
                        id="radius"
                        type="number"
                        min="10"
                        max="5000"
                        value={formData.radius_meters}
                        onChange={(e) => setFormData({ ...formData, radius_meters: parseInt(e.target.value) })}
                        required={geofencingConfig?.enabled}
                      />
                      <p className="text-xs text-muted-foreground">
                        Colaboradores poderão bater ponto dentro deste raio
                      </p>
                    </div>
                  </>
                )}
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active">Ativo</Label>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={createLocation.isPending}>
                  {createLocation.isPending ? 'Criando...' : 'Criar Localização'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Geofencing Toggle Card */}
        <Card className={geofencingConfig?.enabled ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {geofencingConfig?.enabled ? (
                  <Shield className="h-6 w-6 text-green-600" />
                ) : (
                  <ShieldOff className="h-6 w-6 text-orange-600" />
                )}
                <div>
                  <h3 className="font-semibold text-sm">
                    Restrição de Localização
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {geofencingConfig?.enabled 
                      ? 'Colaboradores só podem bater ponto nas localizações cadastradas'
                      : 'Colaboradores podem bater ponto de qualquer lugar'
                    }
                  </p>
                </div>
              </div>
              <Switch
                checked={geofencingConfig?.enabled || false}
                onCheckedChange={toggleGeofencing}
                disabled={updateGeofencingConfig.isPending}
              />
            </div>
          </CardContent>
        </Card>

        {/* Info Alert */}
        {geofencingConfig?.enabled && (
          <Alert className="bg-blue-50 border-blue-200">
            <MapPin className="h-5 w-5 text-blue-600" />
            <AlertDescription className="text-sm text-blue-900">
              <p className="font-medium mb-1">Geofencing Ativado</p>
              <p className="text-blue-800">
                O sistema validará automaticamente se o colaborador está dentro do raio permitido 
                de uma das localizações ativas antes de permitir o batimento de ponto.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Locations Grid */}
        {isLoading ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">Carregando localizações...</p>
            </CardContent>
          </Card>
        ) : locations && locations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locations.map((location) => (
              <Card key={location.id} className={`${!location.is_active ? 'opacity-60' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${location.is_active ? 'bg-primary/10' : 'bg-muted'}`}>
                        {getTypeIcon(location.type)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{location.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {getTypeName(location.type)}
                        </p>
                      </div>
                    </div>
                    <Badge variant={location.is_active ? 'default' : 'secondary'}>
                      {location.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {geofencingConfig?.enabled && location.latitude && location.longitude && (
                    <div className="text-xs space-y-1 p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">Coordenadas:</span>
                      </div>
                      <p className="text-muted-foreground">
                        Lat: {location.latitude.toFixed(6)}
                      </p>
                      <p className="text-muted-foreground">
                        Lng: {location.longitude.toFixed(6)}
                      </p>
                      <p className="text-muted-foreground">
                        Raio: {location.radius_meters || 100}m
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Switch
                      checked={location.is_active}
                      onCheckedChange={() => toggleLocationStatus(location.id, location.is_active)}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEditDialog(location)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(location.id)}
                      disabled={deleteLocation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma localização cadastrada</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                {geofencingConfig?.enabled 
                  ? 'Adicione localizações permitidas para batimento de ponto'
                  : 'Comece adicionando a primeira localização de trabalho'
                }
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Localização
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Localização</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit_name">Nome da Localização</Label>
                <Input
                  id="edit_name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_type">Tipo</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="office">Escritório</SelectItem>
                    <SelectItem value="home_office">Home Office</SelectItem>
                    <SelectItem value="field">Campo/Externo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {geofencingConfig?.enabled && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Coordenadas GPS</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={getCurrentLocation}
                        disabled={isGettingCurrentLocation}
                      >
                        {isGettingCurrentLocation ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Obtendo...
                          </>
                        ) : (
                          <>
                            <Navigation className="h-4 w-4 mr-2" />
                            Usar Atual
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="edit_latitude" className="text-xs">Latitude</Label>
                        <Input
                          id="edit_latitude"
                          type="number"
                          step="any"
                          placeholder="-8.0000"
                          value={formData.latitude || ''}
                          onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                          required={geofencingConfig?.enabled}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit_longitude" className="text-xs">Longitude</Label>
                        <Input
                          id="edit_longitude"
                          type="number"
                          step="any"
                          placeholder="-35.0000"
                          value={formData.longitude || ''}
                          onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                          required={geofencingConfig?.enabled}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit_radius">Raio Permitido (metros)</Label>
                    <Input
                      id="edit_radius"
                      type="number"
                      min="10"
                      max="5000"
                      value={formData.radius_meters}
                      onChange={(e) => setFormData({ ...formData, radius_meters: parseInt(e.target.value) })}
                      required={geofencingConfig?.enabled}
                    />
                    <p className="text-xs text-muted-foreground">
                      Colaboradores poderão bater ponto dentro deste raio
                    </p>
                  </div>
                </>
              )}
              
              <div className="flex items-center justify-between">
                <Label htmlFor="edit_is_active">Ativo</Label>
                <Switch
                  id="edit_is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setSelectedLocation(null);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={updateLocation.isPending}>
                  {updateLocation.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <MapPin className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Como funciona?</p>
                <ul className="text-blue-800 space-y-1 list-disc list-inside">
                  <li>
                    <strong>Restrição Desativada:</strong> Colaboradores podem bater ponto de qualquer lugar
                  </li>
                  <li>
                    <strong>Restrição Ativada:</strong> O sistema valida automaticamente se o colaborador 
                    está dentro do raio de uma localização ativa antes de permitir o registro
                  </li>
                  <li>
                    Configure coordenadas GPS e raio para cada localização permitida
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default WorkLocations;