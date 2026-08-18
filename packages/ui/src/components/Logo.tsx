import React from 'react';
import { brandAssets } from '@neara/brand';
import { cn } from '../cn.js';

export interface LogoProps {
  variant?: 'primary' | 'horizontal' | 'symbol' | 'wordmark' | 'white' | 'monochrome';
  className?: string;
  alt?: string;
}

const variantMap: Record<NonNullable<LogoProps['variant']>, keyof typeof brandAssets> = {
  primary: 'logoPrimary',
  horizontal: 'logoHorizontal',
  symbol: 'logoSymbol',
  wordmark: 'wordmark',
  white: 'logoWhite',
  monochrome: 'logoMonochrome',
};

export const Logo = ({ variant = 'primary', className, alt = 'NEARA — One tap from home' }: LogoProps) => {
  const src = brandAssets[variantMap[variant]];
  return (
    <img
      src={src}
      alt={alt}
      className={cn('inline-block h-auto w-auto max-h-24 max-w-full select-none', className)}
      draggable={false}
      loading="eager"
    />
  );
};
