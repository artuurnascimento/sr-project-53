import { useState, useEffect } from 'react';
import { Eye, CheckCircle, X, Clock, Search, Filter, Calendar, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
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
  const [hasPrivilegedAccess, setHasPrivilegedAccess] = useState(false);

  useEffect(() => {
    loadAuditRecords();

    const channel = supabase
      .channel('facial-audit-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'facial_recognition_audit' },
        () => loadAuditRecords()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    filterRecords();
  }, [auditRecords, searchTerm, statusFilter, dateFilter]);

  const loadAuditRecords = async () => {
    try {
      setLoading(true);

      // Get current user profile and role
      const { data: { user } } = await supabase.auth.getUser();
      let currentProfile: { id: string; role?: string } | null = null;
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, role')
          .eq('user_id', user.id)
          .maybeSingle();
        if (profileData) currentProfile = profileData as any;
      }

      const isPrivileged = currentProfile && (currentProfile.role === 'admin' || currentProfile.role === 'manager');
      setHasPrivilegedAccess(!!isPrivileged);

      // 1) Load audits depending on role
      let query = supabase
        .from('facial_recognition_audit')
        .select('*')
        .order('created_at', { ascending: false });

      if (!isPrivileged && currentProfile?.id) {
        query = query.eq('profile_id', currentProfile.id);
      }

      const { data: audits, error: auditError } = await query;
      if (auditError) throw auditError;

      const records = (audits as any[]) ?? [];

      // 2) Build profile map for display
      const profileIds = Array.from(new Set(records.map(r => r.profile_id).filter(Boolean)));
      let profileMap: Record<string, { full_name: string; email: string }> = {};
      if (profileIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', profileIds as string[]);
        if (!profilesError && profilesData) {
          profileMap = profilesData.reduce((acc: any, p: any) => {
            acc[p.id] = { full_name: p.full_name, email: p.email };
            return acc;
          }, {});
        }
      }

      // 3) Sign image URLs and attach profile info
      const withSignedUrls = await Promise.all(
        records.map(async (r) => {
          // Attach profile info
          r.profiles = r.profile_id ? profileMap[r.profile_id] ?? null : null;
          
          // Sign image URL if it exists and is not placeholder
          if (r.attempt_image_url && r.attempt_image_url !== 'no-image') {
            try {
              let key = r.attempt_image_url;
              
              // Extract key from URL if needed
              if (key.startsWith('http')) {
                const marker = '/facial-audit/';
                const idx = key.indexOf(marker);
                if (idx !== -1) {
                  key = key.substring(idx + marker.length);
                }
              }
              
              // Clean prefix
              if (key.startsWith('facial-audit/')) {
                key = key.replace('facial-audit/', '');
              }
              
              console.log('🔐 Signing image for audit:', r.id, 'key:', key);
              
              const { data: signed, error: signError } = await supabase.storage
                .from('facial-audit')
                .createSignedUrl(key, 3600);
              
              if (signError) {
                console.warn('⚠️ Sign error for', r.id, ':', signError.message);
              } else if (signed?.signedUrl) {
                r.attempt_image_url = signed.signedUrl;
                console.log('✅ Image signed successfully');
              }
            } catch (e) {
              console.warn('⚠️ Could not sign image for audit', r.id, e);
            }
          }
          
          return r;
        })
      );

      setAuditRecords(withSignedUrls);
    } catch (error: any) {
      console.error('Error loading audit records:', error?.message || error);
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
      <div className="space-y-4 lg:space-y-6">
        {/* Header - Mobile otimizado */}
        <div className="lg:flex lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Auditoria Facial</h1>
            <p className="text-sm lg:text-base text-muted-foreground mt-1">
              Monitore e aprove tentativas de reconhecimento facial
            </p>
          </div>
        </div>

        {!hasPrivilegedAccess && (
          <Alert className="mb-4">
            <AlertDescription>
              Você está vendo apenas seus próprios registros. Para ver todos, acesse com um usuário administrador ou gerente.
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards - Mobile: vertical stack | Desktop: horizontal grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 lg:gap-4">
          {/* Total Card */}
          <Card className="bg-white shadow-sm border border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Eye className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{auditRecords.length}</p>
                    <p className="text-sm text-slate-500">Total</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pendentes Card */}
          <Card className="bg-white shadow-sm border border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">
                      {auditRecords.filter(r => r.status === 'pending').length}
                    </p>
                    <p className="text-sm text-slate-500">Pendentes</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Aprovados Card */}
          <Card className="bg-white shadow-sm border border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">
                      {auditRecords.filter(r => r.status === 'approved').length}
                    </p>
                    <p className="text-sm text-slate-500">Aprovados</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rejeitados Card */}
          <Card className="bg-white shadow-sm border border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <X className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">
                      {auditRecords.filter(r => r.status === 'rejected').length}
                    </p>
                    <p className="text-sm text-slate-500">Rejeitados</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters Card */}
        <Card className="bg-white shadow-sm border border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Filter className="h-5 w-5 text-slate-600" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Nome, email ou ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 rounded-xl border-slate-300 focus:border-primary"
                />
              </div>
            </div>

            {/* Status Select */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-11 rounded-xl border-slate-300">
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

            {/* Date Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Data</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="pl-10 h-11 rounded-xl border-slate-300 focus:border-primary"
                  placeholder="dd/mm/aaaa"
                />
              </div>
            </div>

            {/* Update Button - Mobile only */}
            <Button 
              onClick={loadAuditRecords} 
              className="w-full h-11 rounded-xl bg-primary hover:bg-primary-hover lg:hidden"
            >
              <Filter className="h-4 w-4 mr-2" />
              Atualizar Resultados
            </Button>
          </CardContent>
        </Card>

        {/* Records List/Table */}
        <Card className="bg-white shadow-sm border border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">
              Registros de Auditoria ({filteredRecords.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredRecords.length === 0 ? (
              <Alert>
                <AlertDescription>
                  Nenhum registro encontrado com os filtros aplicados.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {/* Mobile Cards - visible only on mobile */}
                <div className="lg:hidden space-y-3">
                  {filteredRecords.map((record) => (
                    <Card key={record.id} className="bg-white border border-slate-200 shadow-sm">
                      <CardContent className="p-4">
                        {/* Header with user info and status */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-slate-900 truncate">
                              {record.profiles?.full_name || 'Não identificado'}
                            </div>
                            <div className="text-xs text-slate-500 truncate">
                              {record.profiles?.email || ''}
                            </div>
                          </div>
                          <div className="flex-shrink-0 ml-2">
                            {getStatusBadge(record.status)}
                          </div>
                        </div>

                        {/* Date/Time */}
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                          <Clock className="h-3 w-3" />
                          {new Date(record.created_at).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>

                        {/* Metrics */}
                        <div className="grid grid-cols-2 gap-3 mb-3 pb-3 border-b border-slate-100">
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Confiança</p>
                            {getConfidenceBadge(record.confidence_score)}
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Prova de Vida</p>
                            <Badge 
                              variant={record.liveness_passed ? "default" : "destructive"} 
                              className="text-xs"
                            >
                              {record.liveness_passed ? 'Passou' : 'Falhou'}
                            </Badge>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 h-9 rounded-lg text-xs"
                                onClick={() => setSelectedRecord(record)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Ver Detalhes
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-[95vw] md:max-w-2xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Detalhes da Tentativa</DialogTitle>
                                <DialogDescription>Visualize detalhes e evidências desta tentativa de reconhecimento.</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-medium mb-2 text-sm">Imagem Capturada</h4>
                                    {record.attempt_image_url && record.attempt_image_url !== 'no-image' ? (
                                      <div className="space-y-2">
                                        <img 
                                          src={record.attempt_image_url} 
                                          alt="Tentativa facial"
                                          className="w-full rounded-lg border max-h-64 object-contain"
                                          onLoad={() => console.log('✅ Image loaded successfully for:', record.id)}
                                          onError={(e) => {
                                            console.error('❌ Failed to load image for:', record.id);
                                            console.error('Image URL:', record.attempt_image_url);
                                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect fill="%23f0f0f0" width="300" height="200"/%3E%3Ctext fill="%23999" x="50%" y="50%" text-anchor="middle" dy=".3em"%3EErro ao carregar%3C/text%3E%3C/svg%3E';
                                          }}
                                        />
                                        <p className="text-xs text-muted-foreground break-all hidden md:block">
                                          {record.attempt_image_url.substring(0, 60)}...
                                        </p>
                                      </div>
                                    ) : (
                                      <div className="w-full h-48 bg-slate-100 rounded-lg border flex items-center justify-center text-slate-400">
                                        <p className="text-sm">Imagem não disponível</p>
                                      </div>
                                    )}
                                  </div>
                                  <div className="space-y-3">
                                    <div>
                                      <label className="text-sm font-medium">Resultado</label>
                                      <pre className="text-xs bg-slate-100 p-2 rounded-lg mt-1 overflow-auto max-h-32">
                                        {JSON.stringify(record.recognition_result, null, 2)}
                                      </pre>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Confiança</label>
                                      <p className="text-sm">{record.confidence_score ? 
                                        `${(record.confidence_score * 100).toFixed(2)}%` : 
                                        'N/A'
                                      }</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Prova de Vida</label>
                                      <p className="text-sm">{record.liveness_passed ? 'Passou' : 'Falhou'}</p>
                                    </div>
                                  </div>
                                </div>
                                {record.status === 'pending' && (
                                  <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                                    <Button
                                      onClick={() => updateAuditStatus(record.id, 'approved')}
                                      className="flex-1 h-10 rounded-lg"
                                      size="sm"
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Aprovar
                                    </Button>
                                    <Button
                                      onClick={() => updateAuditStatus(record.id, 'rejected')}
                                      variant="destructive"
                                      className="flex-1 h-10 rounded-lg"
                                      size="sm"
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
                                className="h-9 rounded-lg bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-3 w-3" />
                              </Button>
                              <Button
                                onClick={() => updateAuditStatus(record.id, 'rejected')}
                                size="sm"
                                variant="destructive"
                                className="h-9 rounded-lg"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Desktop Table - visible only on desktop */}
                <div className="hidden lg:block overflow-x-auto">
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
                                    <DialogDescription>Visualize detalhes e evidências desta tentativa de reconhecimento.</DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <h4 className="font-medium mb-2">Imagem Capturada</h4>
                                        {record.attempt_image_url && record.attempt_image_url !== 'no-image' ? (
                                          <div className="space-y-2">
                                            <img 
                                              src={record.attempt_image_url} 
                                              alt="Tentativa facial"
                                              className="w-full rounded border"
                                              onLoad={() => console.log('✅ Image loaded successfully for:', record.id)}
                                              onError={(e) => {
                                                console.error('❌ Failed to load image for:', record.id);
                                                console.error('Image URL:', record.attempt_image_url);
                                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect fill="%23f0f0f0" width="300" height="200"/%3E%3Ctext fill="%23999" x="50%" y="50%" text-anchor="middle" dy=".3em"%3EErro ao carregar%3C/text%3E%3C/svg%3E';
                                              }}
                                            />
                                            <p className="text-xs text-muted-foreground break-all">
                                              {record.attempt_image_url.substring(0, 80)}...
                                            </p>
                                          </div>
                                        ) : (
                                          <div className="w-full h-48 bg-slate-100 rounded border flex items-center justify-center text-slate-400">
                                            <p>Imagem não disponível</p>
                                          </div>
                                        )}
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
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default FacialAudit;