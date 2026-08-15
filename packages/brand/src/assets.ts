/**
 * NEARA Brand Asset Registry
 *
 * References the real brand assets shipped in `/assets/brand`.
 * Apps import these paths instead of hard-coding filenames, so branding
 * can be changed from one location.
 */

export const brandAssets = {
  logoPrimary: 'assets/brand/logo-primary.png',
  logoSecondary: 'assets/brand/logo-secondary.png',
  logoHorizontal: 'assets/brand/logo-horizontal.png',
  logoVertical: 'assets/brand/logo-vertical.png',
  logoSymbol: 'assets/brand/logo-symbol.png',
  logoSymbolWordmark: 'assets/brand/logo-symbol-wordmark.png',
  wordmark: 'assets/brand/wordmark.png',
  logoMonochrome: 'assets/brand/logo-monochrome.png',
  logoBlack: 'assets/brand/logo-black.png',
  logoWhite: 'assets/brand/logo-white.png',
  appIcon: 'assets/brand/app-icon.png',
  appIconLight: 'assets/brand/app-icon-light.png',
  appIconDark: 'assets/brand/app-icon-dark.png',
  favicon: 'assets/brand/favicon.png',
  brandColorPalette: 'assets/brand/brand-color-palette.png',
  brandIconStyle: 'assets/brand/brand-icon-style.png',
  brandIllustrationStyle: 'assets/brand/brand-illustration-style.png',
  brandPatternBackground: 'assets/brand/brand-pattern-background.png',
  brandPhotographyStyle: 'assets/brand/brand-photography-style.png',
  brandMood: 'assets/brand/brand-mood.png',
  logoClearSpaceRules: 'assets/brand/logo-clear-space-rules.png',
} as const;

export type BrandAssetKey = keyof typeof brandAssets;

export default brandAssets;
