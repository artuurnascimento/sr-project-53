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
    enabled: false, // Disabled until time_entries table is properly configured
    queryFn: async () => {
      // Mock data for now
      return [] as TimeEntry[];
    },
  });
};

export const useCreateTimeEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entry: Omit<TimeEntry, 'id' | 'created_at' | 'status' | 'profiles'>) => {
      // Mock implementation for now
      return { id: 'mock', ...entry, status: 'approved', created_at: new Date().toISOString() };
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
    enabled: false, // Disabled until time_entries table is properly configured
    queryFn: async () => {
      // Mock implementation
      return {
        totalHours: '8h 0m',
        totalMinutes: 480,
        entries: []
      };
    },
  });
};