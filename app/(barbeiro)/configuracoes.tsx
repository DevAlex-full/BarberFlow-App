import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert,
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
  const [saving,   setSaving]   = useState(false);
  const [name,     setName]     = useState('');
  const [phone,    setPhone]    = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await api.get('/auth/me');
      setUserData(res.data);
      setName(res.data.name   || '');
      setPhone(res.data.phone || '');
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.put('/users/profile', { name, phone });
      Alert.alert('Sucesso', 'Dados salvos com sucesso!');
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar.');
    } finally { setSaving(false); }
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Dados Pessoais */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="person-circle-outline" size={22} color={Colors.primary} />
          <Text style={styles.cardTitle}>Dados Pessoais</Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Nome</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Seu nome" placeholderTextColor={Colors.gray[400]} />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>E-mail</Text>
          <TextInput style={[styles.input, styles.inputDisabled]} value={userData?.email || ''} editable={false} />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Telefone</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="(11) 99999-9999" keyboardType="phone-pad" placeholderTextColor={Colors.gray[400]} />
        </View>
        <TouchableOpacity style={[styles.btn, saving && styles.btnDisabled]} onPress={handleSave} disabled={saving}>
          {saving
            ? <ActivityIndicator color={Colors.white} size="small" />
            : <Text style={styles.btnText}>Salvar Dados</Text>}
        </TouchableOpacity>
      </View>

      {/* Plano Atual */}
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

      {/* Menu de atalhos */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="menu-outline" size={22} color={Colors.primary} />
          <Text style={styles.cardTitle}>Mais opções</Text>
        </View>
        {[
          { icon: 'cut-outline',           label: 'Serviços',           route: '/(barbeiro)/servicos'               },
          { icon: 'location-outline',      label: 'Localização',        route: '/(barbeiro)/localizacao'            },
          { icon: 'globe-outline',         label: 'Landing Page',       route: '/(barbeiro)/landing-page'           },
          { icon: 'bar-chart-outline',     label: 'Analytics',          route: '/(barbeiro)/analytics'              },
          { icon: 'document-text-outline', label: 'Relatórios',         route: '/(barbeiro)/relatorios'             },
          { icon: 'stats-chart-outline',   label: 'Rel. Financeiros',   route: '/(barbeiro)/relatorios-financeiros' },
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

      {/* Logout */}
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
  planBox:      { backgroundColor: '#faf5ff', borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: 8, borderLeftWidth: 4 },
  planBadge:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  planDot:      { width: 10, height: 10, borderRadius: 5 },
  planName:     { fontSize: 17, fontWeight: '700' },
  planPrice:    { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, marginVertical: 4 },
  planDetails:  { marginTop: 4 },
  planDetailText: { fontSize: 12, color: Colors.textSecondary },
  menuItem:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  menuItemText: { flex: 1, fontSize: 15, color: Colors.textPrimary, fontWeight: '500' },
  logoutBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.errorBg, borderRadius: BorderRadius.xl, padding: Spacing.md, borderWidth: 1, borderColor: '#fecaca' },
  logoutText:   { color: Colors.error, fontWeight: '700', fontSize: 15 },
});