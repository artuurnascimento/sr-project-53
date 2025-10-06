import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Justification {
  id: string;
  employee_id: string;
  request_type: 'absence' | 'overtime' | 'vacation' | 'expense' | 'other';
  title: string;
  description: string;
  start_date?: string;
  end_date?: string;
  amount?: number;
  status: 'pending' | 'approved' | 'rejected' | 'in_review';
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  attachments: any[];
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string;
    department?: string;
  };
}

export const useJustifications = (employeeId?: string) => {
  return useQuery({
    queryKey: ['justifications', employeeId],
    queryFn: async () => {
      let query = supabase
        .from('justifications')
        .select(`
          *,
          profiles!employee_id(full_name, department)
        `)
        .order('created_at', { ascending: false });

      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Justification[];
    },
  });
};

export const useCreateJustification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (justification: Omit<Justification, 'id' | 'created_at' | 'updated_at' | 'status' | 'profiles'>) => {
      const { data, error } = await supabase
        .from('justifications')
        .insert([justification])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['justifications'] });
      toast({
        title: "Justificativa criada com sucesso!",
        description: "Sua solicitação foi enviada para análise.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar justificativa",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateJustification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Justification> }) => {
      const { data, error } = await supabase
        .from('justifications')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['justifications'] });
      toast({
        title: "Justificativa atualizada com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar justificativa",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};