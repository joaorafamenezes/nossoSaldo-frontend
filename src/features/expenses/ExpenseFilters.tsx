import * as React from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { Input } from '../../components/ui/Input';
import {
  Search,
  LayoutGrid,
  Table as TableIcon,
  Layers,
  X,
  Calendar,
  CalendarRange,
  Clock,
  Filter,
  Pin,
} from 'lucide-react';
import { toast } from 'sonner';

export const DEFAULT_FILTERS_STORAGE_KEY = '@NossoSaldo:defaultExpenseFilters';
export const DEFAULT_STATUS_STORAGE_KEY = '@NossoSaldo:defaultExpenseStatus';

export interface DefaultExpenseFilters {
  selectedType: string;
  selectedStatus: string;
  selectedCategoryId: string;
  selectedResponsavelId: string;
}

export const getDefaultFilters = (): DefaultExpenseFilters => {
  try {
    const raw = localStorage.getItem(DEFAULT_FILTERS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
    const legacyStatus = localStorage.getItem(DEFAULT_STATUS_STORAGE_KEY);
    return {
      selectedType: 'todos',
      selectedStatus: legacyStatus || 'todos',
      selectedCategoryId: 'todos',
      selectedResponsavelId: 'todos',
    };
  } catch {
    return {
      selectedType: 'todos',
      selectedStatus: 'todos',
      selectedCategoryId: 'todos',
      selectedResponsavelId: 'todos',
    };
  }
};

export const STATUS_LABELS: Record<string, string> = {
  todos: 'Todos os Status',
  pago: 'Pagos / Recebidos',
  pendente: 'Pendentes',
  atrasado: 'Atrasados',
};

export type PeriodPreset = 'all' | 'first_half' | 'second_half' | 'custom';

interface ExpenseFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedType: string;
  onTypeChange: (t: string) => void;
  selectedStatus: string;
  onStatusChange: (s: string) => void;
  selectedCategoryId: string;
  onCategoryChange: (id: string) => void;
  selectedResponsavelId: string;
  onResponsavelChange: (id: string) => void;
  startDate: string;
  onStartDateChange: (d: string) => void;
  endDate: string;
  onEndDateChange: (d: string) => void;
  periodPreset: PeriodPreset;
  onPeriodPresetChange: (p: PeriodPreset) => void;
  viewMode: 'category' | 'table' | 'grid';
  onViewModeChange: (mode: 'category' | 'table' | 'grid') => void;
}

