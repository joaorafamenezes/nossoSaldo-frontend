import * as React from 'react';
import { Categoria } from '../../types/financial';
import {
  Briefcase,
  Home,
  ShoppingCart,
  Utensils,
  Car,
  HeartPulse,
  Tv,
  GraduationCap,
  HelpCircle,
  Tag,
  LucideIcon,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface CategoryBadgeProps {
  categoria?: Categoria;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const ICON_MAP: Record<string, LucideIcon> = {
  Briefcase,
  Home,
  ShoppingCart,
  Utensils,
  Car,
  HeartPulse,
  Tv,
  GraduationCap,
  HelpCircle,
  Tag,
};

export function CategoryBadge({ categoria, size = 'md', showIcon = true }: CategoryBadgeProps) {
  if (!categoria) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-900/50 px-2 py-0.5 text-xs text-slate-600 dark:text-zinc-400">
        <span>🏷️</span>
        <span>Geral</span>
      </span>
    );
  }

  const categoryColor = categoria.cor || categoria.color || '#10b981';
  const iconRaw = categoria.iconName || '🏷️';
  const isEmoji = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u.test(iconRaw) || iconRaw.length <= 4;
  const IconComponent = !isEmoji ? (ICON_MAP[iconRaw] || Tag) : null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-xl border font-semibold transition-colors text-slate-800 dark:text-zinc-100',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-xs'
      )}
      style={{
        backgroundColor: `${categoryColor}18`,
        borderColor: `${categoryColor}40`,
      }}
    >
      {/* Category Color Dot */}
      <span
        className="flex h-2 w-2 rounded-full shrink-0 shadow-sm"
        style={{ backgroundColor: categoryColor }}
      />

      {/* Category Emoji or Icon */}
      {showIcon && (
        isEmoji ? (
          <span className={size === 'sm' ? 'text-xs' : 'text-sm'}>{iconRaw}</span>
        ) : IconComponent ? (
          <IconComponent className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} style={{ color: categoryColor }} />
        ) : (
          <span>🏷️</span>
        )
      )}

      <span className="truncate max-w-[130px]">{categoria.descricao}</span>
    </span>
  );
}
