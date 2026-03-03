import { useState, useCallback } from 'react';
import api from '@/lib/api';

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  date: string;
  status: AppointmentStatus;
  notes?: string;
  customer: { id: string; name: string; phone?: string; email?: string };
  service:  { id: string; name: string; price: number; duration: number };
  barber:   { id: string; name: string };
}

export interface AppointmentFilters {
  status?: AppointmentStatus | 'all';
  date?: string;
  search?: string;
}

export function useAgendamentos() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading]           = useState(false);
  const [refreshing, setRefreshing]     = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const load = useCallback(async (filters?: AppointmentFilters) => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (filters?.status && filters.status !== 'all') params.status = filters.status;
      if (filters?.date)   params.date   = filters.date;
      if (filters?.search) params.search = filters.search;

      const res = await api.get('/appointments', { params });
      setAppointments(res.data || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erro ao carregar agendamentos');
      console.error('useAgendamentos:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async (filters?: AppointmentFilters) => {
    setRefreshing(true);
    await load(filters);
    setRefreshing(false);
  }, [load]);

  const updateStatus = useCallback(async (id: string, status: AppointmentStatus) => {
    try {
      await api.patch(`/appointments/${id}/status`, { status });
      setAppointments(prev =>
        prev.map(a => a.id === id ? { ...a, status } : a)
      );
      return true;
    } catch (e: any) {
      console.error('updateStatus:', e);
      return false;
    }
  }, []);

  const cancel = useCallback(async (id: string) => {
    return updateStatus(id, 'cancelled');
  }, [updateStatus]);

  const confirm = useCallback(async (id: string) => {
    return updateStatus(id, 'confirmed');
  }, [updateStatus]);

  const complete = useCallback(async (id: string) => {
    return updateStatus(id, 'completed');
  }, [updateStatus]);

  // Filtros locais
  const getByStatus = useCallback((status: AppointmentStatus | 'all') => {
    if (status === 'all') return appointments;
    return appointments.filter(a => a.status === status);
  }, [appointments]);

  const getToday = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return appointments.filter(a => a.date.startsWith(today));
  }, [appointments]);

  const getUpcoming = useCallback(() => {
    const now = new Date();
    return appointments
      .filter(a => new Date(a.date) > now && a.status !== 'cancelled')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [appointments]);

  return {
    appointments,
    loading,
    refreshing,
    error,
    load,
    refresh,
    updateStatus,
    cancel,
    confirm,
    complete,
    getByStatus,
    getToday,
    getUpcoming,
  };
}