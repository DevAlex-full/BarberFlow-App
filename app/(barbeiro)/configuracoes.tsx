import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/colors';
import { getPlanById, formatPrice, getPlanBadgeColor, trialPlan } from '@/lib/plans';

export default function ConfiguracoesScreen() {
  const { barberUser, barberSignOut } = useAuthStore();
  const [userData, setUserData] = useState<any>(null);
  const [loading,  setLoading]  = useState(true);

  // ── Dados pessoais ─────────────────────────────────────────────────────────
  const [name,  setName]  = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  // ── Alterar senha ──────────────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPwd,       setSavingPwd]       = useState(false);
  const [showCurrentPwd,  setShowCurrentPwd]  = useState(false);
  const [showNewPwd,      setShowNewPwd]      = useState(false);
  const [showConfirmPwd,  setShowConfirmPwd]  = useState(false);

  // ── Preferências ───────────────────────────────────────────────────────────
  const [emailNotifications,    setEmailNotifications]    = useState(true);
  const [smsNotifications,      setSmsNotifications]      = useState(false);
  const [whatsappNotifications, setWhatsappNotifications] = useState(true);
  const [savingPrefs,           setSavingPrefs]           = useState(false);

  // ── Excluir conta ──────────────────────────────────────────────────────────
  const [deletePassword, setDeletePassword] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showDeleteSection, setShowDeleteSection] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      // ✅ GET /auth/me
      const res = await api.get('/auth/me');
      setUserData(res.data);
      setName(res.data.name   || '');
      setPhone(res.data.phone || '');
      // Carregar preferências salvas
      if (res.data.preferences) {
        setEmailNotifications(res.data.preferences.emailNotifications ?? true);
        setSmsNotifications(res.data.preferences.smsNotifications ?? false);
        setWhatsappNotifications(res.data.preferences.whatsappNotifications ?? true);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  // ── Salvar dados pessoais ──────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    try {
      // ✅ PUT /users/profile
      await api.put('/users/profile', { name, phone });
      Alert.alert('✅ Sucesso', 'Dados salvos com sucesso!');
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar.');
    } finally { setSaving(false); }
  }

  // ── Alterar senha ──────────────────────────────────────────────────────────
  async function handleChangePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Atenção', 'Preencha todos os campos de senha.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Senhas diferentes', 'A nova senha e a confirmação não conferem.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Senha fraca', 'A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setSavingPwd(true);
    try {
      // ✅ PUT /users/change-password
      await api.put('/users/change-password', { currentPassword, newPassword });
      Alert.alert('✅ Senha alterada', 'Sua senha foi alterada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      Alert.alert('Erro', e.response?.data?.error || 'Senha atual incorreta.');
    } finally { setSavingPwd(false); }
  }

  // ── Salvar preferências ────────────────────────────────────────────────────
  async function handleSavePreferences() {
    setSavingPrefs(true);
    try {
      // ✅ PUT /users/preferences
      await api.put('/users/preferences', {
        emailNotifications,
        smsNotifications,
        whatsappNotifications,
      });
      Alert.alert('✅ Sucesso', 'Preferências salvas com sucesso!');
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar as preferências.');
    } finally { setSavingPrefs(false); }
  }

  // ── Excluir conta ──────────────────────────────────────────────────────────
  async function handleDeleteAccount() {
    if (!deletePassword) {
      Alert.alert('Atenção', 'Digite sua senha para confirmar a exclusão.');
      return;
    }
    Alert.alert(
      '⚠️ Excluir Conta',
      'Esta ação é irreversível! Todos os dados da barbearia, agendamentos, clientes e configurações serão permanentemente excluídos.\n\nDeseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir Permanentemente',
          style: 'destructive',
          onPress: async () => {
            setDeletingAccount(true);
            try {
              // ✅ DELETE /barbershop — web usa fetch com token localStorage
              await api.delete('/barbershop', { data: { password: deletePassword } });
              Alert.alert('Conta excluída', 'Sua conta foi excluída com sucesso.');
              await barberSignOut();
              router.replace('/(auth)/login');
            } catch (e: any) {
              Alert.alert('Erro', e.response?.data?.error || 'Senha incorreta ou erro ao excluir.');
            } finally { setDeletingAccount(false); }
          },
        },
      ]
    );
  }

  async function handleSignOut() {
    Alert.alert('Sair', 'Deseja realmente sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair', style: 'destructive',
        onPress: async () => {
          await barberSignOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  const planId        = userData?.barbershop?.plan || 'trial';
  const plan          = getPlanById(planId);
  const isTrial       = planId === 'trial' || !plan;
  const planColor     = getPlanBadgeColor(planId);
  const planPriceText = isTrial
    ? 'Grátis — 15 dias'
    : `${formatPrice(plan!.prices.monthly.perMonth)}/mês`;

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
      showsVerticalScrollIndicator={false}
    >

      {/* ── Dados Pessoais ─────────────────────────────────────────────────── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="person-circle-outline" size={22} color={Colors.primary} />
          <Text style={styles.cardTitle}>Dados Pessoais</Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Nome</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName}
            placeholder="Seu nome" placeholderTextColor={Colors.gray[400]} />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>E-mail</Text>
          <TextInput style={[styles.input, styles.inputDisabled]}
            value={userData?.email || ''} editable={false} />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Telefone</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone}
            placeholder="(11) 99999-9999" keyboardType="phone-pad"
            placeholderTextColor={Colors.gray[400]} />
        </View>
        <TouchableOpacity style={[styles.btn, saving && styles.btnDisabled]}
          onPress={handleSave} disabled={saving}>
          {saving
            ? <ActivityIndicator color={Colors.white} size="small" />
            : <Text style={styles.btnText}>Salvar Dados</Text>}
        </TouchableOpacity>
      </View>

      {/* ── Alterar Senha ──────────────────────────────────────────────────── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="lock-closed-outline" size={22} color={Colors.primary} />
          <Text style={styles.cardTitle}>Alterar Senha</Text>
        </View>

        {/* Senha atual */}
        <View style={styles.field}>
          <Text style={styles.label}>Senha Atual</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="••••••••"
              placeholderTextColor={Colors.gray[400]}
              secureTextEntry={!showCurrentPwd}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowCurrentPwd(p => !p)}>
              <Ionicons name={showCurrentPwd ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.gray[400]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Nova senha */}
        <View style={styles.field}>
          <Text style={styles.label}>Nova Senha</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor={Colors.gray[400]}
              secureTextEntry={!showNewPwd}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowNewPwd(p => !p)}>
              <Ionicons name={showNewPwd ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.gray[400]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Confirmar senha */}
        <View style={styles.field}>
          <Text style={styles.label}>Confirmar Nova Senha</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repita a nova senha"
              placeholderTextColor={Colors.gray[400]}
              secureTextEntry={!showConfirmPwd}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirmPwd(p => !p)}>
              <Ionicons name={showConfirmPwd ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.gray[400]} />
            </TouchableOpacity>
          </View>
          {!!confirmPassword && confirmPassword !== newPassword && (
            <Text style={styles.errorHint}>As senhas não conferem</Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.btn, savingPwd && styles.btnDisabled]}
          onPress={handleChangePassword}
          disabled={savingPwd}
        >
          {savingPwd
            ? <ActivityIndicator color={Colors.white} size="small" />
            : <Text style={styles.btnText}>Alterar Senha</Text>}
        </TouchableOpacity>
      </View>

      {/* ── Preferências ───────────────────────────────────────────────────── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="notifications-outline" size={22} color={Colors.primary} />
          <Text style={styles.cardTitle}>Preferências de Notificação</Text>
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Ionicons name="mail-outline" size={18} color={Colors.textSecondary} />
            <View>
              <Text style={styles.switchLabel}>E-mail</Text>
              <Text style={styles.switchSub}>Receber notificações por e-mail</Text>
            </View>
          </View>
          <Switch
            value={emailNotifications}
            onValueChange={setEmailNotifications}
            trackColor={{ true: Colors.primary }}
            thumbColor={Colors.white}
          />
        </View>

        <View style={[styles.switchRow, styles.switchBorder]}>
          <View style={styles.switchInfo}>
            <Ionicons name="chatbubble-outline" size={18} color={Colors.textSecondary} />
            <View>
              <Text style={styles.switchLabel}>SMS</Text>
              <Text style={styles.switchSub}>Receber notificações por SMS</Text>
            </View>
          </View>
          <Switch
            value={smsNotifications}
            onValueChange={setSmsNotifications}
            trackColor={{ true: Colors.primary }}
            thumbColor={Colors.white}
          />
        </View>

        <View style={[styles.switchRow, styles.switchBorder]}>
          <View style={styles.switchInfo}>
            <Ionicons name="logo-whatsapp" size={18} color="#25d366" />
            <View>
              <Text style={styles.switchLabel}>WhatsApp</Text>
              <Text style={styles.switchSub}>Receber notificações pelo WhatsApp</Text>
            </View>
          </View>
          <Switch
            value={whatsappNotifications}
            onValueChange={setWhatsappNotifications}
            trackColor={{ true: Colors.primary }}
            thumbColor={Colors.white}
          />
        </View>

        <TouchableOpacity
          style={[styles.btn, { marginTop: Spacing.sm }, savingPrefs && styles.btnDisabled]}
          onPress={handleSavePreferences}
          disabled={savingPrefs}
        >
          {savingPrefs
            ? <ActivityIndicator color={Colors.white} size="small" />
            : <Text style={styles.btnText}>Salvar Preferências</Text>}
        </TouchableOpacity>
      </View>

      {/* ── Plano Atual ────────────────────────────────────────────────────── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="card-outline" size={22} color={Colors.primary} />
          <Text style={styles.cardTitle}>Plano Atual</Text>
        </View>
        <View style={[styles.planBox, { borderLeftColor: planColor }]}>
          <View style={styles.planBadge}>
            <View style={[styles.planDot, { backgroundColor: planColor }]} />
            <Text style={[styles.planName, { color: planColor }]}>
              {isTrial ? trialPlan.name : plan!.name}
            </Text>
          </View>
          <Text style={styles.planPrice}>{planPriceText}</Text>
          {!isTrial && (
            <View style={styles.planDetails}>
              <Text style={styles.planDetailText}>
                Semestral: {formatPrice(plan!.prices.semiannual.perMonth)}/mês
                {'  '}•{'  '}
                Anual: {formatPrice(plan!.prices.annual.perMonth)}/mês
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.btnOutline} onPress={() => router.push('/(barbeiro)/planos')}>
          <Ionicons name="arrow-up-circle-outline" size={18} color={Colors.primary} />
          <Text style={styles.btnOutlineText}>Ver Planos</Text>
        </TouchableOpacity>
      </View>

      {/* ── Menu de atalhos ────────────────────────────────────────────────── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="menu-outline" size={22} color={Colors.primary} />
          <Text style={styles.cardTitle}>Mais opções</Text>
        </View>
        {[
          { icon: 'cut-outline',           label: 'Serviços',         route: '/(barbeiro)/servicos'               },
          { icon: 'location-outline',      label: 'Localização',      route: '/(barbeiro)/localizacao'            },
          { icon: 'globe-outline',         label: 'Landing Page',     route: '/(barbeiro)/landing-page'           },
          { icon: 'bar-chart-outline',     label: 'Analytics',        route: '/(barbeiro)/analytics'              },
          { icon: 'document-text-outline', label: 'Relatórios',       route: '/(barbeiro)/relatorios'             },
          { icon: 'stats-chart-outline',   label: 'Rel. Financeiros', route: '/(barbeiro)/relatorios-financeiros' },
        ].map(item => (
          <TouchableOpacity
            key={item.route}
            style={styles.menuItem}
            onPress={() => router.push(item.route as any)}
          >
            <Ionicons name={item.icon as any} size={20} color={Colors.primary} />
            <Text style={styles.menuItemText}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.gray[400]} />
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Excluir Conta ──────────────────────────────────────────────────── */}
      <View style={[styles.card, { borderColor: '#fecaca', borderWidth: 1 }]}>
        <TouchableOpacity
          style={styles.deleteToggleRow}
          onPress={() => setShowDeleteSection(p => !p)}
        >
          <View style={styles.cardHeader}>
            <Ionicons name="trash-outline" size={22} color={Colors.error} />
            <Text style={[styles.cardTitle, { color: Colors.error }]}>Excluir Conta</Text>
          </View>
          <Ionicons
            name={showDeleteSection ? 'chevron-up' : 'chevron-down'}
            size={20} color={Colors.error}
          />
        </TouchableOpacity>

        {showDeleteSection && (
          <>
            <View style={styles.deleteWarningBox}>
              <Ionicons name="warning" size={18} color={Colors.error} />
              <Text style={styles.deleteWarningText}>
                Esta ação é irreversível! Todos os dados da barbearia, agendamentos, clientes e
                configurações serão permanentemente excluídos.
              </Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Confirme sua senha</Text>
              <TextInput
                style={[styles.input, { borderColor: '#fecaca' }]}
                value={deletePassword}
                onChangeText={setDeletePassword}
                placeholder="Digite sua senha atual"
                placeholderTextColor={Colors.gray[400]}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[styles.deleteBtn, deletingAccount && styles.btnDisabled]}
              onPress={handleDeleteAccount}
              disabled={deletingAccount}
            >
              {deletingAccount
                ? <ActivityIndicator color={Colors.white} size="small" />
                : <Ionicons name="trash" size={18} color={Colors.white} />}
              <Text style={styles.deleteBtnText}>
                {deletingAccount ? 'Excluindo...' : 'Excluir Conta Permanentemente'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* ── Logout ─────────────────────────────────────────────────────────── */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={20} color={Colors.error} />
        <Text style={styles.logoutText}>Sair da conta</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.background },
  content:      { padding: Spacing.md, gap: 16, paddingBottom: Spacing.xxl },
  centered:     { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card:         { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing.md, ...Shadow.sm, borderWidth: 1, borderColor: Colors.border },
  cardHeader:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.md },
  cardTitle:    { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  field:        { marginBottom: Spacing.sm },
  label:        { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 },
  input:        { backgroundColor: Colors.gray[50], borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: 12, fontSize: 15, color: Colors.textPrimary },
  inputDisabled:{ color: Colors.textMuted, backgroundColor: Colors.gray[100] },
  btn:          { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  btnDisabled:  { opacity: 0.6 },
  btnText:      { color: Colors.white, fontWeight: '700', fontSize: 15 },
  btnOutline:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 2, borderColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: 10, marginTop: 8 },
  btnOutlineText: { color: Colors.primary, fontWeight: '700', fontSize: 15 },

  // Senha
  passwordRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn:       { padding: 10 },
  errorHint:    { fontSize: 12, color: Colors.error, marginTop: 4 },

  // Preferências
  switchRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  switchBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  switchInfo:   { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  switchLabel:  { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  switchSub:    { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },

  // Plano
  planBox:      { backgroundColor: '#faf5ff', borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: 8, borderLeftWidth: 4 },
  planBadge:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  planDot:      { width: 10, height: 10, borderRadius: 5 },
  planName:     { fontSize: 17, fontWeight: '700' },
  planPrice:    { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, marginVertical: 4 },
  planDetails:  { marginTop: 4 },
  planDetailText: { fontSize: 12, color: Colors.textSecondary },

  // Menu
  menuItem:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  menuItemText: { flex: 1, fontSize: 15, color: Colors.textPrimary, fontWeight: '500' },

  // Excluir conta
  deleteToggleRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  deleteWarningBox:  { flexDirection: 'row', gap: 8, backgroundColor: Colors.errorBg, borderRadius: BorderRadius.md, padding: Spacing.sm, marginBottom: Spacing.sm, borderWidth: 1, borderColor: '#fecaca' },
  deleteWarningText: { flex: 1, fontSize: 12, color: Colors.error, lineHeight: 17 },
  deleteBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.error, borderRadius: BorderRadius.md, paddingVertical: 12 },
  deleteBtnText:     { color: Colors.white, fontWeight: '700', fontSize: 15 },

  // Logout
  logoutBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.errorBg, borderRadius: BorderRadius.xl, padding: Spacing.md, borderWidth: 1, borderColor: '#fecaca' },
  logoutText:   { color: Colors.error, fontWeight: '700', fontSize: 15 },
});