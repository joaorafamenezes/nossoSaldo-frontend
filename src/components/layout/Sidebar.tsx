import * as React from 'react';
import { useAppStore, NavigationTab } from '../../stores/useAppStore';
import { useAuthStore } from '../../stores/useAuthStore';
import {
  LayoutDashboard,
  Receipt,
  FolderTree,
  CreditCard,
  ShoppingCart,
  Sparkles,
  Users2,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Wallet,
  Settings,
  Shield,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { APP_NAME, APP_VERSION } from '../../config/appMeta';
import { UserSettingsModal } from '../../features/auth/UserSettingsModal';

interface NavItem {
  tab: NavigationTab;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

export function Sidebar() {
  const { activeTab, setActiveTab, groceryItems } = useAppStore();
  const { user, logout } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isUserSettingsOpen, setIsUserSettingsOpen] = React.useState(false);

  const pendingGroceryCount = groceryItems.filter((i) => !i.noCarrinho).length;

  const navItems: NavItem[] = [
    { tab: 'dashboard', label: 'Dashboard 360°', icon: LayoutDashboard },
    { tab: 'expenses', label: 'Gastos & Receitas', icon: Receipt },
    { tab: 'categories', label: 'Categorias', icon: FolderTree },
    { tab: 'cards', label: 'Cartões & Faturas', icon: CreditCard },
    { tab: 'ai', label: 'Copilot Financeiro', icon: Sparkles, badge: 'IA' },
    { tab: 'joint', label: 'Conta Conjunta', icon: Users2 },
  ];

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col justify-between border-r border-zinc-800 bg-zinc-950/80 backdrop-blur-xl transition-all duration-300 relative z-30 h-screen select-none',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div>
        <div className="flex h-16 items-center justify-between px-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800 p-1 shadow-xs overflow-hidden">
              <img
                src="/nossosaldo-logo.png"
                alt="NossoSaldo"
                className="h-full w-full object-contain rounded-lg"
              />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-bold tracking-tight text-slate-900 dark:text-zinc-100 text-base">
                  {APP_NAME}
                </span>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold tracking-wider">
                  v{APP_VERSION} PRO
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white transition-colors"
            title={isCollapsed ? 'Expandir Menu' : 'Recolher Menu'}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5 p-3 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.tab;

            return (
              <button
                key={item.tab}
                onClick={() => setActiveTab(item.tab)}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20 shadow-sm'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 shrink-0 transition-transform duration-150 group-hover:scale-110',
                    isActive ? 'text-emerald-400' : 'text-zinc-400'
                  )}
                />
                {!isCollapsed && (
                  <span className="truncate flex-1 text-left">{item.label}</span>
                )}
                {!isCollapsed && item.badge && (
                  <span
                    className={cn(
                      'rounded-md px-1.5 py-0.5 text-[10px] font-bold font-mono',
                      item.tab === 'ai'
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-glow-sm'
                        : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Profile & Logout Footer */}
      <div className="p-3 border-t border-zinc-800/80">
        <div
          className={cn(
            'flex items-center gap-2 rounded-xl bg-zinc-900/60 p-1.5 border border-zinc-800/60 hover:border-zinc-700 transition-colors',
            isCollapsed && 'justify-center p-1'
          )}
        >
          <button
            onClick={() => setIsUserSettingsOpen(true)}
            className="flex items-center gap-2.5 min-w-0 flex-1 text-left p-1 rounded-lg hover:bg-zinc-800/60 transition-colors"
            title="Abrir Configurações da Conta"
          >
            <div className="relative">
              <img
                src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={user?.nome || 'Usuário'}
                className="h-8 w-8 rounded-xl object-cover ring-1 ring-zinc-700 shrink-0"
              />
              {user?.perfil === 'ADMIN' && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[8px] text-zinc-950 font-bold shadow-sm" title="Administrador">
                  ★
                </span>
              )}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-xs font-semibold text-zinc-200">
                    {user?.nome || 'Usuário'}
                  </span>
                  {user?.perfil === 'ADMIN' && (
                    <span className="rounded bg-amber-500/20 text-amber-400 text-[8px] font-mono font-bold px-1 py-0.2 uppercase shrink-0">
                      ADMIN
                    </span>
                  )}
                </div>
                <span className="truncate text-[10px] text-zinc-500 font-mono">
                  {user?.email || 'joao@nossosaldo.com.br'}
                </span>
              </div>
            )}
          </button>

          {!isCollapsed && (
            <button
              onClick={logout}
              className="text-zinc-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors shrink-0"
              title="Sair da Conta"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <UserSettingsModal
        isOpen={isUserSettingsOpen}
        onClose={() => setIsUserSettingsOpen(false)}
      />
    </aside>
  );
}
