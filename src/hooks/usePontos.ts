import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Ponto {
  id: string;
  colaborador_id: string;
  tipo: 'entrada' | 'saida' | 'pausa' | 'retorno';
  data_hora: string;
  localizacao?: string;
  comprovante_pdf?: string;
  email_enviado: boolean;
  criado_em: string;
  colaboradores?: {
    nome: string;
    email: string;
  };
}

export interface PontoCompleto {
  id: string;
  colaborador_id: string;
  tipo: 'entrada' | 'saida' | 'pausa' | 'retorno';
  data_hora: string;
  localizacao?: string;
  comprovante_pdf?: string;
  email_enviado: boolean;
  colaborador_nome: string;
  colaborador_email: string;
  envio_resumo: string;
}

export const usePontos = (colaboradorId?: string, dataInicio?: string, dataFim?: string) => {
  const [pontos, setPontos] = useState<PontoCompleto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPontos = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('v_pontos_completo')
        .select('*')
        .order('data_hora', { ascending: false });

      if (colaboradorId) {
        query = query.eq('colaborador_id', colaboradorId);
      }

      if (dataInicio) {
        query = query.gte('data_hora', dataInicio);
      }

      if (dataFim) {
        query = query.lte('data_hora', dataFim);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPontos((data || []) as PontoCompleto[]);
    } catch (err) {
      setError(err as Error);
      toast.error('Erro ao carregar pontos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPontos();
  }, [colaboradorId, dataInicio, dataFim]);

  const registrarPonto = async (
    colaboradorId: string, 
    tipo: Ponto['tipo'], 
    localizacao?: string
  ) => {
    try {
      const { data: ponto, error: pontoError } = await supabase
        .from('pontos')
        .insert([{
          colaborador_id: colaboradorId,
          tipo,
          data_hora: new Date().toISOString(),
          localizacao,
          email_enviado: false
        }])
        .select()
        .single();

      if (pontoError) throw pontoError;

      // Chamar edge function para gerar comprovante e enviar e-mail
      try {
        const { data: comprovanteData, error: comprovanteError } = await supabase.functions
          .invoke('gerar-comprovante-ponto', {
            body: { pontoId: ponto.id }
          });

        if (comprovanteError) {
          console.error('Erro ao gerar comprovante:', comprovanteError);
        }
      } catch (comprovanteErr) {
        console.error('Erro ao chamar função de comprovante:', comprovanteErr);
      }

      await fetchPontos();
      toast.success('Ponto registrado com sucesso');
      return ponto;
    } catch (err) {
      toast.error('Erro ao registrar ponto');
      throw err;
    }
  };

  return {
    pontos,
    loading,
    error,
    fetchPontos,
    registrarPonto
  };
};
