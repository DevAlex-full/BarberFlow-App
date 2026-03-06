import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert, Switch, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '@/lib/api';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/colors';

// ─── Tipos (espelham landing-page/page.tsx do web) ────────────────────────────

interface ConfigData {
  heroImage:          string;
  heroTitle:          string;
  heroSubtitle:       string;
  description:        string;
  galleryImages:      string[];
  businessHours:      Record<string, string>;
  instagramUrl:       string;
  facebookUrl:        string;
  whatsappNumber:     string;
  youtubeUrl:         string;
  primaryColor:       string;
  secondaryColor:     string;
  showTeam:           boolean;
  showGallery:        boolean;
  showReviews:        boolean;
  allowOnlineBooking: boolean;
}

interface BarberUser {
  id:     string;
  name:   string;
  role:   string;
  active: boolean;
  email:  string;
  avatar: string | null;
}

type ActiveTab = 'hero' | 'about' | 'gallery' | 'hours' | 'social' | 'design' | 'team' | 'features';

const DAYS: Record<string, string> = {
  monday:    'Segunda-feira',
  tuesday:   'Terça-feira',
  wednesday: 'Quarta-feira',
  thursday:  'Quinta-feira',
  friday:    'Sexta-feira',
  saturday:  'Sábado',
  sunday:    'Domingo',
};

const TABS: { key: ActiveTab; label: string; icon: string; color: string }[] = [
  { key: 'hero',     label: 'Hero/Banner',   icon: 'image',          color: '#3b82f6' },
  { key: 'about',    label: 'Sobre',          icon: 'information-circle', color: '#8b5cf6' },
  { key: 'gallery',  label: 'Galeria',        icon: 'images',         color: '#ec4899' },
  { key: 'hours',    label: 'Horários',       icon: 'time',           color: '#10b981' },
  { key: 'social',   label: 'Redes Sociais',  icon: 'share-social',   color: '#f59e0b' },
  { key: 'design',   label: 'Design',         icon: 'color-palette',  color: '#ef4444' },
  { key: 'team',     label: 'Equipe',         icon: 'people',         color: '#06b6d4' },
  { key: 'features', label: 'Funcionalidades', icon: 'settings',      color: '#6366f1' },
];

const DEFAULT_CONFIG: ConfigData = {
  heroImage: '', heroTitle: '', heroSubtitle: '', description: '',
  galleryImages: [],
  businessHours: {
    monday: '09:00-20:00', tuesday: '09:00-20:00', wednesday: '09:00-20:00',
    thursday: '09:00-20:00', friday: '09:00-20:00', saturday: '09:00-18:00',
    sunday: 'Fechado',
  },
  instagramUrl: '', facebookUrl: '', whatsappNumber: '', youtubeUrl: '',
  primaryColor: '#2563eb', secondaryColor: '#7c3aed',
  showTeam: true, showGallery: true, showReviews: true, allowOnlineBooking: true,
};

