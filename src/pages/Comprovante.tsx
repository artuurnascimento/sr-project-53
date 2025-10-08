import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Download, MapPin, Clock, User, Calendar } from "lucide-react";
import { toast } from "sonner";

interface ComprovanteData {
  id: string;
  employee_name: string;
  employee_email: string;
  punch_type: string;
  punch_time: string;
  location_address?: string;
  comprovante_pdf?: string;
}

export default function Comprovante() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const [loading, setLoading] = useState(true);
  const [comprovante, setComprovante] = useState<ComprovanteData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("ID do comprovante não fornecido");
      setLoading(false);
      return;
    }

    loadComprovante();
  }, [id]);

  const loadComprovante = async () => {
    try {
      setLoading(true);
      
      const { data, error: fetchError } = await supabase
        .from('v_time_entries_completo')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      
      if (!data) {
        setError("Comprovante não encontrado");
        return;
      }

      setComprovante(data);

      // Registrar acesso ao comprovante
      await supabase
        .from('logs_sistema')
        .insert({
          tipo: 'validacao_comprovante',
          status: 'success',
          referencia_id: id,
          mensagem: 'Comprovante validado via página pública',
          payload: { timestamp: new Date().toISOString() }
        });

    } catch (err: any) {
      console.error('Erro ao carregar comprovante:', err);
      setError(err.message || "Erro ao carregar comprovante");
      toast.error("Erro ao carregar comprovante");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (comprovante?.comprovante_pdf) {
      window.open(comprovante.comprovante_pdf, '_blank');
    } else {
      toast.error("PDF não disponível");
    }
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      'IN': 'Entrada',
      'OUT': 'Saída',
      'BREAK_OUT': 'Início de Pausa',
      'BREAK_IN': 'Fim de Pausa'
    };
    return labels[tipo] || tipo;
  };

  const getTipoBadgeVariant = (tipo: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'IN': 'default',
      'OUT': 'secondary',
      'BREAK_OUT': 'outline',
      'BREAK_IN': 'outline'
    };
    return variants[tipo] || 'default';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando comprovante...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !comprovante) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl border-destructive">
          <CardHeader className="text-center">
            <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <CardTitle className="text-2xl text-destructive">
              Comprovante Não Encontrado
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-6">
              {error || "O comprovante solicitado não foi encontrado em nossa base de dados."}
            </p>
            <Button onClick={() => window.location.href = '/'}>
              Voltar para a Página Inicial
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const dataHora = new Date(comprovante.punch_time);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center border-b">
          <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
          <CardTitle className="text-3xl mb-2">
            Comprovante Válido
          </CardTitle>
          <p className="text-muted-foreground">
            Registro de Ponto Eletrônico Verificado
          </p>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Informações do Colaborador */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Colaborador</p>
                <p className="font-semibold text-lg">{comprovante.employee_name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant={getTipoBadgeVariant(comprovante.punch_type)} className="text-base py-1 px-3">
                {getTipoLabel(comprovante.punch_type)}
              </Badge>
            </div>
          </div>

          {/* Data e Hora */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Data</p>
                <p className="font-medium">{dataHora.toLocaleDateString('pt-BR')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Hora</p>
                <p className="font-medium">{dataHora.toLocaleTimeString('pt-BR')}</p>
              </div>
            </div>
          </div>

          {/* Localização */}
          {comprovante.location_address && (
            <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
              <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Localização</p>
                <p className="font-medium">{comprovante.location_address}</p>
              </div>
            </div>
          )}

          {/* Código de Verificação */}
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Código de Verificação</p>
            <code className="text-xs font-mono">{comprovante.id}</code>
          </div>

          {/* Botão de Download */}
          {comprovante.comprovante_pdf && (
            <Button 
              onClick={handleDownloadPDF}
              className="w-full"
              size="lg"
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar Comprovante em PDF
            </Button>
          )}

          {/* Aviso */}
          <p className="text-xs text-center text-muted-foreground pt-4 border-t">
            Este documento foi gerado automaticamente e possui validade legal.<br />
            Hash de verificação: {comprovante.id.substring(0, 8).toUpperCase()}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
