import * as React from 'react';
import { Gasto, Categoria, StatusGasto } from '../../types/financial';
import { useAppStore } from '../../stores/useAppStore';
import { MoneyDisplay } from '../../components/common/MoneyDisplay';
import { CategoryBadge } from '../../components/common/CategoryBadge';
import { ExpenseStatusModal } from './ExpenseStatusModal';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatDate, formatCurrency, getDaysDifference } from '../../lib/utils';
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Repeat,
  Edit3,
  Trash2,
  Lock,
  CreditCard,
  User,
  Calendar,
  Clock,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

interface ExpenseCategoryAccordionProps {
  expenses: Gasto[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
}

export function ExpenseCategoryAccordion({
  expenses,
  selectedIds,
  onToggleSelect,
}: ExpenseCategoryAccordionProps) {
  const { categories, toggleExpenseStatus, toggleInstallmentStatus, openEditExpense, deleteExpense } = useAppStore();
  const [expandedParcelas, setExpandedParcelas] = React.useState<Record<string, boolean>>({});

  const toggleParcelas = (id: string) => {
    setExpandedParcelas((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Group expenses by category
  const groupedData = React.useMemo(() => {
    const map = new Map<string, { category: Categoria | undefined; items: Gasto[]; total: number }>();

    // Initialize all existing categories that have expenses
    expenses.forEach((expense) => {
      const catId = expense.categoriaId || 'outros';
      if (!map.has(catId)) {
        const cat = categories.find((c) => c.id === catId);
        map.set(catId, {
          category: cat || { id: 'outros', descricao: 'Outros & Imprevistos', iconName: '📦', color: '#64748b', cor: '#64748b' },
          items: [],
          total: 0,
        });
      }
      const group = map.get(catId)!;
      group.items.push(expense);
      group.total += expense.valor;
    });

    // Sort categories by total value descending
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [expenses, categories]);

  // Track expanded state of category accordions (all open by default)
  const [expandedCategories, setExpandedCategories] = React.useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    expenses.forEach((e) => {
      initial[e.categoriaId || 'outros'] = true;
    });
    return initial;
  });

  const toggleCategory = (catId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const handleExpandAll = () => {
    const allOpen: Record<string, boolean> = {};
    groupedData.forEach((g) => {
      allOpen[g.category?.id || 'outros'] = true;
    });
    setExpandedCategories(allOpen);
  };

  const handleCollapseAll = () => {
    const allClosed: Record<string, boolean> = {};
    groupedData.forEach((g) => {
      allClosed[g.category?.id || 'outros'] = false;
    });
    setExpandedCategories(allClosed);
  };

  const [statusExpenseToConfirm, setStatusExpenseToConfirm] = React.useState<Gasto | null>(null);
  const [statusInstallmentToConfirm, setStatusInstallmentToConfirm] = React.useState<any | null>(null);

  const handleConfirmStatus = (expense: Gasto) => {
    const isPaid = expense.status === 'pago';
    if (!isPaid) {
      confetti({
        particleCount: 60,
        spread: 65,
        origin: { y: 0.75 },
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
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
      toast.success(`Parcela ${installment.numeroParcela} marcada como PAGA!`);
    } else {
      toast.info(`Parcela ${installment.numeroParcela} reaberta como PENDENTE.`);
    }
    toggleInstallmentStatus(gastoId, installment.id);
  };

  if (groupedData.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-12 text-center text-xs text-zinc-400">
        Nenhum lançamento encontrado para os filtros selecionados.
      </div>
    );
  }

  const grandTotal = expenses.reduce((s, e) => s + e.valor, 0);

  return (
    <div className="space-y-4">
      {/* Accordion Controls Bar */}
      <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
        <span>
          Exibindo <strong>{groupedData.length} categorias</strong> com <strong>{expenses.length} registros</strong> (Total: {formatCurrency(grandTotal)})
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExpandAll}
            className="hover:text-zinc-200 transition-colors font-medium"
          >
            Expandir todos
          </button>
          <span>•</span>
          <button
            onClick={handleCollapseAll}
            className="hover:text-zinc-200 transition-colors font-medium"
          >
            Recolher todos
          </button>
        </div>
      </div>

      {/* Category Accordion Groups */}
      <div className="space-y-4">
        {groupedData.map(({ category, items, total }) => {
          const catId = category?.id || 'outros';
          const isExpanded = expandedCategories[catId] ?? true;
          const catColor = category?.cor || category?.color || '#10b981';
          const catIcon = category?.iconName || '🏷️';

          return (
            <div
              key={catId}
              className="overflow-hidden rounded-2xl border border-slate-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-950/70 backdrop-blur-sm transition-all duration-200 shadow-sm dark:shadow-md"
            >
              {/* Category Header Row */}
              <div
                onClick={() => toggleCategory(catId)}
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-900/60 transition-colors select-none"
              >
                <div className="flex items-center gap-3.5">
                  <button
                    className="p-1 rounded-lg text-slate-400 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCategory(catId);
                    }}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-slate-600 dark:text-zinc-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
                    )}
                  </button>

                  {/* Category Icon & Dynamic Color Avatar */}
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-2xl border text-xl shadow-xs relative overflow-hidden shrink-0"
                    style={{
                      backgroundColor: `${catColor}15`,
                      borderColor: `${catColor}35`,
                    }}
                  >
                    <span>{catIcon}</span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: catColor }}
                      />
                      <span>{category?.descricao}</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono mt-0.5">
                      {items.length} {items.length === 1 ? 'registro' : 'registros'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <MoneyDisplay value={total} type="neutral" size="lg" />
                </div>
              </div>

              {/* Category Content: List of item cards matching user's image */}
              {isExpanded && (
                <div className="p-3 pt-0 space-y-3 border-t border-slate-100 dark:border-zinc-900">
                  {items.map((expense) => {
                    const isSelected = selectedIds.includes(expense.id);
                    const isPaid = expense.status === 'pago';
                    const daysDiff = getDaysDifference(expense.dataVencimento);

                    return (
                      <div
                        key={expense.id}
                        className={`rounded-2xl border p-4 sm:p-5 transition-all duration-200 ${
                          isPaid
                            ? 'border-slate-200 dark:border-zinc-800/80 bg-slate-50/70 dark:bg-zinc-900/50'
                            : 'border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900/90 shadow-xs hover:border-slate-300 dark:hover:border-zinc-600'
                        } ${isSelected ? 'ring-2 ring-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20' : ''}`}
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          {/* Left Column: Badges, Title, Metadata Pills */}
                          <div className="space-y-3 flex-1 min-w-0">
                            {/* Top Badges */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => onToggleSelect(expense.id)}
                                className="h-4 w-4 rounded border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-emerald-600 focus:ring-emerald-500 mr-1 shrink-0"
                              />

                              <Badge
                                variant={expense.tipo === 'receita' ? 'success' : 'danger'}
                                className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5"
                              >
                                {expense.tipo === 'receita' ? 'Receita' : 'Despesa'}
                              </Badge>

                              <Badge
                                variant={isPaid ? 'success' : daysDiff < 0 ? 'danger' : 'warning'}
                                className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5"
                              >
                                {isPaid ? 'Quitado' : daysDiff < 0 ? 'Atrasado' : 'Pendente'}
                              </Badge>

                              {/* Category Badge with Icon and Color */}
                              <CategoryBadge categoria={category} size="sm" />

                              {/* Installment Badge or Toggle Button */}
                              {(expense.origemLancamento === 'parcelado' || (expense.lancamentosBase && expense.lancamentosBase.length > 0)) && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleParcelas(expense.id);
                                  }}
                                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold transition-all cursor-pointer ${
                                    expandedParcelas[expense.id]
                                      ? 'border-indigo-500/50 bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500/30'
                                      : 'border-purple-300 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40'
                                  }`}
                                  title="Clique para expandir/minimizar as parcelas deste registro"
                                >
                                  <Repeat className="h-3 w-3 text-purple-500" />
                                  <span>
                                    {expense.numeroParcelas || expense.lancamentosBase?.length || 1}x Parcelas
                                    {expense.lancamentosBase
                                      ? ` (${expense.lancamentosBase.filter((l) => l.status === 'pago').length}/${expense.lancamentosBase.length} pagas)`
                                      : expense.parcelaAtual
                                      ? ` (Atual: ${expense.parcelaAtual})`
                                      : ''}
                                  </span>
                                  <ChevronDown
                                    className={`h-3 w-3 transition-transform ${
                                      expandedParcelas[expense.id] ? 'rotate-180 text-indigo-500' : 'text-purple-400'
                                    }`}
                                  />
                                </button>
                              )}
                            </div>

                            {/* Title & Competence Subtitle */}
                            <div>
                              <h4
                                className={`text-base font-bold truncate ${
                                  isPaid ? 'text-slate-500 dark:text-zinc-300 line-through' : 'text-slate-900 dark:text-white'
                                }`}
                              >
                                {expense.descricao}
                              </h4>
                              <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono mt-0.5">
                                Competência: {expense.competencia.split('-')[1]}/{expense.competencia.split('-')[0]}
                              </p>
                            </div>

                            {/* Pill Metadata Tags */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                              {/* Origem */}
                              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2.5 py-1 text-[11px] text-slate-600 dark:text-zinc-400 font-mono shadow-xs">
                                <Repeat className="h-3 w-3 text-slate-400 dark:text-zinc-500" />
                                <span>Origem {expense.origemLancamento}</span>
                              </span>

                              {/* Responsável */}
                              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2.5 py-1 text-[11px] text-slate-600 dark:text-zinc-400 font-mono shadow-xs">
                                <User className="h-3 w-3 text-slate-400 dark:text-zinc-500" />
                                <span>Responsável: {expense.responsavelNome?.split(' ')[0] || 'Você'}</span>
                              </span>

                              {/* Vencimento ou Data de Criação (se parcelado) */}
                              {expense.origemLancamento === 'parcelado' || (expense.lancamentosBase && expense.lancamentosBase.length > 0) ? (
                                <span
                                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2.5 py-1 text-[11px] text-slate-600 dark:text-zinc-400 font-mono shadow-xs"
                                  title="Data de criação do lançamento parcelado (vencimentos controlados nas parcelas filhas)"
                                >
                                  <Clock className="h-3 w-3 text-indigo-500 dark:text-indigo-400" />
                                  <span>Criado em: {formatDate(expense.createdAt || expense.dataVencimento)}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2.5 py-1 text-[11px] text-slate-600 dark:text-zinc-400 font-mono shadow-xs">
                                  <Calendar className="h-3 w-3 text-slate-400 dark:text-zinc-500" />
                                  <span>Vencimento: {formatDate(expense.dataVencimento)}</span>
                                </span>
                              )}

                              {/* Data de pagamento (se pago) */}
                              {isPaid && expense.dataPagamento && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                                  <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                                  <span>Data de pagamento: {formatDate(expense.dataPagamento)}</span>
                                </span>
                              )}

                              {/* Cartão de crédito (se vinculado) */}
                              {expense.cartaoNome && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-purple-200 dark:border-purple-500/20 bg-purple-50 dark:bg-purple-950/20 px-2.5 py-1 text-[11px] text-purple-700 dark:text-purple-300 font-mono">
                                  <CreditCard className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                                  <span>{expense.cartaoNome}</span>
                                </span>
                              )}

                              {/* Despesa Privada */}
                              {expense.naoCompartilhar && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-950/20 px-2.5 py-1 text-[11px] text-amber-700 dark:text-amber-300 font-mono">
                                  <Lock className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                                  <span>Privado</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Right Column: Amount, Status Label, Action Button, Edit/Delete */}
                          <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-zinc-800 shrink-0">
                            <div className="text-left md:text-right">
                              <MoneyDisplay
                                value={expense.valor}
                                type={expense.tipo === 'receita' ? 'positive' : 'neutral'}
                                size="2xl"
                              />
                              <span
                                className={`text-[10px] font-mono font-bold uppercase tracking-wider block mt-0.5 ${
                                  isPaid
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : daysDiff < 0
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : 'text-amber-600 dark:text-amber-400'
                                }`}
                              >
                                STATUS: {expense.status.toUpperCase()}
                              </span>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2">
                              {/* If parcelado, monthly actions are performed via the child installments. Parent shows Pay all / Reopen all */}
                              <Button
                                size="sm"
                                variant={isPaid ? 'secondary' : 'primary'}
                                onClick={() => {
                                  if (expense.origemLancamento === 'parcelado' && !expandedParcelas[expense.id]) {
                                    toggleParcelas(expense.id);
                                  }
                                  setStatusInstallmentToConfirm(null);
                                  setStatusExpenseToConfirm(expense);
                                }}
                                className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all ${
                                  isPaid
                                    ? 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700'
                                    : 'bg-emerald-600 text-white dark:text-zinc-950 hover:bg-emerald-500 shadow-sm dark:shadow-glow-emerald'
                                }`}
                              >
                                {isPaid ? (
                                  <>
                                    <RotateCcw className="h-3.5 w-3.5 mr-1 text-slate-500 dark:text-zinc-400" />
                                    <span>Reabrir</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                    <span>Pagar</span>
                                  </>
                                )}
                              </Button>

                              {/* Edit & Delete Action Buttons */}
                              <button
                                onClick={() => openEditExpense(expense)}
                                className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2 text-slate-500 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700 hover:text-slate-800 dark:hover:text-white transition-colors shadow-xs"
                                title="Editar Lançamento"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>

                              <button
                                onClick={() => deleteExpense(expense.id)}
                                className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2 text-slate-500 dark:text-zinc-400 hover:border-rose-300 dark:hover:border-rose-500/40 hover:text-rose-600 dark:hover:text-rose-400 transition-colors shadow-xs"
                                title="Excluir Lançamento"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Expandable Child Installments Section (Minimizar / Maximizar) */}
                        {expandedParcelas[expense.id] && (
                          <div className="mt-4 pt-4 border-t border-slate-200/80 dark:border-zinc-800 space-y-3 animate-in fade-in duration-200">
                            <div className="flex flex-wrap items-center justify-between gap-2 bg-indigo-50/70 dark:bg-indigo-950/30 p-2.5 rounded-xl border border-indigo-200/60 dark:border-indigo-500/20">
                              <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                                  Detalhamento das Parcelas ({expense.numeroParcelas}x)
                                </span>
                                <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                                  — Operações de pagamento e conferência mês a mês
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => toggleParcelas(expense.id)}
                                className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:underline"
                              >
                                Recolher parcelas ▴
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
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
                                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                                      isInstPaid
                                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/30 shadow-xs'
                                        : 'bg-white dark:bg-zinc-950/80 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
                                    }`}
                                  >
                                    <div className="min-w-0 pr-2">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-xs font-bold font-mono text-slate-800 dark:text-zinc-100">
                                          Parcela {inst.numeroParcela}/{expense.numeroParcelas || expense.lancamentosBase?.length || 1}
                                        </span>
                                        <Badge
                                          variant={isInstPaid ? 'success' : instDaysDiff < 0 ? 'danger' : 'warning'}
                                          className="text-[9px] px-1.5 py-0"
                                        >
                                          {isInstPaid ? 'Paga' : instDaysDiff < 0 ? 'Atrasada' : 'Pendente'}
                                        </Badge>
                                      </div>
                                      <p className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 mt-1">
                                        Vencimento: {formatDate(inst.dataVencimentoParcela)}
                                      </p>
                                      {isInstPaid && inst.dataPagamentoParcela && (
                                        <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                                          Pago em: {formatDate(inst.dataPagamentoParcela)}
                                        </p>
                                      )}
                                      <p className="text-xs font-bold font-mono text-slate-900 dark:text-zinc-100 mt-0.5">
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
                                      className={`text-[11px] font-bold px-3 py-1.5 rounded-lg shrink-0 transition-all ${
                                        isInstPaid
                                          ? 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700'
                                          : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-xs'
                                      }`}
                                    >
                                      {isInstPaid ? (
                                        <>
                                          <RotateCcw className="h-3 w-3 mr-1 text-slate-500 dark:text-zinc-400" />
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
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal for Payment / Reopening */}
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
    </div>
  );
}
