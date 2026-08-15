/**
 * NEARA Brand Design Tokens
 *
 * Colors are extracted from the official NEARA brand assets in /assets/brand.
 * This file is the single source of truth for the visual identity.
 * Change brand colors here once — they propagate to web, admin, mobile, and PDFs.
 *
 * Brand palette (sampled from `brand-color-palette.png` and `logo-symbol.png`):
 *  - Deep forest green (#006840) — primary logo symbol
 *  - Modern green (#1FB864)      — action / brand green
 *  - Lime accent   (#94C315)     — highlights, energy
 *  - Bright lime   (#C9F31E)     — limited, energetic accent
 *  - Dark base     (#002010)     — dark mode background
 */

export const nearaColors = {
  // Primary greens
  forest: '#006840',
  forestDeep: '#004f31',
  forestLight: '#0a7d4d',

  green: '#1FB864',
  greenDark: '#15924d',
  greenLight: '#3fc87f',
  greenSoft: '#e7f7ee',

  lime: '#94C315',
  limeDark: '#769b10',
  limeLight: '#b6dc3f',

  brightLime: '#C9F31E',

  // Dark mode base (deep near-black green, from brand dark app icon)
  ink: '#002010',
  inkSoft: '#0a261a',
  inkPanel: '#0e2e21',
  inkBorder: '#1c3d2e',

  // Neutrals (light mode)
  white: '#FFFFFF',
  cloud: '#F6F8F7',
  mist: '#EDF2EF',
  line: '#DCE5E0',
  slate: '#5A6B64',
  slateDark: '#3A4A43',
  charcoal: '#1B2421',
  black: '#0B100E',

  // Semantic
  success: '#1FB864',
  successBg: '#E7F7EE',
  warning: '#E8A33D',
  warningBg: '#FCF3E2',
  danger: '#D8473D',
  dangerBg: '#FBE9E7',
  info: '#2C8FD1',
  infoBg: '#E6F2FB',
} as const;

/** Light theme mapping used by Tailwind / RN. */
export const lightTheme = {
  background: nearaColors.white,
  surface: nearaColors.white,
  surfaceAlt: nearaColors.cloud,
  surfaceMuted: nearaColors.mist,
  border: nearaColors.line,
  textPrimary: nearaColors.charcoal,
  textSecondary: nearaColors.slate,
  textMuted: nearaColors.slate,
  primary: nearaColors.green,
  primaryDark: nearaColors.greenDark,
  primarySoft: nearaColors.greenSoft,
  accent: nearaColors.lime,
  brand: nearaColors.forest,
  brandDark: nearaColors.forestDeep,
} as const;

/** Dark theme — uses official NEARA dark-background branding. */
export const darkTheme = {
  background: nearaColors.ink,
  surface: nearaColors.inkSoft,
  surfaceAlt: nearaColors.inkPanel,
  surfaceMuted: '#10332a',
  border: nearaColors.inkBorder,
  textPrimary: '#EAF3EE',
  textSecondary: '#9DB5A9',
  textMuted: '#7A968B',
  primary: nearaColors.greenLight,
  primaryDark: nearaColors.green,
  primarySoft: '#0f3a28',
  accent: nearaColors.limeLight,
  brand: '#2bd086',
  brandDark: nearaColors.green,
} as const;

export const radii = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 28,
  pill: 999,
} as const;

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
} as const;

export const shadows = {
  xs: '0 1px 2px rgba(0,40,32,0.06)',
  sm: '0 2px 6px rgba(0,40,32,0.08)',
  md: '0 6px 18px rgba(0,40,32,0.10)',
  lg: '0 12px 32px rgba(0,40,32,0.14)',
  xl: '0 24px 60px rgba(0,40,32,0.18)',
} as const;

export const fontFamily = {
  sans: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
  display: "'Sora', 'Inter', system-ui, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
} as const;

export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export const duration = {
  fast: 150,
  base: 250,
  slow: 400,
} as const;

export const easing = {
  standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
  out: 'cubic-bezier(0, 0, 0.2, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

export type Theme = typeof lightTheme;
export type NearaColors = typeof nearaColors;

export const brandTokens = {
  colors: nearaColors,
  light: lightTheme,
  dark: darkTheme,
  radii,
  spacing,
  shadows,
  fontFamily,
  fontSize,
  breakpoints,
  duration,
  easing,
  brand: {
    name: 'NEARA',
    motto: 'One tap from home',
    primaryGreen: '#006840',
    accentLime: '#94C315',
  },
} as const;
