import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { Colors } from '@/constants/colors';

/**
 * Tela de entrada do app.
 * Decide para onde redirecionar:
 *   - Barbeiro autenticado   → /(barbeiro)
 *   - Super Admin autenticado → /(admin)
 *   - Cliente autenticado    → /(cliente)
 *   - Ninguém autenticado    → /(auth)/login
 */
export default function Index() {
  const { barberUser, clientUser } = useAuthStore();

  // Super Admin
  if (barberUser?.isSuperAdmin) {
    return <Redirect href="/(admin)" />;
  }

  // Barbeiro / Funcionário
  if (barberUser) {
    return <Redirect href="/(barbeiro)" />;
  }

  // Cliente
  if (clientUser) {
    return <Redirect href="/(cliente)" />;
  }

  // Não autenticado → Login
  return <Redirect href="/(auth)/login" />;
}