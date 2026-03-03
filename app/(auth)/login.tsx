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

export default function LoginScreen() {
  const { barberSignIn } = useAuthStore();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [mode, setMode] = useState<'barbeiro' | 'cliente'>('barbeiro');

  const bgImage = mode === 'barbeiro'
    ? require('@/assets/images/fundo1.png')
    : require('@/assets/images/fundo4.jpg');

  async function handleLogin() {
    const emailClean = email.trim().toLowerCase();
    const passClean  = password.trim();

    if (!emailClean || !passClean) {
      setError('Preencha e-mail e senha.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      if (mode === 'barbeiro') {
        await barberSignIn(emailClean, passClean);
        router.replace('/(barbeiro)');
      } else {
        const { clientSignIn } = useAuthStore.getState();
        await clientSignIn(emailClean, passClean);
        router.replace('/(cliente)');
      }
    } catch (err: any) {
      setError(err.message || 'E-mail ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ImageBackground source={bgImage} style={{ flex: 1 }} resizeMode="cover">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar style="light" />

        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.overlay} />

          {/* Card de Login */}
          <View style={styles.card}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image
                source={require('@/assets/images/logo4.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            {/* Toggle Barbeiro / Cliente */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleBtn, mode === 'barbeiro' && styles.toggleBtnActive]}
                onPress={() => { setMode('barbeiro'); setError(''); }}
              >
                <Text style={[styles.toggleText, mode === 'barbeiro' && styles.toggleTextActive]}>
                  ✂️ Barbeiro
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, mode === 'cliente' && styles.toggleBtnActive]}
                onPress={() => { setMode('cliente'); setError(''); }}
              >
                <Text style={[styles.toggleText, mode === 'cliente' && styles.toggleTextActive]}>
                  👤 Cliente
                </Text>
              </TouchableOpacity>
            </View>

            {/* Erro */}
            {!!error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Campo E-mail */}
            <TextInput
              style={styles.input}
              placeholder="Usuário ou E-mail"
              placeholderTextColor={Colors.gray[400]}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* Campo Senha */}
            <TextInput
              style={styles.input}
              placeholder="Senha"
              placeholderTextColor={Colors.gray[400]}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCorrect={false}
              autoCapitalize="none"
            />

            {/* Botão Acessar */}
            <TouchableOpacity
              style={[styles.btnPrimary, loading && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnPrimaryText}>ACESSAR</Text>
              }
            </TouchableOpacity>

            {/* Esqueceu a senha */}
            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password')}
              style={styles.forgotBtn}
            >
              <Text style={styles.forgotText}>Esqueceu a Senha?</Text>
            </TouchableOpacity>

            {/* Divisor */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Botão Criar Conta */}
            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={() => router.push('/(auth)/register')}
              activeOpacity={0.85}
            >
              <Text style={styles.btnSecondaryText}>CRIAR CONTA</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
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
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.lg,
    ...Shadow.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  logo: {
    width: 220,
    height: 70,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.gray[100],
    borderRadius: BorderRadius.lg,
    padding: 4,
    marginBottom: Spacing.md,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  toggleBtnActive: {
    backgroundColor: Colors.white,
    ...Shadow.sm,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.gray[500],
  },
  toggleTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
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
  btnPrimary: {
    backgroundColor: Colors.navy,
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: Spacing.xs,
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
  forgotBtn: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  forgotText: {
    color: Colors.accent[600],
    fontWeight: '500',
    fontSize: 14,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.md,
    gap: Spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.gray[300],
  },
  dividerText: {
    color: Colors.gray[500],
    fontSize: 13,
  },
  btnSecondary: {
    borderWidth: 2,
    borderColor: Colors.navy,
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: Colors.navy,
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  footer: {
    marginTop: Spacing.lg,
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    textAlign: 'center',
  },
});