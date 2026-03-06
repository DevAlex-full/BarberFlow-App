import { useEffect } from 'react';
import { Tabs, router } from 'expo-router';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { Colors } from '@/constants/colors';

export default function BarberLayout() {
  const { barberUser, barbershop, barberSignOut } = useAuthStore();

  useEffect(() => {
    // ✅ Só redireciona se NÃO estiver logado como barbeiro
    // Super admin PODE acessar o dashboard da barbearia (tem o botão no admin)
    if (!barberUser) {
      router.replace('/(auth)/login');
    }
  }, [barberUser]);

  if (!barberUser) return null;

  async function handleSignOut() {
    await barberSignOut();
    router.replace('/(auth)/login');
  }

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: Colors.white },
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.gray[400],
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        headerRight: () => (
          <View style={styles.headerRightContainer}>
            {/* ✅ Super admin vê botão para voltar ao painel admin */}
            {barberUser.isSuperAdmin && (
              <TouchableOpacity
                onPress={() => router.replace('/(admin)')}
                style={styles.adminBtn}
              >
                <Ionicons name="shield-outline" size={20} color={Colors.primary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleSignOut} style={styles.logoutBtn}>
              <Ionicons name="log-out-outline" size={24} color={Colors.gray[600]} />
            </TouchableOpacity>
          </View>
        ),
        headerLeft: () => (
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Ionicons name="cut" size={16} color={Colors.white} />
            </View>
            <View>
              <Text style={styles.shopName} numberOfLines={1}>
                {barbershop?.name || 'Barbearia'}
              </Text>
              <Text style={styles.userName} numberOfLines={1}>
                {barberUser.name}
                {barberUser.isSuperAdmin ? ' ⚡' : ''}
              </Text>
            </View>
          </View>
        ),
      }}
    >
      {/* ── Tabs visíveis na barra inferior ─────────────────────────── */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Início',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="agendamentos"
        options={{
          title: 'Agendamentos',
          tabBarLabel: 'Agenda',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="clientes"
        options={{
          title: 'Clientes',
          tabBarLabel: 'Clientes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="financeiro/index"
        options={{
          title: 'Financeiro',
          tabBarLabel: 'Financeiro',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cash-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="configuracoes"
        options={{
          title: 'Configurações',
          tabBarLabel: 'Config',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />

      {/* ── Telas sem tab (ocultas na barra) ────────────────────────── */}
      <Tabs.Screen name="servicos"                     options={{ href: null, title: 'Serviços' }} />
      <Tabs.Screen name="localizacao"                  options={{ href: null, title: 'Localização' }} />
      <Tabs.Screen name="relatorios"                   options={{ href: null, title: 'Relatórios' }} />
      <Tabs.Screen name="analytics"                    options={{ href: null, title: 'Analytics' }} />
      <Tabs.Screen name="planos"                       options={{ href: null, title: 'Planos' }} />
      <Tabs.Screen name="financeiro/transacoes"        options={{ href: null, title: 'Transações' }} />
      <Tabs.Screen name="financeiro/comissoes"         options={{ href: null, title: 'Comissões' }} />
      <Tabs.Screen name="financeiro/metas"             options={{ href: null, title: 'Metas' }} />
      <Tabs.Screen name="relatorios-financeiros/index" options={{ href: null, title: 'Rel. Financeiros' }} />
      <Tabs.Screen name="landing-page/index"           options={{ href: null, title: 'Landing Page' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.white,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 8,
    paddingTop: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    gap: 4,
  },
  adminBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#faf5ff',
  },
  logoutBtn: {
    padding: 4,
    marginLeft: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
    gap: 8,
    maxWidth: 200,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  userName: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
});