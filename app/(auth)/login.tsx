import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image,
  ImageBackground, ScrollView, KeyboardAvoidingView,
  Platform, ActivityIndicator, StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '@/stores/authStore';
import { Colors, BorderRadius, Spacing, Shadow } from '@/constants/colors';

WebBrowser.maybeCompleteAuthSession();

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  'https://barberflow-back-end-19nv.onrender.com/api';

type Mode = 'barbeiro' | 'cliente';

export default function LoginScreen() {
  const { barberSignIn, clientSignIn } = useAuthStore();

  const [mode,         setMode]         = useState<Mode>('barbeiro');
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPass,     setShowPass]     = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'facebook' | null>(null);
  const [error,        setError]        = useState('');

  const bgImage = mode === 'barbeiro'
    ? require('@/assets/images/fundo1.png')
    : require('@/assets/images/fundo4.jpg');

  function switchMode(next: Mode) {
    setMode(next);
    setError('');
    setEmail('');
    setPassword('');
    setShowPass(false);
  }

  // ── Login e-mail / senha ────────────────────────────────────────────────────
  async function handleLogin() {
    const emailClean = email.trim().toLowerCase();
    const passClean  = password.trim();
    if (!emailClean || !passClean) { setError('Preencha e-mail e senha.'); return; }
    setError('');
    setLoading(true);
    try {
      if (mode === 'barbeiro') {
        await barberSignIn(emailClean, passClean);  // POST /auth/login
        router.replace('/(barbeiro)');
      } else {
        await clientSignIn(emailClean, passClean);  // POST /client/auth/login
        router.replace('/(cliente)');
      }
    } catch (err: any) {
      setError(err.message || 'E-mail ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  }

  // ── OAuth Google ────────────────────────────────────────────────────────────
  async function handleGoogleLogin() {
    setOauthLoading('google');
    setError('');
    try {
      // ✅ createURL gera:
      //   DEV  (Expo Go): exp://192.168.x.x:8081/--/auth/callback
      //   PROD (build):   barberflow://auth/callback
      const redirectUrl = Linking.createURL('/auth/callback');
      console.log('🔵 [OAuth] Google redirectUrl:', redirectUrl);

      const result = await WebBrowser.openAuthSessionAsync(
        `${API_URL}/client/auth/google?redirect_uri=${encodeURIComponent(redirectUrl)}`,
        redirectUrl
      );

      console.log('🔵 [OAuth] Google result type:', result.type);
      if (result.type === 'success') {
        console.log('🔵 [OAuth] Google callback URL:', result.url);
        await handleOAuthCallback(result.url);
      }
    } catch (err) {
      console.error('❌ [OAuth] Google erro:', err);
      setError('Erro ao conectar com Google. Tente novamente.');
    } finally {
      setOauthLoading(null);
    }
  }

  // ── OAuth Facebook ──────────────────────────────────────────────────────────
  async function handleFacebookLogin() {
    setOauthLoading('facebook');
    setError('');
    try {
      const redirectUrl = Linking.createURL('/auth/callback');
      console.log('🔵 [OAuth] Facebook redirectUrl:', redirectUrl);

      const result = await WebBrowser.openAuthSessionAsync(
        `${API_URL}/client/auth/facebook?redirect_uri=${encodeURIComponent(redirectUrl)}`,
        redirectUrl
      );

      console.log('🔵 [OAuth] Facebook result type:', result.type);
      if (result.type === 'success') {
        console.log('🔵 [OAuth] Facebook callback URL:', result.url);
        await handleOAuthCallback(result.url);
      }
    } catch (err) {
      console.error('❌ [OAuth] Facebook erro:', err);
      setError('Erro ao conectar com Facebook. Tente novamente.');
    } finally {
      setOauthLoading(null);
    }
  }

  // ── Processa callback OAuth — token + user na URL ───────────────────────────
  async function handleOAuthCallback(url: string) {
    try {
      const parsed     = new URL(url);
      const token      = parsed.searchParams.get('token');
      const userParam  = parsed.searchParams.get('user');
      const oauthError = parsed.searchParams.get('error');

      if (oauthError) {
        setError(`Erro na autenticação: ${decodeURIComponent(oauthError)}`);
        return;
      }
      if (!token || !userParam) {
        setError('Resposta inválida do servidor. Tente novamente.');
        return;
      }

      const client = JSON.parse(decodeURIComponent(userParam));

      // ✅ Mesmas chaves do authStore
      await SecureStore.setItemAsync('barberFlow_client_token', token);
      await SecureStore.setItemAsync('barberFlow_client_user', JSON.stringify(client));
      useAuthStore.setState({ clientUser: client });

      router.replace('/(cliente)');
    } catch {
      setError('Erro ao processar login. Tente novamente.');
    }
  }

  const isBarbeiro = mode === 'barbeiro';
  const anyOAuth   = oauthLoading !== null;

  return (
    <ImageBackground source={bgImage} style={{ flex: 1 }} resizeMode="cover">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.overlay} />

          <View style={styles.card}>

            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image source={require('@/assets/images/logo4.png')} style={styles.logo} resizeMode="contain" />
            </View>

            {/* Toggle */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleBtn, isBarbeiro && styles.toggleBtnActive]}
                onPress={() => switchMode('barbeiro')}
              >
                <Text style={[styles.toggleText, isBarbeiro && styles.toggleTextActive]}>✂️ Barbeiro</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, !isBarbeiro && styles.toggleBtnActive]}
                onPress={() => switchMode('cliente')}
              >
                <Text style={[styles.toggleText, !isBarbeiro && styles.toggleTextActive]}>👤 Cliente</Text>
              </TouchableOpacity>
            </View>

            {/* Erro */}
            {!!error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={14} color={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* ── Botões OAuth — somente modo Cliente ── */}
            {!isBarbeiro && (
              <>
                <Text style={styles.oauthLabel}>Continuar com</Text>

                <TouchableOpacity
                  style={styles.btnGoogle}
                  onPress={handleGoogleLogin}
                  disabled={anyOAuth || loading}
                  activeOpacity={0.85}
                >
                  {oauthLoading === 'google'
                    ? <ActivityIndicator color="#1f2937" />
                    : (
                      <>
                        <Text style={styles.googleG}>G</Text>
                        <Text style={styles.btnGoogleText}>Continuar com Google</Text>
                      </>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.btnFacebook}
                  onPress={handleFacebookLogin}
                  disabled={anyOAuth || loading}
                  activeOpacity={0.85}
                >
                  {oauthLoading === 'facebook'
                    ? <ActivityIndicator color="#fff" />
                    : (
                      <>
                        <Text style={styles.facebookF}>f</Text>
                        <Text style={styles.btnFacebookText}>Continuar com Facebook</Text>
                      </>
                    )}
                </TouchableOpacity>

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>ou</Text>
                  <View style={styles.dividerLine} />
                </View>
              </>
            )}

            {/* E-mail */}
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

            {/* Senha */}
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="Senha"
                placeholderTextColor={Colors.gray[400]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                autoCorrect={false}
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(p => !p)}>
                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.gray[400]} />
              </TouchableOpacity>
            </View>

            {/* Acessar */}
            <TouchableOpacity
              style={[styles.btnPrimary, (loading || anyOAuth) && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={loading || anyOAuth}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={styles.btnPrimaryText}>ACESSAR</Text>}
            </TouchableOpacity>

            {/* Esqueceu a senha */}
            <TouchableOpacity
              onPress={() => router.push(
                isBarbeiro ? '/(auth)/forgot-password' : '/(auth)/client-forgot-password'
              )}
              style={styles.forgotBtn}
            >
              <Text style={styles.forgotText}>Esqueceu a Senha?</Text>
            </TouchableOpacity>

            {/* Divisor — barbeiro não tem OAuth, então mostra o divisor aqui */}
            {isBarbeiro && (
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>ou</Text>
                <View style={styles.dividerLine} />
              </View>
            )}

            {/* ✅ CRIAR CONTA — passa mode para o register */}
            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={() => router.push(`/(auth)/register?mode=${mode}`)}
              activeOpacity={0.85}
            >
              <Text style={styles.btnSecondaryText}>CRIAR CONTA</Text>
            </TouchableOpacity>

          </View>

          <Text style={styles.footer}>© 2025 BarberFlow. Todos os direitos reservados.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1, alignItems: 'center', justifyContent: 'center',
    padding: Spacing.md, paddingVertical: Spacing.xl,
  },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },

  card: {
    width: '100%', maxWidth: 420, backgroundColor: Colors.white,
    borderRadius: BorderRadius.xxl, padding: Spacing.lg, ...Shadow.lg,
  },

  logoContainer: { alignItems: 'center', marginBottom: Spacing.lg },
  logo:          { width: 220, height: 70 },

  toggleContainer: {
    flexDirection: 'row', backgroundColor: Colors.gray[100],
    borderRadius: BorderRadius.lg, padding: 4, marginBottom: Spacing.md,
  },
  toggleBtn:        { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: BorderRadius.md },
  toggleBtnActive:  { backgroundColor: Colors.white, ...Shadow.sm },
  toggleText:       { fontSize: 14, fontWeight: '500', color: Colors.gray[500] },
  toggleTextActive: { color: Colors.primary, fontWeight: '700' },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fef2f2', borderLeftWidth: 4, borderLeftColor: Colors.error,
    padding: Spacing.sm, borderRadius: BorderRadius.sm, marginBottom: Spacing.sm,
  },
  errorText: { color: Colors.error, fontSize: 13, flex: 1 },

  oauthLabel: { fontSize: 13, color: Colors.gray[500], textAlign: 'center', marginBottom: Spacing.sm },

  btnGoogle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.gray[300],
    borderRadius: BorderRadius.md, paddingVertical: 13, marginBottom: Spacing.sm, ...Shadow.sm,
  },
  googleG:       { fontSize: 18, fontWeight: '900', color: '#4285F4' },
  btnGoogleText: { color: '#1f2937', fontWeight: '600', fontSize: 15 },

  btnFacebook: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#1877f2', borderRadius: BorderRadius.md,
    paddingVertical: 13, marginBottom: Spacing.sm, ...Shadow.sm,
  },
  facebookF:      { fontSize: 18, fontWeight: '900', color: '#fff' },
  btnFacebookText: { color: '#fff', fontWeight: '600', fontSize: 15 },

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

  btnPrimary: {
    backgroundColor: Colors.navy, borderRadius: BorderRadius.md,
    paddingVertical: 14, alignItems: 'center', marginTop: Spacing.xs, ...Shadow.md,
  },
  btnDisabled:    { opacity: 0.6 },
  btnPrimaryText: { color: Colors.white, fontWeight: '700', fontSize: 16, letterSpacing: 0.5 },

  forgotBtn:  { alignItems: 'center', marginTop: Spacing.md },
  forgotText: { color: Colors.primary, fontWeight: '500', fontSize: 14 },

  divider: {
    flexDirection: 'row', alignItems: 'center',
    marginVertical: Spacing.md, gap: Spacing.sm,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.gray[300] },
  dividerText: { color: Colors.gray[500], fontSize: 13 },

  btnSecondary: {
    borderWidth: 2, borderColor: Colors.navy,
    borderRadius: BorderRadius.md, paddingVertical: 14, alignItems: 'center',
  },
  btnSecondaryText: { color: Colors.navy, fontWeight: '700', fontSize: 16, letterSpacing: 0.5 },

  footer: { marginTop: Spacing.lg, color: 'rgba(255,255,255,0.8)', fontSize: 12, textAlign: 'center' },
});