import { useState, useCallback } from 'react';
import api from '@/lib/api';

export interface FinanceSummary {
  currentBalance: number;
  totalRevenue:   number;
  totalExpenses:  number;
  netProfit:      number;
  profitMargin:   string;
  incomeCount:    number;
  expenseCount:   number;
}

export interface Transaction {
  id:             string;
  type:           'income' | 'expense';
  description:    string;
  amount:         number;
  category:       string;
  date:           string;
  paymentMethod?: string;
  status:         string;
}

export interface Commission {
  id:         string;
  percentage: number;
  amount:     number;
  status:     'pending' | 'paid';
  paidAt?:    string;
  barber?: {
    name:  string;
    email: string;
  };
}

export interface Goal {
  id:            string;
  name:          string;
  targetAmount:  number;
  currentAmount: number;
  percentage:    string;
  remaining:     number;
  daysRemaining: number;
  status:        'active' | 'completed' | 'expired';
  startDate:     string;
  endDate:       string;
}

export function useFinanceiro() {
  const [summary,      setSummary]      = useState<FinanceSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [commissions,  setCommissions]  = useState<Commission[]>([]);
  const [goals,        setGoals]        = useState<Goal[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [refreshing,   setRefreshing]   = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  // ── Resumo financeiro ───────────────────────────────────────────────────────
  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // ✅ CORRETO: /finance/summary  (era /finance/summary — OK)
      const res = await api.get('/finance/summary');
      setSummary(res.data?.summary ?? res.data);
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
      // ✅ CORRIGIDO: /transactions  (era /finance/transactions ❌)
      const params = type ? { type } : {};
      const res = await api.get('/transactions', { params });
      setTransactions(res.data || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erro ao carregar transações');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Comissões ───────────────────────────────────────────────────────────────
  const loadCommissions = useCallback(async (month?: number, year?: number) => {
    setLoading(true);
    setError(null);
    try {
      const currentDate = new Date();
      const m = month ?? currentDate.getMonth() + 1;
      const y = year  ?? currentDate.getFullYear();

      // ✅ CORRIGIDO: /commissions/report  (era /finance/commissions ❌)
      const res = await api.get('/commissions/report', { params: { month: m, year: y } });
      setCommissions(res.data?.commissions || []);
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
      // ✅ CORRIGIDO: /goals/progress  (era /finance/goals ❌)
      const res = await api.get('/goals/progress');
      setGoals(res.data?.goals || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erro ao carregar metas');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Refresh geral ───────────────────────────────────────────────────────────
  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      loadSummary(),
      loadTransactions(),
      loadCommissions(),
      loadGoals(),
    ]);
    setRefreshing(false);
  }, [loadSummary, loadTransactions, loadCommissions, loadGoals]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const getGoalProgress = (goal: Goal) =>
    Math.min((Number(goal.currentAmount) / Number(goal.targetAmount)) * 100, 100);

  const getActiveGoals    = () => goals.filter(g => g.status === 'active');
  const getCompletedGoals = () => goals.filter(g => g.status === 'completed');
  const getTotalCommissions = () =>
    commissions.reduce((s, c) => s + Number(c.amount), 0);

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