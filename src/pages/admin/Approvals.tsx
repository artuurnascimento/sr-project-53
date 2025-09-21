import { useState } from 'react';
import { Check, X, Eye, Filter, Clock, User, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import AdminLayout from '@/components/layout/AdminLayout';

const Approvals = () => {
  const [selectedApproval, setSelectedApproval] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // Mock data
  const approvals = [
    {
      id: 1,
      user: {
        name: 'João Silva',
        team: 'Operações',
        avatar: '/placeholder-avatar.jpg'
      },
      type: 'justification',
      subtype: 'late_arrival',
      date: '2025-01-18',
      description: 'Atraso devido a trânsito intenso na BR-101 causado por acidente',
      attachments: ['foto-acidente.jpg'],
      status: 'pending',
      priority: 'medium',
      createdAt: '2025-01-18T09:30:00',
      timeline: [
        { time: '08:00', event: 'Horário previsto de entrada', status: 'scheduled' },
        { time: '08:25', event: 'Batida de ponto registrada', status: 'late' },
        { time: '09:30', event: 'Justificativa enviada', status: 'pending' }
      ]
    },
    {
      id: 2,
      user: {
        name: 'Ana Costa',
        team: 'Administrativa',
        avatar: '/placeholder-avatar.jpg'
      },
      type: 'overtime',
      subtype: 'extra_hours',
      date: '2025-01-17',
      description: 'Hora extra para finalização de relatório mensal urgente',
      attachments: [],
      status: 'pending',
      priority: 'high',
      createdAt: '2025-01-17T18:30:00',
      timeline: [
        { time: '17:00', event: 'Fim do expediente regular', status: 'completed' },
        { time: '18:30', event: 'Solicitação de hora extra', status: 'pending' }
      ]
    },
    {
      id: 3,
      user: {
        name: 'Carlos Pereira',
        team: 'Manutenção',
        avatar: '/placeholder-avatar.jpg'
      },
      type: 'justification',
      subtype: 'absence',
      date: '2025-01-15',
      description: 'Consulta médica de emergência',
      attachments: ['atestado-medico.pdf'],
      status: 'approved',
      priority: 'high',
      createdAt: '2025-01-15T08:00:00',
      reviewedAt: '2025-01-16T10:00:00',
      reviewer: 'Maria Santos - RH',
      timeline: [
        { time: '08:00', event: 'Justificativa enviada', status: 'completed' },
        { time: '10:00', event: 'Aprovado por Maria Santos', status: 'approved' }
      ]
    }
  ];

  const getTypeLabel = (type: string, subtype: string) => {
    const labels = {
      'justification': {
        'late_arrival': 'Atraso',
        'absence': 'Falta',
        'early_departure': 'Saída Antecipada',
        'missing_punch': 'Esquecimento de Ponto'
      },
      'overtime': {
        'extra_hours': 'Hora Extra',
        'weekend_work': 'Trabalho Final de Semana'
      }
    };
    return labels[type as keyof typeof labels]?.[subtype as keyof any] || `${type} - ${subtype}`;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'pending': 'secondary',
      'approved': 'default',
      'rejected': 'destructive'
    } as const;
    
    const labels = {
      'pending': 'Pendente',
      'approved': 'Aprovado',
      'rejected': 'Rejeitado'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
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

  const handleApprove = (id: number, reason?: string) => {
    // TODO: Implementar aprovação
    console.log('Approve:', id, reason);
  };

  const handleReject = (id: number, reason: string) => {
    // TODO: Implementar rejeição  
    console.log('Reject:', id, reason);
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('pt-BR');
  };

  const filteredApprovals = approvals.filter(approval => {
    const statusMatch = filterStatus === 'all' || approval.status === filterStatus;
    const typeMatch = filterType === 'all' || approval.type === filterType;
    return statusMatch && typeMatch;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Aprovações</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filtros Avançados
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <div className="flex-1">
              <Label className="text-sm font-medium">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="approved">Aprovados</SelectItem>
                  <SelectItem value="rejected">Rejeitados</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label className="text-sm font-medium">Tipo</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="justification">Justificativas</SelectItem>
                  <SelectItem value="overtime">Horas Extras</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label className="text-sm font-medium">Buscar</Label>
              <Input placeholder="Nome do colaborador..." />
            </div>
          </CardContent>
        </Card>

        {/* Approvals List */}
        <div className="space-y-4">
          {filteredApprovals.map((approval) => (
            <Card key={approval.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{approval.user.name}</CardTitle>
                        <Badge variant="outline">{approval.user.team}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {getTypeLabel(approval.type, approval.subtype)} - {new Date(approval.date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(approval.priority)}
                    {getStatusBadge(approval.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{approval.description}</p>
                
                {approval.attachments.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Anexos:</h4>
                    <div className="flex gap-2">
                      {approval.attachments.map((file, index) => (
                        <Badge key={index} variant="outline">{file}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Criado em {formatDateTime(approval.createdAt)}
                  </div>
                  
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedApproval(approval)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Detalhes
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>
                            {approval.user.name} - {getTypeLabel(approval.type, approval.subtype)}
                          </DialogTitle>
                        </DialogHeader>
                        {selectedApproval && (
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium mb-2">Timeline do Dia:</h4>
                              <div className="space-y-2">
                                {selectedApproval.timeline.map((event: any, index: number) => (
                                  <div key={index} className="flex items-center gap-3 p-2 rounded border">
                                    <div className={`w-3 h-3 rounded-full ${
                                      event.status === 'completed' ? 'bg-green-500' :
                                      event.status === 'approved' ? 'bg-blue-500' :
                                      event.status === 'late' ? 'bg-orange-500' :
                                      'bg-gray-400'
                                    }`} />
                                    <div className="flex-1">
                                      <div className="font-medium">{event.time}</div>
                                      <div className="text-sm text-muted-foreground">{event.event}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    
                    {approval.status === 'pending' && (
                      <>
                        <Button size="sm" onClick={() => handleApprove(approval.id)}>
                          <Check className="h-4 w-4 mr-2" />
                          Aprovar
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <X className="h-4 w-4 mr-2" />
                              Rejeitar
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Rejeitar Solicitação</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <Label>Motivo da rejeição:</Label>
                              <Textarea placeholder="Descreva o motivo da rejeição..." />
                              <div className="flex gap-2 justify-end">
                                <Button variant="outline">Cancelar</Button>
                                <Button variant="destructive" onClick={() => handleReject(approval.id, '')}>
                                  Confirmar Rejeição
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredApprovals.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma aprovação encontrada</h3>
              <p className="text-muted-foreground">
                Não há solicitações de aprovação com os filtros selecionados.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default Approvals;