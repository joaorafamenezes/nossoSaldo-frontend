import * as React from 'react';
import { useAppStore, NavigationTab } from '../../stores/useAppStore';
import {
  LayoutDashboard,
  Receipt,
  CreditCard,
  ShoppingCart,
  Sparkles,
  Users2,
  PlusCircle,
  Search,
  X,
} from 'lucide-react';

export function CommandMenu() {
  const {
    isCommandMenuOpen,
    setCommandMenuOpen,
    setActiveTab,
    openNewExpense,
    setShoppingFocusMode,
    setAiDrawerOpen,
  } = useAppStore();

  const [query, setQuery] = React.useState('');

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandMenuOpen(!isCommandMenuOpen);
      }
      if (e.key === 'Escape' && isCommandMenuOpen) {
        setCommandMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandMenuOpen, setCommandMenuOpen]);

  if (!isCommandMenuOpen) return null;

  const actions = [
    {
      label: 'Novo Lançamento / Despesa',
      icon: PlusCircle,
      action: () => {
        openNewExpense();
        setCommandMenuOpen(false);
      },
    },
    {
      label: 'Abrir Copilot Financeiro IA',
      icon: Sparkles,
      action: () => {
        setAiDrawerOpen(true);
        setCommandMenuOpen(false);
      },
    },
    {
      label: 'Ir para Dashboard 360°',
      icon: LayoutDashboard,
      action: () => {
        setActiveTab('dashboard');
        setCommandMenuOpen(false);
      },
    },
    {
      label: 'Ir para Gastos & Receitas',
      icon: Receipt,
      action: () => {
        setActiveTab('expenses');
        setCommandMenuOpen(false);
      },
    },
    {
      label: 'Ir para Cartões & Faturas',
      icon: CreditCard,
      action: () => {
        setActiveTab('cards');
        setCommandMenuOpen(false);
      },
    },
    {
      label: 'Ir para Conta Conjunta do Casal',
      icon: Users2,
      action: () => {
        setActiveTab('joint');
        setCommandMenuOpen(false);
      },
    },
  ];

  const filtered = actions.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center border-b border-zinc-800 px-4 py-3">
          <Search className="h-4 w-4 text-zinc-400 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="O que você deseja fazer no NossoSaldo?..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 outline-none"
          />
          <button
            onClick={() => setCommandMenuOpen(false)}
            className="rounded p-1 text-zinc-500 hover:text-zinc-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-72 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-xs text-zinc-400">
              Nenhum comando encontrado.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={item.action}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors"
                >
                  <Icon className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })
          )}
        </div>

        <div className="border-t border-zinc-800 px-4 py-2 text-[10px] text-zinc-400 flex items-center justify-between font-mono">
          <span>Navegue com o teclado ou clique</span>
          <span>ESC para fechar</span>
        </div>
      </div>
    </div>
  );
}
