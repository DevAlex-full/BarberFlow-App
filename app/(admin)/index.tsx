import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/colors';

// ── Tipos espelhando 100% o shape real de admin.routes.ts ────────────────────

interface DashboardResponse {
  barbershops: {
    total:        number;
    active:       number;
    expired:      number;
    newThisMonth: number;
  };
  users:     { total: number };
  customers: { total: number };
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

// ── Componente ───────────────────────────────────────────────────────────────

export default function AdminDashboardScreen() {
  const { barberUser, barberSignOut } = useAuthStore();

  const [dashboard,   setDashboard]   = useState<DashboardResponse | null>(null);
  const [planStats,   setPlanStats]   = useState<PlanStats | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      // ✅ Dois endpoints paralelos — shapes 100% mapeados do admin.routes.ts
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

  // Atalhos rápidos para campos usados repetidamente
  const bs  = dashboard?.barbershops;
  const rev = dashboard?.revenue;
  const sub = dashboard?.subscriptions;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>⚡ Super Admin</Text>
          <Text style={styles.headerSub}>Olá, {barberUser?.name?.split(' ')[0]}!</Text>
        </View>
        <TouchableOpacity onPress={handleSignOut} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color={Colors.error} />
        </TouchableOpacity>
      </View>

      {/* Voltar ao Dashboard da Barbearia */}
      <TouchableOpacity
        style={styles.backToDashBtn}
        onPress={() => router.replace('/(barbeiro)')}
        activeOpacity={0.85}
      >
        <Ionicons name="storefront-outline" size={20} color={Colors.white} />
        <Text style={styles.backToDashText}>Voltar ao Dashboard da Barbearia</Text>
        <Ionicons name="arrow-forward" size={18} color={Colors.white} />
      </TouchableOpacity>

      {/* ── Barbearias ─────────────────────────────────────────────────────── */}
      <Text style={styles.sectionTitle}>Barbearias</Text>
      <View style={styles.grid}>
        <StatCard label="Total"     value={bs?.total   || 0} icon="storefront"       color={Colors.primary} bg="#faf5ff" />
        <StatCard label="Ativas"    value={bs?.active   || 0} icon="checkmark-circle" color={Colors.success} bg={Colors.successBg} />
      </View>
      <View style={styles.grid}>
        <StatCard label="Expiradas" value={bs?.expired  || 0} icon="close-circle"    color={Colors.error}   bg={Colors.errorBg}   />
        <StatCard label="Trial"     value={planStats?.trial || 0} icon="time"        color={Colors.warning} bg={Colors.warningBg} />
      </View>

      {/* Expirando em breve — só mostra se > 0 */}
      {(planStats?.expiringSoon || 0) > 0 && (
        <View style={styles.alertBanner}>
          <Ionicons name="warning" size={18} color={Colors.warning} />
          <Text style={styles.alertText}>
            {planStats!.expiringSoon} barbearia{planStats!.expiringSoon > 1 ? 's' : ''} expira{planStats!.expiringSoon === 1 ? '' : 'm'} em até 7 dias
          </Text>
        </View>
      )}

      {/* ── Usuários & Clientes ─────────────────────────────────────────────── */}
      <Text style={styles.sectionTitle}>Usuários</Text>
      <View style={styles.grid}>
        <StatCard label="Barbeiros"     value={dashboard?.users.total      || 0} icon="cut"    color="#2563eb"       bg="#eff6ff" />
        <StatCard label="Clientes"      value={dashboard?.customers.total  || 0} icon="people" color={Colors.warning} bg={Colors.warningBg} />
      </View>
      <View style={styles.grid}>
        <StatCard label="Agendamentos"  value={dashboard?.appointments.total || 0} icon="calendar" color="#7c3aed" bg="#f5f3ff" />
        <StatCard label="Novas p/ mês"  value={bs?.newThisMonth || 0} icon="trending-up" color={Colors.success} bg={Colors.successBg} />
      </View>

      {/* ── Receita ─────────────────────────────────────────────────────────── */}
      <Text style={styles.sectionTitle}>Receita</Text>
      <View style={styles.revenueCard}>
        <View style={styles.revenueItem}>
          <Text style={styles.revenueLabel}>MRR</Text>
          <Text style={[styles.revenueValue, { color: Colors.primary }]}>
            R$ {Number(rev?.mrr || 0).toFixed(2)}
          </Text>
        </View>
        <View style={styles.revenueDivider} />
        <View style={styles.revenueItem}>
          <Text style={styles.revenueLabel}>Este Mês</Text>
          <Text style={styles.revenueValue}>
            R$ {Number(rev?.thisMonth || 0).toFixed(2)}
          </Text>
        </View>
        <View style={styles.revenueDivider} />
        <View style={styles.revenueItem}>
          <Text style={styles.revenueLabel}>Total</Text>
          <Text style={styles.revenueValue}>
            R$ {Number(rev?.total || 0).toFixed(2)}
          </Text>
        </View>
      </View>

      {/* ── Assinaturas ─────────────────────────────────────────────────────── */}
      <View style={styles.grid}>
        <View style={[styles.metricCard, { borderLeftColor: Colors.success }]}>
          <Ionicons name="checkmark-circle-outline" size={22} color={Colors.success} />
          <Text style={styles.metricValue}>{sub?.active || 0}</Text>
          <Text style={styles.metricLabel}>Assinaturas Ativas</Text>
        </View>
        <View style={[styles.metricCard, { borderLeftColor: Colors.warning }]}>
          <Ionicons name="time-outline" size={22} color={Colors.warning} />
          <Text style={styles.metricValue}>{sub?.pending || 0}</Text>
          <Text style={styles.metricLabel}>Pendentes</Text>
        </View>
      </View>

      {/* ── Acesso Rápido ───────────────────────────────────────────────────── */}
      <Text style={styles.sectionTitle}>Acesso Rápido</Text>
      <View style={styles.actions}>
        {[
          { icon: 'storefront-outline', label: 'Barbearias', sub: 'Gerencie e visualize todas', route: '/(admin)/barbearias' },
          { icon: 'card-outline',       label: 'Pagamentos', sub: 'Acompanhe os pagamentos',   route: '/(admin)/pagamentos' },
        ].map(item => (
          <TouchableOpacity
            key={item.label}
            style={styles.actionCard}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.8}
          >
            <View style={styles.actionIcon}>
              <Ionicons name={item.icon as any} size={26} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionLabel}>{item.label}</Text>
              <Text style={styles.actionSub}>{item.sub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.gray[400]} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

// ── Sub-componente ────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color, bg }: {
  label: string; value: number; icon: string; color: string; bg: string;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: bg }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={22} color={color} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.background },
  content:     { padding: Spacing.md, gap: 12, paddingBottom: Spacing.xxl },
  centered:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: Colors.textSecondary, fontSize: 14 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.md, ...Shadow.sm, borderWidth: 1, borderColor: Colors.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  headerSub:   { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  logoutBtn:   { padding: 8 },

  backToDashBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: Colors.navy, borderRadius: BorderRadius.xl,
    padding: Spacing.md, ...Shadow.sm,
  },
  backToDashText: {
    flex: 1, color: Colors.white, fontWeight: '700', fontSize: 14, textAlign: 'center',
  },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginTop: 4 },

  grid: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1, borderRadius: BorderRadius.lg, padding: Spacing.md,
    ...Shadow.sm, borderWidth: 1, borderColor: Colors.border,
  },
  statIcon:  { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500', marginBottom: 4 },
  statValue: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary },

  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.warningBg, borderRadius: BorderRadius.md,
    padding: Spacing.sm, borderLeftWidth: 4, borderLeftColor: Colors.warning,
  },
  alertText: { flex: 1, fontSize: 13, color: Colors.warning, fontWeight: '600' },

  revenueCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.md, flexDirection: 'row', alignItems: 'center',
    ...Shadow.sm, borderWidth: 1, borderColor: Colors.border,
  },
  revenueItem:    { flex: 1, alignItems: 'center', gap: 4 },
  revenueLabel:   { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },
  revenueValue:   { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  revenueDivider: { width: 1, height: 40, backgroundColor: Colors.border },

  metricCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.md, borderLeftWidth: 4, ...Shadow.sm,
    borderWidth: 1, borderColor: Colors.border, gap: 4,
  },
  metricValue: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary },
  metricLabel: { fontSize: 12, color: Colors.textSecondary },

  actions:    { gap: 10 },
  actionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.md, ...Shadow.sm, borderWidth: 1, borderColor: Colors.border,
  },
  actionIcon: {
    width: 50, height: 50, borderRadius: BorderRadius.lg,
    backgroundColor: '#faf5ff', alignItems: 'center', justifyContent: 'center',
  },
  actionLabel: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  actionSub:   { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
});