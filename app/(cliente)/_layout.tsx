import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function ClienteLayout() {
  const { clientUser, clientLoading } = useAuthStore();

  useEffect(() => {
    if (!clientLoading && !clientUser) {
      router.replace('/(auth)/login');
    }
  }, [clientUser, clientLoading]);

  if (clientLoading || !clientUser) return null;

  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}