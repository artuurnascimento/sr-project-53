import { useState, useEffect } from 'react';
import { Eye, CheckCircle, X, Clock, Search, Filter, Calendar, ChevronRight, Menu, Bell, User as UserIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';
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
  const [selectedKPI, setSelectedKPI] = useState<string | null>(null);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

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
    updateActiveFiltersCount();
  }, [auditRecords, searchTerm, statusFilter, dateFilter]);

  const updateActiveFiltersCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (statusFilter !== 'all') count++;
    if (dateFilter) count++;
    setActiveFiltersCount(count);
  };

  const loadAuditRecords = async () => {
    try {
      setLoading(true);

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

      const withSignedUrls = await Promise.all(
        records.map(async (r) => {
          r.profiles = r.profile_id ? profileMap[r.profile_id] ?? null : null;
          
          if (r.attempt_image_url && r.attempt_image_url !== 'no-image') {
            try {
              let key = r.attempt_image_url;
              
              if (key.startsWith('http')) {
                const marker = '/facial-audit/';
                const idx = key.indexOf(marker);
                if (idx !== -1) {
                  key = key.substring(idx + marker.length);
                }
              }
              
              if (key.startsWith('facial-audit/')) {
                key = key.replace('facial-audit/', '');
              }
              
              const { data: signed, error: signError } = await supabase.storage
                .from('facial-audit')
                .createSignedUrl(key, 3600);
              
              if (!signError && signed?.signedUrl) {
                r.attempt_image_url = signed.signedUrl;
              }
            } catch (e) {
              console.warn('Could not sign image for audit', r.id, e);
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

    if (searchTerm) {
      filtered = filtered.filter(record => 
        record.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(record => record.status === statusFilter);
    }

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

  const handleKPIClick = (filterType: string) => {
    if (selectedKPI === filterType) {
      setSelectedKPI(null);
      setStatusFilter('all');
    } else {
      setSelectedKPI(filterType);
      setStatusFilter(filterType === 'total' ? 'all' : filterType);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateFilter('');
    setSelectedKPI(null);
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Aprovado' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejeitado' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendente' }
    };
    const config = configs[status as keyof typeof configs] || configs.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getConfidenceBadge = (score?: number) => {
    if (!score) return null;
    
    const percentage = score * 100;
    if (percentage >= 95) return <Badge className="bg-green-100 text-green-800 text-xs">Muito Alta</Badge>;
    if (percentage >= 85) return <Badge className="bg-blue-100 text-blue-800 text-xs">Alta</Badge>;
    if (percentage >= 75) return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Média</Badge>;
    return <Badge variant="destructive" className="text-xs">Baixa</Badge>;
  };

  // Loading State
  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-[#F9FAFB]">
          {/* Mobile Loading */}
          <div className="lg:hidden">
            <div className="p-4 space-y-4">
              {/* Skeleton KPIs */}
              <Card className="rounded-xl">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="h-20 bg-slate-200 rounded-lg animate-pulse" />
                    ))}
                  </div>
                </CardContent>
              </Card>
              {/* Skeleton Cards */}
              {[1,2,3].map(i => (
                <div key={i} className="h-32 bg-white rounded-xl border animate-pulse" />
              ))}
            </div>
          </div>
          
          {/* Desktop Loading */}
          <div className="hidden lg:flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Carregando registros de auditoria...</p>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#F9FAFB]">
        {/* ========== MOBILE LAYOUT ========== */}
        <div className="lg:hidden">
          {/* Barra de Filtros Sticky */}
          <div className="sticky top-0 z-40 bg-white border-b border-[#E5E7EB] shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <div className="p-4 space-y-3">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
                <Input
                  placeholder="Nome, email ou ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 rounded-xl border-[#D1D5DB] focus:border-[#0A7C66] text-sm"
                  aria-label="Buscar por nome, email ou ID"
                />
              </div>

              {/* Date & Clear */}
              <div className="flex gap-2">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="flex-1 h-11 rounded-xl border-[#D1D5DB] text-sm justify-between"
                      aria-label="Selecionar período de data"
                    >
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[#6B7280]" />
                        {dateFilter ? new Date(dateFilter).toLocaleDateString('pt-BR') : 'Data • Hoje'}
                      </span>
                      <ChevronRight className="h-4 w-4 text-[#6B7280]" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-[60vh] rounded-t-2xl">
                    <SheetHeader>
                      <SheetTitle>Selecionar Período</SheetTitle>
                    </SheetHeader>
                    <div className="space-y-4 mt-6">
                      <Button 
                        variant="outline" 
                        className="w-full h-12 justify-start"
                        onClick={() => {
                          setDateFilter(new Date().toISOString().split('T')[0]);
                        }}
                      >
                        Hoje
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full h-12 justify-start"
                        onClick={() => {
                          const date = new Date();
                          date.setDate(date.getDate() - 7);
                          setDateFilter(date.toISOString().split('T')[0]);
                        }}
                      >
                        Últimos 7 dias
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full h-12 justify-start"
                        onClick={() => {
                          const date = new Date();
                          date.setDate(date.getDate() - 30);
                          setDateFilter(date.toISOString().split('T')[0]);
                        }}
                      >
                        Últimos 30 dias
                      </Button>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Data específica</label>
                        <Input
                          type="date"
                          value={dateFilter}
                          onChange={(e) => setDateFilter(e.target.value)}
                          className="h-12"
                        />
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
                
                {activeFiltersCount > 0 && (
                  <Button 
                    variant="outline" 
                    onClick={clearFilters}
                    className="h-11 rounded-xl border-[#D1D5DB] text-sm px-4"
                    aria-label={`Limpar ${activeFiltersCount} filtros ativos`}
                  >
                    Limpar ({activeFiltersCount})
                  </Button>
                )}
              </div>
            </div>
          </div>

          {!hasPrivilegedAccess && (
            <div className="p-4">
              <Alert className="rounded-xl border-blue-200 bg-blue-50">
                <AlertDescription className="text-sm text-blue-800">
                  Você está vendo apenas seus próprios registros.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* KPIs Card */}
            <Card className="rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border-[#E5E7EB]">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-3" role="region" aria-label="Estatísticas de auditoria">
                  {/* Total */}
                  <button
                    onClick={() => handleKPIClick('all')}
                    className={`
                      flex items-center gap-3 p-3 rounded-xl transition-all min-h-[44px]
                      ${selectedKPI === 'all' 
                        ? 'border-2 border-[#0A7C66] bg-[#0A7C66]/5' 
                        : 'border border-[#E5E7EB] bg-white'
                      }
                    `}
                    aria-label="Filtrar por todos os registros"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Eye className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-2xl font-bold text-[#111827] leading-none">{auditRecords.length}</p>
                      <p className="text-xs text-[#6B7280] mt-1">Total</p>
                    </div>
                  </button>

                  {/* Pendentes */}
                  <button
                    onClick={() => handleKPIClick('pending')}
                    className={`
                      flex items-center gap-3 p-3 rounded-xl transition-all min-h-[44px]
                      ${selectedKPI === 'pending' 
                        ? 'border-2 border-[#F59E0B] bg-[#F59E0B]/5' 
                        : 'border border-[#E5E7EB] bg-white'
                      }
                    `}
                    aria-label="Filtrar por registros pendentes"
                  >
                    <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center flex-shrink-0">
                      <Clock className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-2xl font-bold text-[#111827] leading-none">
                        {auditRecords.filter(r => r.status === 'pending').length}
                      </p>
                      <p className="text-xs text-[#6B7280] mt-1">Pendentes</p>
                    </div>
                  </button>

                  {/* Aprovados */}
                  <button
                    onClick={() => handleKPIClick('approved')}
                    className={`
                      flex items-center gap-3 p-3 rounded-xl transition-all min-h-[44px]
                      ${selectedKPI === 'approved' 
                        ? 'border-2 border-[#10B981] bg-[#10B981]/5' 
                        : 'border border-[#E5E7EB] bg-white'
                      }
                    `}
                    aria-label="Filtrar por registros aprovados"
                  >
                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-2xl font-bold text-[#111827] leading-none">
                        {auditRecords.filter(r => r.status === 'approved').length}
                      </p>
                      <p className="text-xs text-[#6B7280] mt-1">Aprovados</p>
                    </div>
                  </button>

                  {/* Rejeitados */}
                  <button
                    onClick={() => handleKPIClick('rejected')}
                    className={`
                      flex items-center gap-3 p-3 rounded-xl transition-all min-h-[44px]
                      ${selectedKPI === 'rejected' 
                        ? 'border-2 border-[#EF4444] bg-[#EF4444]/5' 
                        : 'border border-[#E5E7EB] bg-white'
                      }
                    `}
                    aria-label="Filtrar por registros rejeitados"
                  >
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                      <X className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-2xl font-bold text-[#111827] leading-none">
                        {auditRecords.filter(r => r.status === 'rejected').length}
                      </p>
                      <p className="text-xs text-[#6B7280] mt-1">Rejeitados</p>
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Records List */}
            <div role="list" aria-label="Registros de auditoria">
              {filteredRecords.length === 0 ? (
                <Card className="rounded-xl shadow-sm border-[#E5E7EB]">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-[#F3F4F6] rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="h-8 w-8 text-[#9CA3AF]" />
                    </div>
                    <h3 className="text-base font-semibold text-[#111827] mb-2">
                      Nenhum registro encontrado
                    </h3>
                    <p className="text-sm text-[#6B7280] mb-4">
                      Ajuste os filtros ou aguarde novos registros
                    </p>
                    {activeFiltersCount > 0 && (
                      <Button 
                        variant="outline" 
                        onClick={clearFilters}
                        className="h-11 rounded-xl"
                      >
                        Limpar Filtros
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {filteredRecords.map((record) => (
                    <Card key={record.id} className="rounded-xl shadow-sm border-[#E5E7EB] bg-white">
                      <CardContent className="p-4">
                        {/* Header */}
                        <div className="flex items-start gap-3 mb-3">
                          {record.attempt_image_url && record.attempt_image_url !== 'no-image' ? (
                            <img 
                              src={record.attempt_image_url}
                              alt="Foto facial"
                              className="w-12 h-12 rounded-full object-cover border-2 border-[#E5E7EB] flex-shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48"%3E%3Crect fill="%23E5E7EB" width="48" height="48" rx="24"/%3E%3Ctext fill="%239CA3AF" x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="20"%3E?%3C/text%3E%3C/svg%3E';
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-[#F3F4F6] flex items-center justify-center flex-shrink-0">
                              <UserIcon className="h-6 w-6 text-[#9CA3AF]" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-[#111827] truncate">
                              {record.profiles?.full_name || 'Não identificado'}
                            </p>
                            <p className="text-xs text-[#6B7280] truncate">
                              {record.profiles?.email || 'Sem email'}
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            {getStatusBadge(record.status)}
                          </div>
                        </div>

                        {/* Date/Time */}
                        <div className="flex items-center gap-2 text-xs text-[#6B7280] mb-3">
                          <Clock className="h-3 w-3" />
                          {new Date(record.created_at).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>

                        {/* Metrics */}
                        <div className="grid grid-cols-2 gap-3 mb-3 pb-3 border-b border-[#F3F4F6]">
                          <div>
                            <p className="text-xs text-[#6B7280] mb-1">Confiança</p>
                            {record.confidence_score ? (
                              <div className="space-y-1">
                                <p className="text-sm font-semibold text-[#111827]">
                                  {(record.confidence_score * 100).toFixed(1)}%
                                </p>
                                <Progress 
                                  value={record.confidence_score * 100} 
                                  className="h-1.5"
                                />
                              </div>
                            ) : (
                              <p className="text-sm text-[#9CA3AF]">N/A</p>
                            )}
                          </div>
                          <div>
                            <p className="text-xs text-[#6B7280] mb-1">Prova de Vida</p>
                            <Badge 
                              variant={record.liveness_passed ? "default" : "destructive"} 
                              className="text-xs"
                            >
                              {record.liveness_passed ? 'Passou' : 'Falhou'}
                            </Badge>
                          </div>
                        </div>

                        {/* Actions */}
                        {record.status === 'pending' ? (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => updateAuditStatus(record.id, 'approved')}
                              className="flex-1 h-11 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white shadow-sm"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Aprovar
                            </Button>
                            <Button
                              onClick={() => updateAuditStatus(record.id, 'rejected')}
                              variant="destructive"
                              className="flex-1 h-11 rounded-xl shadow-sm"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Rejeitar
                            </Button>
                          </div>
                        ) : (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full h-11 rounded-xl border-[#D1D5DB] text-sm"
                                onClick={() => setSelectedRecord(record)}
                              >
                                Ver Detalhes
                                <ChevronRight className="h-4 w-4 ml-2" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-[95vw] max-h-[80vh] overflow-y-auto rounded-2xl">
                              <DialogHeader>
                                <DialogTitle className="text-lg">Detalhes da Tentativa</DialogTitle>
                                <DialogDescription className="text-sm">
                                  Visualize evidências e informações completas
                                </DialogDescription>
                              </DialogHeader>
                              {selectedRecord && (
                                <div className="space-y-4">
                                  {/* Image */}
                                  {selectedRecord.attempt_image_url && selectedRecord.attempt_image_url !== 'no-image' && (
                                    <div className="rounded-xl overflow-hidden border border-[#E5E7EB]">
                                      <img 
                                        src={selectedRecord.attempt_image_url}
                                        alt="Foto de reconhecimento"
                                        className="w-full aspect-video object-contain bg-[#F9FAFB]"
                                      />
                                    </div>
                                  )}

                                  {/* Info Grid */}
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 rounded-lg bg-[#F9FAFB]">
                                      <p className="text-xs text-[#6B7280] mb-1">Confiança</p>
                                      <p className="text-lg font-bold text-[#111827]">
                                        {selectedRecord.confidence_score 
                                          ? `${(selectedRecord.confidence_score * 100).toFixed(1)}%`
                                          : 'N/A'
                                        }
                                      </p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-[#F9FAFB]">
                                      <p className="text-xs text-[#6B7280] mb-1">Prova de Vida</p>
                                      <p className="text-lg font-bold text-[#111827]">
                                        {selectedRecord.liveness_passed ? '✓ Passou' : '✗ Falhou'}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Result JSON */}
                                  <details className="group">
                                    <summary className="cursor-pointer text-sm font-medium text-[#111827] mb-2">
                                      Resultado Técnico
                                    </summary>
                                    <pre className="text-xs bg-[#F9FAFB] p-3 rounded-lg overflow-auto max-h-32 border border-[#E5E7EB]">
                                      {JSON.stringify(selectedRecord.recognition_result, null, 2)}
                                    </pre>
                                  </details>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========== DESKTOP LAYOUT (Original) ========== */}
        <div className="hidden lg:block space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Auditoria Facial</h1>
            <p className="text-base text-muted-foreground mt-1">
              Monitore e aprove tentativas de reconhecimento facial
            </p>
          </div>

          {!hasPrivilegedAccess && (
            <Alert>
              <AlertDescription>
                Você está vendo apenas seus próprios registros. Para ver todos, acesse com um usuário administrador ou gerente.
              </AlertDescription>
            </Alert>
          )}

          {/* Desktop Stats Cards */}
          <div className="grid grid-cols-4 gap-4">
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

          {/* Desktop Filters */}
          <Card className="bg-white shadow-sm border border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Filter className="h-5 w-5 text-slate-600" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Data</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="pl-10 h-11 rounded-xl border-slate-300 focus:border-primary"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Desktop Table */}
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
                                    <DialogDescription>Visualize detalhes e evidências desta tentativa de reconhecimento.</DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <h4 className="font-medium mb-2">Imagem Capturada</h4>
                                        {record.attempt_image_url && record.attempt_image_url !== 'no-image' ? (
                                          <img 
                                            src={record.attempt_image_url} 
                                            alt="Tentativa facial"
                                            className="w-full rounded border"
                                            onError={(e) => {
                                              (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect fill="%23f0f0f0" width="300" height="200"/%3E%3Ctext fill="%23999" x="50%" y="50%" text-anchor="middle" dy=".3em"%3EErro ao carregar%3C/text%3E%3C/svg%3E';
                                            }}
                                          />
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
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default FacialAudit;