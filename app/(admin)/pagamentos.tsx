import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '@/lib/api';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/colors';
import { Badge } from '@/components/ui/Badge';

type FilterType = 'all' | 'paid' | 'pending' | 'failed';

interface Payment {
  id: string;
  barbershopName: string;
  ownerName: string;
  plan: string;
  interval: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  dueDate: string;
  paidAt?: string;
  method?: string;
}

const STATUS_MAP: Record<string, { label: string; variant: any }> = {
  paid:     { label: 'Pago',      variant: 'success' },
  pending:  { label: 'Pendente',  variant: 'warning' },
  failed:   { label: 'Falhou',    variant: 'error'   },
  refunded: { label: 'Reembolso', variant: 'gray'    },
};

const INTERVAL_LABELS: Record<string, string> = {
  monthly:    'Mensal',
  semiannual: 'Semestral',
  annual:     'Anual',
};

// ── Calcula MRR localmente a partir dos pagamentos ────────────────────────────
function calcMRR(payments: Payment[]): number {
  return payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => {
      if (p.interval === 'monthly')    return sum + p.amount;
      if (p.interval === 'semiannual') return sum + p.amount / 6;
      if (p.interval === 'annual')     return sum + p.amount / 12;
      return sum + p.amount;
    }, 0);
}

export default function PagamentosScreen() {
  const [payments,   setPayments]   = useState<Payment[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter,     setFilter]     = useState<FilterType>('all');

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      // ✅ Apenas /admin/payments — summary calculado localmente
      const res = await api.get('/admin/payments');
      setPayments(res.data || []);
    } catch (e) {
      console.error('Erro ao carregar pagamentos:', e);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const filtered     = payments.filter(p => filter === 'all' ? true : p.status === filter);
  const totalPaid    = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
  const totalFailed  = payments.filter(p => p.status === 'failed').reduce((s, p) => s + p.amount, 0);
  const mrr          = calcMRR(payments);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pagamentos</Text>
        <Text style={styles.headerSub}>{payments.length} registros</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Cards resumo */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { borderTopColor: Colors.success }]}>
            <Ionicons name="checkmark-circle" size={22} color={Colors.success} />
            <Text style={styles.summaryLabel}>Recebido</Text>
            <Text style={[styles.summaryValue, { color: Colors.success }]}>
              R$ {totalPaid.toFixed(2)}
            </Text>
          </View>
          <View style={[styles.summaryCard, { borderTopColor: Colors.warning }]}>
            <Ionicons name="time" size={22} color={Colors.warning} />
            <Text style={styles.summaryLabel}>Pendente</Text>
            <Text style={[styles.summaryValue, { color: Colors.warning }]}>
              R$ {totalPending.toFixed(2)}
            </Text>
          </View>
          <View style={[styles.summaryCard, { borderTopColor: Colors.error }]}>
            <Ionicons name="close-circle" size={22} color={Colors.error} />
            <Text style={styles.summaryLabel}>Falhou</Text>
            <Text style={[styles.summaryValue, { color: Colors.error }]}>
              R$ {totalFailed.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* MRR — calculado localmente */}
        <View style={styles.mrrCard}>
          <Text style={styles.mrrLabel}>MRR (Receita Mensal Recorrente)</Text>
          <Text style={styles.mrrValue}>R$ {mrr.toFixed(2)}</Text>
          <Text style={styles.mrrSub}>ARR: R$ {(mrr * 12).toFixed(2)}</Text>
        </View>

        {/* Filtros */}
        <View style={styles.filters}>
          {([
            { key: 'all',     label: 'Todos'     },
            { key: 'paid',    label: 'Pagos'     },
            { key: 'pending', label: 'Pendentes' },
            { key: 'failed',  label: 'Falhou'    },
          ] as { key: FilterType; label: string }[]).map(f => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Lista */}
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="card-outline" size={48} color={Colors.gray[300]} />
            <Text style={styles.emptyText}>Nenhum pagamento encontrado</Text>
          </View>
        ) : (
          filtered.map(p => {
            const status = STATUS_MAP[p.status];
            return (
              <View key={p.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.cardIcon}>
                    <Ionicons name="card" size={22} color={Colors.primary} />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>{p.barbershopName}</Text>
                    <Text style={styles.cardOwner}>{p.ownerName}</Text>
                    <Text style={styles.cardPlan}>
                      {p.plan} • {INTERVAL_LABELS[p.interval] || p.interval}
                    </Text>
                  </View>
                  <View style={styles.cardRight}>
                    <Text style={styles.cardAmount}>R$ {Number(p.amount).toFixed(2)}</Text>
                    <Badge label={status.label} variant={status.variant} />
                  </View>
                </View>
                <View style={styles.cardMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={13} color={Colors.textSecondary} />
                    <Text style={styles.metaText}>
                      Vence: {format(new Date(p.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                    </Text>
                  </View>
                  {!!p.paidAt && (
                    <View style={styles.metaItem}>
                      <Ionicons name="checkmark-circle-outline" size={13} color={Colors.success} />
                      <Text style={styles.metaText}>
                        Pago: {format(new Date(p.paidAt), 'dd/MM/yyyy', { locale: ptBR })}
                      </Text>
                    </View>
                  )}
                  {!!p.method && (
                    <View style={styles.metaItem}>
                      <Ionicons name="wallet-outline" size={13} color={Colors.textSecondary} />
                      <Text style={styles.metaText}>{p.method}</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.background },
  centered:     { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:       { backgroundColor: Colors.white, paddingHorizontal: Spacing.md, paddingTop: 56, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle:  { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  headerSub:    { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  content:      { padding: Spacing.md, gap: 14, paddingBottom: 40 },
  summaryRow:   { flexDirection: 'row', gap: 8 },
  summaryCard:  { flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.sm, borderTopWidth: 3, ...Shadow.sm, borderWidth: 1, borderColor: Colors.border, gap: 2, alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },
  summaryValue: { fontSize: 14, fontWeight: '700' },
  mrrCard:      { backgroundColor: Colors.primary, borderRadius: BorderRadius.xl, padding: Spacing.lg, alignItems: 'center', gap: 4 },
  mrrLabel:     { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },
  mrrValue:     { color: Colors.white, fontSize: 32, fontWeight: '700' },
  mrrSub:       { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  filters:      { flexDirection: 'row', backgroundColor: Colors.gray[100], borderRadius: BorderRadius.lg, padding: 4, gap: 4 },
  filterBtn:    { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: BorderRadius.md },
  filterBtnActive: { backgroundColor: Colors.white },
  filterText:   { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  filterTextActive: { color: Colors.primary },
  empty:        { alignItems: 'center', paddingTop: 40, gap: 12 },
  emptyText:    { fontSize: 15, color: Colors.textSecondary },
  card:         { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing.md, ...Shadow.sm, borderWidth: 1, borderColor: Colors.border, gap: 10 },
  cardTop:      { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardIcon:     { width: 44, height: 44, borderRadius: BorderRadius.md, backgroundColor: '#faf5ff', alignItems: 'center', justifyContent: 'center' },
  cardInfo:     { flex: 1 },
  cardName:     { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  cardOwner:    { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  cardPlan:     { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  cardRight:    { alignItems: 'flex-end', gap: 4 },
  cardAmount:   { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  cardMeta:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.border },
  metaItem:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText:     { fontSize: 12, color: Colors.textSecondary },
});