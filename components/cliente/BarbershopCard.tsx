import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Shadow, Spacing } from '@/constants/colors';
import { Badge } from '@/components/ui/Badge';

interface BarbershopCardProps {
  barbershop: {
    id: string;
    name: string;
    description?: string;
    address?: string;
    city?: string;
    rating?: number;
    totalReviews?: number;
    plan: string;
  };
  variant?: 'vertical' | 'horizontal';
  onPress: () => void;
  onFavoriteToggle?: () => void;
  isFavorited?: boolean;
}

const PLAN_LABELS: Record<string, string> = {
  trial:      'Trial',
  basic:      'Básico',
  standard:   'Standard',
  premium:    'Premium',
  enterprise: 'Enterprise',
};

const PLAN_VARIANTS: Record<string, any> = {
  trial:      'gray',
  basic:      'info',
  standard:   'purple',
  premium:    'purple',
  enterprise: 'purple',
};

export function BarbershopCard({ barbershop: b, variant = 'vertical', onPress, onFavoriteToggle, isFavorited }: BarbershopCardProps) {
  if (variant === 'horizontal') {
    return (
      <TouchableOpacity style={styles.hCard} onPress={onPress} activeOpacity={0.85}>
        <View style={styles.hAvatar}>
          <Text style={styles.hAvatarText}>{b.name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.hName} numberOfLines={1}>{b.name}</Text>
        {!!b.city && <Text style={styles.hCity} numberOfLines={1}>{b.city}</Text>}
        {!!b.rating && (
          <View style={styles.hRating}>
            <Ionicons name="star" size={12} color="#f59e0b" />
            <Text style={styles.hRatingText}>{b.rating.toFixed(1)}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.vCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.vTop}>
        <View style={styles.vAvatar}>
          <Text style={styles.vAvatarText}>{b.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.vInfo}>
          <View style={styles.vNameRow}>
            <Text style={styles.vName} numberOfLines={1}>{b.name}</Text>
            <Badge label={PLAN_LABELS[b.plan] || b.plan} variant={PLAN_VARIANTS[b.plan] || 'gray'} />
          </View>
          {!!b.description && <Text style={styles.vDesc} numberOfLines={2}>{b.description}</Text>}
          {(!!b.address || !!b.city) && (
            <View style={styles.vLocation}>
              <Ionicons name="location-outline" size={13} color={Colors.textSecondary} />
              <Text style={styles.vLocationText} numberOfLines={1}>
                {[b.address, b.city].filter(Boolean).join(', ')}
              </Text>
            </View>
          )}
        </View>
        {!!onFavoriteToggle && (
          <TouchableOpacity onPress={onFavoriteToggle} style={styles.favBtn}>
            <Ionicons
              name={isFavorited ? 'heart' : 'heart-outline'}
              size={22}
              color={isFavorited ? Colors.error : Colors.gray[400]}
            />
          </TouchableOpacity>
        )}
      </View>
      {!!b.rating && (
        <View style={styles.vBottom}>
          <View style={styles.vRating}>
            <Ionicons name="star" size={14} color="#f59e0b" />
            <Text style={styles.vRatingText}>{b.rating.toFixed(1)}</Text>
            <Text style={styles.vReviews}>({b.totalReviews || 0} avaliações)</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Horizontal
  hCard: {
    width: 120, alignItems: 'center', gap: 6,
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.sm, ...Shadow.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  hAvatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  hAvatarText: { fontSize: 22, fontWeight: '700', color: Colors.white },
  hName:       { fontSize: 12, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  hCity:       { fontSize: 11, color: Colors.textSecondary, textAlign: 'center' },
  hRating:     { flexDirection: 'row', alignItems: 'center', gap: 2 },
  hRatingText: { fontSize: 11, fontWeight: '700', color: Colors.textPrimary },

  // Vertical
  vCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.md, ...Shadow.sm,
    borderWidth: 1, borderColor: Colors.border, gap: 10,
  },
  vTop:    { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  vAvatar: {
    width: 52, height: 52, borderRadius: 12,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  vAvatarText: { fontSize: 22, fontWeight: '700', color: Colors.white },
  vInfo:       { flex: 1 },
  vNameRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  vName:       { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  vDesc:       { fontSize: 13, color: Colors.textSecondary, marginTop: 4, lineHeight: 18 },
  vLocation:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  vLocationText: { fontSize: 12, color: Colors.textSecondary, flex: 1 },
  favBtn:      { padding: 4 },
  vBottom:     { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 8 },
  vRating:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  vRatingText: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  vReviews:    { fontSize: 12, color: Colors.textSecondary },
});