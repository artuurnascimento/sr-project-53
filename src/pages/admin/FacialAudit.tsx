import { useState, useEffect } from 'react';
import { Eye, CheckCircle, X, Clock, Search, Filter, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuditRecord {
  id: string;
  profile_id?: string;
  attempt_image_url: string;
  recognition_result: any;
  confidence_score?: number;
  liveness_passed: boolean;
  status: string;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  } | null;
}

const FacialAudit = () => {
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [selectedRecord, setSelectedRecord] = useState<AuditRecord | null>(null);

  useEffect(() => {
    loadAuditRecords();
  }, []);

  useEffect(() => {
    filterRecords();
  }, [auditRecords, searchTerm, statusFilter, dateFilter]);

  const loadAuditRecords = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('facial_recognition_audit')
        .select(`
          *,
          profiles (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      // Generate signed URLs for private bucket images
      const records = (data as any) || [];
      const marker = '/facial-audit/';
      const withSignedUrls = await Promise.all(records.map(async (r: any) => {
        try {
          if (r?.attempt_image_url) {
            const idx = r.attempt_image_url.indexOf(marker);
            if (idx !== -1) {
              const key = r.attempt_image_url.substring(idx + marker.length);
              const { data: signed } = await supabase
                .storage
                .from('facial-audit')
                .createSignedUrl(key, 60 * 60);
              if (signed?.signedUrl) {
                r.attempt_image_url = signed.signedUrl;
              }
            }
          }
        } catch {}
        return r;
      }));

      setAuditRecords(withSignedUrls);
    } catch (error) {
      console.error('Error loading audit records:', error);
      toast.error('Erro ao carregar registros de auditoria');
    } finally {
      setLoading(false);
    }
  };

  const filterRecords = () => {
    let filtered = auditRecords;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(record => 
        record.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(record => record.status === statusFilter);
    }

    // Filter by date
    if (dateFilter) {
      filtered = filtered.filter(record => 
        record.created_at.startsWith(dateFilter)
      );
    }

    setFilteredRecords(filtered);
  };

  const updateAuditStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('facial_recognition_audit')
        .update({ 
          status,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setAuditRecords(prev => 
        prev.map(record => 
          record.id === id ? { ...record, status } : record
        )
      );

      toast.success(`Registro ${status === 'approved' ? 'aprovado' : 'rejeitado'} com sucesso`);
    } catch (error) {
      console.error('Error updating audit status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeitado</Badge>;
      default:
        return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  const getConfidenceBadge = (score?: number) => {
    if (!score) return null;
    
    const percentage = score * 100;
    if (percentage >= 95) return <Badge className="bg-green-100 text-green-800">Muito Alta</Badge>;
    if (percentage >= 85) return <Badge className="bg-blue-100 text-blue-800">Alta</Badge>;
    if (percentage >= 75) return <Badge className="bg-yellow-100 text-yellow-800">Média</Badge>;
    return <Badge variant="destructive">Baixa</Badge>;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Carregando registros de auditoria...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Auditoria Facial</h1>
          <p className="text-muted-foreground">
            Monitore e aprove tentativas de reconhecimento facial
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Eye className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{auditRecords.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-bold">
                    {auditRecords.filter(r => r.status === 'pending').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Aprovados</p>
                  <p className="text-2xl font-bold">
                    {auditRecords.filter(r => r.status === 'approved').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <X className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Rejeitados</p>
                  <p className="text-2xl font-bold">
                    {auditRecords.filter(r => r.status === 'rejected').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Nome, email ou ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="approved">Aprovado</SelectItem>
                    <SelectItem value="rejected">Rejeitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Data</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Ações</label>
                <Button onClick={loadAuditRecords} variant="outline" className="w-full">
                  <Filter className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audit Table */}
        <Card>
          <CardHeader>
            <CardTitle>Registros de Auditoria ({filteredRecords.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredRecords.length === 0 ? (
              <Alert>
                <AlertDescription>
                  Nenhum registro encontrado com os filtros aplicados.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Confiança</TableHead>
                      <TableHead>Prova de Vida</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          {new Date(record.created_at).toLocaleDateString('pt-BR')}
                          <br />
                          <span className="text-xs text-muted-foreground">
                            {new Date(record.created_at).toLocaleTimeString('pt-BR')}
                          </span>
                        </TableCell>
                        <TableCell>
                          {record.profiles ? (
                            <div>
                              <p className="font-medium">{record.profiles.full_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {record.profiles.email}
                              </p>
                            </div>
                          ) : (
                            <Badge variant="outline">Não identificado</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {getConfidenceBadge(record.confidence_score)}
                          {record.confidence_score && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {(record.confidence_score * 100).toFixed(1)}%
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={record.liveness_passed ? "default" : "destructive"}>
                            {record.liveness_passed ? 'Passou' : 'Falhou'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(record.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedRecord(record)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Detalhes da Tentativa</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-medium mb-2">Imagem Capturada</h4>
                                      <img 
                                        src={record.attempt_image_url} 
                                        alt="Tentativa"
                                        className="w-full rounded border"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                                        }}
                                      />
                                    </div>
                                    <div className="space-y-3">
                                      <div>
                                        <label className="text-sm font-medium">Resultado</label>
                                        <pre className="text-xs bg-slate-100 p-2 rounded mt-1 overflow-auto">
                                          {JSON.stringify(record.recognition_result, null, 2)}
                                        </pre>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium">Confiança</label>
                                        <p>{record.confidence_score ? 
                                          `${(record.confidence_score * 100).toFixed(2)}%` : 
                                          'N/A'
                                        }</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium">Prova de Vida</label>
                                        <p>{record.liveness_passed ? 'Passou' : 'Falhou'}</p>
                                      </div>
                                    </div>
                                  </div>
                                  {record.status === 'pending' && (
                                    <div className="flex gap-2 pt-4 border-t">
                                      <Button
                                        onClick={() => updateAuditStatus(record.id, 'approved')}
                                        className="flex-1"
                                      >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Aprovar
                                      </Button>
                                      <Button
                                        onClick={() => updateAuditStatus(record.id, 'rejected')}
                                        variant="destructive"
                                        className="flex-1"
                                      >
                                        <X className="h-4 w-4 mr-2" />
                                        Rejeitar
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                            
                            {record.status === 'pending' && (
                              <>
                                <Button
                                  onClick={() => updateAuditStatus(record.id, 'approved')}
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  onClick={() => updateAuditStatus(record.id, 'rejected')}
                                  size="sm"
                                  variant="destructive"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default FacialAudit;