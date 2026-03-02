import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import '../global.css';
import { useAuthStore } from '@/stores/authStore';

// Mantém a splash screen enquanto carrega
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutos
    },
  },
});

export default function RootLayout() {
  const { loadBarberSession, loadClientSession, barberLoading, clientLoading } =
    useAuthStore();

  useEffect(() => {
    async function prepare() {
      // Restaura as sessões salvas no SecureStore
      await Promise.all([loadBarberSession(), loadClientSession()]);
      await SplashScreen.hideAsync();
    }
    prepare();
  }, []);

  // Aguarda carregamento das sessões
  if (barberLoading || clientLoading) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          {/* Tela inicial — decide para onde redirecionar */}
          <Stack.Screen name="index" />

          {/* Autenticação */}
          <Stack.Screen name="(auth)" />

          {/* Área do Barbeiro */}
          <Stack.Screen name="(barbeiro)" />

          {/* Área do Cliente */}
          <Stack.Screen name="(cliente)" />

          {/* Área do Admin */}
          <Stack.Screen name="(admin)" />
        </Stack>

        {/* Toast global (substitui alert() do web) */}
        <Toast />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}