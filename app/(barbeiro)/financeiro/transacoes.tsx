import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '@/lib/api';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/colors';

type TransactionType = 'all' | 'income' | 'expense';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  category: string;
  date: string;
  paymentMethod?: string;
}

export default function TransacoesScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [filter, setFilter]             = useState<TransactionType>('all');
  const [search, setSearch]             = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await api.get('/finance/transactions');
      setTransactions(res.data || []);
    } catch (e) {
      console.error('Erro ao carregar transações:', e);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const filtered = transactions.filter(t => {
    const matchFilter = filter === 'all' || t.type === filter;
    const matchSearch = !search || t.description.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const totalIncome  = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

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
        <Text style={styles.headerTitle}>Transações</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Resumo */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { borderTopColor: Colors.success }]}>
          <Text style={styles.summaryLabel}>Receitas</Text>
          <Text style={[styles.summaryValue, { color: Colors.success }]}>
            R$ {totalIncome.toFixed(2)}
          </Text>
        </View>
        <View style={[styles.summaryCard, { borderTopColor: Colors.error }]}>
          <Text style={styles.summaryLabel}>Despesas</Text>
          <Text style={[styles.summaryValue, { color: Colors.error }]}>
            R$ {totalExpense.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Busca */}
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={Colors.gray[400]} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar transação..."
          placeholderTextColor={Colors.gray[400]}
          value={search}
          onChangeText={setSearch}
        />
        {!!search && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={Colors.gray[400]} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filtros */}
      <View style={styles.filters}>
        {([
          { key: 'all',     label: 'Todas' },
          { key: 'income',  label: 'Receitas' },
          { key: 'expense', label: 'Despesas' },
        ] as { key: TransactionType; label: string }[]).map(f => (
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
      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={48} color={Colors.gray[300]} />
            <Text style={styles.emptyText}>Nenhuma transação encontrada</Text>
          </View>
        ) : (
          filtered.map(t => <TransactionCard key={t.id} transaction={t} />)
        )}
      </ScrollView>
    </View>
  );
}

function TransactionCard({ transaction: t }: { transaction: Transaction }) {
  const isIncome = t.type === 'income';
  return (
    <View style={styles.card}>
      <View style={[styles.cardIcon, { backgroundColor: isIncome ? Colors.successBg : Colors.errorBg }]}>
        <Ionicons
          name={isIncome ? 'arrow-up-circle' : 'arrow-down-circle'}
          size={24}
          color={isIncome ? Colors.success : Colors.error}
        />
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardDesc}>{t.description}</Text>
        <Text style={styles.cardCategory}>{t.category}</Text>
        <Text style={styles.cardDate}>
          {format(new Date(t.date), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
        </Text>
      </View>
      <Text style={[styles.cardAmount, { color: isIncome ? Colors.success : Colors.error }]}>
        {isIncome ? '+' : '-'} R$ {Number(t.amount).toFixed(2)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.background },
  centered:   { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.white, paddingHorizontal: Spacing.md,
    paddingTop: 56, paddingBottom: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  summaryRow:  { flexDirection: 'row', gap: 12, padding: Spacing.md, paddingBottom: 0 },
  summaryCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.md, borderTopWidth: 3, ...Shadow.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  summaryLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  summaryValue: { fontSize: 18, fontWeight: '700', marginTop: 4 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.white, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    margin: Spacing.md, marginBottom: 0,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.textPrimary },
  filters: { flexDirection: 'row', gap: 8, paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },
  filterBtn: {
    flex: 1, paddingVertical: 8, borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray[100], alignItems: 'center',
  },
  filterBtnActive: { backgroundColor: Colors.primary },
  filterText:      { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  filterTextActive: { color: Colors.white },
  list: { padding: Spacing.md, gap: 10, paddingBottom: 40 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { color: Colors.textSecondary, fontSize: 15 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.md, ...Shadow.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  cardIcon:   { width: 44, height: 44, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  cardInfo:   { flex: 1 },
  cardDesc:   { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  cardCategory: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  cardDate:   { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  cardAmount: { fontSize: 15, fontWeight: '700' },
});