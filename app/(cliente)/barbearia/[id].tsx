import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Linking, Modal, FlatList, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import clientApi from '@/lib/client-api';
import { useAuthStore } from '@/stores/authStore';
import { Badge } from '@/components/ui/Badge';

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface BarbershopConfig {
  businessHours?: Record<string, string>;
  instagramUrl?: string;
  facebookUrl?: string;
  whatsappNumber?: string;
  allowOnlineBooking?: boolean;
  showTeam?: boolean;
}

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
  avatar?: string | null;
}

interface BarbershopDetail {
  id: string;
  name: string;
  logo?: string | null;
  description?: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  phone?: string;
  plan: string;
  config?: BarbershopConfig;
  services: Service[];
  users: Barber[];           // ← barbeiros vêm em "users" na API pública
  isFavorited?: boolean;
}

const DAYS_PT: Record<string, string> = {
  monday: 'Segunda', tuesday: 'Terça',  wednesday: 'Quarta',
  thursday: 'Quinta', friday: 'Sexta', saturday: 'Sábado', sunday: 'Domingo',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getNext14Days() {
  const days: { date: Date; label: string; sublabel: string; iso: string }[] = [];
  const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      date: d,
      label:    DAY_NAMES[d.getDay()],
      sublabel: String(d.getDate()).padStart(2, '0'),
      iso: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    });
  }
  return days;
}

// ─── Componente ──────────────────────────────────────────────────────────────

