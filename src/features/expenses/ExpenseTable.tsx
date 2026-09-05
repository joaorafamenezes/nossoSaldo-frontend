import * as React from 'react';
import { Gasto, StatusGasto } from '../../types/financial';
import { useAppStore } from '../../stores/useAppStore';
import { CategoryBadge } from '../../components/common/CategoryBadge';
import { ExpenseStatusModal } from './ExpenseStatusModal';
import { MoneyDisplay } from '../../components/common/MoneyDisplay';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatDate, formatCurrency, getDaysDifference, getEffectiveExpenseValue } from '../../lib/utils';
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
  ChevronDown,
  ChevronRight,
  RotateCcw,
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
  const { categories, selectedCompetencia, toggleExpenseStatus, toggleInstallmentStatus, openEditExpense, deleteExpense } = useAppStore();
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
                const isParcelado = expense.origemLancamento === 'parcelado' || (expense.lancamentosBase && expense.lancamentosBase.length > 0);
                const isExpanded = expandedParcelas[expense.id];

                return (
                  <React.Fragment key={expense.id}>
                    <tr
                      className={`group transition-colors hover:bg-zinc-800/40 ${
                        isSelected ? 'bg-emerald-950/15' : ''
                      } ${isExpanded ? 'bg-zinc-800/30' : ''}`}
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
                          {isParcelado && (
                            <button
                              type="button"
                              onClick={() => toggleParcelas(expense.id)}
                              className="p-1 rounded-md text-zinc-400 hover:text-indigo-400 hover:bg-zinc-800 transition-colors"
                              title={isExpanded ? 'Recolher parcelas' : 'Expandir parcelas'}
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-indigo-400" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-zinc-400" />
                              )}
                            </button>
                          )}

                          <span className={isPaid ? 'line-through text-zinc-400' : ''}>
                            {expense.descricao}
                          </span>

                          {/* Origin tag / Parcelas button */}
                          {isParcelado && (
                            <button
                              type="button"
                              onClick={() => toggleParcelas(expense.id)}
                              className="rounded bg-purple-950/60 border border-purple-800/60 px-1.5 py-0.5 text-[10px] font-mono text-purple-300 font-bold hover:bg-purple-900/60 transition-colors"
                            >
                              {expense.numeroParcelas || expense.lancamentosBase?.length}x parcelas
                              {expense.lancamentosBase ? ` (${expense.lancamentosBase.filter((l) => l.status === 'pago').length}/${expense.lancamentosBase.length} pagas)` : ''}
                            </button>
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

                      {/* Due Date or Created Date */}
                      <td className="p-4 font-mono text-zinc-400">
                        {isParcelado ? (
                          <span title="Data de criação do lançamento parcelado">
                            {formatDate(expense.createdAt || expense.dataVencimento)}
                          </span>
                        ) : (
                          <>
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
                          </>
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
                      </td>

                      {/* Value */}
                      <td className="p-4 text-right">
                        <MoneyDisplay
                          value={getEffectiveExpenseValue(expense, selectedCompetencia)}
                          type={expense.tipo === 'receita' ? 'positive' : 'negative'}
                          size="sm"
                        />
                        {isParcelado && (
                          <span
                            className="text-[10px] font-mono text-zinc-500 block"
                            title={`Valor total do parcelamento: ${formatCurrency(expense.valor)}`}
                          >
                            Total: {formatCurrency(expense.valor)} ({expense.numeroParcelas || expense.lancamentosBase?.length || 1}x)
                          </span>
                        )}
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

                    {/* Expandable Child Installments Sub-Row */}
                    {isParcelado && isExpanded && (
                      <tr className="bg-zinc-950/90 border-b border-zinc-800">
                        <td colSpan={8} className="p-4 pl-12 bg-indigo-950/10">
                          <div className="space-y-3 animate-in fade-in duration-150">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-indigo-400 flex items-center gap-2">
                                <span>🔢 Parcelas de "{expense.descricao}"</span>
                                <span className="text-[11px] text-zinc-400 font-normal">
                                  — Operações mensais por parcela
                                </span>
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleParcelas(expense.id)}
                                className="text-xs text-indigo-400 hover:underline font-semibold"
                              >
                                Minimizar ▴
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
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
                                const instDaysDiff = getDaysDifference(inst.dataVencimentoParcela);
                                return (
                                  <div
                                    key={inst.id}
                                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                                      isInstPaid
                                        ? 'bg-emerald-950/20 border-emerald-500/30'
                                        : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700'
                                    }`}
                                  >
                                    <div className="min-w-0 pr-2">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-bold font-mono text-zinc-200">
                                          Parcela {inst.numeroParcela}/{expense.numeroParcelas || expense.lancamentosBase?.length || 1}
                                        </span>
                                        <Badge
                                          variant={isInstPaid ? 'success' : instDaysDiff < 0 ? 'danger' : 'warning'}
                                          className="text-[9px] px-1.5 py-0"
                                        >
                                          {isInstPaid ? 'Paga' : instDaysDiff < 0 ? 'Atrasada' : 'Pendente'}
                                        </Badge>
                                      </div>
                                      <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
                                        Venc: {formatDate(inst.dataVencimentoParcela)}
                                      </p>
                                      <p className="text-xs font-bold font-mono text-zinc-100 mt-0.5">
                                        {formatCurrency(inst.valorParcela)}
                                      </p>
                                    </div>

                                    <Button
                                      size="sm"
                                      variant={isInstPaid ? 'secondary' : 'primary'}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setStatusExpenseToConfirm(expense);
                                        setStatusInstallmentToConfirm(inst);
                                      }}
                                      className={`text-[10px] font-bold px-2.5 py-1 rounded-lg shrink-0 ${
                                        isInstPaid
                                          ? 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                                          : 'bg-emerald-600 text-white hover:bg-emerald-500'
                                      }`}
                                    >
                                      {isInstPaid ? (
                                        <>
                                          <RotateCcw className="h-3 w-3 mr-1 text-zinc-400" />
                                          <span>Reabrir</span>
                                        </>
                                      ) : (
                                        <>
                                          <CheckCircle2 className="h-3 w-3 mr-1" />
                                          <span>Pagar</span>
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
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
