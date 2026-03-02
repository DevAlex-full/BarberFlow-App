import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '@/lib/api';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/colors';

export default function FinanceiroScreen() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await api.get('/finance/summary');
      setSummary(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const income  = Number(summary?.totalIncome  || 0);
  const expense = Number(summary?.totalExpense || 0);
  const balance = income - expense;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Cards de resumo */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Saldo do Mês</Text>
        <Text style={[styles.balanceValue, { color: balance >= 0 ? Colors.success : Colors.error }]}>
          R$ {balance.toFixed(2)}
        </Text>
      </View>

      <View style={styles.row}>
        <View style={[styles.summaryCard, { borderLeftColor: Colors.success }]}>
          <Ionicons name="arrow-up-circle" size={28} color={Colors.success} />
          <Text style={styles.summaryLabel}>Receitas</Text>
          <Text style={[styles.summaryValue, { color: Colors.success }]}>R$ {income.toFixed(2)}</Text>
        </View>
        <View style={[styles.summaryCard, { borderLeftColor: Colors.error }]}>
          <Ionicons name="arrow-down-circle" size={28} color={Colors.error} />
          <Text style={styles.summaryLabel}>Despesas</Text>
          <Text style={[styles.summaryValue, { color: Colors.error }]}>R$ {expense.toFixed(2)}</Text>
        </View>
      </View>

      {/* Navegação para sub-telas */}
      <Text style={styles.sectionTitle}>Módulos</Text>

      {[
        { icon: 'swap-horizontal',  label: 'Transações',  sub: 'Receitas e despesas',    route: '/(barbeiro)/financeiro/transacoes' },
        { icon: 'people',           label: 'Comissões',   sub: 'Comissões dos barbeiros', route: '/(barbeiro)/financeiro/comissoes' },
        { icon: 'flag',             label: 'Metas',       sub: 'Acompanhe suas metas',   route: '/(barbeiro)/financeiro/metas' },
      ].map(item => (
        <TouchableOpacity
          key={item.route}
          style={styles.moduleCard}
          onPress={() => router.push(item.route as any)}
          activeOpacity={0.75}
        >
          <View style={styles.moduleIcon}>
            <Ionicons name={item.icon as any} size={24} color={Colors.primary} />
          </View>
          <View style={styles.moduleInfo}>
            <Text style={styles.moduleLabel}>{item.label}</Text>
            <Text style={styles.moduleSub}>{item.sub}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.gray[400]} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, gap: 16, paddingBottom: Spacing.xxl },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  balanceCard: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.xl,
    padding: Spacing.lg, alignItems: 'center',
  },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' },
  balanceValue: { fontSize: 36, fontWeight: '700', color: Colors.white, marginTop: 4 },
  row: { flexDirection: 'row', gap: 12 },
  summaryCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.md, borderLeftWidth: 4, ...Shadow.sm,
    borderWidth: 1, borderColor: Colors.border, gap: 4,
  },
  summaryLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  summaryValue: { fontSize: 18, fontWeight: '700' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  moduleCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.md, ...Shadow.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  moduleIcon: {
    width: 48, height: 48, borderRadius: BorderRadius.lg,
    backgroundColor: '#faf5ff', alignItems: 'center', justifyContent: 'center',
  },
  moduleInfo: { flex: 1 },
  moduleLabel: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  moduleSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
});