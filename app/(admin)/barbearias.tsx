import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '@/lib/api';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/colors';
import { Badge } from '@/components/ui/Badge';

// ── Tipos ─────────────────────────────────────────────────────────────────────

type PlanFilter   = 'all' | 'trial' | 'basic' | 'standard' | 'premium' | 'enterprise';
type StatusFilter = 'all' | 'active' | 'expired';

interface Barbershop {
  id:                 string;
  name:               string;
  ownerName:          string;
  ownerEmail:         string;
  phone?:             string;
  city?:              string;
  state?:             string;
  plan:               string;
  planStatus?:        string;   // 'active' | 'expired' | 'trial'
  planExpiresAt?:     string;   // ISO date
  isActive:           boolean;
  status?:            string;
  createdAt:          string;
  totalBarbers:       number;
  totalClients:       number;
  totalAppointments?: number;
}

// ── Mapeamentos ───────────────────────────────────────────────────────────────

const PLAN_VARIANTS: Record<string, any> = {
  trial:      'gray',
  basic:      'info',
  standard:   'purple',
  premium:    'purple',
  enterprise: 'purple',
};

const PLAN_LABELS: Record<string, string> = {
  trial:      'TRIAL',
  basic:      'BÁSICO',
  standard:   'STANDARD',
  premium:    'PREMIUM',
  enterprise: 'ENTERPRISE',
};

// ── Helper — calcula dias restantes ──────────────────────────────────────────

function getDaysRemaining(expiresAt?: string): number | null {
  if (!expiresAt) return null;
  return differenceInDays(new Date(expiresAt), new Date());
}

