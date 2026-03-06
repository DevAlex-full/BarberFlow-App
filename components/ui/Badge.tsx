import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius } from '@/constants/colors';

type BadgeVariant = 'success' | 'error' | 'warning' | 'info' | 'purple' | 'gray';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

const MAP: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: Colors.successBg, text: Colors.success },
  error:   { bg: Colors.errorBg,   text: Colors.error   },
  warning: { bg: Colors.warningBg, text: Colors.warning  },
  info:    { bg: Colors.infoBg,    text: Colors.info     },
  purple:  { bg: '#faf5ff',        text: Colors.primary  },
  gray:    { bg: Colors.gray[100], text: Colors.gray[600]},
};

export function Badge({ label, variant = 'gray', style }: BadgeProps) {
  const c = MAP[variant];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }, style]}>
      <Text style={[styles.text, { color: c.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full, alignSelf: 'flex-start' },
  text:  { fontSize: 11, fontWeight: '700' },
});