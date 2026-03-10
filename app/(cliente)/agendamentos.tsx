import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import clientApi from '@/lib/client-api';
import { Badge } from '@/components/ui/Badge';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type AppStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
type FilterType = 'all' | AppStatus;

interface Appointment {
  id: string;
  date: string;
  status: AppStatus;
  notes?: string;
  price: number;
  barbershop: { name: string; logo?: string; city?: string; state?: string; phone?: string };
  service:    { name: string; duration: number };
  barber:     { name: string };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<AppStatus, string> = {
  scheduled: 'Agendado',
  confirmed: 'Confirmado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

const STATUS_VARIANT: Record<AppStatus, any> = {
  scheduled: 'info',
  confirmed: 'success',
  completed: 'gray',
  cancelled: 'error',
};

// ─── Componente ───────────────────────────────────────────────────────────────

export default function AgendamentosScreen() {
  const [appointments,    setAppointments]    = useState<Appointment[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [refreshing,      setRefreshing]      = useState(false);
  const [filter,          setFilter]          = useState<FilterType>('all');
  const [cancelModal,     setCancelModal]     = useState(false);
  const [selectedAppt,    setSelectedAppt]    = useState<Appointment | null>(null);
  const [cancelling,      setCancelling]      = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await clientApi.get('/client/appointments/my-appointments');
      setAppointments(res.data || []);
    } catch (e) {
      console.error('Erro ao carregar agendamentos:', e);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function handleCancelConfirm() {
    if (!selectedAppt) return;
    setCancelling(true);
    try {
      await clientApi.patch(`/client/appointments/${selectedAppt.id}/cancel`);
      setCancelModal(false);
      setSelectedAppt(null);
      await load();
    } catch (e: any) {
      Alert.alert('Erro', e.response?.data?.error || 'Não foi possível cancelar.');
    } finally {
      setCancelling(false);
    }
  }

  function openCancelModal(appt: Appointment) {
    setSelectedAppt(appt);
    setCancelModal(true);
  }

  // Filtragem
  const filtered = appointments.filter(a => filter === 'all' || a.status === filter);
  const now      = new Date();
  const upcoming = filtered.filter(a =>
    new Date(a.date) >= now && a.status !== 'cancelled' && a.status !== 'completed'
  );
  const past     = filtered.filter(a =>
    new Date(a.date) < now || a.status === 'cancelled' || a.status === 'completed'
  );

  const countOf = (s: AppStatus) => appointments.filter(a => a.status === s).length;

  const FILTERS: { key: FilterType; label: string; count: number }[] = [
    { key: 'all',       label: 'Todos',      count: appointments.length },
    { key: 'scheduled', label: 'Agendados',  count: countOf('scheduled') },
    { key: 'confirmed', label: 'Confirmados',count: countOf('confirmed') },
    { key: 'completed', label: 'Concluídos', count: countOf('completed') },
    { key: 'cancelled', label: 'Cancelados', count: countOf('cancelled') },
  ];

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={'#2563eb'} />
        <Text style={styles.loadingText}>Carregando seus agendamentos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meus Agendamentos</Text>
      </View>

      {/* Filtros */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filtersContent}
      >
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]} numberOfLines={1}>
              {f.label} ({f.count})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Lista */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={'#2563eb'} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Seção: Próximos */}
        {upcoming.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar" size={20} color={'#2563eb'} />
              <Text style={styles.sectionTitle}>Próximos Agendamentos</Text>
            </View>
            {upcoming.map(a => (
              <AppointmentCard
                key={a.id}
                appointment={a}
                onCancel={() => openCancelModal(a)}
                isUpcoming
              />
            ))}
          </>
        )}

        {/* Seção: Histórico */}
        {past.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Ionicons name="time-outline" size={20} color={'#9ca3af'} />
              <Text style={[styles.sectionTitle, { color: '#9ca3af' }]}>Histórico</Text>
            </View>
            {past.map(a => (
              <AppointmentCard
                key={a.id}
                appointment={a}
                isUpcoming={false}
              />
            ))}
          </>
        )}

        {/* Empty */}
        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={56} color={'#6b7280'} />
            <Text style={styles.emptyTitle}>Nenhum agendamento encontrado</Text>
            <Text style={styles.emptyText}>
              {filter === 'all'
                ? 'Você ainda não tem agendamentos.'
                : `Você não tem agendamentos ${STATUS_LABEL[filter as AppStatus]?.toLowerCase() ?? ''}.`}
            </Text>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ── Modal de Cancelamento ── */}
      <Modal visible={cancelModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => { setCancelModal(false); setSelectedAppt(null); }}
              disabled={cancelling}
            >
              <Ionicons name="close" size={22} color={'#9ca3af'} />
            </TouchableOpacity>

            <View style={styles.modalIconRow}>
              <Ionicons name="alert-circle" size={40} color={'#f87171'} />
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Cancelar Agendamento</Text>
                <Text style={styles.modalSubtitle}>Esta ação não pode ser desfeita</Text>
              </View>
            </View>

            {/* Resumo */}
            {selectedAppt && (
              <View style={styles.modalSummary}>
                <Text style={styles.modalSummaryLabel}>Você está cancelando:</Text>
                <Text style={styles.modalSummaryService}>{selectedAppt.service.name}</Text>
                <Text style={styles.modalSummaryMeta}>
                  {format(new Date(selectedAppt.date), "dd/MM/yyyy 'às' HH:mm")}
                </Text>
                <Text style={styles.modalSummaryMeta}>{selectedAppt.barbershop.name}</Text>
              </View>
            )}

            {/* Aviso */}
            <View style={styles.modalWarning}>
              <Ionicons name="warning-outline" size={16} color="#92400e" />
              <Text style={styles.modalWarningText}>
                Cancelamentos com menos de 2h de antecedência podem não ser permitidos.
              </Text>
            </View>

            {/* Botões */}
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.modalBtnBack}
                onPress={() => { setCancelModal(false); setSelectedAppt(null); }}
                disabled={cancelling}
              >
                <Text style={styles.modalBtnBackText}>Voltar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtnConfirm, cancelling && { opacity: 0.6 }]}
                onPress={handleCancelConfirm}
                disabled={cancelling}
              >
                {cancelling
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.modalBtnConfirmText}>Confirmar Cancelamento</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── AppointmentCard inline ───────────────────────────────────────────────────

