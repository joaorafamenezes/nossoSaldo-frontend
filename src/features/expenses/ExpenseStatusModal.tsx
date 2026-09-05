import * as React from 'react';
import { Gasto } from '../../types/financial';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { CheckCircle2, RotateCcw, X, AlertCircle, Calendar, Tag } from 'lucide-react';

interface ExpenseStatusModalProps {
  expense: Gasto | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (expense: Gasto) => void;
}

export function ExpenseStatusModal({
  expense,
  isOpen,
  onClose,
  onConfirm,
}: ExpenseStatusModalProps) {
  if (!isOpen || !expense) return null;

  const isPaid = expense.status === 'pago';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md rounded-3xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${
                isPaid
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                  : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              }`}
            >
              {isPaid ? <RotateCcw className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100">
                {isPaid ? 'Confirmar Reabertura' : 'Confirmar Pagamento'}
              </h3>
              <p className="text-xs text-zinc-400">
                {isPaid ? 'Alterar status para Pendente' : 'Registrar quitação do lançamento'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Box */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">Descrição:</span>
              <strong className="text-sm text-zinc-100 font-semibold truncate max-w-[200px]">
                {expense.descricao}
              </strong>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Vencimento:</span>
              <span className="text-zinc-200 font-mono">
                {formatDate(expense.dataVencimento)}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-800/80">
              <span className="text-zinc-400">Valor do Lançamento:</span>
              <strong
                className={`font-mono text-base font-bold ${
                  expense.tipo === 'receita' ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {formatCurrency(expense.valor)}
              </strong>
            </div>
          </div>

          <div
            className={`flex items-start gap-2.5 rounded-xl border p-3 text-xs leading-relaxed ${
              isPaid
                ? 'border-amber-500/20 bg-amber-950/20 text-amber-200/90'
                : 'border-emerald-500/20 bg-emerald-950/20 text-emerald-200/90'
            }`}
          >
            <AlertCircle
              className={`h-4 w-4 shrink-0 mt-0.5 ${
                isPaid ? 'text-amber-400' : 'text-emerald-400'
              }`}
            />
            <span>
              {isPaid ? (
                <>
                  Deseja realmente <strong>reabrir</strong> o lançamento de{' '}
                  <strong>{formatCurrency(expense.valor)}</strong>? Ele voltará para a lista de despesas pendentes.
                </>
              ) : (
                <>
                  Deseja realmente confirmar o <strong>pagamento</strong> de{' '}
                  <strong>{formatCurrency(expense.valor)}</strong>? Ele será marcado como quitado.
                </>
              )}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant={isPaid ? 'secondary' : 'primary'}
            className={`flex-1 font-bold ${
              isPaid
                ? 'bg-amber-600/20 text-amber-300 border border-amber-500/40 hover:bg-amber-600/30'
                : 'shadow-glow-emerald'
            }`}
            onClick={() => {
              onConfirm(expense);
              onClose();
            }}
          >
            {isPaid ? (
              <>
                <RotateCcw className="h-4 w-4 mr-1.5" />
                <span>Sim, Reabrir</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                <span>Sim, Confirmar Pagamento</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
