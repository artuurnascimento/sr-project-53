import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ActivityLog {
  id: string;
  user_id: string;
  action_type: string;
  entity_type: string;
  entity_id?: string;
  details: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

export const useActivityLogs = (userId?: string) => {
  return useQuery({
    queryKey: ['activity_logs', userId],
    queryFn: async () => {
      let query = supabase
        .from('activity_logs')
        .select(`
          *
        `)
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ActivityLog[];
    },
  });
};

export const useCreateActivityLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (log: Omit<ActivityLog, 'id' | 'created_at' | 'profiles'>) => {
      const { data, error } = await supabase
        .from('activity_logs')
        .insert([log])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity_logs'] });
    },
  });
};