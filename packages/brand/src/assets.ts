/**
 * NEARA Brand Asset Registry
 *
 * References the real brand assets shipped in `/assets/brand`.
 * Apps import these paths instead of hard-coding filenames, so branding
 * can be changed from one location.
 */

export const brandAssets = {
  logoPrimary: '/brand/logo-primary.png',
  logoSecondary: '/brand/logo-secondary.png',
  logoHorizontal: '/brand/logo-horizontal.png',
  logoVertical: '/brand/logo-vertical.png',
  logoSymbol: '/brand/logo-symbol.png',
  logoSymbolWordmark: '/brand/logo-symbol-wordmark.png',
  wordmark: '/brand/wordmark.png',
  logoMonochrome: '/brand/logo-monochrome.png',
  logoBlack: '/brand/logo-black.png',
  logoWhite: '/brand/logo-white.png',
  appIcon: '/brand/app-icon.png',
  appIconLight: '/brand/app-icon-light.png',
  appIconDark: '/brand/app-icon-dark.png',
  favicon: '/brand/favicon.png',
  brandColorPalette: '/brand/brand-color-palette.png',
  brandIconStyle: '/brand/brand-icon-style.png',
  brandIllustrationStyle: '/brand/brand-illustration-style.png',
  brandPatternBackground: '/brand/brand-pattern-background.png',
  brandPhotographyStyle: '/brand/brand-photography-style.png',
  brandMood: '/brand/brand-mood.png',
  logoClearSpaceRules: '/brand/logo-clear-space-rules.png',
} as const;

export type BrandAssetKey = keyof typeof brandAssets;

export default brandAssets;
