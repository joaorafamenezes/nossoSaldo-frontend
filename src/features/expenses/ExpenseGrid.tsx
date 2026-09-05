import * as React from 'react';
import { Gasto } from '../../types/financial';
import { useAppStore } from '../../stores/useAppStore';
import { CategoryBadge } from '../../components/common/CategoryBadge';
import { ExpenseStatusModal } from './ExpenseStatusModal';
import { MoneyDisplay } from '../../components/common/MoneyDisplay';
import { Badge } from '../../components/ui/Badge';
import { formatDate, getDaysDifference } from '../../lib/utils';
import { CheckCircle2, Clock, CreditCard, Edit3, Trash2, Repeat, Lock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

interface ExpenseGridProps {
  expenses: Gasto[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
}

export function ExpenseGrid({
  expenses,
  selectedIds,
  onToggleSelect,
}: ExpenseGridProps) {
  const { categories, toggleExpenseStatus, openEditExpense, deleteExpense } = useAppStore();
  const [statusExpenseToConfirm, setStatusExpenseToConfirm] = React.useState<Gasto | null>(null);

  const handleConfirmStatus = (expense: Gasto) => {
    const isPaid = expense.status === 'pago';
    if (!isPaid) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
      toast.success(`Lançamento "${expense.descricao}" marcado como PAGO!`);
    } else {
      toast.info(`Lançamento "${expense.descricao}" reaberto como PENDENTE.`);
    }
    toggleExpenseStatus(expense.id);
  };

  if (expenses.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-12 text-center text-xs text-zinc-400">
        Nenhum lançamento encontrado para os filtros selecionados.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {expenses.map((expense) => {
          const category = categories.find((c) => c.id === expense.categoriaId);
          const isSelected = selectedIds.includes(expense.id);
          const isPaid = expense.status === 'pago';
          const daysDiff = getDaysDifference(expense.dataVencimento);

          return (
            <div
              key={expense.id}
              className={`group rounded-2xl border p-4 transition-all duration-200 flex flex-col justify-between space-y-3 ${
                isSelected
                  ? 'border-emerald-500/50 bg-emerald-950/15 shadow-glow-emerald'
                  : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700/80'
              }`}
            >
              {/* Top header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(expense.id)}
                    className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500 shrink-0"
                  />
                  <CategoryBadge categoria={category} size="sm" />
                </div>

                <button
                  onClick={() => setStatusExpenseToConfirm(expense)}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  title="Clique para alternar o status"
                >
                  {isPaid ? (
                    <Badge variant="success">Pago</Badge>
                  ) : daysDiff < 0 ? (
                    <Badge variant="danger">Atrasado</Badge>
                  ) : (
                    <Badge variant="warning">Pendente</Badge>
                  )}
                </button>
              </div>

              {/* Description & Value */}
              <div>
                <div className="flex items-center gap-2">
                  <h4
                    className={`text-sm font-semibold truncate text-zinc-100 ${
                      isPaid && 'line-through text-zinc-400'
                    }`}
                  >
                    {expense.descricao}
                  </h4>
                  {expense.origemLancamento === 'parcelado' && expense.parcelaAtual && (
                    <span className="rounded bg-zinc-800 border border-zinc-700 px-1.5 py-0.2 text-[10px] font-mono text-zinc-300 font-bold">
                      {expense.parcelaAtual}/{expense.numeroParcelas}
                    </span>
                  )}
                  {expense.origemLancamento === 'recorrente' && (
                    <Repeat className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                  )}
                  {expense.naoCompartilhar && (
                    <Lock className="h-3 w-3 text-amber-400 shrink-0" />
                  )}
                </div>

                <div className="mt-2">
                  <MoneyDisplay
                    value={expense.valor}
                    type={expense.tipo === 'receita' ? 'positive' : 'negative'}
                    size="xl"
                  />
                </div>
              </div>

              {/* Bottom info & actions */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-400">
                <div className="flex items-center gap-1.5 font-mono">
                  <span>Vence: {formatDate(expense.dataVencimento)}</span>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEditExpense(expense)}
                    className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                    title="Editar"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => deleteExpense(expense.id)}
                    className="rounded-lg p-1 text-zinc-400 hover:bg-rose-950/40 hover:text-rose-400"
                    title="Excluir"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <ExpenseStatusModal
        expense={statusExpenseToConfirm}
        isOpen={!!statusExpenseToConfirm}
        onClose={() => setStatusExpenseToConfirm(null)}
        onConfirm={handleConfirmStatus}
      />
    </>
  );
}
