import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  employee_id?: string;
  department?: string;
  position?: string;
  role: 'employee' | 'admin' | 'manager';
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useProfiles = () => {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Profile[];
    },
  });
};

export const useCreateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: Omit<Profile, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('profiles')
        .insert([profile])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast({
        title: "Perfil criado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar perfil",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Profile> & { id: string }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast({
        title: "Perfil atualizado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Primeiro, buscar o user_id do profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('id', id)
        .single();

      if (profileError) throw profileError;

      // Deletar o profile (isso vai deletar em cascata os dados relacionados)
      const { error: deleteProfileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (deleteProfileError) throw deleteProfileError;

      // Deletar o usuário do Auth usando a Edge Function
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Sessão não encontrada');
      }

      const response = await fetch(
        `https://segvkjzlvkhkjkwyecnc.supabase.co/functions/v1/delete-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlZ3Zranpsdmtoa2prd3llY25jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NjkwOTgsImV4cCI6M jA3MzU0NTA5OH0.rKy5zZNrMuWGK_37ZK7H9xzX_ioajm-NiXGPXYlk3Jo'
          },
          body: JSON.stringify({ user_id: profile.user_id })
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao deletar usuário do Auth');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast({
        title: "Colaborador removido com sucesso!",
        description: "O usuário foi completamente removido do sistema.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover colaborador",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};