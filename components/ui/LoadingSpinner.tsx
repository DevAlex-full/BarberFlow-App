import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'large';
  fullScreen?: boolean;
}

export function LoadingSpinner({ message, size = 'large', fullScreen = true }: LoadingSpinnerProps) {
  return (
    <View style={[styles.container, fullScreen && styles.full]}>
      <ActivityIndicator size={size} color={Colors.primary} />
      {!!message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  full:      { flex: 1 },
  message:   { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
});