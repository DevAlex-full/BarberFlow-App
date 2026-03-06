import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import clientApi from '@/lib/client-api';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/colors';
import { Badge } from '@/components/ui/Badge';

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  description?: string;
}

interface Barber {
  id: string;
  name: string;
  specialties?: string[];
}

interface BarbershopDetail {
  id: string;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  whatsapp?: string;
  logo?: string;
  rating?: number;
  totalReviews?: number;
  plan: string;
  services: Service[];
  barbers: Barber[];
  workingHours?: Record<string, { open: string; close: string; closed: boolean }>;
  isFavorited?: boolean;
}

export default function BarbeariaDetailScreen() {
  const { id }                        = useLocalSearchParams<{ id: string }>();
  const [shop,       setShop]         = useState<BarbershopDetail | null>(null);
  const [loading,    setLoading]      = useState(true);
  const [favorited,  setFavorited]    = useState(false);
  const [activeTab,  setActiveTab]    = useState<'servicos' | 'barbeiros' | 'horarios'>('servicos');

  useEffect(() => { load(); }, [id]);

  async function load() {
    try {
      const res = await clientApi.get(`/client/barbershops/${id}`);
      setShop(res.data);
      setFavorited(res.data.isFavorited || false);
    } catch (e) {
      console.error('Erro ao carregar barbearia:', e);
    } finally {
      setLoading(false);
    }
  }

  async function toggleFavorite() {
    try {
      if (favorited) {
        await clientApi.delete(`/client/favorites/${id}`);
      } else {
        await clientApi.post('/client/favorites', { barbershopId: id });
      }
      setFavorited(!favorited);
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar favorito.');
    }
  }

  function handleWhatsApp() {
    if (!shop?.whatsapp) return;
    const phone = shop.whatsapp.replace(/\D/g, '');
    Linking.openURL(`https://wa.me/55${phone}`);
  }

  function handlePhone() {
    if (!shop?.phone) return;
    Linking.openURL(`tel:${shop.phone}`);
  }

  const DAYS: Record<string, string> = {
    monday: 'Segunda', tuesday: 'Terça', wednesday: 'Quarta',
    thursday: 'Quinta', friday: 'Sexta', saturday: 'Sábado', sunday: 'Domingo',
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!shop) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.gray[300]} />
        <Text style={styles.errorText}>Barbearia não encontrada</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{shop.name}</Text>
        <TouchableOpacity onPress={toggleFavorite} style={styles.iconBtn}>
          <Ionicons
            name={favorited ? 'heart' : 'heart-outline'}
            size={24}
            color={favorited ? Colors.error : Colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroAvatar}>
            <Text style={styles.heroAvatarText}>
              {shop.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.heroName}>{shop.name}</Text>
          {!!shop.description && (
            <Text style={styles.heroDesc}>{shop.description}</Text>
          )}
          {/* Rating */}
          {!!shop.rating && (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={16} color="#f59e0b" />
              <Text style={styles.ratingText}>{shop.rating.toFixed(1)}</Text>
              <Text style={styles.ratingCount}>({shop.totalReviews || 0} avaliações)</Text>
            </View>
          )}
          {/* Localização */}
          {(shop.address || shop.city) && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.locationText}>
                {[shop.address, shop.city, shop.state].filter(Boolean).join(', ')}
              </Text>
            </View>
          )}
        </View>

        {/* Ações de contato */}
        <View style={styles.contactRow}>
          {!!shop.whatsapp && (
            <TouchableOpacity style={[styles.contactBtn, { backgroundColor: '#25d366' }]} onPress={handleWhatsApp}>
              <Ionicons name="logo-whatsapp" size={20} color="#fff" />
              <Text style={styles.contactBtnText}>WhatsApp</Text>
            </TouchableOpacity>
          )}
          {!!shop.phone && (
            <TouchableOpacity style={[styles.contactBtn, { backgroundColor: Colors.navy }]} onPress={handlePhone}>
              <Ionicons name="call-outline" size={20} color="#fff" />
              <Text style={styles.contactBtnText}>Ligar</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {([
            { key: 'servicos',  label: 'Serviços'  },
            { key: 'barbeiros', label: 'Barbeiros' },
            { key: 'horarios',  label: 'Horários'  },
          ] as { key: typeof activeTab; label: string }[]).map(t => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tabBtn, activeTab === t.key && styles.tabBtnActive]}
              onPress={() => setActiveTab(t.key)}
            >
              <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.tabContent}>
          {/* Serviços */}
          {activeTab === 'servicos' && (
            shop.services?.length > 0 ? (
              shop.services.map(s => (
                <View key={s.id} style={styles.serviceCard}>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{s.name}</Text>
                    {!!s.description && <Text style={styles.serviceDesc}>{s.description}</Text>}
                    <View style={styles.serviceMeta}>
                      <Ionicons name="time-outline" size={13} color={Colors.textSecondary} />
                      <Text style={styles.serviceMetaText}>{s.duration} min</Text>
                    </View>
                  </View>
                  <View style={styles.serviceRight}>
                    <Text style={styles.servicePrice}>R$ {Number(s.price).toFixed(2)}</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyTab}>Nenhum serviço cadastrado</Text>
            )
          )}

          {/* Barbeiros */}
          {activeTab === 'barbeiros' && (
            shop.barbers?.length > 0 ? (
              shop.barbers.map(b => (
                <View key={b.id} style={styles.barberCard}>
                  <View style={styles.barberAvatar}>
                    <Text style={styles.barberAvatarText}>
                      {b.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.barberInfo}>
                    <Text style={styles.barberName}>{b.name}</Text>
                    {b.specialties && b.specialties.length > 0 && (
                      <View style={styles.specialtiesRow}>
                        {b.specialties.map((s, i) => (
                          <Badge key={i} label={s} variant="purple" />
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyTab}>Nenhum barbeiro cadastrado</Text>
            )
          )}

          {/* Horários */}
          {activeTab === 'horarios' && (
            shop.workingHours ? (
              Object.entries(DAYS).map(([key, label]) => {
                const h = shop.workingHours?.[key];
                return (
                  <View key={key} style={styles.hoursRow}>
                    <Text style={styles.hoursDay}>{label}</Text>
                    {h?.closed
                      ? <Badge label="Fechado" variant="error" />
                      : <Text style={styles.hoursTime}>{h?.open} – {h?.close}</Text>
                    }
                  </View>
                );
              })
            ) : (
              <Text style={styles.emptyTab}>Horários não informados</Text>
            )
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { fontSize: 16, color: Colors.textSecondary },
  backLink:  { padding: 8 },
  backLinkText: { color: Colors.primary, fontWeight: '600' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.white, paddingHorizontal: Spacing.md,
    paddingTop: 52, paddingBottom: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  iconBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  hero: { backgroundColor: Colors.white, alignItems: 'center', padding: Spacing.lg, gap: 6 },
  heroAvatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  heroAvatarText: { fontSize: 32, fontWeight: '700', color: Colors.white },
  heroName:       { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  heroDesc:       { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  ratingRow:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText:     { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  ratingCount:    { fontSize: 13, color: Colors.textSecondary },
  locationRow:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText:   { fontSize: 13, color: Colors.textSecondary },
  contactRow:     { flexDirection: 'row', gap: 12, padding: Spacing.md, paddingTop: 0 },
  contactBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, borderRadius: BorderRadius.md,
  },
  contactBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  tabs: {
    flexDirection: 'row', backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tabBtn:       { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  tabText:      { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: Colors.primary },
  tabContent:   { padding: Spacing.md, gap: 10 },
  serviceCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.md, ...Shadow.sm, borderWidth: 1, borderColor: Colors.border,
  },
  serviceInfo:     { flex: 1 },
  serviceName:     { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  serviceDesc:     { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  serviceMeta:     { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  serviceMetaText: { fontSize: 12, color: Colors.textSecondary },
  serviceRight:    { alignItems: 'flex-end' },
  servicePrice:    { fontSize: 16, fontWeight: '700', color: Colors.primary },
  barberCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.md, ...Shadow.sm, borderWidth: 1, borderColor: Colors.border,
  },
  barberAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  barberAvatarText: { fontSize: 20, fontWeight: '700', color: Colors.white },
  barberInfo:       { flex: 1 },
  barberName:       { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  specialtiesRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  hoursRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  hoursDay:  { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  hoursTime: { fontSize: 14, color: Colors.textSecondary },
  emptyTab:  { textAlign: 'center', color: Colors.textSecondary, paddingVertical: 32 },
});