function AppointmentCard({
  appointment: a,
  onCancel,
  isUpcoming,
}: {
  appointment: Appointment;
  onCancel?: () => void;
  isUpcoming: boolean;
}) {
  const date = new Date(a.date);

  return (
    <View style={[styles.card, !isUpcoming && styles.cardPast]}>
      {/* Topo */}
      <View style={styles.cardTop}>
        <View style={styles.cardTopLeft}>
          <Text style={styles.cardShopName}>{a.barbershop.name}</Text>
          <Badge label={STATUS_LABEL[a.status]} variant={STATUS_VARIANT[a.status]} />
        </View>
      </View>

      {/* Info */}
      <View style={styles.cardMeta}>
        <View style={styles.cardMetaItem}>
          <Ionicons name="calendar-outline" size={15} color={isUpcoming ? '#2563eb' : '#9ca3af'} />
          <Text style={styles.cardMetaText}>
            {format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </Text>
        </View>
        <View style={styles.cardMetaItem}>
          <Ionicons name="time-outline" size={15} color={isUpcoming ? '#2563eb' : '#9ca3af'} />
          <Text style={styles.cardMetaText}>
            {format(date, 'HH:mm')} ({a.service.duration}min)
          </Text>
        </View>
        {isUpcoming && a.barbershop.city && (
          <View style={styles.cardMetaItem}>
            <Ionicons name="location-outline" size={15} color={'#2563eb'} />
            <Text style={styles.cardMetaText}>
              {a.barbershop.city}{a.barbershop.state ? `, ${a.barbershop.state}` : ''}
            </Text>
          </View>
        )}
        {isUpcoming && a.barbershop.phone && (
          <View style={styles.cardMetaItem}>
            <Ionicons name="call-outline" size={15} color={'#2563eb'} />
            <Text style={styles.cardMetaText}>{a.barbershop.phone}</Text>
          </View>
        )}
      </View>

      {/* Serviço */}
      <View style={styles.cardService}>
        <Text style={styles.cardServiceLabel}>Serviço</Text>
        <Text style={styles.cardServiceName}>{a.service.name}</Text>
        <Text style={styles.cardBarberText}>Barbeiro: {a.barber.name}</Text>
      </View>

      {/* Notas */}
      {!!a.notes && isUpcoming && (
        <View style={styles.cardNotes}>
          <Text style={styles.cardNotesLabel}>Observações</Text>
          <Text style={styles.cardNotesText}>{a.notes}</Text>
        </View>
      )}

      {/* Rodapé */}
      <View style={styles.cardFooter}>
        <Text style={styles.cardPrice}>R$ {Number(a.price).toFixed(2)}</Text>
        {isUpcoming && a.status !== 'cancelled' && a.status !== 'completed' && (
          <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
            <Text style={styles.cancelBtnText}>Cancelar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#9ca3af' },

  header: {
    backgroundColor: '#151b23', paddingHorizontal: 16,
    paddingTop: 56, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#1f2937',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#ffffff' },

  filtersScroll:   { backgroundColor: '#151b23', borderBottomWidth: 1, borderBottomColor: '#1f2937' },
  filtersContent:  { paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: 'row', alignItems: 'center' },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: '#1f2937', borderRadius: 20,
    borderWidth: 1, borderColor: '#1f2937',
    alignItems: 'center', justifyContent: 'center',
  },
  filterChipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  filterText:       { fontSize: 13, fontWeight: '600', color: '#9ca3af' },
  filterTextActive: { color: '#ffffff' },

  listContent:  { padding: 16, gap: 12 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 8, marginBottom: 4,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#ffffff' },

  empty:     { alignItems: 'center', paddingTop: 60, gap: 12, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#ffffff' },
  emptyText:  { fontSize: 14, color: '#9ca3af', textAlign: 'center', lineHeight: 20 },

  // Card
  card: {
    backgroundColor: '#151b23', borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: '#1f2937', 
    gap: 12,
  },
  cardPast: { opacity: 0.75 },
  cardTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTopLeft: { flex: 1, gap: 6 },
  cardShopName: { fontSize: 17, fontWeight: '700', color: '#ffffff' },

  cardMeta:     { gap: 6 },
  cardMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardMetaText: { fontSize: 13, color: '#9ca3af' },

  cardService: {
    paddingTop: 10, borderTopWidth: 1, borderTopColor: '#1f2937',
  },
  cardServiceLabel: { fontSize: 11, color: '#9ca3af', marginBottom: 2 },
  cardServiceName:  { fontSize: 14, fontWeight: '600', color: '#ffffff' },
  cardBarberText:   { fontSize: 12, color: '#9ca3af', marginTop: 2 },

  cardNotes: {
    backgroundColor: '#1f2937', borderRadius: 10,
    padding: 10,
  },
  cardNotesLabel: { fontSize: 11, color: '#9ca3af', marginBottom: 2 },
  cardNotesText:  { fontSize: 13, color: '#ffffff' },

  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 10, borderTopWidth: 1, borderTopColor: '#1f2937',
  },
  cardPrice:  { fontSize: 18, fontWeight: '700', color: '#2563eb' },
  cancelBtn:  { paddingHorizontal: 14, paddingVertical: 6, backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 10 },
  cancelBtnText: { fontSize: 13, fontWeight: '600', color: '#f87171' },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center', padding: 16,
  },
  modalBox: {
    backgroundColor: '#151b23', borderRadius: 16,
    padding: 20, width: '100%', maxWidth: 400, gap: 16,
  },
  modalClose: { alignSelf: 'flex-end', padding: 4 },
  modalIconRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  modalTitle:    { fontSize: 18, fontWeight: '700', color: '#ffffff' },
  modalSubtitle: { fontSize: 13, color: '#9ca3af', marginTop: 2 },
  modalSummary: {
    backgroundColor: '#1f2937', borderRadius: 12,
    padding: 16, gap: 4,
  },
  modalSummaryLabel:   { fontSize: 12, color: '#9ca3af' },
  modalSummaryService: { fontSize: 15, fontWeight: '700', color: '#ffffff' },
  modalSummaryMeta:    { fontSize: 13, color: '#9ca3af' },
  modalWarning: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: 'rgba(234,179,8,0.1)', borderRadius: 10,
    padding: 12, borderWidth: 1, borderColor: 'rgba(234,179,8,0.3)',
  },
  modalWarningText: { fontSize: 12, color: '#fef08a', flex: 1, lineHeight: 18 },
  modalBtns:        { flexDirection: 'row', gap: 10 },
  modalBtnBack: {
    flex: 1, backgroundColor: '#1f2937', borderRadius: 10,
    paddingVertical: 12, alignItems: 'center',
  },
  modalBtnBackText:     { fontWeight: '700', color: '#9ca3af' },
  modalBtnConfirm: {
    flex: 1, backgroundColor: '#f87171', borderRadius: 10,
    paddingVertical: 12, alignItems: 'center',
  },
  modalBtnConfirmText: { fontWeight: '700', color: '#151b23', fontSize: 13 },
});