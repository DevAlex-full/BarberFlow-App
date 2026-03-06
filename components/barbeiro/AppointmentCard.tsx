import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Colors, BorderRadius, Shadow, Spacing } from '@/constants/colors';
import { Badge } from '@/components/ui/Badge';

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

interface AppointmentCardProps {
  appointment: {
    id: string;
    date: string;
    status: AppointmentStatus;
    customer: { name: string; phone?: string };
    service:  { name: string; price: number; duration: number };
    barber:   { name: string };
  };
  onConfirm?:  (id: string) => void;
  onComplete?: (id: string) => void;
  onCancel?:   (id: string) => void;
  onPress?:    (id: string) => void;
}

const STATUS_MAP: Record<AppointmentStatus, { label: string; variant: any }> = {
  pending:   { label: 'Pendente',   variant: 'warning' },
  confirmed: { label: 'Confirmado', variant: 'info'    },
  completed: { label: 'Concluído',  variant: 'success' },
  cancelled: { label: 'Cancelado',  variant: 'error'   },
};

export function AppointmentCard({ appointment: a, onConfirm, onComplete, onCancel, onPress }: AppointmentCardProps) {
  const status = STATUS_MAP[a.status];
  const date   = new Date(a.date);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress?.(a.id)}
      activeOpacity={onPress ? 0.75 : 1}
    >
      {/* Linha do topo: avatar + info + badge */}
      <View style={styles.top}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {a.customer.name.charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.customerName}>{a.customer.name}</Text>
          <Text style={styles.serviceName}>{a.service.name}</Text>
          <Text style={styles.barberName}>✂️ {a.barber.name}</Text>
        </View>

        <View style={styles.right}>
          <Badge label={status.label} variant={status.variant} />
          <Text style={styles.price}>R$ {Number(a.service.price).toFixed(2)}</Text>
        </View>
      </View>

      {/* Linha do meio: data/hora + duração */}
      <View style={styles.meta}>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.metaText}>
            {format(date, "dd 'de' MMM", { locale: ptBR })}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.metaText}>{format(date, 'HH:mm')}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="hourglass-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.metaText}>{a.service.duration} min</Text>
        </View>
      </View>

      {/* Ações rápidas — só para pendente/confirmado */}
      {a.status === 'pending' && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionConfirm]}
            onPress={() => onConfirm?.(a.id)}
          >
            <Ionicons name="checkmark" size={14} color={Colors.success} />
            <Text style={[styles.actionText, { color: Colors.success }]}>Confirmar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionCancel]}
            onPress={() => onCancel?.(a.id)}
          >
            <Ionicons name="close" size={14} color={Colors.error} />
            <Text style={[styles.actionText, { color: Colors.error }]}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      )}
      {a.status === 'confirmed' && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionComplete]}
            onPress={() => onComplete?.(a.id)}
          >
            <Ionicons name="checkmark-done" size={14} color={Colors.primary} />
            <Text style={[styles.actionText, { color: Colors.primary }]}>Concluir</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionCancel]}
            onPress={() => onCancel?.(a.id)}
          >
            <Ionicons name="close" size={14} color={Colors.error} />
            <Text style={[styles.actionText, { color: Colors.error }]}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.md, ...Shadow.sm,
    borderWidth: 1, borderColor: Colors.border,
    gap: 12,
  },
  top:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  avatar: {
    width: 46, height: 46, borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarText:    { color: Colors.white, fontWeight: '700', fontSize: 18 },
  info:          { flex: 1 },
  customerName:  { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  serviceName:   { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  barberName:    { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  right:         { alignItems: 'flex-end', gap: 4 },
  price:         { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  meta: {
    flexDirection: 'row', gap: 16,
    paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  metaItem:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText:  { fontSize: 12, color: Colors.textSecondary },
  actions:   { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: 8, borderRadius: BorderRadius.md, borderWidth: 1,
  },
  actionConfirm:  { backgroundColor: Colors.successBg, borderColor: Colors.success + '40' },
  actionComplete: { backgroundColor: '#faf5ff',         borderColor: Colors.primary + '40' },
  actionCancel:   { backgroundColor: Colors.errorBg,    borderColor: Colors.error + '40'   },
  actionText:     { fontSize: 13, fontWeight: '600' },
});