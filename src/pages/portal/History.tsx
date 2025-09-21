import { useState } from 'react';
import { Calendar, Clock, Download, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PortalLayout from '@/components/layout/PortalLayout';

const History = () => {
  const [selectedMonth, setSelectedMonth] = useState('2025-01');
  
  // Mock data
  const history = [
    {
      date: '2025-01-20',
      events: [
        { time: '08:15', type: 'IN', status: 'approved' },
        { time: '12:00', type: 'BREAK_IN', status: 'approved' },
        { time: '13:00', type: 'BREAK_OUT', status: 'approved' },
        { time: '17:30', type: 'OUT', status: 'approved' }
      ],
      totalHours: '7h 45m',
      overtime: '45m'
    },
    {
      date: '2025-01-19',
      events: [
        { time: '08:10', type: 'IN', status: 'approved' },
        { time: '12:00', type: 'BREAK_IN', status: 'approved' },
        { time: '13:00', type: 'BREAK_OUT', status: 'approved' },
        { time: '17:00', type: 'OUT', status: 'approved' }
      ],
      totalHours: '8h 00m',
      overtime: '0m'
    },
    {
      date: '2025-01-18',
      events: [
        { time: '08:20', type: 'IN', status: 'pending' },
        { time: '12:00', type: 'BREAK_IN', status: 'approved' },
        { time: '13:00', type: 'BREAK_OUT', status: 'approved' },
        { time: '17:00', type: 'OUT', status: 'approved' }
      ],
      totalHours: '7h 40m',
      overtime: '0m'
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit'
    });
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    // TODO: Implementar exportação
    console.log('Export:', format);
  };

  return (
    <PortalLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Histórico de Ponto</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Mês/Ano</label>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="approved">Aprovados</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="rejected">Rejeitados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* History List */}
        <div className="space-y-4">
          {history.map((day) => (
            <Card key={day.date}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {formatDate(day.date)}
                  </CardTitle>
                  <div className="flex gap-4 text-sm">
                    <span className="text-muted-foreground">
                      Total: <span className="font-medium text-foreground">{day.totalHours}</span>
                    </span>
                    {day.overtime !== '0m' && (
                      <span className="text-muted-foreground">
                        Extra: <span className="font-medium text-primary">{day.overtime}</span>
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {day.events.map((event, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{event.time}</div>
                          <div className="text-sm text-muted-foreground">
                            {getEventTypeLabel(event.type)}
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(event.status)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo do Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">168h</div>
                <div className="text-sm text-muted-foreground">Horas Trabalhadas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary">12h</div>
                <div className="text-sm text-muted-foreground">Horas Extras</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-muted-foreground">20</div>
                <div className="text-sm text-muted-foreground">Dias Trabalhados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent-foreground">2</div>
                <div className="text-sm text-muted-foreground">Faltas</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default History;