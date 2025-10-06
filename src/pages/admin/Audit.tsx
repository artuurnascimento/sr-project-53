import { useState } from 'react';
import { Search, Filter, Download, Eye, Calendar, User, Activity, Clock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import AdminLayout from '@/components/layout/AdminLayout';
import { useActivityLogs } from '@/hooks/useActivityLogs';

const Audit = () => {
  const { data: activityLogs, isLoading } = useActivityLogs();
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const getActionBadge = (action: string) => {
    const variants = {
      'CREATE': 'default',
      'UPDATE': 'secondary',
      'DELETE': 'destructive',
      'LOGIN': 'outline',
      'LOGOUT': 'outline',
      'APPROVE': 'default',
      'REJECT': 'destructive'
    } as const;

    return (
      <Badge variant={variants[action as keyof typeof variants] || 'outline'}>
        {action}
      </Badge>
    );
  };

  const getEntityIcon = (entity: string) => {
    switch (entity) {
      case 'time_entry':
        return <Clock className="h-4 w-4" />;
      case 'justification':
        return <FileText className="h-4 w-4" />;
      case 'profile':
        return <User className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getEntityName = (entity: string) => {
    const names = {
      'time_entry': 'Registro de Ponto',
      'justification': 'Justificativa',
      'profile': 'Perfil',
      'integration': 'Integração',
      'report': 'Relatório'
    };
    return names[entity as keyof typeof names] || entity;
  };

  const filteredLogs = activityLogs?.filter(log => {
    const searchMatch = !searchTerm || 
      log.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const actionMatch = actionFilter === 'all' || log.action_type === actionFilter;
    const entityMatch = entityFilter === 'all' || log.entity_type === entityFilter;
    
    return searchMatch && actionMatch && entityMatch;
  }) || [];

  const exportAuditLog = (format: 'csv' | 'pdf') => {
    if (!filteredLogs) return;

    if (format === 'csv') {
      const csvContent = [
        'Data,Usuário,Ação,Entidade,Detalhes,IP',
        ...filteredLogs.map(log => [
          new Date(log.created_at).toLocaleString('pt-BR'),
          log.profiles?.full_name || 'Sistema',
          log.action_type,
          getEntityName(log.entity_type),
          JSON.stringify(log.details),
          log.ip_address || 'N/A'
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `auditoria-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <AdminLayout>
        <div className="space-y-4 md:space-y-6 p-4 md:p-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl md:text-3xl font-bold">Auditoria</h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Registro de todas as ações realizadas no sistema
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => exportAuditLog('csv')} className="text-xs md:text-sm">
                <Download className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Exportar </span>CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportAuditLog('pdf')} className="text-xs md:text-sm">
                <Download className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Exportar </span>PDF
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
            <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm font-medium">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Usuário ou ação..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Ação</Label>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="CREATE">Criar</SelectItem>
                    <SelectItem value="UPDATE">Atualizar</SelectItem>
                    <SelectItem value="DELETE">Excluir</SelectItem>
                    <SelectItem value="LOGIN">Login</SelectItem>
                    <SelectItem value="LOGOUT">Logout</SelectItem>
                    <SelectItem value="APPROVE">Aprovar</SelectItem>
                    <SelectItem value="REJECT">Rejeitar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Entidade</Label>
                <Select value={entityFilter} onValueChange={setEntityFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="time_entry">Registro de Ponto</SelectItem>
                    <SelectItem value="justification">Justificativa</SelectItem>
                    <SelectItem value="profile">Perfil</SelectItem>
                    <SelectItem value="integration">Integração</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Período</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Últimos 7 dias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="week">Últimos 7 dias</SelectItem>
                    <SelectItem value="month">Último mês</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Audit Log Table */}
          <Card>
            <CardHeader>
              <CardTitle>Log de Auditoria ({filteredLogs.length} registros)</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Carregando logs de auditoria...</p>
                </div>
              ) : filteredLogs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Entidade</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(log.created_at).toLocaleString('pt-BR')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {log.profiles?.full_name || 'Sistema'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getActionBadge(log.action_type)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getEntityIcon(log.entity_type)}
                            <span>{getEntityName(log.entity_type)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {log.ip_address || 'N/A'}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedLog(log)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Detalhes do Log de Auditoria</DialogTitle>
                              </DialogHeader>
                              {selectedLog && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-sm font-medium">Usuário</Label>
                                      <p className="text-sm">{selectedLog.profiles?.full_name || 'Sistema'}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Data/Hora</Label>
                                      <p className="text-sm">
                                        {new Date(selectedLog.created_at).toLocaleString('pt-BR')}
                                      </p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Ação</Label>
                                      <p className="text-sm">{selectedLog.action_type}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Entidade</Label>
                                      <p className="text-sm">{getEntityName(selectedLog.entity_type)}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">IP</Label>
                                      <p className="text-sm">{selectedLog.ip_address || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">User Agent</Label>
                                      <p className="text-sm text-muted-foreground">
                                        {selectedLog.user_agent || 'N/A'}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <Label className="text-sm font-medium">Detalhes</Label>
                                    <pre className="text-xs bg-muted p-3 rounded-lg mt-2 overflow-auto">
                                      {JSON.stringify(selectedLog.details, null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhum log encontrado</h3>
                  <p className="text-muted-foreground">
                    Não há registros de auditoria com os filtros selecionados.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
    </AdminLayout>
  );
};

export default Audit;