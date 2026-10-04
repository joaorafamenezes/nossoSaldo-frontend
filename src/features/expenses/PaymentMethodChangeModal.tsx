import * as React from 'react';
import { Button } from '../../components/ui/Button';
import { CreditCard, Landmark, AlertCircle, X, Check, ArrowRight, Layers, Repeat } from 'lucide-react';

export type PaymentChangeMode = 'parcelado' | 'recorrente';

interface PaymentMethodChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (atualizarTodos: boolean) => void;
  mode: PaymentChangeMode;
  descricao: string;
  origemNome?: string;
  destinoNome?: string;
  numeroParcela?: number;
  totalParcelas?: number;
  competencia?: string;
  isSubmitting?: boolean;
}

export function PaymentMethodChangeModal({
  isOpen,
  onClose,
  onConfirm,
  mode,
  descricao,
  origemNome = 'Cartão de Crédito',
  destinoNome = 'Conta Corrente / PIX / Dinheiro',
  numeroParcela,
  totalParcelas,
  competencia,
  isSubmitting = false,
}: PaymentMethodChangeModalProps) {
  const [selectedOption, setSelectedOption] = React.useState<boolean>(true);

  if (!isOpen) return null;

  const isParcelado = mode === 'parcelado';

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl p-6 text-zinc-100 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 shrink-0">
              {isParcelado ? <Layers className="h-5 w-5" /> : <Repeat className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100">
                {isParcelado
                  ? 'Atualizar forma de pagamento das parcelas'
                  : 'Atualizar forma de pagamento da recorrência'}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                {descricao}{' '}
                {isParcelado && numeroParcela && totalParcelas
                  ? `(Parcela ${numeroParcela}/${totalParcelas})`
                  : competencia
                  ? `(${competencia})`
                  : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Transition Summary pill */}
        <div className="my-4 flex items-center justify-between rounded-xl bg-zinc-950 p-3 border border-zinc-800 text-xs">
          <div className="flex items-center gap-2 text-zinc-300">
            <CreditCard className="h-4 w-4 text-purple-400" />
            <span className="font-medium truncate max-w-[140px] sm:max-w-[180px]">{origemNome}</span>
          </div>
          <ArrowRight className="h-4 w-4 text-zinc-500 shrink-0 mx-2" />
          <div className="flex items-center gap-2 text-emerald-400 font-semibold">
            <Landmark className="h-4 w-4 text-emerald-400" />
            <span className="truncate max-w-[140px] sm:max-w-[180px]">{destinoNome}</span>
          </div>
        </div>

        {/* Question Prompt */}
        <div className="mb-4">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold mb-1">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>
              {isParcelado
                ? 'Os demais registros deverão ser atualizados também?'
                : 'Deseja que todos os registros da recorrência sejam atualizados?'}
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            {isParcelado
              ? 'Você pode migrar todas as parcelas para a nova forma de pagamento ou aplicar a alteração apenas nesta parcela.'
              : 'Você pode atualizar toda a série da recorrência ou aplicar a alteração apenas para a recorrência deste mês.'}
          </p>
        </div>

        {/* Option Choices */}
        <div className="space-y-3 mb-6">
          {/* Option YES (All) */}
          <label
            onClick={() => setSelectedOption(true)}
            className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
              selectedOption === true
                ? 'bg-purple-950/20 border-purple-500/50 shadow-xs'
                : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <input
              type="radio"
              name="paymentScope"
              checked={selectedOption === true}
              onChange={() => setSelectedOption(true)}
              className="mt-0.5 text-purple-600 focus:ring-purple-500 h-4 w-4"
            />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                <span>{isParcelado ? 'Sim, atualizar todas as parcelas' : 'Sim, atualizar toda a recorrência'}</span>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.2 rounded font-normal">
                  Migração completa
                </span>
              </span>
              <p className="text-[11px] text-zinc-400 mt-1">
                {isParcelado
                  ? 'Todas as parcelas deste gasto serão migradas para a forma de pagamento selecionada.'
                  : 'Atualiza toda a série da recorrência para a forma de pagamento selecionada.'}
              </p>
            </div>
          </label>

          {/* Option NO (Only this) */}
          <label
            onClick={() => setSelectedOption(false)}
            className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
              selectedOption === false
                ? 'bg-purple-950/20 border-purple-500/50 shadow-xs'
                : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <input
              type="radio"
              name="paymentScope"
              checked={selectedOption === false}
              onChange={() => setSelectedOption(false)}
              className="mt-0.5 text-purple-600 focus:ring-purple-500 h-4 w-4"
            />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                <span>
                  {isParcelado
                    ? 'Não, manter demais parcelas no cartão de crédito'
                    : 'Não, atualizar somente a recorrência selecionada'}
                </span>
                <span className="text-[10px] bg-zinc-800 text-zinc-300 border border-zinc-700 px-1.5 py-0.2 rounded font-normal">
                  Apenas este registro
                </span>
              </span>
              <p className="text-[11px] text-zinc-400 mt-1">
                {isParcelado
                  ? 'Atualiza somente esta parcela para a nova forma de pagamento. As demais parcelas continuam como estão no cartão de crédito.'
                  : 'Apenas a ocorrência selecionada deste mês será atualizada. As demais mantêm a forma de pagamento original.'}
              </p>
            </div>
          </label>
        </div>

        {/* Buttons Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs text-zinc-400 hover:text-zinc-200"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => onConfirm(selectedOption)}
            disabled={isSubmitting}
            className="text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-lg shadow-purple-950/30"
          >
            <Check className="h-3.5 w-3.5" />
            <span>{isSubmitting ? 'Salvando...' : 'Confirmar e Aplicar'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
