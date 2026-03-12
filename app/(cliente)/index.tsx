import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Image, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Linking } from 'react-native';
import * as Location from 'expo-location';
import clientApi from '@/lib/client-api';
import { useAuthStore } from '@/stores/authStore';
import { BarbershopCard } from '@/components/cliente/BarbershopCard';
const DEFAULT_LOGO = require('../../assets/images/logo4.png');

interface Barbershop {
  id: string;
  name: string;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  phone?: string;
  logo?: string | null;
  rating?: number | null;
  totalReviews?: number | null;
  plan: string;
  latitude?: number | null;
  longitude?: number | null;
  distance?: number | null; // km vindo do servidor
}

export default function ClienteHomeScreen() {
  const { clientUser } = useAuthStore();

  const [allBarbershops,    setAllBarbershops]    = useState<Barbershop[]>([]);
  const [nearbyBarbershops, setNearbyBarbershops] = useState<Barbershop[]>([]);
  const [loading,           setLoading]           = useState(true);
  const [refreshing,        setRefreshing]        = useState(false);
  const [search,            setSearch]            = useState('');
  const [locDenied,         setLocDenied]         = useState(false);

  // Idioma
  const LANGS = [
    { code: 'PT', flag: '🇧🇷', label: 'Português' },
    { code: 'EN', flag: '🇺🇸', label: 'English (US)' },
    { code: 'ES', flag: '🇪🇸', label: 'Español' },
  ];
  const [selLang,      setSelLang]      = useState(LANGS[0]);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [locLoading,        setLocLoading]        = useState(false);
  const [radius,            setRadius]            = useState(10);
  const [showRadiusPicker,  setShowRadiusPicker]  = useState(false);
  const [userCoords,        setUserCoords]        = useState<{ lat: number; lon: number } | null>(null);

  // Data: "terça-feira, 10 de mar. de 2026"
  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'short', year: 'numeric',
  });

  // ── Barbearias próximas ───────────────────────────────────────────────────
  const loadNearby = useCallback(async (lat: number, lon: number, r: number = 10) => {
    try {
      const res = await clientApi.get('/barbershop-location/nearby', {
        params: { lat, lng: lon, radius: r },
      });
      const data = res.data?.barbershops || [];
      setNearbyBarbershops(
        data.map((b: any) => ({
          ...b,
          distance: b.distance != null ? b.distance * 1000 : null, // → metros
        }))
      );
    } catch {
      console.error('Erro ao buscar barbearias próximas');
    }
  }, []);

  // ── Todas as barbearias (fallback) ────────────────────────────────────────
  const loadAll = useCallback(async () => {
    try {
      const res = await clientApi.get('/public/barbershops');
      setAllBarbershops(res.data || []);
    } catch {
      console.error('Erro ao carregar barbearias');
    }
  }, []);

  // ── Solicitar localização ─────────────────────────────────────────────────
  const requestLocation = useCallback(async () => {
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setLocDenied(true); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocDenied(false);
      setUserCoords({ lat: loc.coords.latitude, lon: loc.coords.longitude });
      await loadNearby(loc.coords.latitude, loc.coords.longitude);
    } catch {
      setLocDenied(true);
    } finally {
      setLocLoading(false);
    }
  }, [loadNearby]);

  // ── Mount ─────────────────────────────────────────────────────────────────
  async function load() {
    setLoading(true);
    await loadAll();
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
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

  function openMap() {
    if (nearbyBarbershops.length > 0) {
      const first = nearbyBarbershops[0];
      if (first.latitude && first.longitude) {
        Linking.openURL(
          `https://maps.google.com/maps?q=${first.latitude},${first.longitude}(${encodeURIComponent(first.name)})&z=16`
        );
        return;
      }
      Linking.openURL(
        `https://maps.google.com/maps?q=${encodeURIComponent(`${first.name} ${first.address || ''} ${first.city || ''}`)}`
      );
      return;
    }
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

  // ── Listas ────────────────────────────────────────────────────────────────
  const filtered = search
    ? allBarbershops.filter(b =>
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.city?.toLowerCase().includes(search.toLowerCase()) ||
        b.state?.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const nearbyIds         = new Set(nearbyBarbershops.map(b => b.id));
  const otherBarbershops  = allBarbershops.filter(b => !nearbyIds.has(b.id));

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
      {/* ── Topbar — logo + seletor de idioma (igual ao web) ───────────── */}
      <View style={styles.topbar}>
        <Image source={DEFAULT_LOGO} style={styles.topbarLogo} resizeMode="contain" />

        {/* Botão idioma */}
        <TouchableOpacity style={styles.langBtn} onPress={() => setShowLangMenu(true)}>
          <Text style={styles.langFlag}>{selLang.flag}</Text>
          <Text style={styles.langText}>{selLang.label}</Text>
          <Ionicons name="chevron-down" size={12} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      {/* ── Modal dropdown de idiomas ────────────────────────────────────── */}
      <Modal visible={showLangMenu} transparent animationType="fade" onRequestClose={() => setShowLangMenu(false)}>
        <TouchableOpacity style={styles.langOverlay} activeOpacity={1} onPress={() => setShowLangMenu(false)}>
          <View style={styles.langDropdown}>
            {LANGS.map(l => (
              <TouchableOpacity
                key={l.code}
                style={[styles.langOption, selLang.code === l.code && styles.langOptionActive]}
                onPress={() => { setSelLang(l); setShowLangMenu(false); }}
              >
                <Text style={styles.langOptionFlag}>{l.flag}</Text>
                <Text style={[styles.langOptionText, selLang.code === l.code && { color: '#ffffff' }]}>
                  {l.label}
                </Text>
                {selLang.code === l.code && (
                  <Ionicons name="checkmark" size={16} color="#2563eb" style={{ marginLeft: 'auto' }} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Hero — centralizado igual ao web ────────────────────────────── */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Seja bem vindo(a)</Text>
        {!!clientUser?.name && (
          <Text style={styles.heroName}>{clientUser.name}</Text>
        )}
        <Text style={styles.heroDate}>{today}</Text>

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

      {/* ── Resultados de busca ──────────────────────────────────────────── */}
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

      {/* ── Empresas próximas ───────────────────────────────────────────── */}
      {!search && (
        <View style={styles.section}>
          {/* Linha única: título + raio + mapa + count — igual ao web */}
          <View style={styles.nearbyHeader}>
            <Text style={styles.sectionTitle}>Empresas próximas</Text>
            <View style={styles.nearbyControls}>
              {/* Raio */}
              <View style={{ position: 'relative', zIndex: 10 }}>
                <TouchableOpacity
                  style={styles.radiusBtn}
                  onPress={() => setShowRadiusPicker(p => !p)}
                >
                  <Text style={styles.radiusBtnText}>{radius} km</Text>
                  <Ionicons name="chevron-down" size={12} color="#9ca3af" />
                </TouchableOpacity>
                {showRadiusPicker && (
                  <View style={styles.radiusPicker}>
                    {[5, 10, 20, 50].map(r => (
                      <TouchableOpacity
                        key={r}
                        style={[styles.radiusOption, radius === r && styles.radiusOptionActive]}
                        onPress={() => handleRadiusChange(r)}
                      >
                        <Text style={[styles.radiusOptionText, radius === r && { color: '#ffffff' }]}>
                          {r} km
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Mapa */}
              <TouchableOpacity style={styles.mapBtn} onPress={openMap}>
                <Ionicons name="map" size={14} color="#ffffff" />
                <Text style={styles.mapBtnText}>Mapa</Text>
              </TouchableOpacity>

              {/* Count */}
              {nearbyBarbershops.length > 0 && (
                <Text style={styles.sectionCount}>
                  {nearbyBarbershops.length} barbearia{nearbyBarbershops.length !== 1 ? 's' : ''}
                </Text>
              )}
            </View>
          </View>

          {/* Card habilitar localização */}
          {locDenied && (
            <TouchableOpacity style={styles.locCard} onPress={requestLocation} activeOpacity={0.85}>
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

          {/* Próximas */}
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

          {/* Todas (excluindo as próximas) */}
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

          {/* Empty total */}
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

  // Hero — centralizado igual ao web
  hero: {
    backgroundColor: '#000000',
    paddingHorizontal: 24,
    paddingTop: 24, paddingBottom: 36,
    alignItems: 'center',
    gap: 8,
  },

  // Topbar — logo + BR idioma
  topbar: {
    backgroundColor: '#000000',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#111827',
  },
  topbarLogo: { width: 40, height: 40 },
  langBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#111827', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: '#374151',
  },
  langFlag: { fontSize: 16 },
  langText: { fontSize: 13, fontWeight: '600', color: '#ffffff' },

  // Dropdown de idiomas
  langOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start', alignItems: 'flex-end',
    paddingTop: 110, paddingRight: 16,
  },
  langDropdown: {
    backgroundColor: '#1f2937', borderRadius: 14,
    borderWidth: 1, borderColor: '#374151',
    overflow: 'hidden', minWidth: 180,
  },
  langOption: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: '#374151',
  },
  langOptionActive: { backgroundColor: '#2563eb22' },
  langOptionFlag:   { fontSize: 20 },
  langOptionText:   { fontSize: 14, fontWeight: '600', color: '#9ca3af', flex: 1 },

  heroTitle: { fontSize: 30, fontWeight: '700', color: '#ffffff', textAlign: 'center' },
  heroName:  { fontSize: 20, fontWeight: '600', color: '#ffffff', textAlign: 'center', marginTop: -4 },
  heroDate:  { fontSize: 13, color: '#9ca3af', textAlign: 'center', marginBottom: 8 },

  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#111827',
    borderRadius: 12, borderWidth: 1, borderColor: '#1f2937',
    paddingHorizontal: 16, paddingVertical: 14,
    width: '100%',
  },
  searchInput: { flex: 1, fontSize: 15, color: '#ffffff' },

  // Sections
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
    backgroundColor: '#0d1117',
    borderTopWidth: 1, borderTopColor: '#1f2937',
    paddingBottom: 24,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#ffffff' },
  sectionCount: { fontSize: 13, color: '#9ca3af' },
  vList: { gap: 12, marginTop: 16 },

  // Linha única: "Empresas próximas" + raio + mapa + count
  nearbyHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
    marginBottom: 0,
  },
  nearbyControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  // Raio
  radiusBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#1f2937', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 7,
    borderWidth: 1, borderColor: '#374151',
  },
  radiusBtnText: { fontSize: 13, fontWeight: '600', color: '#9ca3af' },
  radiusPicker: {
    position: 'absolute', top: 40, right: 0,
    backgroundColor: '#1f2937', borderRadius: 10,
    borderWidth: 1, borderColor: '#374151', zIndex: 99,
    minWidth: 80,
  },
  radiusOption:       { paddingHorizontal: 20, paddingVertical: 10 },
  radiusOptionActive: { backgroundColor: '#2563eb', borderRadius: 8 },
  radiusOptionText:   { fontSize: 13, fontWeight: '600', color: '#9ca3af' },

  // Mapa — azul igual ao web
  mapBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#2563eb', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  mapBtnText: { fontSize: 13, fontWeight: '700', color: '#ffffff' },

  // Localização
  locCard: {
    backgroundColor: '#151b23', borderRadius: 16,
    borderWidth: 1, borderColor: '#1f2937',
    padding: 28, alignItems: 'center', gap: 12,
    marginTop: 16,
  },
  locTitle:   { fontSize: 18, fontWeight: '700', color: '#ffffff' },
  locSub:     { fontSize: 13, color: '#9ca3af', textAlign: 'center', lineHeight: 20 },
  locBtn:     { backgroundColor: '#2563eb', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 28, marginTop: 4 },
  locBtnText: { fontSize: 15, fontWeight: '700', color: '#ffffff' },

  // Empty
  empty:      { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#ffffff' },
  emptyText:  { fontSize: 14, color: '#9ca3af', textAlign: 'center' },
});