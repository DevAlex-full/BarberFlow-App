import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/colors';

export default function ClientesScreen() {
  const [clients, setClients]       = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]         = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await api.get('/customers');
      setClients(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const filtered = clients.filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
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
      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{clients.length}</Text>
          <Text style={styles.statLbl}>Total</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>
            {clients.filter(c => {
              const d = new Date(c.createdAt);
              const now = new Date();
              return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            }).length}
          </Text>
          <Text style={styles.statLbl}>Este Mês</Text>
        </View>
      </View>

      {/* Busca */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={Colors.gray[400]} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar cliente..."
          placeholderTextColor={Colors.gray[400]}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Lista */}
      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color={Colors.gray[300]} />
            <Text style={styles.emptyText}>Nenhum cliente encontrado</Text>
          </View>
        ) : (
          filtered.map(c => (
            <View key={c.id} style={styles.card}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(c.name || '?').charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{c.name}</Text>
                {c.email && <Text style={styles.detail}>{c.email}</Text>}
                {c.phone && <Text style={styles.detail}>{c.phone}</Text>}
              </View>
              <View style={styles.right}>
                <Text style={styles.visitLabel}>Visitas</Text>
                <Text style={styles.visitCount}>{c._count?.appointments || 0}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', padding: Spacing.md, gap: 12 },
  statBox: {
    flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.md, alignItems: 'center', ...Shadow.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  statNum: { fontSize: 28, fontWeight: '700', color: Colors.primary },
  statLbl: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.white, marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md,
    borderWidth: 1, borderColor: Colors.border, ...Shadow.sm, marginBottom: Spacing.sm,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.textPrimary, paddingVertical: 12 },
  list: { padding: Spacing.md, paddingTop: 0, gap: 10 },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: 8 },
  emptyText: { color: Colors.textSecondary, fontSize: 15 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.md, ...Shadow.sm, borderWidth: 1, borderColor: Colors.border,
  },
  avatar: {
    width: 48, height: 48, borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: Colors.white, fontWeight: '700', fontSize: 20 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  detail: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  right: { alignItems: 'center' },
  visitLabel: { fontSize: 11, color: Colors.textMuted },
  visitCount: { fontSize: 22, fontWeight: '700', color: Colors.primary },
});