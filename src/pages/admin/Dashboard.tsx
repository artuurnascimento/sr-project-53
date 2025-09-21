import { Users, Clock, AlertTriangle, CheckCircle, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AdminLayout from '@/components/layout/AdminLayout';

const Dashboard = () => {
  // Mock data
  const stats = {
    activeShift: 42,
    lateArrivals: 3,
    pendingApprovals: 7,
    completedTasks: 156
  };

  const recentEvents = [
    {
      id: 1,
      user: 'João Silva',
      type: 'IN',
      time: '08:15',
      location: 'Unidade Principal',
      status: 'approved'
    },
    {
      id: 2,
      user: 'Maria Santos',
      type: 'OUT',
      time: '17:30',
      location: 'Obra - São Paulo',
      status: 'approved'
    },
    {
      id: 3,
      user: 'Pedro Oliveira',
      type: 'IN',
      time: '08:25',
      location: 'Cliente - Porto',
      status: 'pending'
    }
  ];

  const pendingApprovals = [
    {
      id: 1,
      user: 'Ana Costa',
      type: 'justification',
      description: 'Atraso - Trânsito intenso',
      date: '2025-01-18',
      priority: 'medium'
    },
    {
      id: 2,
      user: 'Carlos Pereira',
      type: 'overtime',
      description: 'Hora extra - Projeto urgente',
      date: '2025-01-17',
      priority: 'high'
    }
  ];

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

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status === 'approved' ? 'Aprovado' : status === 'pending' ? 'Pendente' : 'Rejeitado'}
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Atualizar
            </Button>
            <Button size="sm">
              Exportar Relatório
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Turno</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.activeShift}</div>
              <p className="text-xs text-muted-foreground">colaboradores ativos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atrasos</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.lateArrivals}</div>
              <p className="text-xs text-muted-foreground">hoje</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.pendingApprovals}</div>
              <p className="text-xs text-muted-foreground">aprovações</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">{stats.completedTasks}</div>
              <p className="text-xs text-muted-foreground">este mês</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Últimos Eventos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="font-medium">{event.user}</span>
                        <span className="text-sm text-muted-foreground">
                          {getEventTypeLabel(event.type)} - {event.time}
                        </span>
                        <div className="flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{event.location}</span>
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(event.status)}
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                Ver Todos os Eventos
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
                {pendingApprovals.map((approval) => (
                  <div key={approval.id} className="p-3 rounded-lg border">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="font-medium">{approval.user}</span>
                        <div className="text-sm text-muted-foreground">{approval.date}</div>
                      </div>
                      {getPriorityBadge(approval.priority)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{approval.description}</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="text-xs">
                        Aprovar
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs">
                        Rejeitar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                Ver Todas as Aprovações
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Map Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Mapa de Presenças
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Mapa de localização dos colaboradores</p>
                <p className="text-sm text-muted-foreground mt-1">Implementação com Leaflet pendente</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;