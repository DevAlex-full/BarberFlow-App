import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Linking } from 'react-native';
import * as Location from 'expo-location';
import clientApi from '@/lib/client-api';
import { useAuthStore } from '@/stores/authStore';
import { BarbershopCard } from '@/components/cliente/BarbershopCard';

interface Barbershop {
  id: string;
  name: string;
  description?: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  phone?: string;
  logo?: string | null;
  rating?: number;
  totalReviews?: number;
  plan: string;
  latitude?: number | null;
  longitude?: number | null;
  distance?: number | null; // km (vem do servidor no endpoint /nearby)
}

export default function ClienteHomeScreen() {
  const { clientUser } = useAuthStore();

  const [allBarbershops,  setAllBarbershops]  = useState<Barbershop[]>([]);
  const [nearbyBarbershops, setNearbyBarbershops] = useState<Barbershop[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search,     setSearch]     = useState('');
  const [locDenied,  setLocDenied]  = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [radius,     setRadius]     = useState(10);
  const [showRadiusPicker, setShowRadiusPicker] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);

  // Data formatada: "segunda-feira, 9 de mar. de 2026"
  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'short', year: 'numeric',
  });

  // ── Buscar barbearias próximas via servidor ───────────────────────────────
  const loadNearby = useCallback(async (lat: number, lon: number, r: number = 10) => {
    try {
      // Usa o endpoint já existente no backend que calcula distância server-side
      const res = await clientApi.get('/barbershop-location/nearby', {
        params: { lat, lng: lon, radius: r },
      });
      const data = res.data?.barbershops || [];
      // distance vem em km do servidor
      setNearbyBarbershops(data.map((b: any) => ({
        ...b,
        distance: b.distance != null ? b.distance * 1000 : null, // converte para metros
      })));
    } catch {
      console.error('Erro ao buscar barbearias próximas');
    }
  }, []);

  // ── Buscar todas as barbearias (fallback sem localização) ─────────────────
  const loadAll = useCallback(async () => {
    try {
      const res = await clientApi.get('/public/barbershops');
      setAllBarbershops(res.data || []);
    } catch {
      console.error('Erro ao carregar barbearias');
    }
  }, []);

  // ── Pedir permissão de localização ────────────────────────────────────────
  const requestLocation = useCallback(async () => {
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocDenied(true);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocDenied(false);
      setUserCoords({ lat: loc.coords.latitude, lon: loc.coords.longitude });
      await loadNearby(loc.coords.latitude, loc.coords.longitude);
    } catch {
      setLocDenied(true);
    } finally {
      setLocLoading(false);
    }
  }, [loadNearby]);

  // ── Carregar tudo no mount ────────────────────────────────────────────────
  async function load() {
    setLoading(true);
    await loadAll();

    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setUserCoords({ lat: loc.coords.latitude, lon: loc.coords.longitude });
        await loadNearby(loc.coords.latitude, loc.coords.longitude);
        setLocDenied(false);
      } else {
        setLocDenied(true);
      }
    } catch {
      setLocDenied(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  // ── Listas calculadas ─────────────────────────────────────────────────────
  function openMap() {
    // Se há barbearias próximas, abre o mapa com todas elas como pins
    if (nearbyBarbershops.length > 0) {
      const first = nearbyBarbershops[0];
      if (first.latitude && first.longitude) {
        // Abre Google Maps centrado nas coordenadas da barbearia mais próxima
        const label = encodeURIComponent(first.name);
        Linking.openURL(
          `https://maps.google.com/maps?q=${first.latitude},${first.longitude}(${label})&z=16`
        );
        return;
      }
      // Fallback: busca por nome+endereço
      const query = encodeURIComponent(`${first.name} ${first.address || ''} ${first.city || ''}`);
      Linking.openURL(`https://maps.google.com/maps?q=${query}`);
      return;
    }
    // Sem barbearias — abre mapa com localização do usuário
    if (userCoords) {
      Linking.openURL(`https://maps.google.com/maps?q=barbearia&near=${userCoords.lat},${userCoords.lon}`);
    } else {
      Linking.openURL('https://maps.google.com/maps?q=barbearia');
    }
  }

  async function handleRadiusChange(r: number) {
    setRadius(r);
    setShowRadiusPicker(false);
    if (userCoords) await loadNearby(userCoords.lat, userCoords.lon, r);
  }

  const featured = allBarbershops
    .filter(b => b.plan === 'premium' || b.plan === 'enterprise')
    .slice(0, 8);

  const filtered = search
    ? allBarbershops.filter(b =>
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.city?.toLowerCase().includes(search.toLowerCase()) ||
        b.state?.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  // IDs das próximas para não duplicar na seção "Todas"
  const nearbyIds = new Set(nearbyBarbershops.map(b => b.id));
  const otherBarbershops = allBarbershops.filter(b => !nearbyIds.has(b.id));

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Seja bem vindo(a)</Text>
            <Text style={styles.heroDate}>{today}</Text>
          </View>
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => router.push('/(cliente)/agendamentos')}
          >
            <Ionicons name="calendar-outline" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Busca */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Encontre um estabelecimento"
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
            returnKeyType="search"
          />
          {!!search && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Resultados de busca ───────────────────────────────────────────── */}
      {!!search && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resultados ({filtered.length})</Text>
          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="cut-outline" size={48} color="#6b7280" />
              <Text style={styles.emptyTitle}>Nenhuma barbearia encontrada</Text>
              <Text style={styles.emptyText}>Tente buscar por outro nome ou cidade</Text>
            </View>
          ) : (
            <View style={styles.vList}>
              {filtered.map(b => (
                <BarbershopCard
                  key={b.id} barbershop={b} variant="vertical"
                  onPress={() => router.push(`/(cliente)/barbearia/${b.id}`)}
                />
              ))}
            </View>
          )}
        </View>
      )}

      {/* Destaques removido — não existe no web */}

      {/* ── Empresas próximas ─────────────────────────────────────────────── */}
      {!search && (
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Empresas próximas</Text>
            {nearbyBarbershops.length > 0 && (
              <Text style={styles.sectionCount}>
                {nearbyBarbershops.length} barbearia{nearbyBarbershops.length !== 1 ? 's' : ''}
              </Text>
            )}
          </View>

          {/* Raio + Mapa */}
          <View style={styles.radiusRow}>
            <TouchableOpacity style={styles.radiusBtn} onPress={() => setShowRadiusPicker(p => !p)}>
              <Text style={styles.radiusBtnText}>Raio: {radius} km</Text>
              <Ionicons name="chevron-down" size={14} color="#9ca3af" />
            </TouchableOpacity>
            {showRadiusPicker && (
              <View style={styles.radiusPicker}>
                {[5, 10, 20, 50].map(r => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.radiusOption, radius === r && styles.radiusOptionActive]}
                    onPress={() => handleRadiusChange(r)}
                  >
                    <Text style={[styles.radiusOptionText, radius === r && { color: '#ffffff' }]}>{r} km</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <TouchableOpacity style={styles.mapBtn} onPress={openMap}>
              <Ionicons name="map" size={16} color="#ffffff" />
              <Text style={styles.mapBtnText}>Mapa</Text>
            </TouchableOpacity>
          </View>

          {/* Card de habilitar localização */}
          {locDenied && (
            <TouchableOpacity
              style={styles.locCard}
              onPress={requestLocation}
              activeOpacity={0.85}
            >
              <Ionicons name="location" size={40} color="#f87171" />
              <Text style={styles.locTitle}>Habilitar localização</Text>
              <Text style={styles.locSub}>
                Habilite o acesso à localização para encontrarmos os estabelecimentos mais próximos a você =)
              </Text>
              <View style={styles.locBtn}>
                {locLoading
                  ? <ActivityIndicator color="#ffffff" />
                  : <Text style={styles.locBtnText}>Habilitar localização</Text>
                }
              </View>
            </TouchableOpacity>
          )}

          {/* Lista próximas */}
          {nearbyBarbershops.length > 0 && (
            <View style={styles.vList}>
              {nearbyBarbershops.map(b => (
                <BarbershopCard
                  key={b.id} barbershop={b} variant="vertical"
                  onPress={() => router.push(`/(cliente)/barbearia/${b.id}`)}
                />
              ))}
            </View>
          )}

          {/* Demais barbearias */}
          {otherBarbershops.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Todas as Barbearias</Text>
              <View style={styles.vList}>
                {otherBarbershops.map(b => (
                  <BarbershopCard
                    key={b.id} barbershop={b} variant="vertical"
                    onPress={() => router.push(`/(cliente)/barbearia/${b.id}`)}
                  />
                ))}
              </View>
            </>
          )}

          {/* Sem barbearias e sem erro */}
          {nearbyBarbershops.length === 0 && allBarbershops.length === 0 && (
            <View style={styles.empty}>
              <Ionicons name="cut-outline" size={48} color="#6b7280" />
              <Text style={styles.emptyTitle}>Nenhuma barbearia encontrada</Text>
              <Text style={styles.emptyText}>Tente buscar por outro nome ou cidade</Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  content:   { paddingBottom: 40 },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Hero
  hero: {
    backgroundColor: '#151b23',
    borderBottomWidth: 1, borderBottomColor: '#1f2937',
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 20, gap: 16,
  },
  heroTop:   { flexDirection: 'row', alignItems: 'flex-start' },
  heroTitle: { fontSize: 26, fontWeight: '700', color: '#ffffff' },
  heroDate:  { fontSize: 13, color: '#9ca3af', marginTop: 6 },
  notifBtn:  { padding: 4, marginTop: 4 },

  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#1f2937', borderRadius: 12,
    borderWidth: 1, borderColor: '#374151',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#ffffff' },

  // Sections
  section:      { paddingHorizontal: 16, marginTop: 24 },
  sectionRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#ffffff', marginBottom: 12 },
  sectionCount: { fontSize: 13, color: '#9ca3af' },
  hList:        { gap: 12 },
  vList:        { gap: 12 },

  // Localização
  locCard: {
    backgroundColor: '#151b23', borderRadius: 16,
    borderWidth: 1, borderColor: '#1f2937',
    padding: 28, alignItems: 'center', gap: 12, marginBottom: 16,
  },
  locTitle:   { fontSize: 18, fontWeight: '700', color: '#ffffff' },
  locSub:     { fontSize: 13, color: '#9ca3af', textAlign: 'center', lineHeight: 20 },
  locBtn:     { backgroundColor: '#2563eb', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 28, marginTop: 4 },
  locBtnText: { fontSize: 15, fontWeight: '700', color: '#ffffff' },

  // Empty
  empty:      { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#ffffff' },
  emptyText:  { fontSize: 14, color: '#9ca3af', textAlign: 'center' },

  // Raio + Mapa
  radiusRow:          { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16, position: 'relative', zIndex: 10 },
  radiusBtn:          { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1f2937', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: '#374151' },
  radiusBtnText:      { fontSize: 14, fontWeight: '600', color: '#9ca3af' },
  radiusPicker:       { position: 'absolute', top: 44, left: 0, backgroundColor: '#1f2937', borderRadius: 12, borderWidth: 1, borderColor: '#374151', zIndex: 99 },
  radiusOption:       { paddingHorizontal: 24, paddingVertical: 12 },
  radiusOptionActive: { backgroundColor: '#2563eb' },
  radiusOptionText:   { fontSize: 14, fontWeight: '600', color: '#9ca3af' },
  mapBtn:             { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#2563eb', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 9 },
  mapBtnText:         { fontSize: 14, fontWeight: '700', color: '#ffffff' },
});