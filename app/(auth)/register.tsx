import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image,
  ImageBackground, ScrollView, KeyboardAvoidingView,
  Platform, ActivityIndicator, StyleSheet,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { Colors, BorderRadius, Spacing, Shadow } from '@/constants/colors';

type Mode = 'barbeiro' | 'cliente';

const BARBER_INIT = { name: '', email: '', password: '', phone: '', barbershopName: '', barbershopPhone: '' };
const CLIENT_INIT = { name: '', email: '', password: '', phone: '' };

export default function RegisterScreen() {
  const { barberSignUp, clientSignUp } = useAuthStore();

  // ✅ Lê o mode passado pelo login (ex: /(auth)/register?mode=cliente)
  const params = useLocalSearchParams<{ mode?: string }>();
  const initialMode: Mode = params.mode === 'cliente' ? 'cliente' : 'barbeiro';

  const [mode,       setMode]       = useState<Mode>(initialMode);
  const [barberForm, setBarberForm] = useState(BARBER_INIT);
  const [clientForm, setClientForm] = useState(CLIENT_INIT);
  const [showPass,   setShowPass]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  function updateBarber(field: keyof typeof BARBER_INIT, value: string) {
    setBarberForm(p => ({ ...p, [field]: value }));
  }
  function updateClient(field: keyof typeof CLIENT_INIT, value: string) {
    setClientForm(p => ({ ...p, [field]: value }));
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  async function handleRegister() {
    setError('');

    if (mode === 'barbeiro') {
      const { name, email, password, phone, barbershopName, barbershopPhone } = barberForm;
      if (!name || !email || !password || !phone || !barbershopName || !barbershopPhone) {
        setError('Preencha todos os campos obrigatórios.');
        return;
      }
      if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return; }

      setLoading(true);
      try {
        await barberSignUp(barberForm);           // POST /auth/register
        router.replace('/(barbeiro)');
      } catch (err: any) {
        setError(err.message || 'Erro ao criar conta. Tente novamente.');
      } finally {
        setLoading(false);
      }

    } else {
      const { name, email, password, phone } = clientForm;
      if (!name || !email || !password || !phone) {
        setError('Preencha todos os campos obrigatórios.');
        return;
      }
      if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return; }

      setLoading(true);
      try {
        // ✅ termsAccepted + privacyAccepted como o web envia
        await clientSignUp({ ...clientForm, termsAccepted: true, privacyAccepted: true } as any);
        router.replace('/(cliente)');
      } catch (err: any) {
        setError(err.message || 'Erro ao criar conta. Tente novamente.');
      } finally {
        setLoading(false);
      }
    }
  }

  const isBarbeiro = mode === 'barbeiro';

  return (
    <ImageBackground
      source={require('@/assets/images/fundo2.jpg')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <StatusBar style="light" />
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.overlay} />

          <View style={styles.card}>

            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image source={require('@/assets/images/logo4.png')} style={styles.logo} resizeMode="contain" />
            </View>

            {/* Título */}
            <Text style={styles.title}>Criar Conta</Text>
            <Text style={styles.subtitle}>
              {isBarbeiro ? 'Cadastre sua barbearia e comece agora' : 'Crie sua conta e agende seu corte'}
            </Text>

            {/* Toggle Barbeiro / Cliente */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleBtn, isBarbeiro && styles.toggleBtnActive]}
                onPress={() => { setMode('barbeiro'); setError(''); }}
              >
                <Text style={[styles.toggleText, isBarbeiro && styles.toggleTextActive]}>✂️ Barbeiro</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, !isBarbeiro && styles.toggleBtnActive]}
                onPress={() => { setMode('cliente'); setError(''); }}
              >
                <Text style={[styles.toggleText, !isBarbeiro && styles.toggleTextActive]}>👤 Cliente</Text>
              </TouchableOpacity>
            </View>

            {/* Erro */}
            {!!error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={14} color={Colors.error} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.errorTitle}>Erro ao criar conta</Text>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              </View>
            )}

            {/* ════════ FORMULÁRIO BARBEIRO ════════ */}
            {isBarbeiro && (
              <>
                <SectionHeader title="Seus Dados" />
                <TextInput style={styles.input} placeholder="Nome Completo *" placeholderTextColor={Colors.gray[400]}
                  value={barberForm.name} onChangeText={v => updateBarber('name', v)} />
                <TextInput style={styles.input} placeholder="E-mail *" placeholderTextColor={Colors.gray[400]}
                  value={barberForm.email} onChangeText={v => updateBarber('email', v)}
                  keyboardType="email-address" autoCapitalize="none" />
                <PasswordField
                  value={barberForm.password}
                  show={showPass}
                  onToggle={() => setShowPass(p => !p)}
                  onChange={v => updateBarber('password', v)}
                />
                <TextInput style={styles.input} placeholder="Telefone *" placeholderTextColor={Colors.gray[400]}
                  value={barberForm.phone} onChangeText={v => updateBarber('phone', v)} keyboardType="phone-pad" />

                <SectionHeader title="Dados da Barbearia" />
                <TextInput style={styles.input} placeholder="Nome da Barbearia *" placeholderTextColor={Colors.gray[400]}
                  value={barberForm.barbershopName} onChangeText={v => updateBarber('barbershopName', v)} />
                <TextInput style={styles.input} placeholder="Telefone da Barbearia *" placeholderTextColor={Colors.gray[400]}
                  value={barberForm.barbershopPhone} onChangeText={v => updateBarber('barbershopPhone', v)} keyboardType="phone-pad" />
              </>
            )}

            {/* ════════ FORMULÁRIO CLIENTE ════════ */}
            {!isBarbeiro && (
              <>
                <SectionHeader title="Seus Dados" />
                <TextInput style={styles.input} placeholder="Nome Completo *" placeholderTextColor={Colors.gray[400]}
                  value={clientForm.name} onChangeText={v => updateClient('name', v)} />
                <TextInput style={styles.input} placeholder="E-mail *" placeholderTextColor={Colors.gray[400]}
                  value={clientForm.email} onChangeText={v => updateClient('email', v)}
                  keyboardType="email-address" autoCapitalize="none" />
                <PasswordField
                  value={clientForm.password}
                  show={showPass}
                  onToggle={() => setShowPass(p => !p)}
                  onChange={v => updateClient('password', v)}
                />
                <TextInput style={styles.input} placeholder="Telefone *" placeholderTextColor={Colors.gray[400]}
                  value={clientForm.phone} onChangeText={v => updateClient('phone', v)} keyboardType="phone-pad" />
              </>
            )}

            {/* Termos */}
            <View style={styles.termsBox}>
              <Text style={styles.termsText}>
                Ao criar sua conta, você concorda com nossos{' '}
                <Text style={styles.termsLink}>Termos de Uso</Text>
                {' '}e{' '}
                <Text style={styles.termsLink}>Política de Privacidade</Text>
              </Text>
            </View>

            {/* Criar Conta */}
            <TouchableOpacity
              style={[styles.btnPrimary, loading && styles.btnDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={styles.btnPrimaryText}>CRIAR CONTA GRÁTIS</Text>}
            </TouchableOpacity>

            {/* Badge trial — só barbeiro */}
            {isBarbeiro && (
              <View style={styles.badgeContainer}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>🎉 15 dias de teste grátis</Text>
                </View>
              </View>
            )}

            {/* Link login */}
            <View style={styles.loginLink}>
              <Text style={styles.loginLinkText}>Já tem uma conta? </Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.loginLinkAction}>Fazer Login</Text>
              </TouchableOpacity>
            </View>

          </View>

          <Text style={styles.footer}>© 2025 BarberFlow. Todos os direitos reservados.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionLine} />
    </View>
  );
}

