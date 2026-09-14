import * as React from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { Calendar, CalendarRange, X, ChevronDown, Check, RotateCcw } from 'lucide-react';
import { getCompetenciaDisplay, formatDate } from '../../lib/utils';
import { Button } from '../ui/Button';

export function GlobalDateFilter() {
  const {
    selectedCompetencia,
    setSelectedCompetencia,
    dateFilterMode,
    customStartDate,
    customEndDate,
    setDateFilterMode,
    setCustomDateRange,
    clearCustomDateRange,
  } = useAppStore();

  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const [localStart, setLocalStart] = React.useState(customStartDate || '');
  const [localEnd, setLocalEnd] = React.useState(customEndDate || '');

  React.useEffect(() => {
    setLocalStart(customStartDate || '');
    setLocalEnd(customEndDate || '');
  }, [customStartDate, customEndDate]);

  // Click outside to close popover
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

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

  const handleApplyCustom = () => {
    if (localStart && localEnd) {
      setCustomDateRange(localStart, localEnd);
      setIsOpen(false);
    }
  };

  const handleSelectMonth = (comp: string) => {
    setSelectedCompetencia(comp);
    clearCustomDateRange();
    setIsOpen(false);
  };

  const isCustomActive = dateFilterMode === 'custom' && Boolean(customStartDate && customEndDate);

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button / Display */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 shadow-sm transition-all text-xs md:text-sm font-semibold ${
            isCustomActive
              ? 'border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
              : 'border-zinc-800 bg-zinc-900/60 text-zinc-100 hover:bg-zinc-800/80'
          }`}
          title="Selecionar mês ou personalizar intervalo de datas"
        >
          {isCustomActive ? (
            <CalendarRange className="h-4 w-4 text-amber-400 shrink-0" />
          ) : (
            <Calendar className="h-4 w-4 text-emerald-400 shrink-0" />
          )}

          <span>
            {isCustomActive
              ? `${formatDate(customStartDate)} até ${formatDate(customEndDate)}`
              : getCompetenciaDisplay(selectedCompetencia)}
          </span>

          <ChevronDown className="h-3.5 w-3.5 opacity-60 ml-0.5" />
        </button>

        {isCustomActive && (
          <button
            type="button"
            onClick={clearCustomDateRange}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            title="Voltar para visualização por mês"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Popover / Dropdown Modal */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-80 md:w-96 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Filtro de Período
            </span>
            <div className="flex rounded-lg bg-zinc-900 p-0.5 border border-zinc-800 text-[11px]">
              <button
                type="button"
                onClick={() => setDateFilterMode('month')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                  dateFilterMode === 'month'
                    ? 'bg-zinc-800 text-emerald-400'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Por Mês
              </button>
              <button
                type="button"
                onClick={() => setDateFilterMode('custom')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                  dateFilterMode === 'custom'
                    ? 'bg-zinc-800 text-amber-400'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Personalizado
              </button>
            </div>
          </div>

          {dateFilterMode === 'month' ? (
            <div className="mt-3 space-y-3">
              <label className="block text-[11px] font-medium text-zinc-400">
                Selecione o mês de referência:
              </label>
              <div className="max-h-48 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {competencias.map((comp) => {
                  const isSelected = selectedCompetencia === comp && !isCustomActive;
                  return (
                    <button
                      key={comp}
                      type="button"
                      onClick={() => handleSelectMonth(comp)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                        isSelected
                          ? 'bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30'
                          : 'text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100'
                      }`}
                    >
                      <span>{getCompetenciaDisplay(comp)}</span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                    Data Inicial:
                  </label>
                  <input
                    type="date"
                    value={localStart}
                    onChange={(e) => setLocalStart(e.target.value)}
                    className="w-full h-9 rounded-xl border border-zinc-800 bg-zinc-900 px-2.5 text-xs text-zinc-100 outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                    Data Final:
                  </label>
                  <input
                    type="date"
                    value={localEnd}
                    onChange={(e) => setLocalEnd(e.target.value)}
                    className="w-full h-9 rounded-xl border border-zinc-800 bg-zinc-900 px-2.5 text-xs text-zinc-100 outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    clearCustomDateRange();
                    setIsOpen(false);
                  }}
                  className="text-xs text-zinc-400 hover:text-zinc-200"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  <span>Mês Vigente</span>
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleApplyCustom}
                  disabled={!localStart || !localEnd}
                  className="text-xs font-semibold"
                >
                  Aplicar Período
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default GlobalDateFilter;
