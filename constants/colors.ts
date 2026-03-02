/**
 * BarberFlow App — Design Tokens
 * Fiel ao web: globals.css + tailwind.config.ts
 */

export const Colors = {
  // ✅ Cores principais (purple-600 e blue-600 do web)
  primary:   '#9333ea',
  primaryDark: '#7c3aed',
  accent:    '#2563eb',
  navy:      '#003A5D',

  // Gradiente principal (from-purple-600 to-blue-600)
  gradientStart: '#9333ea',
  gradientEnd:   '#2563eb',

  // ✅ Neutros
  white:     '#ffffff',
  black:     '#000000',
  gray: {
    50:  '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },

  // ✅ Semânticas
  success:   '#16a34a',
  successBg: '#f0fdf4',
  error:     '#dc2626',
  errorBg:   '#fef2f2',
  warning:   '#d97706',
  warningBg: '#fffbeb',
  info:      '#2563eb',
  infoBg:    '#eff6ff',

  // ✅ Área do Cliente (dark theme — fiel ao BarbershopCard.tsx)
  clientBg:     '#0d1117',
  clientCard:   '#161b22',
  clientBorder: '#30363d',
  clientText:   '#f0f6fc',
  clientMuted:  '#8b949e',

  // ✅ Background padrão (light)
  background: '#f9fafb',
  surface:    '#ffffff',
  border:     '#e5e7eb',

  // ✅ Texto
  textPrimary:   '#111827',
  textSecondary: '#6b7280',
  textMuted:     '#9ca3af',
};

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
};

export const BorderRadius = {
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 24,
  full: 9999,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
};