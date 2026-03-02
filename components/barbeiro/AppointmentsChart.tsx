import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Colors, BorderRadius, Shadow, Spacing } from '@/constants/colors';

interface Props {
  data: Array<{ date: string; count: number }>;
}

export function AppointmentsChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Sem dados de agendamentos</Text>
      </View>
    );
  }

  // Agrupa por semana para não ficar lotado
  const chartData = data
    .filter((_, i) => i % 5 === 0)
    .map(d => ({
      value: Number(d.count),
      label: d.date,
      frontColor: Colors.accent[600],
      topLabelComponent: () => (
        <Text style={styles.barLabel}>{d.count}</Text>
      ),
    }));

  const screenWidth = Dimensions.get('window').width - 64;

  return (
    <View style={styles.card}>
      <BarChart
        data={chartData}
        width={screenWidth}
        height={200}
        barWidth={18}
        spacing={12}
        roundedTop
        xAxisColor={Colors.border}
        yAxisColor={Colors.border}
        xAxisLabelTextStyle={styles.axisLabel}
        yAxisTextStyle={styles.axisLabel}
        noOfSections={4}
        rulesColor={Colors.border}
        rulesType="solid"
        hideRules={false}
        barBorderRadius={4}
        isAnimated
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  axisLabel: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  barLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  empty: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
});