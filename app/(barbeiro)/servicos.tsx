import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '@/lib/api';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/colors';

interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  active: boolean;   // ✅ campo real do Prisma (service.routes.ts linha 50)
}

export default function ServicosScreen() {
  const [services,   setServices]   = useState<Service[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search,     setSearch]     = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await api.get('/services');
      setServices(res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function handleToggle(id: string, current: boolean) {
    try {
      // ✅ Backend: PUT /services/:id com { active: boolean }
      // NÃO existe /toggle nem PATCH — ver service.routes.ts linha 47
      await api.put(`/services/${id}`, { active: !current });
      setServices(prev => prev.map(s => s.id === id ? { ...s, active: !current } : s));
    } catch {
      Alert.alert('Erro', 'Não foi possível alterar o serviço.');
    }
  }

  async function handleDelete(id: string) {
    Alert.alert('Excluir', 'Deseja excluir este serviço?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/services/${id}`);
            setServices(prev => prev.filter(s => s.id !== id));
          } catch (err: any) {
            // 500 = Prisma foreign key: serviço tem agendamentos vinculados
            const msg = err?.response?.status === 500
              ? 'Este serviço possui agendamentos vinculados e não pode ser excluído. Desative-o em vez de excluir.'
              : 'Não foi possível excluir o serviço.';
            Alert.alert('Erro', msg);
          }
        },
      },
    ]);
  }

  const filtered = services.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Serviços</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Busca */}
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={Colors.gray[400]} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar serviço..."
          placeholderTextColor={Colors.gray[400]}
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
        />
        {!!search && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={Colors.gray[400]} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Resumo */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{services.length}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: Colors.success }]}>
              {services.filter(s => s.active).length}
            </Text>
            <Text style={styles.summaryLabel}>Ativos</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: Colors.textSecondary }]}>
              {services.filter(s => !s.active).length}
            </Text>
            <Text style={styles.summaryLabel}>Inativos</Text>
          </View>
        </View>

        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="cut-outline" size={48} color={Colors.gray[300]} />
            <Text style={styles.emptyText}>
              {search ? 'Nenhum serviço encontrado' : 'Nenhum serviço cadastrado'}
            </Text>
            <Text style={styles.emptySubText}>Cadastre serviços no painel web</Text>
          </View>
        ) : (
          filtered.map(s => (
            <View key={s.id} style={[styles.card, !s.active && styles.cardInactive]}>
              <View style={styles.cardLeft}>
                <View style={[styles.cardIcon, { backgroundColor: s.active ? '#faf5ff' : Colors.gray[100] }]}>
                  <Ionicons name="cut" size={22} color={s.active ? Colors.primary : Colors.gray[400]} />
                </View>
              </View>
              <View style={styles.cardInfo}>
                <Text style={[styles.cardName, !s.active && styles.textMuted]}>{s.name}</Text>
                {!!s.description && (
                  <Text style={styles.cardDesc} numberOfLines={1}>{s.description}</Text>
                )}
                <View style={styles.cardMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={13} color={Colors.textSecondary} />
                    <Text style={styles.metaText}>{s.duration} min</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="cash-outline" size={13} color={Colors.textSecondary} />
                    <Text style={styles.metaText}>R$ {Number(s.price).toFixed(2)}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: s.active ? Colors.successBg : Colors.gray[100] }]}
                  onPress={() => handleToggle(s.id, s.active)}
                >
                  <Ionicons
                    name={s.active ? 'eye' : 'eye-off'}
                    size={16}
                    color={s.active ? Colors.success : Colors.gray[400]}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: Colors.errorBg }]}
                  onPress={() => handleDelete(s.id)}
                >
                  <Ionicons name="trash-outline" size={16} color={Colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.white, paddingHorizontal: Spacing.md,
    paddingTop: 56, paddingBottom: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.white, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    margin: Spacing.md, marginBottom: 0, ...Shadow.sm,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.textPrimary },
  list:        { padding: Spacing.md, gap: 10, paddingBottom: 40 },
  summaryRow:  { flexDirection: 'row', gap: 10, marginBottom: 4 },
  summaryCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.sm, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border, ...Shadow.sm,
  },
  summaryValue: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  summaryLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  empty:        { alignItems: 'center', paddingTop: 48, gap: 8 },
  emptyText:    { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  emptySubText: { fontSize: 13, color: Colors.textMuted },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.md, ...Shadow.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  cardInactive: { opacity: 0.6 },
  cardLeft:   {},
  cardIcon:   { width: 44, height: 44, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  cardInfo:   { flex: 1 },
  cardName:   { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  cardDesc:   { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  textMuted:  { color: Colors.textMuted },
  cardMeta:   { flexDirection: 'row', gap: 12, marginTop: 4 },
  metaItem:   { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText:   { fontSize: 12, color: Colors.textSecondary },
  cardActions: { gap: 6 },
  actionBtn:  { width: 34, height: 34, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
});