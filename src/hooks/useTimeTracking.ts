import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface TimeEntry {
  id: string;
  employee_id: string;
  punch_type: 'IN' | 'OUT' | 'BREAK_IN' | 'BREAK_OUT';
  punch_time: string;
  location_lat?: number;
  location_lng?: number;
  location_address?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  profiles?: {
    full_name: string;
    department?: string;
  };
}

export const useTimeEntries = (employeeId?: string, date?: string) => {
  return useQuery({
    queryKey: ['time_entries', employeeId, date],
    enabled: !!employeeId, // Only run query when employeeId is provided
    queryFn: async () => {
      let query = supabase
        .from('time_entries')
        .select(`
          *,
          profiles!employee_id(full_name, department)
        `)
        .order('punch_time', { ascending: false });

      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }

      if (date) {
        const startDate = new Date(date);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 1);
        
        query = query
          .gte('punch_time', startDate.toISOString())
          .lt('punch_time', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as TimeEntry[];
    },
  });
};

export const useCreateTimeEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entry: Omit<TimeEntry, 'id' | 'created_at' | 'status' | 'profiles'>) => {
      const { data, error } = await supabase
        .from('time_entries')
        .insert([{ ...entry, status: 'approved' }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time_entries'] });
      toast({
        title: "Ponto registrado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao registrar ponto",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useTodayTimeEntries = (employeeId?: string) => {
  const today = new Date().toISOString().split('T')[0];
  return useTimeEntries(employeeId, today);
};

export const useWorkingHours = (employeeId?: string, date?: string) => {
  return useQuery({
    queryKey: ['working_hours', employeeId, date],
    enabled: !!employeeId && !!date, // Only run query when both employeeId and date are provided
    queryFn: async () => {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);

      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('employee_id', employeeId)
        .gte('punch_time', startDate.toISOString())
        .lt('punch_time', endDate.toISOString())
        .order('punch_time', { ascending: true });

      if (error) throw error;

      // Calculate working hours
      let totalMinutes = 0;
      let lastIn: Date | null = null;
      let isOnBreak = false;

      for (const entry of data) {
        const punchTime = new Date(entry.punch_time);
        
        if (entry.punch_type === 'IN') {
          lastIn = punchTime;
          isOnBreak = false;
        } else if (entry.punch_type === 'OUT' && lastIn && !isOnBreak) {
          totalMinutes += (punchTime.getTime() - lastIn.getTime()) / (1000 * 60);
          lastIn = null;
        } else if (entry.punch_type === 'BREAK_IN' && lastIn) {
          totalMinutes += (punchTime.getTime() - lastIn.getTime()) / (1000 * 60);
          isOnBreak = true;
        } else if (entry.punch_type === 'BREAK_OUT') {
          lastIn = punchTime;
          isOnBreak = false;
        }
      }

      const hours = Math.floor(totalMinutes / 60);
      const minutes = Math.round(totalMinutes % 60);

      return {
        totalHours: `${hours}h ${minutes}m`,
        totalMinutes,
        entries: data
      };
    },
  });
};