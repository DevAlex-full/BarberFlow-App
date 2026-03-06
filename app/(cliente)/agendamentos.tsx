import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import clientApi from '@/lib/client-api';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/colors';
import { AppointmentCard as ClientAppointmentCard } from '@/components/cliente/AppointmentCard';

type TabType = 'upcoming' | 'completed' | 'cancelled';

export default function ClienteAgendamentosScreen() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [tab,          setTab]          = useState<TabType>('upcoming');

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await clientApi.get('/client/appointments');
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

  async function handleCancel(id: string) {
    Alert.alert('Cancelar', 'Deseja cancelar este agendamento?', [
      { text: 'Não', style: 'cancel' },
      {
        text: 'Sim, cancelar',
        style: 'destructive',
        onPress: async () => {
          try {
            await clientApi.patch(`/client/appointments/${id}/cancel`);
            setAppointments(prev =>
              prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a)
            );
          } catch {
            Alert.alert('Erro', 'Não foi possível cancelar.');
          }
        },
      },
    ]);
  }

  const now = new Date();
  const upcoming  = appointments.filter(a => a.status !== 'completed' && a.status !== 'cancelled' && new Date(a.date) >= now);
  const completed = appointments.filter(a => a.status === 'completed');
  const cancelled = appointments.filter(a => a.status === 'cancelled');

  const TAB_DATA: Record<TabType, any[]> = { upcoming, completed, cancelled };
  const display = TAB_DATA[tab];

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
        <Text style={styles.headerTitle}>Meus Agendamentos</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {([
          { key: 'upcoming',  label: 'Próximos',  count: upcoming.length  },
          { key: 'completed', label: 'Concluídos', count: completed.length },
          { key: 'cancelled', label: 'Cancelados', count: cancelled.length },
        ] as { key: TabType; label: string; count: number }[]).map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
            {t.count > 0 && (
              <View style={[styles.tabBadge, tab === t.key && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, tab === t.key && styles.tabBadgeTextActive]}>
                  {t.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista */}
      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {display.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={48} color={Colors.gray[300]} />
            <Text style={styles.emptyTitle}>Nenhum agendamento</Text>
            <Text style={styles.emptyText}>
              {tab === 'upcoming' ? 'Agende um horário na sua barbearia favorita!' : 'Nada para mostrar aqui.'}
            </Text>
          </View>
        ) : (
          display.map(a => (
            <ClientAppointmentCard
              key={a.id}
              appointment={a}
              onCancel={tab === 'upcoming' ? handleCancel : undefined}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    backgroundColor: Colors.white, paddingHorizontal: Spacing.md,
    paddingTop: 56, paddingBottom: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  tabs: {
    flexDirection: 'row', backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 12 },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  tabText:      { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: Colors.primary },
  tabBadge: { backgroundColor: Colors.gray[200], borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  tabBadgeActive:    { backgroundColor: Colors.primary + '20' },
  tabBadgeText:      { fontSize: 10, fontWeight: '700', color: Colors.gray[600] },
  tabBadgeTextActive: { color: Colors.primary },
  list:      { padding: Spacing.md, gap: 12, paddingBottom: 40 },
  empty:     { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  emptyText:  { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 32 },
});