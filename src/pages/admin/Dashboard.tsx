import { Users, Clock, AlertTriangle, CheckCircle, MapPin, TrendingUp, Calendar, Activity, BarChart3, Image as ImageIcon, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AdminLayout from '@/components/layout/AdminLayout';
import { useReportData } from '@/hooks/useReports';
import { useTimeEntries } from '@/hooks/useTimeTracking';
import { useJustifications, useUpdateJustification } from '@/hooks/useJustifications';
import { useProfiles } from '@/hooks/useProfiles';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { data: reportData, isLoading: reportLoading } = useReportData();
  const { data: recentEntries, refetch: refetchEntries } = useTimeEntries();
  const { data: pendingJustifications, refetch: refetchJustifications } = useJustifications();
  const { data: profiles } = useProfiles();
  const updateJustification = useUpdateJustification();
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [attachmentUrls, setAttachmentUrls] = useState<Record<string, string>>({});
  const [selectedJustification, setSelectedJustification] = useState<any>(null);

  // Load attachment URLs for pending justifications
  useEffect(() => {
    const loadAttachmentUrls = async () => {
      if (!pendingJustifications) return;
      
      const urls: Record<string, string> = {};
      const pendingWithAttachments = pendingJustifications.filter(
        j => j.status === 'pending' && j.attachments?.length > 0
      );

      for (const justification of pendingWithAttachments) {
        for (const attachment of justification.attachments) {
          if (attachment.path && !urls[attachment.path]) {
            try {
              const { data } = await supabase.storage
                .from('justification-attachments')
                .createSignedUrl(attachment.path, 60 * 60);
              
              if (data?.signedUrl) {
                urls[attachment.path] = data.signedUrl;
              }
            } catch (error) {
              console.error('Error loading attachment URL:', error);
            }
          }
        }
      }
      setAttachmentUrls(urls);
    };

    loadAttachmentUrls();
  }, [pendingJustifications]);

  const handleApproveJustification = async (id: string) => {
    try {
      await updateJustification.mutateAsync({
        id,
        updates: { 
          status: 'approved',
          approved_by: profiles?.find(p => p.role === 'admin')?.id,
          approved_at: new Date().toISOString()
        }
      });
      toast.success('Justificativa aprovada com sucesso!');
      await refetchJustifications();
      await refetchEntries();
    } catch (error) {
      toast.error('Erro ao aprovar justificativa');
    }
  };

  const handleRejectJustification = async (id: string) => {
    try {
      await updateJustification.mutateAsync({
        id,
        updates: { 
          status: 'rejected',
          approved_by: profiles?.find(p => p.role === 'admin')?.id,
          rejection_reason: 'Rejeitado pelo administrador'
        }
      });
      toast.success('Justificativa rejeitada');
      await refetchJustifications();
    } catch (error) {
      toast.error('Erro ao rejeitar justificativa');
    }
  };

  const getEventTypeLabel = (type: string) => {
    const labels = {
      'IN': 'Entrada',
      'OUT': 'Saída',
      'BREAK_IN': 'Saída Intervalo',
      'BREAK_OUT': 'Volta Intervalo'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'approved': 'default',
      'pending': 'secondary',
      'rejected': 'destructive'
    } as const;

    const labels = {
      'approved': 'Aprovado',
      'pending': 'Pendente',
      'rejected': 'Rejeitado'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      'high': 'destructive',
      'medium': 'secondary',
      'low': 'outline'
    } as const;

    const labels = {
      'high': 'Alta',
      'medium': 'Média',
      'low': 'Baixa'
    };

    return (
      <Badge variant={variants[priority as keyof typeof variants]}>
        {labels[priority as keyof typeof labels]}
      </Badge>
    );
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('pt-BR');
  };

  // Helpers for display formatting
  const maskEmail = (email: string) => {
    if (!email) return '';
    const [user, domain] = email.split('@');
    if (!domain) return email;
    const visible = Math.min(4, user.length);
    return `${user.slice(0, visible)}…@${domain}`;
  };

  const firstAndLast = (fullName: string) => {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length <= 1) return parts[0] || '';
    return `${parts[0]} ${parts[parts.length - 1]}`;
  };

  const getDisplayName = (profile?: { full_name?: string }) => {
    const name = profile?.full_name || '';
    return name.includes('@') ? maskEmail(name) : firstAndLast(name);
  };

  if (reportLoading) {
    return (
      <AdminLayout>
          <div className="space-y-6">
            <div className="text-center py-12">
              <p className="text-muted-foreground">Carregando dashboard...</p>
            </div>
          </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
        <div className="space-y-4 md:space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4 md:mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Dashboard Administrativo</h1>
              <p className="text-sm md:text-base text-slate-700 mt-1">
                Painel de controle e gestão do sistema de ponto eletrônico
              </p>
            </div>
            <div className="flex flex-row md:flex-col gap-2 md:gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="shadow-sm flex-1 md:flex-none text-xs md:text-sm"
                onClick={() => navigate('/admin/relatorios')}
              >
                <Calendar className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Relatório Mensal</span>
                <span className="sm:hidden">Relatório</span>
              </Button>
              <Button 
                size="sm" 
                className="shadow-sm flex-1 md:flex-none text-xs md:text-sm"
                onClick={() => navigate('/admin/relatorios')}
              >
                <TrendingUp className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Exportar Dados</span>
                <span className="sm:hidden">Exportar</span>
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-4 md:mb-8">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 md:pb-3">
                <CardTitle className="text-xs md:text-sm font-semibold text-slate-700">Colaboradores Ativos</CardTitle>
                <div className="p-1.5 md:p-2 bg-blue-500 rounded-lg">
                  <Users className="h-3 w-3 md:h-4 md:w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl md:text-3xl font-bold text-blue-700 mb-1">
                  {reportData?.activeEmployees || 0}
                </div>
                <p className="text-xs md:text-sm text-slate-600 mb-2 md:mb-3">
                  de {reportData?.totalEmployees || 0} total
                </p>
                <Progress 
                  value={reportData ? (reportData.activeEmployees / reportData.totalEmployees) * 100 : 0} 
                  className="h-1.5 md:h-2"
                />
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200/50 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 md:pb-3">
                <CardTitle className="text-xs md:text-sm font-semibold text-slate-700">Registros Hoje</CardTitle>
                <div className="p-1.5 md:p-2 bg-green-500 rounded-lg">
                  <Clock className="h-3 w-3 md:h-4 md:w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl md:text-3xl font-bold text-green-700 mb-1">
                  {reportData?.todayPunches || 0}
                </div>
                <p className="text-xs md:text-sm text-slate-600">
                  batidas de ponto
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200/50 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 md:pb-3">
                <CardTitle className="text-xs md:text-sm font-semibold text-slate-700">Aprovações Pendentes</CardTitle>
                <div className="p-1.5 md:p-2 bg-orange-500 rounded-lg">
                  <AlertTriangle className="h-3 w-3 md:h-4 md:w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl md:text-3xl font-bold text-orange-700 mb-1">
                  {reportData?.pendingApprovals || 0}
                </div>
                <p className="text-xs md:text-sm text-slate-600">
                  justificativas
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/50 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 md:pb-3">
                <CardTitle className="text-xs md:text-sm font-semibold text-slate-700">Horas Extras</CardTitle>
                <div className="p-1.5 md:p-2 bg-purple-500 rounded-lg">
                  <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl md:text-3xl font-bold text-purple-700 mb-1">
                  {reportData?.overtime || 0}h
                </div>
                <p className="text-xs md:text-sm text-slate-600">
                  este mês
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6">
            {/* Recent Events */}
            <Card className="shadow-lg border-slate-200/50">
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="flex items-center gap-2 md:gap-3 text-base md:text-lg text-slate-900">
                  <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg">
                    <Activity className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  </div>
                  Últimos Registros
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 md:space-y-4">
                  {recentEntries?.slice(0, 5).map((entry) => (
                    <div key={entry.id} className="flex items-start justify-between p-3 md:p-4 rounded-xl bg-slate-50/50 border border-slate-200/50 hover:bg-slate-100/50 transition-colors">
                      <div className="flex items-start gap-2 md:gap-3 flex-1 min-w-0">
                        {/* Foto do reconhecimento facial ou avatar */}
                        {entry.facial_recognition_audit?.[0]?.attempt_image_url ? (
                          <img 
                            src={entry.facial_recognition_audit[0].attempt_image_url}
                            alt="Foto do registro"
                            className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border-2 border-slate-200 flex-shrink-0"
                          />
                        ) : entry.profiles?.avatar_url ? (
                          <img 
                            src={entry.profiles.avatar_url}
                            alt="Avatar"
                            className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border-2 border-slate-200 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                            <Users className="h-5 w-5 md:h-6 md:w-6 text-slate-400" />
                          </div>
                        )}
                        
                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 md:gap-2">
                            <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full flex-shrink-0 ${
                              entry.punch_type === 'IN' ? 'bg-green-500' :
                              entry.punch_type === 'OUT' ? 'bg-red-500' :
                              entry.punch_type === 'BREAK_IN' ? 'bg-orange-500' : 'bg-blue-500'
                            }`}></div>
                            <span className="font-semibold text-sm md:text-base text-slate-900 truncate">
                              {getDisplayName(entry.profiles) || 'Usuário'}
                            </span>
                          </div>
                          <span className="text-xs md:text-sm text-slate-500">
                            {getEventTypeLabel(entry.punch_type)} - {' '}
                            {new Date(entry.punch_time).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          {entry.facial_recognition_audit?.[0]?.confidence_score && (
                            <span className="text-xs text-slate-400 mt-0.5 md:mt-1 hidden sm:block">
                              Confiança: {(entry.facial_recognition_audit[0].confidence_score * 100).toFixed(1)}%
                            </span>
                          )}
                          {entry.location_address && (
                            <div className="flex items-center gap-1 mt-0.5 md:mt-1 hidden sm:flex">
                              <MapPin className="h-3 w-3 text-slate-400" />
                              <span className="text-xs text-slate-400 truncate">
                                {entry.location_address}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-1 md:ml-2 self-start md:self-center">
                        {getStatusBadge(entry.status)}
                      </div>
                    </div>
                  )) || (
                    <p className="text-muted-foreground text-center py-4">
                      Nenhum registro recente
                    </p>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full mt-3 md:mt-4 shadow-sm text-xs md:text-sm"
                  onClick={() => navigate('/admin/auditoria')}
                >
                  Ver Todos os Registros
                </Button>
              </CardContent>
            </Card>

            {/* Pending Approvals */}
            <Card className="shadow-lg border-slate-200/50">
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="flex items-center gap-2 md:gap-3 text-base md:text-lg text-slate-900">
                  <div className="p-1.5 md:p-2 bg-orange-500/10 rounded-lg">
                    <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-orange-600" />
                  </div>
                  Aprovações Pendentes
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 md:space-y-4">
                  {pendingJustifications?.filter(j => j.status === 'pending').slice(0, 5).map((justification) => (
                    <div key={justification.id} className="p-3 md:p-4 rounded-xl bg-slate-50/50 border border-slate-200/50 hover:bg-slate-100/50 transition-colors">
                      <div className="flex items-start justify-between mb-2 gap-2">
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold text-sm md:text-base text-slate-900 block truncate">
                            {getDisplayName(justification.profiles) || 'Usuário'}
                          </span>
                          <div className="text-xs md:text-sm text-slate-500">
                            {new Date(justification.created_at).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2 flex-shrink-0">
                          {justification.attachments?.length > 0 && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800 flex items-center gap-1 text-xs">
                              <ImageIcon className="h-2.5 w-2.5 md:h-3 md:w-3" />
                              {justification.attachments.length}
                            </Badge>
                          )}
                          <Badge variant="outline" className="bg-white/50 text-xs whitespace-nowrap">
                            {justification.request_type === 'absence' ? 'Falta' :
                             justification.request_type === 'overtime' ? 'H. Extra' :
                             justification.request_type === 'vacation' ? 'Férias' :
                             justification.request_type === 'expense' ? 'Despesa' : 'Outro'}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs md:text-sm text-slate-600 mb-2 md:mb-3 line-clamp-2">
                        {justification.description}
                      </p>
                      
                      {/* Attachments Preview */}
                      {justification.attachments?.length > 0 && (
                        <div className="flex gap-1.5 md:gap-2 mb-2 md:mb-3">
                          {justification.attachments.slice(0, 3).map((attachment: any, idx: number) => (
                            attachmentUrls[attachment.path] && (
                              <img
                                key={idx}
                                src={attachmentUrls[attachment.path]}
                                alt="Anexo"
                                className="w-12 h-12 md:w-16 md:h-16 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => {
                                  setSelectedJustification(justification);
                                  setSelectedImage(attachmentUrls[attachment.path]);
                                }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                                }}
                              />
                            )
                          ))}
                          {justification.attachments.length > 3 && (
                            <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-200 rounded border flex items-center justify-center text-xs text-slate-600">
                              +{justification.attachments.length - 3}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-1.5 md:gap-2">
                        {justification.attachments?.length > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-6 md:h-7 px-2"
                            onClick={() => {
                              setSelectedJustification(justification);
                              if (justification.attachments[0]?.path && attachmentUrls[justification.attachments[0].path]) {
                                setSelectedImage(attachmentUrls[justification.attachments[0].path]);
                              }
                            }}
                          >
                            <Eye className="h-2.5 w-2.5 md:h-3 md:w-3 mr-1" />
                            <span className="hidden sm:inline">Ver Anexos</span>
                            <span className="sm:hidden">Ver</span>
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          className="text-xs h-6 md:h-7 px-2 md:px-3 bg-green-500 hover:bg-green-600 text-white flex-1 sm:flex-none"
                          onClick={() => handleApproveJustification(justification.id)}
                          disabled={updateJustification.isPending}
                        >
                          Aprovar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-xs h-6 md:h-7 px-2 md:px-3 flex-1 sm:flex-none"
                          onClick={() => handleRejectJustification(justification.id)}
                          disabled={updateJustification.isPending}
                        >
                          Rejeitar
                        </Button>
                      </div>
                    </div>
                  )) || (
                    <p className="text-muted-foreground text-center py-4">
                      Nenhuma aprovação pendente
                    </p>
                  )}
                </div>
                <Button 
                  variant="outline"
                  size="sm"
                  className="w-full mt-3 md:mt-4 shadow-sm text-xs md:text-sm"
                  onClick={() => navigate('/admin/aprovacoes')}
                >
                  Ver Todas as Aprovações
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Department Stats */}
          <Card className="shadow-lg border-slate-200/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-slate-900">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                Estatísticas por Departamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData?.departmentStats.map((dept) => (
                  <div key={dept.department} className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100/50 border border-slate-200/50">
                    <div>
                      <h4 className="font-semibold text-slate-900">{dept.department}</h4>
                      <p className="text-sm text-slate-600">
                        {dept.employees} colaboradores
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-primary">{dept.avgHours}h</div>
                      <div className="text-sm text-slate-500">média mensal</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="shadow-lg border-slate-200/50">
            <CardHeader>
              <CardTitle className="text-slate-900">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col gap-2 rounded-xl shadow-sm hover:shadow-md transition-all"
                  onClick={() => navigate('/admin/cadastros')}
                >
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <span className="font-medium text-slate-700">Gerenciar Usuários</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col gap-2 rounded-xl shadow-sm hover:shadow-md transition-all"
                  onClick={() => navigate('/admin/aprovacoes')}
                >
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-orange-600" />
                  </div>
                  <span className="font-medium text-slate-700">Aprovar Pendências</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col gap-2 rounded-xl shadow-sm hover:shadow-md transition-all"
                  onClick={() => navigate('/admin/relatorios')}
                >
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <span className="font-medium text-slate-700">Gerar Relatório</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col gap-2 rounded-xl shadow-sm hover:shadow-md transition-all"
                  onClick={() => navigate('/admin/integracoes')}
                >
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                  <span className="font-medium text-slate-700">Configurar Horários</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Image Viewer Dialog */}
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                {selectedJustification ? `Anexo - ${getDisplayName(selectedJustification.profiles)}` : 'Visualizar Anexo'}
              </DialogTitle>
            </DialogHeader>
            {selectedImage && (
              <div className="space-y-4">
                <div className="flex items-center justify-center bg-muted rounded-lg p-4">
                  <img
                    src={selectedImage}
                    alt="Anexo"
                    className="max-w-full max-h-[70vh] object-contain"
                  />
                </div>
                
                {selectedJustification && (
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">{selectedJustification.title}</h4>
                    <p className="text-sm text-slate-600 mb-3">{selectedJustification.description}</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-green-500 hover:bg-green-600"
                        onClick={() => {
                          handleApproveJustification(selectedJustification.id);
                          setSelectedImage(null);
                          setSelectedJustification(null);
                        }}
                        disabled={updateJustification.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          handleRejectJustification(selectedJustification.id);
                          setSelectedImage(null);
                          setSelectedJustification(null);
                        }}
                        disabled={updateJustification.isPending}
                      >
                        Rejeitar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
    </AdminLayout>
  );
};

export default Dashboard;