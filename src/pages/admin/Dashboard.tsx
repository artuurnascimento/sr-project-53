import { Users, Clock, AlertTriangle, CheckCircle, MapPin, TrendingUp, Calendar, Activity, BarChart3, Image as ImageIcon, Eye, MoreVertical, FileText, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AdminLayout from '@/components/layout/AdminLayout';
import { useReportData } from '@/hooks/useReports';
import { useTimeEntries, type TimeEntry } from '@/hooks/useTimeTracking';
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
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);

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

  const generateMonthlyReport = (format: 'pdf' | 'excel') => {
    if (!recentEntries) return;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthEntries = recentEntries.filter(entry => {
      const entryDate = new Date(entry.punch_time);
      return entryDate >= startOfMonth && entryDate <= endOfMonth;
    });

    if (format === 'pdf') {
      const doc = new jsPDF();
      
      doc.setFontSize(16);
      doc.text('Relatório Mensal de Ponto', 14, 15);
      
      doc.setFontSize(10);
      doc.text(`Período: ${startOfMonth.toLocaleDateString('pt-BR')} a ${endOfMonth.toLocaleDateString('pt-BR')}`, 14, 22);
      doc.text(`Total de Registros: ${monthEntries.length}`, 14, 27);
      
      const tableData = monthEntries.map(entry => [
        new Date(entry.punch_time).toLocaleDateString('pt-BR'),
        new Date(entry.punch_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        entry.profiles?.full_name || 'N/A',
        entry.punch_type === 'IN' ? 'Entrada' : entry.punch_type === 'OUT' ? 'Saída' : entry.punch_type === 'BREAK_IN' ? 'Início Int.' : 'Fim Int.',
        entry.status === 'approved' ? 'Aprovado' : 'Pendente'
      ]);

      autoTable(doc, {
        head: [['Data', 'Hora', 'Colaborador', 'Tipo', 'Status']],
        body: tableData,
        startY: 32,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 247, 250] }
      });
      
      doc.save(`relatorio-mensal-${now.getMonth() + 1}-${now.getFullYear()}.pdf`);
      toast.success('Relatório PDF gerado com sucesso!');
    } else if (format === 'excel') {
      const data = monthEntries.map(entry => ({
        'Data': new Date(entry.punch_time).toLocaleDateString('pt-BR'),
        'Hora': new Date(entry.punch_time).toLocaleTimeString('pt-BR'),
        'Colaborador': entry.profiles?.full_name || 'N/A',
        'Tipo': entry.punch_type === 'IN' ? 'Entrada' : entry.punch_type === 'OUT' ? 'Saída' : entry.punch_type === 'BREAK_IN' ? 'Início Intervalo' : 'Fim Intervalo',
        'Status': entry.status === 'approved' ? 'Aprovado' : 'Pendente'
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Relatório Mensal');
      
      XLSX.writeFile(wb, `relatorio-mensal-${now.getMonth() + 1}-${now.getFullYear()}.xlsx`);
      toast.success('Relatório Excel gerado com sucesso!');
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
      <div className="space-y-4 md:space-y-6 max-w-full overflow-x-hidden">
        {/* Header - Mobile compacto, Desktop normal */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-xs text-slate-600 mt-0.5 md:hidden">Visão geral do sistema</p>
            <p className="hidden md:block text-muted-foreground">Visão geral do sistema de ponto eletrônico</p>
          </div>
          
          {/* Mobile: Menu de Ações | Desktop: Botões separados */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate('/admin/relatorios')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Ver Relatórios
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => generateMonthlyReport('pdf')}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => generateMonthlyReport('excel')}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="hidden md:flex gap-2">
            <Button variant="outline" onClick={() => navigate('/admin/relatorios')}>
              <FileText className="h-4 w-4 mr-2" />
              Relatórios
            </Button>
            <Button variant="outline" onClick={() => generateMonthlyReport('pdf')}>
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
            <Button onClick={() => generateMonthlyReport('excel')}>
              <Download className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
          </div>
        </div>

        {/* Stats Cards - Mobile: Grid 2x2 | Desktop: Grid 1x4 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50">
            <CardContent className="p-3 md:p-6">
              <div className="flex md:flex-row flex-col items-center md:items-start text-center md:text-left gap-2 md:gap-4">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Users className="h-4 w-4 md:h-6 md:w-6 text-white" />
                </div>
                <div>
                  <p className="text-xs md:text-sm font-medium text-slate-600 md:mb-1">Colaboradores Ativos</p>
                  <div className="text-2xl md:text-3xl font-bold text-blue-700">
                    {reportData?.activeEmployees || 0}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 md:hidden">Colaboradores</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200/50">
            <CardContent className="p-3 md:p-6">
              <div className="flex md:flex-row flex-col items-center md:items-start text-center md:text-left gap-2 md:gap-4">
                <div className="p-2 bg-green-500 rounded-lg">
                  <Clock className="h-4 w-4 md:h-6 md:w-6 text-white" />
                </div>
                <div>
                  <p className="text-xs md:text-sm font-medium text-slate-600 md:mb-1">Registros de Hoje</p>
                  <div className="text-2xl md:text-3xl font-bold text-green-700">
                    {reportData?.todayPunches || 0}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 md:hidden">Registros Hoje</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200/50">
            <CardContent className="p-3 md:p-6">
              <div className="flex md:flex-row flex-col items-center md:items-start text-center md:text-left gap-2 md:gap-4">
                <div className="p-2 bg-orange-500 rounded-lg">
                  <AlertTriangle className="h-4 w-4 md:h-6 md:w-6 text-white" />
                </div>
                <div>
                  <p className="text-xs md:text-sm font-medium text-slate-600 md:mb-1">Aprovações Pendentes</p>
                  <div className="text-2xl md:text-3xl font-bold text-orange-700">
                    {reportData?.pendingApprovals || 0}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 md:hidden">Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/50">
            <CardContent className="p-3 md:p-6">
              <div className="flex md:flex-row flex-col items-center md:items-start text-center md:text-left gap-2 md:gap-4">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <CheckCircle className="h-4 w-4 md:h-6 md:w-6 text-white" />
                </div>
                <div>
                  <p className="text-xs md:text-sm font-medium text-slate-600 md:mb-1">Horas Extras do Mês</p>
                  <div className="text-2xl md:text-3xl font-bold text-purple-700">
                    {reportData?.overtime || 0}h
                  </div>
                  <p className="text-xs text-slate-600 mt-1 md:hidden">Horas Extras</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6">
          {/* Recent Events */}
          <Card className="shadow-lg border-slate-200/50">
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg text-slate-900">
                <Activity className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                Últimos Registros
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 md:space-y-3">
                {recentEntries?.slice(0, 5).map((entry) => (
                  <div 
                    key={entry.id} 
                    className="flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg border hover:bg-accent/5 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedEntry(entry);
                      setDetailsOpen(true);
                    }}
                  >
                    {/* Avatar/Foto */}
                    {entry.facial_recognition_audit?.[0]?.attempt_image_url ? (
                      <img 
                        src={entry.facial_recognition_audit[0].attempt_image_url}
                        alt="Foto"
                        className="w-8 h-8 md:w-12 md:h-12 rounded-full object-cover border flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                        <Users className="h-4 w-4 md:h-6 md:w-6 text-slate-400" />
                      </div>
                    )}
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-xs md:text-sm truncate">
                        {getDisplayName(entry.profiles) || 'Usuário'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {getEventTypeLabel(entry.punch_type)} • {' '}
                        {new Date(entry.punch_time).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    
                    {/* Status Badge */}
                    <Badge 
                      variant={entry.status === 'approved' ? 'default' : 'secondary'} 
                      className="text-xs flex-shrink-0"
                    >
                      <span className="md:hidden">{entry.status === 'approved' ? 'OK' : 'Pend'}</span>
                      <span className="hidden md:inline">{entry.status === 'approved' ? 'Aprovado' : 'Pendente'}</span>
                    </Badge>
                  </div>
                )) || (
                  <p className="text-muted-foreground text-center py-4 text-sm">
                    Nenhum registro recente
                  </p>
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="w-full mt-3 text-xs md:text-sm"
                onClick={() => navigate('/admin/auditoria')}
              >
                Ver Todos os Registros
              </Button>
            </CardContent>
          </Card>

          {/* Pending Approvals */}
          <Card className="shadow-lg border-slate-200/50">
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg text-slate-900">
                <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-orange-600" />
                Aprovações Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 md:space-y-3">
                {pendingJustifications?.filter(j => j.status === 'pending').slice(0, 5).map((justification) => (
                  <div key={justification.id} className="p-2 md:p-4 rounded-lg bg-slate-50/50 border border-slate-200/50">
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-xs md:text-sm text-slate-900 block truncate">
                          {getDisplayName(justification.profiles) || 'Usuário'}
                        </span>
                        <div className="text-xs text-slate-500 truncate">
                          {justification.title}
                        </div>
                      </div>
                      {justification.attachments?.length > 0 && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 flex items-center gap-1 text-xs flex-shrink-0">
                          <ImageIcon className="h-3 w-3" />
                          {justification.attachments.length}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Attachments Preview */}
                    {justification.attachments?.length > 0 && (
                      <div className="flex gap-1 md:gap-2 mb-2">
                        {justification.attachments.slice(0, 2).map((attachment: any, idx: number) => (
                          attachmentUrls[attachment.path] && (
                            <img
                              key={idx}
                              src={attachmentUrls[attachment.path]}
                              alt="Anexo"
                              className="w-10 h-10 md:w-16 md:h-16 object-cover rounded border cursor-pointer"
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
                        {justification.attachments.length > 2 && (
                          <div 
                            className="w-10 h-10 md:w-16 md:h-16 bg-slate-200 rounded border flex items-center justify-center text-xs text-slate-600 cursor-pointer"
                            onClick={() => {
                              setSelectedJustification(justification);
                              if (justification.attachments[0]?.path && attachmentUrls[justification.attachments[0].path]) {
                                setSelectedImage(attachmentUrls[justification.attachments[0].path]);
                              }
                            }}
                          >
                            +{justification.attachments.length - 2}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-1.5 md:gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1 h-7 md:h-9 text-xs md:text-sm bg-green-500 hover:bg-green-600"
                        onClick={() => handleApproveJustification(justification.id)}
                        disabled={updateJustification.isPending}
                      >
                        <CheckCircle className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                        Aprovar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 h-7 md:h-9 text-xs md:text-sm"
                        onClick={() => handleRejectJustification(justification.id)}
                        disabled={updateJustification.isPending}
                      >
                        Rejeitar
                      </Button>
                    </div>
                  </div>
                )) || (
                  <p className="text-muted-foreground text-center py-4 text-sm">
                    Nenhuma aprovação pendente
                  </p>
                )}
              </div>
              <Button 
                variant="outline"
                size="sm"
                className="w-full mt-3 text-xs md:text-sm"
                onClick={() => navigate('/admin/aprovacoes')}
              >
                Ver Todas as Aprovações
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Department Stats */}
        <Card className="shadow-lg border-slate-200/50">
          <CardHeader className="pb-3 md:pb-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg text-slate-900">
              <BarChart3 className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              Estatísticas por Departamento
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 md:space-y-4">
              {reportData?.departmentStats.map((dept) => (
                <div key={dept.department} className="flex items-center justify-between p-2 md:p-4 rounded-lg bg-slate-50/50 border border-slate-200/50">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-sm md:text-base text-slate-900 truncate">{dept.department}</h4>
                    <p className="text-xs text-slate-600">
                      {dept.employees} colaboradores
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className="text-lg md:text-2xl font-bold text-primary">{dept.avgHours}h</div>
                    <div className="text-xs text-slate-500">média mensal</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-lg border-slate-200/50">
          <CardHeader className="pb-3 md:pb-6">
            <CardTitle className="text-base md:text-lg text-slate-900">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
              <Button 
                variant="outline" 
                className="h-20 md:h-28 flex flex-col gap-1.5 md:gap-3 rounded-lg hover:shadow-md transition-shadow"
                onClick={() => navigate('/admin/cadastros')}
              >
                <div className="p-1.5 md:p-3 bg-blue-100 rounded-lg">
                  <Users className="h-4 w-4 md:h-6 md:w-6 text-blue-600" />
                </div>
                <span className="text-xs md:text-sm font-medium text-slate-700">Gerenciar Usuários</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 md:h-28 flex flex-col gap-1.5 md:gap-3 rounded-lg hover:shadow-md transition-shadow"
                onClick={() => navigate('/admin/aprovacoes')}
              >
                <div className="p-1.5 md:p-3 bg-orange-100 rounded-lg">
                  <AlertTriangle className="h-4 w-4 md:h-6 md:w-6 text-orange-600" />
                </div>
                <span className="text-xs md:text-sm font-medium text-slate-700">Aprovar Solicitações</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 md:h-28 flex flex-col gap-1.5 md:gap-3 rounded-lg hover:shadow-md transition-shadow"
                onClick={() => navigate('/admin/relatorios')}
              >
                <div className="p-1.5 md:p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="h-4 w-4 md:h-6 md:w-6 text-green-600" />
                </div>
                <span className="text-xs md:text-sm font-medium text-slate-700">Ver Relatórios</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 md:h-28 flex flex-col gap-1.5 md:gap-3 rounded-lg hover:shadow-md transition-shadow"
                onClick={() => navigate('/admin/integracoes')}
              >
                <div className="p-1.5 md:p-3 bg-purple-100 rounded-lg">
                  <Calendar className="h-4 w-4 md:h-6 md:w-6 text-purple-600" />
                </div>
                <span className="text-xs md:text-sm font-medium text-slate-700">Configurações</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-[95vw] md:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes do Registro</DialogTitle>
            </DialogHeader>
            {selectedEntry && (
              <div className="space-y-4">
                {/* Employee Info */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-base md:text-lg">{selectedEntry.profiles?.full_name || 'Usuário'}</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Tipo:</span>
                      <p className="font-medium">
                        {selectedEntry.punch_type === 'IN' ? 'Entrada' :
                         selectedEntry.punch_type === 'OUT' ? 'Saída' :
                         selectedEntry.punch_type === 'BREAK_IN' ? 'Início Intervalo' : 'Fim Intervalo'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Horário:</span>
                      <p className="font-medium">
                        {new Date(selectedEntry.punch_time).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <p className="font-medium">
                        <Badge variant={selectedEntry.status === 'approved' ? 'default' : 'secondary'}>
                          {selectedEntry.status === 'approved' ? 'Aprovado' : 'Pendente'}
                        </Badge>
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Departamento:</span>
                      <p className="font-medium">{selectedEntry.profiles?.department || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Facial Recognition */}
                {selectedEntry.facial_recognition_audit && selectedEntry.facial_recognition_audit.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                      <h4 className="font-semibold text-sm md:text-base">Reconhecimento Facial</h4>
                    </div>
                    <div className="border rounded-lg p-3 md:p-4 space-y-3">
                      <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden">
                        <img 
                          src={selectedEntry.facial_recognition_audit[0].attempt_image_url}
                          alt="Foto de reconhecimento facial"
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.svg';
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Confiança:</span>
                        <Badge variant={
                          selectedEntry.facial_recognition_audit[0].confidence_score >= 0.9 ? 'default' :
                          selectedEntry.facial_recognition_audit[0].confidence_score >= 0.7 ? 'secondary' : 'destructive'
                        }>
                          {(selectedEntry.facial_recognition_audit[0].confidence_score * 100).toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                {/* Location */}
                {selectedEntry.location_address && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                      <h4 className="font-semibold text-sm md:text-base">Localização</h4>
                    </div>
                    <div className="border rounded-lg p-3 md:p-4 space-y-2">
                      <p className="text-sm font-medium">{selectedEntry.location_address}</p>
                      {selectedEntry.location_lat && selectedEntry.location_lng && (
                        <>
                          <p className="text-xs text-muted-foreground">
                            {selectedEntry.location_lat.toFixed(6)}, {selectedEntry.location_lng.toFixed(6)}
                          </p>
                          <a
                            href={`https://www.google.com/maps?q=${selectedEntry.location_lat},${selectedEntry.location_lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <MapPin className="h-3 w-3" />
                            Ver no Google Maps
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Image Viewer Dialog */}
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-[95vw] md:max-w-4xl max-h-[90vh] overflow-y-auto">
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
                  <div className="bg-slate-50 p-3 md:p-4 rounded-lg">
                    <h4 className="font-medium text-sm md:text-base mb-2">{selectedJustification.title}</h4>
                    <p className="text-xs md:text-sm text-slate-600 mb-3">{selectedJustification.description}</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-green-500 hover:bg-green-600 text-xs md:text-sm"
                        onClick={() => {
                          handleApproveJustification(selectedJustification.id);
                          setSelectedImage(null);
                          setSelectedJustification(null);
                        }}
                        disabled={updateJustification.isPending}
                      >
                        <CheckCircle className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs md:text-sm"
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
      </div>
    </AdminLayout>
  );
};

export default Dashboard;