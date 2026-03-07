import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform,
  ActivityIndicator, StyleSheet, Image,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';
import { Colors, BorderRadius, Spacing, Shadow } from '@/constants/colors';

export default function ForgotPasswordScreen() {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState('');

  async function handleSend() {
    const emailClean = email.trim().toLowerCase();
    if (!emailClean) { setError('Informe o e-mail.'); return; }
    setError('');
    setLoading(true);
    try {
      // ✅ POST /auth/forgot-password
      await api.post('/auth/forgot-password', { email: emailClean });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao enviar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
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

        <View style={styles.card}>

          {/* Logo */}
          <Image
            source={require('@/assets/images/Logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          {/* Ícone */}
          <View style={styles.iconBox}>
            <Ionicons name="lock-closed-outline" size={32} color={Colors.primary} />
          </View>

          <Text style={styles.title}>Recuperar Senha</Text>
          <Text style={styles.subtitle}>
            Informe seu e-mail e enviaremos as instruções para redefinir sua senha.
          </Text>

          {/* Sucesso */}
          {success ? (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.successText}>
                E-mail enviado! Verifique sua caixa de entrada e a pasta de spam.
              </Text>
            </View>
          ) : (
            <>
              {!!error && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={14} color={Colors.error} />
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
                  ? <ActivityIndicator color={Colors.white} />
                  : <Text style={styles.btnText}>ENVIAR INSTRUÇÕES</Text>}
              </TouchableOpacity>
            </>
          )}

          {/* Voltar */}
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={16} color={Colors.primary} />
            <Text style={styles.backText}>Voltar para o login</Text>
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
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.lg, ...Shadow.lg,
  },

  logo:    { width: 200, height: 60, alignSelf: 'center', marginBottom: Spacing.md },
  iconBox: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#faf5ff', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: Spacing.sm },

  title:    { fontSize: 24, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.md, lineHeight: 20 },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fef2f2', borderLeftWidth: 4, borderLeftColor: Colors.error,
    padding: Spacing.sm, borderRadius: BorderRadius.sm, marginBottom: Spacing.sm,
  },
  errorText: { color: Colors.error, fontSize: 13, flex: 1 },

  successBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#f0fdf4', borderLeftWidth: 4, borderLeftColor: Colors.success,
    padding: Spacing.md, borderRadius: BorderRadius.sm, marginBottom: Spacing.md,
  },
  successText: { color: Colors.success, fontSize: 14, lineHeight: 20, flex: 1 },

  input: {
    backgroundColor: Colors.gray[50], borderWidth: 1, borderColor: Colors.gray[300],
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md,
    paddingVertical: 14, fontSize: 16, color: Colors.textPrimary, marginBottom: Spacing.sm,
  },

  btn:     { backgroundColor: Colors.navy, borderRadius: BorderRadius.md, paddingVertical: 14, alignItems: 'center', ...Shadow.md },
  btnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },

  backBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: Spacing.md },
  backText: { color: Colors.primary, fontSize: 14, fontWeight: '500' },
});