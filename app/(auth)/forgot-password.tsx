import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform,
  ActivityIndicator, StyleSheet, Image,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import api from '@/lib/api';
import { Colors, BorderRadius, Spacing, Shadow } from '@/constants/colors';

export default function ForgotPasswordScreen() {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState('');

  async function handleSend() {
    if (!email) { setError('Informe o e-mail.'); return; }
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao enviar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.overlay} />

        <View style={styles.card}>
          <Image source={require('@/assets/images/Logo.png')} style={styles.logo} resizeMode="contain" />

          <Text style={styles.title}>Recuperar Senha</Text>
          <Text style={styles.subtitle}>
            Informe seu e-mail e enviaremos as instruções para redefinir sua senha.
          </Text>

          {success ? (
            <View style={styles.successBox}>
              <Text style={styles.successText}>
                ✅ E-mail enviado! Verifique sua caixa de entrada.
              </Text>
            </View>
          ) : (
            <>
              {!!error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <TextInput
                style={styles.input}
                placeholder="Seu e-mail"
                placeholderTextColor={Colors.gray[400]}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TouchableOpacity
                style={[styles.btn, loading && { opacity: 0.6 }]}
                onPress={handleSend}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnText}>ENVIAR INSTRUÇÕES</Text>
                }
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Voltar para o login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1, backgroundColor: '#1a1a2e',
    alignItems: 'center', justifyContent: 'center',
    padding: Spacing.md,
  },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  card: {
    width: '100%', maxWidth: 420,
    backgroundColor: Colors.white, borderRadius: BorderRadius.xxl,
    padding: Spacing.lg, ...Shadow.lg,
  },
  logo: { width: 200, height: 60, alignSelf: 'center', marginBottom: Spacing.md },
  title: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.md, lineHeight: 20 },
  errorBox: { backgroundColor: '#fef2f2', borderLeftWidth: 4, borderLeftColor: Colors.error, padding: Spacing.sm, borderRadius: BorderRadius.sm, marginBottom: Spacing.sm },
  errorText: { color: Colors.error, fontSize: 13 },
  successBox: { backgroundColor: '#f0fdf4', borderLeftWidth: 4, borderLeftColor: Colors.success, padding: Spacing.md, borderRadius: BorderRadius.sm, marginBottom: Spacing.md },
  successText: { color: Colors.success, fontSize: 14, lineHeight: 20 },
  input: {
    backgroundColor: Colors.gray[50], borderWidth: 1, borderColor: Colors.gray[300],
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md,
    paddingVertical: 14, fontSize: 16, color: Colors.textPrimary, marginBottom: Spacing.sm,
  },
  btn: {
    backgroundColor: Colors.navy, borderRadius: BorderRadius.md,
    paddingVertical: 14, alignItems: 'center', ...Shadow.md,
  },
  btnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  backBtn: { alignItems: 'center', marginTop: Spacing.md },
  backText: { color: Colors.accent[600], fontSize: 14, fontWeight: '500' },
});