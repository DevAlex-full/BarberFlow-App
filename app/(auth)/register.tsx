import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ImageBackground,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@/stores/authStore';
import { Colors, BorderRadius, Spacing, Shadow } from '@/constants/colors';

export default function RegisterScreen() {
  const { barberSignUp } = useAuthStore();

  const [formData, setFormData] = useState({
    name:            '',
    email:           '',
    password:        '',
    phone:           '',
    barbershopName:  '',
    barbershopPhone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  function update(field: keyof typeof formData, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  async function handleRegister() {
    const { name, email, password, phone, barbershopName, barbershopPhone } = formData;
    if (!name || !email || !password || !phone || !barbershopName || !barbershopPhone) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }
    if (password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      await barberSignUp(formData);
      router.replace('/(barbeiro)');
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ImageBackground
      source={require('@/assets/images/fundo2.jpg')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
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
              <Image
                source={require('@/assets/images/logo4.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            {/* Título */}
            <Text style={styles.title}>Criar Conta</Text>
            <Text style={styles.subtitle}>Cadastre sua barbearia e comece agora</Text>

            {/* Erro */}
            {!!error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorTitle}>Erro ao criar conta</Text>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* ── Seus Dados ── */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Seus Dados</Text>
              <View style={styles.sectionLine} />
            </View>

            <TextInput
              style={styles.input}
              placeholder="Nome Completo *"
              placeholderTextColor={Colors.gray[400]}
              value={formData.name}
              onChangeText={v => update('name', v)}
            />
            <TextInput
              style={styles.input}
              placeholder="E-mail *"
              placeholderTextColor={Colors.gray[400]}
              value={formData.email}
              onChangeText={v => update('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Senha (mínimo 6 caracteres) *"
              placeholderTextColor={Colors.gray[400]}
              value={formData.password}
              onChangeText={v => update('password', v)}
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              placeholder="Telefone *"
              placeholderTextColor={Colors.gray[400]}
              value={formData.phone}
              onChangeText={v => update('phone', v)}
              keyboardType="phone-pad"
            />

            {/* ── Dados da Barbearia ── */}
            <View style={[styles.sectionHeader, { marginTop: Spacing.md }]}>
              <Text style={styles.sectionTitle}>Dados da Barbearia</Text>
              <View style={styles.sectionLine} />
            </View>

            <TextInput
              style={styles.input}
              placeholder="Nome da Barbearia *"
              placeholderTextColor={Colors.gray[400]}
              value={formData.barbershopName}
              onChangeText={v => update('barbershopName', v)}
            />
            <TextInput
              style={styles.input}
              placeholder="Telefone da Barbearia *"
              placeholderTextColor={Colors.gray[400]}
              value={formData.barbershopPhone}
              onChangeText={v => update('barbershopPhone', v)}
              keyboardType="phone-pad"
            />

            {/* Termos */}
            <View style={styles.termsBox}>
              <Text style={styles.termsText}>
                Ao criar sua conta, você concorda com nossos{' '}
                <Text style={styles.termsLink}>Termos de Uso</Text>
                {' '}e{' '}
                <Text style={styles.termsLink}>Política de Privacidade</Text>
              </Text>
            </View>

            {/* Botão Criar Conta */}
            <TouchableOpacity
              style={[styles.btnPrimary, loading && styles.btnDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnPrimaryText}>CRIAR CONTA GRÁTIS</Text>
              }
            </TouchableOpacity>

            {/* Badge grátis */}
            <View style={styles.badgeContainer}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>🎉 15 dias de teste grátis</Text>
              </View>
            </View>

            {/* Link login */}
            <View style={styles.loginLink}>
              <Text style={styles.loginLinkText}>Já tem uma conta? </Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.loginLinkAction}>Fazer Login</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.footer}>
            © 2025 BarberFlow. Todos os direitos reservados.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    paddingVertical: Spacing.xl,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  card: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.lg,
    ...Shadow.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  logo: {
    width: 200,
    height: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  errorTitle: {
    color: Colors.error,
    fontWeight: '600',
    fontSize: 13,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginTop: 2,
  },
  sectionHeader: {
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  sectionLine: {
    height: 2,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  input: {
    width: '100%',
    backgroundColor: Colors.gray[50],
    borderWidth: 1,
    borderColor: Colors.gray[300],
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  termsBox: {
    backgroundColor: '#faf5ff',
    borderWidth: 1,
    borderColor: '#e9d5ff',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  termsText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: Colors.primary,
    fontWeight: '600',
  },
  btnPrimary: {
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: Colors.primary,
    ...Shadow.md,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnPrimaryText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  badgeContainer: {
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  badge: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    color: '#15803d',
    fontWeight: '600',
    fontSize: 13,
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  loginLinkText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  loginLinkAction: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  footer: {
    marginTop: Spacing.lg,
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    textAlign: 'center',
  },
});