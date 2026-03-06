import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/colors';

interface LocationData {
  zipCode:      string;
  address:      string;
  number:       string;
  complement:   string;
  neighborhood: string;
  city:         string;
  state:        string;
  latitude:     number | null;
  longitude:    number | null;
}

const ESTADOS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS',
  'MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC',
  'SP','SE','TO',
];

export default function LocalizacaoScreen() {
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [searchingCep, setSearchingCep] = useState(false);
  const [form, setForm]                 = useState<LocationData>({
    zipCode: '', address: '', number: '', complement: '',
    neighborhood: '', city: '', state: '', latitude: null, longitude: null,
  });

  useEffect(() => { loadLocation(); }, []);

  async function loadLocation() {
    try {
      // ✅ Endpoint correto: /barbershop-location/my-location
      const res = await api.get('/barbershop-location/my-location');
      const d   = res.data;
      setForm({
        zipCode:      d.zipCode      || '',
        address:      d.address      || '',
        number:       d.number       || '',
        complement:   d.complement   || '',
        neighborhood: d.neighborhood || '',
        city:         d.city         || '',
        state:        d.state        || '',
        latitude:     d.latitude  ?? null,
        longitude:    d.longitude ?? null,
      });
    } catch (e) {
      console.error('Erro ao carregar localização:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleCepSearch() {
    const clean = form.zipCode.replace(/\D/g, '');
    if (clean.length !== 8) {
      Alert.alert('CEP Inválido', 'Digite um CEP com 8 dígitos.');
      return;
    }
    setSearchingCep(true);
    try {
      // ✅ Endpoint correto: /barbershop-location/geocode/cep/{cep}
      const res = await api.get(`/barbershop-location/geocode/cep/${clean}`);
      const d   = res.data;
      setForm(prev => ({
        ...prev,
        address:      d.street       || prev.address,
        neighborhood: d.neighborhood || prev.neighborhood,
        city:         d.city         || prev.city,
        state:        d.state        || prev.state,
        latitude:     d.latitude  ?? prev.latitude,
        longitude:    d.longitude ?? prev.longitude,
      }));
      Alert.alert('✅ CEP Encontrado', 'Endereço preenchido! Adicione o número e salve.');
    } catch (e: any) {
      Alert.alert('Erro', e.response?.data?.error || 'CEP não encontrado.');
    } finally {
      setSearchingCep(false);
    }
  }

  async function handleSave() {
    if (!form.zipCode || !form.address || !form.neighborhood || !form.city || !form.state) {
      Alert.alert('Campos obrigatórios', 'Preencha CEP, endereço, bairro, cidade e estado.');
      return;
    }
    setSaving(true);
    try {
      // ✅ Endpoint correto: PUT /barbershop-location/update-location
      await api.put('/barbershop-location/update-location', form);
      Alert.alert('✅ Sucesso', 'Localização atualizada com sucesso!');
      loadLocation();
    } catch (e: any) {
      Alert.alert('Erro', e.response?.data?.error || 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  }

  function formatCep(v: string) {
    const c = v.replace(/\D/g, '');
    return c.length <= 5 ? c : `${c.slice(0, 5)}-${c.slice(5, 8)}`;
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Carregando localização...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="location" size={22} color={Colors.white} />
        </View>
        <View>
          <Text style={styles.headerTitle}>Localização</Text>
          <Text style={styles.headerSub}>Configure o endereço da sua barbearia</Text>
        </View>
      </View>

      {/* Dica */}
      <View style={styles.tipBox}>
        <Ionicons name="navigate" size={18} color="#2563eb" />
        <View style={{ flex: 1 }}>
          <Text style={styles.tipTitle}>💡 Use o CEP para preencher automaticamente!</Text>
          <Text style={styles.tipText}>
            Digite o CEP e toque em Buscar. O sistema preenche endereço, bairro, cidade e estado.
          </Text>
        </View>
      </View>

      {/* Formulário */}
      <View style={styles.card}>

        {/* CEP */}
        <View style={styles.field}>
          <Text style={styles.label}>CEP *</Text>
          <View style={styles.cepRow}>
            <TextInput style={[styles.input, { flex: 1 }]}
              value={formatCep(form.zipCode)}
              onChangeText={v => setForm(p => ({ ...p, zipCode: v }))}
              placeholder="00000-000" keyboardType="numeric" maxLength={9}
              placeholderTextColor={Colors.gray[400]} />
            <TouchableOpacity style={[styles.cepBtn, searchingCep && styles.btnDisabled]}
              onPress={handleCepSearch} disabled={searchingCep}>
              {searchingCep
                ? <ActivityIndicator size="small" color={Colors.white} />
                : <Ionicons name="search" size={18} color={Colors.white} />}
              <Text style={styles.cepBtnText}>{searchingCep ? 'Buscando...' : 'Buscar'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Endereço */}
        <View style={styles.field}>
          <Text style={styles.label}>Endereço (Rua/Avenida) *</Text>
          <TextInput style={styles.input} value={form.address}
            onChangeText={v => setForm(p => ({ ...p, address: v }))}
            placeholder="Ex: Rua das Flores" placeholderTextColor={Colors.gray[400]} />
        </View>

        {/* Número + Complemento */}
        <View style={styles.row}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Número *</Text>
            <TextInput style={styles.input} value={form.number}
              onChangeText={v => setForm(p => ({ ...p, number: v }))}
              placeholder="123" keyboardType="numeric" placeholderTextColor={Colors.gray[400]} />
          </View>
          <View style={[styles.field, { flex: 1.5, marginLeft: 12 }]}>
            <Text style={styles.label}>Complemento</Text>
            <TextInput style={styles.input} value={form.complement}
              onChangeText={v => setForm(p => ({ ...p, complement: v }))}
              placeholder="Sala 10, Apto..." placeholderTextColor={Colors.gray[400]} />
          </View>
        </View>

        {/* Bairro */}
        <View style={styles.field}>
          <Text style={styles.label}>Bairro *</Text>
          <TextInput style={styles.input} value={form.neighborhood}
            onChangeText={v => setForm(p => ({ ...p, neighborhood: v }))}
            placeholder="Ex: Centro" placeholderTextColor={Colors.gray[400]} />
        </View>

        {/* Cidade */}
        <View style={styles.field}>
          <Text style={styles.label}>Cidade *</Text>
          <TextInput style={styles.input} value={form.city}
            onChangeText={v => setForm(p => ({ ...p, city: v }))}
            placeholder="Ex: São Paulo" placeholderTextColor={Colors.gray[400]} />
        </View>

        {/* Estado */}
        <View style={styles.field}>
          <Text style={styles.label}>Estado *</Text>
          <View style={styles.estadoGrid}>
            {ESTADOS.map(uf => (
              <TouchableOpacity key={uf}
                style={[styles.estadoBtn, form.state === uf && styles.estadoBtnActive]}
                onPress={() => setForm(p => ({ ...p, state: uf }))}>
                <Text style={[styles.estadoBtnText, form.state === uf && styles.estadoBtnTextActive]}>
                  {uf}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Coordenadas */}
        {form.latitude && form.longitude && (
          <View style={styles.coordBox}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
            <View>
              <Text style={styles.coordTitle}>✅ Coordenadas encontradas!</Text>
              <Text style={styles.coordText}>
                Lat: {Number(form.latitude).toFixed(6)} | Lon: {Number(form.longitude).toFixed(6)}
              </Text>
            </View>
          </View>
        )}

        {/* Botão Salvar */}
        <TouchableOpacity style={[styles.saveBtn, saving && styles.btnDisabled]}
          onPress={handleSave} disabled={saving}>
          {saving
            ? <ActivityIndicator color={Colors.white} size="small" />
            : <Ionicons name="save" size={20} color={Colors.white} />}
          <Text style={styles.saveBtnText}>{saving ? 'Salvando...' : 'Salvar Localização'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={18} color={Colors.primary} />
        <Text style={styles.infoText}>
          Seu endereço é exibido publicamente na sua página de agendamento para que os clientes possam te encontrar.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.background },
  content:      { padding: Spacing.md, paddingBottom: Spacing.xxl },
  centered:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText:  { color: Colors.textSecondary, fontSize: 14 },
  header:       { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: Spacing.md },
  headerIcon:   { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  headerTitle:  { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  headerSub:    { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  tipBox:       { flexDirection: 'row', gap: 10, backgroundColor: '#eff6ff', borderRadius: BorderRadius.md, padding: Spacing.sm, marginBottom: Spacing.md, borderWidth: 1, borderColor: '#bfdbfe' },
  tipTitle:     { fontSize: 13, fontWeight: '600', color: '#1d4ed8', marginBottom: 2 },
  tipText:      { fontSize: 12, color: '#1e40af', lineHeight: 17 },
  card:         { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing.md, ...Shadow.sm, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  field:        { marginBottom: Spacing.sm },
  label:        { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 },
  input:        { backgroundColor: Colors.gray[50], borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: 12, fontSize: 15, color: Colors.textPrimary },
  row:          { flexDirection: 'row' },
  cepRow:       { flexDirection: 'row', gap: 10 },
  cepBtn:       { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#2563eb', paddingHorizontal: 14, paddingVertical: 12, borderRadius: BorderRadius.md },
  cepBtnText:   { color: Colors.white, fontWeight: '700', fontSize: 14 },
  estadoGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  estadoBtn:    { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: Colors.gray[100], borderWidth: 1, borderColor: Colors.border },
  estadoBtnActive:     { backgroundColor: Colors.primary, borderColor: Colors.primary },
  estadoBtnText:       { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  estadoBtnTextActive: { color: Colors.white },
  coordBox:     { flexDirection: 'row', gap: 10, backgroundColor: Colors.successBg, borderRadius: BorderRadius.md, padding: Spacing.sm, marginBottom: Spacing.sm, borderWidth: 1, borderColor: '#bbf7d0' },
  coordTitle:   { fontSize: 13, fontWeight: '600', color: Colors.success },
  coordText:    { fontSize: 12, color: Colors.success, marginTop: 2 },
  saveBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: 14, marginTop: 4 },
  saveBtnText:  { color: Colors.white, fontWeight: '700', fontSize: 16 },
  btnDisabled:  { opacity: 0.6 },
  infoBox:      { flexDirection: 'row', gap: 10, backgroundColor: '#faf5ff', borderRadius: BorderRadius.md, padding: Spacing.sm, borderWidth: 1, borderColor: '#e9d5ff' },
  infoText:     { flex: 1, fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
});