import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/colors';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = 'alert-circle-outline',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={48} color={Colors.gray[300]} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {!!description && <Text style={styles.description}>{description}</Text>}
      {!!actionLabel && !!onAction && (
        <TouchableOpacity style={styles.btn} onPress={onAction} activeOpacity={0.85}>
          <Text style={styles.btnText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl, gap: 12 },
  iconBox:     {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.gray[100],
    alignItems: 'center', justifyContent: 'center',
  },
  title:       { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  description: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  btn: {
    marginTop: 8, backgroundColor: Colors.primary,
    paddingVertical: 12, paddingHorizontal: 24,
    borderRadius: BorderRadius.md, ...Shadow.sm,
  },
  btnText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
});