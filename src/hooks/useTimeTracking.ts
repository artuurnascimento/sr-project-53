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
      
      // Get facial recognition data separately for each entry and generate signed URL
      const entriesWithFacialData = await Promise.all(
        (data || []).map(async (entry) => {
          const { data: facialData } = await supabase
            .from('facial_recognition_audit')
            .select('attempt_image_url, confidence_score')
            .eq('time_entry_id', entry.id)
            .order('created_at', { ascending: false })
            .limit(1);

          let signedFacialData = facialData || [];
          
          if (facialData && facialData[0]?.attempt_image_url) {
            try {
              const url: string = facialData[0].attempt_image_url;
              console.log('Original facial URL:', url);
              
              const marker = '/facial-audit/';
              if (url.startsWith('http')) {
                // Extract the file path from the public URL
                const idx = url.indexOf(marker);
                if (idx !== -1) {
                  const key = url.substring(idx + marker.length);
                  console.log('Extracted file key:', key);
                  const { data: signed, error: signError } = await supabase
                    .storage
                    .from('facial-audit')
                    .createSignedUrl(key, 60 * 60); // 1 hour
                  if (signError) {
                    console.error('Error creating signed URL:', signError);
                  } else if (signed?.signedUrl) {
                    console.log('Generated signed URL:', signed.signedUrl);
                    signedFacialData = [{
                      ...facialData[0],
                      attempt_image_url: signed.signedUrl,
                    }];
                  }
                } else {
                  console.warn('Could not find marker in URL:', url);
                }
              } else {
                // Already a storage key or placeholder marker
                const key = url.startsWith('facial-audit/') ? url.replace('facial-audit/', '') : url;

                // Skip signing for placeholders or backfill markers
                if (key.startsWith('backfill/') || key.startsWith('placeholder://')) {
                  console.info('No evidence image to sign (placeholder/backfill).');
                } else {
                  const { data: signed, error: signError } = await supabase
                    .storage
                    .from('facial-audit')
                    .createSignedUrl(key, 60 * 60);
                  if (signError) {
                    console.error('Error creating signed URL from key:', signError);
                  } else if (signed?.signedUrl) {
                    console.log('Generated signed URL:', signed.signedUrl);
                    signedFacialData = [{
                      ...facialData[0],
                      attempt_image_url: signed.signedUrl,
                    }];
                  }
                }
              }
            } catch (e) {
              console.error('Error processing facial image URL:', e);
            }
          }
          
          return {
            ...entry,
            facial_recognition_audit: signedFacialData
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