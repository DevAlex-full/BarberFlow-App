import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import clientApi from '@/lib/client-api';
import { Colors, Spacing } from '@/constants/colors';
import { BarbershopCard } from '@/components/cliente/BarbershopCard';

export default function FavoritosScreen() {
  const [favorites,  setFavorites]  = useState<any[]>([]);
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
    Alert.alert('Remover', 'Remover dos favoritos?', [
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
    ]);
  }

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
        <Text style={styles.headerTitle}>Favoritos</Text>
        <Text style={styles.headerSub}>
          {favorites.length} barbearia{favorites.length !== 1 ? 's' : ''} salva{favorites.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {favorites.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="heart-outline" size={64} color={Colors.gray[300]} />
            <Text style={styles.emptyTitle}>Nenhum favorito ainda</Text>
            <Text style={styles.emptyText}>
              Explore barbearias e toque no coração para salvar seus favoritos!
            </Text>
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
  content:     { padding: Spacing.md, gap: 12, paddingBottom: 40 },
  empty:       { alignItems: 'center', paddingTop: 80, gap: 12, paddingHorizontal: 32 },
  emptyTitle:  { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  emptyText:   { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
});