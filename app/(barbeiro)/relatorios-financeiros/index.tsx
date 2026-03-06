import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/colors';

// ─── Tipos (espelham finance.ts do web) ───────────────────────────────────────

interface CashflowMonth {
  month:    string;
  revenue:  number;
  expenses: number;
  netFlow:  number;
}

interface CashflowResponse {
  cashflow: CashflowMonth[];
  summary: {
    totalRevenue:            number;
    totalExpenses:           number;
    averageMonthlyRevenue:   number;
    averageMonthlyExpenses:  number;
  };
}

interface DREReport {
  period: { start: string; end: string };
  dre: {
    revenue:  { services: number; products: number; others: number; total: number };
    expenses: { salaries: number; commissions: number; rent: number; utilities: number; supplies: number; others: number; total: number };
    results:  { operatingProfit: number; netProfit: number; profitMargin: string };
  };
}

interface BalanceReport {
  referenceDate: string;
  balance: {
    assets:      { current: { cash: number }; total: number };
    liabilities: { current: { commissionsPayable: number }; total: number };
    equity:      { total: number };
  };
  verification: { balanced: boolean; difference: number };
}

type TabType = 'dre' | 'cashflow' | 'balance';

export default function RelatoriosFinanceirosScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('dre');
  const [loading,   setLoading]   = useState(false);
  const [dreData,   setDreData]   = useState<DREReport | null>(null);
  const [cashData,  setCashData]  = useState<CashflowResponse | null>(null);
  const [balData,   setBalData]   = useState<BalanceReport | null>(null);

  const today     = new Date();
  const [startDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]);
  const [endDate]   = useState(today.toISOString().split('T')[0]);

  useEffect(() => { loadTab(activeTab); }, [activeTab]);

  async function loadTab(tab: TabType) {
    setLoading(true);
    try {
      if (tab === 'dre') {
        // ✅ GET /finance/dre  (financeApi.getDRE)
        const res = await api.get<DREReport>('/finance/dre', { params: { startDate, endDate } });
        setDreData(res.data);
      } else if (tab === 'cashflow') {
        // ✅ GET /finance/cashflow  (financeApi.getCashflow)
        const res = await api.get<CashflowResponse>('/finance/cashflow', { params: { months: 6 } });
        setCashData(res.data);
      } else {
        // ✅ GET /finance/balance  (financeApi.getBalance)
        const res = await api.get<BalanceReport>('/finance/balance', { params: { date: endDate } });
        setBalData(res.data);
      }
    } catch (e) {
      console.error(`Erro ao carregar ${tab}:`, e);
    } finally {
      setLoading(false);
    }
  }

  const TABS: { key: TabType; label: string; icon: string; color: string }[] = [
    { key: 'dre',      label: 'DRE',           icon: 'document-text', color: '#8b5cf6' },
    { key: 'cashflow', label: 'Fluxo de Caixa', icon: 'trending-up',   color: '#10b981' },
    { key: 'balance',  label: 'Balanço',        icon: 'pie-chart',     color: '#3b82f6' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="bar-chart" size={22} color={Colors.white} />
        </View>
        <View>
          <Text style={styles.headerTitle}>Relatórios Financeiros</Text>
          <Text style={styles.headerSub}>DRE, Fluxo de Caixa e Balanço</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key}
            style={[styles.tab, activeTab === t.key && { borderBottomColor: t.color, borderBottomWidth: 3 }]}
            onPress={() => setActiveTab(t.key)}>
            <Ionicons name={t.icon as any} size={18}
              color={activeTab === t.key ? t.color : Colors.gray[400]} />
            <Text style={[styles.tabText, activeTab === t.key && { color: t.color }]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Gerando relatório...</Text>
        </View>
      ) : (
        <>
          {/* ── DRE ──────────────────────────────────────────────────────── */}
          {activeTab === 'dre' && dreData && (
            <View style={styles.card}>
              <Text style={styles.reportTitle}>Demonstrativo de Resultados</Text>
              <Text style={styles.reportPeriod}>
                {new Date(dreData.period.start).toLocaleDateString('pt-BR')} –{' '}
                {new Date(dreData.period.end).toLocaleDateString('pt-BR')}
              </Text>

              {/* Receitas */}
              <View style={[styles.section, { marginTop: Spacing.md }]}>
                <Text style={[styles.sectionTitle, { color: Colors.success }]}>( + ) RECEITAS</Text>
                {[
                  { label: 'Serviços',  value: dreData.dre.revenue.services },
                  { label: 'Produtos',  value: dreData.dre.revenue.products },
                  { label: 'Outros',    value: dreData.dre.revenue.others },
                ].map((r, i) => (
                  <View key={i} style={styles.lineRow}>
                    <Text style={styles.lineLabel}>{r.label}</Text>
                    <Text style={[styles.lineValue, { color: Colors.success }]}>
                      R$ {r.value.toFixed(2)}
                    </Text>
                  </View>
                ))}
                <View style={[styles.lineRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>TOTAL DE RECEITAS</Text>
                  <Text style={[styles.totalValue, { color: Colors.success }]}>
                    R$ {dreData.dre.revenue.total.toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Despesas */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: Colors.error }]}>( - ) DESPESAS</Text>
                {[
                  { label: 'Salários',   value: dreData.dre.expenses.salaries },
                  { label: 'Comissões',  value: dreData.dre.expenses.commissions },
                  { label: 'Aluguel',    value: dreData.dre.expenses.rent },
                  { label: 'Contas',     value: dreData.dre.expenses.utilities },
                  { label: 'Materiais',  value: dreData.dre.expenses.supplies },
                  { label: 'Outros',     value: dreData.dre.expenses.others },
                ].map((r, i) => (
                  <View key={i} style={styles.lineRow}>
                    <Text style={styles.lineLabel}>{r.label}</Text>
                    <Text style={[styles.lineValue, { color: Colors.error }]}>
                      R$ {r.value.toFixed(2)}
                    </Text>
                  </View>
                ))}
                <View style={[styles.lineRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>TOTAL DE DESPESAS</Text>
                  <Text style={[styles.totalValue, { color: Colors.error }]}>
                    R$ {dreData.dre.expenses.total.toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Resultado */}
              <View style={styles.resultBox}>
                <View style={styles.lineRow}>
                  <Text style={styles.resultLabel}>Lucro Operacional</Text>
                  <Text style={[styles.resultValue, {
                    color: dreData.dre.results.operatingProfit >= 0 ? Colors.success : Colors.error
                  }]}>
                    R$ {dreData.dre.results.operatingProfit.toFixed(2)}
                  </Text>
                </View>
                <View style={[styles.lineRow, { marginTop: 8 }]}>
                  <Text style={[styles.resultLabel, { fontSize: 16 }]}>LUCRO LÍQUIDO</Text>
                  <Text style={[styles.resultValue, { fontSize: 22,
                    color: dreData.dre.results.netProfit >= 0 ? Colors.success : Colors.error
                  }]}>
                    R$ {dreData.dre.results.netProfit.toFixed(2)}
                  </Text>
                </View>
                <Text style={styles.marginText}>
                  Margem: {dreData.dre.results.profitMargin}%
                </Text>
              </View>
            </View>
          )}

          {/* ── FLUXO DE CAIXA ────────────────────────────────────────────── */}
          {activeTab === 'cashflow' && cashData && (
            <View style={styles.card}>
              <Text style={styles.reportTitle}>Fluxo de Caixa — Últimos 6 Meses</Text>
              {cashData.cashflow.map((m, i) => {
                const max = Math.max(...cashData.cashflow.map(x => Math.max(x.revenue, x.expenses)), 1);
                return (
                  <View key={i} style={styles.cashRow}>
                    <Text style={styles.cashMonth}>{m.month}</Text>
                    <View style={{ flex: 1, gap: 4 }}>
                      <View style={styles.cashBarRow}>
                        <Text style={styles.cashBarLabel}>Receita</Text>
                        <View style={styles.cashTrack}>
                          <View style={[styles.cashFill, {
                            width: `${(m.revenue / max) * 100}%` as any,
                            backgroundColor: Colors.success,
                          }]} />
                        </View>
                        <Text style={styles.cashAmount}>R$ {m.revenue.toFixed(0)}</Text>
                      </View>
                      <View style={styles.cashBarRow}>
                        <Text style={styles.cashBarLabel}>Despesa</Text>
                        <View style={styles.cashTrack}>
                          <View style={[styles.cashFill, {
                            width: `${(m.expenses / max) * 100}%` as any,
                            backgroundColor: Colors.error,
                          }]} />
                        </View>
                        <Text style={styles.cashAmount}>R$ {m.expenses.toFixed(0)}</Text>
                      </View>
                    </View>
                    <Text style={[styles.cashNet, { color: m.netFlow >= 0 ? Colors.success : Colors.error }]}>
                      {m.netFlow >= 0 ? '+' : ''}R${m.netFlow.toFixed(0)}
                    </Text>
                  </View>
                );
              })}
              <View style={styles.resultBox}>
                <View style={styles.lineRow}>
                  <Text style={styles.lineLabel}>Receita Média Mensal</Text>
                  <Text style={[styles.lineValue, { color: Colors.success }]}>
                    R$ {cashData.summary.averageMonthlyRevenue.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.lineRow}>
                  <Text style={styles.lineLabel}>Despesa Média Mensal</Text>
                  <Text style={[styles.lineValue, { color: Colors.error }]}>
                    R$ {cashData.summary.averageMonthlyExpenses.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* ── BALANÇO ───────────────────────────────────────────────────── */}
          {activeTab === 'balance' && balData && (
            <View style={styles.card}>
              <Text style={styles.reportTitle}>Balanço Patrimonial Simplificado</Text>
              <Text style={styles.reportPeriod}>
                Referência: {new Date(balData.referenceDate).toLocaleDateString('pt-BR')}
              </Text>

              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: '#3b82f6' }]}>ATIVO</Text>
                <View style={styles.lineRow}>
                  <Text style={styles.lineLabel}>Caixa</Text>
                  <Text style={styles.lineValue}>R$ {balData.balance.assets.current.cash.toFixed(2)}</Text>
                </View>
                <View style={[styles.lineRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>TOTAL DO ATIVO</Text>
                  <Text style={[styles.totalValue, { color: '#3b82f6' }]}>
                    R$ {balData.balance.assets.total.toFixed(2)}
                  </Text>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: Colors.warning }]}>PASSIVO + P.L.</Text>
                <View style={styles.lineRow}>
                  <Text style={styles.lineLabel}>Comissões a Pagar</Text>
                  <Text style={[styles.lineValue, { color: Colors.error }]}>
                    R$ {balData.balance.liabilities.current.commissionsPayable.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.lineRow}>
                  <Text style={styles.lineLabel}>Patrimônio Líquido</Text>
                  <Text style={[styles.lineValue, {
                    color: balData.balance.equity.total >= 0 ? Colors.success : Colors.error
                  }]}>
                    R$ {balData.balance.equity.total.toFixed(2)}
                  </Text>
                </View>
                <View style={[styles.lineRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>TOTAL</Text>
                  <Text style={[styles.totalValue, { color: Colors.warning }]}>
                    R$ {(balData.balance.liabilities.total + balData.balance.equity.total).toFixed(2)}
                  </Text>
                </View>
              </View>

              <View style={[styles.verifyBox, {
                backgroundColor: balData.verification.balanced ? Colors.successBg : Colors.errorBg,
                borderColor:     balData.verification.balanced ? Colors.success : Colors.error,
              }]}>
                <Ionicons
                  name={balData.verification.balanced ? 'checkmark-circle' : 'warning'}
                  size={18}
                  color={balData.verification.balanced ? Colors.success : Colors.error}
                />
                <Text style={[styles.verifyText, {
                  color: balData.verification.balanced ? Colors.success : Colors.error
                }]}>
                  {balData.verification.balanced
                    ? 'Balanço está balanceado (Ativo = Passivo + PL)'
                    : `Diferença: R$ ${Math.abs(balData.verification.difference).toFixed(2)}`}
                </Text>
              </View>
            </View>
          )}

          {/* Empty state */}
          {!loading && (
            (activeTab === 'dre' && !dreData) ||
            (activeTab === 'cashflow' && !cashData) ||
            (activeTab === 'balance' && !balData)
          ) && (
            <View style={styles.centered}>
              <Ionicons name="document-text-outline" size={56} color={Colors.gray[300]} />
              <Text style={styles.emptyText}>Nenhum dado disponível para este período</Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.background },
  content:      { padding: Spacing.md, paddingBottom: Spacing.xxl },
  centered:     { paddingVertical: 60, alignItems: 'center', gap: 12 },
  loadingText:  { fontSize: 14, color: Colors.textSecondary },
  emptyText:    { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  header:       { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: Spacing.md },
  headerIcon:   { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  headerTitle:  { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  headerSub:    { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  tabs:         { flexDirection: 'row', backgroundColor: Colors.white, borderRadius: BorderRadius.lg, marginBottom: Spacing.md, ...Shadow.sm },
  tab:          { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabText:      { fontSize: 12, fontWeight: '700', color: Colors.gray[400] },
  card:         { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing.md, ...Shadow.sm, borderWidth: 1, borderColor: Colors.border },
  reportTitle:  { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  reportPeriod: { fontSize: 12, color: Colors.textSecondary, marginTop: 4, marginBottom: 4 },
  section:      { marginBottom: Spacing.md },
  sectionTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5, paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: Colors.border, marginBottom: 8 },
  lineRow:      { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  lineLabel:    { fontSize: 13, color: Colors.textSecondary },
  lineValue:    { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  totalRow:     { borderTopWidth: 1, borderTopColor: Colors.border, marginTop: 4, paddingTop: 8 },
  totalLabel:   { fontSize: 13, fontWeight: '800', color: Colors.textPrimary },
  totalValue:   { fontSize: 15, fontWeight: '800' },
  resultBox:    { backgroundColor: Colors.gray[50], borderRadius: BorderRadius.md, padding: Spacing.md, marginTop: 4, borderWidth: 1, borderColor: Colors.border },
  resultLabel:  { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  resultValue:  { fontSize: 18, fontWeight: '800' },
  marginText:   { fontSize: 12, color: Colors.textMuted, marginTop: 6 },
  // Cashflow
  cashRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  cashMonth:    { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, width: 36 },
  cashBarRow:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cashBarLabel: { fontSize: 10, color: Colors.textMuted, width: 42 },
  cashTrack:    { flex: 1, height: 8, backgroundColor: Colors.gray[100], borderRadius: 4, overflow: 'hidden' },
  cashFill:     { height: '100%', borderRadius: 4 },
  cashAmount:   { fontSize: 10, fontWeight: '600', color: Colors.textSecondary, width: 52, textAlign: 'right' },
  cashNet:      { fontSize: 12, fontWeight: '800', width: 60, textAlign: 'right' },
  // Balance
  verifyBox:    { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: BorderRadius.md, padding: 12, marginTop: 4, borderWidth: 1 },
  verifyText:   { fontSize: 12, fontWeight: '600', flex: 1 },
});