import { useState } from 'react';
import { BarChart3, Download, Calendar, Users, Clock, TrendingUp, Filter, MapPin, Camera, Eye } from 'lucide-react';
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
          entry.punch_type,
          entry.status,
          entry.location_address || 'N/A'
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-ponto-${startDate}-${endDate}.csv`;
      a.click();
      URL.revokeObjectURL(url);
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
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Relatórios</h1>
              <p className="text-muted-foreground">
                Análise detalhada de dados de ponto e produtividade
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => generateReport('csv')}>
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => generateReport('excel')}>
                <Download className="h-4 w-4 mr-2" />
                Excel
              </Button>
              <Button size="sm" onClick={() => generateReport('pdf')}>
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
                Filtros do Relatório
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm font-medium">Data Início</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Data Fim</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Departamento</Label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger>
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
              <div className="flex items-end">
                <Button className="w-full">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Gerar Relatório
                </Button>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="attendance">Frequência</TabsTrigger>
              <TabsTrigger value="departments">Departamentos</TabsTrigger>
              <TabsTrigger value="productivity">Produtividade</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                <CardHeader>
                  <CardTitle>Atividade Recente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {timeEntries?.slice(0, 10).map((entry) => (
                      <div 
                        key={entry.id} 
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/5 cursor-pointer transition-colors"
                        onClick={() => {
                          setSelectedEntry(entry);
                          setDetailsOpen(true);
                        }}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <Clock className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {entry.profiles?.full_name || 'Usuário'}
                            </div>
                            <div className="text-sm text-muted-foreground truncate">
                              {entry.punch_type === 'IN' ? 'Entrada' :
                               entry.punch_type === 'OUT' ? 'Saída' :
                               entry.punch_type === 'BREAK_IN' ? 'Início Intervalo' : 'Fim Intervalo'} - {' '}
                              {new Date(entry.punch_time).toLocaleString('pt-BR')}
                            </div>
                            <div className="flex gap-2 mt-1">
                              {entry.facial_recognition_audit && entry.facial_recognition_audit.length > 0 && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Camera className="h-3 w-3" />
                                  <span>Foto</span>
                                </div>
                              )}
                              {entry.location_address && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  <span>Local</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <Badge variant={entry.status === 'approved' ? 'default' : 'secondary'}>
                            {entry.status === 'approved' ? 'Aprovado' : 'Pendente'}
                          </Badge>
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    )) || (
                      <p className="text-muted-foreground text-center py-4">
                        Nenhuma atividade recente
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attendance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Análise de Frequência</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">95%</div>
                        <div className="text-sm text-muted-foreground">Taxa de Presença</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-orange-600">3</div>
                        <div className="text-sm text-muted-foreground">Atrasos Hoje</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-red-600">1</div>
                        <div className="text-sm text-muted-foreground">Faltas Hoje</div>
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