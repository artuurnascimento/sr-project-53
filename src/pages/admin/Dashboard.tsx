import { Users, Clock, AlertTriangle, CheckCircle, MapPin, TrendingUp, Calendar, Activity, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import AdminLayout from '@/components/layout/AdminLayout';
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
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Dashboard Administrativo</h1>
              <p className="text-slate-700 mt-1">
                Painel de controle e gestão do sistema de ponto eletrônico
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" className="shadow-sm">
                <Calendar className="h-4 w-4 mr-2" />
                Relatório Mensal
              </Button>
              <Button size="sm" className="shadow-sm">
                <TrendingUp className="h-4 w-4 mr-2" />
                Exportar Dados
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-slate-700">Colaboradores Ativos</CardTitle>
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Users className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-700 mb-1">
                  {reportData?.activeEmployees || 0}
                </div>
                <p className="text-sm text-slate-600 mb-3">
                  de {reportData?.totalEmployees || 0} total
                </p>
                <Progress 
                  value={reportData ? (reportData.activeEmployees / reportData.totalEmployees) * 100 : 0} 
                  className="h-2"
                />
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200/50 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-slate-700">Registros Hoje</CardTitle>
                <div className="p-2 bg-green-500 rounded-lg">
                  <Clock className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-700 mb-1">
                  {reportData?.todayPunches || 0}
                </div>
                <p className="text-sm text-slate-600">
                  batidas de ponto
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200/50 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-slate-700">Aprovações Pendentes</CardTitle>
                <div className="p-2 bg-orange-500 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-700 mb-1">
                  {reportData?.pendingApprovals || 0}
                </div>
                <p className="text-sm text-slate-600">
                  justificativas
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/50 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-slate-700">Horas Extras</CardTitle>
                <div className="p-2 bg-purple-500 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-700 mb-1">
                  {reportData?.overtime || 0}h
                </div>
                <p className="text-sm text-slate-600">
                  este mês
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Events */}
            <Card className="shadow-lg border-slate-200/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-slate-900">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                  Últimos Registros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentEntries?.slice(0, 5).map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 border border-slate-200/50 hover:bg-slate-100/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          entry.punch_type === 'IN' ? 'bg-green-500' :
                          entry.punch_type === 'OUT' ? 'bg-red-500' :
                          entry.punch_type === 'BREAK_IN' ? 'bg-orange-500' : 'bg-blue-500'
                        }`}></div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">
                            {entry.profiles?.full_name || 'Usuário'}
                          </span>
                          <span className="text-sm text-slate-500">
                            {getEventTypeLabel(entry.punch_type)} - {' '}
                            {new Date(entry.punch_time).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          {entry.location_address && (
                            <div className="flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3 text-slate-400" />
                              <span className="text-xs text-slate-400">
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
                <Button variant="outline" className="w-full mt-4 shadow-sm">
                  Ver Todos os Registros
                </Button>
              </CardContent>
            </Card>

            {/* Pending Approvals */}
            <Card className="shadow-lg border-slate-200/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-slate-900">
                  <div className="p-2 bg-orange-500/10 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                  </div>
                  Aprovações Pendentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingJustifications?.slice(0, 5).map((justification) => (
                    <div key={justification.id} className="p-4 rounded-xl bg-slate-50/50 border border-slate-200/50 hover:bg-slate-100/50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="font-semibold text-slate-900">
                            {justification.profiles?.full_name || 'Usuário'}
                          </span>
                          <div className="text-sm text-slate-500">
                            {new Date(justification.created_at).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-white/50">
                          {justification.request_type === 'absence' ? 'Falta' :
                           justification.request_type === 'overtime' ? 'Hora Extra' :
                           justification.request_type === 'vacation' ? 'Férias' :
                           justification.request_type === 'expense' ? 'Despesa' : 'Outro'}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                        {justification.description}
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" className="text-xs h-7 bg-green-500 hover:bg-green-600 text-white">
                          Aprovar
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs h-7">
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
                <Button variant="outline" className="w-full mt-4 shadow-sm">
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
                <Button variant="outline" className="h-24 flex flex-col gap-2 rounded-xl shadow-sm hover:shadow-md transition-all">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <span className="font-medium text-slate-700">Gerenciar Usuários</span>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col gap-2 rounded-xl shadow-sm hover:shadow-md transition-all">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-orange-600" />
                  </div>
                  <span className="font-medium text-slate-700">Aprovar Pendências</span>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col gap-2 rounded-xl shadow-sm hover:shadow-md transition-all">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <span className="font-medium text-slate-700">Gerar Relatório</span>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col gap-2 rounded-xl shadow-sm hover:shadow-md transition-all">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                  <span className="font-medium text-slate-700">Configurar Horários</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
    </AdminLayout>
  );
};

export default Dashboard;