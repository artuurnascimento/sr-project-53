import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Clock, Edit, Plus, Save, Users } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";

interface WorkSchedule {
  id: string;
  profile_id: string;
  clock_in_time: string;
  clock_out_time: string;
  break_start_time: string;
  break_end_time: string;
  tolerance_minutes: number;
  is_active: boolean;
  profiles?: {
    full_name: string;
    email: string;
  };
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
}

export default function WorkSchedules() {
  const queryClient = useQueryClient();
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    clock_in_time: "08:00",
    clock_out_time: "17:00",
    break_start_time: "12:00",
    break_end_time: "13:00",
    tolerance_minutes: 15,
  });

  // Buscar horários existentes
  const { data: schedules = [], isLoading: loadingSchedules } = useQuery({
    queryKey: ['work-schedules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('work_schedules')
        .select(`
          *,
          profiles:profile_id(full_name, email)
        `)
        .order('profiles(full_name)');
      
      if (error) throw error;
      return data as WorkSchedule[];
    }
  });

  // Buscar colaboradores sem horário configurado
  const { data: profilesWithoutSchedule = [] } = useQuery({
    queryKey: ['profiles-without-schedule'],
    queryFn: async () => {
      const { data: allProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('is_active', true)
        .order('full_name');
      
      if (profilesError) throw profilesError;

      const { data: existingSchedules, error: schedulesError } = await supabase
        .from('work_schedules')
        .select('profile_id');
      
      if (schedulesError) throw schedulesError;

      const scheduledProfileIds = new Set(
        existingSchedules?.map(s => s.profile_id) || []
      );

      return (allProfiles || []).filter(
        p => !scheduledProfileIds.has(p.id)
      ) as Profile[];
    }
  });

  // Mutation para criar/atualizar horário individual
  const saveSchedule = useMutation({
    mutationFn: async (data: {
      profile_id: string;
      clock_in_time: string;
      clock_out_time: string;
      break_start_time: string;
      break_end_time: string;
      tolerance_minutes: number;
    }) => {
      const { error } = await supabase
        .from('work_schedules')
        .upsert({
          ...data,
          is_active: true,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['profiles-without-schedule'] });
      toast.success('Horário de trabalho salvo com sucesso');
      setIsDialogOpen(false);
      setSelectedProfile(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Erro ao salvar horário: ${error.message}`);
    }
  });

  // Mutation para configurar horário para todos os colaboradores
  const saveBulkSchedule = useMutation({
    mutationFn: async (data: {
      clock_in_time: string;
      clock_out_time: string;
      break_start_time: string;
      break_end_time: string;
      tolerance_minutes: number;
    }) => {
      const { data: allProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id')
        .eq('is_active', true);

      if (profilesError) throw profilesError;
      if (!allProfiles || allProfiles.length === 0) {
        throw new Error('Nenhum colaborador ativo encontrado');
      }

      const schedules = allProfiles.map(profile => ({
        profile_id: profile.id,
        ...data,
        is_active: true,
      }));

      const { error } = await supabase
        .from('work_schedules')
        .upsert(schedules);

      if (error) throw error;
      return allProfiles.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['work-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['profiles-without-schedule'] });
      toast.success(`Horário configurado para ${count} colaborador(es) com sucesso`);
      setIsBulkDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Erro ao configurar horários: ${error.message}`);
    }
  });

  const resetForm = () => {
    setFormData({
      clock_in_time: "08:00",
      clock_out_time: "17:00",
      break_start_time: "12:00",
      break_end_time: "13:00",
      tolerance_minutes: 15,
    });
  };

  const handleEditSchedule = (schedule: WorkSchedule) => {
    setSelectedProfile({
      id: schedule.profile_id,
      full_name: schedule.profiles?.full_name || '',
      email: schedule.profiles?.email || '',
    });
    setFormData({
      clock_in_time: schedule.clock_in_time.substring(0, 5),
      clock_out_time: schedule.clock_out_time.substring(0, 5),
      break_start_time: schedule.break_start_time.substring(0, 5),
      break_end_time: schedule.break_end_time.substring(0, 5),
      tolerance_minutes: schedule.tolerance_minutes,
    });
    setIsDialogOpen(true);
  };

  const handleAddSchedule = (profile: Profile) => {
    setSelectedProfile(profile);
    resetForm();
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile) return;

    saveSchedule.mutate({
      profile_id: selectedProfile.id,
      ...formData,
    });
  };

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveBulkSchedule.mutate(formData);
  };

  const handleOpenBulkDialog = () => {
    resetForm();
    setIsBulkDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Horários de Trabalho</h1>
            <p className="text-muted-foreground mt-2">
              Configure os horários de entrada, saída e intervalos para cada colaborador
            </p>
          </div>
          <Button onClick={handleOpenBulkDialog} size="lg">
            <Users className="w-4 h-4 mr-2" />
            Configurar para Todos
          </Button>
        </div>

        {/* Colaboradores com horário configurado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Horários Configurados
            </CardTitle>
            <CardDescription>
              Gerenciar horários de trabalho dos colaboradores
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingSchedules ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : schedules.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum horário configurado</h3>
                <p className="text-muted-foreground">
                  Configure os horários de trabalho para os colaboradores abaixo
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Entrada</TableHead>
                    <TableHead>Saída</TableHead>
                    <TableHead>Início Intervalo</TableHead>
                    <TableHead>Fim Intervalo</TableHead>
                    <TableHead>Tolerância</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map((schedule) => (
                    <TableRow key={schedule.id}>
                      <TableCell className="font-medium">
                        <div>
                          <p>{schedule.profiles?.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {schedule.profiles?.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{schedule.clock_in_time.substring(0, 5)}</TableCell>
                      <TableCell>{schedule.clock_out_time.substring(0, 5)}</TableCell>
                      <TableCell>{schedule.break_start_time.substring(0, 5)}</TableCell>
                      <TableCell>{schedule.break_end_time.substring(0, 5)}</TableCell>
                      <TableCell>{schedule.tolerance_minutes} min</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditSchedule(schedule)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Colaboradores sem horário */}
        {profilesWithoutSchedule.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Adicionar Horário</CardTitle>
              <CardDescription>
                Colaboradores sem horário de trabalho configurado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profilesWithoutSchedule.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell className="font-medium">{profile.full_name}</TableCell>
                      <TableCell>{profile.email}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => handleAddSchedule(profile)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Configurar Horário
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Dialog de configuração individual */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {selectedProfile ? `Horário de ${selectedProfile.full_name}` : 'Configurar Horário'}
              </DialogTitle>
              <DialogDescription>
                Defina os horários de trabalho e tolerância para batimento de ponto
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clock_in_time">Entrada</Label>
                  <Input
                    id="clock_in_time"
                    type="time"
                    value={formData.clock_in_time}
                    onChange={(e) => setFormData({ ...formData, clock_in_time: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="clock_out_time">Saída</Label>
                  <Input
                    id="clock_out_time"
                    type="time"
                    value={formData.clock_out_time}
                    onChange={(e) => setFormData({ ...formData, clock_out_time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="break_start_time">Início Intervalo</Label>
                  <Input
                    id="break_start_time"
                    type="time"
                    value={formData.break_start_time}
                    onChange={(e) => setFormData({ ...formData, break_start_time: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="break_end_time">Fim Intervalo</Label>
                  <Input
                    id="break_end_time"
                    type="time"
                    value={formData.break_end_time}
                    onChange={(e) => setFormData({ ...formData, break_end_time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="tolerance_minutes">Tolerância (minutos)</Label>
                <Input
                  id="tolerance_minutes"
                  type="number"
                  min="0"
                  max="60"
                  value={formData.tolerance_minutes}
                  onChange={(e) => setFormData({ ...formData, tolerance_minutes: parseInt(e.target.value) })}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Tempo de tolerância antes/depois do horário configurado
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setSelectedProfile(null);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={saveSchedule.isPending}>
                  <Save className="w-4 h-4 mr-2" />
                  {saveSchedule.isPending ? 'Salvando...' : 'Salvar Horário'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog de configuração em massa */}
        <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Configurar Horário para Todos
              </DialogTitle>
              <DialogDescription>
                Este horário será aplicado a todos os colaboradores ativos do sistema
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleBulkSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bulk_clock_in_time">Entrada</Label>
                  <Input
                    id="bulk_clock_in_time"
                    type="time"
                    value={formData.clock_in_time}
                    onChange={(e) => setFormData({ ...formData, clock_in_time: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="bulk_clock_out_time">Saída</Label>
                  <Input
                    id="bulk_clock_out_time"
                    type="time"
                    value={formData.clock_out_time}
                    onChange={(e) => setFormData({ ...formData, clock_out_time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bulk_break_start_time">Início Intervalo</Label>
                  <Input
                    id="bulk_break_start_time"
                    type="time"
                    value={formData.break_start_time}
                    onChange={(e) => setFormData({ ...formData, break_start_time: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="bulk_break_end_time">Fim Intervalo</Label>
                  <Input
                    id="bulk_break_end_time"
                    type="time"
                    value={formData.break_end_time}
                    onChange={(e) => setFormData({ ...formData, break_end_time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bulk_tolerance_minutes">Tolerância (minutos)</Label>
                <Input
                  id="bulk_tolerance_minutes"
                  type="number"
                  min="0"
                  max="60"
                  value={formData.tolerance_minutes}
                  onChange={(e) => setFormData({ ...formData, tolerance_minutes: parseInt(e.target.value) })}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Tempo de tolerância antes/depois do horário configurado
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  <strong>Atenção:</strong> Esta ação irá sobrescrever os horários de todos os colaboradores ativos.
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsBulkDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={saveBulkSchedule.isPending}>
                  <Save className="w-4 h-4 mr-2" />
                  {saveBulkSchedule.isPending ? 'Configurando...' : 'Aplicar a Todos'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}