export function ExpenseFilters({
  searchQuery,
  onSearchChange,
  selectedType,
  onTypeChange,
  selectedStatus,
  onStatusChange,
  selectedCategoryId,
  onCategoryChange,
  selectedResponsavelId,
  onResponsavelChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  periodPreset,
  onPeriodPresetChange,
  viewMode,
  onViewModeChange,
}: ExpenseFiltersProps) {
  const { categories, jointInfo, selectedCompetencia } = useAppStore();
  const [isCustomDateOpen, setIsCustomDateOpen] = React.useState(periodPreset === 'custom' || !!startDate || !!endDate);

  const [year, month] = (selectedCompetencia || '2026-09').split('-');
  const lastDay = new Date(Number(year), Number(month), 0).getDate();

  const [savedDefaults, setSavedDefaults] = React.useState<DefaultExpenseFilters>(() => getDefaultFilters());

  const isCurrentSavedAsDefault =
    savedDefaults.selectedType === selectedType &&
    savedDefaults.selectedStatus === selectedStatus &&
    savedDefaults.selectedCategoryId === selectedCategoryId &&
    savedDefaults.selectedResponsavelId === selectedResponsavelId;

  const handleSaveAllAsDefault = (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const newDefaults: DefaultExpenseFilters = {
        selectedType,
        selectedStatus,
        selectedCategoryId,
        selectedResponsavelId,
      };
      localStorage.setItem(DEFAULT_FILTERS_STORAGE_KEY, JSON.stringify(newDefaults));
      localStorage.setItem(DEFAULT_STATUS_STORAGE_KEY, selectedStatus);
      setSavedDefaults(newDefaults);
      toast.success('Filtros padrão salvos com sucesso!');
    } catch (err) {
      console.error('Falha ao salvar preferências de filtros:', err);
    }
  };

  const handlePresetSelect = (preset: PeriodPreset) => {
    onPeriodPresetChange(preset);
    if (preset === 'all') {
      onStartDateChange('');
      onEndDateChange('');
      setIsCustomDateOpen(false);
    } else if (preset === 'first_half') {
      onStartDateChange(`${year}-${month}-01`);
      onEndDateChange(`${year}-${month}-14`);
      setIsCustomDateOpen(false);
    } else if (preset === 'second_half') {
      onStartDateChange(`${year}-${month}-15`);
      onEndDateChange(`${year}-${month}-${String(lastDay).padStart(2, '0')}`);
      setIsCustomDateOpen(false);
    } else if (preset === 'custom') {
      setIsCustomDateOpen(true);
      if (!startDate) onStartDateChange(`${year}-${month}-01`);
      if (!endDate) onEndDateChange(`${year}-${month}-${String(lastDay).padStart(2, '0')}`);
    }
  };

  const isPeriodFiltered = periodPreset !== 'all' || !!startDate || !!endDate;

  const handleClearDates = () => {
    onPeriodPresetChange('all');
    onStartDateChange('');
    onEndDateChange('');
    setIsCustomDateOpen(false);
  };

  return (
    <div className="space-y-2.5">
      {/* Main Filter Row: Search, Type, Status, Category, Pin Default, View Mode */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white/80 dark:bg-zinc-900/60 p-3 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs backdrop-blur-md">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 dark:text-zinc-400" />
          <Input
            type="text"
            placeholder="Buscar por descrição, cartão ou categoria..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9.5 h-10 bg-slate-50 dark:bg-zinc-950/80 border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Select Filters & View Mode */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Responsável filter (Visible when Joint Account exists) */}
          {jointInfo && (
            <select
              value={selectedResponsavelId}
              onChange={(e) => onResponsavelChange(e.target.value)}
              className="h-10 rounded-xl border border-emerald-500/30 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 px-3 text-xs font-semibold text-emerald-800 dark:text-emerald-300 outline-none cursor-pointer focus:ring-1 focus:ring-emerald-500 max-w-[175px] truncate transition-colors"
              title="Filtrar por Responsável do Gasto"
            >
              <option value="todos" className="bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100">
                👥 Todos os Responsáveis
              </option>
              {jointInfo.usuario1 && (
                <option value={jointInfo.usuario1.id} className="bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100">
                  👤 {jointInfo.usuario1.nome || 'Usuário 1'}
                </option>
              )}
              {jointInfo.usuario2 && (
                <option value={jointInfo.usuario2.id} className="bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100">
                  👤 {jointInfo.usuario2.nome || 'Usuário 2'}
                </option>
              )}
            </select>
          )}

          {/* Type filter */}
          <select
            value={selectedType}
            onChange={(e) => onTypeChange(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-xs font-semibold text-slate-800 dark:text-zinc-200 outline-none cursor-pointer focus:ring-1 focus:ring-emerald-500"
          >
            <option value="todos" className="bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100">Todos os Tipos</option>
            <option value="despesa" className="bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100">Somente Despesas</option>
            <option value="receita" className="bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100">Somente Receitas</option>
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-xs font-semibold text-slate-800 dark:text-zinc-200 outline-none cursor-pointer focus:ring-1 focus:ring-emerald-500"
          >
            <option value="todos" className="bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100">Todos os Status</option>
            <option value="pago" className="bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100">Pagos / Recebidos</option>
            <option value="pendente" className="bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100">Pendentes</option>
            <option value="atrasado" className="bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100">Atrasados</option>
          </select>

          {/* Category filter */}
          <select
            value={selectedCategoryId}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-xs font-semibold text-slate-800 dark:text-zinc-200 outline-none cursor-pointer focus:ring-1 focus:ring-emerald-500 max-w-[150px] truncate"
          >
            <option value="todos" className="bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100">Todas Categorias</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id} className="bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100">
                {c.descricao}
              </option>
            ))}
          </select>

          {/* Unified Pin Button - Salvar Filtros como Padrão */}
          <button
            type="button"
            onClick={handleSaveAllAsDefault}
            className={`h-10 px-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1 shrink-0 ${
              isCurrentSavedAsDefault
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-500 dark:text-amber-400 shadow-xs'
                : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-400 dark:text-zinc-500 hover:text-amber-500 hover:border-amber-500/30'
            }`}
            title={
              isCurrentSavedAsDefault
                ? 'Filtros atuais estão salvos como padrão inicial'
                : 'Fixar filtros atuais (Responsável, Tipo, Status e Categoria) como padrão ao abrir a tela'
            }
          >
            <Pin className={`h-3.5 w-3.5 ${isCurrentSavedAsDefault ? 'fill-amber-400 text-amber-500' : ''}`} />
            <span className="hidden sm:inline text-[11px]">
              {isCurrentSavedAsDefault ? 'Padrão Salvo' : 'Fixar Padrão'}
            </span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-950 p-1">
            <button
              onClick={() => onViewModeChange('category')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                viewMode === 'category'
                  ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
              title="Agrupar por Categoria (Accordion)"
            >
              <Layers className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Categorias</span>
            </button>
            <button
              onClick={() => onViewModeChange('table')}
              className={`rounded-lg p-1.5 transition-colors ${
                viewMode === 'table' ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:text-zinc-500 dark:hover:text-zinc-300'
              }`}
              title="Visualização em Tabela"
            >
              <TableIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => onViewModeChange('grid')}
              className={`rounded-lg p-1.5 transition-colors ${
                viewMode === 'grid' ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:text-zinc-500 dark:hover:text-zinc-300'
              }`}
              title="Visualização em Grade"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Row: Date Range & Quinzena Quick Selector */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-slate-50/80 dark:bg-zinc-900/40 px-3.5 py-2 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 text-xs">
        {/* Quick Presets: Mês Inteiro vs 1ª Quinzena vs 2ª Quinzena vs Personalizado */}
        <div className="flex items-center flex-wrap gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1 mr-1">
            <CalendarRange className="h-3.5 w-3.5 text-emerald-500" />
            Vencimento:
          </span>

          <button
            type="button"
            onClick={() => handlePresetSelect('all')}
            className={`px-3 py-1 rounded-xl font-semibold text-xs transition-all ${
              periodPreset === 'all' && !startDate && !endDate
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700/60'
            }`}
          >
            Mês Completo
          </button>

          <button
            type="button"
            onClick={() => handlePresetSelect('first_half')}
            className={`px-3 py-1 rounded-xl font-semibold text-xs transition-all flex items-center gap-1.5 ${
              periodPreset === 'first_half'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700/60'
            }`}
            title="Gastos a pagar no início do mês (dias 01 a 14)"
          >
            <span>🌓 1ª Quinzena</span>
            <span className="opacity-70 text-[10px] font-mono">(01 a 14)</span>
          </button>

          <button
            type="button"
            onClick={() => handlePresetSelect('second_half')}
            className={`px-3 py-1 rounded-xl font-semibold text-xs transition-all flex items-center gap-1.5 ${
              periodPreset === 'second_half'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700/60'
            }`}
            title={`Gastos a pagar no final do mês (dias 15 a ${lastDay})`}
          >
            <span>🌔 2ª Quinzena</span>
            <span className="opacity-70 text-[10px] font-mono">(15 a {lastDay})</span>
          </button>

          <button
            type="button"
            onClick={() => handlePresetSelect('custom')}
            className={`px-3 py-1 rounded-xl font-semibold text-xs transition-all ${
              periodPreset === 'custom' || (periodPreset === 'all' && (startDate || endDate))
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700/60'
            }`}
          >
            📅 Personalizado
          </button>
        </div>

        {/* Date Inputs for Custom/Visual Range */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">De:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                onStartDateChange(e.target.value);
                onPeriodPresetChange('custom');
              }}
              className="h-8 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 text-xs text-slate-800 dark:text-zinc-200 outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">Até:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                onEndDateChange(e.target.value);
                onPeriodPresetChange('custom');
              }}
              className="h-8 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 text-xs text-slate-800 dark:text-zinc-200 outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
            />
          </div>

          {isPeriodFiltered && (
            <button
              type="button"
              onClick={handleClearDates}
              className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 flex items-center gap-1 transition-colors text-[11px]"
              title="Limpar filtro de período"
            >
              <X className="h-3.5 w-3.5" />
              <span>Limpar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
