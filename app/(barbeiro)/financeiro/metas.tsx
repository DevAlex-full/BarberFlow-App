import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '@/lib/api';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/colors';

interface Goal {
  id: string;
  title: string;
  type: 'revenue' | 'appointments' | 'clients' | 'custom';
  targetValue: number;
  currentValue: number;
  period: 'daily' | 'weekly' | 'monthly';
  deadline?: string;
  status: 'active' | 'completed' | 'failed';
}

const TYPE_ICONS: Record<string, string> = {
  revenue:      'cash',
  appointments: 'calendar',
  clients:      'people',
  custom:       'flag',
};

const TYPE_COLORS: Record<string, string> = {
  revenue:      Colors.success,
  appointments: Colors.primary,
  clients:      '#2563eb',
  custom:       Colors.warning,
};

const PERIOD_LABELS: Record<string, string> = {
  daily:   'Diária',
  weekly:  'Semanal',
  monthly: 'Mensal',
};

export default function MetasScreen() {
  const [goals, setGoals]         = useState<Goal[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab]             = useState<'active' | 'completed'>('active');

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await api.get('/finance/goals');
      setGoals(res.data || []);
    } catch (e) {
      console.error('Erro ao carregar metas:', e);
      setGoals([]);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const activeGoals    = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');
  const displayGoals   = tab === 'active' ? activeGoals : completedGoals;

  const totalActive    = activeGoals.length;
  const totalCompleted = completedGoals.length;
  const avgProgress    = activeGoals.length > 0
    ? activeGoals.reduce((s, g) => s + Math.min((g.currentValue / g.targetValue) * 100, 100), 0) / activeGoals.length
    : 0;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Metas</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Resumo */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { borderTopColor: Colors.primary }]}>
            <Ionicons name="flag" size={22} color={Colors.primary} />
            <Text style={styles.summaryLabel}>Em Andamento</Text>
            <Text style={[styles.summaryValue, { color: Colors.primary }]}>{totalActive}</Text>
          </View>
          <View style={[styles.summaryCard, { borderTopColor: Colors.success }]}>
            <Ionicons name="checkmark-circle" size={22} color={Colors.success} />
            <Text style={styles.summaryLabel}>Concluídas</Text>
            <Text style={[styles.summaryValue, { color: Colors.success }]}>{totalCompleted}</Text>
          </View>
        </View>

        {/* Progresso médio */}
        {totalActive > 0 && (
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Progresso Médio das Metas</Text>
              <Text style={styles.progressPct}>{avgProgress.toFixed(0)}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${avgProgress}%` }]} />
            </View>
            <Text style={styles.progressNote}>
              {totalActive} meta{totalActive !== 1 ? 's' : ''} ativa{totalActive !== 1 ? 's' : ''}
            </Text>
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'active' && styles.tabBtnActive]}
            onPress={() => setTab('active')}
          >
            <Text style={[styles.tabText, tab === 'active' && styles.tabTextActive]}>
              Em Andamento ({totalActive})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'completed' && styles.tabBtnActive]}
            onPress={() => setTab('completed')}
          >
            <Text style={[styles.tabText, tab === 'completed' && styles.tabTextActive]}>
              Concluídas ({totalCompleted})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Lista */}
        {displayGoals.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="flag-outline" size={48} color={Colors.gray[300]} />
            <Text style={styles.emptyText}>
              {tab === 'active' ? 'Nenhuma meta em andamento' : 'Nenhuma meta concluída'}
            </Text>
            {tab === 'active' && (
              <Text style={styles.emptySubText}>
                As metas são criadas no painel web
              </Text>
            )}
          </View>
        ) : (
          displayGoals.map(g => <GoalCard key={g.id} goal={g} />)
        )}
      </ScrollView>
    </View>
  );
}

function GoalCard({ goal: g }: { goal: Goal }) {
  const progress   = Math.min((g.currentValue / g.targetValue) * 100, 100);
  const isComplete = g.status === 'completed';
  const color      = TYPE_COLORS[g.type] || Colors.primary;
  const icon       = TYPE_ICONS[g.type] || 'flag';

  const formatValue = (v: number) => {
    if (g.type === 'revenue') return `R$ ${v.toFixed(2)}`;
    return v.toString();
  };

  return (
    <View style={[styles.card, isComplete && styles.cardComplete]}>
      <View style={styles.cardTop}>
        <View style={[styles.cardIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon as any} size={22} color={color} />
        </View>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{g.title}</Text>
          <View style={styles.cardMeta}>
            <Text style={styles.cardPeriod}>{PERIOD_LABELS[g.period]}</Text>
            {isComplete && (
              <View style={styles.completeBadge}>
                <Ionicons name="checkmark" size={11} color={Colors.success} />
                <Text style={styles.completeBadgeText}>Concluída</Text>
              </View>
            )}
          </View>
        </View>
        <Text style={[styles.cardPct, { color }]}>{progress.toFixed(0)}%</Text>
      </View>

      {/* Barra de progresso */}
      <View style={styles.bar}>
        <View style={[styles.barFill, { width: `${progress}%`, backgroundColor: color }]} />
      </View>

      {/* Valores */}
      <View style={styles.cardValues}>
        <Text style={styles.cardCurrent}>
          {formatValue(g.currentValue)} <Text style={styles.cardSlash}>/ </Text>
          <Text style={styles.cardTarget}>{formatValue(g.targetValue)}</Text>
        </Text>
        <Text style={styles.cardRemaining}>
          {isComplete ? '✅ Meta batida!' : `Faltam: ${formatValue(g.targetValue - g.currentValue)}`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.white, paddingHorizontal: Spacing.md,
    paddingTop: 56, paddingBottom: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  content:     { padding: Spacing.md, gap: 16, paddingBottom: 40 },
  summaryRow:  { flexDirection: 'row', gap: 12 },
  summaryCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.md, borderTopWidth: 3, ...Shadow.sm,
    borderWidth: 1, borderColor: Colors.border, gap: 4,
  },
  summaryLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  summaryValue: { fontSize: 22, fontWeight: '700' },
  progressCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.md, ...Shadow.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  progressTitle:  { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  progressPct:    { fontSize: 22, fontWeight: '700', color: Colors.primary },
  progressBar: {
    height: 8, backgroundColor: Colors.gray[100], borderRadius: 4, overflow: 'hidden', marginBottom: 6,
  },
  progressFill:  { height: '100%', backgroundColor: Colors.primary, borderRadius: 4 },
  progressNote:  { fontSize: 12, color: Colors.textSecondary },
  tabs: {
    flexDirection: 'row', backgroundColor: Colors.gray[100],
    borderRadius: BorderRadius.lg, padding: 4,
  },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: BorderRadius.md },
  tabBtnActive: { backgroundColor: Colors.white },
  tabText:      { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: Colors.primary },
  empty: { alignItems: 'center', paddingTop: 40, gap: 8 },
  emptyText:    { color: Colors.textSecondary, fontSize: 15, fontWeight: '600' },
  emptySubText: { color: Colors.textMuted, fontSize: 13 },
  card: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.md, ...Shadow.sm,
    borderWidth: 1, borderColor: Colors.border, gap: 10,
  },
  cardComplete: { opacity: 0.85, borderColor: Colors.success },
  cardTop:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardIcon:  { width: 44, height: 44, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  cardHeader: { flex: 1 },
  cardTitle:  { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  cardMeta:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  cardPeriod: { fontSize: 11, color: Colors.textSecondary },
  completeBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: Colors.successBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  completeBadgeText: { fontSize: 10, color: Colors.success, fontWeight: '600' },
  cardPct:    { fontSize: 18, fontWeight: '700' },
  bar:        { height: 6, backgroundColor: Colors.gray[100], borderRadius: 3, overflow: 'hidden' },
  barFill:    { height: '100%', borderRadius: 3 },
  cardValues: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardCurrent:   { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  cardSlash:     { color: Colors.gray[300] },
  cardTarget:    { fontWeight: '400', color: Colors.textSecondary },
  cardRemaining: { fontSize: 12, color: Colors.textSecondary },
});