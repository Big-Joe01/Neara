import React from 'react';
import { cn } from '../cn.js';

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn('animate-pulse rounded-md bg-mist dark:bg-inkPanel', className)} aria-hidden />
);

export const SkeletonText = ({ lines = 3, className }: { lines?: number; className?: string }) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} className={cn('h-3', i === lines - 1 ? 'w-2/3' : 'w-full')} />
    ))}
  </div>
);

export const PropertyCardSkeleton = () => (
  <div className="overflow-hidden rounded-lg border border-line dark:border-inkBorder">
    <Skeleton className="aspect-[4/3] w-full rounded-none" />
    <div className="space-y-3 p-4">
      <Skeleton className="h-5 w-1/3" />
      <SkeletonText lines={2} />
      <div className="flex gap-3">
        <Skeleton className="h-3 w-10" />
        <Skeleton className="h-3 w-10" />
      </div>
    </div>
  </div>
);
