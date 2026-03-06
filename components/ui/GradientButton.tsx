import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, Shadow } from '@/constants/colors';

interface GradientButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  colors?: [string, string];
}

export function GradientButton({
  label, onPress,
  loading = false, disabled = false,
  fullWidth = false, style,
  colors = [Colors.gradientStart, Colors.gradientEnd],
}: GradientButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      style={[fullWidth && { width: '100%' }, isDisabled && { opacity: 0.5 }, style]}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.gradient, ...Shadow.md as any]}
      >
        {loading
          ? <ActivityIndicator color={Colors.white} />
          : <Text style={styles.text}>{label}</Text>
        }
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  gradient: {
    paddingVertical: 14, paddingHorizontal: 32,
    borderRadius: BorderRadius.md, alignItems: 'center',
  },
  text: { color: Colors.white, fontWeight: '700', fontSize: 16, letterSpacing: 0.5 },
});