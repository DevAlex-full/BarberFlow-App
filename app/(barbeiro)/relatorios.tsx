import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/colors';

// ─── Tipos espelham o web (/reports/{type}) ───────────────────────────────────

type ReportType = 'appointments' | 'revenue' | 'customers';

interface ReportSummary {
  [key: string]: number | string;
}

interface ReportData {
  summary: ReportSummary;
  data:    any[];
}

const REPORT_TYPES: { key: ReportType; label: string; icon: string; color: string; sub: string }[] = [
  { key: 'appointments', label: 'Agendamentos', icon: 'calendar',    color: '#8b5cf6', sub: 'Histórico completo' },
  { key: 'revenue',      label: 'Receita',      icon: 'trending-up', color: '#10b981', sub: 'Faturamento detalhado' },
  { key: 'customers',    label: 'Clientes',     icon: 'people',      color: '#3b82f6', sub: 'Análise de clientes' },
];

// ─── Utilitários de data ──────────────────────────────────────────────────────

/** Aplica máscara dd/mm/aaaa enquanto o usuário digita */
function maskDate(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/** Converte dd/mm/aaaa → aaaa-mm-dd para a API */
function toApiDate(masked: string): string {
  const parts = masked.split('/');
  if (parts.length !== 3 || parts[2].length !== 4) return '';
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

/** Valida se dd/mm/aaaa é uma data real */
function isValidDate(masked: string): boolean {
  if (masked.length !== 10) return false;
  const api = toApiDate(masked);
  const d   = new Date(api);
  return !isNaN(d.getTime());
}

export default function RelatoriosScreen() {
  const [reportType, setReportType] = useState<ReportType>('appointments');
  const [loading, setLoading]       = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  // Datas com máscara dd/mm/aaaa
  const [startMask, setStartMask] = useState('');
  const [endMask,   setEndMask]   = useState('');

  const [startError, setStartError] = useState('');
  const [endError,   setEndError]   = useState('');

  const [filters, setFilters] = useState({
    barberId: '',
    status:   '',
  });

  const [barbers, setBarbers] = useState<any[]>([]);

  useEffect(() => { loadFiltersData(); }, []);

  async function loadFiltersData() {
    try {
      const [bRes] = await Promise.all([
        api.get('/users'),
      ]);
      setBarbers(bRes.data || []);
    } catch (e) {
      console.error('Erro ao carregar filtros:', e);
    }
  }

  // ── Gerar relatório ────────────────────────────────────────────────────────
  async function handleGenerateReport() {
    // Validar datas preenchidas
    if (startMask && !isValidDate(startMask)) {
      setStartError('Data inválida. Use dd/mm/aaaa');
      return;
    }
    if (endMask && !isValidDate(endMask)) {
      setEndError('Data inválida. Use dd/mm/aaaa');
      return;
    }
    setStartError('');
    setEndError('');

    setLoading(true);
    setReportData(null);
    try {
      // ✅ Endpoint correto: /reports/{type} — espelha o web exatamente
      const params: Record<string, string> = {};
      if (startMask) params.startDate = toApiDate(startMask);
      if (endMask)   params.endDate   = toApiDate(endMask);
      if (filters.barberId) params.barberId = filters.barberId;
      if (filters.status)   params.status   = filters.status;

      const res = await api.get(`/reports/${reportType}`, { params });
      setReportData(res.data);
    } catch (e: any) {
      Alert.alert('Erro', e.response?.data?.error || 'Erro ao gerar relatório');
    } finally {
      setLoading(false);
    }
  }

  function formatSummaryKey(key: string) {
    const map: Record<string, string> = {
      totalAppointments:     'Total de Agendamentos',
      completedAppointments: 'Concluídos',
      cancelledAppointments: 'Cancelados',
      totalRevenue:          'Receita Total',
      averageRevenue:        'Receita Média',
      totalCustomers:        'Total de Clientes',
      newCustomers:          'Novos Clientes',
      returningCustomers:    'Clientes Recorrentes',
    };
    return map[key] || key.replace(/([A-Z])/g, ' $1').trim();
  }

  function formatSummaryValue(key: string, value: any) {
    if (typeof value === 'number' && key.toLowerCase().includes('revenue')) {
      return `R$ ${Number(value).toFixed(2)}`;
    }
    return String(value);
  }

  const currentType = REPORT_TYPES.find(t => t.key === reportType)!;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.headerIcon, { backgroundColor: currentType.color }]}>
          <Ionicons name="document-text" size={22} color={Colors.white} />
        </View>
        <View>
          <Text style={styles.headerTitle}>Relatórios</Text>
          <Text style={styles.headerSub}>Gere relatórios detalhados</Text>
        </View>
      </View>

      {/* Seleção do tipo */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tipo de Relatório</Text>
        <View style={styles.typeRow}>
          {REPORT_TYPES.map(t => (
            <TouchableOpacity key={t.key}
              style={[styles.typeBtn, reportType === t.key && { borderColor: t.color, backgroundColor: t.color + '10' }]}
              onPress={() => { setReportType(t.key); setReportData(null); }}>
              <Ionicons name={t.icon as any} size={20} color={reportType === t.key ? t.color : Colors.gray[400]} />
              <Text style={[styles.typeBtnText, reportType === t.key && { color: t.color }]}>{t.label}</Text>
              <Text style={styles.typeBtnSub}>{t.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Filtros */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Filtros</Text>

        {/* ── Datas com máscara ────────────────────────────────────────────── */}
        <View style={styles.row}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Data Início</Text>
            <View style={[styles.dateInputBox, !!startError && { borderColor: Colors.error }]}>
              <Ionicons name="calendar-outline" size={16} color={Colors.gray[400]} />
              <TextInput
                style={styles.dateInput}
                value={startMask}
                onChangeText={v => {
                  setStartMask(maskDate(v));
                  setStartError('');
                }}
                placeholder="dd/mm/aaaa"
                placeholderTextColor={Colors.gray[400]}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>
            {!!startError && <Text style={styles.errorText}>{startError}</Text>}
          </View>

          <View style={[styles.field, { flex: 1, marginLeft: 12 }]}>
            <Text style={styles.label}>Data Fim</Text>
            <View style={[styles.dateInputBox, !!endError && { borderColor: Colors.error }]}>
              <Ionicons name="calendar-outline" size={16} color={Colors.gray[400]} />
              <TextInput
                style={styles.dateInput}
                value={endMask}
                onChangeText={v => {
                  setEndMask(maskDate(v));
                  setEndError('');
                }}
                placeholder="dd/mm/aaaa"
                placeholderTextColor={Colors.gray[400]}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>
            {!!endError && <Text style={styles.errorText}>{endError}</Text>}
          </View>
        </View>

        {/* Dica de data */}
        <View style={styles.dateTip}>
          <Ionicons name="information-circle-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.dateTipText}>
            Digite as datas no formato dia/mês/ano (ex: 01/01/2025). Deixe em branco para todos os períodos.
          </Text>
        </View>

        {/* Filtro Barbeiro (agendamentos + receita) */}
        {(reportType === 'appointments' || reportType === 'revenue') && barbers.length > 0 && (
          <View style={styles.field}>
            <Text style={styles.label}>Barbeiro</Text>
            <View style={styles.filterRow}>
              <TouchableOpacity
                style={[styles.filterChip, !filters.barberId && styles.filterChipActive]}
                onPress={() => setFilters(p => ({ ...p, barberId: '' }))}>
                <Text style={[styles.filterChipText, !filters.barberId && styles.filterChipTextActive]}>Todos</Text>
              </TouchableOpacity>
              {barbers.map((b: any) => (
                <TouchableOpacity key={b.id}
                  style={[styles.filterChip, filters.barberId === b.id && styles.filterChipActive]}
                  onPress={() => setFilters(p => ({ ...p, barberId: b.id }))}>
                  <Text style={[styles.filterChipText, filters.barberId === b.id && styles.filterChipTextActive]}>
                    {b.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Filtro Status (só agendamentos) */}
        {reportType === 'appointments' && (
          <View style={styles.field}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.filterRow}>
              {[
                { key: '',          label: 'Todos' },
                { key: 'scheduled', label: 'Agendado' },
                { key: 'confirmed', label: 'Confirmado' },
                { key: 'completed', label: 'Concluído' },
                { key: 'cancelled', label: 'Cancelado' },
              ].map(s => (
                <TouchableOpacity key={s.key}
                  style={[styles.filterChip, filters.status === s.key && styles.filterChipActive]}
                  onPress={() => setFilters(p => ({ ...p, status: s.key }))}>
                  <Text style={[styles.filterChipText, filters.status === s.key && styles.filterChipTextActive]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Botão Gerar */}
        <TouchableOpacity style={[styles.generateBtn, loading && styles.btnDisabled]}
          onPress={handleGenerateReport} disabled={loading}>
          {loading
            ? <ActivityIndicator color={Colors.white} size="small" />
            : <Ionicons name="document-text" size={20} color={Colors.white} />}
          <Text style={styles.generateBtnText}>{loading ? 'Gerando...' : 'Gerar Relatório'}</Text>
        </TouchableOpacity>
      </View>

      {/* Resultado */}
      {reportData && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Resultado</Text>

          {/* Resumo */}
          {reportData.summary && (
            <View style={styles.summaryGrid}>
              {Object.entries(reportData.summary).map(([key, value]) => (
                <View key={key} style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>{formatSummaryKey(key)}</Text>
                  <Text style={[styles.summaryValue, { color: currentType.color }]}>
                    {formatSummaryValue(key, value)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Tabela de dados (preview limitado a 5 itens) */}
          {reportData.data?.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.previewTitle}>
                Preview ({Math.min(5, reportData.data.length)} de {reportData.data.length} registros)
              </Text>
              {reportData.data.slice(0, 5).map((item: any, i: number) => (
                <View key={i} style={styles.previewRow}>
                  {Object.entries(item).slice(0, 3).map(([k, v]: [string, any]) => (
                    <Text key={k} style={styles.previewText} numberOfLines={1}>
                      <Text style={{ fontWeight: '600' }}>{formatSummaryKey(k)}: </Text>
                      {String(v)}
                    </Text>
                  ))}
                </View>
              ))}
              {reportData.data.length > 5 && (
                <Text style={styles.previewMore}>
                  + {reportData.data.length - 5} registros adicionais
                </Text>
              )}
            </View>
          )}

          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={16} color={Colors.primary} />
            <Text style={styles.infoText}>
              Acesse o painel web para exportar este relatório em PDF ou Excel.
            </Text>
          </View>
        </View>
      )}

      {/* Empty state */}
      {!reportData && !loading && (
        <View style={styles.emptyBox}>
          <Ionicons name="document-text-outline" size={48} color={Colors.gray[300]} />
          <Text style={styles.emptyTitle}>Nenhum relatório gerado</Text>
          <Text style={styles.emptyText}>Selecione os filtros e clique em Gerar Relatório</Text>
        </View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.background },
  content:      { padding: Spacing.md, paddingBottom: Spacing.xxl },
  header:       { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: Spacing.md },
  headerIcon:   { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  headerTitle:  { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  headerSub:    { fontSize: 13, color: Colors.textSecondary },
  section:      { marginBottom: Spacing.md },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm },
  card:         { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing.md, ...Shadow.sm, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  typeRow:      { gap: 10 },
  typeBtn:      { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 2, borderColor: Colors.border, marginBottom: 8 },
  typeBtnText:  { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  typeBtnSub:   { fontSize: 11, color: Colors.textSecondary },
  field:        { marginBottom: Spacing.sm },
  label:        { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 },
  row:          { flexDirection: 'row' },

  // Date input com máscara
  dateInputBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.gray[50], borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingHorizontal: 12, paddingVertical: 10,
  },
  dateInput:    { flex: 1, fontSize: 15, color: Colors.textPrimary },
  errorText:    { fontSize: 11, color: Colors.error, marginTop: 4 },
  dateTip: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: Colors.gray[50], borderRadius: BorderRadius.sm,
    padding: 8, marginBottom: Spacing.sm,
  },
  dateTipText: { flex: 1, fontSize: 11, color: Colors.textMuted, lineHeight: 16 },

  filterRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip:   { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: Colors.gray[100], borderWidth: 1, borderColor: Colors.border },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  filterChipTextActive: { color: Colors.white },
  generateBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: 14, marginTop: 8 },
  generateBtnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  btnDisabled:  { opacity: 0.6 },
  summaryGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: Spacing.md },
  summaryCard:  { flex: 1, minWidth: '45%', backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, ...Shadow.sm, borderWidth: 1, borderColor: Colors.border },
  summaryLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500', marginBottom: 4 },
  summaryValue: { fontSize: 20, fontWeight: '700' },
  previewTitle: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 10 },
  previewRow:   { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  previewText:  { fontSize: 13, color: Colors.textPrimary, marginBottom: 2 },
  previewMore:  { fontSize: 12, color: Colors.textMuted, marginTop: 8, textAlign: 'center', fontStyle: 'italic' },
  infoBox:      { flexDirection: 'row', gap: 8, backgroundColor: '#faf5ff', borderRadius: BorderRadius.md, padding: Spacing.sm, borderWidth: 1, borderColor: '#e9d5ff' },
  infoText:     { flex: 1, fontSize: 12, color: Colors.textSecondary },
  emptyBox:     { alignItems: 'center', padding: Spacing.xxl, gap: 8 },
  emptyTitle:   { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  emptyText:    { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
});