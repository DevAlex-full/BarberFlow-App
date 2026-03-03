import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '@/lib/api';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/colors';

interface Commission {
  id: string;
  barberName: string;
  barberId: string;
  totalServices: number;
  totalRevenue: number;
  commissionRate: number;
  commissionAmount: number;
  period: string;
}

export default function ComissoesScreen() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await api.get('/finance/commissions');
      setCommissions(res.data || []);
    } catch (e) {
      console.error('Erro ao carregar comissões:', e);
      setCommissions([]);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const totalCommissions = commissions.reduce((s, c) => s + c.commissionAmount, 0);
  const totalRevenue     = commissions.reduce((s, c) => s + c.totalRevenue, 0);

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
        <Text style={styles.headerTitle}>Comissões</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Cards resumo */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { borderTopColor: Colors.primary }]}>
            <Ionicons name="people" size={22} color={Colors.primary} />
            <Text style={styles.summaryLabel}>Barbeiros</Text>
            <Text style={[styles.summaryValue, { color: Colors.primary }]}>
              {commissions.length}
            </Text>
          </View>
          <View style={[styles.summaryCard, { borderTopColor: Colors.success }]}>
            <Ionicons name="cash" size={22} color={Colors.success} />
            <Text style={styles.summaryLabel}>Total Comissões</Text>
            <Text style={[styles.summaryValue, { color: Colors.success }]}>
              R$ {totalCommissions.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Receita total */}
        <View style={styles.revenueCard}>
          <Text style={styles.revenueLabel}>Receita Total dos Barbeiros</Text>
          <Text style={styles.revenueValue}>R$ {totalRevenue.toFixed(2)}</Text>
          <Text style={styles.revenueNote}>
            Comissões representam {totalRevenue > 0 ? ((totalCommissions / totalRevenue) * 100).toFixed(1) : 0}% da receita
          </Text>
        </View>

        {/* Lista */}
        <Text style={styles.sectionTitle}>Por Barbeiro</Text>

        {commissions.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color={Colors.gray[300]} />
            <Text style={styles.emptyText}>Nenhuma comissão registrada</Text>
            <Text style={styles.emptySubText}>As comissões aparecerão após os atendimentos</Text>
          </View>
        ) : (
          commissions.map(c => <CommissionCard key={c.id} commission={c} />)
        )}
      </ScrollView>
    </View>
  );
}

function CommissionCard({ commission: c }: { commission: Commission }) {
  const initials = c.barberName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  return (
    <View style={styles.card}>
      <View style={styles.cardAvatar}>
        <Text style={styles.cardAvatarText}>{initials}</Text>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{c.barberName}</Text>
        <Text style={styles.cardServices}>{c.totalServices} serviços • {c.commissionRate}% comissão</Text>
        <View style={styles.cardBar}>
          <View
            style={[styles.cardBarFill, { width: `${Math.min(c.commissionRate, 100)}%` }]}
          />
        </View>
      </View>
      <View style={styles.cardAmounts}>
        <Text style={styles.cardRevenue}>R$ {Number(c.totalRevenue).toFixed(2)}</Text>
        <Text style={styles.cardCommission}>+ R$ {Number(c.commissionAmount).toFixed(2)}</Text>
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
  content: { padding: Spacing.md, gap: 16, paddingBottom: 40 },
  summaryRow: { flexDirection: 'row', gap: 12 },
  summaryCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.md, borderTopWidth: 3, ...Shadow.sm,
    borderWidth: 1, borderColor: Colors.border, gap: 4,
  },
  summaryLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  summaryValue: { fontSize: 18, fontWeight: '700' },
  revenueCard: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.xl,
    padding: Spacing.lg, alignItems: 'center',
  },
  revenueLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },
  revenueValue: { color: Colors.white, fontSize: 32, fontWeight: '700', marginVertical: 4 },
  revenueNote:  { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  empty: { alignItems: 'center', paddingTop: 40, gap: 8 },
  emptyText:    { color: Colors.textSecondary, fontSize: 15, fontWeight: '600' },
  emptySubText: { color: Colors.textMuted, fontSize: 13, textAlign: 'center' },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.md, ...Shadow.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  cardAvatar: {
    width: 48, height: 48, borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  cardAvatarText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  cardInfo:       { flex: 1 },
  cardName:       { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  cardServices:   { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  cardBar: {
    height: 4, backgroundColor: Colors.gray[100], borderRadius: 2, marginTop: 6,
    overflow: 'hidden',
  },
  cardBarFill:    { height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },
  cardAmounts:    { alignItems: 'flex-end' },
  cardRevenue:    { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  cardCommission: { fontSize: 13, fontWeight: '700', color: Colors.success },
});