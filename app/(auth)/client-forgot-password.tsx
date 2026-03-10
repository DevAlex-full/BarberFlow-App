import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform,
  ActivityIndicator, StyleSheet, Image,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing, Shadow } from '@/constants/colors';

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  'https://barberflow-back-end-19nv.onrender.com/api';

export default function ClientForgotPasswordScreen() {
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
      // ✅ POST /client/auth/forgot-password
      const res = await fetch(`${API_URL}/client/auth/forgot-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: emailClean }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao enviar.');
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar. Tente novamente.');
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
            <Ionicons name="mail-outline" size={32} color="#3b82f6" />
          </View>

          <Text style={styles.title}>Recuperar Senha</Text>
          <Text style={styles.subtitle}>
            Informe o e-mail da sua conta de cliente e enviaremos as instruções para redefinir sua senha.
          </Text>

          {/* Badge cliente */}
          <View style={styles.clientBadge}>
            <Ionicons name="person-outline" size={13} color="#0369a1" />
            <Text style={styles.clientBadgeText}>Recuperação de conta Cliente</Text>
          </View>

          {/* Sucesso */}
          {success ? (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <View style={{ flex: 1 }}>
                <Text style={styles.successTitle}>E-mail enviado!</Text>
                <Text style={styles.successText}>
                  Enviamos as instruções para{' '}
                  <Text style={{ fontWeight: '700' }}>{email}</Text>.{'\n'}
                  Verifique também a pasta de spam.
                </Text>
              </View>
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
                placeholder="Seu e-mail de cliente"
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
            <Ionicons name="arrow-back" size={16} color="#3b82f6" />
            <Text style={styles.backText}>Voltar para o login</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1, backgroundColor: '#0f172a',
    alignItems: 'center', justifyContent: 'center',
    padding: Spacing.md,
  },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },

  card: {
    width: '100%', maxWidth: 420,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.lg, ...Shadow.lg,
  },

  logo:    { width: 200, height: 60, alignSelf: 'center', marginBottom: Spacing.md },
  iconBox: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: Spacing.sm },

  title:    { fontSize: 24, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.sm, lineHeight: 20 },

  clientBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    backgroundColor: '#e0f2fe', borderRadius: BorderRadius.full,
    paddingHorizontal: 12, paddingVertical: 5, alignSelf: 'center', marginBottom: Spacing.md,
  },
  clientBadgeText: { fontSize: 12, fontWeight: '600', color: '#0369a1' },

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
  successTitle: { color: Colors.success, fontWeight: '700', fontSize: 14, marginBottom: 4 },
  successText:  { color: Colors.success, fontSize: 13, lineHeight: 19 },

  input: {
    backgroundColor: Colors.gray[50], borderWidth: 1, borderColor: Colors.gray[300],
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md,
    paddingVertical: 14, fontSize: 16, color: Colors.textPrimary, marginBottom: Spacing.sm,
  },

  btn:     { backgroundColor: '#3b82f6', borderRadius: BorderRadius.md, paddingVertical: 14, alignItems: 'center', ...Shadow.md },
  btnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },

  backBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: Spacing.md },
  backText: { color: '#3b82f6', fontSize: 14, fontWeight: '500' },
});