export default function LandingPageScreen() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('hero');
  const [config,    setConfig]    = useState<ConfigData>(DEFAULT_CONFIG);
  const [users,     setUsers]     = useState<BarberUser[]>([]);
  const [barbershop, setBarbershop] = useState<any>(null);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      // ✅ GET /barbershop/config  (web usa fetch direto)
      const [configRes, shopRes, usersRes] = await Promise.all([
        api.get('/barbershop/config'),
        api.get('/barbershop'),
        api.get('/users'),
      ]);
      setConfig({ ...DEFAULT_CONFIG, ...configRes.data });
      setBarbershop(shopRes.data);
      setUsers(usersRes.data || []);
    } catch (e) {
      console.error('Erro ao carregar landing page:', e);
    } finally {
      setLoading(false);
    }
  }

  // ── Salvar configuração ─────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    try {
      // ✅ PUT /barbershop/config  (web usa fetch direto)
      await api.put('/barbershop/config', config);
      Alert.alert('✅ Salvo!', 'Configurações da landing page salvas com sucesso!');
    } catch (e: any) {
      Alert.alert('Erro', e.response?.data?.error || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  // ── Upload de imagem ────────────────────────────────────────────────────────
  async function pickAndUpload(type: 'hero' | 'gallery' | 'logo') {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    setUploading(true);
    try {
      const asset = result.assets[0];
      const form  = new FormData();
      if (type === 'logo') {
        // ✅ POST /upload/barbershop-logo
        form.append('logo', { uri: asset.uri, type: 'image/jpeg', name: 'logo.jpg' } as any);
        const res = await api.post('/upload/barbershop-logo', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setBarbershop((prev: any) => ({ ...prev, logo: res.data.logoUrl }));
        Alert.alert('✅ Logo atualizado!');
      } else {
        // ✅ POST /upload
        form.append('image', { uri: asset.uri, type: 'image/jpeg', name: 'image.jpg' } as any);
        const res = await api.post('/upload', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (type === 'hero') {
          setConfig(p => ({ ...p, heroImage: res.data.url }));
        } else {
          setConfig(p => ({ ...p, galleryImages: [...p.galleryImages, res.data.url] }));
        }
        Alert.alert('✅ Imagem enviada!');
      }
    } catch (e: any) {
      Alert.alert('Erro', e.response?.data?.error || 'Erro ao enviar imagem');
    } finally {
      setUploading(false);
    }
  }

  async function pickAndUploadAvatar(userId: string) {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const form  = new FormData();
    // ✅ POST /upload/user-avatar/{userId}
    form.append('avatar', { uri: asset.uri, type: 'image/jpeg', name: 'avatar.jpg' } as any);
    try {
      const res = await api.post(`/upload/user-avatar/${userId}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, avatar: res.data.avatarUrl } : u));
      Alert.alert('✅ Avatar atualizado!');
    } catch (e: any) {
      Alert.alert('Erro', 'Erro ao enviar avatar');
    }
  }

  // ── Toggle usuário ──────────────────────────────────────────────────────────
  async function handleToggleUser(id: string) {
    try {
      // ✅ PATCH /users/{id}/toggle
      await api.patch(`/users/${id}/toggle`);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, active: !u.active } : u));
    } catch (e: any) {
      Alert.alert('Erro', e.response?.data?.error || 'Erro ao alterar status');
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  const currentTab = TABS.find(t => t.key === activeTab)!;

  return (
    <View style={styles.root}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={[styles.topBarIcon, { backgroundColor: currentTab.color }]}>
            <Ionicons name="sparkles" size={18} color={Colors.white} />
          </View>
          <View>
            <Text style={styles.topBarTitle}>Personalizar Landing Page</Text>
            <Text style={styles.topBarSub}>Configure sua presença digital</Text>
          </View>
        </View>
        <TouchableOpacity style={[styles.saveBtn, saving && styles.btnDisabled]}
          onPress={handleSave} disabled={saving}>
          {saving
            ? <ActivityIndicator color={Colors.white} size="small" />
            : <Ionicons name="save" size={18} color={Colors.white} />}
          <Text style={styles.saveBtnText}>{saving ? 'Salvando...' : 'Salvar'}</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={styles.tabBar} contentContainerStyle={styles.tabBarContent}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key}
            style={[styles.tabBtn, activeTab === t.key && { borderBottomColor: t.color, borderBottomWidth: 3 }]}
            onPress={() => setActiveTab(t.key)}>
            <Ionicons name={t.icon as any} size={16}
              color={activeTab === t.key ? t.color : Colors.gray[400]} />
            <Text style={[styles.tabBtnText, activeTab === t.key && { color: t.color }]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView style={styles.contentArea} contentContainerStyle={styles.contentPad}
        showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ─── HERO ─────────────────────────────────────────────────────── */}
        {activeTab === 'hero' && (
          <View style={styles.tabContent}>
            <SectionHeader icon="image" color="#3b82f6" title="Hero/Banner Principal"
              sub="A primeira impressão é a que fica!" />

            <View style={styles.field}>
              <Text style={styles.label}>Imagem de Fundo</Text>
              {config.heroImage ? (
                <View style={styles.imagePreview}>
                  <Image source={{ uri: config.heroImage }} style={styles.heroImg} />
                  <TouchableOpacity style={styles.removeImgBtn}
                    onPress={() => setConfig(p => ({ ...p, heroImage: '' }))}>
                    <Ionicons name="close-circle" size={24} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.uploadBox}
                  onPress={() => pickAndUpload('hero')} disabled={uploading}>
                  {uploading
                    ? <ActivityIndicator color={Colors.primary} />
                    : <>
                        <Ionicons name="cloud-upload-outline" size={32} color={Colors.gray[400]} />
                        <Text style={styles.uploadText}>Toque para selecionar imagem</Text>
                        <Text style={styles.uploadSub}>PNG, JPG até 5MB • 1920x1080px</Text>
                      </>}
                </TouchableOpacity>
              )}
            </View>

            <Field label="Título Principal"
              value={config.heroTitle}
              placeholder="Ex: Bem-vindo à Barbearia Premium"
              onChange={v => setConfig(p => ({ ...p, heroTitle: v }))} />

            <Field label="Subtítulo"
              value={config.heroSubtitle}
              placeholder="Ex: Onde estilo encontra tradição"
              onChange={v => setConfig(p => ({ ...p, heroSubtitle: v }))} />
          </View>
        )}

        {/* ─── SOBRE ─────────────────────────────────────────────────────── */}
        {activeTab === 'about' && (
          <View style={styles.tabContent}>
            <SectionHeader icon="information-circle" color="#8b5cf6" title="Sobre a Barbearia"
              sub="Conte sua história e conecte-se com clientes" />
            <View style={styles.field}>
              <Text style={styles.label}>Descrição Completa</Text>
              <TextInput style={[styles.input, styles.textArea]} value={config.description}
                onChangeText={v => setConfig(p => ({ ...p, description: v }))}
                placeholder="Conte a história da sua barbearia, diferenciais, valores..."
                placeholderTextColor={Colors.gray[400]} multiline numberOfLines={8}
                textAlignVertical="top" />
              <Text style={styles.charCount}>{config.description.length} caracteres</Text>
            </View>
          </View>
        )}

        {/* ─── GALERIA ────────────────────────────────────────────────────── */}
        {activeTab === 'gallery' && (
          <View style={styles.tabContent}>
            <SectionHeader icon="images" color="#ec4899" title="Galeria de Fotos"
              sub="Mostre seu ambiente, trabalhos e equipe" />
            <View style={styles.galleryGrid}>
              {config.galleryImages.map((img, i) => (
                <View key={i} style={styles.galleryItem}>
                  <Image source={{ uri: img }} style={styles.galleryImg} />
                  <TouchableOpacity style={styles.removeGalleryBtn}
                    onPress={() => setConfig(p => ({ ...p, galleryImages: p.galleryImages.filter((_, j) => j !== i) }))}>
                    <Ionicons name="close-circle" size={22} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
              {config.galleryImages.length < 12 && (
                <TouchableOpacity style={styles.addGalleryBtn}
                  onPress={() => pickAndUpload('gallery')} disabled={uploading}>
                  {uploading
                    ? <ActivityIndicator color={Colors.primary} />
                    : <>
                        <Ionicons name="add" size={28} color={Colors.gray[400]} />
                        <Text style={styles.addGalleryText}>Adicionar</Text>
                      </>}
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* ─── HORÁRIOS ────────────────────────────────────────────────────── */}
        {activeTab === 'hours' && (
          <View style={styles.tabContent}>
            <SectionHeader icon="time" color="#10b981" title="Horário de Funcionamento"
              sub="Deixe claro quando você está disponível" />
            {Object.entries(config.businessHours).map(([day, hours]) => (
              <View key={day} style={styles.hoursRow}>
                <Text style={styles.dayLabel}>{DAYS[day] || day}</Text>
                <TextInput style={[styles.input, styles.hoursInput]} value={hours}
                  onChangeText={v => setConfig(p => ({ ...p, businessHours: { ...p.businessHours, [day]: v } }))}
                  placeholder="09:00-20:00 ou Fechado"
                  placeholderTextColor={Colors.gray[400]} />
              </View>
            ))}
            <View style={styles.tipBox}>
              <Ionicons name="bulb" size={16} color="#10b981" />
              <Text style={styles.tipText}>
                Use "HH:MM-HH:MM" (ex: 09:00-20:00) ou "Fechado" para dias sem atendimento.
              </Text>
            </View>
          </View>
        )}

        {/* ─── REDES SOCIAIS ───────────────────────────────────────────────── */}
        {activeTab === 'social' && (
          <View style={styles.tabContent}>
            <SectionHeader icon="share-social" color="#f59e0b" title="Redes Sociais"
              sub="Conecte suas redes e amplie seu alcance" />

            {[
              { key: 'instagramUrl',   label: 'Instagram',   icon: 'logo-instagram', color: '#e1306c', ph: 'https://instagram.com/suabarbearia' },
              { key: 'facebookUrl',    label: 'Facebook',    icon: 'logo-facebook',  color: '#1877f2', ph: 'https://facebook.com/suabarbearia' },
              { key: 'whatsappNumber', label: 'WhatsApp',    icon: 'logo-whatsapp',  color: '#25d366', ph: '+55 11 99999-9999' },
              { key: 'youtubeUrl',     label: 'YouTube',     icon: 'logo-youtube',   color: '#ff0000', ph: 'https://youtube.com/@suabarbearia' },
            ].map(s => (
              <View key={s.key} style={styles.field}>
                <View style={styles.socialLabelRow}>
                  <View style={[styles.socialIcon, { backgroundColor: s.color }]}>
                    <Ionicons name={s.icon as any} size={16} color={Colors.white} />
                  </View>
                  <Text style={styles.label}>{s.label}</Text>
                </View>
                <TextInput style={styles.input}
                  value={(config as any)[s.key] || ''}
                  onChangeText={v => setConfig(p => ({ ...p, [s.key]: v }))}
                  placeholder={s.ph} placeholderTextColor={Colors.gray[400]}
                  autoCapitalize="none" keyboardType="url" />
              </View>
            ))}
          </View>
        )}

        {/* ─── DESIGN ──────────────────────────────────────────────────────── */}
        {activeTab === 'design' && (
          <View style={styles.tabContent}>
            <SectionHeader icon="color-palette" color="#ef4444" title="Personalização Visual"
              sub="Logo e cores da sua identidade visual" />

            {/* Logo */}
            <View style={styles.field}>
              <Text style={styles.label}>Logo da Barbearia</Text>
              {barbershop?.logo ? (
                <View style={styles.logoContainer}>
                  <Image source={{ uri: barbershop.logo }} style={styles.logoImg} />
                  <TouchableOpacity style={styles.changeLogoBtn}
                    onPress={() => pickAndUpload('logo')} disabled={uploading}>
                    <Text style={styles.changeLogoBtnText}>
                      {uploading ? 'Enviando...' : 'Trocar Logo'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.uploadBox}
                  onPress={() => pickAndUpload('logo')} disabled={uploading}>
                  {uploading
                    ? <ActivityIndicator color={Colors.primary} />
                    : <>
                        <Ionicons name="image-outline" size={32} color={Colors.gray[400]} />
                        <Text style={styles.uploadText}>Toque para enviar o logo</Text>
                        <Text style={styles.uploadSub}>PNG, JPG até 5MB • 512x512px</Text>
                      </>}
                </TouchableOpacity>
              )}
            </View>

            {/* Cores */}
            <ColorField label="Cor Principal" value={config.primaryColor}
              onChange={v => setConfig(p => ({ ...p, primaryColor: v }))} />
            <ColorField label="Cor Secundária" value={config.secondaryColor}
              onChange={v => setConfig(p => ({ ...p, secondaryColor: v }))} />

            {/* Preview */}
            <View style={styles.colorPreview}>
              <Text style={styles.previewLabel}>Preview</Text>
              <View style={[styles.previewBtn, { backgroundColor: config.primaryColor }]}>
                <Text style={{ color: Colors.white, fontWeight: '700' }}>Botão Principal</Text>
              </View>
              <View style={[styles.previewGradient, {
                backgroundColor: config.primaryColor,
                borderRightColor: config.secondaryColor,
              }]}>
                <Text style={{ color: Colors.white, fontWeight: '700' }}>Gradiente Hero</Text>
              </View>
            </View>
          </View>
        )}

        {/* ─── EQUIPE ──────────────────────────────────────────────────────── */}
        {activeTab === 'team' && (
          <View style={styles.tabContent}>
            <SectionHeader icon="people" color="#06b6d4" title="Gerenciar Profissionais"
              sub="Equipe exibida na landing page" />

            {users.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="people-outline" size={48} color={Colors.gray[300]} />
                <Text style={styles.emptyText}>Nenhum profissional cadastrado</Text>
              </View>
            ) : (
              users.map(user => (
                <View key={user.id} style={[styles.userCard, !user.active && { opacity: 0.6 }]}>
                  <View style={styles.userAvatarBox}>
                    {user.avatar
                      ? <Image source={{ uri: user.avatar }} style={styles.userAvatar} />
                      : <View style={styles.userAvatarPlaceholder}>
                          <Text style={styles.userAvatarInitial}>
                            {user.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    <View style={styles.userBadgeRow}>
                      <View style={[styles.userBadge, { backgroundColor: user.role === 'admin' ? '#ede9fe' : '#e0f2fe' }]}>
                        <Text style={[styles.userBadgeText, { color: user.role === 'admin' ? '#7c3aed' : '#0369a1' }]}>
                          {user.role === 'admin' ? 'Admin' : 'Barbeiro'}
                        </Text>
                      </View>
                      <View style={[styles.userBadge, { backgroundColor: user.active ? Colors.successBg : Colors.errorBg }]}>
                        <Text style={[styles.userBadgeText, { color: user.active ? Colors.success : Colors.error }]}>
                          {user.active ? 'Ativo' : 'Inativo'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.userActions}>
                    <TouchableOpacity style={styles.avatarUploadBtn}
                      onPress={() => pickAndUploadAvatar(user.id)}>
                      <Ionicons name="camera" size={16} color={Colors.white} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.toggleUserBtn}
                      onPress={() => handleToggleUser(user.id)}>
                      <Ionicons
                        name={user.active ? 'pause-circle' : 'play-circle'}
                        size={20} color={user.active ? Colors.warning : Colors.success} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ─── FUNCIONALIDADES ─────────────────────────────────────────────── */}
        {activeTab === 'features' && (
          <View style={styles.tabContent}>
            <SectionHeader icon="settings" color="#6366f1" title="Funcionalidades"
              sub="Controle o que aparece na sua página" />

            {[
              { key: 'allowOnlineBooking', label: 'Agendamento Online',  sub: 'Clientes podem agendar pela página',         icon: 'globe',  color: '#3b82f6' },
              { key: 'showGallery',        label: 'Galeria de Fotos',    sub: 'Exibir galeria de fotos na página',           icon: 'images', color: '#ec4899' },
              { key: 'showTeam',           label: 'Mostrar Equipe',      sub: 'Exibir profissionais na página',              icon: 'people', color: '#10b981' },
              { key: 'showReviews',        label: 'Mostrar Avaliações',  sub: 'Exibir avaliações de clientes na página',     icon: 'star',   color: '#f59e0b' },
            ].map(f => (
              <View key={f.key} style={styles.featureRow}>
                <View style={[styles.featureIcon, { backgroundColor: f.color + '20' }]}>
                  <Ionicons name={f.icon as any} size={22} color={f.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureLabel}>{f.label}</Text>
                  <Text style={styles.featureSub}>{f.sub}</Text>
                </View>
                <Switch
                  value={(config as any)[f.key]}
                  onValueChange={v => setConfig(p => ({ ...p, [f.key]: v }))}
                  trackColor={{ true: f.color }}
                  thumbColor={Colors.white}
                />
              </View>
            ))}

            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={18} color="#6366f1" />
              <Text style={styles.infoText}>
                Se desabilitar o agendamento online, os clientes verão um botão para entrar em contato por WhatsApp.
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

// ─── Sub-componentes reutilizáveis ────────────────────────────────────────────

function SectionHeader({ icon, color, title, sub }: { icon: string; color: string; title: string; sub: string }) {
  return (
    <View style={sh.header}>
      <View style={[sh.icon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={22} color={color} />
      </View>
      <View>
        <Text style={sh.title}>{title}</Text>
        <Text style={sh.sub}>{sub}</Text>
      </View>
    </View>
  );
}
const sh = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: Spacing.md },
  icon:   { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title:  { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  sub:    { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
});

function Field({ label, value, placeholder, onChange }: { label: string; value: string; placeholder: string; onChange: (v: string) => void }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} value={value} onChangeText={onChange}
        placeholder={placeholder} placeholderTextColor={Colors.gray[400]} />
    </View>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.colorRow}>
        <View style={[styles.colorSwatch, { backgroundColor: value }]} />
        <TextInput style={[styles.input, { flex: 1 }]} value={value}
          onChangeText={onChange} placeholder="#000000"
          placeholderTextColor={Colors.gray[400]} autoCapitalize="none" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: Colors.background },
  centered:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText:  { fontSize: 14, color: Colors.textSecondary },
  // Top bar
  topBar:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  topBarLeft:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  topBarIcon:   { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  topBarTitle:  { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  topBarSub:    { fontSize: 11, color: Colors.textSecondary },
  saveBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 9, borderRadius: BorderRadius.md },
  saveBtnText:  { color: Colors.white, fontWeight: '700', fontSize: 14 },
  btnDisabled:  { opacity: 0.6 },
  // Tab bar
  tabBar:       { backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border, maxHeight: 50 },
  tabBarContent: { paddingHorizontal: 8 },
  tabBtn:       { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 13, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabBtnText:   { fontSize: 12, fontWeight: '700', color: Colors.gray[400] },
  // Content
  contentArea:  { flex: 1 },
  contentPad:   { padding: Spacing.md },
  tabContent:   { gap: 4 },
  // Fields
  field:        { marginBottom: Spacing.sm },
  label:        { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 },
  input:        { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.textPrimary },
  textArea:     { minHeight: 120, textAlignVertical: 'top' },
  charCount:    { fontSize: 11, color: Colors.textMuted, marginTop: 4, textAlign: 'right' },
  // Upload
  uploadBox:    { backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed', borderRadius: BorderRadius.lg, padding: 32, alignItems: 'center', gap: 8 },
  uploadText:   { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  uploadSub:    { fontSize: 12, color: Colors.textMuted },
  imagePreview: { position: 'relative' },
  heroImg:      { width: '100%', height: 180, borderRadius: BorderRadius.lg, resizeMode: 'cover' },
  removeImgBtn: { position: 'absolute', top: 8, right: 8 },
  // Gallery
  galleryGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  galleryItem:  { width: '30%', aspectRatio: 1, position: 'relative' },
  galleryImg:   { width: '100%', height: '100%', borderRadius: BorderRadius.md, resizeMode: 'cover' },
  removeGalleryBtn: { position: 'absolute', top: 4, right: 4 },
  addGalleryBtn: { width: '30%', aspectRatio: 1, backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed', borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center', gap: 4 },
  addGalleryText: { fontSize: 11, fontWeight: '600', color: Colors.textMuted },
  // Hours
  hoursRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  dayLabel:     { width: 100, fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  hoursInput:   { flex: 1, paddingVertical: 10 },
  tipBox:       { flexDirection: 'row', gap: 8, backgroundColor: '#f0fdf4', borderRadius: BorderRadius.md, padding: 12, marginTop: 4, borderWidth: 1, borderColor: '#bbf7d0' },
  tipText:      { flex: 1, fontSize: 12, color: '#166534' },
  // Social
  socialLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  socialIcon:   { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  // Design
  logoContainer: { alignItems: 'center', gap: 12 },
  logoImg:      { width: 120, height: 120, borderRadius: 16, resizeMode: 'contain', borderWidth: 2, borderColor: Colors.border },
  changeLogoBtn: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 8, borderRadius: BorderRadius.md },
  changeLogoBtnText: { color: Colors.white, fontWeight: '700' },
  colorRow:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  colorSwatch:  { width: 44, height: 44, borderRadius: 10, borderWidth: 2, borderColor: Colors.border },
  colorPreview: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: 10, marginTop: 4 },
  previewLabel: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  previewBtn:   { borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  previewGradient: { borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  // Team
  userCard:     { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: 14, marginBottom: 8, ...Shadow.sm, borderWidth: 1, borderColor: Colors.border },
  userAvatarBox: { width: 52, height: 52, borderRadius: 26, overflow: 'hidden' },
  userAvatar:   { width: '100%', height: '100%' },
  userAvatarPlaceholder: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  userAvatarInitial: { fontSize: 22, fontWeight: '700', color: Colors.white },
  userName:     { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  userEmail:    { fontSize: 12, color: Colors.textSecondary },
  userBadgeRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  userBadge:    { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  userBadgeText: { fontSize: 11, fontWeight: '700' },
  userActions:  { flexDirection: 'column', alignItems: 'center', gap: 8 },
  avatarUploadBtn: { backgroundColor: Colors.primary, padding: 8, borderRadius: 8 },
  toggleUserBtn: { padding: 4 },
  // Features
  featureRow:   { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: 8, ...Shadow.sm, borderWidth: 1, borderColor: Colors.border },
  featureIcon:  { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  featureLabel: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  featureSub:   { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  infoBox:      { flexDirection: 'row', gap: 8, backgroundColor: '#eef2ff', borderRadius: BorderRadius.md, padding: 12, marginTop: 4, borderWidth: 1, borderColor: '#c7d2fe' },
  infoText:     { flex: 1, fontSize: 12, color: '#4338ca', lineHeight: 17 },
  emptyBox:     { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyText:    { fontSize: 14, color: Colors.textSecondary },
});