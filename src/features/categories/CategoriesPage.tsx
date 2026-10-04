import * as React from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { Categoria } from '../../types/financial';
import { CategoryModal } from './CategoryModal';
import { CategoryExpensesModal } from './CategoryExpensesModal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  FolderTree,
  PlusCircle,
  Edit3,
  Trash2,
  AlertTriangle,
  Receipt,
  ChevronRight,
  Search,
  X,
  LayoutGrid,
  List,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import {
  formatCurrency,
  formatDate,
  getCompetenciaDisplay,
  getCategoryBudgetStatus,
  getExpensesForCompetence,
} from '../../lib/utils';
import { toast } from 'sonner';

export type CategorySortOption = 'name-asc' | 'name-desc' | 'spent-desc' | 'budget-desc' | 'items-desc';
export type CategoryViewMode = 'list' | 'grid';

export function CategoriesPage() {
  const {
    categories,
    expenses,
    selectedCompetencia,
    dateFilterMode,
    customStartDate,
    customEndDate,
    deleteCategory,
    openNewExpense,
  } = useAppStore();

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [categoryToEdit, setCategoryToEdit] = React.useState<Categoria | null>(null);
  const [selectedCategoryForExpenses, setSelectedCategoryForExpenses] = React.useState<Categoria | null>(null);

  const [viewMode, setViewMode] = React.useState<CategoryViewMode>(() => {
    try {
      const saved = localStorage.getItem('@NossoSaldo:categoriesViewMode');
      if (saved === 'grid' || saved === 'list') return saved;
      return 'list';
    } catch {
      return 'list';
    }
  });

  const [sortBy, setSortBy] = React.useState<CategorySortOption>(() => {
    try {
      const saved = localStorage.getItem('@NossoSaldo:categoriesSortBy');
      if (
        saved === 'name-asc' ||
        saved === 'name-desc' ||
        saved === 'spent-desc' ||
        saved === 'budget-desc' ||
        saved === 'items-desc'
      ) {
        return saved;
      }
      return 'name-asc';
    } catch {
      return 'name-asc';
    }
  });

  const [searchQuery, setSearchQuery] = React.useState('');

  const startDate = dateFilterMode === 'custom' && customStartDate ? customStartDate : undefined;
  const endDate = dateFilterMode === 'custom' && customEndDate ? customEndDate : undefined;

  const isCustomRange = Boolean(startDate && endDate);
  const periodLabel = isCustomRange
    ? `${formatDate(customStartDate)} até ${formatDate(customEndDate)}`
    : getCompetenciaDisplay(selectedCompetencia);

  // Filter expenses strictly by selected competence / custom period
  const periodExpenses = React.useMemo(() => {
    return getExpensesForCompetence(expenses, selectedCompetencia, startDate, endDate);
  }, [expenses, selectedCompetencia, startDate, endDate]);

  // Compute budget statuses for all categories
  const allCategoriesWithStatus = React.useMemo(() => {
    return categories.map((cat) => {
      const status = getCategoryBudgetStatus(cat, periodExpenses, selectedCompetencia, startDate, endDate);
      const catExpenses = periodExpenses.filter(
        (e) => e.categoriaId === cat.id && e.tipo === 'despesa' && e.status !== 'cancelado'
      );
      return {
        category: cat,
        status,
        itemCount: catExpenses.length,
      };
    });
  }, [categories, periodExpenses, selectedCompetencia, startDate, endDate]);

  const totalPeriodBudget = React.useMemo(
    () => allCategoriesWithStatus.reduce((sum, item) => sum + item.status.budget, 0),
    [allCategoriesWithStatus]
  );
  const totalPeriodSpent = React.useMemo(
    () => allCategoriesWithStatus.reduce((sum, item) => sum + item.status.spent, 0),
    [allCategoriesWithStatus]
  );

  const displayedCategories = React.useMemo(() => {
    let result = [...allCategoriesWithStatus];

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((item) =>
        item.category.descricao.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'name-asc') {
        return a.category.descricao.localeCompare(b.category.descricao, 'pt-BR', { sensitivity: 'base' });
      }
      if (sortBy === 'name-desc') {
        return b.category.descricao.localeCompare(a.category.descricao, 'pt-BR', { sensitivity: 'base' });
      }
      if (sortBy === 'spent-desc') {
        return b.status.spent - a.status.spent;
      }
      if (sortBy === 'budget-desc') {
        return b.status.budget - a.status.budget;
      }
      if (sortBy === 'items-desc') {
        return b.itemCount - a.itemCount;
      }
      return 0;
    });

    return result;
  }, [allCategoriesWithStatus, searchQuery, sortBy]);

  const handleViewModeChange = (mode: CategoryViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('@NossoSaldo:categoriesViewMode', mode);
    } catch (e) {
      console.error('Falha ao salvar modo de visualização:', e);
    }
  };

  const handleSortChange = (newSort: CategorySortOption) => {
    setSortBy(newSort);
    try {
      localStorage.setItem('@NossoSaldo:categoriesSortBy', newSort);
    } catch (e) {
      console.error('Falha ao salvar ordenação de categorias:', e);
    }
  };

  const handleToggleColumnSort = (col: 'name' | 'spent' | 'budget') => {
    if (col === 'name') {
      handleSortChange(sortBy === 'name-asc' ? 'name-desc' : 'name-asc');
    } else if (col === 'spent') {
      handleSortChange(sortBy === 'spent-desc' ? 'name-asc' : 'spent-desc');
    } else if (col === 'budget') {
      handleSortChange(sortBy === 'budget-desc' ? 'name-asc' : 'budget-desc');
    }
  };

  const handleEdit = (cat: Categoria, e: React.MouseEvent) => {
    e.stopPropagation();
    setCategoryToEdit(cat);
    setIsModalOpen(true);
  };

  const handleDelete = async (cat: Categoria, e: React.MouseEvent) => {
    e.stopPropagation();
    const attachedCount = expenses.filter((e) => e.categoriaId === cat.id).length;
    if (attachedCount > 0) {
      if (
        !confirm(
          `A categoria "${cat.descricao}" possui ${attachedCount} lançamentos vinculados no histórico. Deseja realmente excluí-la?`
        )
      ) {
        return;
      }
    } else {
      if (!confirm(`Deseja remover a categoria "${cat.descricao}"?`)) {
        return;
      }
    }

    await deleteCategory(cat.id);
    toast.success(`Categoria "${cat.descricao}" removida com sucesso!`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            <FolderTree className="h-6 w-6 text-emerald-400" />
            <span>Gerenciamento de Categorias</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Monitorando período ativo: <strong className="text-zinc-200">{periodLabel}</strong> (clique em uma categoria para visualizar seus lançamentos)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openNewExpense()}
            className="text-xs font-semibold border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
          >
            <PlusCircle className="h-3.5 w-3.5 mr-1" />
            <span>Novo Lançamento</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setCategoryToEdit(null);
              setIsModalOpen(true);
            }}
            className="text-xs font-bold shadow-glow-emerald"
          >
            <PlusCircle className="h-3.5 w-3.5 mr-1" />
            <span>Nova Categoria</span>
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <p className="text-xs font-semibold uppercase text-zinc-400">Total de Categorias</p>
          <p className="text-2xl font-bold font-mono text-zinc-100 mt-1">{categories.length}</p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <p className="text-xs font-semibold uppercase text-zinc-400">Teto Orçamentário ({periodLabel})</p>
          <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {formatCurrency(totalPeriodBudget)}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <p className="text-xs font-semibold uppercase text-zinc-400">Total Gasto ({periodLabel})</p>
          <p className="text-2xl font-bold font-mono text-rose-400 mt-1">
            {formatCurrency(totalPeriodSpent)}
          </p>
        </div>
      </div>

      {/* Search, Sort and View Mode Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-800 backdrop-blur-sm">
        {/* Left: Search input */}
        <div className="relative flex-1 max-w-md">
          <Input
            type="text"
            placeholder="Buscar categoria..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="h-4 w-4" />}
            className="h-9 text-xs bg-zinc-950 border-zinc-800 text-zinc-100 pr-8"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-200 transition-colors"
              title="Limpar busca"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Right side: Counter, Sort Selector, and View Mode Toggles */}
        <div className="flex flex-wrap items-center justify-between md:justify-end gap-2.5 text-xs">
          <span className="text-[11px] font-mono text-zinc-400">
            {displayedCategories.length} {displayedCategories.length === 1 ? 'categoria' : 'categorias'}
          </span>

          <div className="h-4 w-px bg-zinc-800 hidden sm:block" />

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1.5 rounded-xl border border-zinc-800">
            <ArrowUpDown className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <span className="text-[11px] text-zinc-400 font-medium hidden sm:inline">Ordem:</span>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value as CategorySortOption)}
              className="bg-transparent text-zinc-200 text-xs font-medium focus:outline-none cursor-pointer"
              aria-label="Ordenar categorias"
            >
              <option value="name-asc" className="bg-zinc-900 text-zinc-200">Alfabética (A-Z)</option>
              <option value="name-desc" className="bg-zinc-900 text-zinc-200">Alfabética (Z-A)</option>
              <option value="spent-desc" className="bg-zinc-900 text-zinc-200">Maior Gasto</option>
              <option value="budget-desc" className="bg-zinc-900 text-zinc-200">Maior Teto</option>
              <option value="items-desc" className="bg-zinc-900 text-zinc-200">Mais Lançamentos</option>
            </select>
          </div>

          {/* View Mode Toggle (Lista vs Grade) */}
          <div className="flex items-center rounded-xl bg-zinc-950 p-1 border border-zinc-800">
            <button
              type="button"
              onClick={() => handleViewModeChange('list')}
              className={`rounded-lg px-2.5 py-1 transition-all flex items-center gap-1.5 text-xs font-semibold ${
                viewMode === 'list'
                  ? 'bg-zinc-800 text-emerald-400 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Visualização em Lista"
              aria-label="Visualização em Lista"
            >
              <List className="h-3.5 w-3.5" />
              <span>Lista</span>
            </button>

            <button
              type="button"
              onClick={() => handleViewModeChange('grid')}
              className={`rounded-lg px-2.5 py-1 transition-all flex items-center gap-1.5 text-xs font-semibold ${
                viewMode === 'grid'
                  ? 'bg-zinc-800 text-emerald-400 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Visualização em Grade"
              aria-label="Visualização em Grade"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Grade</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Categories Content */}
      {displayedCategories.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800/80 text-zinc-400 mb-3">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-zinc-200">Nenhuma categoria encontrada</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            {searchQuery.trim()
              ? `Não encontramos categorias correspondentes ao termo "${searchQuery}".`
              : 'Nenhuma categoria cadastrada no momento.'}
          </p>
          {searchQuery.trim() && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              <span>Limpar busca</span>
            </button>
          )}
        </div>
      ) : viewMode === 'list' ? (
        /* List View */
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="border-b border-zinc-800 bg-zinc-950/80 text-[11px] uppercase tracking-wider text-zinc-400 font-mono">
                <tr>
                  <th
                    className="p-4 cursor-pointer hover:text-zinc-200 select-none transition-colors"
                    onClick={() => handleToggleColumnSort('name')}
                    title="Clique para alternar ordem alfabética"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Categoria</span>
                      {sortBy === 'name-asc' && <ArrowUp className="h-3.5 w-3.5 text-emerald-400" />}
                      {sortBy === 'name-desc' && <ArrowDown className="h-3.5 w-3.5 text-emerald-400" />}
                      {sortBy !== 'name-asc' && sortBy !== 'name-desc' && (
                        <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                      )}
                    </div>
                  </th>
                  <th
                    className="p-4 cursor-pointer hover:text-zinc-200 select-none text-right transition-colors"
                    onClick={() => handleToggleColumnSort('spent')}
                    title="Clique para ordenar por total gasto"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Gasto ({periodLabel})</span>
                      {sortBy === 'spent-desc' && <ArrowDown className="h-3.5 w-3.5 text-emerald-400" />}
                      {sortBy !== 'spent-desc' && <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />}
                    </div>
                  </th>
                  <th
                    className="p-4 cursor-pointer hover:text-zinc-200 select-none text-right transition-colors"
                    onClick={() => handleToggleColumnSort('budget')}
                    title="Clique para ordenar por teto orçamentário"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Teto ({periodLabel})</span>
                      {sortBy === 'budget-desc' && <ArrowDown className="h-3.5 w-3.5 text-emerald-400" />}
                      {sortBy !== 'budget-desc' && <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />}
                    </div>
                  </th>
                  <th className="p-4 min-w-[200px]">Consumo do Teto</th>
                  <th className="p-4 text-center">Lançamentos</th>
                  <th className="p-4 text-right pr-5">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {displayedCategories.map(({ category, status, itemCount }) => {
                  const hasBudget = status.budget > 0;
                  const isExceeded = status.alertLevel === 'danger';

                  const rowHighlight =
                    status.alertLevel === 'danger'
                      ? 'bg-rose-950/15 hover:bg-rose-950/25'
                      : 'hover:bg-zinc-800/40';

                  return (
                    <tr
                      key={category.id}
                      onClick={() => setSelectedCategoryForExpenses(category)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedCategoryForExpenses(category);
                        }
                      }}
                      className={`group transition-colors cursor-pointer ${rowHighlight}`}
                    >
                      {/* Categoria: Icon, color dot, name */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl border border-white/10 shadow-xs group-hover:scale-105 transition-transform"
                            style={{ backgroundColor: `${category.color || category.cor || '#10b981'}25` }}
                          >
                            <span>{category.iconName || '🏷️'}</span>
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className="h-2.5 w-2.5 rounded-full shrink-0 shadow-xs"
                                style={{ backgroundColor: category.color || category.cor || '#10b981' }}
                              />
                              <span className="font-bold text-zinc-100 truncate text-sm group-hover:text-emerald-300 transition-colors">
                                {category.descricao}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                              {itemCount} {itemCount === 1 ? 'gasto registrado' : 'gastos registrados'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Total Gasto */}
                      <td className="p-4 text-right font-mono font-bold text-sm text-zinc-100">
                        {formatCurrency(status.spent)}
                      </td>

                      {/* Teto */}
                      <td className="p-4 text-right font-mono text-xs">
                        {hasBudget ? (
                          <div>
                            <span className="font-semibold text-zinc-200">
                              {formatCurrency(status.budget)}
                            </span>
                            {status.monthMultiplier > 1 && (
                              <span className="text-[10px] text-zinc-500 block">
                                ({status.monthMultiplier}m)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-zinc-500">Sem teto</span>
                        )}
                      </td>

                      {/* Consumo / Progresso */}
                      <td className="p-4">
                        <div className="space-y-1.5 max-w-xs">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            {hasBudget ? (
                              <>
                                <span className="text-zinc-300 font-medium">
                                  {status.percentage}% do limite
                                </span>
                                {status.percentage >= 60 && (
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider shrink-0 ${status.badgeClass}`}
                                  >
                                    {status.alertLevel === 'danger' && '⛔ Excedido'}
                                    {status.alertLevel === 'orange' && '🚨 Atenção'}
                                    {status.alertLevel === 'yellow' && '⚠️ Cuidado'}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-zinc-500 text-[10px]">Sem teto definido</span>
                            )}
                          </div>

                          <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                hasBudget ? status.progressClass : 'bg-zinc-700'
                              }`}
                              style={{ width: hasBudget ? `${Math.min(status.percentage, 100)}%` : '0%' }}
                            />
                          </div>

                          {isExceeded && (
                            <div className="text-[10px] font-mono text-rose-400 font-semibold flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3 shrink-0" />
                              <span>+{formatCurrency(status.spent - status.budget)}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Lançamentos button */}
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCategoryForExpenses(category);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-zinc-800 bg-zinc-950/80 hover:bg-emerald-950/30 hover:border-emerald-500/40 hover:text-emerald-300 text-zinc-300 transition-colors shadow-xs"
                          title="Visualizar lançamentos desta categoria"
                        >
                          <Receipt className="h-3.5 w-3.5 text-emerald-400" />
                          <span>
                            {itemCount === 0
                              ? 'Nenhum lançamento no período'
                              : `Visualizar ${itemCount} ${itemCount === 1 ? 'lançamento' : 'lançamentos'}`}
                          </span>
                        </button>
                      </td>

                      {/* Ações */}
                      <td className="p-4 text-right pr-5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => handleEdit(category, e)}
                            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                            title="Editar Categoria"
                            aria-label={`Editar ${category.descricao}`}
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(category, e)}
                            className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-950/40 hover:text-rose-400 transition-colors"
                            title="Excluir Categoria"
                            aria-label={`Excluir ${category.descricao}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setSelectedCategoryForExpenses(category)}
                            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-emerald-400 transition-colors"
                            title="Visualizar Detalhes"
                            aria-label={`Detalhes de ${category.descricao}`}
                          >
                            <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Categories Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedCategories.map(({ category, status, itemCount }) => {
            const hasBudget = status.budget > 0;
            const isExceeded = status.alertLevel === 'danger';

            const borderAlertClass =
              status.alertLevel === 'danger'
                ? 'border-rose-500/40 bg-rose-950/15 shadow-rose-500/5 hover:border-rose-500/70'
                : status.alertLevel === 'orange'
                ? 'border-orange-500/40 bg-zinc-900/60 shadow-orange-500/5 hover:border-orange-500/70'
                : status.alertLevel === 'yellow'
                ? 'border-amber-500/40 bg-zinc-900/60 shadow-amber-500/5 hover:border-amber-500/70'
                : 'border-zinc-800/90 bg-zinc-900/60 hover:border-zinc-700';

            return (
              <div
                key={category.id}
                onClick={() => setSelectedCategoryForExpenses(category)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedCategoryForExpenses(category);
                  }
                }}
                className={`group rounded-2xl border p-5 flex flex-col justify-between space-y-4 transition-all duration-200 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 outline-none focus:ring-2 focus:ring-emerald-500/50 ${borderAlertClass}`}
              >
                {/* Top Row: Icon, Name, Color dot, Actions */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-2xl border border-white/10 shadow-sm group-hover:scale-105 transition-transform"
                      style={{ backgroundColor: `${category.color || category.cor || '#10b981'}25` }}
                    >
                      <span>{category.iconName || '🏷️'}</span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: category.color || category.cor || '#10b981' }}
                        />
                        <h4 className="text-sm font-bold text-zinc-100 truncate group-hover:text-emerald-300 transition-colors">
                          {category.descricao}
                        </h4>
                      </div>
                      <p className="text-xs text-zinc-400 font-mono mt-0.5">
                        {itemCount} {itemCount === 1 ? 'gasto no período' : 'gastos no período'}
                      </p>
                    </div>
                  </div>

                  {/* Edit & Delete */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => handleEdit(category, e)}
                      className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                      title="Editar Categoria"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(category, e)}
                      className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-950/40 hover:text-rose-400 transition-colors"
                      title="Excluir Categoria"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Middle Row: Spending & Budget */}
                <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-400">
                      Gasto: <strong className="text-zinc-200">{formatCurrency(status.spent)}</strong>
                    </span>
                    <span className="text-zinc-400">
                      Teto:{' '}
                      {hasBudget ? (
                        <strong className="text-zinc-200">
                          {formatCurrency(status.budget)}
                          {status.monthMultiplier > 1 && (
                            <span className="text-[10px] text-zinc-500 font-normal">
                              {' '}({status.monthMultiplier}m)
                            </span>
                          )}
                        </strong>
                      ) : (
                        <span className="text-zinc-500">Sem teto</span>
                      )}
                    </span>
                  </div>

                  {/* Horizontal Progress Bar matching global standard */}
                  <div className="space-y-1">
                    <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          hasBudget ? status.progressClass : 'bg-zinc-700'
                        }`}
                        style={{ width: hasBudget ? `${Math.min(status.percentage, 100)}%` : '0%' }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono">
                      {hasBudget ? (
                        status.percentage >= 60 ? (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider shrink-0 ${status.badgeClass}`}
                          >
                            {status.alertLevel === 'danger' && '⛔ '}
                            {status.alertLevel === 'orange' && '🚨 '}
                            {status.alertLevel === 'yellow' && '⚠️ '}
                            {status.percentage >= 100
                              ? '100% do limite'
                              : status.percentage >= 80
                              ? '80% do limite'
                              : '60% do limite'}
                          </span>
                        ) : (
                          <span className="text-zinc-400 font-medium">{status.percentage}% do limite</span>
                        )
                      ) : (
                        <span className="text-zinc-500">Sem teto definido</span>
                      )}

                      {isExceeded && (
                        <span className="text-rose-400 font-bold flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> +
                          {formatCurrency(status.spent - status.budget)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Quick Action: Visualizar Lançamentos */}
                <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400 group-hover:text-emerald-400 transition-colors">
                  <span className="flex items-center gap-1.5 text-[11px] font-medium">
                    <Receipt className="h-3.5 w-3.5" />
                    <span>
                      {itemCount === 0
                        ? 'Nenhum lançamento no período'
                        : `Visualizar ${itemCount} ${itemCount === 1 ? 'lançamento' : 'lançamentos'}`}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setCategoryToEdit(null);
        }}
        categoryToEdit={categoryToEdit}
      />

      <CategoryExpensesModal
        isOpen={Boolean(selectedCategoryForExpenses)}
        onClose={() => setSelectedCategoryForExpenses(null)}
        category={selectedCategoryForExpenses}
      />
    </div>
  );
}

export default CategoriesPage;
