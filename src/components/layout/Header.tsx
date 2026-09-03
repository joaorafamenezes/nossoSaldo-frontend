import * as React from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { useThemeStore } from '../../stores/useThemeStore';
import {
  Calendar,
  Command,
  Eye,
  EyeOff,
  Moon,
  Sun,
  Sparkles,
  PlusCircle,
  ChevronDown,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { getCompetenciaDisplay } from '../../lib/utils';

export function Header() {
  const {
    selectedCompetencia,
    setSelectedCompetencia,
    setCommandMenuOpen,
    setAiDrawerOpen,
    isPrivacyMode,
    togglePrivacyMode,
    openNewExpense,
  } = useAppStore();

  const { theme, toggleTheme } = useThemeStore();

  // Competence selector options (dynamic range)
  const competencias = React.useMemo(() => {
    const list: string[] = [];
    const currentYear = new Date().getFullYear();
    for (let y = currentYear - 1; y <= currentYear + 1; y++) {
      for (let m = 1; m <= 12; m++) {
        list.push(`${y}-${String(m).padStart(2, '0')}`);
      }
    }
    return list;
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-4 md:px-6 backdrop-blur-xl">
      {/* Left: Competence Month Selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 shadow-sm">
          <Calendar className="h-4 w-4 text-emerald-400 shrink-0" />
          <select
            value={selectedCompetencia}
            onChange={(e) => setSelectedCompetencia(e.target.value)}
            className="bg-transparent text-xs md:text-sm font-semibold text-zinc-100 outline-none cursor-pointer pr-1"
          >
            {competencias.map((comp) => (
              <option key={comp} value={comp} className="bg-zinc-900 text-zinc-100">
                {getCompetenciaDisplay(comp)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Center: Command Palette Trigger */}
      <button
        onClick={() => setCommandMenuOpen(true)}
        className="hidden md:flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 px-3.5 py-1.5 text-xs text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 transition-colors"
      >
        <Command className="h-3.5 w-3.5 text-emerald-400" />
        <span>Buscar ou executar comando...</span>
        <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">
          ⌘K
        </kbd>
      </button>

      {/* Right: Actions (Privacy, Theme, AI Copilot, New Expense) */}
      <div className="flex items-center gap-2">
        <button
          onClick={togglePrivacyMode}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-100 transition-colors"
          title={isPrivacyMode ? 'Revelar Valores' : 'Ocultar Valores (Modo Privacidade)'}
        >
          {isPrivacyMode ? <EyeOff className="h-4 w-4 text-amber-400" /> : <Eye className="h-4 w-4" />}
        </button>

        <button
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-100 transition-colors"
          title="Alternar Tema"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-400" />}
        </button>

        <Button
          variant="ai"
          size="sm"
          onClick={() => setAiDrawerOpen(true)}
          className="hidden sm:inline-flex text-xs font-semibold shadow-glow-sm"
        >
          <Sparkles className="h-3.5 w-3.5 mr-1" />
          <span>Copilot IA</span>
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={openNewExpense}
          className="text-xs font-bold shadow-glow-emerald"
        >
          <PlusCircle className="h-3.5 w-3.5 mr-1" />
          <span className="hidden sm:inline">Novo Lançamento</span>
          <span className="sm:hidden">Novo</span>
        </Button>
      </div>
    </header>
  );
}