function PasswordField({ value, show, onToggle, onChange }: {
  value: string; show: boolean;
  onToggle: () => void; onChange: (v: string) => void;
}) {
  return (
    <View style={styles.passwordRow}>
      <TextInput
        style={[styles.input, { flex: 1, marginBottom: 0 }]}
        placeholder="Senha (mínimo 6 caracteres) *"
        placeholderTextColor={Colors.gray[400]}
        value={value}
        onChangeText={onChange}
        secureTextEntry={!show}
      />
      <TouchableOpacity style={styles.eyeBtn} onPress={onToggle}>
        <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.gray[400]} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1, alignItems: 'center', justifyContent: 'center',
    padding: Spacing.md, paddingVertical: Spacing.xl,
  },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },

  card: {
    width: '100%', maxWidth: 500, backgroundColor: Colors.white,
    borderRadius: BorderRadius.xxl, padding: Spacing.lg, ...Shadow.lg,
  },

  logoContainer: { alignItems: 'center', marginBottom: Spacing.md },
  logo:          { width: 200, height: 60 },

  title:    { fontSize: 28, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.md },

  toggleContainer: {
    flexDirection: 'row', backgroundColor: Colors.gray[100],
    borderRadius: BorderRadius.lg, padding: 4, marginBottom: Spacing.md,
  },
  toggleBtn:        { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: BorderRadius.md },
  toggleBtnActive:  { backgroundColor: Colors.white, ...Shadow.sm },
  toggleText:       { fontSize: 14, fontWeight: '500', color: Colors.gray[500] },
  toggleTextActive: { color: Colors.primary, fontWeight: '700' },

  errorBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#fef2f2', borderLeftWidth: 4, borderLeftColor: Colors.error,
    padding: Spacing.sm, borderRadius: BorderRadius.sm, marginBottom: Spacing.sm,
  },
  errorTitle: { color: Colors.error, fontWeight: '600', fontSize: 13 },
  errorText:  { color: Colors.error, fontSize: 12, marginTop: 2 },

  sectionHeader: { marginBottom: Spacing.sm, marginTop: Spacing.sm },
  sectionTitle:  { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  sectionLine:   { height: 2, backgroundColor: Colors.primary, borderRadius: 2 },

  input: {
    width: '100%', backgroundColor: Colors.gray[50], borderWidth: 1, borderColor: Colors.gray[300],
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md,
    paddingVertical: 14, fontSize: 16, color: Colors.textPrimary, marginBottom: Spacing.sm,
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.sm },
  eyeBtn: {
    padding: 14, backgroundColor: Colors.gray[50],
    borderWidth: 1, borderColor: Colors.gray[300], borderRadius: BorderRadius.md,
  },

  termsBox: {
    backgroundColor: '#faf5ff', borderWidth: 1, borderColor: '#e9d5ff',
    borderRadius: BorderRadius.md, padding: Spacing.sm, marginBottom: Spacing.md,
  },
  termsText: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center', lineHeight: 18 },
  termsLink: { color: Colors.primary, fontWeight: '600' },

  btnPrimary: {
    borderRadius: BorderRadius.md, paddingVertical: 14,
    alignItems: 'center', backgroundColor: Colors.primary, ...Shadow.md,
  },
  btnDisabled:    { opacity: 0.6 },
  btnPrimaryText: { color: Colors.white, fontWeight: '700', fontSize: 16, letterSpacing: 0.5 },

  badgeContainer: { alignItems: 'center', marginTop: Spacing.sm },
  badge:          { backgroundColor: '#f0fdf4', paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: BorderRadius.full },
  badgeText:      { color: '#15803d', fontWeight: '600', fontSize: 13 },

  loginLink:       { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.md },
  loginLinkText:   { color: Colors.textSecondary, fontSize: 14 },
  loginLinkAction: { color: Colors.primary, fontWeight: '600', fontSize: 14 },

  footer: { marginTop: Spacing.lg, color: 'rgba(255,255,255,0.8)', fontSize: 12, textAlign: 'center' },
});