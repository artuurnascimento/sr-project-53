import { Users, Clock, AlertTriangle, CheckCircle, MapPin, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import AdminLayout from '@/components/layout/AdminLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useReportData } from '@/hooks/useReports';
import { useTimeEntries } from '@/hooks/useTimeTracking';
import { useJustifications } from '@/hooks/useJustifications';
import { useProfiles } from '@/hooks/useProfiles';

const Dashboard = () => {
  const { data: reportData, isLoading: reportLoading } = useReportData();
  const { data: recentEntries } = useTimeEntries();
  const { data: pendingJustifications } = useJustifications();
  const { data: profiles } = useProfiles();

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

  if (reportLoading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <AdminLayout>
          <div className="space-y-6">
            <div className="text-center py-12">
              <p className="text-muted-foreground">Carregando dashboard...</p>
            </div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">
                Visão geral do sistema de ponto eletrônico
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Relatório Mensal
              </Button>
              <Button size="sm">
                <TrendingUp className="h-4 w-4 mr-2" />
                Exportar Dados
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Colaboradores Ativos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {reportData?.activeEmployees || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  de {reportData?.totalEmployees || 0} total
                </p>
                <Progress 
                  value={reportData ? (reportData.activeEmployees / reportData.totalEmployees) * 100 : 0} 
                  className="mt-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Registros Hoje</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-secondary">
                  {reportData?.todayPunches || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  batidas de ponto
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aprovações Pendentes</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {reportData?.pendingApprovals || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  justificativas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Horas Extras</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {reportData?.overtime || 0}h
                </div>
                <p className="text-xs text-muted-foreground">
                  este mês
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Últimos Registros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentEntries?.slice(0, 5).map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {entry.profiles?.full_name || 'Usuário'}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {getEventTypeLabel(entry.punch_type)} - {' '}
                            {new Date(entry.punch_time).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          {entry.location_address && (
                            <div className="flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {entry.location_address}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(entry.status)}
                    </div>
                  )) || (
                    <p className="text-muted-foreground text-center py-4">
                      Nenhum registro recente
                    </p>
                  )}
                </div>
                <Button variant="outline" className="w-full mt-4">
                  Ver Todos os Registros
                </Button>
              </CardContent>
            </Card>

            {/* Pending Approvals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Aprovações Pendentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingJustifications?.slice(0, 5).map((justification) => (
                    <div key={justification.id} className="p-3 rounded-lg border">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="font-medium">
                            {justification.profiles?.full_name || 'Usuário'}
                          </span>
                          <div className="text-sm text-muted-foreground">
                            {new Date(justification.created_at).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                        <Badge variant="secondary">
                          {justification.request_type === 'absence' ? 'Falta' :
                           justification.request_type === 'overtime' ? 'Hora Extra' :
                           justification.request_type === 'vacation' ? 'Férias' :
                           justification.request_type === 'expense' ? 'Despesa' : 'Outro'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {justification.description}
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-xs">
                          Aprovar
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs">
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
                <Button variant="outline" className="w-full mt-4">
                  Ver Todas as Aprovações
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Department Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Estatísticas por Departamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData?.departmentStats.map((dept) => (
                  <div key={dept.department} className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <h4 className="font-medium">{dept.department}</h4>
                      <p className="text-sm text-muted-foreground">
                        {dept.employees} colaboradores
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{dept.avgHours}h</div>
                      <div className="text-sm text-muted-foreground">média mensal</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <Users className="h-6 w-6" />
                  Gerenciar Usuários
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <AlertTriangle className="h-6 w-6" />
                  Aprovar Pendências
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <TrendingUp className="h-6 w-6" />
                  Gerar Relatório
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <Calendar className="h-6 w-6" />
                  Configurar Horários
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
};

export default Dashboard;