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
import { Mail, Download, RefreshCw, FileText, AlertCircle, User, Building2, Calendar } from "lucide-react";
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
          <h1 className="text-2xl md:text-3xl font-bold">Gestão de Comprovantes</h1>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">
            Gerencie comprovantes de ponto e configurações de envio automático
          </p>
        </div>

      <Tabs defaultValue="colaboradores" className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full">
          <TabsTrigger value="colaboradores" className="text-xs md:text-sm">Colaboradores</TabsTrigger>
          <TabsTrigger value="comprovantes" className="text-xs md:text-sm">Comprovantes</TabsTrigger>
          <TabsTrigger value="logs" className="text-xs md:text-sm">Logs</TabsTrigger>
          <TabsTrigger value="resumos" className="text-xs md:text-sm">Resumos</TabsTrigger>
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
                <>
                  {/* Desktop View */}
                  <div className="hidden md:block">
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
                  </div>

                  {/* Mobile View */}
                  <div className="md:hidden space-y-3">
                    {profiles.map((profile) => (
                      <div
                        key={profile.id}
                        className="bg-white border rounded-xl p-4 shadow-sm"
                      >
                        {/* Header do Card */}
                        <div className="flex items-start gap-2.5 mb-3 pb-3 border-b">
                          <User className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-base leading-tight">
                              {profile.full_name}
                            </h3>
                          </div>
                        </div>

                        {/* E-mail */}
                        <div className="flex items-center gap-2 mb-3">
                          <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-600 break-all">
                            {profile.email}
                          </span>
                        </div>

                        {/* Departamento */}
                        <div className="flex items-center gap-2 mb-4">
                          <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm">
                            <span className="text-gray-500">Departamento:</span>
                            <span className="text-gray-900 ml-2 font-medium">
                              {profile.department || '-'}
                            </span>
                          </span>
                        </div>

                        {/* Frequência de Envio */}
                        <div className="flex items-center justify-between gap-3 pt-3 border-t">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm text-gray-500 font-medium">
                              Frequência:
                            </span>
                          </div>
                          <Select
                            value={profile.envio_resumo}
                            onValueChange={(value) =>
                              updateFrequency.mutate({
                                profileId: profile.id,
                                frequency: value
                              })
                            }
                          >
                            <SelectTrigger className="w-[130px] h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="diario">Diário</SelectItem>
                              <SelectItem value="semanal">Semanal</SelectItem>
                              <SelectItem value="mensal">Mensal</SelectItem>
                              <SelectItem value="todos">Todos</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
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
              ) : comprovantes.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum comprovante gerado</h3>
                  <p className="text-muted-foreground">
                    Os comprovantes de ponto aparecerão aqui quando os colaboradores registrarem seus pontos.
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop View */}
                  <div className="hidden md:block">
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
                  </div>

                  {/* Mobile View */}
                  <div className="md:hidden space-y-3">
                    {comprovantes.map((comprovante) => (
                      <div
                        key={comprovante.id}
                        className="bg-white border rounded-xl p-4 shadow-sm"
                      >
                        {/* Header com Nome */}
                        <div className="flex items-start justify-between gap-3 mb-3 pb-3 border-b">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-base leading-tight mb-1">
                              {comprovante.employee_name}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {getTipoLabel(comprovante.punch_type)}
                            </Badge>
                          </div>
                          {comprovante.email_enviado ? (
                            <Badge variant="default" className="flex-shrink-0">Enviado</Badge>
                          ) : (
                            <Badge variant="secondary" className="flex-shrink-0">Pendente</Badge>
                          )}
                        </div>

                        {/* Data/Hora */}
                        <div className="flex items-center gap-2 mb-4">
                          <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-600">
                            {new Date(comprovante.punch_time).toLocaleString('pt-BR')}
                          </span>
                        </div>

                        {/* Ações */}
                        <div className="flex gap-2 pt-3 border-t">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(comprovante.comprovante_pdf, '_blank')}
                            className="flex-1"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Baixar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resendEmail.mutate(comprovante.id)}
                            disabled={resendEmail.isPending}
                            className="flex-1"
                          >
                            <Mail className="w-4 h-4 mr-2" />
                            Reenviar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
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
              {errorLogs.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum erro registrado</h3>
                  <p className="text-muted-foreground">
                    Os erros do sistema aparecerão aqui quando ocorrerem.
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop View */}
                  <div className="hidden md:block">
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
                  </div>

                  {/* Mobile View */}
                  <div className="md:hidden space-y-3">
                    {errorLogs.map((log) => (
                      <div
                        key={log.id}
                        className="bg-white border border-red-100 rounded-xl p-4 shadow-sm"
                      >
                        {/* Header com Tipo e Data */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <Badge variant="destructive">{log.tipo}</Badge>
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {new Date(log.criado_em).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        {/* Mensagem */}
                        <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                          {log.mensagem}
                        </p>

                        {/* Ação */}
                        <Button size="sm" variant="outline" className="w-full">
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Tentar Novamente
                        </Button>
                      </div>
                    ))}
                  </div>
                </>
              )}
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
              
              <div className="flex flex-col md:flex-row gap-4 md:items-end">
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
                  className="w-full md:w-auto"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  <span className="md:inline">Enviar Resumos {getFrequencyLabel(selectedPeriod)}</span>
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
