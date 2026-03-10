import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import clientApi from '@/lib/client-api';
import { useAuthStore } from '@/stores/authStore';

export default function ClientePerfilScreen() {
  const { clientUser, clientSignOut } = useAuthStore();
  const [userData,  setUserData]  = useState<any>(null);
  const [loading,   setLoading]   = useState(true);
  const [editing,   setEditing]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [name,      setName]      = useState('');
  const [phone,     setPhone]     = useState('');

  // Preferências (locais — pode ser sincronizado com API futuramente)
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifSms,   setNotifSms]   = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await clientApi.get('/client/auth/me');
      setUserData(res.data);
      setName(res.data.name   || '');
      // Se o banco tiver um email salvo no campo phone (dado incorreto), ignora
      const rawPhone = res.data.phone || '';
      setPhone(rawPhone.includes('@') ? '' : rawPhone);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Atenção', 'O nome não pode estar vazio.');
      return;
    }
    setSaving(true);
    try {
      await clientApi.put('/client/auth/profile', { name: name.trim(), phone });
      setEditing(false);
      Alert.alert('Sucesso', 'Dados salvos com sucesso!');
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar.');
    } finally { setSaving(false); }
  }

  function handleCancel() {
    setName(userData?.name   || '');
    setPhone(userData?.phone || '');
    setEditing(false);
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
        <ActivityIndicator size="large" color={'#2563eb'} />
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

      {/* Dados Pessoais */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="person-outline" size={20} color={'#2563eb'} />
          <Text style={styles.cardTitle}>Dados Pessoais</Text>
          {!editing && (
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => setEditing(true)}
            >
              <Ionicons name="pencil-outline" size={16} color={'#2563eb'} />
              <Text style={styles.editBtnText}>Editar</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Nome</Text>
          <TextInput
            style={[styles.input, !editing && styles.inputDisabled]}
            value={name}
            onChangeText={setName}
            placeholder="Seu nome"
            placeholderTextColor={'#9ca3af'}
            autoCorrect={false}
            editable={editing}
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
            style={[styles.input, !editing && styles.inputDisabled]}
            value={phone}
            onChangeText={setPhone}
            placeholder="(11) 99999-9999"
            keyboardType="phone-pad"
            placeholderTextColor={'#9ca3af'}
            editable={editing}
          />
        </View>

        {editing && (
          <View style={styles.editActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.btnDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color={'#151b23'} size="small" />
                : <Text style={styles.saveBtnText}>Salvar</Text>
              }
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Notificações */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="notifications-outline" size={20} color={'#2563eb'} />
          <Text style={styles.cardTitle}>Notificações</Text>
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>E-mail</Text>
            <Text style={styles.switchDesc}>Lembretes de agendamento</Text>
          </View>
          <Switch
            value={notifEmail}
            onValueChange={setNotifEmail}
            trackColor={{ true: '#2563eb', false: '#374151' }}
            thumbColor={'#151b23'}
          />
        </View>

        <View style={[styles.switchRow, { borderBottomWidth: 0 }]}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>SMS</Text>
            <Text style={styles.switchDesc}>Confirmações via SMS</Text>
          </View>
          <Switch
            value={notifSms}
            onValueChange={setNotifSms}
            trackColor={{ true: '#2563eb', false: '#374151' }}
            thumbColor={'#151b23'}
          />
        </View>
      </View>

      {/* Atalhos */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="apps-outline" size={20} color={'#2563eb'} />
          <Text style={styles.cardTitle}>Acesso Rápido</Text>
        </View>

        {[
          { icon: 'calendar-outline',  label: 'Meus Agendamentos', route: '/(cliente)/agendamentos' },
          { icon: 'heart-outline',     label: 'Favoritos',         route: '/(cliente)/favoritos'    },
        ].map(item => (
          <TouchableOpacity
            key={item.route}
            style={styles.menuItem}
            onPress={() => router.push(item.route as any)}
          >
            <Ionicons name={item.icon as any} size={20} color={'#2563eb'} />
            <Text style={styles.menuText}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={'#9ca3af'} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={20} color={'#f87171'} />
        <Text style={styles.logoutText}>Sair da conta</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  content:   { paddingBottom: 48 },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    backgroundColor: '#151b23', paddingHorizontal: 16,
    paddingTop: 56, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#1f2937',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#ffffff' },

  avatarSection: {
    alignItems: 'center', paddingVertical: 24,
    backgroundColor: '#151b23', marginBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#1f2937',
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  avatarText:  { fontSize: 32, fontWeight: '700', color: '#151b23' },
  avatarName:  { fontSize: 20, fontWeight: '700', color: '#ffffff' },
  avatarEmail: { fontSize: 14, color: '#9ca3af', marginTop: 4 },

  card: {
    backgroundColor: '#151b23', marginHorizontal: 16,
    marginBottom: 16, borderRadius: 16,
    padding: 16, 
    borderWidth: 1, borderColor: '#1f2937',
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginBottom: 16,
  },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#ffffff' },
  editBtn:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editBtnText: { fontSize: 13, fontWeight: '600', color: '#2563eb' },

  field:  { marginBottom: 8 },
  label:  { fontSize: 13, fontWeight: '600', color: '#9ca3af', marginBottom: 6 },
  input: {
    backgroundColor: '#1f2937', borderWidth: 1, borderColor: '#1f2937',
    borderRadius: 10, paddingHorizontal: 16,
    paddingVertical: 12, fontSize: 15, color: '#ffffff',
  },
  inputDisabled: { color: '#6b7280', backgroundColor: '#1f2937' },

  editActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: {
    flex: 1, backgroundColor: '#1f2937', borderRadius: 10,
    paddingVertical: 12, alignItems: 'center',
  },
  cancelBtnText: { fontWeight: '700', color: '#9ca3af', fontSize: 15 },
  saveBtn: {
    flex: 1, backgroundColor: '#2563eb', borderRadius: 10,
    paddingVertical: 12, alignItems: 'center',
  },
  saveBtnText: { color: '#151b23', fontWeight: '700', fontSize: 15 },
  btnDisabled: { opacity: 0.6 },

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