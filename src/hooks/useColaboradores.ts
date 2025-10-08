import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Colaborador {
  id: string;
  nome: string;
  email: string;
  envio_resumo: 'diario' | 'semanal' | 'mensal' | 'todos';
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

export const useColaboradores = () => {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchColaboradores = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('colaboradores')
        .select('*')
        .order('nome');

      if (error) throw error;
      setColaboradores((data || []) as Colaborador[]);
    } catch (err) {
      setError(err as Error);
      toast.error('Erro ao carregar colaboradores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchColaboradores();
  }, []);

  const createColaborador = async (colaborador: Omit<Colaborador, 'id' | 'criado_em' | 'atualizado_em'>) => {
    try {
      const { data, error } = await supabase
        .from('colaboradores')
        .insert([colaborador])
        .select()
        .single();

      if (error) throw error;
      setColaboradores(prev => [...prev, data as Colaborador]);
      toast.success('Colaborador criado com sucesso');
      return data;
    } catch (err) {
      toast.error('Erro ao criar colaborador');
      throw err;
    }
  };

  const updateColaborador = async (id: string, updates: Partial<Colaborador>) => {
    try {
      const { data, error } = await supabase
        .from('colaboradores')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setColaboradores(prev => prev.map(c => c.id === id ? data as Colaborador : c));
      toast.success('Colaborador atualizado com sucesso');
      return data;
    } catch (err) {
      toast.error('Erro ao atualizar colaborador');
      throw err;
    }
  };

  const deleteColaborador = async (id: string) => {
    try {
      const { error } = await supabase
        .from('colaboradores')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setColaboradores(prev => prev.filter(c => c.id !== id));
      toast.success('Colaborador excluído com sucesso');
    } catch (err) {
      toast.error('Erro ao excluir colaborador');
      throw err;
    }
  };

  return {
    colaboradores,
    loading,
    error,
    fetchColaboradores,
    createColaborador,
    updateColaborador,
    deleteColaborador
  };
};
