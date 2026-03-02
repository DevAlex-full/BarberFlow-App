import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, RefreshControl,
  TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '@/lib/api';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/colors';
import { RevenueChart } from '@/components/barbeiro/RevenueChart';
import { AppointmentsChart } from '@/components/barbeiro/AppointmentsChart';
import { useAuthStore } from '@/stores/authStore';

interface DashboardStats {
  totalCustomers: number;
  totalServices: number;
  todayAppointments: number;
  monthRevenue: number;
  upcomingAppointments: any[];
}

interface ChartData {
  revenueChart: Array<{ month: string; revenue: number }>;
  appointmentsChart: Array<{ date: string; count: number }>;
  topServices: Array<{ name: string; count: number; revenue: number }>;
  occupancyRate: string;
  comparison: {
    currentMonth: { revenue: number; appointments: number };
    previousMonth: { revenue: number; appointments: number };
    growth: { revenue: string; appointments: string };
  };
}

interface PlanStatus {
  plan: string;
  isExpired: boolean;
  isExpiringSoon: boolean;
  daysRemaining: number;
}

export default function DashboardScreen() {
  const { barberUser } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [planStatus, setPlanStatus] = useState<PlanStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const planRes = await api.get('/barbershop/plan-status');
      setPlanStatus(planRes.data);

      if (planRes.data.isExpired) {
        setLoading(false);
        return;
      }

      const [statsRes, chartsRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/charts'),
      ]);
      setStats(statsRes.data);
      setCharts(chartsRes.data);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Carregando dashboard...</Text>
      </View>
    );
  }

  // Plano expirado
  if (planStatus?.isExpired) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle" size={64} color={Colors.error} />
        <Text style={styles.expiredTitle}>Plano Expirado</Text>
        <Text style={styles.expiredText}>
          Seu plano expirou. Renove para continuar usando o BarberFlow.
        </Text>
        <TouchableOpacity
          style={styles.renewBtn}
          onPress={() => router.push('/(barbeiro)/planos')}
        >
          <Text style={styles.renewBtnText}>Ver Planos</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const validAppointments = stats?.upcomingAppointments?.filter(
    a => a?.customer && a?.service && a?.barber
  ) || [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Alerta de expiração */}
      {planStatus?.isExpiringSoon && (
        <TouchableOpacity
          style={styles.alertBanner}
          onPress={() => router.push('/(barbeiro)/planos')}
        >
          <Ionicons name="warning" size={20} color={Colors.warning} />
          <Text style={styles.alertText}>
            Seu plano expira em {planStatus.daysRemaining} dias! Toque para renovar.
          </Text>
        </TouchableOpacity>
      )}

      {/* Saudação */}
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>
          Olá, {barberUser?.name?.split(' ')[0]}! 👋
        </Text>
        <Text style={styles.greetingDate}>
          {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </Text>
      </View>

      {/* Cards de Stats — fiel ao web (grid 2x2) */}
      <View style={styles.statsGrid}>
        <StatCard
          label="Clientes"
          value={stats?.totalCustomers || 0}
          icon="people"
          color={Colors.accent[600]}
          bg="#eff6ff"
        />
        <StatCard
          label="Serviços"
          value={stats?.totalServices || 0}
          icon="cut"
          color={Colors.primary}
          bg="#faf5ff"
        />
        <StatCard
          label="Hoje"
          value={stats?.todayAppointments || 0}
          icon="calendar"
          color={Colors.success}
          bg={Colors.successBg}
        />
        <StatCard
          label="Receita/Mês"
          value={`R$ ${Number(stats?.monthRevenue || 0).toFixed(0)}`}
          icon="cash"
          color={Colors.warning}
          bg={Colors.warningBg}
          small
        />
      </View>

      {/* Ações Rápidas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ações Rápidas</Text>
        <View style={styles.quickActions}>
          <QuickAction icon="calendar" label="Agendamentos" onPress={() => router.push('/(barbeiro)/agendamentos')} />
          <QuickAction icon="people"   label="Clientes"     onPress={() => router.push('/(barbeiro)/clientes')} />
          <QuickAction icon="cut"      label="Serviços"     onPress={() => router.push('/(barbeiro)/servicos')} />
          <QuickAction icon="cash"     label="Financeiro"   onPress={() => router.push('/(barbeiro)/financeiro')} />
          <QuickAction icon="bar-chart" label="Analytics"   onPress={() => router.push('/(barbeiro)/analytics')} />
          <QuickAction icon="document-text" label="Relatórios" onPress={() => router.push('/(barbeiro)/relatorios')} />
        </View>
      </View>

      {/* Gráficos */}
      {charts && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Receita Mensal</Text>
          <RevenueChart data={charts.revenueChart} />
        </View>
      )}

      {charts && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Agendamentos (30 dias)</Text>
          <AppointmentsChart data={charts.appointmentsChart} />
        </View>
      )}

      {/* Comparativo do mês */}
      {charts?.comparison && (
        <View style={styles.comparisonCard}>
          <Text style={styles.sectionTitle}>Comparativo do Mês</Text>
          <View style={styles.comparisonRow}>
            <View style={styles.comparisonItem}>
              <Text style={styles.comparisonLabel}>Receita</Text>
              <Text style={styles.comparisonValue}>
                R$ {Number(charts.comparison.currentMonth.revenue).toFixed(2)}
              </Text>
              <GrowthBadge value={charts.comparison.growth.revenue} />
            </View>
            <View style={styles.comparisonDivider} />
            <View style={styles.comparisonItem}>
              <Text style={styles.comparisonLabel}>Agendamentos</Text>
              <Text style={styles.comparisonValue}>
                {charts.comparison.currentMonth.appointments}
              </Text>
              <GrowthBadge value={charts.comparison.growth.appointments} />
            </View>
          </View>
        </View>
      )}

      {/* Próximos Agendamentos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Próximos Agendamentos</Text>
        {validAppointments.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="calendar-outline" size={40} color={Colors.gray[300]} />
            <Text style={styles.emptyText}>Nenhum agendamento próximo</Text>
          </View>
        ) : (
          validAppointments.map(appointment => (
            <AppointmentItem key={appointment.id} appointment={appointment} />
          ))
        )}
      </View>
    </ScrollView>
  );
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color, bg, small }: any) {
  return (
    <View style={[styles.statCard, { backgroundColor: bg }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={22} color={color} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, small && { fontSize: 18 }]}>{value}</Text>
    </View>
  );
}

function QuickAction({ icon, label, onPress }: any) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.quickActionIcon}>
        <Ionicons name={icon as any} size={22} color={Colors.primary} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function GrowthBadge({ value }: { value: string }) {
  const num = parseFloat(value);
  const isPositive = num >= 0;
  return (
    <View style={[styles.growthBadge, { backgroundColor: isPositive ? Colors.successBg : Colors.errorBg }]}>
      <Ionicons
        name={isPositive ? 'trending-up' : 'trending-down'}
        size={12}
        color={isPositive ? Colors.success : Colors.error}
      />
      <Text style={[styles.growthText, { color: isPositive ? Colors.success : Colors.error }]}>
        {isPositive ? '+' : ''}{value}%
      </Text>
    </View>
  );
}

function AppointmentItem({ appointment }: any) {
  return (
    <View style={styles.appointmentCard}>
      <View style={styles.appointmentAvatar}>
        <Text style={styles.appointmentAvatarText}>
          {appointment.customer.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.appointmentInfo}>
        <Text style={styles.appointmentName}>{appointment.customer.name}</Text>
        <Text style={styles.appointmentService}>{appointment.service.name}</Text>
        <Text style={styles.appointmentBarber}>✂️ {appointment.barber.name}</Text>
      </View>
      <View style={styles.appointmentTime}>
        <Text style={styles.appointmentDate}>
          {format(new Date(appointment.date), "dd/MM", { locale: ptBR })}
        </Text>
        <Text style={styles.appointmentHour}>
          {format(new Date(appointment.date), "HH:mm")}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: Spacing.lg },
  loadingText: { color: Colors.textSecondary, fontSize: 14, marginTop: 8 },

  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.warningBg, borderRadius: BorderRadius.md,
    padding: Spacing.sm, marginBottom: Spacing.sm,
    borderLeftWidth: 4, borderLeftColor: Colors.warning,
  },
  alertText: { flex: 1, fontSize: 13, color: Colors.warning, fontWeight: '600' },

  greeting: { marginBottom: Spacing.md },
  greetingText: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  greetingDate: { fontSize: 13, color: Colors.textSecondary, marginTop: 2, textTransform: 'capitalize' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: Spacing.md },
  statCard: {
    flex: 1, minWidth: '45%', borderRadius: BorderRadius.lg,
    padding: Spacing.md, ...Shadow.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  statIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500', marginBottom: 4 },
  statValue: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary },

  section: { marginBottom: Spacing.md },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm },

  quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickAction: { alignItems: 'center', gap: 6, width: '30%' },
  quickActionIcon: {
    width: 52, height: 52, borderRadius: BorderRadius.lg,
    backgroundColor: '#faf5ff', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#e9d5ff',
  },
  quickActionLabel: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary, textAlign: 'center' },

  comparisonCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.md, ...Shadow.sm, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  comparisonRow: { flexDirection: 'row', alignItems: 'center' },
  comparisonItem: { flex: 1, alignItems: 'center', gap: 4 },
  comparisonDivider: { width: 1, height: 60, backgroundColor: Colors.border },
  comparisonLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  comparisonValue: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  growthBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full },
  growthText: { fontSize: 11, fontWeight: '700' },

  emptyBox: { alignItems: 'center', padding: Spacing.xl, gap: 8 },
  emptyText: { color: Colors.textSecondary, fontSize: 14 },

  appointmentCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: 8, ...Shadow.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  appointmentAvatar: {
    width: 44, height: 44, borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  appointmentAvatarText: { color: Colors.white, fontWeight: '700', fontSize: 18 },
  appointmentInfo: { flex: 1 },
  appointmentName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  appointmentService: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  appointmentBarber: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  appointmentTime: { alignItems: 'flex-end' },
  appointmentDate: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  appointmentHour: { fontSize: 13, color: Colors.textSecondary },

  expiredTitle: { fontSize: 22, fontWeight: '700', color: Colors.error },
  expiredText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  renewBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: BorderRadius.lg, marginTop: 8 },
  renewBtnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
});