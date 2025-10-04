import { useState } from 'react';
import { Calendar, Clock, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PortalLayout from '@/components/layout/PortalLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useTimeEntries } from '@/hooks/useTimeTracking';

const History = () => {
  const { profile } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: timeEntries, isLoading } = useTimeEntries(profile?.id);

  const getMonthEntries = () => {
    if (!timeEntries) return [];
    
    const [year, month] = selectedMonth.split('-');
    return timeEntries.filter(entry => {
      const entryDate = new Date(entry.punch_time);
      return entryDate.getFullYear() === parseInt(year) && 
             entryDate.getMonth() === parseInt(month) - 1;
    });
  };

  const groupEntriesByDate = () => {
    const entries = getMonthEntries();
    const grouped: Record<string, typeof entries> = {};

    entries.forEach(entry => {
      const date = new Date(entry.punch_time).toISOString().split('T')[0];
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(entry);
    });

    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => new Date(a.punch_time).getTime() - new Date(b.punch_time).getTime());
    });

    return grouped;
  };

  const calculateDayHours = (entries: any[]) => {
    let totalMinutes = 0;
    let lastIn: Date | null = null;
    let isOnBreak = false;

    for (const entry of entries) {
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
    const overtime = Math.max(0, totalMinutes - 480);

    return {
      total: `${hours}h ${minutes}m`,
      overtime: overtime > 0 ? `${Math.floor(overtime / 60)}h ${Math.round(overtime % 60)}m` : '0m'
    };
  };

  const getEventTypeLabel = (type: string) => {
    const labels = {
      'IN': 'Entrada',
      'OUT': 'Saída',
      'BREAK_IN': 'Saída Intervalo',
      'BREAK_OUT': 'Volta Intervalo'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'approved': 'default',
      'pending': 'secondary',
      'rejected': 'destructive'
    } as const;
    
    const labels = {
      'approved': 'Aprovado',
      'pending': 'Pendente',
      'rejected': 'Rejeitado'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'} className="text-xs">
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit'
    });
  };

  const handleExport = (format: 'csv') => {
    const entries = getMonthEntries();
    const csvContent = [
      'Data,Hora,Tipo,Status,Localização',
      ...entries.map(entry => [
        new Date(entry.punch_time).toLocaleDateString('pt-BR'),
        new Date(entry.punch_time).toLocaleTimeString('pt-BR'),
        getEventTypeLabel(entry.punch_type),
        entry.status,
        entry.location_address || 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historico-ponto-${selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1);
    
    if (direction === 'prev') {
      date.setMonth(date.getMonth() - 1);
    } else {
      date.setMonth(date.getMonth() + 1);
    }
    
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
  };

  const groupedEntries = groupEntriesByDate();
  const sortedDates = Object.keys(groupedEntries).sort().reverse();

  return (
    <PortalLayout>
        <div className="max-w-4xl mx-auto space-y-4 md:space-y-6 p-4 md:p-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
            <h1 className="text-xl md:text-2xl font-bold">Histórico de Ponto</h1>
            <Button variant="outline" size="sm" onClick={() => handleExport('csv')} className="text-xs md:text-sm w-full sm:w-auto">