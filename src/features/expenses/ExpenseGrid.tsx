import * as React from 'react';
import { Gasto } from '../../types/financial';
import { useAppStore } from '../../stores/useAppStore';
import { CategoryBadge } from '../../components/common/CategoryBadge';
import { ExpenseStatusModal } from './ExpenseStatusModal';
import { MoneyDisplay } from '../../components/common/MoneyDisplay';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatDate, formatCurrency, getDaysDifference } from '../../lib/utils';
import {
  CheckCircle2,
  Clock,
  CreditCard,
  Edit3,
  Trash2,
  Repeat,
  Lock,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';
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
  const { categories, toggleExpenseStatus, toggleInstallmentStatus, openEditExpense, deleteExpense } = useAppStore();
  const [statusExpenseToConfirm, setStatusExpenseToConfirm] = React.useState<Gasto | null>(null);
  const [statusInstallmentToConfirm, setStatusInstallmentToConfirm] = React.useState<any | null>(null);
  const [expandedParcelas, setExpandedParcelas] = React.useState<Record<string, boolean>>({});

  const toggleParcelas = (id: string) => {
    setExpandedParcelas((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

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

  const handleToggleInstallment = (gastoId: string, installment: any) => {
    const isPaid = installment.status === 'pago';
    if (!isPaid) {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.8 },
      });
      toast.success(`Parcela ${installment.numeroParcela} marcada como PAGA!`);
    } else {
      toast.info(`Parcela ${installment.numeroParcela} reaberta como PENDENTE.`);
    }
    toggleInstallmentStatus(gastoId, installment.id);
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
          const isParcelado = expense.origemLancamento === 'parcelado' || (expense.lancamentosBase && expense.lancamentosBase.length > 0);
          const isExpanded = expandedParcelas[expense.id];

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
                <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(expense.id)}
                    className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500 shrink-0"
                  />
                  <CategoryBadge categoria={category} size="sm" />

                  {isParcelado && (
                    <button
                      type="button"
                      onClick={() => toggleParcelas(expense.id)}
                      className="rounded bg-purple-950/60 border border-purple-800/60 px-2 py-0.5 text-[10px] font-mono text-purple-300 font-bold hover:bg-purple-900/60 transition-colors flex items-center gap-1"
                      title="Minimizar / Maximizar parcelas"
                    >
                      <Repeat className="h-3 w-3 text-purple-400" />
                      <span>{expense.numeroParcelas || expense.lancamentosBase?.length}x</span>
                      <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => {
                    setStatusInstallmentToConfirm(null);
                    setStatusExpenseToConfirm(expense);
                  }}
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
                  {expense.origemLancamento === 'recorrente' && (
                    <Repeat className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                  )}
                  {expense.naoCompartilhar && (
                    <Lock className="h-3 w-3 text-amber-400 shrink-0" />
                  )}
                </div>

                <div className="mt-2 flex items-baseline justify-between">
                  <MoneyDisplay
                    value={expense.valor}
                    type={expense.tipo === 'receita' ? 'positive' : 'negative'}
                    size="xl"
                  />
                  {expense.cartaoNome && (
                    <span className="text-[11px] text-purple-400 font-mono truncate max-w-[120px]">
                      💳 {expense.cartaoNome}
                    </span>
                  )}
                </div>
              </div>

              {/* Expandable Child Installments List */}
              {isParcelado && isExpanded && (
                <div className="pt-3 border-t border-zinc-800 space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-indigo-400">Parcelas:</span>
                    <button
                      type="button"
                      onClick={() => toggleParcelas(expense.id)}
                      className="text-zinc-400 hover:underline"
                    >
                      Minimizar ▴
                    </button>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {(expense.lancamentosBase && expense.lancamentosBase.length > 0
                      ? expense.lancamentosBase
                      : Array.from({ length: expense.numeroParcelas || 1 }, (_, idx) => {
                          const num = idx + 1;
                          const baseDate = new Date(expense.dataVencimento || new Date());
                          baseDate.setMonth(baseDate.getMonth() + idx);
                          return {
                            id: `temp-${expense.id}-${num}`,
                            gastoId: expense.id,
                            numeroParcela: num,
                            valorParcela: expense.valor / (expense.numeroParcelas || 1),
                            dataVencimentoParcela: baseDate.toISOString().split('T')[0],
                            status: num <= (expense.parcelaAtual || 1) && expense.status === 'pago' ? 'pago' : 'pendente',
                          };
                        })
                    ).map((inst: any) => {
                      const isInstPaid = inst.status === 'pago';
                      return (
                        <div
                          key={inst.id}
                          className={`flex items-center justify-between p-2 rounded-lg border text-xs ${
                            isInstPaid ? 'bg-emerald-950/20 border-emerald-500/20' : 'bg-zinc-950 border-zinc-800'
                          }`}
                        >
                          <div className="min-w-0 pr-1">
                            <span className="font-bold font-mono text-[11px] text-zinc-200">
                              {inst.numeroParcela}/{expense.numeroParcelas} - {formatCurrency(inst.valorParcela)}
                            </span>
                            <span className="text-[10px] text-zinc-400 block font-mono">
                              {formatDate(inst.dataVencimentoParcela)}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant={isInstPaid ? 'secondary' : 'primary'}
                            onClick={(e) => {
                              e.stopPropagation();
                              setStatusExpenseToConfirm(expense);
                              setStatusInstallmentToConfirm(inst);
                            }}
                            className={`text-[10px] px-2 py-0.5 h-6 rounded ${
                              isInstPaid ? 'bg-zinc-800 text-zinc-300' : 'bg-emerald-600 text-white'
                            }`}
                          >
                            {isInstPaid ? 'Reabrir' : 'Pagar'}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

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
        installment={statusInstallmentToConfirm}
        isOpen={!!statusExpenseToConfirm}
        onClose={() => {
          setStatusExpenseToConfirm(null);
          setStatusInstallmentToConfirm(null);
        }}
        onConfirm={(exp, inst) => {
          if (inst) {
            handleToggleInstallment(exp.id, inst);
          } else {
            handleConfirmStatus(exp);
          }
        }}
      />
    </>
  );
}
