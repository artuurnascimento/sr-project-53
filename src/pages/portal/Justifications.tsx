import { useState } from 'react';
import { Plus, FileText, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import PortalLayout from '@/components/layout/PortalLayout';

const Justifications = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Mock data
  const justifications = [
    {
      id: 1,
      date: '2025-01-18',
      type: 'late_arrival',
      description: 'Trânsito intenso devido a acidente na BR-101',
      status: 'pending',
      createdAt: '2025-01-18T09:30:00',
      reviewedAt: null,
      reviewer: null
    },
    {
      id: 2,
      date: '2025-01-15',
      type: 'absence',
      description: 'Consulta médica de emergência',
      status: 'approved',
      createdAt: '2025-01-15T08:00:00',
      reviewedAt: '2025-01-16T10:00:00',
      reviewer: 'Maria Santos - RH'
    },
    {
      id: 3,
      date: '2025-01-10',
      type: 'early_departure',
      description: 'Problema familiar urgente',
      status: 'rejected',
      createdAt: '2025-01-10T14:30:00',
      reviewedAt: '2025-01-11T09:00:00',
      reviewer: 'João Silva - Gerente'
    }
  ];

  const getTypeLabel = (type: string) => {
    const labels = {
      'late_arrival': 'Atraso',
      'early_departure': 'Saída Antecipada',
      'absence': 'Falta',
      'missing_punch': 'Esquecimento de Bater Ponto',
      'other': 'Outros'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'pending': 'secondary',
      'approved': 'default',
      'rejected': 'destructive'
    } as const;
    
    const labels = {
      'pending': 'Pendente',
      'approved': 'Aprovado',
      'rejected': 'Rejeitado'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('pt-BR');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implementar envio de justificativa
    setIsDialogOpen(false);
  };

  return (
    <PortalLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Justificativas</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Justificativa
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Nova Justificativa</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="date">Data</Label>
                  <Input id="date" type="date" required />
                </div>
                <div>
                  <Label htmlFor="type">Tipo</Label>
                  <Select required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="late_arrival">Atraso</SelectItem>
                      <SelectItem value="early_departure">Saída Antecipada</SelectItem>
                      <SelectItem value="absence">Falta</SelectItem>
                      <SelectItem value="missing_punch">Esquecimento de Bater Ponto</SelectItem>
                      <SelectItem value="other">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Descreva o motivo da justificativa..."
                    required
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="attachment">Anexo (opcional)</Label>
                  <Input id="attachment" type="file" accept=".pdf,.jpg,.jpeg,.png" />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Enviar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Justifications List */}
        <div className="space-y-4">
          {justifications.map((justification) => (
            <Card key={justification.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-lg">
                        {getTypeLabel(justification.type)} - {formatDate(justification.date)}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Criado em {formatDateTime(justification.createdAt)}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(justification.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Descrição:</h4>
                    <p className="text-muted-foreground">{justification.description}</p>
                  </div>
                  
                  {justification.status !== 'pending' && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">
                          {justification.status === 'approved' ? 'Aprovado' : 'Rejeitado'} em {formatDateTime(justification.reviewedAt!)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Revisado por: {justification.reviewer}
                      </p>
                    </div>
                  )}
                  
                  {justification.status === 'pending' && (
                    <div className="flex items-center gap-2 text-orange-600">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">Aguardando análise do RH/Gestor</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {justifications.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma justificativa encontrada</h3>
              <p className="text-muted-foreground mb-4">
                Você ainda não possui justificativas cadastradas.
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Justificativa
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </PortalLayout>
  );
};

export default Justifications;