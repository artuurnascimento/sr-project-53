import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { XCircle, FileImage, FileText } from "lucide-react";
import { toast } from "sonner";
import { downloadComprovanteAsImage, downloadComprovanteAsPDF } from "@/utils/comprovanteExport";

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

  const handleDownloadPDF = async () => {
    try {
      await downloadComprovanteAsPDF(
        'comprovante-content',
        `comprovante-ponto-${new Date().toISOString().split('T')[0]}.pdf`
      );
      toast.success('PDF baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
      toast.error('Erro ao baixar PDF');
    }
  };

  const handleDownloadImage = async () => {
    try {
      await downloadComprovanteAsImage(
        'comprovante-content',
        `comprovante-ponto-${new Date().toISOString().split('T')[0]}.png`
      );
      toast.success('Imagem baixada com sucesso!');
    } catch (error) {
      console.error('Erro ao baixar imagem:', error);
      toast.error('Erro ao baixar imagem');
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
      <div className="w-full max-w-2xl space-y-4">
        {/* Conteúdo do Comprovante - Será capturado */}
        <Card className="w-full" id="comprovante-content" style={{ maxWidth: '672px', margin: '0 auto' }}>
          <CardHeader className="text-center border-b">
            <div className="flex justify-center mb-4">
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
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
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="flex-shrink-0"
                >
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <div>
                  <p className="text-sm text-muted-foreground">Colaborador</p>
                  <p className="font-semibold text-lg">{comprovante.employee_name}</p>
                </div>
              </div>

              <div>
                <Badge variant={getTipoBadgeVariant(comprovante.punch_type)} className="text-base py-1.5 px-4 inline-flex">
                  {getTipoLabel(comprovante.punch_type)}
                </Badge>
              </div>
            </div>

            {/* Data e Hora */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="flex-shrink-0"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <div>
                  <p className="text-sm text-muted-foreground">Data</p>
                  <p className="font-medium">{dataHora.toLocaleDateString('pt-BR')}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="flex-shrink-0"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <div>
                  <p className="text-sm text-muted-foreground">Hora</p>
                  <p className="font-medium">{dataHora.toLocaleTimeString('pt-BR')}</p>
                </div>
              </div>
            </div>

            {/* Localização */}
            {comprovante.location_address && (
              <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="flex-shrink-0 mt-0.5"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Localização</p>
                  <p className="font-medium">{comprovante.location_address}</p>
                </div>
              </div>
            )}

            {/* Código de Verificação */}
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Código de Verificação</p>
              <code className="text-xs font-mono break-all">{comprovante.id}</code>
            </div>

            {/* Aviso */}
            <div className="text-xs text-center text-muted-foreground pt-4 border-t">
              <p>Este documento foi gerado automaticamente e possui validade legal.</p>
              <p className="mt-1">Hash de verificação: {comprovante.id.substring(0, 8).toUpperCase()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Botões de Download - Fora do conteúdo capturado */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={handleDownloadPDF}
            variant="default"
            className="w-full"
            size="lg"
          >
            <FileText className="w-4 h-4 mr-2" />
            Baixar PDF
          </Button>
          <Button
            onClick={handleDownloadImage}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <FileImage className="w-4 h-4 mr-2" />
            Baixar Imagem
          </Button>
        </div>
      </div>
    </div>
  );
}
