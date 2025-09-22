import { useState } from 'react';
import { Plus, Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PortalLayout from '@/components/layout/PortalLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useJustifications, useCreateJustification } from '@/hooks/useJustifications';

const Justifications = () => {
  const { profile } = useAuth();
  const { data: justifications, isLoading } = useJustifications(profile?.id);
  const createJustification = useCreateJustification();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    request_type: '',
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    amount: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    const payload = {
      employee_id: profile.id,
      request_type: formData.request_type as any,
      title: formData.title,
      description: formData.description,
      start_date: formData.start_date || undefined,
      end_date: formData.end_date || undefined,
      amount: formData.amount ? parseFloat(formData.amount) : undefined,
      attachments: [],
    };

    await createJustification.mutateAsync(payload);
    setIsDialogOpen(false);
    setFormData({
      request_type: '',
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      amount: '',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'in_review':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'in_review':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Aprovado';
      case 'rejected':
        return 'Rejeitado';
      case 'in_review':
        return 'Em análise';
      default:
        return 'Pendente';
    }
  };

  return (
    <PortalLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Justificativas</h1>
              <p className="text-muted-foreground">
                Gerencie suas solicitações e justificativas
              </p>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Justificativa
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Nova Justificativa</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="request_type">Tipo de Solicitação</Label>
                    <Select value={formData.request_type} onValueChange={(value) => setFormData({ ...formData, request_type: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="absence">Falta</SelectItem>
                        <SelectItem value="overtime">Hora Extra</SelectItem>
                        <SelectItem value="vacation">Férias</SelectItem>
                        <SelectItem value="expense">Despesa</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="title">Título</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={createJustification.isPending}>
                    {createJustification.isPending ? 'Criando...' : 'Criar Justificativa'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div>Carregando...</div>
            ) : justifications && justifications.length > 0 ? (
              justifications.map((justification) => (
                <Card key={justification.id}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{justification.title}</CardTitle>
                      <Badge className={`${getStatusColor(justification.status)} flex items-center gap-1`}>
                        {getStatusIcon(justification.status)}
                        {getStatusText(justification.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">{justification.description}</p>
                    <div className="text-sm text-muted-foreground">
                      Criado em: {new Date(justification.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">Nenhuma justificativa encontrada</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setIsDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar primeira justificativa
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
    </PortalLayout>
  );
};

export default Justifications;