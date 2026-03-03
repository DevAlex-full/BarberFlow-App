import { useState, useCallback } from 'react';
import api from '@/lib/api';

export interface FinanceSummary {
  totalIncome:  number;
  totalExpense: number;
  balance:      number;
  period:       string;
}

export interface Transaction {
  id:            string;
  type:          'income' | 'expense';
  description:   string;
  amount:        number;
  category:      string;
  date:          string;
  paymentMethod?: string;
}

export interface Commission {
  id:               string;
  barberName:       string;
  barberId:         string;
  totalServices:    number;
  totalRevenue:     number;
  commissionRate:   number;
  commissionAmount: number;
  period:           string;
}

export interface Goal {
  id:           string;
  title:        string;
  type:         'revenue' | 'appointments' | 'clients' | 'custom';
  targetValue:  number;
  currentValue: number;
  period:       'daily' | 'weekly' | 'monthly';
  deadline?:    string;
  status:       'active' | 'completed' | 'failed';
}

export function useFinanceiro() {
  const [summary, setSummary]           = useState<FinanceSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [commissions, setCommissions]   = useState<Commission[]>([]);
  const [goals, setGoals]               = useState<Goal[]>([]);
  const [loading, setLoading]           = useState(false);
  const [refreshing, setRefreshing]     = useState(false);
  const [error, setError]               = useState<string | null>(null);

  // ── Resumo financeiro ───────────────────────────────────────────────────────
  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/finance/summary');
      const data = res.data;
      setSummary({
        totalIncome:  Number(data.totalIncome  || 0),
        totalExpense: Number(data.totalExpense || 0),
        balance:      Number(data.totalIncome  || 0) - Number(data.totalExpense || 0),
        period:       data.period || 'Mês atual',
      });
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erro ao carregar resumo financeiro');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Transações ──────────────────────────────────────────────────────────────
  const loadTransactions = useCallback(async (type?: 'income' | 'expense') => {
    setLoading(true);
    setError(null);
    try {
      const params = type ? { type } : {};
      const res = await api.get('/finance/transactions', { params });
      setTransactions(res.data || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erro ao carregar transações');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Comissões ───────────────────────────────────────────────────────────────
  const loadCommissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/finance/commissions');
      setCommissions(res.data || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erro ao carregar comissões');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Metas ───────────────────────────────────────────────────────────────────
  const loadGoals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/finance/goals');
      setGoals(res.data || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erro ao carregar metas');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Refresh geral ───────────────────────────────────────────────────────────
  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadSummary(), loadTransactions(), loadCommissions(), loadGoals()]);
    setRefreshing(false);
  }, [loadSummary, loadTransactions, loadCommissions, loadGoals]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const getGoalProgress = (goal: Goal) =>
    Math.min((goal.currentValue / goal.targetValue) * 100, 100);

  const getActiveGoals    = () => goals.filter(g => g.status === 'active');
  const getCompletedGoals = () => goals.filter(g => g.status === 'completed');

  const getTotalCommissions = () =>
    commissions.reduce((s, c) => s + c.commissionAmount, 0);

  return {
    // Estado
    summary, transactions, commissions, goals,
    loading, refreshing, error,

    // Loaders
    loadSummary, loadTransactions, loadCommissions, loadGoals, refreshAll,

    // Helpers
    formatCurrency, getGoalProgress,
    getActiveGoals, getCompletedGoals, getTotalCommissions,
  };
}