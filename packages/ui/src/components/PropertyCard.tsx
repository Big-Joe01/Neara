import React from 'react';
import type { Property } from '@neara/types';
import { cn } from '../cn.js';
import { formatPrice, electricityLabel, waterLabel } from '../format.js';
import { VerificationBadge, AgentBadge, Rating } from './Verification.js';

export interface PropertyCardProps {
  property: Property;
  onFavorite?: (id: string) => void;
  className?: string;
}

export const PropertyCard = ({ property, onFavorite, className }: PropertyCardProps) => {
  const { id, media, fees, location, propertyType, features, utilities, verification, listingSource, rentalPeriod, ratingAverage, ratingCount } = property;
  const cover = media.coverImage || media.images[0]?.url;
  return (
    <article
      className={cn(
        'group overflow-hidden rounded-lg border border-line bg-white shadow-sm transition-shadow hover:shadow-md dark:border-inkBorder dark:bg-inkSoft',
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-mist dark:bg-inkPanel">
        {cover ? (
          <img
            src={cover}
            alt={property.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
            </svg>
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {verification.nearaVerified && <VerificationBadge level="neara" />}
          <AgentBadge listingSource={listingSource} />
        </div>
        {onFavorite && (
          <button
            type="button"
            onClick={() => onFavorite(id)}
            aria-label={property.isFavorited ? 'Remove from saved' : 'Save property'}
            className={cn(
              'absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur transition-colors',
              property.isFavorited
                ? 'bg-danger text-white'
                : 'bg-white/80 text-charcoal hover:bg-white dark:bg-ink/70 dark:text-textPrimary',
            )}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={property.isFavorited ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
            </svg>
          </button>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-baseline justify-between gap-2">
          <p className="font-display text-lg font-bold text-charcoal dark:text-textPrimary">
            {formatPrice(fees.rent, rentalPeriod, true)}
          </p>
          {propertyType && (
            <span className="text-xs font-medium text-slate">{propertyType.name}</span>
          )}
        </div>

        <h3 className="mt-1 line-clamp-1 font-medium text-charcoal dark:text-textPrimary">{property.title}</h3>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" /><circle cx="12" cy="10" r="3" />
          </svg>
          {[location.area, location.city].filter(Boolean).join(', ') || location.state}
        </p>

        <div className="mt-2 flex items-center gap-3 text-xs text-slateDark dark:text-textSecondary">
          {features.bedrooms > 0 && <span>{features.bedrooms} bd</span>}
          {features.bathrooms > 0 && <span>{features.bathrooms} ba</span>}
          {ratingCount > 0 && <Rating value={ratingAverage} count={ratingCount} size={11} />}
        </div>

        <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate">
          {utilities.electricity !== 'none' && (
            <span className="inline-flex items-center gap-1">
              <span className="text-warning">⚡</span> {electricityLabel(utilities.electricity).replace(' electricity', '')}
            </span>
          )}
          {utilities.water !== 'none' && (
            <span className="inline-flex items-center gap-1">
              <span className="text-info">💧</span> {waterLabel(utilities.water).replace(' water', '')}
            </span>
          )}
        </div>
      </div>
    </article>
  );
};
