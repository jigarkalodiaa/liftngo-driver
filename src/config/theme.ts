/**
 * Design tokens — keep in sync with `src/app/globals.css` `:root` / `@theme inline`.
 * Same palette as customer app (`liftngotest`) for one Liftngo brand.
 */
export const colors = {
  primary: '#2C2D5B',
  primaryHover: '#23244a',
  landingPrimary: '#2C2D5B',
  whatsappGreen: '#25D366',
  white: '#FFFFFF',
  black: '#171717',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  success: '#10B981',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  border: '#D1D5DB',
  borderLight: '#E5E7EB',
  textPrimary: '#2F2E41',
  textSecondary: '#6E6D7A',
  textMuted: '#6B7280',
  surface: '#F8FAFC',
  surfaceMuted: '#FAFAFA',
  primaryTint: '#ECECF4',
  warningBg: '#FFFBEB',
  warningBorder: '#FDE68A',
} as const;

export const fontSizes = {
  xs: '0.75rem',
  sm: '0.8125rem',
  base: '0.875rem',
  md: '0.9375rem',
  lg: '1rem',
  xl: '1.125rem',
  '2xl': '1.25rem',
  '3xl': '1.5rem',
  '4xl': '1.75rem',
} as const;

export const radius = {
  standard: '10px',
} as const;

export const theme = {
  colors,
  fontSizes,
  radius,
} as const;

export default theme;
