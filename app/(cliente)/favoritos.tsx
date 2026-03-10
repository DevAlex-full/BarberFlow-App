import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, RefreshControl, Alert, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import clientApi from '@/lib/client-api';
import { BarbershopCard } from '@/components/cliente/BarbershopCard';

interface FavoriteBarbershop {
  id: string;
  name: string;
  description?: string;
  city?: string | null;
  state?: string | null;
  address?: string | null;
  phone?: string;
  logo?: string | null;
  rating?: number;
  totalReviews?: number;
  plan: string;
}

export default function FavoritosScreen() {
  const [favorites,  setFavorites]  = useState<FavoriteBarbershop[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await clientApi.get('/client/favorites');
      setFavorites(res.data || []);
    } catch (e) {
      console.error('Erro ao carregar favoritos:', e);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function handleRemove(barbershopId: string) {
    Alert.alert(
      'Remover Favorito',
      'Remover esta barbearia dos seus favoritos?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await clientApi.delete(`/client/favorites/${barbershopId}`);
              setFavorites(prev => prev.filter(f => f.id !== barbershopId));
            } catch {
              Alert.alert('Erro', 'Não foi possível remover.');
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={'#2563eb'} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Favoritos</Text>
          <Text style={styles.headerSub}>
            {favorites.length} barbearia{favorites.length !== 1 ? 's' : ''} salva{favorites.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <Ionicons name="heart" size={24} color={'#f87171'} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={'#2563eb'} />}
        showsVerticalScrollIndicator={false}
      >
        {favorites.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="heart-outline" size={64} color={'#6b7280'} />
            <Text style={styles.emptyTitle}>Nenhum favorito ainda</Text>
            <Text style={styles.emptyText}>
              Salve suas barbearias favoritas para acessá-las rapidamente
            </Text>
            <TouchableOpacity
              style={styles.exploreBtn}
              onPress={() => router.push('/(cliente)')}
            >
              <Text style={styles.exploreBtnText}>Explorar Barbearias</Text>
            </TouchableOpacity>
          </View>
        ) : (
          favorites.map(b => (
            <BarbershopCard
              key={b.id}
              barbershop={b}
              variant="vertical"
              onPress={() => router.push(`/(cliente)/barbearia/${b.id}`)}
              onFavoriteToggle={() => handleRemove(b.id)}
              isFavorited
            />
          ))
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#151b23', paddingHorizontal: 16,
    paddingTop: 56, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#1f2937',
  },
  headerLeft:  { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#ffffff' },
  headerSub:   { fontSize: 13, color: '#9ca3af', marginTop: 2 },

  content: { padding: 16, gap: 12, paddingBottom: 40 },

  empty: { alignItems: 'center', paddingTop: 80, gap: 12, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#ffffff' },
  emptyText:  { fontSize: 14, color: '#9ca3af', textAlign: 'center', lineHeight: 20 },
  exploreBtn: {
    marginTop: 8, backgroundColor: '#2563eb',
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20,
  },
  exploreBtnText: { color: '#151b23', fontWeight: '700', fontSize: 15 },
});