import * as React from 'react';
import { useAppStore, NavigationTab } from '../../stores/useAppStore';
import {
  LayoutDashboard,
  Receipt,
  CreditCard,
  ShoppingCart,
  Sparkles,
  Users2,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export function BottomNav() {
  const { activeTab, setActiveTab, groceryItems } = useAppStore();

  const pendingGroceryCount = groceryItems.filter((i) => !i.noCarrinho).length;

  const tabs: { tab: NavigationTab; label: string; icon: React.ElementType; badge?: string }[] = [
    { tab: 'dashboard', label: 'Início', icon: LayoutDashboard },
    { tab: 'expenses', label: 'Gastos', icon: Receipt },
    { tab: 'cards', label: 'Cartões', icon: CreditCard },
    {
      tab: 'supermarket',
      label: 'Mercado',
      icon: ShoppingCart,
      badge: pendingGroceryCount > 0 ? `${pendingGroceryCount}` : undefined,
    },
    { tab: 'ai', label: 'IA', icon: Sparkles },
    { tab: 'joint', label: 'Casal', icon: Users2 },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t border-zinc-800 bg-zinc-950/90 px-2 backdrop-blur-xl pb-safe">
      {tabs.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.tab;

        return (
          <button
            key={item.tab}
            onClick={() => setActiveTab(item.tab)}
            className={cn(
              'relative flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl transition-colors',
              isActive ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
            )}
          >
            <div className="relative">
              <Icon className="h-5 w-5" />
              {item.badge && (
                <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-zinc-950 px-1 font-mono">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] font-semibold tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
