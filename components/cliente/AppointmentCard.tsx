import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Colors, BorderRadius, Shadow, Spacing } from '@/constants/colors';
import { Badge } from '@/components/ui/Badge';

type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

interface ClientAppointmentCardProps {
  appointment: {
    id: string;
    date: string;
    status: AppointmentStatus;
    barbershop: { name: string };
    service:    { name: string; price: number; duration: number };
    barber:     { name: string };
  };
  onCancel?: (id: string) => void;
  onPress?:  (id: string) => void;
}

const STATUS_MAP: Record<AppointmentStatus, { label: string; variant: any }> = {
  pending:   { label: 'Pendente',   variant: 'warning' },
  confirmed: { label: 'Confirmado', variant: 'info'    },
  completed: { label: 'Concluído',  variant: 'success' },
  cancelled: { label: 'Cancelado',  variant: 'error'   },
};

export function AppointmentCard({ appointment: a, onCancel, onPress }: ClientAppointmentCardProps) {
  const status = STATUS_MAP[a.status];
  const date   = new Date(a.date);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress?.(a.id)}
      activeOpacity={onPress ? 0.75 : 1}
    >
      {/* Topo: barbearia + badge */}
      <View style={styles.top}>
        <View style={styles.shopIcon}>
          <Ionicons name="cut" size={20} color={Colors.primary} />
        </View>
        <View style={styles.topInfo}>
          <Text style={styles.shopName}>{a.barbershop.name}</Text>
          <Text style={styles.serviceName}>{a.service.name}</Text>
        </View>
        <Badge label={status.label} variant={status.variant} />
      </View>

      {/* Meio: data/hora/barbeiro/duração */}
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
          <Ionicons name="person-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.metaText}>{a.barber.name}</Text>
        </View>
      </View>

      {/* Rodapé: preço + cancelar */}
      <View style={styles.footer}>
        <Text style={styles.price}>R$ {Number(a.service.price).toFixed(2)}</Text>
        {!!onCancel && (a.status === 'pending' || a.status === 'confirmed') && (
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => onCancel(a.id)}
          >
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.md, ...Shadow.sm,
    borderWidth: 1, borderColor: Colors.border, gap: 12,
  },
  top:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  shopIcon: {
    width: 40, height: 40, borderRadius: BorderRadius.md,
    backgroundColor: '#faf5ff', alignItems: 'center', justifyContent: 'center',
  },
  topInfo:     { flex: 1 },
  shopName:    { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  serviceName: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  meta: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: Colors.textSecondary },
  footer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  price:      { fontSize: 16, fontWeight: '700', color: Colors.primary },
  cancelBtn:  { backgroundColor: Colors.errorBg, paddingHorizontal: 14, paddingVertical: 6, borderRadius: BorderRadius.md },
  cancelText: { fontSize: 13, fontWeight: '600', color: Colors.error },
});