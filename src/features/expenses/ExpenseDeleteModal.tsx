import * as React from 'react';
import { Gasto } from '../../types/financial';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface ExpenseDeleteModalProps {
  expense?: Gasto | null;
  selectedExpenses?: Gasto[];
  selectedCount?: number;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (expense?: Gasto) => void | Promise<void>;
}

export function ExpenseDeleteModal({
  expense,
  selectedExpenses = [],
  selectedCount,
  isOpen,
  onClose,
  onConfirm,
}: ExpenseDeleteModalProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);

  if (!isOpen) return null;

  const isBatch = !expense && ((selectedCount !== undefined && selectedCount > 0) || selectedExpenses.length > 0);
  const count = isBatch ? (selectedCount ?? selectedExpenses.length) : 1;

  if (!expense && !isBatch) return null;

  const isReceita = expense?.tipo === 'receita';
  const totalBatchValue = isBatch
    ? selectedExpenses.reduce((sum, item) => sum + (Number(item.valor) || 0), 0)
    : 0;

  const handleConfirmClick = async () => {
    try {
      setIsDeleting(true);
      await onConfirm(expense || undefined);
      onClose();
    } catch {
      // Error handled by caller
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md rounded-3xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border bg-rose-500/15 border-rose-500/30 text-rose-400">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100">
                Confirmar Exclusão
              </h3>
              <p className="text-xs text-zinc-400">
                {isBatch
                  ? `Remover ${count} ${count === 1 ? 'lançamento selecionado' : 'lançamentos selecionados'}`
                  : isReceita
                  ? 'Remover registro de receita'
                  : 'Remover registro de despesa'}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-50"
            title="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Message and Expense Details */}
        <div className="space-y-4">
          <p className="text-sm text-zinc-200">
            {isBatch ? (
              <>
                Deseja realmente remover os <strong className="text-white">{count} lançamentos selecionados</strong>?
              </>
            ) : (
              <>
                Deseja realmente remover o lançamento <strong className="text-white">"{expense?.descricao}"</strong>?
              </>
            )}
          </p>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 space-y-2.5">
            {isBatch ? (
              <>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Quantidade:</span>
                  <span className="text-zinc-200 font-semibold">
                    {count} {count === 1 ? 'item' : 'itens'}
                  </span>
                </div>

                {totalBatchValue > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Valor Total:</span>
                    <span className="text-zinc-100 font-mono font-bold text-sm">
                      {formatCurrency(totalBatchValue)}
                    </span>
                  </div>
                )}

                {selectedExpenses.length > 0 && (
                  <div className="pt-2 border-t border-zinc-800/80 space-y-1.5 max-h-36 overflow-y-auto">
                    <span className="text-[11px] text-zinc-400 block font-medium">Itens selecionados:</span>
                    {selectedExpenses.map((exp) => (
                      <div key={exp.id} className="flex items-center justify-between text-xs text-zinc-300">
                        <span className="truncate max-w-[240px]">• {exp.descricao}</span>
                        <span className="font-mono text-zinc-400 text-[11px]">{formatCurrency(exp.valor)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              expense && (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Tipo:</span>
                    <span
                      className={`font-semibold uppercase tracking-wider text-[11px] ${
                        isReceita ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isReceita ? 'Receita (+)' : 'Despesa (-)'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Valor:</span>
                    <span className="text-zinc-100 font-mono font-bold text-sm">
                      {formatCurrency(expense.valor)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Vencimento:</span>
                    <span className="text-zinc-200 font-mono">
                      {formatDate(expense.dataVencimento)}
                    </span>
                  </div>

                  {expense.observacao && (
                    <div className="pt-2 border-t border-zinc-800/80 text-xs">
                      <span className="text-zinc-400 block mb-0.5">Observação:</span>
                      <span className="text-zinc-300 italic">{expense.observacao}</span>
                    </div>
                  )}
                </>
              )
            )}
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-300">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
            <span>
              {isBatch
                ? `Esta ação removerá todos os ${count} registros selecionados do seu histórico financeiro. Você pode cancelar caso deseje voltar atrás.`
                : 'Esta ação removerá este registro do seu histórico financeiro. Você pode cancelar caso deseje voltar atrás.'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            disabled={isDeleting}
            onClick={onClose}
          >
            Voltar atrás
          </Button>
          <Button
            type="button"
            variant="danger"
            className="flex-1 font-bold shadow-glow-rose"
            disabled={isDeleting}
            onClick={handleConfirmClick}
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            <span>{isDeleting ? 'Excluindo...' : isBatch ? `Sim, Excluir (${count})` : 'Sim, Excluir'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
