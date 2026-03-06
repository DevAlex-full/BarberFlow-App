import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { Colors } from '@/constants/colors';

/**
 * Tela de entrada do app.
 * Aguarda as sessões carregarem antes de redirecionar.
 *   - Super Admin autenticado → /(admin)
 *   - Barbeiro autenticado    → /(barbeiro)
 *   - Cliente autenticado     → /(cliente)
 *   - Ninguém autenticado     → /(auth)/login
 */
export default function Index() {
  const { barberUser, clientUser, barberLoading, clientLoading } = useAuthStore();

  // ✅ Aguarda ambas as sessões carregarem do SecureStore
  if (barberLoading || clientLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Super Admin → painel administrativo
  if (barberUser?.isSuperAdmin) {
    return <Redirect href="/(admin)" />;
  }

  // Barbeiro / Funcionário → painel da barbearia
  if (barberUser) {
    return <Redirect href="/(barbeiro)" />;
  }

  // Cliente → painel do cliente
  if (clientUser) {
    return <Redirect href="/(cliente)" />;
  }

  // Não autenticado → Login
  return <Redirect href="/(auth)/login" />;
}