function DaysRemainingText({ expiresAt }: { expiresAt?: string }) {
  const days = getDaysRemaining(expiresAt);
  if (days === null) return null;

  if (days < 0) {
    return (
      <View style={styles.expiryRow}>
        <Ionicons name="warning-outline" size={12} color={Colors.error} />
        <Text style={[styles.expiryText, { color: Colors.error }]}>Expirado</Text>
      </View>
    );
  }
  return (
    <View style={styles.expiryRow}>
      <Ionicons name="time-outline" size={12} color={Colors.success} />
      <Text style={[styles.expiryText, { color: Colors.success }]}>{days} dias restantes</Text>
    </View>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function BarbeariaScreen() {
  const [barbershops, setBarbershops] = useState<Barbershop[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [search,      setSearch]      = useState('');
  const [planFilter,  setPlanFilter]  = useState<PlanFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await api.get('/admin/barbershops');
      const raw = res.data;
      const list: Barbershop[] = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.barbershops) ? raw.barbershops
        : Array.isArray(raw?.data)        ? raw.data
        : [];
      setBarbershops(list);
    } catch (e) {
      console.error('Erro ao carregar barbearias:', e);
      setBarbershops([]);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const isActive = (b: Barbershop) =>
    b.isActive || b.status === 'active' || b.planStatus === 'active';

  // ── Filtros ─────────────────────────────────────────────────────────────────
  const filtered = barbershops.filter(b => {
    const matchSearch = !search ||
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.ownerEmail?.toLowerCase().includes(search.toLowerCase()) ||
      b.city?.toLowerCase().includes(search.toLowerCase());

    const matchPlan   = planFilter === 'all'   || b.plan === planFilter;
    const matchStatus =
      statusFilter === 'all'     ? true :
      statusFilter === 'active'  ? isActive(b) :
      statusFilter === 'expired' ? !isActive(b) : true;

    return matchSearch && matchPlan && matchStatus;
  });

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
        <Text style={styles.headerTitle}>Barbearias Cadastradas</Text>
        <Text style={styles.headerSub}>Gerencie todas as barbearias do sistema</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
      >
        {/* ── Filtros (sticky) ─────────────────────────────────────────────── */}
        <View style={styles.filtersContainer}>

          {/* Busca */}
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color={Colors.gray[400]} />
            <TextInput
              style={styles.searchInput}
              placeholder="Nome ou email da barbearia..."
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

          {/* Linha: Plano + Status */}
          <View style={styles.selectRow}>
            {/* Plano — chips horizontais */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
              <View style={styles.chipsRow}>
                {([
                  { key: 'all',        label: 'Todos'      },
                  { key: 'trial',      label: 'Trial'      },
                  { key: 'basic',      label: 'Básico'     },
                  { key: 'standard',   label: 'Standard'   },
                  { key: 'premium',    label: 'Premium'    },
                  { key: 'enterprise', label: 'Enterprise' },
                ] as { key: PlanFilter; label: string }[]).map(f => (
                  <TouchableOpacity
                    key={f.key}
                    style={[styles.chip, planFilter === f.key && styles.chipActive]}
                    onPress={() => setPlanFilter(f.key)}
                  >
                    <Text style={[styles.chipText, planFilter === f.key && styles.chipTextActive]}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Status */}
          <View style={styles.statusRow}>
            {([
              { key: 'all',     label: 'Todos'    },
              { key: 'active',  label: 'Ativo'    },
              { key: 'expired', label: 'Expirado' },
            ] as { key: StatusFilter; label: string }[]).map(f => (
              <TouchableOpacity
                key={f.key}
                style={[styles.statusChip, statusFilter === f.key && styles.statusChipActive]}
                onPress={() => setStatusFilter(f.key)}
              >
                <Text style={[styles.chipText, statusFilter === f.key && styles.chipTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Contador */}
          <View style={styles.countBanner}>
            <Text style={styles.countText}>
              <Text style={{ fontWeight: '700', color: Colors.primary }}>{filtered.length}</Text>
              {' barbearia(s) encontrada(s)'}
            </Text>
          </View>
        </View>

        {/* ── Lista ────────────────────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="storefront-outline" size={48} color={Colors.gray[300]} />
            <Text style={styles.emptyText}>Nenhuma barbearia encontrada</Text>
          </View>
        ) : (
          filtered.map(b => (
            <View key={b.id} style={styles.card}>

              {/* Topo: avatar + info + badges */}
              <View style={styles.cardTop}>
                <View style={styles.cardAvatar}>
                  <Text style={styles.cardAvatarText}>{b.name.charAt(0).toUpperCase()}</Text>
                </View>

                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{b.name}</Text>
                  <Text style={styles.cardEmail}>{b.ownerEmail}</Text>
                  {!!b.phone && (
                    <Text style={styles.cardPhone}>{b.phone}</Text>
                  )}
                </View>

                <View style={styles.cardBadges}>
                  <Badge label={PLAN_LABELS[b.plan] || b.plan.toUpperCase()} variant={PLAN_VARIANTS[b.plan] || 'gray'} />
                  <Badge label={isActive(b) ? 'Ativo' : 'Expirado'} variant={isActive(b) ? 'success' : 'error'} />
                </View>
              </View>

              {/* Plano: data expiração + dias restantes */}
              {!!b.planExpiresAt && (
                <View style={styles.planExpiry}>
                  <Text style={styles.planExpiryDate}>
                    Expira: {format(new Date(b.planExpiresAt), 'dd/MM/yyyy', { locale: ptBR })}
                  </Text>
                  <DaysRemainingText expiresAt={b.planExpiresAt} />
                </View>
              )}

              {/* Meta: localização, barbers, clientes, agendamentos, cadastro */}
              <View style={styles.cardMeta}>
                {!!(b.city || b.state) && (
                  <View style={styles.metaItem}>
                    <Ionicons name="location-outline" size={13} color={Colors.textSecondary} />
                    <Text style={styles.metaText}>
                      {[b.city, b.state].filter(Boolean).join(', ')}
                    </Text>
                  </View>
                )}
                <View style={styles.metaItem}>
                  <Ionicons name="person-outline" size={13} color={Colors.textSecondary} />
                  <Text style={styles.metaText}>{b.totalBarbers || 0} usuário(s)</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="people-outline" size={13} color={Colors.textSecondary} />
                  <Text style={styles.metaText}>{b.totalClients || 0} cliente(s)</Text>
                </View>
                {b.totalAppointments !== undefined && (
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={13} color={Colors.textSecondary} />
                    <Text style={styles.metaText}>{b.totalAppointments} agendamento(s)</Text>
                  </View>
                )}
                {!!b.createdAt && (
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={13} color={Colors.textSecondary} />
                    <Text style={styles.metaText}>
                      {format(new Date(b.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                    </Text>
                  </View>
                )}
              </View>



            </View>
          ))
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

  content: { paddingBottom: 20 },

  // Filtros sticky
  filtersContainer: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    gap: 10,
  },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.white, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: '#e5e7eb',
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    ...Shadow.sm,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },
  selectRow:   { flexDirection: 'row', gap: 8 },
  chipsRow:    { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: BorderRadius.full, backgroundColor: Colors.white,
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  chipActive:     { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText:       { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  chipTextActive: { color: Colors.white },
  statusRow:   { flexDirection: 'row', gap: 8 },
  statusChip: {
    flex: 1, paddingVertical: 8, alignItems: 'center',
    borderRadius: BorderRadius.md, backgroundColor: Colors.white,
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  statusChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  countBanner: {
    backgroundColor: '#ede9fe', borderRadius: BorderRadius.md,
    paddingVertical: 8, paddingHorizontal: Spacing.md,
    marginBottom: 4,
  },
  countText: { fontSize: 13, color: '#6b7280' },

  // Cards
  card: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.md, ...Shadow.sm,
    borderWidth: 1, borderColor: '#e5e7eb',
    gap: 10, marginHorizontal: Spacing.md, marginTop: 12,
  },
  cardTop:        { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardAvatar: {
    width: 46, height: 46, borderRadius: 10,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  cardAvatarText: { fontSize: 20, fontWeight: '700', color: Colors.white },
  cardInfo:       { flex: 1 },
  cardName:       { fontSize: 15, fontWeight: '700', color: '#111827' },
  cardEmail:      { fontSize: 12, color: '#6b7280', marginTop: 2 },
  cardPhone:      { fontSize: 12, color: '#9ca3af', marginTop: 1 },
  cardBadges:     { gap: 4, alignItems: 'flex-end' },

  // Expiração do plano
  planExpiry: {
    backgroundColor: '#f9fafb', borderRadius: BorderRadius.sm,
    paddingVertical: 6, paddingHorizontal: 10, gap: 2,
  },
  planExpiryDate: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  expiryRow:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  expiryText:     { fontSize: 12, fontWeight: '600' },

  // Meta info
  cardMeta: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    paddingTop: 10, borderTopWidth: 1, borderTopColor: '#e5e7eb',
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#6b7280' },

  // Empty
  empty:     { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: '#6b7280' },
});