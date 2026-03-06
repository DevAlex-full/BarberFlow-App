import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/colors';

// ─── Tipos (espelham goals.ts do web) ─────────────────────────────────────────

interface GoalProgress {
  id:             string;
  name:           string;
  targetAmount:   number;
  currentAmount:  number;
  percentage:     string;
  remaining:      number;
  daysRemaining:  number;
  status:         'active' | 'completed' | 'expired';
  startDate:      string;
  endDate:        string;
}

interface GoalsProgressResponse {
  goals: GoalProgress[];
  summary: {
    total:     number;
    completed: number;
    active:    number;
    expired:   number;
  };
}

interface NewGoalForm {
  name:         string;
  targetAmount: string;
  startDate:    string;
  endDate:      string;
}

export default function MetasScreen() {
  const [loading,   setLoading]   = useState(true);
  const [progress,  setProgress]  = useState<GoalsProgressResponse | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [form,      setForm]      = useState<NewGoalForm>({
    name: '', targetAmount: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate:   new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
  });

  useEffect(() => { loadProgress(); }, []);

  // ── Carregar progresso ──────────────────────────────────────────────────────
  async function loadProgress() {
    setLoading(true);
    try {
      // ✅ GET /goals/progress  (goalsApi.getProgress)
      const res = await api.get<GoalsProgressResponse>('/goals/progress');
      setProgress(res.data);
    } catch (e) {
      console.error('Erro ao carregar metas:', e);
      setProgress(null);
    } finally {
      setLoading(false);
    }
  }

  // ── Criar meta ─────────────────────────────────────────────────────────────
  async function handleCreate() {
    if (!form.name || !form.targetAmount) {
      Alert.alert('Atenção', 'Preencha nome e valor alvo.');
      return;
    }
    setSaving(true);
    try {
      // ✅ POST /goals  (goalsApi.create)
      await api.post('/goals', {
        name:         form.name,
        targetAmount: parseFloat(form.targetAmount),
        startDate:    form.startDate,
        endDate:      form.endDate,
      });
      Alert.alert('✅ Criada!', 'Meta criada com sucesso!');
      setShowModal(false);
      setForm({ name: '', targetAmount: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate:   new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      });
      loadProgress();
    } catch (e: any) {
      Alert.alert('Erro', e.response?.data?.error || 'Erro ao criar meta');
    } finally {
      setSaving(false);
    }
  }

  // ── Sincronizar meta ───────────────────────────────────────────────────────
  async function handleSync(goal: GoalProgress) {
    Alert.alert(
      'Sincronizar',
      `Sincronizar "${goal.name}" com receitas reais?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sincronizar',
          onPress: async () => {
            try {
              // ✅ PUT /goals/{id}/sync  (goalsApi.sync)
              await api.put(`/goals/${goal.id}/sync`);
              Alert.alert('✅ Sincronizado!', 'Progresso atualizado com receitas reais!');
              loadProgress();
            } catch (e: any) {
              Alert.alert('Erro', e.response?.data?.error || 'Erro ao sincronizar');
            }
          },
        },
      ]
    );
  }

  // ── Excluir meta ───────────────────────────────────────────────────────────
  async function handleDelete(goal: GoalProgress) {
    Alert.alert('Excluir Meta', `Excluir "${goal.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            // ✅ DELETE /goals/{id}  (goalsApi.delete)
            await api.delete(`/goals/${goal.id}`);
            loadProgress();
          } catch (e: any) {
            Alert.alert('Erro', e.response?.data?.error || 'Erro ao excluir meta');
          }
        },
      },
    ]);
  }

  // ── Cor e ícone pelo status ────────────────────────────────────────────────
  function statusColor(status: string) {
    return status === 'completed' ? Colors.success : status === 'expired' ? Colors.error : Colors.primary;
  }

  function progressBarColor(pct: number) {
    if (pct >= 100) return Colors.success;
    if (pct >= 75)  return '#3b82f6';
    return Colors.warning;
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <Ionicons name="flag" size={22} color={Colors.white} />
            </View>
            <View>
              <Text style={styles.pageTitle}>Metas Financeiras</Text>
              <Text style={styles.pageSub}>Acompanhe seus objetivos de receita</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
            <Ionicons name="add" size={20} color={Colors.white} />
            <Text style={styles.addBtnText}>Nova</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : !progress || progress.goals.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="flag-outline" size={64} color={Colors.gray[300]} />
            <Text style={styles.emptyTitle}>Nenhuma meta cadastrada</Text>
            <Text style={styles.emptyText}>Crie sua primeira meta financeira</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowModal(true)}>
              <Ionicons name="add-circle" size={18} color={Colors.white} />
              <Text style={styles.emptyBtnText}>Criar Primeira Meta</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Resumo */}
            <View style={styles.summaryRow}>
              {[
                { label: 'Total',      value: progress.summary.total,     color: Colors.primary },
                { label: 'Ativas',     value: progress.summary.active,    color: Colors.warning },
                { label: 'Atingidas',  value: progress.summary.completed, color: Colors.success },
                { label: 'Expiradas',  value: progress.summary.expired,   color: Colors.error },
              ].map((s, i) => (
                <View key={i} style={[styles.summaryCard, { borderTopColor: s.color }]}>
                  <Text style={[styles.summaryValue, { color: s.color }]}>{s.value}</Text>
                  <Text style={styles.summaryLabel}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Lista de metas */}
            {progress.goals.map(goal => {
              const pct = parseFloat(goal.percentage);
              const sc  = statusColor(goal.status);
              return (
                <View key={goal.id} style={[styles.goalCard, { borderLeftColor: sc }]}>
                  {/* Top */}
                  <View style={styles.goalTop}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.goalTitleRow}>
                        <Text style={styles.goalName}>{goal.name}</Text>
                        {goal.status === 'completed' && (
                          <View style={[styles.statusBadge, { backgroundColor: Colors.successBg }]}>
                            <Text style={[styles.statusBadgeText, { color: Colors.success }]}>✅ Atingida</Text>
                          </View>
                        )}
                        {goal.status === 'expired' && (
                          <View style={[styles.statusBadge, { backgroundColor: Colors.errorBg }]}>
                            <Text style={[styles.statusBadgeText, { color: Colors.error }]}>⏰ Expirada</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.goalDates}>
                        {new Date(goal.startDate).toLocaleDateString('pt-BR')} →{' '}
                        {new Date(goal.endDate).toLocaleDateString('pt-BR')}
                      </Text>
                      {goal.daysRemaining >= 0 && goal.status === 'active' && (
                        <Text style={styles.goalDaysLeft}>📅 {goal.daysRemaining} dias restantes</Text>
                      )}
                    </View>
                    <View style={styles.goalActions}>
                      <TouchableOpacity style={styles.syncBtn} onPress={() => handleSync(goal)}>
                        <Ionicons name="refresh" size={16} color={Colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(goal)}>
                        <Ionicons name="trash-outline" size={16} color={Colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Progresso */}
                  <View style={styles.progressSection}>
                    <View style={styles.progressLabelRow}>
                      <Text style={styles.progressAmounts}>
                        R$ {Number(goal.currentAmount).toFixed(2)} / R$ {Number(goal.targetAmount).toFixed(2)}
                      </Text>
                      <Text style={[styles.progressPct, { color: progressBarColor(pct) }]}>
                        {pct.toFixed(1)}%
                      </Text>
                    </View>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, {
                        width: `${Math.min(pct, 100)}%` as any,
                        backgroundColor: progressBarColor(pct),
                      }]} />
                    </View>
                    {goal.remaining > 0 && (
                      <Text style={styles.progressRemaining}>
                        Faltam <Text style={{ fontWeight: '700' }}>R$ {goal.remaining.toFixed(2)}</Text> para atingir a meta
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      {/* Modal Nova Meta */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nova Meta Financeira</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={Colors.gray[600]} />
              </TouchableOpacity>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Nome da Meta *</Text>
              <TextInput style={styles.input} value={form.name}
                onChangeText={v => setForm(p => ({ ...p, name: v }))}
                placeholder="Ex: Receita de Janeiro" placeholderTextColor={Colors.gray[400]} />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Valor Alvo (R$) *</Text>
              <TextInput style={styles.input} value={form.targetAmount}
                onChangeText={v => setForm(p => ({ ...p, targetAmount: v }))}
                placeholder="0,00" keyboardType="decimal-pad"
                placeholderTextColor={Colors.gray[400]} />
            </View>

            <View style={styles.dateRow}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Data Início</Text>
                <TextInput style={styles.input} value={form.startDate}
                  onChangeText={v => setForm(p => ({ ...p, startDate: v }))}
                  placeholder="AAAA-MM-DD" placeholderTextColor={Colors.gray[400]} />
              </View>
              <View style={[styles.field, { flex: 1, marginLeft: 10 }]}>
                <Text style={styles.label}>Data Fim</Text>
                <TextInput style={styles.input} value={form.endDate}
                  onChangeText={v => setForm(p => ({ ...p, endDate: v }))}
                  placeholder="AAAA-MM-DD" placeholderTextColor={Colors.gray[400]} />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelModalBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.createBtn, saving && styles.btnDisabled]}
                onPress={handleCreate} disabled={saving}>
                {saving
                  ? <ActivityIndicator color={Colors.white} size="small" />
                  : <Text style={styles.createBtnText}>Criar Meta</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.background },
  content:     { padding: Spacing.md, paddingBottom: Spacing.xxl },
  centered:    { paddingVertical: 60, alignItems: 'center' },
  headerRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon:  { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  pageTitle:   { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  pageSub:     { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  addBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 9, borderRadius: BorderRadius.md },
  addBtnText:  { color: Colors.white, fontWeight: '700', fontSize: 14 },
  emptyBox:    { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyTitle:  { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  emptyText:   { fontSize: 13, color: Colors.textSecondary },
  emptyBtn:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: BorderRadius.md, marginTop: 8 },
  emptyBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  summaryRow:  { flexDirection: 'row', gap: 8, marginBottom: Spacing.md },
  summaryCard: { flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: 12, alignItems: 'center', borderTopWidth: 3, ...Shadow.sm },
  summaryValue: { fontSize: 22, fontWeight: '700' },
  summaryLabel: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary, marginTop: 2 },
  goalCard:    { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing.md, marginBottom: 12, borderLeftWidth: 4, ...Shadow.sm },
  goalTop:     { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.sm },
  goalTitleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  goalName:    { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  goalDates:   { fontSize: 12, color: Colors.textSecondary },
  goalDaysLeft: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  goalActions: { flexDirection: 'row', gap: 8 },
  syncBtn:     { padding: 8, backgroundColor: '#ede9fe', borderRadius: 8 },
  deleteBtn:   { padding: 8, backgroundColor: Colors.errorBg, borderRadius: 8 },
  progressSection: { gap: 6 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressAmounts: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  progressPct: { fontSize: 14, fontWeight: '700' },
  progressTrack: { height: 10, backgroundColor: Colors.gray[100], borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5 },
  progressRemaining: { fontSize: 12, color: Colors.textMuted },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox:    { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.lg },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  modalTitle:  { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  field:       { marginBottom: Spacing.sm },
  label:       { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 },
  input:       { backgroundColor: Colors.gray[50], borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.textPrimary },
  dateRow:     { flexDirection: 'row' },
  modalFooter: { flexDirection: 'row', gap: 12, marginTop: Spacing.sm },
  cancelModalBtn: { flex: 1, paddingVertical: 13, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  cancelModalBtnText: { fontSize: 15, fontWeight: '700', color: Colors.textSecondary },
  createBtn:   { flex: 1, backgroundColor: Colors.primary, paddingVertical: 13, borderRadius: BorderRadius.md, alignItems: 'center' },
  createBtnText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
  btnDisabled: { opacity: 0.6 },
});