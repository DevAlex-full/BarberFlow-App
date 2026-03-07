import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, RefreshControl, Alert, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '@/lib/api';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/colors';

interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  active: boolean; // ✅ campo real do Prisma
}

interface ServiceForm {
  name: string;
  description: string;
  price: string;
  duration: string;
}

const EMPTY_FORM: ServiceForm = {
  name: '', description: '', price: '', duration: '',
};

export default function ServicosScreen() {
  const [services,   setServices]   = useState<Service[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search,     setSearch]     = useState('');

  // ── Modal criar / editar ───────────────────────────────────────────────────
  const [showModal,    setShowModal]    = useState(false);
  const [editingId,    setEditingId]    = useState<string | null>(null);
  const [form,         setForm]         = useState<ServiceForm>(EMPTY_FORM);
  const [saving,       setSaving]       = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await api.get('/services');
      setServices(res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  // ── Abrir modal ─────────────────────────────────────────────────────────────
  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(s: Service) {
    setEditingId(s.id);
    setForm({
      name:        s.name,
      description: s.description || '',
      price:       String(s.price),
      duration:    String(s.duration),
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  // ── Salvar (criar ou editar) ─────────────────────────────────────────────────
  async function handleSave() {
    if (!form.name || !form.price || !form.duration) {
      Alert.alert('Atenção', 'Preencha nome, preço e duração.');
      return;
    }
    const payload = {
      name:        form.name,
      description: form.description,
      price:       parseFloat(form.price),
      duration:    parseInt(form.duration, 10),
    };
    setSaving(true);
    try {
      if (editingId) {
        // ✅ PUT /services/:id  (nunca PATCH)
        await api.put(`/services/${editingId}`, payload);
        Alert.alert('✅ Atualizado!', 'Serviço atualizado com sucesso!');
      } else {
        // ✅ POST /services
        await api.post('/services', payload);
        Alert.alert('✅ Criado!', 'Serviço cadastrado com sucesso!');
      }
      closeModal();
      load();
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.error || 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  }

  // ── Toggle ativo/inativo ────────────────────────────────────────────────────
  async function handleToggle(id: string, current: boolean) {
    try {
      // ✅ PUT /services/:id — campo real é `active`
      await api.put(`/services/${id}`, { active: !current });
      setServices(prev => prev.map(s => s.id === id ? { ...s, active: !current } : s));
    } catch {
      Alert.alert('Erro', 'Não foi possível alterar o serviço.');
    }
  }

  // ── Excluir ─────────────────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    Alert.alert('Excluir', 'Deseja excluir este serviço?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/services/${id}`);
            setServices(prev => prev.filter(s => s.id !== id));
          } catch (err: any) {
            const msg = err?.response?.status === 500
              ? 'Este serviço possui agendamentos vinculados e não pode ser excluído. Desative-o em vez de excluir.'
              : 'Não foi possível excluir o serviço.';
            Alert.alert('Erro', msg);
          }
        },
      },
    ]);
  }

  const filtered = services.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase())
  );

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
        <Text style={styles.headerTitle}>Serviços</Text>
        <TouchableOpacity style={styles.newBtn} onPress={openCreate}>
          <Ionicons name="add" size={20} color={Colors.white} />
          <Text style={styles.newBtnText}>Novo</Text>
        </TouchableOpacity>
      </View>

      {/* Busca */}
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={Colors.gray[400]} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar serviço..."
          placeholderTextColor={Colors.gray[400]}
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
        />
        {!!search && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={Colors.gray[400]} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >

        {/* Resumo */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{services.length}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: Colors.success }]}>
              {services.filter(s => s.active).length}
            </Text>
            <Text style={styles.summaryLabel}>Ativos</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: Colors.textSecondary }]}>
              {services.filter(s => !s.active).length}
            </Text>
            <Text style={styles.summaryLabel}>Inativos</Text>
          </View>
        </View>

        {/* Empty state */}
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="cut-outline" size={48} color={Colors.gray[300]} />
            <Text style={styles.emptyText}>
              {search ? 'Nenhum serviço encontrado' : 'Nenhum serviço cadastrado'}
            </Text>
            {!search && (
              <TouchableOpacity style={styles.emptyBtn} onPress={openCreate}>
                <Ionicons name="add-circle" size={18} color={Colors.white} />
                <Text style={styles.emptyBtnText}>Criar Primeiro Serviço</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filtered.map(s => (
            <View key={s.id} style={[styles.card, !s.active && styles.cardInactive]}>

              {/* Ícone */}
              <View style={styles.cardLeft}>
                <View style={[styles.cardIcon, { backgroundColor: s.active ? '#faf5ff' : Colors.gray[100] }]}>
                  <Ionicons name="cut" size={22} color={s.active ? Colors.primary : Colors.gray[400]} />
                </View>
              </View>

              {/* Info */}
              <View style={styles.cardInfo}>
                <Text style={[styles.cardName, !s.active && styles.textMuted]}>{s.name}</Text>
                {!!s.description && (
                  <Text style={styles.cardDesc} numberOfLines={1}>{s.description}</Text>
                )}
                <View style={styles.cardMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={13} color={Colors.textSecondary} />
                    <Text style={styles.metaText}>{s.duration} min</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="cash-outline" size={13} color={Colors.textSecondary} />
                    <Text style={styles.metaText}>R$ {Number(s.price).toFixed(2)}</Text>
                  </View>
                </View>
              </View>

              {/* Ações */}
              <View style={styles.cardActions}>
                {/* Editar */}
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#eff6ff' }]}
                  onPress={() => openEdit(s)}
                >
                  <Ionicons name="pencil" size={15} color="#2563eb" />
                </TouchableOpacity>

                {/* Toggle ativo */}
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: s.active ? Colors.successBg : Colors.gray[100] }]}
                  onPress={() => handleToggle(s.id, s.active)}
                >
                  <Ionicons
                    name={s.active ? 'eye' : 'eye-off'}
                    size={15}
                    color={s.active ? Colors.success : Colors.gray[400]}
                  />
                </TouchableOpacity>

                {/* Excluir */}
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: Colors.errorBg }]}
                  onPress={() => handleDelete(s.id)}
                >
                  <Ionicons name="trash-outline" size={15} color={Colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* ── Modal Criar / Editar ─────────────────────────────────────────────── */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            {/* Header do modal */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingId ? 'Editar Serviço' : 'Novo Serviço'}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

              {/* Nome */}
              <View style={styles.field}>
                <Text style={styles.label}>Nome do Serviço *</Text>
                <TextInput
                  style={styles.input}
                  value={form.name}
                  onChangeText={v => setForm(p => ({ ...p, name: v }))}
                  placeholder="Ex: Corte + Barba"
                  placeholderTextColor={Colors.gray[400]}
                />
              </View>

              {/* Descrição */}
              <View style={styles.field}>
                <Text style={styles.label}>Descrição</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={form.description}
                  onChangeText={v => setForm(p => ({ ...p, description: v }))}
                  placeholder="Descreva o serviço..."
                  placeholderTextColor={Colors.gray[400]}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              {/* Preço + Duração */}
              <View style={styles.formRow}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Preço (R$) *</Text>
                  <TextInput
                    style={styles.input}
                    value={form.price}
                    onChangeText={v => setForm(p => ({ ...p, price: v }))}
                    placeholder="50.00"
                    keyboardType="decimal-pad"
                    placeholderTextColor={Colors.gray[400]}
                  />
                </View>
                <View style={[styles.field, { flex: 1, marginLeft: 12 }]}>
                  <Text style={styles.label}>Duração (min) *</Text>
                  <TextInput
                    style={styles.input}
                    value={form.duration}
                    onChangeText={v => setForm(p => ({ ...p, duration: v }))}
                    placeholder="30"
                    keyboardType="number-pad"
                    placeholderTextColor={Colors.gray[400]}
                  />
                </View>
              </View>

            </ScrollView>

            {/* Botões do modal */}
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.btnDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color={Colors.white} size="small" />
                  : <Text style={styles.saveBtnText}>
                      {editingId ? 'Atualizar' : 'Cadastrar'}
                    </Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  newBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: BorderRadius.md,
  },
  newBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },

  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.white, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    margin: Spacing.md, marginBottom: 0, ...Shadow.sm,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.textPrimary },

  list:        { padding: Spacing.md, gap: 10, paddingBottom: 40 },
  summaryRow:  { flexDirection: 'row', gap: 10, marginBottom: 4 },
  summaryCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.sm, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border, ...Shadow.sm,
  },
  summaryValue: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  summaryLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },

  empty:       { alignItems: 'center', paddingTop: 48, gap: 12 },
  emptyText:   { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  emptyBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 11, borderRadius: BorderRadius.md },
  emptyBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.md, ...Shadow.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  cardInactive: { opacity: 0.6 },
  cardLeft:   {},
  cardIcon:   { width: 44, height: 44, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  cardInfo:   { flex: 1 },
  cardName:   { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  cardDesc:   { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  textMuted:  { color: Colors.textMuted },
  cardMeta:   { flexDirection: 'row', gap: 12, marginTop: 4 },
  metaItem:   { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText:   { fontSize: 12, color: Colors.textSecondary },
  cardActions: { gap: 6 },
  actionBtn:  { width: 34, height: 34, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: Spacing.lg, maxHeight: '90%',
  },
  modalHandle: { width: 40, height: 4, backgroundColor: Colors.gray[300], borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.md },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  modalTitle:  { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },

  field:    { marginBottom: Spacing.sm },
  label:    { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: Colors.gray[50], borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: Colors.textPrimary,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  formRow:  { flexDirection: 'row' },

  modalFooter: { flexDirection: 'row', gap: 12, paddingTop: Spacing.sm },
  cancelBtn: {
    flex: 1, paddingVertical: 13, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '700', color: Colors.textSecondary },
  saveBtn: {
    flex: 1, backgroundColor: Colors.primary,
    paddingVertical: 13, borderRadius: BorderRadius.md, alignItems: 'center',
  },
  saveBtnText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
  btnDisabled: { opacity: 0.6 },
});