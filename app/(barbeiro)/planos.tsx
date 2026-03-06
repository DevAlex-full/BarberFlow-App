import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '@/lib/api';
import { plans, getPlanPrice, getIntervalLabel, formatPrice, type PlanInterval } from '@/lib/plans';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/colors';

interface CurrentPlan {
  plan:           string;
  interval:       string;
  status:         string;
  expiresAt?:     string;
  nextBillingAt?: string;
}

export default function PlanosScreen() {
  const [current,   setCurrent]   = useState<CurrentPlan | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [interval,  setInterval]  = useState<PlanInterval>('monthly');
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await api.get('/subscription/current');
      setCurrent(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleUpgrade(planId: string) {
    const plan = plans.find(p => p.id === planId);
    Alert.alert('Alterar Plano', `Deseja alterar para o plano ${plan?.name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Continuar',
        onPress: async () => {
          setUpgrading(planId);
          try {
            const res = await api.post('/subscription/checkout', { plan: planId, interval });
            if (res.data?.checkoutUrl) {
              Linking.openURL(res.data.checkoutUrl);
            } else {
              Alert.alert('Sucesso', 'Plano atualizado com sucesso!');
              load();
            }
          } catch {
            Alert.alert('Erro', 'Não foi possível processar. Tente pelo painel web.');
          } finally {
            setUpgrading(null);
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Planos</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Plano atual */}
        {current && (
          <View style={styles.currentCard}>
            <View style={styles.currentTop}>
              <Ionicons name="checkmark-circle" size={22} color={Colors.success} />
              <Text style={styles.currentLabel}>Plano Atual</Text>
            </View>
            <Text style={styles.currentPlan}>
              {plans.find(p => p.id === current.plan)?.name || current.plan}
            </Text>
            <Text style={styles.currentInterval}>
              {getIntervalLabel(current.interval as PlanInterval)} •{' '}
              <Text style={{ color: current.status === 'active' ? Colors.success : Colors.error }}>
                {current.status === 'active' ? 'Ativo' : 'Inativo'}
              </Text>
            </Text>
            {current.nextBillingAt && (
              <Text style={styles.currentNext}>
                Próxima cobrança: {new Date(current.nextBillingAt).toLocaleDateString('pt-BR')}
              </Text>
            )}
          </View>
        )}

        {/* Seletor de intervalo */}
        <View style={styles.intervalRow}>
          {([
            { key: 'monthly',    label: 'Mensal',    discount: ''    },
            { key: 'semiannual', label: 'Semestral', discount: '15%' },
            { key: 'annual',     label: 'Anual',     discount: '30%' },
          ] as { key: PlanInterval; label: string; discount: string }[]).map(i => (
            <TouchableOpacity
              key={i.key}
              style={[styles.intervalBtn, interval === i.key && styles.intervalBtnActive]}
              onPress={() => setInterval(i.key)}
            >
              <Text style={[styles.intervalText, interval === i.key && styles.intervalTextActive]}>
                {i.label}
              </Text>
              {!!i.discount && (
                <Text style={[styles.intervalDiscount, interval === i.key && { color: Colors.white }]}>
                  -{i.discount}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Cards de planos */}
        {plans.map(plan => {
          const price     = getPlanPrice(plan, interval);
          const isCurrent = current?.plan === plan.id;
          const isPopular = plan.highlighted === true;

          return (
            <View key={plan.id} style={[styles.planCard, isCurrent && styles.planCardActive, isPopular && styles.planCardPopular]}>
              {isPopular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>⭐ MAIS POPULAR</Text>
                </View>
              )}
              {isCurrent && (
                <View style={styles.currentBadge}>
                  <Text style={styles.currentBadgeText}>PLANO ATUAL</Text>
                </View>
              )}

              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planDesc}>{plan.description}</Text>

              <View style={styles.priceRow}>
                <Text style={styles.priceValue}>{formatPrice(price.perMonth)}</Text>
                <Text style={styles.priceLabel}>/mês</Text>
              </View>

              {interval !== 'monthly' && (
                <Text style={styles.priceTotal}>
                  Total: {formatPrice(price.total)} • Economia de {price.discount}%
                </Text>
              )}

              {/* Features */}
              <View style={styles.features}>
                {plan.features.slice(0, 4).map((f, idx) => (
                  <View key={idx} style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                    <Text style={styles.featureText}>{f}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.planBtn,
                  isCurrent && styles.planBtnCurrent,
                  isPopular && !isCurrent && styles.planBtnPopular,
                ]}
                onPress={() => { if (!isCurrent) handleUpgrade(plan.id); }}
                disabled={isCurrent || upgrading === plan.id}
              >
                {upgrading === plan.id
                  ? <ActivityIndicator color={Colors.white} size="small" />
                  : <Text style={[styles.planBtnText, isCurrent && styles.planBtnTextCurrent]}>
                      {isCurrent ? 'Plano Ativo' : 'Assinar'}
                    </Text>
                }
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.background },
  centered:   { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.white, paddingHorizontal: Spacing.md,
    paddingTop: 56, paddingBottom: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  content:     { padding: Spacing.md, gap: 16, paddingBottom: 40 },
  currentCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.md, ...Shadow.sm,
    borderWidth: 2, borderColor: Colors.success,
  },
  currentTop:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  currentLabel:    { fontSize: 13, fontWeight: '600', color: Colors.success },
  currentPlan:     { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  currentInterval: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  currentNext:     { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  intervalRow: {
    flexDirection: 'row', backgroundColor: Colors.gray[100],
    borderRadius: BorderRadius.lg, padding: 4,
  },
  intervalBtn:        { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: BorderRadius.md },
  intervalBtnActive:  { backgroundColor: Colors.primary },
  intervalText:       { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  intervalTextActive: { color: Colors.white },
  intervalDiscount:   { fontSize: 10, color: Colors.success, fontWeight: '700' },
  planCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.md, ...Shadow.sm,
    borderWidth: 1, borderColor: Colors.border, gap: 10,
  },
  planCardActive:  { borderColor: Colors.success, borderWidth: 2 },
  planCardPopular: { borderColor: Colors.primary, borderWidth: 2 },
  popularBadge: {
    alignSelf: 'flex-start', backgroundColor: Colors.primary,
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: BorderRadius.full,
  },
  popularText:   { fontSize: 10, fontWeight: '800', color: Colors.white, letterSpacing: 0.5 },
  currentBadge: {
    alignSelf: 'flex-start', backgroundColor: Colors.successBg,
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: BorderRadius.full,
  },
  currentBadgeText: { fontSize: 10, fontWeight: '800', color: Colors.success },
  planName:  { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  planDesc:  { fontSize: 13, color: Colors.textSecondary },
  priceRow:  { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  priceValue: { fontSize: 28, fontWeight: '700', color: Colors.primary },
  priceLabel: { fontSize: 14, color: Colors.textSecondary, paddingBottom: 4 },
  priceTotal: { fontSize: 12, color: Colors.success, fontWeight: '600' },
  features:   { gap: 6 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 13, color: Colors.textSecondary, flex: 1 },
  planBtn: {
    backgroundColor: Colors.gray[100], borderRadius: BorderRadius.md,
    paddingVertical: 12, alignItems: 'center',
  },
  planBtnCurrent: { backgroundColor: Colors.successBg },
  planBtnPopular: { backgroundColor: Colors.primary },
  planBtnText:         { fontSize: 15, fontWeight: '700', color: Colors.white },
  planBtnTextCurrent:  { color: Colors.success },
});