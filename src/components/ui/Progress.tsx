import * as React from 'react';
import { cn } from '../../lib/utils';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  indicatorColor?: string;
}

export function Progress({ value, max = 100, indicatorColor = 'bg-emerald-500', className, ...props }: ProgressProps) {
  const percentage = Math.min(Math.max(0, (value / max) * 100), 100);

  return (
    <div
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-zinc-800', className)}
      {...props}
    >
      <div
        className={cn('h-full transition-all duration-300 ease-in-out', indicatorColor)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
