// ✅ Cópia exata de lib/utils/plans.ts do web
// Reutilizando lógica de negócio sem alterações

export interface Plan {
  id: string;
  name: string;
  price: number;
  interval: 'monthly' | 'yearly';
  maxBarbers: number;
  maxServices: number;
  maxClients: number;
  features: string[];
  highlighted?: boolean;
}

export const plans: Plan[] = [
  {
    id: 'trial',
    name: 'Trial',
    price: 0,
    interval: 'monthly',
    maxBarbers: 1,
    maxServices: 10,
    maxClients: 50,
    features: [
      '1 barbeiro',
      'Até 10 serviços',
      'Até 50 clientes',
      'Agendamento básico',
      'Landing page simples',
      '7 dias de teste grátis'
    ]
  },
  {
    id: 'basic',
    name: 'Básico',
    price: 29.90,
    interval: 'monthly',
    maxBarbers: 1,
    maxServices: 20,
    maxClients: 200,
    features: [
      '1 barbeiro',
      'Até 20 serviços',
      'Até 200 clientes',
      'Agendamento online',
      'Landing page completa',
      'Notificações por e-mail',
      'Suporte por e-mail'
    ]
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 79.90,
    interval: 'monthly',
    maxBarbers: 5,
    maxServices: 50,
    maxClients: 1000,
    features: [
      'Até 5 barbeiros',
      'Até 50 serviços',
      'Até 1.000 clientes',
      'Agendamento online',
      'Landing page personalizada',
      'Notificações SMS + E-mail',
      'Relatórios básicos',
      'Suporte prioritário'
    ],
    highlighted: true
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 149.90,
    interval: 'monthly',
    maxBarbers: 15,
    maxServices: -1,
    maxClients: -1,
    features: [
      'Até 15 barbeiros',
      'Serviços ilimitados',
      'Clientes ilimitados',
      'Agendamento online',
      'Landing page premium',
      'Notificações SMS + E-mail + WhatsApp',
      'Relatórios avançados',
      'Exportação de dados',
      'Suporte VIP 24/7'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 299.90,
    interval: 'monthly',
    maxBarbers: -1,
    maxServices: -1,
    maxClients: -1,
    features: [
      'Barbeiros ilimitados',
      'Serviços ilimitados',
      'Clientes ilimitados',
      'Múltiplas unidades',
      'API completa',
      'White label',
      'Relatórios personalizados',
      'Gerente de conta dedicado',
      'Suporte VIP 24/7'
    ]
  }
];

export function getPlanById(planId: string): Plan | undefined {
  return plans.find(p => p.id === planId);
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(price);
}

export function getPlanBadgeColor(planId: string): string {
  const colors: Record<string, string> = {
    trial:      '#6b7280',
    basic:      '#2563eb',
    standard:   '#9333ea',
    premium:    '#9333ea',
    enterprise: '#4f46e5'
  };
  return colors[planId] || colors.trial;
}