export default function BarbeariaDetailScreen() {
  const { id }               = useLocalSearchParams<{ id: string }>();
  const { clientUser }       = useAuthStore();

  const [shop,         setShop]         = useState<BarbershopDetail | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [favorited,    setFavorited]    = useState(false);
  const [activeTab,    setActiveTab]    = useState<'servicos' | 'barbeiros' | 'horarios'>('servicos');

  // Booking
  const [bookModal,    setBookModal]    = useState(false);
  const [bookStep,     setBookStep]     = useState(1);
  const [selService,   setSelService]   = useState<Service | null>(null);
  const [selBarber,    setSelBarber]    = useState('');
  const [selDate,      setSelDate]      = useState('');
  const [selTime,      setSelTime]      = useState('');
  const [times,        setTimes]        = useState<string[]>([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [booking,      setBooking]      = useState(false);
  const [bookOk,       setBookOk]       = useState(false);
  const [bookError,    setBookError]    = useState('');

  const days14 = getNext14Days();

  // ── Load ────────────────────────────────────────────────────────────────────
  useEffect(() => { load(); }, [id]);

  async function load() {
    try {
      const [shopRes, favRes] = await Promise.allSettled([
        clientApi.get(`/public/barbershops/${id}`),
        clientApi.get('/client/favorites'),
      ]);

      if (shopRes.status === 'fulfilled') {
        setShop(shopRes.value.data);
      }

      if (favRes.status === 'fulfilled') {
        const favs: { id: string }[] = favRes.value.data || [];
        setFavorited(favs.some(f => f.id === id));
      }
    } catch {
      console.error('Erro ao carregar barbearia');
    } finally {
      setLoading(false);
    }
  }

  // ── Available times ─────────────────────────────────────────────────────────
  const loadTimes = useCallback(async () => {
    if (!selDate || !selService || !selBarber) return;
    setLoadingTimes(true);
    setTimes([]);
    try {
      const res = await clientApi.get(
        `/public/barbershops/${id}/available-times`,
        { params: { date: selDate, serviceId: selService.id, barberId: selBarber } }
      );
      setTimes(Array.isArray(res.data) ? res.data : []);
    } catch {
      setTimes([]);
    } finally {
      setLoadingTimes(false);
    }
  }, [id, selDate, selService, selBarber]);

  useEffect(() => { if (bookStep === 3) loadTimes(); }, [bookStep, loadTimes]);

  // ── Favorite toggle ─────────────────────────────────────────────────────────
  async function toggleFavorite() {
    if (!clientUser) {
      Alert.alert('Login necessário', 'Faça login para salvar favoritos.', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Entrar', onPress: () => router.push('/(auth)/login') },
      ]);
      return;
    }
    try {
      if (favorited) {
        await clientApi.delete(`/client/favorites/${id}`);
      } else {
        await clientApi.post('/client/favorites', { barbershopId: id });
      }
      setFavorited(p => !p);
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar favorito.');
    }
  }

  // ── Open booking ─────────────────────────────────────────────────────────────
  function openBooking(service: Service) {
    if (!shop?.config?.allowOnlineBooking) {
      Alert.alert('Agendamento', 'Entre em contato pelo telefone para agendar.');
      return;
    }
    if (!clientUser) {
      Alert.alert('Login necessário', 'Faça login para agendar.', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Entrar', onPress: () => router.push('/(auth)/login') },
      ]);
      return;
    }
    setSelService(service);
    setSelBarber('');
    setSelDate('');
    setSelTime('');
    setTimes([]);
    setBookStep(1);
    setBookOk(false);
    setBookError('');
    setBookModal(true);
  }

  // ── Confirm booking ──────────────────────────────────────────────────────────
  async function confirmBooking() {
    if (!selService || !selBarber || !selTime) {
      setBookError('Preencha todos os campos.');
      return;
    }
    setBooking(true);
    setBookError('');
    try {
      await clientApi.post('/client/appointments', {
        barbershopId: id,
        barberId:     selBarber,
        serviceId:    selService.id,
        date:         selTime,
      });
      setBookOk(true);
      setTimeout(() => {
        setBookModal(false);
        router.push('/(cliente)/agendamentos');
      }, 2000);
    } catch (e: any) {
      setBookError(e.response?.data?.error || 'Erro ao criar agendamento.');
    } finally {
      setBooking(false);
    }
  }

  // ── Contato ──────────────────────────────────────────────────────────────────
  function openWhatsApp(phone: string) {
    Linking.openURL(`https://wa.me/55${phone.replace(/\D/g, '')}`);
  }

  function openPhone(phone: string) {
    Linking.openURL(`tel:${phone}`);
  }

  // ── Loading / Error ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={'#2563eb'} />
      </View>
    );
  }

  if (!shop) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color={'#6b7280'} />
        <Text style={styles.errorText}>Barbearia não encontrada</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const barbers = shop.users || [];
  const cfg     = shop.config || {};

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color={'#ffffff'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{shop.name}</Text>
        <TouchableOpacity onPress={toggleFavorite} style={styles.iconBtn}>
          <Ionicons
            name={favorited ? 'heart' : 'heart-outline'}
            size={24}
            color={favorited ? '#f87171' : '#ffffff'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          {shop.logo ? (
            <Image
              source={{ uri: shop.logo }}
              style={styles.heroLogoImg}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.heroAvatar}>
              <Text style={styles.heroAvatarText}>{shop.name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <Text style={styles.heroName}>{shop.name}</Text>
          {!!shop.description && (
            <Text style={styles.heroDesc}>{shop.description}</Text>
          )}
          {(shop.address || shop.city) && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={'#9ca3af'} />
              <Text style={styles.locationText}>
                {[shop.address, shop.city, shop.state].filter(Boolean).join(', ')}
              </Text>
            </View>
          )}
        </View>

        {/* Botões de contato */}
        {(shop.config?.whatsappNumber || shop.phone) && (
          <View style={styles.contactRow}>
            {!!(cfg.whatsappNumber || shop.phone) && (
              <TouchableOpacity
                style={[styles.contactBtn, { backgroundColor: '#25d366' }]}
                onPress={() => openWhatsApp(cfg.whatsappNumber || shop.phone || '')}
              >
                <Ionicons name="logo-whatsapp" size={18} color="#fff" />
                <Text style={styles.contactBtnText}>WhatsApp</Text>
              </TouchableOpacity>
            )}
            {!!shop.phone && (
              <TouchableOpacity
                style={[styles.contactBtn, { backgroundColor: '#1d4ed8' }]}
                onPress={() => openPhone(shop.phone!)}
              >
                <Ionicons name="call-outline" size={18} color="#fff" />
                <Text style={styles.contactBtnText}>Ligar</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabs}>
          {(['servicos', 'barbeiros', 'horarios'] as const).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, activeTab === t && styles.tabBtnActive]}
              onPress={() => setActiveTab(t)}
            >
              <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
                {t === 'servicos' ? 'Serviços' : t === 'barbeiros' ? 'Barbeiros' : 'Horários'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.tabContent}>
          {/* ── Serviços ── */}
          {activeTab === 'servicos' && (
            shop.services?.length > 0 ? shop.services.map(s => (
              <View key={s.id} style={styles.serviceCard}>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{s.name}</Text>
                  {!!s.description && <Text style={styles.serviceDesc}>{s.description}</Text>}
                  <View style={styles.serviceMeta}>
                    <Ionicons name="time-outline" size={13} color={'#9ca3af'} />
                    <Text style={styles.serviceMetaText}>{s.duration} min</Text>
                  </View>
                </View>
                <View style={styles.serviceRight}>
                  <Text style={styles.servicePrice}>
                    R$ {Number(s.price).toFixed(2)}
                  </Text>
                  {cfg.allowOnlineBooking !== false && (
                    <TouchableOpacity
                      style={styles.agendarBtn}
                      onPress={() => openBooking(s)}
                    >
                      <Text style={styles.agendarBtnText}>Agendar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )) : (
              <Text style={styles.emptyTab}>Nenhum serviço cadastrado</Text>
            )
          )}

          {/* ── Barbeiros ── */}
          {activeTab === 'barbeiros' && (
            barbers.length > 0 ? barbers.map(b => (
              <View key={b.id} style={styles.barberCard}>
                <View style={styles.barberAvatar}>
                  <Text style={styles.barberAvatarText}>{b.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.barberInfo}>
                  <Text style={styles.barberName}>{b.name}</Text>
                  <Text style={styles.barberRole}>Especialista</Text>
                  <View style={styles.starsRow}>
                    {[1,2,3,4,5].map(i => (
                      <Ionicons key={i} name="star" size={12} color="#f59e0b" />
                    ))}
                  </View>
                </View>
              </View>
            )) : (
              <Text style={styles.emptyTab}>Nenhum barbeiro cadastrado</Text>
            )
          )}

          {/* ── Horários ── */}
          {activeTab === 'horarios' && (
            cfg.businessHours ? (
              Object.entries(DAYS_PT).map(([key, label]) => {
                const h = cfg.businessHours?.[key] || 'Fechado';
                const closed = h.toLowerCase() === 'fechado';
                return (
                  <View key={key} style={styles.hoursRow}>
                    <Text style={styles.hoursDay}>{label}</Text>
                    {closed
                      ? <Badge label="Fechado" variant="error" />
                      : <Text style={styles.hoursTime}>{h}</Text>
                    }
                  </View>
                );
              })
            ) : (
              <Text style={styles.emptyTab}>Horários não informados</Text>
            )
          )}
        </View>

        {/* Redes sociais */}
        {(cfg.instagramUrl || cfg.facebookUrl || cfg.whatsappNumber) && (
          <View style={styles.socialSection}>
            <Text style={styles.socialTitle}>Redes Sociais</Text>
            <View style={styles.socialRow}>
              {!!cfg.instagramUrl && (
                <TouchableOpacity
                  style={[styles.socialBtn, { backgroundColor: '#e1306c' }]}
                  onPress={() => Linking.openURL(cfg.instagramUrl!)}
                >
                  <Ionicons name="logo-instagram" size={22} color="#fff" />
                </TouchableOpacity>
              )}
              {!!cfg.facebookUrl && (
                <TouchableOpacity
                  style={[styles.socialBtn, { backgroundColor: '#1877f2' }]}
                  onPress={() => Linking.openURL(cfg.facebookUrl!)}
                >
                  <Ionicons name="logo-facebook" size={22} color="#fff" />
                </TouchableOpacity>
              )}
              {!!cfg.whatsappNumber && (
                <TouchableOpacity
                  style={[styles.socialBtn, { backgroundColor: '#25d366' }]}
                  onPress={() => openWhatsApp(cfg.whatsappNumber!)}
                >
                  <Ionicons name="logo-whatsapp" size={22} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ──────────────────── MODAL DE AGENDAMENTO ──────────────────── */}
      <Modal visible={bookModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>

            {/* Sucesso */}
            {bookOk ? (
              <View style={styles.bookSuccess}>
                <Ionicons name="checkmark-circle" size={64} color={'#4ade80'} />
                <Text style={styles.bookSuccessTitle}>Agendado!</Text>
                <Text style={styles.bookSuccessText}>Redirecionando...</Text>
              </View>
            ) : (
              <>
                {/* Header modal */}
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>Novo Agendamento</Text>
                    {!!selService && (
                      <Text style={styles.modalSubtitle}>{selService.name}</Text>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => setBookModal(false)} style={styles.iconBtn}>
                    <Ionicons name="close" size={24} color={'#ffffff'} />
                  </TouchableOpacity>
                </View>

                {/* Steps indicator */}
                <View style={styles.stepsRow}>
                  {[1, 2, 3].map(s => (
                    <View key={s} style={styles.stepItem}>
                      <View style={[styles.stepCircle, bookStep >= s && styles.stepCircleActive]}>
                        <Text style={[styles.stepNum, bookStep >= s && styles.stepNumActive]}>
                          {bookStep > s ? '✓' : s}
                        </Text>
                      </View>
                      {s < 3 && (
                        <View style={[styles.stepLine, bookStep > s && styles.stepLineActive]} />
                      )}
                    </View>
                  ))}
                </View>

                {/* Erro */}
                {!!bookError && (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle-outline" size={16} color={'#f87171'} />
                    <Text style={styles.errorBoxText}>{bookError}</Text>
                  </View>
                )}

                <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                  {/* STEP 1 — Barbeiro */}
                  {bookStep === 1 && (
                    <View style={styles.stepContent}>
                      <Text style={styles.stepTitle}>Escolha o Profissional</Text>
                      {barbers.map(b => (
                        <TouchableOpacity
                          key={b.id}
                          style={[styles.barberOption, selBarber === b.id && styles.barberOptionActive]}
                          onPress={() => setSelBarber(b.id)}
                        >
                          <View style={styles.barberOptionAvatar}>
                            <Text style={styles.barberOptionAvatarText}>
                              {b.name.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.barberOptionName}>{b.name}</Text>
                            <Text style={styles.barberOptionRole}>Especialista</Text>
                          </View>
                          {selBarber === b.id && (
                            <Ionicons name="checkmark-circle" size={22} color={'#2563eb'} />
                          )}
                        </TouchableOpacity>
                      ))}
                      <TouchableOpacity
                        style={[styles.nextBtn, !selBarber && styles.nextBtnDisabled]}
                        onPress={() => selBarber && setBookStep(2)}
                        disabled={!selBarber}
                      >
                        <Text style={styles.nextBtnText}>Continuar</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* STEP 2 — Data */}
                  {bookStep === 2 && (
                    <View style={styles.stepContent}>
                      <Text style={styles.stepTitle}>Escolha a Data</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysScroll}>
                        {days14.map(d => (
                          <TouchableOpacity
                            key={d.iso}
                            style={[styles.dayChip, selDate === d.iso && styles.dayChipActive]}
                            onPress={() => { setSelDate(d.iso); setSelTime(''); }}
                          >
                            <Text style={[styles.dayChipLabel, selDate === d.iso && styles.dayChipTextActive]}>
                              {d.label}
                            </Text>
                            <Text style={[styles.dayChipNum, selDate === d.iso && styles.dayChipTextActive]}>
                              {d.sublabel}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                      <View style={styles.stepBtns}>
                        <TouchableOpacity style={styles.backBtn} onPress={() => setBookStep(1)}>
                          <Text style={styles.backBtnText}>Voltar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.nextBtn, { flex: 1 }, !selDate && styles.nextBtnDisabled]}
                          onPress={() => selDate && setBookStep(3)}
                          disabled={!selDate}
                        >
                          <Text style={styles.nextBtnText}>Continuar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* STEP 3 — Horário */}
                  {bookStep === 3 && (
                    <View style={styles.stepContent}>
                      <Text style={styles.stepTitle}>Escolha o Horário</Text>

                      {loadingTimes ? (
                        <View style={styles.timesLoading}>
                          <ActivityIndicator color={'#2563eb'} />
                          <Text style={styles.timesLoadingText}>Carregando horários...</Text>
                        </View>
                      ) : times.length === 0 ? (
                        <View style={styles.timesEmpty}>
                          <Ionicons name="time-outline" size={40} color={'#6b7280'} />
                          <Text style={styles.timesEmptyText}>Nenhum horário disponível</Text>
                          <TouchableOpacity onPress={() => setBookStep(2)}>
                            <Text style={styles.timesEmptyLink}>Escolher outra data</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={styles.timesGrid}>
                          {times.map(t => {
                            const label = new Date(t).toLocaleTimeString('pt-BR', {
                              hour: '2-digit', minute: '2-digit',
                            });
                            return (
                              <TouchableOpacity
                                key={t}
                                style={[styles.timeChip, selTime === t && styles.timeChipActive]}
                                onPress={() => setSelTime(t)}
                              >
                                <Text style={[styles.timeChipText, selTime === t && styles.timeChipTextActive]}>
                                  {label}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}

                      {/* Resumo */}
                      {!!selTime && (
                        <View style={styles.summary}>
                          <Text style={styles.summaryTitle}>Resumo</Text>
                          <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Serviço</Text>
                            <Text style={styles.summaryValue}>{selService?.name}</Text>
                          </View>
                          <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Profissional</Text>
                            <Text style={styles.summaryValue}>
                              {barbers.find(b => b.id === selBarber)?.name}
                            </Text>
                          </View>
                          <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Data</Text>
                            <Text style={styles.summaryValue}>
                              {new Date(selDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                            </Text>
                          </View>
                          <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Horário</Text>
                            <Text style={styles.summaryValue}>
                              {new Date(selTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                          </View>
                          <View style={[styles.summaryRow, styles.summaryTotal]}>
                            <Text style={styles.summaryLabel}>Total</Text>
                            <Text style={styles.summaryTotalValue}>
                              R$ {Number(selService?.price).toFixed(2)}
                            </Text>
                          </View>
                        </View>
                      )}

                      <View style={styles.stepBtns}>
                        <TouchableOpacity style={styles.backBtn} onPress={() => setBookStep(2)}>
                          <Text style={styles.backBtnText}>Voltar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.confirmBtn, (!selTime || booking) && styles.nextBtnDisabled]}
                          onPress={confirmBooking}
                          disabled={!selTime || booking}
                        >
                          {booking
                            ? <ActivityIndicator color="#fff" size="small" />
                            : <Text style={styles.nextBtnText}>Confirmar</Text>
                          }
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { fontSize: 16, color: '#9ca3af' },
  backLink:  { padding: 8 },
  backLinkText: { color: '#2563eb', fontWeight: '600' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#151b23', paddingHorizontal: 16,
    paddingTop: 52, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#1f2937',
  },
  iconBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#ffffff', textAlign: 'center' },

  hero: {
    backgroundColor: '#151b23', alignItems: 'center',
    padding: 20, gap: 6,
    borderBottomWidth: 1, borderBottomColor: '#1f2937',
  },
  heroAvatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  heroAvatarText: { fontSize: 32, fontWeight: '700', color: '#151b23' },
  heroLogoImg: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#1f2937', marginBottom: 4,
    borderWidth: 1, borderColor: '#374151',
  },
  heroName:       { fontSize: 22, fontWeight: '700', color: '#ffffff' },
  heroDesc:       { fontSize: 14, color: '#9ca3af', textAlign: 'center', lineHeight: 20 },
  locationRow:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText:   { fontSize: 13, color: '#9ca3af' },

  contactRow: { flexDirection: 'row', gap: 10, padding: 16 },
  contactBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderRadius: 10,
  },
  contactBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  tabs: {
    flexDirection: 'row', backgroundColor: '#151b23',
    borderBottomWidth: 1, borderBottomColor: '#1f2937',
  },
  tabBtn:       { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: '#2563eb' },
  tabText:      { fontSize: 13, fontWeight: '600', color: '#9ca3af' },
  tabTextActive: { color: '#2563eb' },
  tabContent:   { padding: 16, gap: 10 },

  serviceCard: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    backgroundColor: '#151b23', borderRadius: 12,
    padding: 16,  borderWidth: 1, borderColor: '#1f2937',
  },
  serviceInfo:     { flex: 1, marginRight: 12 },
  serviceName:     { fontSize: 15, fontWeight: '700', color: '#ffffff' },
  serviceDesc:     { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  serviceMeta:     { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  serviceMetaText: { fontSize: 12, color: '#9ca3af' },
  serviceRight:    { alignItems: 'flex-end', gap: 8 },
  servicePrice:    { fontSize: 16, fontWeight: '700', color: '#2563eb' },
  agendarBtn: {
    backgroundColor: '#2563eb', paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 10,
  },
  agendarBtnText: { color: '#151b23', fontWeight: '700', fontSize: 13 },

  barberCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#151b23', borderRadius: 12,
    padding: 16,  borderWidth: 1, borderColor: '#1f2937',
  },
  barberAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center',
  },
  barberAvatarText: { fontSize: 20, fontWeight: '700', color: '#151b23' },
  barberInfo:       { flex: 1 },
  barberName:       { fontSize: 15, fontWeight: '700', color: '#ffffff' },
  barberRole:       { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  starsRow:         { flexDirection: 'row', gap: 2, marginTop: 4 },

  hoursRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1f2937',
  },
  hoursDay:  { fontSize: 14, fontWeight: '600', color: '#ffffff' },
  hoursTime: { fontSize: 14, color: '#4ade80', fontWeight: '600' },

  emptyTab: { textAlign: 'center', color: '#9ca3af', paddingVertical: 32 },

  socialSection: {
    margin: 16, backgroundColor: '#151b23',
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#1f2937', 
  },
  socialTitle: { fontSize: 15, fontWeight: '700', color: '#ffffff', marginBottom: 12 },
  socialRow:   { flexDirection: 'row', gap: 12 },
  socialBtn:   { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  // ── Modal ──────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#151b23', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '92%', paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#1f2937',
  },
  modalTitle:    { fontSize: 18, fontWeight: '700', color: '#ffffff' },
  modalSubtitle: { fontSize: 13, color: '#9ca3af', marginTop: 2 },

  stepsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, gap: 0,
  },
  stepItem:         { flexDirection: 'row', alignItems: 'center' },
  stepCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#1f2937', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#1f2937',
  },
  stepCircleActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  stepNum:          { fontSize: 13, fontWeight: '700', color: '#9ca3af' },
  stepNumActive:    { color: '#151b23' },
  stepLine:         { width: 48, height: 2, backgroundColor: '#1f2937' },
  stepLineActive:   { backgroundColor: '#2563eb' },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(239,68,68,0.1)', marginHorizontal: 16,
    borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
  },
  errorBoxText: { fontSize: 13, color: '#f87171', flex: 1 },

  stepContent: { padding: 16, gap: 12 },
  stepTitle:   { fontSize: 16, fontWeight: '700', color: '#ffffff', marginBottom: 4 },

  barberOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#1f2937', borderRadius: 12,
    padding: 16, borderWidth: 2, borderColor: '#1f2937',
  },
  barberOptionActive: { borderColor: '#2563eb', backgroundColor: '#2563eb' + '0D' },
  barberOptionAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center',
  },
  barberOptionAvatarText: { fontSize: 18, fontWeight: '700', color: '#151b23' },
  barberOptionName:       { fontSize: 15, fontWeight: '700', color: '#ffffff' },
  barberOptionRole:       { fontSize: 12, color: '#9ca3af' },

  daysScroll:     { marginVertical: 8 },
  dayChip: {
    alignItems: 'center', marginRight: 10,
    backgroundColor: '#1f2937', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 2, borderColor: '#1f2937', minWidth: 60,
  },
  dayChipActive:    { borderColor: '#2563eb', backgroundColor: '#2563eb' },
  dayChipLabel:     { fontSize: 11, fontWeight: '600', color: '#9ca3af' },
  dayChipNum:       { fontSize: 18, fontWeight: '700', color: '#ffffff', marginTop: 2 },
  dayChipTextActive: { color: '#151b23' },

  timesLoading: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  timesLoadingText: { fontSize: 14, color: '#9ca3af' },
  timesEmpty:   { alignItems: 'center', paddingVertical: 32, gap: 8 },
  timesEmptyText: { fontSize: 15, color: '#9ca3af' },
  timesEmptyLink: { color: '#2563eb', fontWeight: '600', fontSize: 14 },

  timesGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  timeChip: {
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: '#1f2937', borderRadius: 10,
    borderWidth: 2, borderColor: '#1f2937',
  },
  timeChipActive:   { borderColor: '#2563eb', backgroundColor: '#2563eb' },
  timeChipText:     { fontSize: 14, fontWeight: '600', color: '#ffffff' },
  timeChipTextActive: { color: '#151b23' },

  summary: {
    backgroundColor: '#1f2937', borderRadius: 12,
    padding: 16, marginTop: 8,
    borderWidth: 1, borderColor: '#1f2937',
  },
  summaryTitle:      { fontSize: 14, fontWeight: '700', color: '#ffffff', marginBottom: 10 },
  summaryRow:        { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  summaryLabel:      { fontSize: 13, color: '#9ca3af' },
  summaryValue:      { fontSize: 13, fontWeight: '600', color: '#ffffff' },
  summaryTotal:      { borderTopWidth: 1, borderTopColor: '#1f2937', marginTop: 8, paddingTop: 8 },
  summaryTotalValue: { fontSize: 16, fontWeight: '700', color: '#2563eb' },

  stepBtns:  { flexDirection: 'row', gap: 10, marginTop: 8 },
  backBtn: {
    backgroundColor: '#1f2937', borderRadius: 10,
    paddingVertical: 14, paddingHorizontal: 20, alignItems: 'center',
  },
  backBtnText: { fontWeight: '700', color: '#9ca3af', fontSize: 15 },
  nextBtn: {
    flex: 1, backgroundColor: '#2563eb', borderRadius: 10,
    paddingVertical: 14, alignItems: 'center',
  },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText:     { color: '#151b23', fontWeight: '700', fontSize: 15 },
  confirmBtn: {
    flex: 1, backgroundColor: '#4ade80', borderRadius: 10,
    paddingVertical: 14, alignItems: 'center',
  },

  bookSuccess: {
    alignItems: 'center', justifyContent: 'center',
    padding: 48, gap: 12,
  },
  bookSuccessTitle: { fontSize: 24, fontWeight: '700', color: '#4ade80' },
  bookSuccessText:  { fontSize: 14, color: '#9ca3af' },
});