import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function ClienteHome() {
  const { clientSignOut } = useAuthStore();

  async function handleLogout() {
    await clientSignOut();
    router.replace('/(auth)/login');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Área do Cliente</Text>
      <Text style={styles.subtitle}>Em desenvolvimento — em breve!</Text>

      <TouchableOpacity style={styles.btn} onPress={handleLogout}>
        <Text style={styles.btnText}>Sair / Trocar Conta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 40,
  },
  btn: {
    backgroundColor: '#003A5D',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});