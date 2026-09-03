import * as React from 'react';
import { Card } from '../ui/Card';
import { MoneyDisplay } from './MoneyDisplay';
import { ArrowUpRight, ArrowDownRight, LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StatCardProps {
  title: string;
  value: number;
  type?: 'positive' | 'negative' | 'neutral';
  subtitle?: string;
  icon?: LucideIcon;
  trendPercentage?: number;
  isPrivacyControlled?: boolean;
}

export function StatCard({
  title,
  value,
  type = 'neutral',
  subtitle,
  icon: Icon,
  trendPercentage,
}: StatCardProps) {
  const iconColorClasses = {
    positive: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    negative: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    neutral: 'bg-zinc-800 text-zinc-300 border-zinc-700',
  };

  return (
    <Card className="flex flex-col justify-between p-5 space-y-4 hover:border-zinc-700 transition-all duration-200">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          {title}
        </span>
        {Icon && (
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-xl border',
              iconColorClasses[type]
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div>
        <div className="flex items-baseline gap-2">
          <MoneyDisplay value={value} type={type} size="2xl" />
        </div>

        {(subtitle || trendPercentage !== undefined) && (
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-zinc-400">
            {trendPercentage !== undefined && (
              <span
                className={cn(
                  'flex items-center font-mono font-semibold',
                  trendPercentage >= 0 ? 'text-emerald-400' : 'text-rose-400'
                )}
              >
                {trendPercentage >= 0 ? (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                )}
                {Math.abs(trendPercentage)}%
              </span>
            )}
            {subtitle && <span className="truncate">{subtitle}</span>}
          </div>
        )}
      </div>
    </Card>
  );
}
