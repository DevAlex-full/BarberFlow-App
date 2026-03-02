import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Colors, BorderRadius, Shadow, Spacing } from '@/constants/colors';

interface Props {
  data: Array<{ month: string; revenue: number }>;
}

export function RevenueChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Sem dados de receita</Text>
      </View>
    );
  }

  const chartData = data.map(d => ({
    value: Number(d.revenue),
    label: d.month,
    dataPointText: `R$${Number(d.revenue).toFixed(0)}`,
  }));

  const screenWidth = Dimensions.get('window').width - 64;

  return (
    <View style={styles.card}>
      <LineChart
        data={chartData}
        width={screenWidth}
        height={200}
        color={Colors.primary}
        thickness={3}
        dataPointsColor={Colors.primary}
        dataPointsRadius={5}
        startFillColor={Colors.primary}
        endFillColor={Colors.white}
        startOpacity={0.3}
        endOpacity={0.05}
        areaChart
        curved
        xAxisColor={Colors.border}
        yAxisColor={Colors.border}
        xAxisLabelTextStyle={styles.axisLabel}
        yAxisTextStyle={styles.axisLabel}
        noOfSections={4}
        rulesColor={Colors.border}
        rulesType="solid"
        yAxisTextNumberOfLines={1}
        formatYLabel={(v) => `R$${Number(v).toFixed(0)}`}
        hideDataPoints={false}
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