import { useState } from 'react';
import { BarChart3, Download, Calendar, Users, Clock, TrendingUp, Filter, MapPin, Camera, Eye } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AdminLayout from '@/components/layout/AdminLayout';
import { useReportData } from '@/hooks/useReports';
import { useTimeEntries, type TimeEntry } from '@/hooks/useTimeTracking';
import { useProfiles } from '@/hooks/useProfiles';

const Reports = () => {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1); // First day of current month
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    return date.toISOString().split('T')[0];
  });
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { data: reportData, isLoading } = useReportData(startDate, endDate);
  const { data: timeEntries } = useTimeEntries();
  const { data: profiles } = useProfiles();

  const generateReport = (format: 'csv' | 'pdf' | 'excel') => {
    if (!timeEntries) return;

    const filteredEntries = timeEntries.filter(entry => {
      const entryDate = new Date(entry.punch_time).toISOString().split('T')[0];
      const departmentMatch = selectedDepartment === 'all' || 
        entry.profiles?.department === selectedDepartment;
      
      return entryDate >= startDate && entryDate <= endDate && departmentMatch;
    });

    if (format === 'csv') {
      const csvContent = [
        'Data,Hora,Colaborador,Departamento,Tipo,Status,Localização',
        ...filteredEntries.map(entry => [
          new Date(entry.punch_time).toLocaleDateString('pt-BR'),
          new Date(entry.punch_time).toLocaleTimeString('pt-BR'),
          entry.profiles?.full_name || 'N/A',
          entry.profiles?.department || 'N/A',
          entry.punch_type === 'IN' ? 'Entrada' : entry.punch_type === 'OUT' ? 'Saída' : entry.punch_type === 'BREAK_IN' ? 'Início Intervalo' : 'Fim Intervalo',
          entry.status === 'approved' ? 'Aprovado' : 'Pendente',
          entry.location_address || 'N/A'
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-ponto-${startDate}-${endDate}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'excel') {
      const data = filteredEntries.map(entry => ({
        'Data': new Date(entry.punch_time).toLocaleDateString('pt-BR'),
        'Hora': new Date(entry.punch_time).toLocaleTimeString('pt-BR'),
        'Colaborador': entry.profiles?.full_name || 'N/A',
        'Departamento': entry.profiles?.department || 'N/A',
        'Tipo': entry.punch_type === 'IN' ? 'Entrada' : entry.punch_type === 'OUT' ? 'Saída' : entry.punch_type === 'BREAK_IN' ? 'Início Intervalo' : 'Fim Intervalo',
        'Status': entry.status === 'approved' ? 'Aprovado' : 'Pendente',
        'Localização': entry.location_address || 'N/A'
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Relatório de Ponto');
      
      // Auto-size columns
      const maxWidth = data.reduce((w, r) => Math.max(w, r.Colaborador?.length || 0), 10);
      ws['!cols'] = [
        { wch: 12 }, // Data
        { wch: 10 }, // Hora
        { wch: maxWidth + 2 }, // Colaborador
        { wch: 15 }, // Departamento
        { wch: 15 }, // Tipo
        { wch: 10 }, // Status
        { wch: 30 }  // Localização
      ];
      
      XLSX.writeFile(wb, `relatorio-ponto-${startDate}-${endDate}.xlsx`);
    } else if (format === 'pdf') {
      const doc = new jsPDF();
      
      // Título
      doc.setFontSize(16);
      doc.text('Relatório de Ponto', 14, 15);
      
      // Período
      doc.setFontSize(10);
      doc.text(`Período: ${new Date(startDate).toLocaleDateString('pt-BR')} a ${new Date(endDate).toLocaleDateString('pt-BR')}`, 14, 22);
      
      if (selectedDepartment !== 'all') {
        doc.text(`Departamento: ${selectedDepartment}`, 14, 27);
      }
      
      // Estatísticas
      doc.text(`Total de Registros: ${filteredEntries.length}`, 14, selectedDepartment !== 'all' ? 32 : 27);
      
      // Tabela
      const tableData = filteredEntries.map(entry => [
        new Date(entry.punch_time).toLocaleDateString('pt-BR'),
        new Date(entry.punch_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        entry.profiles?.full_name || 'N/A',
        entry.profiles?.department || 'N/A',
        entry.punch_type === 'IN' ? 'Entrada' : entry.punch_type === 'OUT' ? 'Saída' : entry.punch_type === 'BREAK_IN' ? 'Início Int.' : 'Fim Int.',
        entry.status === 'approved' ? 'Aprovado' : 'Pendente'
      ]);

      autoTable(doc, {
        head: [['Data', 'Hora', 'Colaborador', 'Depto', 'Tipo', 'Status']],
        body: tableData,
        startY: selectedDepartment !== 'all' ? 37 : 32,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        columnStyles: {
          0: { cellWidth: 22 },
          1: { cellWidth: 18 },
          2: { cellWidth: 45 },
          3: { cellWidth: 30 },
          4: { cellWidth: 25 },
          5: { cellWidth: 22 }
        }
      });
      
      doc.save(`relatorio-ponto-${startDate}-${endDate}.pdf`);
    }
  };

  const getDepartments = () => {
    if (!profiles) return [];
    const departments = [...new Set(profiles.map(p => p.department).filter(Boolean))];
    return departments;
  };

  const getAttendanceRate = () => {
    if (!reportData) return 0;
    const workingDays = 22; // Average working days per month
    const expectedPunches = reportData.activeEmployees * workingDays * 2; // IN and OUT
    return Math.round((reportData.todayPunches / expectedPunches) * 100);
  };

  return (
    <AdminLayout>
        <div className="space-y-4 md:space-y-6 p-4 md:p-0 max-w-full overflow-x-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl md:text-3xl font-bold">Relatórios</h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Análise detalhada de dados de ponto e produtividade
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button variant="outline" size="sm" onClick={() => generateReport('csv')} className="text-xs md:text-sm w-full sm:w-auto">
                <Download className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">CSV</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => generateReport('excel')} className="text-xs md:text-sm w-full sm:w-auto">
                <Download className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Excel</span>
              </Button>
              <Button size="sm" onClick={() => generateReport('pdf')} className="text-xs md:text-sm w-full sm:w-auto">
                <Download className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">PDF</span>
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <Filter className="h-4 w-4 md:h-5 md:w-5" />
                Filtros do Relatório
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div>
                <Label className="text-xs md:text-sm font-medium">Data Início</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="text-xs md:text-sm font-medium">Data Fim</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="text-xs md:text-sm font-medium">Departamento</Label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {getDepartments().map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end sm:col-span-2 md:col-span-1">
                <Button className="w-full text-sm">
                  <BarChart3 className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                  <span className="hidden sm:inline">Gerar Relatório</span>
                  <span className="sm:hidden">Gerar</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="overview" className="space-y-4 md:space-y-6">
            <TabsList className="w-full flex flex-wrap gap-2 text-xs md:text-sm">
              <TabsTrigger value="overview" className="flex-shrink-0">Visão Geral</TabsTrigger>
              <TabsTrigger value="attendance" className="flex-shrink-0">Frequência</TabsTrigger>
              <TabsTrigger value="departments" className="flex-shrink-0">Departamentos</TabsTrigger>
              <TabsTrigger value="productivity" className="flex-shrink-0">Produtividade</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 md:space-y-6">
              {/* Overview Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Colaboradores</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">
                      {reportData?.totalEmployees || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {reportData?.activeEmployees || 0} ativos
                    </p>
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
                    <p className="text-xs text-muted-foreground">batidas de ponto</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Taxa de Presença</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">
                      {getAttendanceRate()}%
                    </div>
                    <Progress value={getAttendanceRate()} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Horas Extras</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {reportData?.overtime || 0}h
                    </div>
                    <p className="text-xs text-muted-foreground">este mês</p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader className="pb-3 md:pb-6">
                  <CardTitle className="text-base md:text-lg">Atividade Recente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 md:space-y-4">
                    {timeEntries?.slice(0, 10).map((entry) => (
                      <div 
                        key={entry.id} 
                        className="flex items-center justify-between p-2 md:p-3 rounded-lg border hover:bg-accent/5 cursor-pointer transition-colors"
                        onClick={() => {
                          setSelectedEntry(entry);
                          setDetailsOpen(true);
                        }}
                      >
                        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                          <div className="w-6 h-6 md:w-8 md:h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <Clock className="h-3 w-3 md:h-4 md:w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {entry.profiles?.full_name || 'Usuário'}
                            </div>
                            <div className="text-xs md:text-sm text-muted-foreground truncate">
                              {entry.punch_type === 'IN' ? 'Entrada' :
                               entry.punch_type === 'OUT' ? 'Saída' :
                               entry.punch_type === 'BREAK_IN' ? 'Início Intervalo' : 'Fim Intervalo'} - {' '}
                              {new Date(entry.punch_time).toLocaleString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                            <div className="flex gap-1 md:gap-2 mt-0.5 md:mt-1">
                              {entry.facial_recognition_audit && entry.facial_recognition_audit.length > 0 && (
                                <div className="flex items-center gap-0.5 md:gap-1 text-xs text-muted-foreground">
                                  <Camera className="h-2.5 w-2.5 md:h-3 md:w-3" />
                                  <span className="hidden sm:inline">Foto</span>
                                </div>
                              )}
                              {entry.location_address && (
                                <div className="flex items-center gap-0.5 md:gap-1 text-xs text-muted-foreground">
                                  <MapPin className="h-2.5 w-2.5 md:h-3 md:w-3" />
                                  <span className="hidden sm:inline">Local</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0 ml-1 md:ml-2">
                          <Badge variant={entry.status === 'approved' ? 'default' : 'secondary'} className="text-xs">
                            {entry.status === 'approved' ? 'Aprovado' : 'Pendente'}
                          </Badge>
                          <Eye className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground hidden sm:block" />
                        </div>
                      </div>
                    )) || (
                      <p className="text-muted-foreground text-center py-4 text-sm">
                        Nenhuma atividade recente
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attendance" className="space-y-4 md:space-y-6">
              <Card>
                <CardHeader className="pb-3 md:pb-6">
                  <CardTitle className="text-base md:text-lg">Análise de Frequência</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 md:space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                      <div className="text-center">
                        <div className="text-2xl md:text-3xl font-bold text-green-600">95%</div>
                        <div className="text-xs md:text-sm text-muted-foreground">Taxa de Presença</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl md:text-3xl font-bold text-orange-600">3</div>
                        <div className="text-xs md:text-sm text-muted-foreground">Atrasos Hoje</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl md:text-3xl font-bold text-red-600">1</div>
                        <div className="text-xs md:text-sm text-muted-foreground">Faltas Hoje</div>
                      </div>
                    </div>
                    
                    <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">Gráfico de frequência</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Implementação com Recharts pendente
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="departments" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Estatísticas por Departamento</CardTitle>
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
                    )) || (
                      <p className="text-muted-foreground text-center py-4">
                        Carregando estatísticas...
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="productivity" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Análise de Produtividade</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-4">Horas Trabalhadas por Semana</h4>
                      <div className="h-48 bg-muted rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <TrendingUp className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground text-sm">Gráfico de produtividade</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-4">Métricas de Eficiência</h4>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm">Pontualidade</span>
                            <span className="text-sm font-medium">92%</span>
                          </div>
                          <Progress value={92} />
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm">Cumprimento de Horário</span>
                            <span className="text-sm font-medium">88%</span>
                          </div>
                          <Progress value={88} />
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm">Horas Extras</span>
                            <span className="text-sm font-medium">15%</span>
                          </div>
                          <Progress value={15} />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Details Dialog */}
          <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Detalhes do Registro</DialogTitle>
              </DialogHeader>
              {selectedEntry && (
                <div className="space-y-6">
                  {/* Employee Info */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">{selectedEntry.profiles?.full_name || 'Usuário'}</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
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
                        <Camera className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold">Reconhecimento Facial</h4>
                      </div>
                      <div className="border rounded-lg p-4 space-y-3">
                        <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden">
                          <img 
                            src={selectedEntry.facial_recognition_audit[0].attempt_image_url}
                            alt="Foto de reconhecimento facial"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              console.error('Erro ao carregar imagem:', selectedEntry.facial_recognition_audit[0].attempt_image_url);
                              (e.target as HTMLImageElement).src = '/placeholder.svg';
                            }}
                            onLoad={() => {
                              console.log('Imagem carregada com sucesso');
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
                        <MapPin className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold">Localização</h4>
                      </div>
                      <div className="border rounded-lg p-4 space-y-3">
                        <div className="text-sm">
                          <p className="font-medium">{selectedEntry.location_address}</p>
                          {selectedEntry.location_lat && selectedEntry.location_lng && (
                            <p className="text-muted-foreground mt-2">
                              Coordenadas: {selectedEntry.location_lat.toFixed(6)}, {selectedEntry.location_lng.toFixed(6)}
                            </p>
                          )}
                        </div>
                        {selectedEntry.location_lat && selectedEntry.location_lng && (
                          <a
                            href={`https://www.google.com/maps?q=${selectedEntry.location_lat},${selectedEntry.location_lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                          >
                            <MapPin className="h-4 w-4" />
                            Ver no Google Maps
                          </a>
                        )}
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

export default Reports;