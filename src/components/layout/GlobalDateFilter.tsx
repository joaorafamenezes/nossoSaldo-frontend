import * as React from 'react';
import { useAppStore } from '../../stores/useAppStore';
import {
  Calendar,
  CalendarRange,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import {
  getCompetenciaDisplay,
  formatDate,
  MONTH_NAMES_PT,
  MONTH_ABBR_PT,
  getCurrentCompetencia,
  parseCompetencia,
  formatCompetencia,
  shiftCompetencia,
  getPreviousCompetencia,
  getNextCompetencia,
  isCurrentCompetencia,
} from '../../lib/utils';
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

  const { year: selectedYear, month: selectedMonth } = parseCompetencia(selectedCompetencia);
  const [viewYear, setViewYear] = React.useState(selectedYear);

  const [localStart, setLocalStart] = React.useState(customStartDate || '');
  const [localEnd, setLocalEnd] = React.useState(customEndDate || '');

  React.useEffect(() => {
    setViewYear(selectedYear);
  }, [selectedYear]);

  React.useEffect(() => {
    setLocalStart(customStartDate || '');
    setLocalEnd(customEndDate || '');
  }, [customStartDate, customEndDate]);

  // Click outside and Escape listener to close popover
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen]);

  // Quick 1-click previous / next month
  const handlePrevMonth = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isCustomActive) {
      clearCustomDateRange();
    }
    setSelectedCompetencia(getPreviousCompetencia(selectedCompetencia));
  };

  const handleNextMonth = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isCustomActive) {
      clearCustomDateRange();
    }
    setSelectedCompetencia(getNextCompetencia(selectedCompetencia));
  };

  const handleGoCurrentMonth = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    clearCustomDateRange();
    setSelectedCompetencia(getCurrentCompetencia());
    setIsOpen(false);
  };

  const handleShiftMonths = (delta: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isCustomActive) {
      clearCustomDateRange();
    }
    setSelectedCompetencia(shiftCompetencia(selectedCompetencia, delta));
  };

  const handleSelectMonthGrid = (monthIndex: number) => {
    const newComp = formatCompetencia(viewYear, monthIndex + 1);
    clearCustomDateRange();
    setSelectedCompetencia(newComp);
    setIsOpen(false);
  };

  const handleApplyCustom = () => {
    if (localStart && localEnd) {
      setCustomDateRange(localStart, localEnd);
      setIsOpen(false);
    }
  };

  const isCustomActive = dateFilterMode === 'custom' && Boolean(customStartDate && customEndDate);
  const currentComp = getCurrentCompetencia();
  const { year: curRealYear, month: curRealMonth } = parseCompetencia(currentComp);
  const isCurrentlyCurrentMonth = isCurrentCompetencia(selectedCompetencia) && !isCustomActive;

  return (
    <div className="relative inline-flex items-center gap-1.5" ref={containerRef}>
      {/* 1-Click Navigation Control Group: [ < ] [ 📅 Competência ▾ ] [ > ] */}
      <div className="flex items-center rounded-xl border border-zinc-800 bg-zinc-900/90 p-0.5 shadow-sm transition-all focus-within:border-emerald-500/50">
        {/* 1-Click Previous Month Button */}
        <button
          type="button"
          onClick={handlePrevMonth}
          className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors focus:outline-none focus:ring-1 focus:ring-emerald-500"
          title="Mês anterior (1 clique)"
          aria-label="Mês anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Dropdown Popover Trigger */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs md:text-sm font-semibold transition-all focus:outline-none ${
            isCustomActive
              ? 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
              : isOpen
              ? 'bg-zinc-800 text-emerald-400 shadow-inner'
              : 'text-zinc-100 hover:bg-zinc-800/80 hover:text-emerald-300'
          }`}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          title="Selecionar mês ou personalizar intervalo de datas"
        >
          {isCustomActive ? (
            <CalendarRange className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          ) : (
            <Calendar className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          )}

          <span>
            {isCustomActive
              ? `${formatDate(customStartDate)} até ${formatDate(customEndDate)}`
              : getCompetenciaDisplay(selectedCompetencia)}
          </span>

          <ChevronDown
            className={`h-3.5 w-3.5 text-zinc-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-emerald-400' : ''
            }`}
          />
        </button>

        {/* 1-Click Next Month Button */}
        <button
          type="button"
          onClick={handleNextMonth}
          className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors focus:outline-none focus:ring-1 focus:ring-emerald-500"
          title="Próximo mês (1 clique)"
          aria-label="Próximo mês"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Clear Custom Range Button (if custom mode active) */}
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

      {/* 1-Click "Hoje / Mês Atual" pill shortcut (appears when navigated away from current month) */}
      {!isCurrentlyCurrentMonth && !isCustomActive && (
        <button
          type="button"
          onClick={handleGoCurrentMonth}
          className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-all shadow-sm"
          title="Voltar para o Mês Atual em 1 clique"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Mês Atual</span>
        </button>
      )}

      {/* Popover / Dropdown Modal */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-80 sm:w-[370px] rounded-2xl border border-zinc-700/80 bg-zinc-950 p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl">
          {/* Header with Mode Tabs */}
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
              {/* Quick Relative Navigation Chips (1-Click Shortcuts) */}
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2 flex items-center justify-between">
                  <span>Navegação Rápida</span>
                  <span className="text-[10px] text-zinc-500 font-normal">1 clique</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => handleShiftMonths(-3, e)}
                    className="flex flex-col items-center justify-center py-1.5 px-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-medium text-zinc-300 hover:text-white transition-colors"
                    title="Voltar 3 meses"
                  >
                    <span className="font-bold text-zinc-400">-3M</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="flex flex-col items-center justify-center py-1.5 px-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-medium text-zinc-300 hover:text-white transition-colors"
                    title="Mês anterior"
                  >
                    <span>◀ Ant.</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGoCurrentMonth}
                    className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg border text-[11px] font-medium transition-colors ${
                      isCurrentlyCurrentMonth
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-semibold'
                        : 'bg-zinc-900 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border-zinc-800 hover:border-emerald-500/40'
                    }`}
                    title="Mês Atual / Hoje"
                  >
                    <span>⭐ Hoje</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="flex flex-col items-center justify-center py-1.5 px-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-medium text-zinc-300 hover:text-white transition-colors"
                    title="Próximo mês"
                  >
                    <span>Próx. ▶</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleShiftMonths(3, e)}
                    className="flex flex-col items-center justify-center py-1.5 px-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-medium text-zinc-300 hover:text-white transition-colors"
                    title="Avançar 3 meses"
                  >
                    <span className="font-bold text-zinc-400">+3M</span>
                  </button>
                </div>
              </div>

              {/* Year Switcher */}
              <div className="flex items-center justify-between border-t border-zinc-800/80 pt-3 pb-1">
                <button
                  type="button"
                  onClick={() => setViewYear((y) => y - 1)}
                  className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                  title="Ano anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-zinc-100">{viewYear}</span>
                  {viewYear !== curRealYear && (
                    <button
                      type="button"
                      onClick={() => setViewYear(curRealYear)}
                      className="text-[10px] text-emerald-400 hover:underline font-medium"
                      title="Voltar ao ano atual"
                    >
                      (Ano Atual)
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setViewYear((y) => y + 1)}
                  className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                  title="Próximo ano"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* 12-Month Interactive Grid */}
              <div className="grid grid-cols-4 gap-1.5 my-2">
                {MONTH_ABBR_PT.map((abbr, index) => {
                  const monthNum = index + 1;
                  const isSelected = selectedYear === viewYear && selectedMonth === monthNum && !isCustomActive;
                  const isRealCurrent = curRealYear === viewYear && curRealMonth === monthNum;

                  return (
                    <button
                      key={abbr}
                      type="button"
                      onClick={() => handleSelectMonthGrid(index)}
                      className={`group relative flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/60 shadow-md shadow-emerald-900/30 ring-1 ring-emerald-500/40'
                          : isRealCurrent
                          ? 'bg-zinc-900 text-zinc-100 border-emerald-500/30 hover:bg-zinc-800 hover:border-zinc-600'
                          : 'bg-zinc-900/60 text-zinc-300 border-zinc-800 hover:bg-zinc-800 hover:text-white hover:border-zinc-700'
                      }`}
                      title={`${MONTH_NAMES_PT[index]} de ${viewYear}`}
                    >
                      <span className="text-xs">{abbr}</span>
                      <span className="text-[9px] font-normal text-zinc-500 group-hover:text-zinc-300">
                        {String(monthNum).padStart(2, '0')}
                      </span>

                      {/* Indicator for today/current month */}
                      {isRealCurrent && !isSelected && (
                        <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-emerald-400" title="Mês Atual" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Quick Quarters */}
              <div className="border-t border-zinc-800/80 pt-2.5 flex items-center justify-between gap-1 text-[10px]">
                <span className="text-zinc-400 font-medium">Trimestres:</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      clearCustomDateRange();
                      setSelectedCompetencia(formatCompetencia(viewYear, 1));
                      setIsOpen(false);
                    }}
                    className="px-1.5 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors"
                    title="1º Trimestre (Janeiro)"
                  >
                    1º Tri
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      clearCustomDateRange();
                      setSelectedCompetencia(formatCompetencia(viewYear, 4));
                      setIsOpen(false);
                    }}
                    className="px-1.5 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors"
                    title="2º Trimestre (Abril)"
                  >
                    2º Tri
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      clearCustomDateRange();
                      setSelectedCompetencia(formatCompetencia(viewYear, 7));
                      setIsOpen(false);
                    }}
                    className="px-1.5 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors"
                    title="3º Trimestre (Julho)"
                  >
                    3º Tri
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      clearCustomDateRange();
                      setSelectedCompetencia(formatCompetencia(viewYear, 10));
                      setIsOpen(false);
                    }}
                    className="px-1.5 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors"
                    title="4º Trimestre (Outubro)"
                  >
                    4º Tri
                  </button>
                </div>
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
