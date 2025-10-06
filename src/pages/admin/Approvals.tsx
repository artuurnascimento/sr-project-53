import { useState, useEffect } from 'react';
import { Check, X, Eye, Filter, Clock, User, Calendar, FileText, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import AdminLayout from '@/components/layout/AdminLayout';
import { useJustifications, useUpdateJustification } from '@/hooks/useJustifications';
import { useAuth } from '@/contexts/AuthContext';

const formatDateTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleString('pt-BR');
};

const Approvals = () => {
  const { profile } = useAuth();
  const { data: justifications, isLoading } = useJustifications();
  const updateJustification = useUpdateJustification();
  
  const [selectedJustification, setSelectedJustification] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [attachmentUrls, setAttachmentUrls] = useState<Record<string, string>>({});
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Generate signed URLs for attachments when selected justification changes
  useEffect(() => {
    const loadAttachmentUrls = async () => {
      if (!selectedJustification?.attachments?.length) return;
      
      const urls: Record<string, string> = {};
      for (const attachment of selectedJustification.attachments) {
        if (attachment.path) {
          try {
            const { data } = await supabase.storage
              .from('justification-attachments')
              .createSignedUrl(attachment.path, 60 * 60); // 1 hour
            
            if (data?.signedUrl) {
              urls[attachment.path] = data.signedUrl;
            }
          } catch (error) {
            console.error('Error loading attachment URL:', error);
          }
        }
      }
      setAttachmentUrls(urls);
    };

    loadAttachmentUrls();
  }, [selectedJustification]);

  const getTypeLabel = (type: string) => {
    const labels = {
      'absence': 'Falta',
      'overtime': 'Hora Extra',
      'vacation': 'Férias',
      'expense': 'Despesa',
      'other': 'Outro'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'pending': 'secondary',
      'approved': 'default',
      'rejected': 'destructive',
      'in_review': 'outline'
    } as const;
    
    const labels = {
      'pending': 'Pendente',
      'approved': 'Aprovado',
      'rejected': 'Rejeitado',
      'in_review': 'Em Análise'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const handleApprove = async (id: string) => {
    if (!profile) return;
    
    await updateJustification.mutateAsync({
      id,
      updates: {
        status: 'approved',
        approved_by: profile.id,
        approved_at: new Date().toISOString(),
      }
    });
  };

  const handleReject = async (id: string, reason: string) => {
    if (!profile || !reason.trim()) return;
    
    await updateJustification.mutateAsync({
      id,
      updates: {
        status: 'rejected',
        approved_by: profile.id,
        approved_at: new Date().toISOString(),
        rejection_reason: reason,
      }
    });
    
    setRejectionReason('');
    setIsRejectDialogOpen(false);
    setSelectedJustification(null);
  };

  const filteredJustifications = justifications?.filter(justification => {
    const statusMatch = filterStatus === 'all' || justification.status === filterStatus;
    const typeMatch = filterType === 'all' || justification.request_type === filterType;
    const searchMatch = !searchTerm || 
      justification.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      justification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      justification.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return statusMatch && typeMatch && searchMatch;
  }) || [];

  return (
    <AdminLayout>
        <div className="space-y-4 md:space-y-6 p-4 md:p-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl md:text-3xl font-bold">Aprovações</h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Gerencie justificativas e solicitações dos colaboradores
              </p>
            </div>
            <Badge variant="secondary" className="text-xs md:text-sm">
              {filteredJustifications.filter(j => j.status === 'pending').length} pendentes
            </Badge>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <Filter className="h-4 w-4 md:h-5 md:w-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              <div>
                <Label className="text-xs md:text-sm font-medium">Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                    <SelectItem value="approved">Aprovados</SelectItem>
                    <SelectItem value="rejected">Rejeitados</SelectItem>
                    <SelectItem value="in_review">Em Análise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs md:text-sm font-medium">Tipo</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="absence">Faltas</SelectItem>
                    <SelectItem value="overtime">Horas Extras</SelectItem>
                    <SelectItem value="vacation">Férias</SelectItem>
                    <SelectItem value="expense">Despesas</SelectItem>
                    <SelectItem value="other">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs md:text-sm font-medium">Buscar</Label>
                <Input 
                  placeholder="Nome do colaborador..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Approvals List */}
          {isLoading ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">Carregando aprovações...</p>
              </CardContent>
            </Card>
          ) : filteredJustifications.length > 0 ? (
            <div className="space-y-4">
              {filteredJustifications.map((justification) => (
                <Card key={justification.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">
                              {justification.profiles?.full_name || 'Usuário'}
                            </CardTitle>
                            <Badge variant="outline">
                              {justification.profiles?.department || 'N/A'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {getTypeLabel(justification.request_type)} - {' '}
                            {new Date(justification.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(justification.status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-1">{justification.title}</h4>
                        <p className="text-muted-foreground text-sm">{justification.description}</p>
                      </div>

                      {(justification.start_date || justification.end_date) && (
                        <div className="flex gap-4 text-sm">
                          {justification.start_date && (
                            <div>
                              <span className="text-muted-foreground">Data início: </span>
                              <span className="font-medium">
                                {new Date(justification.start_date).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          )}
                          {justification.end_date && (
                            <div>
                              <span className="text-muted-foreground">Data fim: </span>
                              <span className="font-medium">
                                {new Date(justification.end_date).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {justification.amount && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Valor: </span>
                          <span className="font-medium">
                            R$ {justification.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}

                      {justification.attachments?.length > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {justification.attachments.length} anexo(s)
                          </span>
                        </div>
                      )}

                      {justification.rejection_reason && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <h5 className="font-medium text-red-800 mb-1">Motivo da Rejeição:</h5>
                          <p className="text-red-700 text-sm">{justification.rejection_reason}</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          Criado em {formatDateTime(justification.created_at)}
                        </div>
                        
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setSelectedJustification(justification)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Detalhes
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>
                                  {justification.profiles?.full_name} - {getTypeLabel(justification.request_type)}
                                </DialogTitle>
                              </DialogHeader>
                              {selectedJustification && (
                                <div className="space-y-4">
                                  <div>
                                    <h4 className="font-medium mb-2">Detalhes da Solicitação:</h4>
                                    <div className="bg-muted p-4 rounded-lg">
                                      <h5 className="font-medium mb-2">{selectedJustification.title}</h5>
                                      <p className="text-sm text-muted-foreground">
                                        {selectedJustification.description}
                                      </p>
                                    </div>
                                  </div>

                                  {selectedJustification.attachments?.length > 0 && (
                                    <div>
                                      <h4 className="font-medium mb-2">Anexos:</h4>
                                      <div className="grid grid-cols-2 gap-4">
                                        {selectedJustification.attachments.map((attachment: any, idx: number) => (
                                          <div key={idx} className="border rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
                                            {attachmentUrls[attachment.path] && (
                                              <img
                                                src={attachmentUrls[attachment.path]}
                                                alt={attachment.name}
                                                className="w-full h-48 object-cover"
                                                onClick={() => setSelectedImage(attachmentUrls[attachment.path])}
                                                onError={(e) => {
                                                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                                                }}
                                              />
                                            )}
                                            <div className="p-2 bg-muted">
                                              <p className="text-xs truncate">{attachment.name}</p>
                                              <p className="text-xs text-muted-foreground">Clique para ampliar</p>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="text-muted-foreground">Colaborador: </span>
                                      <span className="font-medium">
                                        {selectedJustification.profiles?.full_name}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Departamento: </span>
                                      <span className="font-medium">
                                        {selectedJustification.profiles?.department || 'N/A'}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Tipo: </span>
                                      <span className="font-medium">
                                        {getTypeLabel(selectedJustification.request_type)}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Status: </span>
                                      {getStatusBadge(selectedJustification.status)}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          
                          {justification.status === 'pending' && (
                            <>
                              <Button 
                                size="sm" 
                                onClick={() => handleApprove(justification.id)}
                                disabled={updateJustification.isPending}
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Aprovar
                              </Button>
                              <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                                <DialogTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="destructive"
                                    onClick={() => setSelectedJustification(justification)}
                                  >
                                    <X className="h-4 w-4 mr-2" />
                                    Rejeitar
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Rejeitar Solicitação</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label>Motivo da rejeição:</Label>
                                      <Textarea 
                                        placeholder="Descreva o motivo da rejeição..."
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        required
                                      />
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                      <Button 
                                        variant="outline"
                                        onClick={() => {
                                          setIsRejectDialogOpen(false);
                                          setRejectionReason('');
                                        }}
                                      >
                                        Cancelar
                                      </Button>
                                      <Button 
                                        variant="destructive" 
                                        onClick={() => handleReject(selectedJustification?.id, rejectionReason)}
                                        disabled={!rejectionReason.trim() || updateJustification.isPending}
                                      >
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
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhuma solicitação encontrada</h3>
                <p className="text-muted-foreground">
                  {filterStatus === 'pending' 
                    ? 'Não há solicitações pendentes de aprovação.'
                    : 'Não há solicitações com os filtros selecionados.'
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Image Viewer Dialog */}
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Visualizar Imagem</DialogTitle>
            </DialogHeader>
            {selectedImage && (
              <div className="flex items-center justify-center bg-muted rounded-lg p-4">
                <img
                  src={selectedImage}
                  alt="Anexo"
                  className="max-w-full max-h-[70vh] object-contain"
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
    </AdminLayout>
  );
};

export default Approvals;