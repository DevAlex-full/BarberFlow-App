import { useEffect, useState, useCallback, useRef } from 'react';
const DEFAULT_LOGO = require('../../../assets/images/logo4.png');
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Linking, Modal, Image,
  ImageBackground, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import clientApi from '@/lib/client-api';
import { useAuthStore } from '@/stores/authStore';

const { width: SCREEN_W } = Dimensions.get('window');
const COL_W = (SCREEN_W - 32 - 12) / 2; // 2 colunas com gap 12

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface BarbershopConfig {
  businessHours?: Record<string, string>;
  instagramUrl?: string;
  facebookUrl?: string;
  whatsappNumber?: string;
  youtubeUrl?: string;
  allowOnlineBooking?: boolean;
  showTeam?: boolean;
  showGallery?: boolean;
  showReviews?: boolean;
  primaryColor?: string;
  secondaryColor?: string;
  heroImage?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  description?: string;
  galleryImages?: string[];
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
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  neighborhood?: string | null;
  phone?: string;
  plan: string;
  config?: BarbershopConfig;
  services: Service[];
  users: Barber[];
}

// Ordem exata dos dias igual ao web
const DAYS_ORDER = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const DAYS_PT: Record<string, string> = {
  monday: 'Segunda', tuesday: 'Terça',   wednesday: 'Quarta',
  thursday: 'Quinta', friday: 'Sexta',   saturday: 'Sábado', sunday: 'Domingo',
};

