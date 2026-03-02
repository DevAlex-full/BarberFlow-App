import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
  TextInput, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '@/lib/api';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/colors';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  scheduled:  { label: 'Agendado',   color: '#2563eb', bg: '#eff6ff' },
  confirmed:  { label: 'Confirmado', color: '#16a34a', bg: '#f0fdf4' },
  completed:  { label: 'Concluído',  color: '#9333ea', bg: '#faf5ff' },
  cancelled:  { label: 'Cancelado',  color: '#dc2626', bg: '#fef2f2' },
};

export default function AgendamentosScreen() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]         = useState('');
  const [filterStatus, setFilter]   = useState('');
  const [selected, setSelected]     = useState<any>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await api.get('/appointments');
      setAppointments(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function updateStatus(id: string, status: string) {
    try {
      await api.put(`/appointments/${id}`, { status });
      setSelected((prev: any) => prev ? { ...prev, status } : null);
      load();
    } catch (e) {
      console.error(e);
    }
  }

  const filtered = appointments.filter(a => {
    const matchSearch = !search ||
      a.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.service?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Carregando agendamentos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Busca */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={Colors.gray[400]} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar cliente ou serviço..."
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

      {/* Filtros de status */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filters}
        contentContainerStyle={{ gap: 8, paddingHorizontal: Spacing.md }}
      >
        {['', 'scheduled', 'confirmed', 'completed', 'cancelled'].map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.filterChip, filterStatus === s && styles.filterChipActive]}
            onPress={() => setFilter(s)}
          >
            <Text style={[styles.filterChipText, filterStatus === s && styles.filterChipTextActive]}>
              {s === '' ? 'Todos' : STATUS_MAP[s]?.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Lista */}
      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={48} color={Colors.gray[300]} />
            <Text style={styles.emptyText}>Nenhum agendamento encontrado</Text>
          </View>
        ) : (
          filtered.map(a => (
            <TouchableOpacity
              key={a.id}
              style={styles.card}
              onPress={() => setSelected(a)}
              activeOpacity={0.75}
            >
              {/* Avatar */}
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(a.customer?.name || '?').charAt(0).toUpperCase()}
                </Text>
              </View>

              {/* Info */}
              <View style={styles.info}>
                <Text style={styles.clientName}>{a.customer?.name || '-'}</Text>
                <Text style={styles.serviceName}>{a.service?.name || '-'}</Text>
                <View style={styles.meta}>
                  <Ionicons name="person-outline" size={12} color={Colors.textMuted} />
                  <Text style={styles.metaText}>{a.barber?.name || '-'}</Text>
                  <Ionicons name="time-outline" size={12} color={Colors.textMuted} style={{ marginLeft: 8 }} />
                  <Text style={styles.metaText}>{a.service?.duration || 0}min</Text>
                </View>
              </View>

              {/* Direita */}
              <View style={styles.right}>
                <Text style={styles.dateText}>
                  {format(new Date(a.date), "dd/MM", { locale: ptBR })}
                </Text>
                <Text style={styles.timeText}>
                  {format(new Date(a.date), "HH:mm")}
                </Text>
                <View style={[styles.badge, { backgroundColor: STATUS_MAP[a.status]?.bg }]}>
                  <Text style={[styles.badgeText, { color: STATUS_MAP[a.status]?.color }]}>
                    {STATUS_MAP[a.status]?.label || a.status}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Modal de detalhes */}
      <Modal visible={!!selected} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalhes do Agendamento</Text>
              <TouchableOpacity onPress={() => setSelected(null)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selected && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Cliente */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Cliente</Text>
                  <Text style={styles.modalValue}>{selected.customer?.name}</Text>
                </View>
                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Serviço</Text>
                  <Text style={styles.modalValue}>{selected.service?.name}</Text>
                </View>
                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Barbeiro</Text>
                  <Text style={styles.modalValue}>{selected.barber?.name}</Text>
                </View>
                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Data e Hora</Text>
                  <Text style={styles.modalValue}>
                    {format(new Date(selected.date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                  </Text>
                </View>
                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Duração</Text>
                  <Text style={styles.modalValue}>{selected.service?.duration} minutos</Text>
                </View>
                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Valor</Text>
                  <Text style={[styles.modalValue, { color: Colors.success }]}>
                    R$ {Number(selected.service?.price || 0).toFixed(2)}
                  </Text>
                </View>

                {/* Atualizar status */}
                <Text style={[styles.modalLabel, { marginTop: Spacing.md, marginBottom: 8 }]}>
                  Atualizar Status
                </Text>
                <View style={styles.statusButtons}>
                  {Object.entries(STATUS_MAP).map(([key, val]) => (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.statusBtn,
                        { backgroundColor: val.bg, borderColor: val.color },
                        selected.status === key && styles.statusBtnActive,
                      ]}
                      onPress={() => updateStatus(selected.id, key)}
                    >
                      <Text style={[styles.statusBtnText, { color: val.color }]}>
                        {val.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  loadingText: { color: Colors.textSecondary, fontSize: 14 },

  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.white, margin: Spacing.md,
    borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md,
    borderWidth: 1, borderColor: Colors.border, ...Shadow.sm,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.textPrimary, paddingVertical: 12 },

  filters: { marginBottom: Spacing.sm, maxHeight: 44 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: BorderRadius.full, backgroundColor: Colors.white,
    borderWidth: 1, borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  filterChipTextActive: { color: Colors.white },

  list: { padding: Spacing.md, paddingTop: 0, gap: 10 },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: 8 },
  emptyText: { color: Colors.textSecondary, fontSize: 15 },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.md, ...Shadow.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  avatar: {
    width: 48, height: 48, borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: Colors.white, fontWeight: '700', fontSize: 20 },
  info: { flex: 1 },
  clientName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  serviceName: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  metaText: { fontSize: 12, color: Colors.textMuted },
  right: { alignItems: 'flex-end', gap: 4 },
  dateText: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  timeText: { fontSize: 13, color: Colors.textSecondary },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full },
  badgeText: { fontSize: 11, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: Spacing.lg, maxHeight: '85%',
  },
  modalHandle: { width: 40, height: 4, backgroundColor: Colors.gray[300], borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.md },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  modalSection: { marginBottom: Spacing.sm, paddingBottom: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalLabel: { fontSize: 12, color: Colors.textMuted, fontWeight: '500', marginBottom: 2 },
  modalValue: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  statusButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.lg, borderWidth: 1.5 },
  statusBtnActive: { opacity: 1 },
  statusBtnText: { fontSize: 13, fontWeight: '700' },
});