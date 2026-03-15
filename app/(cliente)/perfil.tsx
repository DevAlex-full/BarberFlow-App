import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import clientApi from '@/lib/client-api';
import { useAuthStore } from '@/stores/authStore';

type PhoneStep = 'idle' | 'entering' | 'sent' | 'verified';

export default function ClientePerfilScreen() {
  const { clientSignOut } = useAuthStore();
  const [userData,   setUserData]   = useState<any>(null);
  const [loading,    setLoading]    = useState(true);

  // ── Nome (regra 30 dias) ──────────────────────────────────────────────────
  const [editingName,     setEditingName]     = useState(false);
  const [name,            setName]            = useState('');
  const [savingName,      setSavingName]      = useState(false);
  const [nameBlockedDays, setNameBlockedDays] = useState<number | null>(null);

  // ── Telefone OTP ──────────────────────────────────────────────────────────
  const [phoneStep,    setPhoneStep]    = useState<PhoneStep>('idle');
  const [phone,        setPhone]        = useState('');
  const [otp,          setOtp]          = useState('');
  const [sendingOtp,   setSendingOtp]   = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // ── Notificações (local) ──────────────────────────────────────────────────
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifSms,   setNotifSms]   = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await clientApi.get('/client/auth/me');
      const d   = res.data;
      setUserData(d);
      setName(d.name || '');

      const rawPhone = d.phone || '';
      setPhone(rawPhone.includes('@') ? '' : rawPhone);

      // Calcula bloqueio de nome (30 dias)
      if (d.nameChangedAt) {
        const daysSince =
          (Date.now() - new Date(d.nameChangedAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince < 30) setNameBlockedDays(Math.ceil(30 - daysSince));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // ── Salvar Nome ───────────────────────────────────────────────────────────
  async function handleSaveName() {
    if (!name.trim()) {
      Alert.alert('Atenção', 'O nome não pode estar vazio.');
      return;
    }
    setSavingName(true);
    try {
      const res = await clientApi.put('/client/auth/profile', { name: name.trim() });
      setUserData((prev: any) => ({
        ...prev,
        name: res.data.name,
        nameChangedAt: res.data.nameChangedAt,
      }));
      setEditingName(false);
      setNameBlockedDays(30);
      Alert.alert('✅ Sucesso', 'Nome atualizado com sucesso!');
    } catch (e: any) {
      const msg = e.response?.data?.error || 'Não foi possível salvar o nome.';
      Alert.alert('Erro', msg);
    } finally {
      setSavingName(false);
    }
  }

  // ── Enviar OTP por SMS ────────────────────────────────────────────────────
  async function handleRequestOtp() {
    const clean = phone.replace(/\D/g, '');
    if (clean.length < 10 || clean.length > 11) {
      Alert.alert('Atenção', 'Digite um número válido com DDD.\nEx: 11987654321');
      return;
    }
    setSendingOtp(true);
    try {
      await clientApi.post('/client/auth/request-phone-verification', { phone: clean });
      setPhoneStep('sent');
      Alert.alert('📱 SMS Enviado', `Código enviado para ${phone}.\nVálido por 15 minutos.`);
    } catch (e: any) {
      Alert.alert('Erro', e.response?.data?.error || 'Não foi possível enviar o SMS.');
    } finally {
      setSendingOtp(false);
    }
  }

  // ── Verificar OTP e salvar telefone ───────────────────────────────────────
  async function handleVerifyOtp() {
    if (otp.length !== 6) {
      Alert.alert('Atenção', 'Digite o código de 6 dígitos.');
      return;
    }
    setVerifyingOtp(true);
    try {
      const clean = phone.replace(/\D/g, '');
      const res   = await clientApi.post('/client/auth/verify-phone', { phone: clean, otp });
      setUserData((prev: any) => ({
        ...prev,
        phone: res.data.phone,
        phoneVerified: true,
      }));
      setPhone(res.data.phone || '');
      setOtp('');
      setPhoneStep('verified');
      Alert.alert('✅ Sucesso', 'Número de telefone verificado e salvo!');
    } catch (e: any) {
      Alert.alert('Erro', e.response?.data?.error || 'Código inválido ou expirado.');
    } finally {
      setVerifyingOtp(false);
    }
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  async function handleSignOut() {
    Alert.alert('Sair', 'Deseja realmente sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await clientSignOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const hasPhone = !!userData?.phone && !userData.phone.includes('@');

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Meu Perfil</Text>
      </View>

      {/* ── Avatar ── */}
      <View style={s.avatarSection}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>
            {(userData?.name || 'C').charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={s.avatarName}>{userData?.name}</Text>
        <Text style={s.avatarEmail}>{userData?.email}</Text>
        {userData?.phoneVerified && (
          <View style={s.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={12} color="#4ade80" />
            <Text style={s.verifiedBadgeText}>Telefone verificado</Text>
          </View>
        )}
      </View>

      {/* ── Dados Pessoais ── */}
      <View style={s.card}>
        <View style={s.cardHeader}>
          <Ionicons name="person-outline" size={20} color="#2563eb" />
          <Text style={s.cardTitle}>Dados Pessoais</Text>
        </View>

        {/* NOME */}
        <View style={s.field}>
          <View style={s.labelRow}>
            <Text style={s.label}>Nome</Text>

            {!!nameBlockedDays && (
              <View style={s.badgeLocked}>
                <Ionicons name="lock-closed-outline" size={10} color="#f59e0b" />
                <Text style={s.badgeLockedText}>Disponível em {nameBlockedDays}d</Text>
              </View>
            )}

            {!editingName && !nameBlockedDays && (
              <TouchableOpacity style={s.inlineEdit} onPress={() => setEditingName(true)}>
                <Ionicons name="pencil-outline" size={13} color="#2563eb" />
                <Text style={s.inlineEditText}>Editar</Text>
              </TouchableOpacity>
            )}
          </View>

          <TextInput
            style={[s.input, (!editingName || !!nameBlockedDays) && s.inputDisabled]}
            value={name}
            onChangeText={setName}
            placeholder="Seu nome"
            placeholderTextColor="#9ca3af"
            editable={editingName && !nameBlockedDays}
            autoCorrect={false}
          />

          {!!nameBlockedDays && (
            <Text style={s.hint}>
              ⏳ Nome pode ser alterado a cada 30 dias. Próxima troca em {nameBlockedDays} dia(s).
            </Text>
          )}

          {editingName && !nameBlockedDays && (
            <View style={s.actionRow}>
              <TouchableOpacity
                style={s.cancelBtn}
                onPress={() => { setName(userData?.name || ''); setEditingName(false); }}
              >
                <Text style={s.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.saveBtn, savingName && s.disabled]}
                onPress={handleSaveName}
                disabled={savingName}
              >
                {savingName
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={s.saveBtnText}>Salvar Nome</Text>
                }
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* E-MAIL */}
        <View style={s.field}>
          <View style={s.labelRow}>
            <Text style={s.label}>E-mail</Text>
            <View style={s.badgeSoon}>
              <Ionicons name="lock-closed-outline" size={10} color="#6b7280" />
              <Text style={s.badgeSoonText}>Alterar em breve</Text>
            </View>
          </View>
          <TextInput
            style={[s.input, s.inputDisabled]}
            value={userData?.email || ''}
            editable={false}
          />
        </View>

        {/* TELEFONE */}
        <View style={s.field}>
          <View style={s.labelRow}>
            <Text style={s.label}>Telefone</Text>

            {(phoneStep === 'verified' || (phoneStep === 'idle' && userData?.phoneVerified)) && (
              <View style={s.badgeOk}>
                <Ionicons name="checkmark-circle" size={11} color="#4ade80" />
                <Text style={s.badgeOkText}>Verificado</Text>
              </View>
            )}

            {phoneStep === 'idle' && hasPhone && (
              <TouchableOpacity style={s.inlineEdit} onPress={() => setPhoneStep('entering')}>
                <Ionicons name="pencil-outline" size={13} color="#2563eb" />
                <Text style={s.inlineEditText}>Editar</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Exibe telefone atual (somente leitura) */}
          {phoneStep === 'idle' && hasPhone && (
            <TextInput
              style={[s.input, s.inputDisabled]}
              value={userData.phone}
              editable={false}
            />
          )}

          {/* Input para novo número */}
          {(phoneStep === 'entering' || (phoneStep === 'idle' && !hasPhone)) && (
            <>
              <View style={s.phoneRow}>
                <TextInput
                  style={[s.input, { flex: 1 }]}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="(11) 99999-9999"
                  placeholderTextColor="#9ca3af"
                  keyboardType="phone-pad"
                />
                <TouchableOpacity
                  style={[s.otpBtn, sendingOtp && s.disabled]}
                  onPress={handleRequestOtp}
                  disabled={sendingOtp}
                >
                  {sendingOtp
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={s.otpBtnText}>Enviar SMS</Text>
                  }
                </TouchableOpacity>
              </View>

              {phoneStep === 'entering' && (
                <TouchableOpacity onPress={() => setPhoneStep('idle')} style={{ marginTop: 6 }}>
                  <Text style={s.cancelLink}>Cancelar</Text>
                </TouchableOpacity>
              )}

              <Text style={s.hint}>
                📱 Você receberá um código SMS para confirmar o número.
              </Text>
            </>
          )}

          {/* Verificação do código OTP */}
          {phoneStep === 'sent' && (
            <>
              <Text style={[s.hint, { color: '#4ade80', marginBottom: 8 }]}>
                ✅ Código enviado! Verifique seu SMS.
              </Text>

              <View style={s.phoneRow}>
                <TextInput
                  style={[s.input, {
                    flex: 1,
                    letterSpacing: 10,
                    textAlign: 'center',
                    fontSize: 22,
                    fontWeight: '700',
                  }]}
                  value={otp}
                  onChangeText={t => setOtp(t.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  placeholderTextColor="#4b5563"
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <TouchableOpacity
                  style={[s.otpBtnGreen, verifyingOtp && s.disabled]}
                  onPress={handleVerifyOtp}
                  disabled={verifyingOtp}
                >
                  {verifyingOtp
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={s.otpBtnText}>Confirmar</Text>
                  }
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={handleRequestOtp}
                disabled={sendingOtp}
                style={{ marginTop: 8 }}
              >
                <Text style={s.cancelLink}>
                  {sendingOtp ? 'Reenviando...' : 'Reenviar código'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* ── Notificações ── */}
      <View style={s.card}>
        <View style={s.cardHeader}>
          <Ionicons name="notifications-outline" size={20} color="#2563eb" />
          <Text style={s.cardTitle}>Notificações</Text>
        </View>

        <View style={s.switchRow}>
          <View style={s.switchInfo}>
            <Text style={s.switchLabel}>E-mail</Text>
            <Text style={s.switchDesc}>Lembretes de agendamento</Text>
          </View>
          <Switch
            value={notifEmail}
            onValueChange={setNotifEmail}
            trackColor={{ true: '#2563eb', false: '#374151' }}
            thumbColor="#ffffff"
          />
        </View>

        <View style={[s.switchRow, { borderBottomWidth: 0 }]}>
          <View style={s.switchInfo}>
            <Text style={s.switchLabel}>SMS</Text>
            <Text style={s.switchDesc}>Confirmações via SMS</Text>
          </View>
          <Switch
            value={notifSms}
            onValueChange={setNotifSms}
            trackColor={{ true: '#2563eb', false: '#374151' }}
            thumbColor="#ffffff"
          />
        </View>
      </View>

      {/* ── Acesso Rápido ── */}
      <View style={s.card}>
        <View style={s.cardHeader}>
          <Ionicons name="apps-outline" size={20} color="#2563eb" />
          <Text style={s.cardTitle}>Acesso Rápido</Text>
        </View>

        {[
          { icon: 'calendar-outline', label: 'Meus Agendamentos', route: '/(cliente)/agendamentos' },
          { icon: 'heart-outline',    label: 'Favoritos',         route: '/(cliente)/favoritos'    },
        ].map((item, i, arr) => (
          <TouchableOpacity
            key={item.route}
            style={[s.menuItem, i === arr.length - 1 && { borderBottomWidth: 0 }]}
            onPress={() => router.push(item.route as any)}
          >
            <Ionicons name={item.icon as any} size={20} color="#2563eb" />
            <Text style={s.menuText}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Logout ── */}
      <TouchableOpacity style={s.logoutBtn} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={20} color="#f87171" />
        <Text style={s.logoutText}>Sair da conta</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  content:   { paddingBottom: 48 },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    backgroundColor: '#151b23',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#ffffff' },

  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#151b23',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#2563eb',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  avatarText:  { fontSize: 32, fontWeight: '700', color: '#ffffff' },
  avatarName:  { fontSize: 20, fontWeight: '700', color: '#ffffff' },
  avatarEmail: { fontSize: 14, color: '#9ca3af', marginTop: 4 },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8,
    backgroundColor: 'rgba(74,222,128,0.1)', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(74,222,128,0.25)',
  },
  verifiedBadgeText: { fontSize: 11, color: '#4ade80', fontWeight: '600' },

  card: {
    backgroundColor: '#151b23',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16,
  },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#ffffff' },

  field:    { marginBottom: 14 },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 },
  label:    { fontSize: 13, fontWeight: '600', color: '#9ca3af' },

  inlineEdit:     { flexDirection: 'row', alignItems: 'center', gap: 3 },
  inlineEditText: { fontSize: 12, color: '#2563eb', fontWeight: '600' },

  badgeLocked: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(245,158,11,0.1)',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)',
  },
  badgeLockedText: { fontSize: 11, color: '#f59e0b', fontWeight: '600' },

  badgeSoon: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(107,114,128,0.12)',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 20,
  },
  badgeSoonText: { fontSize: 11, color: '#6b7280', fontWeight: '500' },

  badgeOk: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(74,222,128,0.1)',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(74,222,128,0.3)',
  },
  badgeOkText: { fontSize: 11, color: '#4ade80', fontWeight: '600' },

  input: {
    backgroundColor: '#1f2937',
    borderWidth: 1, borderColor: '#374151',
    borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#ffffff',
  },
  inputDisabled: { color: '#6b7280' },

  hint: { fontSize: 12, color: '#9ca3af', marginTop: 6, lineHeight: 18 },

  phoneRow:  { flexDirection: 'row', gap: 8, alignItems: 'center' },
  otpBtn: {
    backgroundColor: '#2563eb', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  otpBtnGreen: {
    backgroundColor: '#16a34a', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  otpBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },

  actionRow:     { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn:     { flex: 1, backgroundColor: '#1f2937', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { fontWeight: '700', color: '#9ca3af', fontSize: 15 },
  saveBtn:       { flex: 1, backgroundColor: '#2563eb', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  saveBtnText:   { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  disabled:      { opacity: 0.6 },
  cancelLink:    { fontSize: 13, color: '#6b7280', textDecorationLine: 'underline' },

  switchRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1f2937',
  },
  switchInfo:  { flex: 1 },
  switchLabel: { fontSize: 15, fontWeight: '600', color: '#ffffff' },
  switchDesc:  { fontSize: 12, color: '#9ca3af', marginTop: 2 },

  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1f2937',
  },
  menuText: { flex: 1, fontSize: 15, color: '#ffffff', fontWeight: '500' },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 16,
    padding: 16, marginHorizontal: 16, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
  },
  logoutText: { color: '#f87171', fontWeight: '700', fontSize: 15 },
});