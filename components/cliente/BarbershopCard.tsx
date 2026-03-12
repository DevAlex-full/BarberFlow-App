import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
const DEFAULT_LOGO = require('../../assets/images/logo4.png');
import { Ionicons } from '@expo/vector-icons';

interface BarbershopCardProps {
  barbershop: {
    id: string;
    name: string;
    description?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    logo?: string | null;
    rating?: number | null;
    totalReviews?: number | null;
    plan: string;
    phone?: string;
    distance?: number | null; // metros
  };
  variant?: 'vertical' | 'horizontal';
  onPress: () => void;
  onFavoriteToggle?: () => void;
  isFavorited?: boolean;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
}

function Avatar({ logo, size }: { logo?: string | null; size: 'sm' | 'lg' }) {
  const dim = size === 'lg' ? 56 : 48;
  const source = logo ? { uri: logo } : DEFAULT_LOGO;
  return (
    <Image
      source={source}
      style={{ width: dim, height: dim, borderRadius: dim / 2, backgroundColor: '#ffffff' }}
      resizeMode="contain"
    />
  );
}

export function BarbershopCard({
  barbershop: b,
  variant = 'vertical',
  onPress,
  onFavoriteToggle,
  isFavorited,
}: BarbershopCardProps) {
  // ── Horizontal (compacto, para carrossel) ───────────────────────────────
  if (variant === 'horizontal') {
    return (
      <TouchableOpacity style={styles.hCard} onPress={onPress} activeOpacity={0.85}>
        <Avatar logo={b.logo} size="sm" />
        <Text style={styles.hName} numberOfLines={1}>{b.name}</Text>
        {!!b.city && <Text style={styles.hCity} numberOfLines={1}>{b.city}</Text>}
        <View style={styles.hBottom}>
          {b.rating != null && (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={11} color="#f59e0b" />
              <Text style={styles.ratingBadgeText}>{b.rating.toFixed(1)}</Text>
            </View>
          )}
          {b.distance != null && (
            <View style={styles.distRow}>
              <Ionicons name="location-outline" size={11} color="#9ca3af" />
              <Text style={styles.distText}>{formatDistance(b.distance)}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  // ── Vertical (padrão, igual ao web) ────────────────────────────────────
  return (
    <TouchableOpacity style={styles.vCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.vInner}>
        {/* Logo circular */}
        <Avatar logo={b.logo} size="lg" />

        {/* Info */}
        <View style={styles.vInfo}>
          <Text style={styles.vName} numberOfLines={1}>{b.name}</Text>
          {(!!b.address || !!b.city) && (
            <Text style={styles.vAddress} numberOfLines={1}>
              {[b.address, b.city].filter(Boolean).join(', ')}
            </Text>
          )}
          {b.distance != null && (
            <View style={styles.distanceRow}>
              <Ionicons name="navigate-outline" size={12} color="#2563eb" />
              <Text style={styles.distanceText}>{formatDistance(b.distance)}</Text>
            </View>
          )}
        </View>

        {/* Ações (rating + coração + seta) */}
        <View style={styles.vActions}>
          {/* Rating badge — igual ao web: pill amarelo */}
          {b.rating != null && (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color="#f59e0b" />
              <Text style={styles.ratingBadgeText}>{b.rating.toFixed(1)}</Text>
            </View>
          )}
          <View style={styles.actionsBottom}>
            {!!onFavoriteToggle && (
              <TouchableOpacity onPress={onFavoriteToggle} style={styles.heartBtn}>
                <Ionicons
                  name={isFavorited ? 'heart' : 'heart-outline'}
                  size={20}
                  color={isFavorited ? '#f87171' : '#9ca3af'}
                />
              </TouchableOpacity>
            )}
            {/* Seta verde — igual ao web */}
            <View style={styles.arrowBtn}>
              <Ionicons name="chevron-forward" size={16} color="#ffffff" />
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // ── Horizontal ──────────────────────────────────────────────────────────
  hCard: {
    width: 120, alignItems: 'center', gap: 6,
    backgroundColor: '#151b23', borderRadius: 16,
    padding: 10, borderWidth: 1, borderColor: '#1f2937',
  },
  hName:  { fontSize: 12, fontWeight: '700', color: '#ffffff', textAlign: 'center' },
  hCity:  { fontSize: 11, color: '#9ca3af', textAlign: 'center' },
  hBottom:{ flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' },

  // ── Vertical ────────────────────────────────────────────────────────────
  vCard: {
    backgroundColor: '#0d1117',
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#1f2937',
  },
  vInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  vInfo:  { flex: 1 },
  vName:  { fontSize: 16, fontWeight: '700', color: '#ffffff' },
  vAddress: { fontSize: 13, color: '#9ca3af', marginTop: 3 },
  distanceRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  distanceText: { fontSize: 12, color: '#2563eb', fontWeight: '600' },

  vActions: { alignItems: 'flex-end', gap: 8 },
  actionsBottom: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  heartBtn: { padding: 2 },

  // Seta verde — igual ao web
  arrowBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#10b981',
    alignItems: 'center', justifyContent: 'center',
  },

  // Rating badge amarelo — igual ao web
  ratingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)',
  },
  ratingBadgeText: { fontSize: 12, fontWeight: '700', color: '#f59e0b' },

  // Shared
  distRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  distText: { fontSize: 11, color: '#9ca3af' },
});