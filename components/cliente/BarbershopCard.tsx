import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
const DEFAULT_LOGO = require('../../assets/images/logo4.png');
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '@/components/ui/Badge';

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
    distance?: number | null; // ✅ metros
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

// Formatar distância: < 1000m → "450 m" | >= 1000m → "2,3 km"
function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
}

// Avatar: mostra logo se existir, senão inicial
function Avatar({ logo, name, size }: { logo?: string | null; name: string; size: 'sm' | 'lg' }) {
  const dim  = size === 'lg' ? 52 : 56;
  const rad  = size === 'lg' ? 12 : dim / 2;

  // Sempre exibe logo: a da barbearia se existir, senão a logo padrão do BarberFlow
  const source = logo ? { uri: logo } : DEFAULT_LOGO;

  return (
    <Image
      source={source}
      style={{ width: dim, height: dim, borderRadius: rad, backgroundColor: '#1f2937' }}
      resizeMode="contain"
    />
  );
}

export function BarbershopCard({ barbershop: b, variant = 'vertical', onPress, onFavoriteToggle, isFavorited }: BarbershopCardProps) {
  if (variant === 'horizontal') {
    return (
      <TouchableOpacity style={styles.hCard} onPress={onPress} activeOpacity={0.85}>
        <Avatar logo={b.logo} name={b.name} size="sm" />
        <Text style={styles.hName} numberOfLines={1}>{b.name}</Text>
        {!!b.city && <Text style={styles.hCity} numberOfLines={1}>{b.city}</Text>}
        <View style={styles.hBottom}>
          {!!b.rating && (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={11} color="#f59e0b" />
              <Text style={styles.hRatingText}>{b.rating.toFixed(1)}</Text>
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

  return (
    <TouchableOpacity style={styles.vCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.vTop}>
        <Avatar logo={b.logo} name={b.name} size="lg" />
        <View style={styles.vInfo}>
          <View style={styles.vNameRow}>
            <Text style={styles.vName} numberOfLines={1}>{b.name}</Text>
            {/* Badge de plano removido conforme design web */}
          </View>
          {!!b.description && <Text style={styles.vDesc} numberOfLines={2}>{b.description}</Text>}
          {(!!b.address || !!b.city) && (
            <View style={styles.vLocation}>
              <Ionicons name="location-outline" size={13} color={'#9ca3af'} />
              <Text style={styles.vLocationText} numberOfLines={1}>
                {[b.address, b.city].filter(Boolean).join(', ')}
              </Text>
            </View>
          )}
          {b.distance != null && (
            <View style={styles.vLocation}>
              <Ionicons name="navigate-outline" size={13} color={'#2563eb'} />
              <Text style={[styles.vLocationText, { color: '#2563eb' }]}>
                {formatDistance(b.distance)}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.vActions}>
          {!!onFavoriteToggle && (
            <TouchableOpacity onPress={onFavoriteToggle} style={styles.favBtn}>
              <Ionicons
                name={isFavorited ? 'heart' : 'heart-outline'}
                size={20}
                color={isFavorited ? '#f87171' : '#9ca3af'}
              />
            </TouchableOpacity>
          )}
          <View style={styles.arrowBtn}>
            <Ionicons name="chevron-forward" size={16} color="#ffffff" />
          </View>
        </View>
      </View>
      {!!b.rating && (
        <View style={styles.vBottom}>
          <View style={styles.ratingRow}>
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
    backgroundColor: '#151b23', borderRadius: 16,
    padding: 8,
    borderWidth: 1, borderColor: '#1f2937',
  },
  hName:      { fontSize: 12, fontWeight: '700', color: '#ffffff', textAlign: 'center' },
  hCity:      { fontSize: 11, color: '#9ca3af', textAlign: 'center' },
  hBottom:    { flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' },
  hRatingText:{ fontSize: 11, fontWeight: '700', color: '#ffffff' },

  // Vertical
  vCard: {
    backgroundColor: '#151b23', borderRadius: 16,
    padding: 16,
    borderWidth: 1, borderColor: '#1f2937', gap: 10,
  },
  vTop:         { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  vInfo:        { flex: 1 },
  vNameRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  vName:        { fontSize: 16, fontWeight: '700', color: '#2563eb' },
  vDesc:        { fontSize: 13, color: '#9ca3af', marginTop: 4, lineHeight: 18 },
  vLocation:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  vLocationText:{ fontSize: 12, color: '#9ca3af', flex: 1 },
  favBtn:       { padding: 4 },
  vActions:     { flexDirection: 'column', alignItems: 'center', gap: 8 },
  arrowBtn:     { width: 28, height: 28, borderRadius: 14, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center' },
  vBottom:      { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#1f2937', paddingTop: 8 },
  vRatingText:  { fontSize: 13, fontWeight: '700', color: '#ffffff' },
  vReviews:     { fontSize: 12, color: '#9ca3af' },

  // Shared
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  distRow:   { flexDirection: 'row', alignItems: 'center', gap: 2 },
  distText:  { fontSize: 11, color: '#9ca3af' },
});