import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Spacing, Shadow } from '@/constants/colors';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
}

export function Header({ title, subtitle, showBack = false, onBack, rightIcon, onRightPress }: HeaderProps) {
  function handleBack() {
    if (onBack) onBack();
    else router.back();
  }

  return (
    <View style={styles.header}>
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity onPress={handleBack} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.center}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {!!subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
      </View>

      <View style={styles.right}>
        {!!rightIcon && (
          <TouchableOpacity onPress={onRightPress} style={styles.iconBtn}>
            <Ionicons name={rightIcon} size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingTop: 52, paddingBottom: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    ...Shadow.sm,
  },
  left:   { width: 44 },
  center: { flex: 1, alignItems: 'center' },
  right:  { width: 44, alignItems: 'flex-end' },
  title:    { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  iconBtn:  { padding: 4 },
});