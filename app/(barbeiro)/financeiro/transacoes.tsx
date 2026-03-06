import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/colors';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Transaction {
  id:            string;
  type:          'income' | 'expense';
  description:   string;
  amount:        number;
  category:      string;
  paymentMethod: string;
  date:          string;
}

interface NewTransaction {
  type:          'income' | 'expense';
  description:   string;
  amount:        string;
  category:      string;
  paymentMethod: string;
  date:          string;
}

const CATEGORIES = [
  { key: 'service',    label: '✂️ Serviço' },
  { key: 'product',    label: '🛍️ Produto' },
  { key: 'salary',     label: '💼 Salário' },
  { key: 'commission', label: '💰 Comissão' },
  { key: 'rent',       label: '🏢 Aluguel' },
  { key: 'utilities',  label: '💡 Contas' },
  { key: 'supplies',   label: '📦 Materiais' },
  { key: 'other',      label: '📌 Outro' },
];

const PAYMENT_METHODS = ['dinheiro', 'pix', 'cartao_credito', 'cartao_debito'];

export default function TransacoesScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading]           = useState(true);
  const [showModal, setShowModal]       = useState(false);
  const [saving, setSaving]             = useState(false);

  const [filters, setFilters] = useState({
    type:      '' as '' | 'income' | 'expense',
    category:  '',
  });

  const [form, setForm] = useState<NewTransaction>({
    type:          'income',
    description:   '',
    amount:        '',
    category:      'service',
    paymentMethod: 'dinheiro',
    date:          new Date().toISOString().split('T')[0],
  });

  useEffect(() => { loadTransactions(); }, []);

  async function loadTransactions() {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (filters.type)     params.type     = filters.type;
      if (filters.category) params.category = filters.category;

      // ✅ Endpoint correto: /transactions (web usa transactionsApi.list())
      const res = await api.get('/transactions', { params });
      setTransactions(Array.isArray(res.data) ? res.data : res.data?.transactions || []);
    } catch (e) {
      console.error('Erro ao carregar transações:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    Alert.alert('Excluir', 'Deseja realmente excluir esta transação?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            // ✅ Endpoint correto: DELETE /transactions/{id}
            await api.delete(`/transactions/${id}`);
            loadTransactions();
          } catch (e) {
            Alert.alert('Erro', 'Não foi possível excluir.');
          }
        },
      },
    ]);
  }

  async function handleSave() {
    if (!form.description || !form.amount) {
      Alert.alert('Atenção', 'Preencha descrição e valor.');
      return;
    }
    setSaving(true);
    try {
      // ✅ Endpoint correto: POST /transactions
      await api.post('/transactions', {
        ...form,
        amount: parseFloat(form.amount),
      });
      setShowModal(false);
      setForm({ type: 'income', description: '', amount: '', category: 'service', paymentMethod: 'dinheiro', date: new Date().toISOString().split('T')[0] });
      loadTransactions();
    } catch (e: any) {
      Alert.alert('Erro', e.response?.data?.error || 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  }

  // ── Totalizadores ──────────────────────────────────────────────────────────
  const totalIncome  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const balance      = totalIncome - totalExpense;

  function getCategoryLabel(cat: string) {
    return CATEGORIES.find(c => c.key === cat)?.label || cat;
  }

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.pageTitle}>Transações</Text>
            <Text style={styles.pageSub}>Histórico de receitas e despesas</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
            <Ionicons name="add" size={20} color={Colors.white} />
            <Text style={styles.addBtnText}>Nova</Text>
          </TouchableOpacity>
        </View>

        {/* Resumo financeiro */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: Colors.successBg }]}>
            <Ionicons name="arrow-up-circle" size={20} color={Colors.success} />
            <Text style={styles.summaryLabel}>Receitas</Text>
            <Text style={[styles.summaryValue, { color: Colors.success }]}>
              R$ {totalIncome.toFixed(2)}
            </Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: Colors.errorBg }]}>
            <Ionicons name="arrow-down-circle" size={20} color={Colors.error} />
            <Text style={styles.summaryLabel}>Despesas</Text>
            <Text style={[styles.summaryValue, { color: Colors.error }]}>
              R$ {totalExpense.toFixed(2)}
            </Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: balance >= 0 ? '#eff6ff' : Colors.errorBg }]}>
            <Ionicons name="wallet" size={20} color={balance >= 0 ? '#2563eb' : Colors.error} />
            <Text style={styles.summaryLabel}>Saldo</Text>
            <Text style={[styles.summaryValue, { color: balance >= 0 ? '#2563eb' : Colors.error }]}>
              R$ {balance.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Filtros */}
        <View style={styles.filterBar}>
          {[
            { key: '', label: 'Todos' },
            { key: 'income',  label: '↑ Receitas' },
            { key: 'expense', label: '↓ Despesas' },
          ].map(f => (
            <TouchableOpacity key={f.key}
              style={[styles.filterChip, filters.type === f.key && styles.filterChipActive]}
              onPress={() => { setFilters(p => ({ ...p, type: f.key as any })); setTimeout(loadTransactions, 100); }}>
              <Text style={[styles.filterChipText, filters.type === f.key && styles.filterChipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Lista */}
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : transactions.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="swap-horizontal-outline" size={48} color={Colors.gray[300]} />
            <Text style={styles.emptyTitle}>Nenhuma transação</Text>
            <Text style={styles.emptyText}>Adicione sua primeira transação</Text>
          </View>
        ) : (
          transactions.map(t => (
            <View key={t.id} style={styles.transactionCard}>
              <View style={[styles.typeIcon, { backgroundColor: t.type === 'income' ? Colors.successBg : Colors.errorBg }]}>
                <Ionicons
                  name={t.type === 'income' ? 'arrow-up' : 'arrow-down'}
                  size={18}
                  color={t.type === 'income' ? Colors.success : Colors.error}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.txDesc}>{t.description}</Text>
                <Text style={styles.txMeta}>
                  {getCategoryLabel(t.category)} • {t.paymentMethod || '–'} • {new Date(t.date).toLocaleDateString('pt-BR')}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <Text style={[styles.txAmount, { color: t.type === 'income' ? Colors.success : Colors.error }]}>
                  {t.type === 'income' ? '+' : '-'}R$ {Number(t.amount).toFixed(2)}
                </Text>
                <TouchableOpacity onPress={() => handleDelete(t.id)}>
                  <Ionicons name="trash-outline" size={16} color={Colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal Nova Transação */}
      {showModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nova Transação</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={Colors.gray[600]} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 450 }}>
              {/* Tipo */}
              <View style={styles.field}>
                <Text style={styles.label}>Tipo</Text>
                <View style={styles.typeToggle}>
                  {[
                    { key: 'income',  label: '↑ Receita' },
                    { key: 'expense', label: '↓ Despesa' },
                  ].map(t => (
                    <TouchableOpacity key={t.key}
                      style={[styles.typeToggleBtn,
                        form.type === t.key && {
                          backgroundColor: t.key === 'income' ? Colors.success : Colors.error,
                          borderColor: t.key === 'income' ? Colors.success : Colors.error,
                        }]}
                      onPress={() => setForm(p => ({ ...p, type: t.key as any }))}>
                      <Text style={[styles.typeToggleBtnText, form.type === t.key && { color: Colors.white }]}>
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Descrição */}
              <View style={styles.field}>
                <Text style={styles.label}>Descrição *</Text>
                <TextInput style={styles.input} value={form.description}
                  onChangeText={v => setForm(p => ({ ...p, description: v }))}
                  placeholder="Ex: Corte de cabelo" placeholderTextColor={Colors.gray[400]} />
              </View>

              {/* Valor */}
              <View style={styles.field}>
                <Text style={styles.label}>Valor (R$) *</Text>
                <TextInput style={styles.input} value={form.amount}
                  onChangeText={v => setForm(p => ({ ...p, amount: v }))}
                  placeholder="0.00" keyboardType="decimal-pad" placeholderTextColor={Colors.gray[400]} />
              </View>

              {/* Categoria */}
              <View style={styles.field}>
                <Text style={styles.label}>Categoria</Text>
                <View style={styles.chipGrid}>
                  {CATEGORIES.map(c => (
                    <TouchableOpacity key={c.key}
                      style={[styles.chip, form.category === c.key && styles.chipActive]}
                      onPress={() => setForm(p => ({ ...p, category: c.key }))}>
                      <Text style={[styles.chipText, form.category === c.key && styles.chipTextActive]}>
                        {c.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Pagamento */}
              <View style={styles.field}>
                <Text style={styles.label}>Forma de Pagamento</Text>
                <View style={styles.chipGrid}>
                  {PAYMENT_METHODS.map(m => (
                    <TouchableOpacity key={m}
                      style={[styles.chip, form.paymentMethod === m && styles.chipActive]}
                      onPress={() => setForm(p => ({ ...p, paymentMethod: m }))}>
                      <Text style={[styles.chipText, form.paymentMethod === m && styles.chipTextActive]}>
                        {m === 'cartao_credito' ? 'Crédito' : m === 'cartao_debito' ? 'Débito' : m.charAt(0).toUpperCase() + m.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity style={[styles.saveBtn, saving && styles.btnDisabled]}
              onPress={handleSave} disabled={saving}>
              {saving
                ? <ActivityIndicator color={Colors.white} size="small" />
                : <Ionicons name="checkmark" size={20} color={Colors.white} />}
              <Text style={styles.saveBtnText}>{saving ? 'Salvando...' : 'Salvar Transação'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.background },
  content:     { padding: Spacing.md, paddingBottom: Spacing.xxl },
  centered:    { paddingVertical: Spacing.xxl, alignItems: 'center' },
  headerRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  pageTitle:   { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  pageSub:     { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  addBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: BorderRadius.md },
  addBtnText:  { color: Colors.white, fontWeight: '700', fontSize: 14 },
  summaryRow:  { flexDirection: 'row', gap: 10, marginBottom: Spacing.md },
  summaryCard: { flex: 1, borderRadius: BorderRadius.lg, padding: 12, alignItems: 'center', gap: 4 },
  summaryLabel: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
  summaryValue: { fontSize: 14, fontWeight: '700' },
  filterBar:   { flexDirection: 'row', gap: 8, marginBottom: Spacing.md },
  filterChip:  { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: Colors.gray[100], borderWidth: 1, borderColor: Colors.border },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  filterChipTextActive: { color: Colors.white },
  transactionCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: 8, ...Shadow.sm, borderWidth: 1, borderColor: Colors.border },
  typeIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  txDesc:   { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  txMeta:   { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '700' },
  emptyBox:   { alignItems: 'center', paddingVertical: Spacing.xxl, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  emptyText:  { fontSize: 14, color: Colors.textSecondary },
  // Modal
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal:        { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.lg, maxHeight: '90%' },
  modalHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  modalTitle:   { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  field:        { marginBottom: Spacing.sm },
  label:        { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 },
  input:        { backgroundColor: Colors.gray[50], borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: 12, fontSize: 15, color: Colors.textPrimary },
  typeToggle:   { flexDirection: 'row', gap: 10 },
  typeToggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: BorderRadius.md, borderWidth: 2, borderColor: Colors.border },
  typeToggleBtnText: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
  chipGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:         { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: Colors.gray[100], borderWidth: 1, borderColor: Colors.border },
  chipActive:   { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText:     { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: Colors.white },
  saveBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: 14, marginTop: Spacing.md },
  saveBtnText:  { color: Colors.white, fontWeight: '700', fontSize: 16 },
  btnDisabled:  { opacity: 0.6 },
});