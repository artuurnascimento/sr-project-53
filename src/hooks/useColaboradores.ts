import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Colaborador {
  id: string;
  full_name: string;
  email: string;
  employee_id?: string;
  department?: string;
  position?: string;
  role: 'employee' | 'admin' | 'manager';
  envio_resumo: 'diario' | 'semanal' | 'mensal' | 'todos';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useColaboradores = () => {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchColaboradores = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');

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

  const updateColaborador = async (id: string, updates: Partial<Colaborador>) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
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

  return {
    colaboradores,
    loading,
    error,
    fetchColaboradores,
    updateColaborador
  };
};
