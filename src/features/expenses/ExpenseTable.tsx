import * as React from 'react';
import { Gasto, StatusGasto } from '../../types/financial';
import { useAppStore } from '../../stores/useAppStore';
import { CategoryBadge } from '../../components/common/CategoryBadge';
import { ExpenseStatusModal } from './ExpenseStatusModal';
import { MoneyDisplay } from '../../components/common/MoneyDisplay';
import { Badge } from '../../components/ui/Badge';
import { formatDate, getDaysDifference } from '../../lib/utils';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  Repeat,
  Layers,
  Edit3,
  Trash2,
  Lock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

interface ExpenseTableProps {
  expenses: Gasto[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
}

export function ExpenseTable({
  expenses,
  selectedIds,
  onToggleSelect,
  onSelectAll,
}: ExpenseTableProps) {
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

  const isAllSelected = expenses.length > 0 && selectedIds.length === expenses.length;

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-zinc-300">
          <thead className="border-b border-zinc-800 bg-zinc-950/80 text-[11px] uppercase tracking-wider text-zinc-400 font-mono">
            <tr>
              <th className="p-4 w-10">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={onSelectAll}
                  className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500"
                />
              </th>
              <th className="p-4">Descrição</th>
              <th className="p-4">Categoria</th>
              <th className="p-4">Vencimento</th>
              <th className="p-4">Cartão / Pagamento</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Valor</th>
              <th className="p-4 text-center w-20">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {expenses.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-zinc-400 text-xs">
                  Nenhum lançamento encontrado para os filtros selecionados.
                </td>
              </tr>
            ) : (
              expenses.map((expense) => {
                const category = categories.find((c) => c.id === expense.categoriaId);
                const isSelected = selectedIds.includes(expense.id);
                const isPaid = expense.status === 'pago';
                const daysDiff = getDaysDifference(expense.dataVencimento);

                return (
                  <tr
                    key={expense.id}
                    className={`group transition-colors hover:bg-zinc-800/40 ${
                      isSelected ? 'bg-emerald-950/15' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(expense.id)}
                        className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500"
                      />
                    </td>

                    {/* Description */}
                    <td className="p-4 font-semibold text-zinc-100">
                      <div className="flex items-center gap-2">
                        <span className={isPaid ? 'line-through text-zinc-400' : ''}>
                          {expense.descricao}
                        </span>

                        {/* Origin tag */}
                        {expense.origemLancamento === 'parcelado' && expense.parcelaAtual && (
                          <span className="rounded bg-zinc-800 border border-zinc-700 px-1.5 py-0.2 text-[10px] font-mono text-zinc-300 font-bold">
                            {expense.parcelaAtual}/{expense.numeroParcelas}
                          </span>
                        )}

                        {expense.origemLancamento === 'recorrente' && (
                          <span title="Despesa Recorrente">
                            <Repeat className="h-3.5 w-3.5 text-indigo-400" />
                          </span>
                        )}

                        {expense.naoCompartilhar && (
                          <span title="Gasto Pessoal Privado">
                            <Lock className="h-3 w-3 text-amber-400" />
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="p-4">
                      <CategoryBadge categoria={category} size="sm" />
                    </td>

                    {/* Due Date */}
                    <td className="p-4 font-mono text-zinc-400">
                      <span>{formatDate(expense.dataVencimento)}</span>
                      {!isPaid && daysDiff <= 3 && (
                        <span
                          className={`ml-1.5 text-[10px] font-bold ${
                            daysDiff < 0
                              ? 'text-rose-400'
                              : daysDiff === 0
                              ? 'text-amber-400'
                              : 'text-amber-300'
                          }`}
                        >
                          {daysDiff < 0 ? 'Atrasado' : daysDiff === 0 ? 'Hoje' : `${daysDiff}d`}
                        </span>
                      )}
                    </td>

                    {/* Card / Account */}
                    <td className="p-4">
                      {expense.cartaoNome ? (
                        <span className="inline-flex items-center gap-1 text-xs text-zinc-300">
                          <CreditCard className="h-3.5 w-3.5 text-purple-400" />
                          <span className="truncate max-w-[130px]">{expense.cartaoNome}</span>
                        </span>
                      ) : (
                        <span className="text-zinc-500">Conta / PIX</span>
                      )}
                    </td>

                    {/* Status Badge & Toggle Button */}
                    <td className="p-4">
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
                    </td>

                    {/* Value */}
                    <td className="p-4 text-right">
                      <MoneyDisplay
                        value={expense.valor}
                        type={expense.tipo === 'receita' ? 'positive' : 'negative'}
                        size="sm"
                      />
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
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
