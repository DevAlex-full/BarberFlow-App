import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import clientApi from '@/lib/client-api';
import { useAuthStore } from '@/stores/authStore';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/colors';

export default function ClientePerfilScreen() {
  const { clientUser, clientSignOut } = useAuthStore();
  const [userData, setUserData] = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [name,     setName]     = useState('');
  const [phone,    setPhone]    = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await clientApi.get('/client/auth/me');
      setUserData(res.data);
      setName(res.data.name   || '');
      setPhone(res.data.phone || '');
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await clientApi.put('/client/profile', { name, phone });
      Alert.alert('Sucesso', 'Dados salvos com sucesso!');
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar.');
    } finally { setSaving(false); }
  }

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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meu Perfil</Text>
      </View>

      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(clientUser?.name || 'C').charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.avatarName}>{clientUser?.name}</Text>
        <Text style={styles.avatarEmail}>{clientUser?.email}</Text>
      </View>

      {/* Dados */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="person-outline" size={20} color={Colors.primary} />
          <Text style={styles.cardTitle}>Dados Pessoais</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Nome</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Seu nome"
            placeholderTextColor={Colors.gray[400]}
            autoCorrect={false}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            value={userData?.email || ''}
            editable={false}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Telefone</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="(11) 99999-9999"
            keyboardType="phone-pad"
            placeholderTextColor={Colors.gray[400]}
          />
        </View>

        <TouchableOpacity
          style={[styles.btn, saving && styles.btnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color={Colors.white} size="small" />
            : <Text style={styles.btnText}>Salvar Dados</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Atalhos */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="menu-outline" size={20} color={Colors.primary} />
          <Text style={styles.cardTitle}>Mais opções</Text>
        </View>
        {[
          { icon: 'calendar-outline', label: 'Meus Agendamentos', route: '/(cliente)/agendamentos' },
          { icon: 'heart-outline',    label: 'Favoritos',         route: '/(cliente)/favoritos'    },
        ].map(item => (
          <TouchableOpacity
            key={item.route}
            style={styles.menuItem}
            onPress={() => router.push(item.route as any)}
          >
            <Ionicons name={item.icon as any} size={20} color={Colors.primary} />
            <Text style={styles.menuText}>{item.label}</Text>
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
  container: { flex: 1, backgroundColor: Colors.background },
  content:   { paddingBottom: Spacing.xxl },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    backgroundColor: Colors.white, paddingHorizontal: Spacing.md,
    paddingTop: 56, paddingBottom: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle:   { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  avatarSection: { alignItems: 'center', paddingVertical: Spacing.xl, backgroundColor: Colors.white, marginBottom: Spacing.md },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
  },
  avatarText:  { fontSize: 32, fontWeight: '700', color: Colors.white },
  avatarName:  { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  avatarEmail: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  card: {
    backgroundColor: Colors.white, marginHorizontal: Spacing.md,
    marginBottom: Spacing.md, borderRadius: BorderRadius.xl,
    padding: Spacing.md, ...Shadow.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.md },
  cardTitle:  { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  field:      { marginBottom: Spacing.sm },
  label:      { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: Colors.gray[50], borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md,
    paddingVertical: 12, fontSize: 15, color: Colors.textPrimary,
  },
  inputDisabled: { color: Colors.textMuted, backgroundColor: Colors.gray[100] },
  btn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingVertical: 12, alignItems: 'center', marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText:     { color: Colors.white, fontWeight: '700', fontSize: 15 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  menuText:   { flex: 1, fontSize: 15, color: Colors.textPrimary, fontWeight: '500' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: Colors.errorBg, borderRadius: BorderRadius.xl,
    padding: Spacing.md, marginHorizontal: Spacing.md, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: '#fecaca',
  },
  logoutText: { color: Colors.error, fontWeight: '700', fontSize: 15 },
});