function getNext14Days() {
  const DAY = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const today = new Date();
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return {
      date: d,
      label: DAY[d.getDay()],
      sublabel: String(d.getDate()).padStart(2, '0'),
      iso: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    };
  });
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function BarbeariaDetailScreen() {
  const { id }         = useLocalSearchParams<{ id: string }>();
  const { clientUser } = useAuthStore();

  const [shop,         setShop]         = useState<BarbershopDetail | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [favorited,    setFavorited]    = useState(false);

  // Refs para scroll até horários
  const scrollViewRef = useRef<ScrollView>(null);
  const hoursYRef     = useRef<number>(0);

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

  useEffect(() => { loadData(); }, [id]);

  async function loadData() {
    try {
      const [shopRes, favRes] = await Promise.allSettled([
        clientApi.get(`/public/barbershops/${id}`),
        clientApi.get('/client/favorites'),
      ]);
      if (shopRes.status === 'fulfilled') setShop(shopRes.value.data);
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

  const loadTimes = useCallback(async () => {
    if (!selDate || !selService || !selBarber) return;
    const barbers = shop?.users || [];
    const resolvedBarberId = selBarber === '__any__' ? (barbers[0]?.id ?? undefined) : selBarber;
    setLoadingTimes(true);
    setTimes([]);
    try {
      const res = await clientApi.get(`/public/barbershops/${id}/available-times`, {
        params: { date: selDate, serviceId: selService.id, ...(resolvedBarberId ? { barberId: resolvedBarberId } : {}) },
      });
      setTimes(Array.isArray(res.data) ? res.data : []);
    } catch {
      setTimes([]);
    } finally {
      setLoadingTimes(false);
    }
  }, [id, selDate, selService, selBarber, shop]);

  useEffect(() => { if (bookStep === 3) loadTimes(); }, [bookStep, loadTimes]);

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

  function openBooking(service: Service) {
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

  async function confirmBooking() {
    if (!selService || !selBarber || !selTime) {
      setBookError('Preencha todos os campos.');
      return;
    }
    const barbers = shop?.users || [];
    const resolvedBarberId = selBarber === '__any__' ? (barbers[0]?.id ?? '') : selBarber;
    if (!resolvedBarberId) { setBookError('Nenhum profissional disponível.'); return; }
    setBooking(true);
    setBookError('');
    try {
      await clientApi.post('/client/appointments', {
        barbershopId: id, barberId: resolvedBarberId,
        serviceId: selService.id, date: selTime,
      });
      setBookOk(true);
      setTimeout(() => { setBookModal(false); router.push('/(cliente)/agendamentos'); }, 2000);
    } catch (e: any) {
      setBookError(e.response?.data?.error || 'Erro ao criar agendamento.');
    } finally {
      setBooking(false);
    }
  }

  function openWhatsApp(phone: string) {
    Linking.openURL(`https://wa.me/55${phone.replace(/\D/g, '')}`);
  }

  if (loading) {
    return (
      <LinearGradient colors={['#0f0720', '#1e1040', '#0f0720']} style={styles.centered}>
        <ActivityIndicator size="large" color="#a78bfa" />
        <Text style={styles.loadingText}>Carregando experiência...</Text>
      </LinearGradient>
    );
  }

  if (!shop) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color="#6b7280" />
        <Text style={styles.errorText}>Barbearia não encontrada</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const barbers   = shop.users || [];
  const cfg       = shop.config || {};
  const primary   = cfg.primaryColor   || '#4f46e5';
  const secondary = cfg.secondaryColor || '#7c3aed';
  const isPremium = shop.plan === 'premium' || shop.plan === 'enterprise';

  // Endereço completo
  const fullAddress = [shop.address, shop.city, shop.state].filter(Boolean).join(', ');

  return (
    <View style={styles.container}>

      {/* ──────────── HEADER FIXO ──────────── */}
      <View style={styles.header}>
        {/* Voltar */}
        <TouchableOpacity onPress={() => router.back()} style={styles.headerLeft}>
          <Ionicons name="arrow-back" size={20} color="#ffffff" />
          <Text style={styles.headerVoltar}>Voltar</Text>
        </TouchableOpacity>

        {/* Badge Premium */}
        {isPremium && (
          <View style={styles.premiumPill}>
            <Ionicons name="star" size={10} color="#f59e0b" />
            <Text style={styles.premiumPillText}>Experiência Premium</Text>
          </View>
        )}

        {/* Agendar + Share */}
        <View style={styles.headerRight}>
          {cfg.allowOnlineBooking !== false && shop.services?.length > 0 && (
            <TouchableOpacity
              style={styles.agendarHeaderBtn}
              onPress={() => openBooking(shop.services[0])}
            >
              <Ionicons name="calendar-outline" size={14} color="#ffffff" />
              <Text style={styles.agendarHeaderText}>Agendar</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={toggleFavorite}
            style={styles.iconBtn}
          >
            <Ionicons
              name={favorited ? 'heart' : 'heart-outline'}
              size={20}
              color={favorited ? '#f87171' : '#ffffff'}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false}>

        {/* ──────────── HERO ──────────── */}
        {cfg.heroImage ? (
          <ImageBackground source={{ uri: cfg.heroImage }} style={styles.hero}>
            <LinearGradient
              colors={['rgba(15,7,32,0.55)', 'rgba(15,7,32,0.8)', 'rgba(15,7,32,0.98)']}
              style={StyleSheet.absoluteFill}
            />
            <HeroContent shop={shop} cfg={cfg} isPremium={isPremium} primary={primary}
              onAgendar={() => shop.services?.length > 0 && openBooking(shop.services[0])}
              onWhatsApp={() => openWhatsApp(cfg.whatsappNumber || shop.phone || '')}
            />
          </ImageBackground>
        ) : (
          <LinearGradient
            colors={[primary + 'dd', secondary + 'cc', '#1a0a3c', '#0a0015']}
            start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }}
            style={styles.hero}
          >
            <HeroContent shop={shop} cfg={cfg} isPremium={isPremium} primary={primary}
              onAgendar={() => shop.services?.length > 0 && openBooking(shop.services[0])}
              onWhatsApp={() => openWhatsApp(cfg.whatsappNumber || shop.phone || '')}
            />
          </LinearGradient>
        )}

        {/* ──────────── INFO CARDS COLORIDOS (3 colunas, igual ao web) ──────────── */}
        <View style={styles.infoCardsRow}>
          {/* Localização — azul */}
          {!!fullAddress && (
            <View style={[styles.infoCard, { backgroundColor: '#1d4ed8' }]}>
              <View style={styles.infoIconBox}>
                <Ionicons name="location" size={22} color="#ffffff" />
              </View>
              <Text style={styles.infoCardLabel}>Localização</Text>
              <Text style={styles.infoCardValue} numberOfLines={3}>{fullAddress}</Text>
            </View>
          )}

          {/* Contato — verde */}
          {!!shop.phone && (
            <TouchableOpacity
              style={[styles.infoCard, { backgroundColor: '#15803d' }]}
              onPress={() => Linking.openURL(`tel:${shop.phone}`)}
            >
              <View style={styles.infoIconBox}>
                <Ionicons name="call" size={22} color="#ffffff" />
              </View>
              <Text style={styles.infoCardLabel}>Contato</Text>
              <Text style={styles.infoCardValue}>{shop.phone}</Text>
            </TouchableOpacity>
          )}

          {/* Horários — roxo, clicável → scroll até horários */}
          {!!cfg.businessHours && (
            <TouchableOpacity
              style={[styles.infoCard, { backgroundColor: '#7c3aed' }]}
              onPress={() => scrollViewRef.current?.scrollTo({ y: hoursYRef.current, animated: true })}
              activeOpacity={0.8}
            >
              <View style={styles.infoIconBox}>
                <Ionicons name="time" size={22} color="#ffffff" />
              </View>
              <Text style={styles.infoCardLabel}>Horários</Text>
              <Text style={[styles.infoCardValue, { color: '#c4b5fd' }]}>Ver horários</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ──────────── DESCRIÇÃO ──────────── */}
        {!!cfg.description && (
          <View style={styles.descSection}>
            <Text style={styles.descText}>{cfg.description}</Text>
          </View>
        )}

        {/* ──────────── SERVIÇOS — grid 2 colunas igual ao web ──────────── */}
        {shop.services?.length > 0 && (
          <View style={styles.section}>
            <SectionBadge icon="settings-outline" label="Nossos Serviços" color={primary} />
            <Text style={styles.sectionTitle}>Serviços Premium</Text>
            <Text style={styles.sectionSub}>Escolha o serviço perfeito para o seu estilo</Text>

            <View style={styles.servicesGrid}>
              {shop.services.map(s => (
                <View key={s.id} style={styles.serviceCard}>
                  {/* Linha: nome + logo da barbearia */}
                  <View style={styles.serviceCardHeader}>
                    <Text style={styles.serviceCardName} numberOfLines={2}>{s.name}</Text>
                    {/* Logo da barbearia — igual ao web */}
                    <View style={[styles.serviceLogoBox, { backgroundColor: primary + '33' }]}>
                      <Image
                        source={shop.logo ? { uri: shop.logo } : DEFAULT_LOGO}
                        style={styles.serviceLogoImg}
                        resizeMode="contain"
                      />
                    </View>
                  </View>
                  {!!s.description && (
                    <Text style={styles.serviceCardDesc} numberOfLines={2}>{s.description}</Text>
                  )}

                  {/* Duração + garantia */}
                  <View style={styles.serviceMeta}>
                    <Ionicons name="time-outline" size={12} color="#9ca3af" />
                    <Text style={styles.serviceMetaText}>{s.duration} min</Text>
                    <Text style={styles.serviceGuarantee}>✓ Garantia</Text>
                  </View>

                  {/* Preço — sempre branco */}
                  <Text style={styles.serviceFromLabel}>A partir de</Text>
                  <Text style={styles.servicePrice}>
                    R$ {Number(s.price).toFixed(2)}
                  </Text>

                  {/* Botão Agendar */}
                  {cfg.allowOnlineBooking !== false && (
                    <TouchableOpacity
                      style={[styles.serviceAgendarBtn, { backgroundColor: primary }]}
                      onPress={() => openBooking(s)}
                    >
                      <Text style={styles.serviceAgendarText}>Agendar</Text>
                      <Ionicons name="play" size={10} color="#ffffff" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ──────────── EQUIPE ──────────── */}
        {cfg.showTeam !== false && barbers.length > 0 && (
          <View style={styles.section}>
            <SectionBadge icon="people-outline" label="Profissionais" color={primary} />
            <Text style={styles.sectionTitle}>Nossa Equipe de Elite</Text>
            <Text style={styles.sectionSub}>Profissionais certificados e apaixonados pelo que fazem</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 16 }}>
              <View style={styles.teamRow}>
                {barbers.map(b => (
                  <View key={b.id} style={styles.teamCard}>
                    {/* Avatar: real → logo barbearia → logo BarberFlow */}
                    <View style={styles.teamAvatarWrapper}>
                      <View style={[styles.teamAvatar, { backgroundColor: primary + '44' }]}>
                        {b.avatar ? (
                          <Image
                            source={{ uri: b.avatar }}
                            style={styles.teamAvatarImg}
                            resizeMode="cover"
                          />
                        ) : (
                          <Image
                            source={shop.logo ? { uri: shop.logo } : DEFAULT_LOGO}
                            style={styles.teamAvatarImgContain}
                            resizeMode="contain"
                          />
                        )}
                      </View>
                      {/* Badge verde checkmark — igual ao web */}
                      <View style={styles.teamOnlineBadge}>
                        <Ionicons name="checkmark" size={8} color="#ffffff" />
                      </View>
                    </View>
                    <Text style={styles.teamName}>{b.name}</Text>
                    <Text style={styles.teamRole}>Especialista</Text>
                    <View style={styles.starsRow}>
                      {[1,2,3,4,5].map(i => (
                        <Ionicons key={i} name="star" size={11} color="#f59e0b" />
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* ──────────── GALERIA ──────────── */}
        {cfg.showGallery && cfg.galleryImages && cfg.galleryImages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Galeria</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
              <View style={styles.galleryRow}>
                {cfg.galleryImages.map((img, i) => (
                  <Image key={i} source={{ uri: img }} style={styles.galleryImg} resizeMode="cover" />
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* ──────────── HORÁRIOS ──────────── */}
        {!!cfg.businessHours && (
          <View
            style={styles.section}
            onLayout={e => { hoursYRef.current = e.nativeEvent.layout.y; }}
          >
            <SectionBadge icon="time-outline" label="Horários" color={primary} />
            <Text style={styles.sectionTitle}>Quando Estamos Abertos</Text>
            <Text style={styles.sectionSub}>Prontos para te atender com excelência</Text>

            <View style={styles.hoursCard}>
              {DAYS_ORDER.map(key => {
                const label  = DAYS_PT[key];
                const h      = cfg.businessHours?.[key] || 'Fechado';
                const closed = h.toLowerCase() === 'fechado';
                return (
                  <View key={key} style={styles.hoursRow}>
                    {/* Logo da barbearia — igual ao web (BarbershopLanding.tsx) */}
                    <View style={[styles.hoursIconBox, { backgroundColor: closed ? '#1f2937' : primary + '22' }]}>
                      <Image
                        source={shop.logo ? { uri: shop.logo } : DEFAULT_LOGO}
                        style={styles.hoursLogoImg}
                        resizeMode="contain"
                      />
                    </View>
                    <Text style={[styles.hoursDay, closed && { color: '#6b7280' }]}>{label}</Text>
                    {closed
                      ? <Text style={styles.hoursClosed}>Fechado</Text>
                      : <Text style={[styles.hoursTime, { color: '#4ade80' }]}>{h}</Text>
                    }
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ──────────── REDES SOCIAIS ──────────── */}
        {(cfg.instagramUrl || cfg.facebookUrl || cfg.whatsappNumber || cfg.youtubeUrl) && (
          <View style={styles.section}>
            <SectionBadge icon="share-social-outline" label="Redes Sociais" color={primary} />
            <Text style={styles.sectionTitle}>Conecte-se Conosco</Text>
            <Text style={styles.sectionSub}>Siga-nos para novidades e promoções exclusivas</Text>

            <View style={styles.socialRow}>
              {!!cfg.instagramUrl && (
                <TouchableOpacity
                  style={[styles.socialBtn, { backgroundColor: '#c13584' }]}
                  onPress={() => Linking.openURL(cfg.instagramUrl!)}
                >
                  <Ionicons name="logo-instagram" size={28} color="#fff" />
                </TouchableOpacity>
              )}
              {!!cfg.facebookUrl && (
                <TouchableOpacity
                  style={[styles.socialBtn, { backgroundColor: '#1877f2' }]}
                  onPress={() => Linking.openURL(cfg.facebookUrl!)}
                >
                  <Ionicons name="logo-facebook" size={28} color="#fff" />
                </TouchableOpacity>
              )}
              {!!cfg.whatsappNumber && (
                <TouchableOpacity
                  style={[styles.socialBtn, { backgroundColor: '#25d366' }]}
                  onPress={() => openWhatsApp(cfg.whatsappNumber!)}
                >
                  <Ionicons name="logo-whatsapp" size={28} color="#fff" />
                </TouchableOpacity>
              )}
              {!!cfg.youtubeUrl && (
                <TouchableOpacity
                  style={[styles.socialBtn, { backgroundColor: '#ff0000' }]}
                  onPress={() => Linking.openURL(cfg.youtubeUrl!)}
                >
                  <Ionicons name="logo-youtube" size={28} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* ──────────── CTA BOTTOM ──────────── */}
        {cfg.allowOnlineBooking !== false && shop.services?.length > 0 && (
          <View style={styles.ctaOuter}>
            <LinearGradient
              colors={[primary + 'aa', secondary + 'aa', '#1a0a3c']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.ctaSection}
            >
              <Ionicons name="trophy" size={40} color="#f59e0b" />
              <Text style={styles.ctaTitle}>Pronto para uma Transformação?</Text>
              <Text style={styles.ctaSub}>Agende agora e experimente o melhor serviço da região</Text>
              <TouchableOpacity
                style={styles.ctaBtn}
                onPress={() => openBooking(shop.services[0])}
              >
                <Ionicons name="calendar-outline" size={16} color="#ffffff" />
                <Text style={styles.ctaBtnText}>Agendar Agora 🚀</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}

        {/* ──────────── FOOTER (igual ao web) ──────────── */}
        <View style={styles.footer}>
          <View style={styles.footerBrand}>
            <Image
              source={shop.logo ? { uri: shop.logo } : DEFAULT_LOGO}
              style={styles.footerLogo}
              resizeMode="contain"
            />
            <Text style={styles.footerBrandName}>{shop.name}</Text>
          </View>
          {!!shop.phone && (
            <Text style={styles.footerText}>{shop.phone}</Text>
          )}
          {!!(shop.city || shop.state) && (
            <Text style={styles.footerText}>
              {[shop.city, shop.state].filter(Boolean).join(', ')}
            </Text>
          )}
          <View style={styles.footerDivider} />
          <Text style={styles.footerCopy}>
            © {new Date().getFullYear()} BarberFlow. Todos os direitos reservados.
          </Text>
          <Text style={styles.footerPowered}>Powered by BarberFlow ♥</Text>
        </View>

      </ScrollView>

      {/* ──────────── MODAL DE AGENDAMENTO ──────────── */}
      <Modal visible={bookModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>

            {bookOk ? (
              <View style={styles.bookSuccess}>
                <Ionicons name="checkmark-circle" size={64} color="#4ade80" />
                <Text style={styles.bookSuccessTitle}>Agendado! ✓</Text>
                <Text style={styles.bookSuccessText}>Redirecionando para seus agendamentos...</Text>
              </View>
            ) : (
              <>
                {/* Cabeçalho modal */}
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>Novo Agendamento</Text>
                    {!!selService && <Text style={styles.modalSubtitle}>{selService.name}</Text>}
                  </View>
                  <TouchableOpacity onPress={() => setBookModal(false)} style={styles.iconBtn}>
                    <Ionicons name="close" size={24} color="#ffffff" />
                  </TouchableOpacity>
                </View>

                {/* Steps */}
                <View style={styles.stepsRow}>
                  {[1, 2, 3].map(s => (
                    <View key={s} style={styles.stepItem}>
                      <View style={[styles.stepCircle, bookStep >= s && { backgroundColor: primary, borderColor: primary }]}>
                        <Text style={[styles.stepNum, bookStep >= s && { color: '#fff' }]}>
                          {bookStep > s ? '✓' : s}
                        </Text>
                      </View>
                      {s < 3 && <View style={[styles.stepLine, bookStep > s && { backgroundColor: primary }]} />}
                    </View>
                  ))}
                </View>

                {/* Erro */}
                {!!bookError && (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle-outline" size={16} color="#f87171" />
                    <Text style={styles.errorBoxText}>{bookError}</Text>
                  </View>
                )}

                <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>

                  {/* STEP 1 — Barbeiro */}
                  {bookStep === 1 && (
                    <View style={styles.stepContent}>
                      <Text style={styles.stepTitle}>Escolha o Profissional</Text>

                      <TouchableOpacity
                        style={[styles.barberOption, selBarber === '__any__' && { borderColor: primary, backgroundColor: primary + '11' }]}
                        onPress={() => setSelBarber('__any__')}
                      >
                        <View style={[styles.barberOptionAvatar, { backgroundColor: '#374151' }]}>
                          <Ionicons name="people-outline" size={20} color="#9ca3af" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.barberOptionName}>Sem preferência</Text>
                          <Text style={styles.barberOptionRole}>Qualquer profissional disponível</Text>
                        </View>
                        {selBarber === '__any__' && <Ionicons name="checkmark-circle" size={22} color={primary} />}
                      </TouchableOpacity>

                      {barbers.map(b => (
                        <TouchableOpacity
                          key={b.id}
                          style={[styles.barberOption, selBarber === b.id && { borderColor: primary, backgroundColor: primary + '11' }]}
                          onPress={() => setSelBarber(b.id)}
                        >
                          {/* avatar real → logo barbearia → DEFAULT_LOGO */}
                          <View style={[styles.barberOptionAvatar, { backgroundColor: primary + '33', overflow: 'hidden' }]}>
                            <Image
                              source={b.avatar ? { uri: b.avatar } : (shop?.logo ? { uri: shop.logo } : DEFAULT_LOGO)}
                              style={{ width: 44, height: 44, borderRadius: 22 }}
                              resizeMode={b.avatar ? 'cover' : 'contain'}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.barberOptionName}>{b.name}</Text>
                            <Text style={styles.barberOptionRole}>Especialista</Text>
                          </View>
                          {selBarber === b.id && <Ionicons name="checkmark-circle" size={22} color={primary} />}
                        </TouchableOpacity>
                      ))}

                      <TouchableOpacity
                        style={[styles.nextBtn, { backgroundColor: primary }, !selBarber && { opacity: 0.4 }]}
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
                            style={[styles.dayChip, selDate === d.iso && { borderColor: primary, backgroundColor: primary }]}
                            onPress={() => { setSelDate(d.iso); setSelTime(''); }}
                          >
                            <Text style={[styles.dayChipLabel, selDate === d.iso && { color: '#fff' }]}>{d.label}</Text>
                            <Text style={[styles.dayChipNum, selDate === d.iso && { color: '#fff' }]}>{d.sublabel}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                      <View style={styles.stepBtns}>
                        <TouchableOpacity style={styles.backBtn} onPress={() => setBookStep(1)}>
                          <Text style={styles.backBtnText}>Voltar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.nextBtn, { flex: 1, backgroundColor: primary }, !selDate && { opacity: 0.4 }]}
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
                          <ActivityIndicator color={primary} />
                          <Text style={styles.timesLoadingText}>Carregando horários...</Text>
                        </View>
                      ) : times.length === 0 ? (
                        <View style={styles.timesEmpty}>
                          <Ionicons name="time-outline" size={40} color="#6b7280" />
                          <Text style={styles.timesEmptyText}>Nenhum horário disponível</Text>
                          <TouchableOpacity onPress={() => setBookStep(2)}>
                            <Text style={[styles.timesEmptyLink, { color: primary }]}>Escolher outra data</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={styles.timesGrid}>
                          {times.map(t => {
                            const label = new Date(t).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                            return (
                              <TouchableOpacity
                                key={t}
                                style={[styles.timeChip, selTime === t && { borderColor: primary, backgroundColor: primary }]}
                                onPress={() => setSelTime(t)}
                              >
                                <Text style={[styles.timeChipText, selTime === t && { color: '#fff' }]}>{label}</Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}

                      {!!selTime && (
                        <View style={styles.summary}>
                          <Text style={styles.summaryTitle}>Resumo</Text>
                          {[
                            ['Serviço',      selService?.name ?? ''],
                            ['Profissional', selBarber === '__any__' ? (barbers[0]?.name ?? 'Sem preferência') : barbers.find(b => b.id === selBarber)?.name ?? ''],
                            ['Data',         new Date(selDate + 'T12:00:00').toLocaleDateString('pt-BR')],
                            ['Horário',      new Date(selTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })],
                          ].map(([k, v]) => (
                            <View key={k} style={styles.summaryRow}>
                              <Text style={styles.summaryLabel}>{k}</Text>
                              <Text style={styles.summaryValue}>{v}</Text>
                            </View>
                          ))}
                          <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: '#374151', marginTop: 6, paddingTop: 8 }]}>
                            <Text style={styles.summaryLabel}>Total</Text>
                            <Text style={[styles.summaryValue, { color: primary, fontSize: 16, fontWeight: '700' }]}>
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
                          style={[styles.confirmBtn, (!selTime || booking) && { opacity: 0.4 }]}
                          onPress={confirmBooking}
                          disabled={!selTime || booking}
                        >
                          {booking
                            ? <ActivityIndicator color="#fff" size="small" />
                            : <Text style={styles.nextBtnText}>Confirmar ✓</Text>
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

// ─── HeroContent ─────────────────────────────────────────────────────────────

function HeroContent({ shop, cfg, isPremium, primary, onAgendar, onWhatsApp }: {
  shop: BarbershopDetail; cfg: BarbershopConfig;
  isPremium: boolean; primary: string;
  onAgendar: () => void; onWhatsApp: () => void;
}) {
  return (
    <View style={styles.heroContent}>
      {/* Logo */}
      <Image
        source={shop.logo ? { uri: shop.logo } : DEFAULT_LOGO}
        style={styles.heroLogo}
        resizeMode="contain"
      />

      {/* Título */}
      <Text style={styles.heroName}>{cfg.heroTitle || shop.name}</Text>
      <Text style={styles.heroSubtitle}>{cfg.heroSubtitle || 'Seja Bem-Vindo'}</Text>

      {/* Botões CTA */}
      <View style={styles.heroBtns}>
        {cfg.allowOnlineBooking !== false && (
          <TouchableOpacity style={styles.heroAgendarBtn} onPress={onAgendar}>
            <Ionicons name="calendar-outline" size={15} color="#fff" />
            <Text style={styles.heroBtnText}>Agendar Agora</Text>
            <Ionicons name="chevron-forward" size={13} color="#fff" />
          </TouchableOpacity>
        )}
        {!!(cfg.whatsappNumber || shop.phone) && (
          <TouchableOpacity style={styles.heroWaBtn} onPress={onWhatsApp}>
            <Ionicons name="logo-whatsapp" size={15} color="#fff" />
            <Text style={styles.heroBtnText}>WhatsApp</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { icon: 'people' as const,  value: '500+', label: 'Clientes',  bg: '#4338ca' },
          { icon: 'star'  as const,   value: '5.0',  label: 'Avaliação', bg: '#d97706' },
          { icon: 'trophy' as const,  value: '10+',  label: 'Anos',      bg: '#b45309' },
        ].map((s, i) => (
          <View key={i} style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: s.bg }]}>
              <Ionicons name={s.icon} size={20} color="#fff" />
            </View>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── SectionBadge helper ─────────────────────────────────────────────────────

function SectionBadge({ icon, label, color }: { icon: any; label: string; color: string }) {
  return (
    <View style={styles.sectionBadgeRow}>
      <View style={[styles.sectionBadge, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={12} color={color} />
        <Text style={[styles.sectionBadgeText, { color }]}>{label}</Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#000000' },
  centered:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#a78bfa', marginTop: 8 },
  errorText:   { fontSize: 16, color: '#9ca3af' },
  backLink:    { padding: 8 },
  backLinkText:{ color: '#2563eb', fontWeight: '600' },

  // ── Header fixo ───────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#000000aa',
    paddingHorizontal: 14, paddingTop: 52, paddingBottom: 10,
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerVoltar: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
  premiumPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(245,158,11,0.2)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.35)',
  },
  premiumPillText: { fontSize: 11, fontWeight: '700', color: '#f59e0b' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  agendarHeaderBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#10b981', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  agendarHeaderText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: { width: '100%', paddingTop: 100, paddingBottom: 0 },
  heroContent: { alignItems: 'center', paddingHorizontal: 20, paddingBottom: 0, gap: 8 },
  heroLogo: {
    width: 96, height: 96, borderRadius: 48,
    marginVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)',
  },
  heroName:     { fontSize: 26, fontWeight: '900', color: '#ffffff', textAlign: 'center', lineHeight: 32 },
  heroSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.65)', textAlign: 'center' },
  heroBtns: {
    flexDirection: 'row', gap: 10, marginTop: 6,
    flexWrap: 'wrap', justifyContent: 'center',
  },
  heroAgendarBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(15,15,15,0.75)', borderRadius: 10,
    paddingHorizontal: 18, paddingVertical: 11,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  heroWaBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(37,211,102,0.85)', borderRadius: 10,
    paddingHorizontal: 18, paddingVertical: 11,
  },
  heroBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },

  // Stats
  statsRow: {
    flexDirection: 'row', justifyContent: 'center', gap: 24,
    marginTop: 18, paddingBottom: 32,
  },
  statItem:  { alignItems: 'center', gap: 4 },
  statIcon:  { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 22, fontWeight: '900', color: '#ffffff' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.65)' },

  // ── Info Cards Coloridos ───────────────────────────────────────────────────
  infoCardsRow: {
    flexDirection: 'row', gap: 1,
    backgroundColor: '#000000',
  },
  infoCard: {
    flex: 1, padding: 14, gap: 4, minHeight: 110,
    justifyContent: 'flex-start',
  },
  infoIconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  infoCardLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoCardValue: { fontSize: 12, color: '#ffffff', fontWeight: '600', lineHeight: 17 },

  // ── Descrição ─────────────────────────────────────────────────────────────
  descSection: { paddingHorizontal: 16, paddingVertical: 16, backgroundColor: '#0d0d0d' },
  descText: { fontSize: 14, color: '#9ca3af', lineHeight: 22, textAlign: 'center' },

  // ── Sections ──────────────────────────────────────────────────────────────
  section: { paddingHorizontal: 16, paddingVertical: 28 },
  sectionBadgeRow: { alignItems: 'center', marginBottom: 10 },
  sectionBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
  },
  sectionBadgeText: { fontSize: 12, fontWeight: '700' },
  sectionTitle: { fontSize: 24, fontWeight: '900', color: '#ffffff', textAlign: 'center', marginBottom: 4 },
  sectionSub:   { fontSize: 13, color: '#9ca3af', textAlign: 'center' },

  // ── Serviços — grid 2 colunas ─────────────────────────────────────────────
  servicesGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16,
  },
  serviceCard: {
    width: COL_W,
    backgroundColor: '#151b23', borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: '#1f2937',
    gap: 4,
  },
  serviceCardName: { fontSize: 15, fontWeight: '700', color: '#ffffff', flex: 1 },
  serviceCardDesc: { fontSize: 12, color: '#9ca3af', lineHeight: 17 },

  // Linha header do card de serviço: nome + logo
  serviceCardHeader: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', gap: 8, marginBottom: 4,
  },
  serviceLogoBox: {
    width: 52, height: 52, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, overflow: 'hidden',
  },
  serviceLogoImg: { width: 40, height: 40 },
  serviceMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  serviceMetaText: { fontSize: 12, color: '#9ca3af' },
  serviceGuarantee: {
    fontSize: 10, color: '#4ade80', fontWeight: '700',
    backgroundColor: 'rgba(74,222,128,0.1)', borderRadius: 5,
    paddingHorizontal: 5, paddingVertical: 1, marginLeft: 4,
  },
  serviceFromLabel: { fontSize: 11, color: '#9ca3af', marginTop: 6 },
  servicePrice:     { fontSize: 20, fontWeight: '900', marginTop: 0, color: '#ffffff' },
  serviceAgendarBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    borderRadius: 8, paddingVertical: 8, marginTop: 6,
  },
  serviceAgendarText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },

  // ── Equipe ────────────────────────────────────────────────────────────────
  teamRow: { flexDirection: 'row', gap: 12, paddingLeft: 4, paddingRight: 16 },
  teamCard: {
    width: 110, alignItems: 'center', gap: 6,
    backgroundColor: '#151b23', borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: '#1f2937',
  },
  teamAvatarWrapper: { position: 'relative' },
  teamAvatar: {
    width: 60, height: 60, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  teamAvatarImg: { width: 60, height: 60, borderRadius: 30 },
  teamAvatarImgContain: { width: 44, height: 44 },
  teamAvatarText:  { fontSize: 24, fontWeight: '700', color: '#ffffff' },
  teamOnlineBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#10b981',
    borderWidth: 2, borderColor: '#151b23',
    alignItems: 'center', justifyContent: 'center',
  },
  teamName: { fontSize: 13, fontWeight: '700', color: '#ffffff', textAlign: 'center' },
  teamRole: { fontSize: 11, color: '#9ca3af', textAlign: 'center' },
  starsRow: { flexDirection: 'row', gap: 2 },

  // ── Galeria ───────────────────────────────────────────────────────────────
  galleryRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 4 },
  galleryImg:  { width: 160, height: 120, borderRadius: 12 },

  // ── Horários ──────────────────────────────────────────────────────────────
  hoursCard: {
    backgroundColor: '#151b23', borderRadius: 16,
    borderWidth: 1, borderColor: '#1f2937',
    marginTop: 16, overflow: 'hidden',
  },
  hoursRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 13, paddingHorizontal: 14, gap: 10,
    borderBottomWidth: 1, borderBottomColor: '#1f2937',
  },
  hoursIconBox: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  hoursLogoImg: { width: 28, height: 28 },
  hoursDay:    { flex: 1, fontSize: 14, fontWeight: '600', color: '#ffffff' },
  hoursTime:   { fontSize: 14, fontWeight: '700' },
  hoursClosed: { fontSize: 13, color: '#f87171', fontWeight: '600' },

  // ── Redes Sociais ─────────────────────────────────────────────────────────
  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 20 },
  socialBtn: {
    width: 60, height: 60, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center',
  },

  // ── CTA Bottom ────────────────────────────────────────────────────────────
  ctaOuter: { paddingHorizontal: 16, paddingBottom: 8 },
  ctaSection: {
    alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24,
    gap: 10, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  ctaTitle: { fontSize: 22, fontWeight: '900', color: '#ffffff', textAlign: 'center' },
  ctaSub:   { fontSize: 13, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(10,10,10,0.7)',
    paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, marginTop: 6,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  ctaBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    backgroundColor: '#0d0d0d', paddingHorizontal: 24, paddingVertical: 32,
    alignItems: 'center', gap: 6,
    borderTopWidth: 1, borderTopColor: '#1f2937',
  },
  footerBrand:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  footerLogo:      { width: 32, height: 32, borderRadius: 16 },
  footerBrandName: { fontSize: 16, fontWeight: '700', color: '#ffffff' },
  footerText:      { fontSize: 13, color: '#9ca3af' },
  footerDivider:   { height: 1, backgroundColor: '#1f2937', width: '100%', marginVertical: 8 },
  footerCopy:      { fontSize: 12, color: '#6b7280', textAlign: 'center' },
  footerPowered:   { fontSize: 11, color: '#6b7280' },

  // ── Modal ─────────────────────────────────────────────────────────────────
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: '#151b23', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    height: '88%', paddingBottom: 32, flex: 1,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#1f2937',
  },
  modalTitle:    { fontSize: 18, fontWeight: '700', color: '#ffffff' },
  modalSubtitle: { fontSize: 13, color: '#9ca3af', marginTop: 2 },

  stepsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14,
  },
  stepItem:   { flexDirection: 'row', alignItems: 'center' },
  stepCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#1f2937', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#1f2937',
  },
  stepNum:  { fontSize: 13, fontWeight: '700', color: '#9ca3af' },
  stepLine: { width: 48, height: 2, backgroundColor: '#1f2937' },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(239,68,68,0.1)', marginHorizontal: 16,
    borderRadius: 10, padding: 12, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
  },
  errorBoxText: { fontSize: 13, color: '#f87171', flex: 1 },

  stepContent: { padding: 16, gap: 12 },
  stepTitle:   { fontSize: 16, fontWeight: '700', color: '#ffffff', marginBottom: 4 },

  barberOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#1f2937', borderRadius: 12,
    padding: 14, borderWidth: 2, borderColor: '#1f2937',
  },
  barberOptionAvatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  barberOptionAvatarText: { fontSize: 18, fontWeight: '700', color: '#ffffff' },
  barberOptionName:       { fontSize: 15, fontWeight: '700', color: '#ffffff' },
  barberOptionRole:       { fontSize: 12, color: '#9ca3af' },

  daysScroll: { marginVertical: 8 },
  dayChip: {
    alignItems: 'center', marginRight: 10,
    backgroundColor: '#1f2937', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 2, borderColor: '#1f2937', minWidth: 56,
  },
  dayChipLabel: { fontSize: 11, fontWeight: '600', color: '#9ca3af' },
  dayChipNum:   { fontSize: 18, fontWeight: '700', color: '#ffffff', marginTop: 2 },

  timesLoading:     { alignItems: 'center', paddingVertical: 28, gap: 8 },
  timesLoadingText: { fontSize: 14, color: '#9ca3af' },
  timesEmpty:       { alignItems: 'center', paddingVertical: 28, gap: 8 },
  timesEmptyText:   { fontSize: 15, color: '#9ca3af' },
  timesEmptyLink:   { fontWeight: '600', fontSize: 14 },
  timesGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  timeChip: {
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: '#1f2937', borderRadius: 10, borderWidth: 2, borderColor: '#1f2937',
  },
  timeChipText: { fontSize: 14, fontWeight: '600', color: '#ffffff' },

  summary: {
    backgroundColor: '#1f2937', borderRadius: 12,
    padding: 14, marginTop: 8, borderWidth: 1, borderColor: '#374151',
  },
  summaryTitle: { fontSize: 14, fontWeight: '700', color: '#ffffff', marginBottom: 10 },
  summaryRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  summaryLabel: { fontSize: 13, color: '#9ca3af' },
  summaryValue: { fontSize: 13, fontWeight: '600', color: '#ffffff' },

  stepBtns: { flexDirection: 'row', gap: 10, marginTop: 8 },
  backBtn: {
    backgroundColor: '#1f2937', borderRadius: 10,
    paddingVertical: 14, paddingHorizontal: 20, alignItems: 'center',
  },
  backBtnText: { fontWeight: '700', color: '#9ca3af', fontSize: 15 },
  nextBtn: {
    flex: 1, borderRadius: 10,
    paddingVertical: 14, alignItems: 'center',
  },
  nextBtnText:  { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  confirmBtn:   { flex: 1, backgroundColor: '#4ade80', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },

  bookSuccess: {
    alignItems: 'center', justifyContent: 'center', padding: 48, gap: 12,
  },
  bookSuccessTitle: { fontSize: 24, fontWeight: '700', color: '#4ade80' },
  bookSuccessText:  { fontSize: 14, color: '#9ca3af' },
});