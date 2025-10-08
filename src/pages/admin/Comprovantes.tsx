import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Mail, Download, RefreshCw, FileText, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminLayout from "@/components/layout/AdminLayout";

export default function Comprovantes() {
  const queryClient = useQueryClient();
  const [selectedPeriod, setSelectedPeriod] = useState("diario");

  // Buscar colaboradores
  const { data: profiles = [], isLoading: loadingProfiles } = useQuery({
    queryKey: ['profiles-comprovantes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_active', true)
        .order('full_name');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Buscar últimos comprovantes
  const { data: comprovantes = [], isLoading: loadingComprovantes } = useQuery({
    queryKey: ['comprovantes-recentes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_time_entries_completo')
        .select('*')
        .not('comprovante_pdf', 'is', null)
        .order('punch_time', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data || [];
    }
  });

  // Buscar logs de erro
  const { data: errorLogs = [] } = useQuery({
    queryKey: ['error-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('logs_sistema')
        .select('*')
        .eq('status', 'error')
        .order('criado_em', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data || [];
    }
  });

  // Mutation para atualizar frequência de envio
  const updateFrequency = useMutation({
    mutationFn: async ({ profileId, frequency }: { profileId: string; frequency: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ envio_resumo: frequency })
        .eq('id', profileId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles-comprovantes'] });
      toast.success('Frequência de envio atualizada');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    }
  });

  // Mutation para reenviar email
  const resendEmail = useMutation({
    mutationFn: async (timeEntryId: string) => {
      // Buscar o comprovante
      const { data: timeEntry, error: fetchError } = await supabase
        .from('v_time_entries_completo')
        .select('*')
        .eq('id', timeEntryId)
        .single();

      if (fetchError) throw fetchError;
      if (!timeEntry?.comprovante_pdf) throw new Error('Comprovante não disponível');

      // Chamar edge function de envio de email
      const { error: emailError } = await supabase.functions.invoke('enviar-email-ponto', {
        body: { 
          timeEntryId, 
          pdfUrl: timeEntry.comprovante_pdf 
        }
      });

      if (emailError) throw emailError;
    },
    onSuccess: () => {
      toast.success('E-mail reenviado com sucesso');
      queryClient.invalidateQueries({ queryKey: ['comprovantes-recentes'] });
    },
    onError: (error: any) => {
      toast.error(`Erro ao reenviar: ${error.message}`);
    }
  });

  // Mutation para enviar resumo periódico manual
  const sendPeriodicReport = useMutation({
    mutationFn: async (tipo: string) => {
      const { error } = await supabase.functions.invoke('enviar-resumo-periodico', {
        body: { tipo }
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Resumos enviados com sucesso');
      queryClient.invalidateQueries({ queryKey: ['error-logs'] });
    },
    onError: (error: any) => {
      toast.error(`Erro ao enviar resumos: ${error.message}`);
    }
  });

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      'IN': 'Entrada',
      'OUT': 'Saída',
      'BREAK_OUT': 'Início Pausa',
      'BREAK_IN': 'Fim Pausa'
    };
    return labels[tipo] || tipo;
  };

  const getFrequencyLabel = (freq: string) => {
    const labels: Record<string, string> = {
      'diario': 'Diário',
      'semanal': 'Semanal',
      'mensal': 'Mensal',
      'todos': 'Todos'
    };
    return labels[freq] || freq;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Comprovantes</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie comprovantes de ponto e configurações de envio automático
          </p>
        </div>

      <Tabs defaultValue="colaboradores" className="space-y-6">
        <TabsList>
          <TabsTrigger value="colaboradores">Colaboradores</TabsTrigger>
          <TabsTrigger value="comprovantes">Comprovantes</TabsTrigger>
          <TabsTrigger value="logs">Logs de Erro</TabsTrigger>
          <TabsTrigger value="resumos">Resumos Periódicos</TabsTrigger>
        </TabsList>

        {/* Tab Colaboradores */}
        <TabsContent value="colaboradores">
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Envio de Resumos</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingProfiles ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Departamento</TableHead>
                      <TableHead>Frequência de Envio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profiles.map((profile) => (
                      <TableRow key={profile.id}>
                        <TableCell className="font-medium">{profile.full_name}</TableCell>
                        <TableCell>{profile.email}</TableCell>
                        <TableCell>{profile.department || '-'}</TableCell>
                        <TableCell>
                          <Select
                            value={profile.envio_resumo}
                            onValueChange={(value) => 
                              updateFrequency.mutate({ 
                                profileId: profile.id, 
                                frequency: value 
                              })
                            }
                          >
                            <SelectTrigger className="w-[150px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="diario">Diário</SelectItem>
                              <SelectItem value="semanal">Semanal</SelectItem>
                              <SelectItem value="mensal">Mensal</SelectItem>
                              <SelectItem value="todos">Todos</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Comprovantes */}
        <TabsContent value="comprovantes">
          <Card>
            <CardHeader>
              <CardTitle>Últimos Comprovantes Gerados</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingComprovantes ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Colaborador</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Status E-mail</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comprovantes.map((comprovante) => (
                      <TableRow key={comprovante.id}>
                        <TableCell className="font-medium">
                          {comprovante.employee_name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getTipoLabel(comprovante.punch_type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(comprovante.punch_time).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          {comprovante.email_enviado ? (
                            <Badge variant="default">Enviado</Badge>
                          ) : (
                            <Badge variant="secondary">Pendente</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(comprovante.comprovante_pdf, '_blank')}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => resendEmail.mutate(comprovante.id)}
                              disabled={resendEmail.isPending}
                            >
                              <Mail className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Logs */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                Logs de Erro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Mensagem</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {errorLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {new Date(log.criado_em).toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">{log.tipo}</Badge>
                      </TableCell>
                      <TableCell className="max-w-md truncate">
                        {log.mensagem}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline">
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Resumos Periódicos */}
        <TabsContent value="resumos">
          <Card>
            <CardHeader>
              <CardTitle>Envio Manual de Resumos Periódicos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Envie resumos manualmente para todos os colaboradores configurados para receber o tipo selecionado.
              </p>
              
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">
                    Tipo de Resumo
                  </label>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diario">Resumo Diário</SelectItem>
                      <SelectItem value="semanal">Resumo Semanal</SelectItem>
                      <SelectItem value="mensal">Resumo Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button
                  onClick={() => sendPeriodicReport.mutate(selectedPeriod)}
                  disabled={sendPeriodicReport.isPending}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Enviar Resumos {getFrequencyLabel(selectedPeriod)}
                </Button>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>Nota:</strong> Os resumos serão enviados apenas para colaboradores configurados 
                  para receber "{getFrequencyLabel(selectedPeriod)}" ou "Todos" na aba de Colaboradores.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </AdminLayout>
  );
}
