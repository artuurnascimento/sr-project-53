import { useState } from 'react';
import { Calendar, Clock, Download, ChevronLeft, ChevronRight, FileText, ExternalLink, FileImage, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import PortalLayout from '@/components/layout/PortalLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useTimeEntries } from '@/hooks/useTimeTracking';
import { toast } from 'sonner';
import { downloadComprovanteAsImage, downloadComprovanteAsPDF } from '@/utils/comprovanteExport';

const History = () => {
  const { profile } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: timeEntries, isLoading } = useTimeEntries(profile?.id);

  const getMonthEntries = () => {
    if (!timeEntries) return [];
    
    const [year, month] = selectedMonth.split('-');
    return timeEntries.filter(entry => {
      const entryDate = new Date(entry.punch_time);
      return entryDate.getFullYear() === parseInt(year) && 
             entryDate.getMonth() === parseInt(month) - 1;
    });
  };

  const groupEntriesByDate = () => {
    const entries = getMonthEntries();
    const grouped: Record<string, typeof entries> = {};

    entries.forEach(entry => {
      const date = new Date(entry.punch_time).toISOString().split('T')[0];
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(entry);
    });

    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => new Date(a.punch_time).getTime() - new Date(b.punch_time).getTime());
    });

    return grouped;
  };

  const calculateDayHours = (entries: any[]) => {
    let totalMinutes = 0;
    let lastIn: Date | null = null;
    let isOnBreak = false;

    for (const entry of entries) {
      const punchTime = new Date(entry.punch_time);
      
      if (entry.punch_type === 'IN') {
        lastIn = punchTime;
        isOnBreak = false;
      } else if (entry.punch_type === 'OUT' && lastIn && !isOnBreak) {
        totalMinutes += (punchTime.getTime() - lastIn.getTime()) / (1000 * 60);
        lastIn = null;
      } else if (entry.punch_type === 'BREAK_IN' && lastIn) {
        totalMinutes += (punchTime.getTime() - lastIn.getTime()) / (1000 * 60);
        isOnBreak = true;
      } else if (entry.punch_type === 'BREAK_OUT') {
        lastIn = punchTime;
        isOnBreak = false;
      }
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    const overtime = Math.max(0, totalMinutes - 480);

    return {
      total: `${hours}h ${minutes}m`,
      overtime: overtime > 0 ? `${Math.floor(overtime / 60)}h ${Math.round(overtime % 60)}m` : '0m'
    };
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
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'} className="text-xs">
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const handleViewComprovante = (entryId: string, comprovanteUrl?: string) => {
    if (comprovanteUrl) {
      window.open(comprovanteUrl, '_blank');
    } else {
      window.open(`/comprovante?id=${entryId}`, '_blank');
    }
  };

  const handleDownloadPDF = async (entryId: string) => {
    const comprovanteWindow = window.open(`/comprovante?id=${entryId}`, '_blank');
    if (comprovanteWindow) {
      setTimeout(async () => {
        try {
          const element = comprovanteWindow.document.getElementById('comprovante-content');
          if (element) {
            await downloadComprovanteAsPDF(
              'comprovante-content',
              `comprovante-ponto-${entryId}.pdf`
            );
            toast.success('PDF baixado com sucesso!');
          }
        } catch (error) {
          toast.error('Abra o comprovante para baixar o PDF');
        }
      }, 1500);
    }
  };

  const handleDownloadImage = async (entryId: string) => {
    const comprovanteWindow = window.open(`/comprovante?id=${entryId}`, '_blank');
    if (comprovanteWindow) {
      setTimeout(async () => {
        try {
          const element = comprovanteWindow.document.getElementById('comprovante-content');
          if (element) {
            await downloadComprovanteAsImage(
              'comprovante-content',
              `comprovante-ponto-${entryId}.png`
            );
            toast.success('Imagem baixada com sucesso!');
          }
        } catch (error) {
          toast.error('Abra o comprovante para baixar a imagem');
        }
      }, 1500);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit'
    });
  };

  const handleExport = () => {
    const entries = getMonthEntries();
    const csvContent = [
      'Data,Hora,Tipo,Status,Localização',
      ...entries.map(entry => [
        new Date(entry.punch_time).toLocaleDateString('pt-BR'),
        new Date(entry.punch_time).toLocaleTimeString('pt-BR'),
        getEventTypeLabel(entry.punch_type),
        entry.status,
        entry.location_address || 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historico-ponto-${selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1);
    
    if (direction === 'prev') {
      date.setMonth(date.getMonth() - 1);
    } else {
      date.setMonth(date.getMonth() + 1);
    }
    
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
  };

  const groupedEntries = groupEntriesByDate();
  const sortedDates = Object.keys(groupedEntries).sort().reverse();

  return (
    <PortalLayout>
      <div className="max-w-4xl mx-auto space-y-4 md:space-y-6 p-4 md:p-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
          <h1 className="text-xl md:text-2xl font-bold">Histórico de Ponto</h1>
          <Button variant="outline" size="sm" onClick={handleExport} className="text-xs md:text-sm w-full sm:w-auto">
            <Download className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
            CSV
          </Button>
        </div>

        {/* Month Navigation */}
        <Card>
          <CardHeader className="pb-3 md:pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <Calendar className="h-4 w-4 md:h-5 md:w-5" />
                Período
              </CardTitle>
              <div className="flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" onClick={() => changeMonth('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-medium min-w-[120px] text-center text-sm md:text-base">
                  {new Date(selectedMonth + '-01').toLocaleDateString('pt-BR', {
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
                <Button variant="outline" size="sm" onClick={() => changeMonth('next')}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs md:text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
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
        {isLoading ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground text-sm">Carregando histórico...</p>
            </CardContent>
          </Card>
        ) : sortedDates.length > 0 ? (
          <div className="space-y-3 md:space-y-4">
            {sortedDates.map((date) => {
              const dayEntries = groupedEntries[date].filter(entry => 
                statusFilter === 'all' || entry.status === statusFilter
              );
              
              if (dayEntries.length === 0) return null;
              
              const dayHours = calculateDayHours(dayEntries);
              
              return (
                <Card key={date}>
                  <CardHeader className="pb-3 md:pb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <CardTitle className="text-base md:text-lg flex items-center gap-2">
                        <Calendar className="h-4 w-4 md:h-5 md:w-5" />
                        {formatDate(date)}
                      </CardTitle>
                      <div className="flex gap-3 text-xs md:text-sm">
                        <span className="text-muted-foreground">Total: <span className="font-medium text-foreground">{dayHours.total}</span></span>
                        {dayHours.overtime !== '0m' && (
                          <span className="text-muted-foreground">Extra: <span className="font-medium text-primary">{dayHours.overtime}</span></span>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {dayEntries.map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm">
                                {new Date(entry.punch_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {getEventTypeLabel(entry.punch_type)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {getStatusBadge(entry.status)}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  title="Opções do comprovante"
                                >
                                  <Download className="h-3 w-3 md:h-4 md:w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleViewComprovante(entry.id, entry.comprovante_pdf)}
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  Ver Comprovante
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDownloadPDF(entry.id)}
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  Baixar PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDownloadImage(entry.id)}
                                >
                                  <FileImage className="h-4 w-4 mr-2" />
                                  Baixar Imagem
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground text-sm">Nenhum registro encontrado</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Resumo do Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <div className="text-xl md:text-2xl font-bold text-primary">{Math.floor(getMonthEntries().length / 4)}h</div>
                <div className="text-xs md:text-sm text-muted-foreground mt-1">Horas Trabalhadas</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <div className="text-xl md:text-2xl font-bold text-secondary">{Math.floor(getMonthEntries().length / 20)}h</div>
                <div className="text-xs md:text-sm text-muted-foreground mt-1">Horas Extras</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <div className="text-xl md:text-2xl font-bold text-muted-foreground">{sortedDates.length}</div>
                <div className="text-xs md:text-sm text-muted-foreground mt-1">Dias Trabalhados</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <div className="text-xl md:text-2xl font-bold text-accent-foreground">
                  {getMonthEntries().filter(e => e.status === 'pending').length}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground mt-1">Pendentes</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default History;
