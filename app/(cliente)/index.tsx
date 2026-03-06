import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import clientApi from '@/lib/client-api';
import { useAuthStore } from '@/stores/authStore';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/colors';
import { BarbershopCard } from '@/components/cliente/BarbershopCard';

interface Barbershop {
  id: string;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  phone?: string;
  logo?: string;
  rating?: number;
  totalReviews?: number;
  plan: string;
}

export default function ClienteHomeScreen() {
  const { clientUser } = useAuthStore();
  const [barbershops, setBarbershops] = useState<Barbershop[]>([]);
  const [featured,    setFeatured]    = useState<Barbershop[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [search,      setSearch]      = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await clientApi.get('/client/barbershops');
      const data: Barbershop[] = res.data || [];
      setBarbershops(data);
      setFeatured(data.filter(b => b.plan === 'premium' || b.plan === 'enterprise').slice(0, 5));
    } catch (e) {
      console.error('Erro ao carregar barbearias:', e);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const filtered = barbershops.filter(b =>
    !search || b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.city?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {clientUser?.name?.split(' ')[0]}! 👋</Text>
          <Text style={styles.subtitle}>Encontre a barbearia perfeita</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn}>
          <Ionicons name="notifications-outline" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Busca */}
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={Colors.gray[400]} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar barbearia ou cidade..."
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

      {/* Destaques */}
      {!search && featured.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>⭐ Destaques</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
            {featured.map(b => (
              <BarbershopCard
                key={b.id}
                barbershop={b}
                variant="horizontal"
                onPress={() => router.push(`/(cliente)/barbearia/${b.id}`)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Todas as barbearias */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {search ? `Resultados (${filtered.length})` : 'Todas as Barbearias'}
          </Text>
        </View>

        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="cut-outline" size={48} color={Colors.gray[300]} />
            <Text style={styles.emptyText}>Nenhuma barbearia encontrada</Text>
          </View>
        ) : (
          filtered.map(b => (
            <BarbershopCard
              key={b.id}
              barbershop={b}
              variant="vertical"
              onPress={() => router.push(`/(cliente)/barbearia/${b.id}`)}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content:   { paddingBottom: Spacing.xxl },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingTop: 56, paddingBottom: Spacing.md,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  greeting:  { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  subtitle:  { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  notifBtn:  { padding: 4 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.white, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    margin: Spacing.md,
    ...Shadow.sm,
  },
  searchInput:    { flex: 1, fontSize: 15, color: Colors.textPrimary },
  section:        { marginBottom: Spacing.md },
  sectionHeader:  { paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
  sectionTitle:   { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  horizontalList: { paddingHorizontal: Spacing.md, gap: 12 },
  empty:          { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyText:      { fontSize: 15, color: Colors.textSecondary },
});