import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/colors';

// ─── Tipos (espelham commissions.ts do web) ───────────────────────────────────

interface Commission {
  id:             string;
  percentage:     number;
  amount:         number;
  status:         'pending' | 'paid';
  paidAt?:        string;
  barber?: {
    name:  string;
    email: string;
  };
}

interface CommissionReport {
  commissions: Commission[];
  summary: {
    total:        number;
    pending:      number;
    paid:         number;
    totalPending: number;
    totalPaid:    number;
    totalAmount:  number;
  };
}

interface BarberUser {
  id:                  string;
  name:                string;
  role:                string;
  commissionPercentage: number;
}

const MONTHS = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];

export default function ComissoesScreen() {
  const currentDate              = new Date();
  const [selectedMonth, setMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear,  setYear]  = useState(currentDate.getFullYear());

  const [loading,      setLoading]      = useState(true);
  const [calculating,  setCalculating]  = useState(false);
  const [report,       setReport]       = useState<CommissionReport | null>(null);
  const [barbers,      setBarbers]      = useState<BarberUser[]>([]);
  const [showConfig,   setShowConfig]   = useState(false);
  const [editingId,    setEditingId]    = useState<string | null>(null);
  const [tempPct,      setTempPct]      = useState('40');

  useEffect(() => { loadReport(); loadBarbers(); }, [selectedMonth, selectedYear]);

  // ── Carregar relatório ──────────────────────────────────────────────────────
  async function loadReport() {
    setLoading(true);
    try {
      // ✅ /commissions/report?month=X&year=Y  (commissionsApi.getReport)
      const res = await api.get<CommissionReport>('/commissions/report', {
        params: { month: selectedMonth, year: selectedYear },
      });
      setReport(res.data);
    } catch (e) {
      console.error('Erro ao carregar comissões:', e);
      setReport(null);
    } finally {
      setLoading(false);
    }
  }

  // ── Carregar barbeiros ──────────────────────────────────────────────────────
  async function loadBarbers() {
    try {
      // ✅ /users  (api.get('/users'))
      const res = await api.get('/users');
      setBarbers(
        res.data.map((u: any) => ({
          id:                   u.id,
          name:                 u.name,
          role:                 u.role,
          commissionPercentage: u.commissionPercentage ?? 40,
        }))
      );
    } catch (e) {
      console.error('Erro ao carregar barbeiros:', e);
    }
  }

  // ── Calcular comissões ─────────────────────────────────────────────────────
  async function handleCalculate() {
    Alert.alert(
      'Calcular Comissões',
      `Calcular comissões para ${MONTHS[selectedMonth - 1]}/${selectedYear}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Calcular',
          onPress: async () => {
            setCalculating(true);
            try {
              // ✅ POST /commissions/calculate  (commissionsApi.calculate)
              await api.post('/commissions/calculate', {
                month: selectedMonth,
                year:  selectedYear,
              });
              Alert.alert('✅ Sucesso', 'Comissões calculadas com sucesso!');
              loadReport();
            } catch (e: any) {
              Alert.alert('Erro', e.response?.data?.error || 'Erro ao calcular comissões');
            } finally {
              setCalculating(false);
            }
          },
        },
      ]
    );
  }

  // ── Pagar comissão ─────────────────────────────────────────────────────────
  async function handlePay(commission: Commission) {
    Alert.alert(
      'Confirmar Pagamento',
      `Pagar comissão de ${commission.barber?.name}?\nValor: R$ ${Number(commission.amount).toFixed(2)}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              // ✅ PUT /commissions/{id}/pay  (commissionsApi.pay)
              await api.put(`/commissions/${commission.id}/pay`);
              Alert.alert('✅ Pago!', 'Comissão marcada como paga.');
              loadReport();
            } catch (e: any) {
              Alert.alert('Erro', e.response?.data?.error || 'Erro ao pagar comissão');
            }
          },
        },
      ]
    );
  }

  // ── Salvar percentual do barbeiro ──────────────────────────────────────────
  async function handleSavePercentage(barberId: string) {
    const pct = parseFloat(tempPct);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      Alert.alert('Valor inválido', 'O percentual deve estar entre 0 e 100.');
      return;
    }
    try {
      // ✅ PUT /users/{id}/commission  (api.put)
      await api.put(`/users/${barberId}/commission`, { commissionPercentage: pct });
      setBarbers(prev => prev.map(b => b.id === barberId ? { ...b, commissionPercentage: pct } : b));
      setEditingId(null);
      Alert.alert('✅ Atualizado', 'Percentual salvo com sucesso!');
    } catch (e: any) {
      Alert.alert('Erro', e.response?.data?.error || 'Erro ao salvar percentual');
    }
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
              <Ionicons name="cash" size={22} color={Colors.white} />
            </View>
            <View>
              <Text style={styles.pageTitle}>Comissões</Text>
              <Text style={styles.pageSub}>Gestão de comissões dos barbeiros</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.configBtn} onPress={() => setShowConfig(true)}>
            <Ionicons name="settings" size={18} color={Colors.white} />
            <Text style={styles.configBtnText}>Percentuais</Text>
          </TouchableOpacity>
        </View>

        {/* Seletor de período */}
        <View style={styles.periodCard}>
          <Text style={styles.periodLabel}>Período</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            style={{ marginTop: 8 }} contentContainerStyle={styles.monthRow}>
            {MONTHS.map((m, i) => (
              <TouchableOpacity key={i}
                style={[styles.monthBtn, selectedMonth === i + 1 && styles.monthBtnActive]}
                onPress={() => setMonth(i + 1)}>
                <Text style={[styles.monthBtnText, selectedMonth === i + 1 && styles.monthBtnTextActive]}>
                  {m.slice(0, 3)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.yearRow}>
            {[currentDate.getFullYear() - 1, currentDate.getFullYear()].map(y => (
              <TouchableOpacity key={y}
                style={[styles.yearBtn, selectedYear === y && styles.yearBtnActive]}
                onPress={() => setYear(y)}>
                <Text style={[styles.yearBtnText, selectedYear === y && styles.yearBtnTextActive]}>{y}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Botão calcular */}
        <TouchableOpacity style={[styles.calcBtn, calculating && styles.btnDisabled]}
          onPress={handleCalculate} disabled={calculating}>
          {calculating
            ? <ActivityIndicator color={Colors.white} size="small" />
            : <Ionicons name="calculator" size={20} color={Colors.white} />}
          <Text style={styles.calcBtnText}>
            {calculating ? 'Calculando...' : `Calcular — ${MONTHS[selectedMonth - 1]}/${selectedYear}`}
          </Text>
        </TouchableOpacity>

        {/* Loading */}
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : !report || report.commissions.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="calculator-outline" size={56} color={Colors.gray[300]} />
            <Text style={styles.emptyTitle}>Nenhuma comissão calculada</Text>
            <Text style={styles.emptyText}>
              Clique em Calcular para gerar as comissões de {MONTHS[selectedMonth - 1]}/{selectedYear}
            </Text>
          </View>
        ) : (
          <>
            {/* Resumo */}
            <View style={styles.summaryGrid}>
              {[
                { label: 'Total',    value: report.summary.total,        color: Colors.primary,  icon: 'people' },
                { label: 'Pendentes', value: report.summary.pending,      color: Colors.warning,  icon: 'time' },
                { label: 'Pagas',     value: report.summary.paid,         color: Colors.success,  icon: 'checkmark-circle' },
                { label: 'Valor Total', value: `R$ ${report.summary.totalAmount.toFixed(2)}`, color: '#8b5cf6', icon: 'cash' },
              ].map((s, i) => (
                <View key={i} style={[styles.summaryCard, { borderTopColor: s.color }]}>
                  <Ionicons name={s.icon as any} size={20} color={s.color} />
                  <Text style={styles.summaryLabel}>{s.label}</Text>
                  <Text style={[styles.summaryValue, { color: s.color }]}>{s.value}</Text>
                </View>
              ))}
            </View>

            {/* Pendentes */}
            {report.commissions.filter(c => c.status === 'pending').length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>⏳ Pendentes de Pagamento</Text>
                <Text style={styles.sectionSub}>
                  Total: R$ {report.summary.totalPending.toFixed(2)}
                </Text>
                {report.commissions
                  .filter(c => c.status === 'pending')
                  .map(c => (
                    <View key={c.id} style={[styles.commCard, { borderLeftColor: Colors.warning }]}>
                      <View style={styles.commAvatar}>
                        <Text style={styles.commAvatarText}>
                          {(c.barber?.name || 'B').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.commName}>{c.barber?.name || 'Barbeiro'}</Text>
                        <Text style={styles.commMeta}>{c.percentage}% de comissão</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 8 }}>
                        <Text style={styles.commAmount}>R$ {Number(c.amount).toFixed(2)}</Text>
                        <TouchableOpacity style={styles.payBtn} onPress={() => handlePay(c)}>
                          <Ionicons name="checkmark-circle" size={16} color={Colors.white} />
                          <Text style={styles.payBtnText}>Pagar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
              </View>
            )}

            {/* Pagas */}
            {report.commissions.filter(c => c.status === 'paid').length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>✅ Comissões Pagas</Text>
                {report.commissions
                  .filter(c => c.status === 'paid')
                  .map(c => (
                    <View key={c.id} style={[styles.commCard, { borderLeftColor: Colors.success }]}>
                      <View style={[styles.commAvatar, { backgroundColor: Colors.successBg }]}>
                        <Text style={[styles.commAvatarText, { color: Colors.success }]}>
                          {(c.barber?.name || 'B').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.commName}>{c.barber?.name || 'Barbeiro'}</Text>
                        <Text style={styles.commMeta}>
                          {c.percentage}% •{' '}
                          {c.paidAt ? `Pago em ${new Date(c.paidAt).toLocaleDateString('pt-BR')}` : 'Pago'}
                        </Text>
                      </View>
                      <Text style={[styles.commAmount, { color: Colors.success }]}>
                        R$ {Number(c.amount).toFixed(2)}
                      </Text>
                    </View>
                  ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Modal de configuração de percentuais */}
      <Modal visible={showConfig} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>⚙️ Percentuais de Comissão</Text>
              <TouchableOpacity onPress={() => setShowConfig(false)}>
                <Ionicons name="close" size={24} color={Colors.gray[600]} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              {barbers.map(b => (
                <View key={b.id} style={styles.barberRow}>
                  <View style={styles.barberInfo}>
                    <Text style={styles.barberName}>{b.name}</Text>
                    <View style={styles.roleBadge}>
                      <Text style={styles.roleBadgeText}>
                        {b.role === 'admin' ? 'Admin' : 'Barbeiro'}
                      </Text>
                    </View>
                  </View>
                  {editingId === b.id ? (
                    <View style={styles.editRow}>
                      <TextInput style={styles.pctInput} value={tempPct}
                        onChangeText={setTempPct} keyboardType="decimal-pad" />
                      <Text style={styles.pctSymbol}>%</Text>
                      <TouchableOpacity style={styles.savePctBtn}
                        onPress={() => handleSavePercentage(b.id)}>
                        <Ionicons name="checkmark" size={18} color={Colors.white} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.cancelPctBtn}
                        onPress={() => setEditingId(null)}>
                        <Ionicons name="close" size={18} color={Colors.gray[600]} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.editRow}>
                      <Text style={styles.pctDisplay}>{b.commissionPercentage}%</Text>
                      <TouchableOpacity style={styles.editPctBtn}
                        onPress={() => { setEditingId(b.id); setTempPct(String(b.commissionPercentage)); }}>
                        <Ionicons name="pencil" size={16} color={Colors.white} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setShowConfig(false)}>
              <Text style={styles.closeModalBtnText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.background },
  content:    { padding: Spacing.md, paddingBottom: Spacing.xxl },
  centered:   { paddingVertical: 60, alignItems: 'center' },
  headerRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  pageTitle:  { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  pageSub:    { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  configBtn:  { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#7c3aed', paddingHorizontal: 14, paddingVertical: 9, borderRadius: BorderRadius.md },
  configBtnText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  periodCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, ...Shadow.sm, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  periodLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  monthRow:   { gap: 8, paddingBottom: 4 },
  monthBtn:   { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: Colors.gray[100], borderWidth: 1, borderColor: Colors.border },
  monthBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  monthBtnText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  monthBtnTextActive: { color: Colors.white },
  yearRow:    { flexDirection: 'row', gap: 10, marginTop: 12 },
  yearBtn:    { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: BorderRadius.md, backgroundColor: Colors.gray[100], borderWidth: 1, borderColor: Colors.border },
  yearBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  yearBtnText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  yearBtnTextActive: { color: Colors.white },
  calcBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.success, borderRadius: BorderRadius.md, paddingVertical: 14, marginBottom: Spacing.md },
  calcBtnText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
  btnDisabled: { opacity: 0.6 },
  emptyBox:   { alignItems: 'center', paddingVertical: 50, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  emptyText:  { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 20 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: Spacing.md },
  summaryCard: { flex: 1, minWidth: '45%', backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: 14, alignItems: 'center', gap: 4, borderTopWidth: 3, ...Shadow.sm },
  summaryLabel: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary, marginTop: 2 },
  summaryValue: { fontSize: 16, fontWeight: '700' },
  section:    { marginBottom: Spacing.md },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  sectionSub:  { fontSize: 12, color: Colors.textSecondary, marginBottom: 10 },
  commCard:   { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: 8, borderLeftWidth: 4, ...Shadow.sm },
  commAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.gray[100], alignItems: 'center', justifyContent: 'center' },
  commAvatarText: { fontSize: 18, fontWeight: '700', color: Colors.textSecondary },
  commName:   { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  commMeta:   { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  commAmount: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  payBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.success, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  payBtnText: { color: Colors.white, fontWeight: '700', fontSize: 12 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox:   { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.lg },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  barberRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  barberInfo: { flex: 1, gap: 4 },
  barberName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  roleBadge:  { alignSelf: 'flex-start', backgroundColor: '#ede9fe', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  roleBadgeText: { fontSize: 11, fontWeight: '700', color: '#7c3aed' },
  editRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pctDisplay: { fontSize: 22, fontWeight: '700', color: Colors.primary },
  pctInput:   { width: 60, backgroundColor: Colors.gray[50], borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, fontSize: 18, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  pctSymbol:  { fontSize: 16, fontWeight: '700', color: Colors.textSecondary },
  editPctBtn: { backgroundColor: Colors.primary, padding: 8, borderRadius: 8 },
  savePctBtn: { backgroundColor: Colors.success, padding: 8, borderRadius: 8 },
  cancelPctBtn: { backgroundColor: Colors.gray[200], padding: 8, borderRadius: 8 },
  closeModalBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: 14, alignItems: 'center', marginTop: Spacing.md },
  closeModalBtnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
});