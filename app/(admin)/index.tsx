import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { BarChart } from 'react-native-gifted-charts';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/colors';

// ── Tipos espelhando 100% o shape real da API ─────────────────────────────────

interface DashboardResponse {
  barbershops: {
    total:        number;
    active:       number;
    expired:      number;
    newThisMonth: number;
  };
  users:        { total: number };
  customers:    { total: number };
  appointments: { total: number };
  subscriptions: {
    active:  number;
    pending: number;
  };
  revenue: {
    total:     number;
    thisMonth: number;
    mrr:       number;
  };
}

interface PlanStats {
  active:       number;
  expired:      number;
  trial:        number;
  expiringSoon: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function AdminDashboardScreen() {
  const { barberUser, barberSignOut } = useAuthStore();

  const [dashboard,  setDashboard]  = useState<DashboardResponse | null>(null);
  const [planStats,  setPlanStats]  = useState<PlanStats | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [dashRes, planRes] = await Promise.all([
        api.get<DashboardResponse>('/admin/dashboard'),
        api.get<PlanStats>('/admin/plan-stats'),
      ]);
      setDashboard(dashRes.data);
      setPlanStats(planRes.data);
    } catch (e) {
      console.error('Erro ao carregar admin dashboard:', e);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function handleSignOut() {
    Alert.alert('Sair', 'Deseja realmente sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair', style: 'destructive',
        onPress: async () => {
          await barberSignOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Carregando painel...</Text>
      </View>
    );
  }

  const bs  = dashboard?.barbershops;
  const rev = dashboard?.revenue;
  const sub = dashboard?.subscriptions;

  // Dados do gráfico — mesmo shape do BarbershopsStatsChart.tsx do web
  const barData = [
    { value: planStats?.active       || 0, label: 'Ativas',    frontColor: '#10b981' },
    { value: planStats?.expired      || 0, label: 'Expiradas', frontColor: '#ef4444' },
    { value: planStats?.trial        || 0, label: 'Trial',     frontColor: '#3b82f6' },
    { value: planStats?.expiringSoon || 0, label: 'Expirando', frontColor: '#f59e0b' },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Dashboard Administrativo</Text>
          <Text style={styles.headerSub}>Visão geral do sistema BarberFlow</Text>
        </View>
        <TouchableOpacity onPress={handleSignOut} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color={Colors.error} />
        </TouchableOpacity>
      </View>

      {/* ── Voltar ao Dashboard da Barbearia ───────────────────────────────── */}
      <TouchableOpacity
        style={styles.backToDashBtn}
        onPress={() => router.replace('/(barbeiro)')}
        activeOpacity={0.85}
      >
        <Ionicons name="arrow-back" size={18} color={Colors.white} />
        <Text style={styles.backToDashText}>Voltar ao Dashboard</Text>
      </TouchableOpacity>

      {/* ── 4 Cards do topo — idênticos ao web ─────────────────────────────── */}
      <View style={styles.cardsGrid}>

        {/* Barbearias Ativas */}
        <View style={styles.statCard}>
          <View style={styles.statCardTop}>
            <View style={[styles.statIcon, { backgroundColor: '#dcfce7' }]}>
              <Ionicons name="checkmark-circle" size={22} color="#16a34a" />
            </View>
            <Text style={[styles.statBadge, { color: '#16a34a' }]}>Ativas</Text>
          </View>
          <Text style={styles.statLabel}>Barbearias Ativas</Text>
          <Text style={styles.statValue}>{bs?.active || 0}</Text>
          <Text style={styles.statSub}>Total: {bs?.total || 0}</Text>
        </View>

        {/* Barbearias Expiradas */}
        <View style={styles.statCard}>
          <View style={styles.statCardTop}>
            <View style={[styles.statIcon, { backgroundColor: '#fee2e2' }]}>
              <Ionicons name="alert-circle" size={22} color="#dc2626" />
            </View>
            <Text style={[styles.statBadge, { color: '#dc2626' }]}>Expiradas</Text>
          </View>
          <Text style={styles.statLabel}>Barbearias Expiradas</Text>
          <Text style={styles.statValue}>{bs?.expired || 0}</Text>
          <Text style={styles.statSub}>Sem acesso ao sistema</Text>
        </View>

        {/* MRR */}
        <View style={styles.statCard}>
          <View style={styles.statCardTop}>
            <View style={[styles.statIcon, { backgroundColor: '#dcfce7' }]}>
              <Ionicons name="cash" size={22} color="#16a34a" />
            </View>
          </View>
          <Text style={styles.statLabel}>MRR</Text>
          <Text style={[styles.statValue, { fontSize: 18 }]}>
            {formatCurrency(rev?.mrr || 0)}
          </Text>
          <Text style={styles.statSub}>Mês: {formatCurrency(rev?.thisMonth || 0)}</Text>
        </View>

        {/* Assinaturas */}
        <View style={styles.statCard}>
          <View style={styles.statCardTop}>
            <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="checkmark-circle" size={22} color="#2563eb" />
            </View>
            {(sub?.pending || 0) > 0 && (
              <Text style={[styles.statBadge, { color: '#ea580c' }]}>{sub!.pending}</Text>
            )}
          </View>
          <Text style={styles.statLabel}>Assinaturas</Text>
          <Text style={styles.statValue}>{sub?.active || 0}</Text>
          <Text style={styles.statSub}>Ativas</Text>
        </View>

      </View>

      {/* ── Gráfico: Status das Barbearias ─────────────────────────────────── */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <View>
            <Text style={styles.chartTitle}>Status das Barbearias</Text>
            <Text style={styles.chartSub}>Distribuição por status de plano</Text>
          </View>
          <TouchableOpacity onPress={load}>
            <Text style={styles.chartRefresh}>Atualizar</Text>
          </TouchableOpacity>
        </View>

        <BarChart
          data={barData}
          barWidth={48}
          spacing={24}
          roundedTop
          hideRules={false}
          rulesColor="#e5e7eb"
          xAxisColor="#9ca3af"
          yAxisColor="#9ca3af"
          xAxisLabelTextStyle={{ color: '#6b7280', fontSize: 11 }}
          yAxisTextStyle={{ color: '#6b7280', fontSize: 11 }}
          noOfSections={4}
          height={200}
          isAnimated
        />

        {/* Legendas — mesmas do web */}
        <View style={styles.legendRow}>
          {barData.map(item => (
            <View key={item.label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.frontColor }]} />
              <Text style={styles.legendLabel}>{item.label}</Text>
              <Text style={styles.legendValue}>{item.value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Receita Total — gradiente roxo igual ao web ─────────────────────── */}
      <View style={styles.revenueCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.revenueLabel}>Receita Total Acumulada</Text>
          <Text style={styles.revenueValue}>{formatCurrency(rev?.total || 0)}</Text>
        </View>
        <View style={styles.revenueIcon}>
          <Ionicons name="trending-up" size={32} color="rgba(255,255,255,0.9)" />
        </View>
      </View>

      {/* ── Ações Rápidas — 3 cards igual ao web ───────────────────────────── */}
      <Text style={styles.sectionTitle}>Ações Rápidas</Text>
      <View style={styles.actionsGrid}>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(admin)/barbearias' as any)}
          activeOpacity={0.8}
        >
          <Text style={styles.actionLabel}>Ver Todas as Barbearias</Text>
          <Text style={styles.actionSub}>Gerencie e visualize todas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(admin)/pagamentos' as any)}
          activeOpacity={0.8}
        >
          <Text style={styles.actionLabel}>Ver Pagamentos</Text>
          <Text style={styles.actionSub}>Acompanhe os pagamentos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={load}
          activeOpacity={0.8}
        >
          <Text style={styles.actionLabel}>Atualizar Dados</Text>
          <Text style={styles.actionSub}>Recarregar estatísticas</Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#f3f4f6' },
  content:     { padding: Spacing.md, gap: 16, paddingBottom: 40 },
  centered:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: Colors.textSecondary, fontSize: 14 },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#111827' },
  headerSub:   { fontSize: 13, color: '#6b7280', marginTop: 4 },
  logoutBtn:   { padding: 4 },

  // Botão voltar
  backToDashBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#1f2937', borderRadius: BorderRadius.lg,
    paddingVertical: 10, paddingHorizontal: Spacing.md,
  },
  backToDashText: { color: Colors.white, fontWeight: '600', fontSize: 14 },

  // Grid 2 colunas dos 4 cards
  cardsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
  },
  statCard: {
    width: '47.5%',
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.md, ...Shadow.sm,
    borderWidth: 1, borderColor: '#e5e7eb', gap: 4,
  },
  statCardTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8,
  },
  statIcon: {
    width: 44, height: 44, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  statBadge: { fontSize: 12, fontWeight: '600' },
  statLabel: { fontSize: 12, color: '#6b7280' },
  statValue: { fontSize: 26, fontWeight: '700', color: '#111827' },
  statSub:   { fontSize: 12, color: '#9ca3af', marginTop: 4 },

  // Gráfico
  chartCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.md, ...Shadow.sm,
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  chartHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 16,
  },
  chartTitle:   { fontSize: 16, fontWeight: '700', color: '#111827' },
  chartSub:     { fontSize: 12, color: '#6b7280', marginTop: 2 },
  chartRefresh: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  legendRow:    { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
  legendItem:   { alignItems: 'center', gap: 4 },
  legendDot:    { width: 10, height: 10, borderRadius: 5 },
  legendLabel:  { fontSize: 11, color: '#6b7280', fontWeight: '500' },
  legendValue:  { fontSize: 20, fontWeight: '700', color: '#111827' },

  // Card receita roxa
  revenueCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7c3aed',
    ...Shadow.sm,
  },
  revenueLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 6 },
  revenueValue: { color: Colors.white, fontSize: 32, fontWeight: '700' },
  revenueIcon:  {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Ações rápidas
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  actionsGrid:  { gap: 10 },
  actionCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.md, ...Shadow.sm,
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  actionLabel: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 4 },
  actionSub:   { fontSize: 12, color: '#6b7280' },
});