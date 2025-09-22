import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ReportData {
  totalEmployees: number;
  activeEmployees: number;
  todayPunches: number;
  pendingApprovals: number;
  lateArrivals: number;
  overtime: number;
  monthlyHours: number;
  departmentStats: Array<{
    department: string;
    employees: number;
    avgHours: number;
  }>;
  dailyStats: Array<{
    date: string;
    punches: number;
    lateArrivals: number;
  }>;
}

export const useReportData = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: ['report_data', startDate, endDate],
    queryFn: async (): Promise<ReportData> => {
      const today = new Date().toISOString().split('T')[0];
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      
      // Get total employees
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // Get today's time entries
      const { data: todayEntries, error: todayError } = await supabase
        .from('time_entries')
        .select('*')
        .gte('punch_time', `${today}T00:00:00`)
        .lt('punch_time', `${today}T23:59:59`);

      if (todayError) throw todayError;

      // Get pending justifications
      const { data: pendingJustifications, error: justificationsError } = await supabase
        .from('justifications')
        .select('*')
        .eq('status', 'pending');

      if (justificationsError) throw justificationsError;

      // Calculate stats
      const totalEmployees = profiles?.length || 0;
      const activeEmployees = profiles?.filter(p => p.is_active)?.length || 0;
      const todayPunches = todayEntries?.length || 0;
      const pendingApprovals = pendingJustifications?.length || 0;

      // Mock data for other stats (would be calculated from real data)
      const lateArrivals = Math.floor(Math.random() * 5);
      const overtime = Math.floor(Math.random() * 20);
      const monthlyHours = Math.floor(Math.random() * 2000) + 1500;

      const departmentStats = [
        { department: 'Operações', employees: 15, avgHours: 168 },
        { department: 'Administrativa', employees: 8, avgHours: 160 },
        { department: 'Técnica', employees: 12, avgHours: 172 },
        { department: 'Comercial', employees: 5, avgHours: 165 },
      ];

      const dailyStats = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return {
          date: date.toISOString().split('T')[0],
          punches: Math.floor(Math.random() * 50) + 20,
          lateArrivals: Math.floor(Math.random() * 5),
        };
      }).reverse();

      return {
        totalEmployees,
        activeEmployees,
        todayPunches,
        pendingApprovals,
        lateArrivals,
        overtime,
        monthlyHours,
        departmentStats,
        dailyStats,
      };
    },
  });
};