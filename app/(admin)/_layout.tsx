import { useEffect } from 'react';
import { Tabs, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { Colors } from '@/constants/colors';

export default function AdminLayout() {
  const { barberUser, barberLoading } = useAuthStore();

  useEffect(() => {
    if (!barberLoading && !barberUser?.isSuperAdmin) {
      router.replace('/(auth)/login');
    }
  }, [barberUser, barberLoading]);

  if (barberLoading || !barberUser?.isSuperAdmin) return null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.gray[400],
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Início',
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="barbearias"
        options={{
          title: 'Barbearias',
          tabBarLabel: 'Barbearias',
          tabBarIcon: ({ color, size }) => <Ionicons name="storefront-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="pagamentos"
        options={{
          title: 'Pagamentos',
          tabBarLabel: 'Pagamentos',
          tabBarIcon: ({ color, size }) => <Ionicons name="card-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}