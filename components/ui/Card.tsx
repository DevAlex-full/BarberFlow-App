import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Shadow, Spacing } from '@/constants/colors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'flat' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ children, style, variant = 'default', padding = 'md' }: CardProps) {
  return (
    <View style={[styles.base, variants[variant], paddings[padding], style]}>
      {children}
    </View>
  );
}

const styles  = StyleSheet.create({ base: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl } });
const variants = StyleSheet.create({
  default:  { borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  flat:     { borderWidth: 1, borderColor: Colors.border },
  elevated: { ...Shadow.lg },
});
const paddings = StyleSheet.create({
  none: { padding: 0 },
  sm:   { padding: Spacing.sm },
  md:   { padding: Spacing.md },
  lg:   { padding: Spacing.lg },
});