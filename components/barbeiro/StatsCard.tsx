import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Shadow, Spacing } from '@/constants/colors';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
  growth?: string;
  style?: ViewStyle;
}

export function StatsCard({ label, value, icon, color, bg, growth, style }: StatsCardProps) {
  const isPositive = growth ? parseFloat(growth) >= 0 : null;

  return (
    <View style={[styles.card, { backgroundColor: bg }, style]}>
      <View style={styles.top}>
        <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
        {growth !== undefined && isPositive !== null && (
          <View style={[styles.growthBadge, { backgroundColor: isPositive ? Colors.successBg : Colors.errorBg }]}>
            <Ionicons
              name={isPositive ? 'trending-up' : 'trending-down'}
              size={11}
              color={isPositive ? Colors.success : Colors.error}
            />
            <Text style={[styles.growthText, { color: isPositive ? Colors.success : Colors.error }]}>
              {isPositive ? '+' : ''}{growth}%
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, typeof value === 'string' && value.length > 8 && styles.valueSmall]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1, minWidth: '45%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  top:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  iconBox:  { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  growthBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  growthText:  { fontSize: 10, fontWeight: '700' },
  label:    { fontSize: 12, color: Colors.textSecondary, fontWeight: '500', marginBottom: 4 },
  value:    { fontSize: 24, fontWeight: '700', color: Colors.textPrimary },
  valueSmall: { fontSize: 18 },
});