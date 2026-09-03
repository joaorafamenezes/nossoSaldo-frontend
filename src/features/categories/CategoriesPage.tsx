import * as React from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { Categoria } from '../../types/financial';
import { CategoryModal } from './CategoryModal';
import { Button } from '../../components/ui/Button';
import { Progress } from '../../components/ui/Progress';
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
import { formatCurrency } from '../../lib/utils';
import { toast } from 'sonner';

export function CategoriesPage() {
  const { categories, expenses, selectedCompetencia, deleteCategory } = useAppStore();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [categoryToEdit, setCategoryToEdit] = React.useState<Categoria | null>(null);

  // Month expenses
  const monthExpenses = expenses.filter((e) => e.competencia.startsWith(selectedCompetencia));

  const totalMonthlyBudget = categories.reduce((sum, c) => sum + (Number(c.teto ?? c.orcamentoMensal ?? 0)), 0);
  const totalMonthlySpent = monthExpenses
    .filter((e) => e.tipo === 'despesa')
    .reduce((sum, e) => sum + e.valor, 0);

  const handleEdit = (cat: Categoria) => {
    setCategoryToEdit(cat);
    setIsModalOpen(true);
  };

  const handleDelete = async (cat: Categoria) => {
    const attachedCount = expenses.filter((e) => e.categoriaId === cat.id).length;
    if (attachedCount > 0) {
      if (!confirm(`A categoria "${cat.descricao}" possui ${attachedCount} lançamentos vinculados. Deseja realmente excluí-la?`)) {
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
            Gerenciamento de Categorias
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Crie, personalize cores e configure tetos de gastos por categoria
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
          <p className="text-2xl font-bold font-mono text-zinc-100 mt-1">
            {categories.length}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <p className="text-xs font-semibold uppercase text-zinc-400">Teto Orçamentário Total</p>
          <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {formatCurrency(totalMonthlyBudget)}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <p className="text-xs font-semibold uppercase text-zinc-400">Total Gasto no Mês ({selectedCompetencia})</p>
          <p className="text-2xl font-bold font-mono text-rose-400 mt-1">
            {formatCurrency(totalMonthlySpent)}
          </p>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => {
          const categoryExpenses = monthExpenses.filter(
            (e) => e.categoriaId === category.id && e.tipo === 'despesa'
          );
          const spent = categoryExpenses.reduce((sum, e) => sum + e.valor, 0);
          const budget = Number(category.teto ?? category.orcamentoMensal ?? 0);
          const usagePercent = budget > 0 ? Math.round((spent / budget) * 100) : 0;
          const isExceeded = budget > 0 && spent > budget;

          return (
            <div
              key={category.id}
              className={`rounded-2xl border p-5 flex flex-col justify-between space-y-4 transition-all duration-200 ${
                isExceeded
                  ? 'border-rose-500/40 bg-rose-950/15'
                  : 'border-zinc-800/90 bg-zinc-900/60 hover:border-zinc-700'
              }`}
            >
              {/* Top Row: Icon, Name, Color dot, Actions */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-2xl border border-white/10 shadow-sm"
                    style={{ backgroundColor: `${category.color || '#10b981'}25` }}
                  >
                    <span>{category.iconName || '🏷️'}</span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: category.color || '#10b981' }}
                      />
                      <h4 className="text-sm font-bold text-zinc-100 truncate">
                        {category.descricao}
                      </h4>
                    </div>
                    <p className="text-xs text-zinc-400 font-mono mt-0.5">
                      {categoryExpenses.length} {categoryExpenses.length === 1 ? 'gasto este mês' : 'gastos este mês'}
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
                  <span className="text-zinc-400">Gasto: <strong className="text-zinc-200">{formatCurrency(spent)}</strong></span>
                  <span className="text-zinc-400">
                    Teto: {budget > 0 ? <strong className="text-zinc-200">{formatCurrency(budget)}</strong> : <span className="text-zinc-500">Sem teto</span>}
                  </span>
                </div>

                {budget > 0 && (
                  <div className="space-y-1">
                    <Progress
                      value={usagePercent}
                      indicatorColor={isExceeded ? 'bg-rose-500' : usagePercent >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}
                    />
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className={isExceeded ? 'text-rose-400 font-bold' : 'text-zinc-400'}>
                        {usagePercent}% do limite
                      </span>
                      {isExceeded && (
                        <span className="text-rose-400 font-bold flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> +{formatCurrency(spent - budget)}
                        </span>
                      )}
                    </div>
                  </div>
                )}
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
