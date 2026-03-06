import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/colors';

// ─── Tipos (espelham /analytics/overview do backend) ─────────────────────────

interface KPI {
  label:  string;
  value:  string | number;
  change: string;
  trend:  'up' | 'down' | 'neutral';
  icon:   string;
  color:  string;
}

interface Insight {
  type:    string;
  title:   string;
  message: string;
  icon:    string;
}

interface BarberPerformance {
  name:         string;
  appointments: number;
  revenue:      number;
  rating:       number;
}

interface HeatmapData {
  day:   string;
  hours: Record<string, number>;
}

interface AnalyticsData {
  kpis:              KPI[];
  insights:          Insight[];
  barberPerformance: BarberPerformance[];
  heatmap:           HeatmapData[];
  customers: {
    newCustomers:      number;
    returningCustomers: number;
    retentionRate:     string;
    avgVisitsPerCustomer: number;
  };
  conversionFunnel: {
    viewed:    number;
    scheduled: number;
    completed: number;
  };
}

export default function AnalyticsScreen() {
  const [data, setData]         = useState<AnalyticsData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadAnalytics(); }, []);

  async function loadAnalytics() {
    try {
      // ✅ Endpoint correto: /analytics/overview
      const res = await api.get('/analytics/overview');
      setData(res.data);
    } catch (e) {
      console.error('Erro ao carregar analytics:', e);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Carregando analytics...</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.centered}>
        <Ionicons name="bar-chart-outline" size={56} color={Colors.gray[300]} />
        <Text style={styles.emptyTitle}>Sem dados disponíveis</Text>
        <Text style={styles.emptyText}>Nenhum dado de analytics encontrado</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadAnalytics}>
          <Text style={styles.retryBtnText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="bar-chart" size={22} color={Colors.white} />
        </View>
        <View>
          <Text style={styles.headerTitle}>Analytics Avançados</Text>
          <Text style={styles.headerSub}>Insights inteligentes em tempo real</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <Ionicons name="refresh" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* KPIs */}
      {data.kpis?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Indicadores Chave</Text>
          <View style={styles.kpiGrid}>
            {data.kpis.map((kpi, i) => (
              <View key={i} style={styles.kpiCard}>
                <View style={[styles.kpiIcon, { backgroundColor: kpi.color + '20' }]}>
                  <Ionicons name={kpi.icon as any} size={20} color={kpi.color} />
                </View>
                <Text style={styles.kpiLabel}>{kpi.label}</Text>
                <Text style={styles.kpiValue}>{kpi.value}</Text>
                <View style={[styles.kpiBadge, {
                  backgroundColor: kpi.trend === 'up' ? Colors.successBg : kpi.trend === 'down' ? Colors.errorBg : Colors.gray[100]
                }]}>
                  <Ionicons
                    name={kpi.trend === 'up' ? 'trending-up' : kpi.trend === 'down' ? 'trending-down' : 'remove'}
                    size={12}
                    color={kpi.trend === 'up' ? Colors.success : kpi.trend === 'down' ? Colors.error : Colors.gray[500]}
                  />
                  <Text style={[styles.kpiBadgeText, {
                    color: kpi.trend === 'up' ? Colors.success : kpi.trend === 'down' ? Colors.error : Colors.gray[500]
                  }]}>{kpi.change}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Insights */}
      {data.insights?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Insights</Text>
          {data.insights.map((insight, i) => (
            <View key={i} style={[styles.insightCard, {
              borderLeftColor: insight.type === 'positive' ? Colors.success : insight.type === 'warning' ? Colors.warning : Colors.accent[500]
            }]}>
              <Text style={styles.insightTitle}>{insight.icon} {insight.title}</Text>
              <Text style={styles.insightMsg}>{insight.message}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Clientes */}
      {data.customers && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👥 Análise de Clientes</Text>
          <View style={styles.card}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statVal}>{data.customers.newCustomers}</Text>
                <Text style={styles.statLbl}>Novos</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statVal}>{data.customers.returningCustomers}</Text>
                <Text style={styles.statLbl}>Recorrentes</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statVal}>{data.customers.retentionRate}%</Text>
                <Text style={styles.statLbl}>Retenção</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statVal}>{Number(data.customers.avgVisitsPerCustomer).toFixed(1)}</Text>
                <Text style={styles.statLbl}>Visitas/Cliente</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Performance dos Barbeiros */}
      {data.barberPerformance?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✂️ Performance dos Barbeiros</Text>
          {data.barberPerformance.map((barber, i) => (
            <View key={i} style={styles.barberCard}>
              <View style={styles.barberAvatar}>
                <Text style={styles.barberAvatarText}>{barber.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.barberName}>{barber.name}</Text>
                <Text style={styles.barberSub}>{barber.appointments} atendimentos</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.barberRevenue}>R$ {Number(barber.revenue).toFixed(0)}</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={12} color="#f59e0b" />
                  <Text style={styles.ratingText}>{Number(barber.rating).toFixed(1)}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Funil de Conversão */}
      {data.conversionFunnel && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔽 Funil de Conversão</Text>
          <View style={styles.card}>
            {[
              { label: 'Visualizações', value: data.conversionFunnel.viewed, color: '#8b5cf6' },
              { label: 'Agendamentos', value: data.conversionFunnel.scheduled, color: '#3b82f6' },
              { label: 'Concluídos',   value: data.conversionFunnel.completed, color: '#10b981' },
            ].map((step, i) => {
              const max = data.conversionFunnel.viewed || 1;
              const pct = Math.round((step.value / max) * 100);
              return (
                <View key={i} style={{ marginBottom: 12 }}>
                  <View style={styles.funnelRow}>
                    <Text style={styles.funnelLabel}>{step.label}</Text>
                    <Text style={styles.funnelValue}>{step.value} ({pct}%)</Text>
                  </View>
                  <View style={styles.funnelBar}>
                    <View style={[styles.funnelFill, { width: `${pct}%` as any, backgroundColor: step.color }]} />
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      <View style={styles.footer}>
        <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
        <Text style={styles.footerText}>
          Atualizado em {new Date().toLocaleString('pt-BR')}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.background },
  content:      { padding: Spacing.md, paddingBottom: Spacing.xxl },
  centered:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: Spacing.lg },
  loadingText:  { color: Colors.textSecondary, fontSize: 14 },
  emptyTitle:   { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  emptyText:    { fontSize: 14, color: Colors.textSecondary },
  retryBtn:     { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: BorderRadius.md, marginTop: 8 },
  retryBtnText: { color: Colors.white, fontWeight: '700' },

  header:      { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: Spacing.md },
  headerIcon:  { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  headerSub:   { fontSize: 13, color: Colors.textSecondary },
  refreshBtn:  { padding: 8, backgroundColor: '#faf5ff', borderRadius: 10, borderWidth: 1, borderColor: '#e9d5ff' },

  section:      { marginBottom: Spacing.md },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm },

  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpiCard: { flex: 1, minWidth: '45%', backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, ...Shadow.sm, borderWidth: 1, borderColor: Colors.border },
  kpiIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  kpiLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500', marginBottom: 4 },
  kpiValue: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  kpiBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start' },
  kpiBadgeText: { fontSize: 11, fontWeight: '700' },

  insightCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: 8, borderWidth: 1, borderColor: Colors.border, borderLeftWidth: 4 },
  insightTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  insightMsg:   { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },

  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, ...Shadow.sm, borderWidth: 1, borderColor: Colors.border },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: { width: 1, height: 40, backgroundColor: Colors.border },
  statVal: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  statLbl: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500', textAlign: 'center' },

  barberCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: 8, ...Shadow.sm, borderWidth: 1, borderColor: Colors.border },
  barberAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  barberAvatarText: { color: Colors.white, fontWeight: '700', fontSize: 18 },
  barberName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  barberSub:  { fontSize: 12, color: Colors.textSecondary },
  barberRevenue: { fontSize: 16, fontWeight: '700', color: Colors.success },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },

  funnelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  funnelLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  funnelValue: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  funnelBar: { height: 8, backgroundColor: Colors.gray[100], borderRadius: 4, overflow: 'hidden' },
  funnelFill: { height: '100%', borderRadius: 4 },

  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 8 },
  footerText: { fontSize: 12, color: Colors.textMuted },
});