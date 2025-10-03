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
    avatar_url?: string;
  };
  facial_recognition_audit?: {
    attempt_image_url: string;
    confidence_score: number;
  }[];
}

export const useTimeEntries = (employeeId?: string, date?: string) => {
  return useQuery({
    queryKey: ['time_entries', employeeId, date],
    queryFn: async () => {
      let query = supabase
        .from('time_entries')
        .select(`
          *,
          profiles:employee_id(full_name, department, avatar_url)
        `)
        .order('punch_time', { ascending: false });

      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }

      if (date) {
        const startOfDay = `${date}T00:00:00`;
        const endOfDay = `${date}T23:59:59`;
        query = query.gte('punch_time', startOfDay).lte('punch_time', endOfDay);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Get facial recognition data separately for each entry
      const entriesWithFacialData = await Promise.all(
        (data || []).map(async (entry) => {
          const { data: facialData } = await supabase
            .from('facial_recognition_audit')
            .select('attempt_image_url, confidence_score')
            .eq('time_entry_id', entry.id)
            .order('created_at', { ascending: false })
            .limit(1);
          
          return {
            ...entry,
            facial_recognition_audit: facialData || []
          };
        })
      );
      
      return entriesWithFacialData as TimeEntry[];
    },
  });
};

export const useCreateTimeEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entry: Omit<TimeEntry, 'id' | 'created_at' | 'status' | 'profiles' | 'facial_recognition_audit'>) => {
      const { data, error } = await supabase
        .from('time_entries')
        .insert([{
          employee_id: entry.employee_id,
          punch_type: entry.punch_type,
          punch_time: entry.punch_time,
          location_lat: entry.location_lat,
          location_lng: entry.location_lng,
          location_address: entry.location_address,
          status: 'approved'
        }])
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
    queryFn: async () => {
      if (!employeeId || !date) {
        return { totalHours: '0h 0m', totalMinutes: 0, entries: [] };
      }

      const startOfDay = `${date}T00:00:00`;
      const endOfDay = `${date}T23:59:59`;

      const { data: entries, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('employee_id', employeeId)
        .gte('punch_time', startOfDay)
        .lte('punch_time', endOfDay)
        .order('punch_time', { ascending: true });

      if (error) throw error;

      // Calculate working hours
      let totalMinutes = 0;
      let lastIn: Date | null = null;

      entries?.forEach((entry) => {
        const punchTime = new Date(entry.punch_time);
        
        if (entry.punch_type === 'IN') {
          lastIn = punchTime;
        } else if (entry.punch_type === 'OUT' && lastIn) {
          const diff = punchTime.getTime() - lastIn.getTime();
          totalMinutes += Math.floor(diff / 60000);
          lastIn = null;
        }
      });

      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      return {
        totalHours: `${hours}h ${minutes}m`,
        totalMinutes,
        entries: entries || []
      };
    },
  });
};