import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TimeEntry {
  id: string;
  employee_id: string;
  punch_type: 'IN' | 'OUT' | 'BREAK_IN' | 'BREAK_OUT';
  punch_time: string;
  location_address?: string;
  location_lat?: number;
  location_lng?: number;
  comprovante_pdf?: string;
  email_enviado: boolean;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  employee_name?: string;
  employee_email?: string;
  envio_resumo?: string;
}

export const usePontos = (employeeId?: string, dataInicio?: string, dataFim?: string) => {
  const [pontos, setPontos] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPontos = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('v_time_entries_completo')
        .select('*')
        .order('punch_time', { ascending: false });

      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }

      if (dataInicio) {
        query = query.gte('punch_time', dataInicio);
      }

      if (dataFim) {
        query = query.lte('punch_time', dataFim);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPontos((data || []) as TimeEntry[]);
    } catch (err) {
      setError(err as Error);
      toast.error('Erro ao carregar pontos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPontos();
  }, [employeeId, dataInicio, dataFim]);

  const registrarPonto = async (
    employeeId: string,
    punchType: 'IN' | 'OUT' | 'BREAK_IN' | 'BREAK_OUT',
    locationData?: {
      address?: string;
      lat?: number;
      lng?: number;
    }
  ) => {
    try {
      const { data: timeEntry, error: timeEntryError } = await supabase
        .from('time_entries')
        .insert([{
          employee_id: employeeId,
          punch_type: punchType,
          punch_time: new Date().toISOString(),
          location_address: locationData?.address,
          location_lat: locationData?.lat,
          location_lng: locationData?.lng,
          status: 'approved',
          email_enviado: false
        }])
        .select()
        .single();

      if (timeEntryError) throw timeEntryError;

      try {
        const { error: comprovanteError } = await supabase.functions
          .invoke('gerar-comprovante-ponto', {
            body: { timeEntryId: timeEntry.id }
          });

        if (comprovanteError) {
          console.error('Erro ao gerar comprovante:', comprovanteError);
        }
      } catch (comprovanteErr) {
        console.error('Erro ao chamar função de comprovante:', comprovanteErr);
      }

      await fetchPontos();
      toast.success('Ponto registrado com sucesso');
      return timeEntry;
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
