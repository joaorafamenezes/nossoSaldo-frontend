import * as React from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { Categoria } from '../../types/financial';
import { CategoryModal } from './CategoryModal';
import { Button } from '../../components/ui/Button';
import {
  FolderTree,
  PlusCircle,
  Edit3,
  Trash2,
  AlertTriangle,
  Sparkles,
  PieChart,
  Tag,
} from 'lucide-react';
import {
  formatCurrency,
  formatDate,
  getCompetenciaDisplay,
  getCategoryBudgetStatus,
  getExpensesForCompetence,
} from '../../lib/utils';
import { toast } from 'sonner';

export function CategoriesPage() {
  const {
    categories,
    expenses,
    selectedCompetencia,
    dateFilterMode,
    customStartDate,
    customEndDate,
    deleteCategory,
  } = useAppStore();

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [categoryToEdit, setCategoryToEdit] = React.useState<Categoria | null>(null);

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
  const categoriesWithStatus = React.useMemo(() => {
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

  const totalPeriodBudget = categoriesWithStatus.reduce((sum, item) => sum + item.status.budget, 0);
  const totalPeriodSpent = categoriesWithStatus.reduce((sum, item) => sum + item.status.spent, 0);

  const handleEdit = (cat: Categoria) => {
    setCategoryToEdit(cat);
    setIsModalOpen(true);
  };

  const handleDelete = async (cat: Categoria) => {
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
            Monitorando período ativo: <strong className="text-zinc-200">{periodLabel}</strong>
          </p>
        </div>

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

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categoriesWithStatus.map(({ category, status, itemCount }) => {
          const hasBudget = status.budget > 0;
          const isExceeded = status.alertLevel === 'danger';

          const borderAlertClass =
            status.alertLevel === 'danger'
              ? 'border-rose-500/40 bg-rose-950/15 shadow-rose-500/5'
              : status.alertLevel === 'orange'
              ? 'border-orange-500/40 bg-zinc-900/60 shadow-orange-500/5'
              : status.alertLevel === 'yellow'
              ? 'border-amber-500/40 bg-zinc-900/60 shadow-amber-500/5'
              : 'border-zinc-800/90 bg-zinc-900/60 hover:border-zinc-700';

          return (
            <div
              key={category.id}
              className={`rounded-2xl border p-5 flex flex-col justify-between space-y-4 transition-all duration-200 ${borderAlertClass}`}
            >
              {/* Top Row: Icon, Name, Color dot, Actions */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-2xl border border-white/10 shadow-sm"
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
                      <h4 className="text-sm font-bold text-zinc-100 truncate">
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
                    onClick={() => handleEdit(category)}
                    className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                    title="Editar Categoria"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(category)}
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
            </div>
          );
        })}
      </div>

      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setCategoryToEdit(null);
        }}
        categoryToEdit={categoryToEdit}
      />
    </div>
  );
}

export default CategoriesPage;
