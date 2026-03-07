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

// ── Tipos ─────────────────────────────────────────────────────────────────────

type FilterType = 'all' | 'paid' | 'pending' | 'failed';

interface Payment {
  id:             string;
  barbershopName: string;
  ownerName:      string;
  plan:           string;
  interval:       string;
  amount:         number;
  status:         'paid' | 'pending' | 'failed' | 'refunded';
  dueDate:        string;
  paidAt?:        string;
  method?:        string;
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

// ── Componente principal ──────────────────────────────────────────────────────

export default function PagamentosScreen() {
  const [payments,   setPayments]   = useState<Payment[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter,     setFilter]     = useState<FilterType>('all');

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await api.get('/admin/payments');
      // Suporta shape { payments: [] } ou array direto
      const raw = res.data;
      const list: Payment[] = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.payments) ? raw.payments
        : [];
      setPayments(list);
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

  // ── Cálculos de resumo ───────────────────────────────────────────────────
  const filtered     = payments.filter(p => filter === 'all' || p.status === filter);
  const totalPaid    = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
  const totalCount   = payments.length;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pagamentos</Text>
        <Text style={styles.headerSub}>Acompanhe todos os pagamentos</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >

        {/* ── 3 Cards — idênticos ao web ──────────────────────────────────── */}
        <View style={styles.summaryRow}>

          {/* Total Recebido */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryTop}>
              <Text style={styles.summaryLabel}>Total Recebido</Text>
              <Ionicons name="checkmark-circle" size={22} color={Colors.success} />
            </View>
            <Text style={styles.summaryValue}>{formatCurrency(totalPaid)}</Text>
            <Text style={styles.summarySub}>
              {payments.filter(p => p.status === 'paid').length} transação(ões)
            </Text>
          </View>

          {/* Pendente */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryTop}>
              <Text style={styles.summaryLabel}>Pendente</Text>
              <Ionicons name="time" size={22} color={Colors.warning} />
            </View>
            <Text style={styles.summaryValue}>{formatCurrency(totalPending)}</Text>
            <Text style={styles.summarySub}>
              {payments.filter(p => p.status === 'pending').length} transação(ões)
            </Text>
          </View>

          {/* Total (contagem) — igual ao web, substitui "Falhou" */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryTop}>
              <Text style={styles.summaryLabel}>Total</Text>
              <Ionicons name="clipboard" size={22} color="#2563eb" />
            </View>
            <Text style={styles.summaryValue}>{totalCount}</Text>
            <Text style={styles.summarySub}>Transações</Text>
          </View>

        </View>

        {/* ── Filtro por Status — igual ao web ───────────────────────────── */}
        <View style={styles.filterRow}>
          <View style={styles.filterSelect}>
            {([
              { key: 'all',     label: 'Todos'     },
              { key: 'paid',    label: 'Pagos'     },
              { key: 'pending', label: 'Pendentes' },
              { key: 'failed',  label: 'Falhou'    },
            ] as { key: FilterType; label: string }[]).map(f => (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterOpt, filter === f.key && styles.filterOptActive]}
                onPress={() => setFilter(f.key)}
              >
                <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
            <Text style={styles.refreshText}>Atualizar</Text>
          </TouchableOpacity>
        </View>

        {/* ── Tabela header ───────────────────────────────────────────────── */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>BARBEARIA</Text>
          <Text style={styles.tableHeaderCell}>PLANO</Text>
          <Text style={styles.tableHeaderCell}>VALOR</Text>
          <Text style={styles.tableHeaderCell}>STATUS</Text>
        </View>

        {/* ── Lista ────────────────────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="card-outline" size={48} color={Colors.gray[300]} />
            <Text style={styles.emptyTitle}>Nenhum pagamento encontrado</Text>
            <Text style={styles.emptySubtitle}>Ajuste os filtros.</Text>
          </View>
        ) : (
          <View style={styles.tableBody}>
            {filtered.map(p => {
              const statusInfo = STATUS_MAP[p.status] || { label: p.status, variant: 'gray' };
              return (
                <View key={p.id} style={styles.tableRow}>
                  <View style={{ flex: 2 }}>
                    <Text style={styles.rowName} numberOfLines={1}>{p.barbershopName}</Text>
                    {!!p.paidAt && (
                      <Text style={styles.rowDate}>
                        {format(new Date(p.paidAt), 'dd/MM/yyyy', { locale: ptBR })}
                      </Text>
                    )}
                    {!p.paidAt && !!p.dueDate && (
                      <Text style={styles.rowDate}>
                        Vence: {format(new Date(p.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                      </Text>
                    )}
                    {!!p.method && (
                      <Text style={styles.rowMeta}>{p.method}</Text>
                    )}
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={styles.rowPlan}>{p.plan}</Text>
                    <Text style={styles.rowInterval}>{INTERVAL_LABELS[p.interval] || p.interval}</Text>
                  </View>
                  <Text style={styles.rowAmount}>
                    {formatCurrency(Number(p.amount))}
                  </Text>
                  <Badge label={statusInfo.label} variant={statusInfo.variant} />
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingTop: 56,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#111827' },
  headerSub:   { fontSize: 13, color: '#6b7280', marginTop: 2 },

  content: { padding: Spacing.md, gap: 14, paddingBottom: 20 },

  // 3 cards de resumo
  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.sm, ...Shadow.sm,
    borderWidth: 1, borderColor: '#e5e7eb', gap: 4,
  },
  summaryTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: '#6b7280', fontWeight: '500' },
  summaryValue: { fontSize: 16, fontWeight: '700', color: '#111827' },
  summarySub:   { fontSize: 10, color: '#9ca3af' },

  // Filtro + botão Atualizar
  filterRow: {
    flexDirection: 'row', gap: 10, alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.sm, borderWidth: 1, borderColor: '#e5e7eb', ...Shadow.sm,
  },
  filterSelect: { flex: 1, flexDirection: 'row', gap: 4 },
  filterOpt: {
    flex: 1, paddingVertical: 8, alignItems: 'center',
    borderRadius: BorderRadius.sm, backgroundColor: '#f3f4f6',
  },
  filterOptActive: { backgroundColor: Colors.primary },
  filterText:      { fontSize: 11, fontWeight: '600', color: '#6b7280' },
  filterTextActive: { color: Colors.white },
  refreshBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingVertical: 8, paddingHorizontal: 14,
  },
  refreshText: { color: Colors.white, fontWeight: '700', fontSize: 13 },

  // Tabela
  tableHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.sm, paddingVertical: 8,
    backgroundColor: '#f9fafb',
    borderRadius: BorderRadius.sm,
    gap: 8,
  },
  tableHeaderCell: { fontSize: 11, fontWeight: '700', color: '#9ca3af', flex: 1, textAlign: 'center' },
  tableBody: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: '#e5e7eb', ...Shadow.sm, overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
    gap: 8,
  },
  rowName:     { fontSize: 13, fontWeight: '600', color: '#111827' },
  rowDate:     { fontSize: 11, color: '#6b7280', marginTop: 2 },
  rowMeta:     { fontSize: 10, color: '#9ca3af', marginTop: 1 },
  rowPlan:     { fontSize: 11, fontWeight: '700', color: '#111827', textAlign: 'center' },
  rowInterval: { fontSize: 10, color: '#6b7280', textAlign: 'center' },
  rowAmount:   { fontSize: 14, fontWeight: '700', color: '#111827', flex: 1, textAlign: 'right' },

  // Empty
  empty:        { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyTitle:   { fontSize: 15, fontWeight: '600', color: '#6b7280' },
  emptySubtitle: { fontSize: 13, color: '#9ca3af' },
});