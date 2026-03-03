// ✅ Fiel à página de preços do web — 3 intervalos × 4 planos

export type PlanInterval = 'monthly' | 'semiannual' | 'annual';

export interface Plan {
  id: string;
  name: string;
  description: string;
  maxBarbers: number;
  highlighted?: boolean;

  // Preços por intervalo
  prices: {
    monthly:     { perMonth: number; total: number; discount: number };
    semiannual:  { perMonth: number; total: number; discount: number };
    annual:      { perMonth: number; total: number; discount: number };
  };

  features: string[];
}

export const plans: Plan[] = [
  {
    id: 'basic',
    name: '1 Profissional',
    description: 'Ideal para barbearias individuais',
    maxBarbers: 1,
    prices: {
      monthly:    { perMonth: 34.90,  total: 34.90,   discount: 0  },
      semiannual: { perMonth: 29.67,  total: 177.99,  discount: 15 },
      annual:     { perMonth: 34.90,  total: 418.80,  discount: 30 },
    },
    features: [
      '1 profissional',
      'Agendamento online',
      'Landing page completa',
      'Notificações por e-mail',
      'Suporte por e-mail',
    ],
  },
  {
    id: 'standard',
    name: '2 a 5 Profissionais',
    description: 'Mais popular — ideal para equipes pequenas',
    maxBarbers: 5,
    highlighted: true,
    prices: {
      monthly:    { perMonth: 48.90,  total: 48.90,   discount: 0  },
      semiannual: { perMonth: 41.59,  total: 249.51,  discount: 15 },
      annual:     { perMonth: 48.90,  total: 586.80,  discount: 30 },
    },
    features: [
      'Até 5 profissionais',
      'Agendamento online',
      'Landing page personalizada',
      'Notificações SMS + E-mail',
      'Relatórios básicos',
      'Suporte prioritário',
    ],
  },
  {
    id: 'premium',
    name: '6 a 15 Profissionais',
    description: 'Para barbearias em crescimento',
    maxBarbers: 15,
    prices: {
      monthly:    { perMonth: 75.60,  total: 75.60,   discount: 0  },
      semiannual: { perMonth: 64.26,  total: 385.56,  discount: 15 },
      annual:     { perMonth: 75.60,  total: 907.20,  discount: 30 },
    },
    features: [
      'Até 15 profissionais',
      'Agendamento online',
      'Landing page premium',
      'Notificações SMS + E-mail + WhatsApp',
      'Relatórios avançados',
      'Exportação de dados',
      'Suporte VIP 24/7',
    ],
  },
  {
    id: 'enterprise',
    name: '+15 Profissionais',
    description: 'Para grandes operações e múltiplas unidades',
    maxBarbers: -1,
    prices: {
      monthly:    { perMonth: 102.80, total: 102.80,  discount: 0  },
      semiannual: { perMonth: 87.38,  total: 524.28,  discount: 15 },
      annual:     { perMonth: 102.80, total: 1233.60, discount: 30 },
    },
    features: [
      'Profissionais ilimitados',
      'Múltiplas unidades',
      'API completa',
      'White label',
      'Relatórios personalizados',
      'Gerente de conta dedicado',
      'Suporte VIP 24/7',
    ],
  },
];

export const trialPlan = {
  id: 'trial',
  name: 'Trial',
  price: 0,
  description: '15 dias de teste grátis',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getPlanById(planId: string): Plan | undefined {
  return plans.find(p => p.id === planId);
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price);
}

export function getPlanPrice(plan: Plan, interval: PlanInterval) {
  return plan.prices[interval];
}

export function getPlanBadgeColor(planId: string): string {
  const colors: Record<string, string> = {
    trial:      '#6b7280',
    basic:      '#2563eb',
    standard:   '#9333ea',
    premium:    '#9333ea',
    enterprise: '#4f46e5',
  };
  return colors[planId] || colors.trial;
}

export function getIntervalLabel(interval: PlanInterval): string {
  const labels: Record<PlanInterval, string> = {
    monthly:    'Mensal',
    semiannual: 'Semestral',
    annual:     'Anual',
  };
  return labels[interval];
}

export function getIntervalDiscount(interval: PlanInterval): number {
  const discounts: Record<PlanInterval, number> = {
    monthly:    0,
    semiannual: 15,
    annual:     30,
  };
  return discounts[interval];
}