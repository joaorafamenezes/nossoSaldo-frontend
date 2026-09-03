import * as React from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { Input } from '../../components/ui/Input';
import { Search, LayoutGrid, Table as TableIcon, Layers, X, User } from 'lucide-react';

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
  viewMode,
  onViewModeChange,
}: ExpenseFiltersProps) {
  const { categories, jointInfo } = useAppStore();

  return (
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

        {/* View Mode Toggle: Category Accordion vs Table vs Grid */}
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
  );
}
