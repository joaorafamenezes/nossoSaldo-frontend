import * as React from 'react';
import { formatCurrency, cn } from '../../lib/utils';
import { useAppStore } from '../../stores/useAppStore';

interface MoneyDisplayProps {
  value: number;
  type?: 'positive' | 'negative' | 'neutral';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  className?: string;
  showSign?: boolean;
}

export function MoneyDisplay({
  value,
  type = 'neutral',
  size = 'md',
  className,
  showSign = false,
}: MoneyDisplayProps) {
  const { isPrivacyMode } = useAppStore();

  const formatted = formatCurrency(Math.abs(value));
  const sign = value > 0 && showSign ? '+' : value < 0 && showSign ? '-' : '';

  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm font-semibold',
    md: 'text-base font-bold',
    lg: 'text-lg font-bold',
    xl: 'text-xl font-bold tracking-tight',
    '2xl': 'text-2xl font-extrabold tracking-tight',
    '3xl': 'text-3xl font-black tracking-tight',
  };

  const typeClasses = {
    positive: 'text-emerald-400',
    negative: 'text-rose-400',
    neutral: 'text-zinc-100',
  };

  if (isPrivacyMode) {
    return (
      <span
        className={cn(
          'font-mono select-none tracking-widest text-zinc-500 bg-zinc-800/40 px-2 py-0.5 rounded-lg border border-zinc-700/50',
          sizeClasses[size],
          className
        )}
      >
        ••••••
      </span>
    );
  }

  return (
    <span
      className={cn(
        'font-mono tracking-tight font-feature-settings',
        sizeClasses[size],
        typeClasses[type],
        className
      )}
    >
      {sign}
      {formatted}
    </span>
  );
}
