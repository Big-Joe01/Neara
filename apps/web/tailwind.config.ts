import type { Config } from 'tailwindcss';
import { nearaColors, radii, shadows, fontFamily, fontSize, breakpoints, spacing, duration, easing } from '@neara/brand';

const config: Config = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand greens
        brand: {
          forest: nearaColors.forest,
          'forest-deep': nearaColors.forestDeep,
          'forest-light': nearaColors.forestLight,
          green: nearaColors.green,
          'green-dark': nearaColors.greenDark,
          'green-light': nearaColors.greenLight,
          'green-soft': nearaColors.greenSoft,
          lime: nearaColors.lime,
          'lime-dark': nearaColors.limeDark,
          'lime-light': nearaColors.limeLight,
          'bright-lime': nearaColors.brightLime,
        },
        // Dark mode ink surfaces
        ink: nearaColors.ink,
        inkSoft: nearaColors.inkSoft,
        inkPanel: nearaColors.inkPanel,
        inkBorder: nearaColors.inkBorder,
        // Light neutrals
        cloud: nearaColors.cloud,
        mist: nearaColors.mist,
        line: nearaColors.line,
        slate: nearaColors.slate,
        slateDark: nearaColors.slateDark,
        charcoal: nearaColors.charcoal,
        // Semantic
        success: { DEFAULT: nearaColors.success, bg: nearaColors.successBg },
        warning: { DEFAULT: nearaColors.warning, bg: nearaColors.warningBg },
        danger: { DEFAULT: nearaColors.danger, bg: nearaColors.dangerBg },
        info: { DEFAULT: nearaColors.info, bg: nearaColors.infoBg },
        // Theme-aware aliases (used with dark: variants)
        textPrimary: 'var(--neara-text-primary)',
        textSecondary: 'var(--neara-text-secondary)',
        textMuted: 'var(--neara-text-muted)',
        background: 'var(--neara-bg)',
        surface: 'var(--neara-surface)',
      },
      borderRadius: radii,
      boxShadow: shadows,
      fontFamily: {
        sans: fontFamily.sans.split(',').map((s) => s.trim().replace(/'/g, '')),
        display: fontFamily.display.split(',').map((s) => s.trim().replace(/'/g, '')),
        mono: fontFamily.mono.split(',').map((s) => s.trim().replace(/'/g, '')),
      },
      fontSize: Object.fromEntries(Object.entries(fontSize).map(([k, v]) => [k, [String(v) + 'px', '1.5']])),
      screens: Object.fromEntries(Object.entries(breakpoints).map(([k, v]) => [k, String(v) + 'px'])),
      spacing,
      transitionDuration: Object.fromEntries(Object.entries(duration).map(([k, v]) => [k, String(v)])),
      transitionTimingFunction: easing,
      animation: {
        slideUp: 'slideUp 0.2s ease-out',
        fadeIn: 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        slideUp: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
      },
    },
  },
  plugins: [],
};

export default config;
