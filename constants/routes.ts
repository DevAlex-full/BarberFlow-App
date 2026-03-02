/**
 * BarberFlow App — Rotas centralizadas
 * Espelho das rotas do web Next.js
 */

export const Routes = {
  // ── Auth ────────────────────────────────
  LOGIN:           '/(auth)/login',
  REGISTER:        '/(auth)/register',
  FORGOT_PASSWORD: '/(auth)/forgot-password',

  // ── Barbeiro (Dashboard) ─────────────────
  BARBER_HOME:          '/(barbeiro)',
  BARBER_AGENDAMENTOS:  '/(barbeiro)/agendamentos',
  BARBER_CLIENTES:      '/(barbeiro)/clientes',
  BARBER_SERVICOS:      '/(barbeiro)/servicos',
  BARBER_FINANCEIRO:    '/(barbeiro)/financeiro',
  BARBER_TRANSACOES:    '/(barbeiro)/financeiro/transacoes',
  BARBER_COMISSOES:     '/(barbeiro)/financeiro/comissoes',
  BARBER_METAS:         '/(barbeiro)/financeiro/metas',
  BARBER_RELATORIOS:    '/(barbeiro)/relatorios',
  BARBER_ANALYTICS:     '/(barbeiro)/analytics',
  BARBER_LOCALIZACAO:   '/(barbeiro)/localizacao',
  BARBER_CONFIG:        '/(barbeiro)/configuracoes',
  BARBER_PLANOS:        '/(barbeiro)/planos',

  // ── Cliente ──────────────────────────────
  CLIENT_HOME:          '/(cliente)',
  CLIENT_BARBEARIA:     '/(cliente)/barbearia/[id]',
  CLIENT_AGENDAMENTOS:  '/(cliente)/agendamentos',
  CLIENT_FAVORITOS:     '/(cliente)/favoritos',
  CLIENT_PERFIL:        '/(cliente)/perfil',

  // ── Admin ────────────────────────────────
  ADMIN_HOME:           '/(admin)',
  ADMIN_BARBEARIAS:     '/(admin)/barbearias',
  ADMIN_PAGAMENTOS:     '/(admin)/pagamentos',
} as const;