import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '@/lib/api';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/colors';
import { Badge } from '@/components/ui/Badge';

type FilterType = 'all' | 'active' | 'trial' | 'expired';

interface Barbershop {
  id:           string;
  name:         string;
  ownerName:    string;
  ownerEmail:   string;
  phone?:       string;
  city?:        string;
  plan:         string;
  isActive:     boolean;
  status?:      string;
  createdAt:    string;
  totalBarbers: number;
  totalClients: number;
}

const PLAN_VARIANTS: Record<string, any> = {
  trial:      'gray',
  basic:      'info',
  standard:   'purple',
  premium:    'purple',
  enterprise: 'purple',
};

const PLAN_LABELS: Record<string, string> = {
  trial:      'Trial',
  basic:      'Básico',
  standard:   'Standard',
  premium:    'Premium',
  enterprise: 'Enterprise',
};

export default function BarbeariaScreen() {
  const [barbershops, setBarbershops] = useState<Barbershop[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [search,      setSearch]      = useState('');
  const [filter,      setFilter]      = useState<FilterType>('all');

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await api.get('/admin/barbershops');
      // Suporta diferentes formatos de resposta da API
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

  async function handleToggleActive(id: string, current: boolean) {
    Alert.alert(
      current ? 'Desativar' : 'Ativar',
      `Deseja ${current ? 'desativar' : 'ativar'} esta barbearia?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              await api.patch(`/admin/barbershops/${id}/toggle`);
              setBarbershops(prev =>
                prev.map(b => b.id === id ? { ...b, isActive: !current } : b)
              );
            } catch {
              Alert.alert('Erro', 'Não foi possível alterar o status.');
            }
          },
        },
      ]
    );
  }

  const isActive = (b: Barbershop) => b.isActive || b.status === 'active';

  const filtered = barbershops.filter(b => {
    const matchSearch = !search ||
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.ownerEmail?.toLowerCase().includes(search.toLowerCase()) ||
      b.city?.toLowerCase().includes(search.toLowerCase());

    const matchFilter =
      filter === 'all'     ? true :
      filter === 'active'  ? isActive(b) :
      filter === 'trial'   ? b.plan === 'trial' :
      filter === 'expired' ? !isActive(b) : true;

    return matchSearch && matchFilter;
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Barbearias</Text>
        <Text style={styles.headerSub}>{barbershops.length} cadastradas</Text>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={Colors.gray[400]} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nome, email ou cidade..."
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

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {([
          { key: 'all',     label: 'Todas'    },
          { key: 'active',  label: 'Ativas'   },
          { key: 'trial',   label: 'Trial'    },
          { key: 'expired', label: 'Inativas' },
        ] as { key: FilterType; label: string }[]).map(f => (
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
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="storefront-outline" size={48} color={Colors.gray[300]} />
            <Text style={styles.emptyText}>Nenhuma barbearia encontrada</Text>
          </View>
        ) : (
          filtered.map(b => (
            <View key={b.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.cardAvatar}>
                  <Text style={styles.cardAvatarText}>{b.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{b.name}</Text>
                  <Text style={styles.cardOwner}>{b.ownerName}</Text>
                  <Text style={styles.cardEmail}>{b.ownerEmail}</Text>
                </View>
                <View style={styles.cardBadges}>
                  <Badge label={PLAN_LABELS[b.plan] || b.plan} variant={PLAN_VARIANTS[b.plan] || 'gray'} />
                  <Badge label={isActive(b) ? 'Ativa' : 'Inativa'} variant={isActive(b) ? 'success' : 'error'} />
                </View>
              </View>

              <View style={styles.cardMeta}>
                {!!b.city && (
                  <View style={styles.metaItem}>
                    <Ionicons name="location-outline" size={13} color={Colors.textSecondary} />
                    <Text style={styles.metaText}>{b.city}</Text>
                  </View>
                )}
                <View style={styles.metaItem}>
                  <Ionicons name="cut-outline" size={13} color={Colors.textSecondary} />
                  <Text style={styles.metaText}>{b.totalBarbers || 0} barbeiros</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="people-outline" size={13} color={Colors.textSecondary} />
                  <Text style={styles.metaText}>{b.totalClients || 0} clientes</Text>
                </View>
                {!!b.createdAt && (
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={13} color={Colors.textSecondary} />
                    <Text style={styles.metaText}>
                      {format(new Date(b.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={[styles.toggleBtn, { backgroundColor: isActive(b) ? Colors.errorBg : Colors.successBg }]}
                onPress={() => handleToggleActive(b.id, isActive(b))}
              >
                <Ionicons
                  name={isActive(b) ? 'ban-outline' : 'checkmark-circle-outline'}
                  size={16}
                  color={isActive(b) ? Colors.error : Colors.success}
                />
                <Text style={[styles.toggleText, { color: isActive(b) ? Colors.error : Colors.success }]}>
                  {isActive(b) ? 'Desativar' : 'Ativar'}
                </Text>
              </TouchableOpacity>
            </View>
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
  headerSub:   { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.white, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    margin: Spacing.md, marginBottom: 0, ...Shadow.sm,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  filters:     { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: 8 },
  filterBtn: {
    paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: BorderRadius.full, backgroundColor: Colors.gray[100],
  },
  filterBtnActive:  { backgroundColor: Colors.primary },
  filterText:       { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  filterTextActive: { color: Colors.white },
  list:  { padding: Spacing.md, gap: 12, paddingBottom: 40 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: Colors.textSecondary },
  card: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.md, ...Shadow.sm,
    borderWidth: 1, borderColor: Colors.border, gap: 12,
  },
  cardTop:        { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardAvatar: {
    width: 46, height: 46, borderRadius: 10,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  cardAvatarText: { fontSize: 20, fontWeight: '700', color: Colors.white },
  cardInfo:       { flex: 1 },
  cardName:       { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  cardOwner:      { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  cardEmail:      { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  cardBadges:     { gap: 4, alignItems: 'flex-end' },
  cardMeta: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  metaItem:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText:   { fontSize: 12, color: Colors.textSecondary },
  toggleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 8, borderRadius: BorderRadius.md,
  },
  toggleText: { fontSize: 13, fontWeight: '700' },
});