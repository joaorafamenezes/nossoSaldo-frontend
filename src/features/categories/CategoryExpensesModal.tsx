import * as React from 'react';
import { Categoria, Gasto, StatusGasto } from '../../types/financial';
import { useAppStore } from '../../stores/useAppStore';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  X,
  Search,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  Calendar,
  CreditCard,
  User,
  Repeat,
  Layers,
  Edit3,
  Trash2,
  PlusCircle,
  AlertTriangle,
  Receipt,
  RotateCcw,
  Check,
} from 'lucide-react';
import {
  formatCurrency,
  formatDate,
  getCompetenciaDisplay,
  getEffectiveExpenseValue,
  getEffectiveExpenseStatus,
  getCategoryBudgetStatus,
  getExpensesForCompetence,
} from '../../lib/utils';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

interface CategoryExpensesModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Categoria | null;
}

export function CategoryExpensesModal({ isOpen, onClose, category }: CategoryExpensesModalProps) {
  const {
    expenses,
    cards,
    selectedCompetencia,
    dateFilterMode,
    customStartDate,
    customEndDate,
    toggleExpenseStatus,
    openEditExpense,
    openNewExpense,
    deleteExpense,
  } = useAppStore();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'todos' | StatusGasto>('todos');
  const [typeFilter, setTypeFilter] = React.useState<'todos' | 'despesa' | 'receita'>('todos');
  const [sortBy, setSortBy] = React.useState<'date_desc' | 'date_asc' | 'val_desc' | 'val_asc'>('date_desc');

  // Keyboard shortcut: ESC to close
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset local filters when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setStatusFilter('todos');
      setTypeFilter('todos');
      setSortBy('date_desc');
    }
  }, [isOpen, category?.id]);

  if (!isOpen || !category) return null;

  const startDate = dateFilterMode === 'custom' && customStartDate ? customStartDate : undefined;
  const endDate = dateFilterMode === 'custom' && customEndDate ? customEndDate : undefined;
  const isCustomRange = Boolean(startDate && endDate);
  const periodLabel = isCustomRange
    ? `${formatDate(customStartDate)} até ${formatDate(customEndDate)}`
    : getCompetenciaDisplay(selectedCompetencia);

  // Filter expenses strictly for this category within the active period
  const periodExpenses = getExpensesForCompetence(expenses, selectedCompetencia, startDate, endDate);
  const categoryExpenses = periodExpenses.filter((e) => e.categoriaId === category.id);

  // Category budget status
  const budgetStatus = getCategoryBudgetStatus(category, periodExpenses, selectedCompetencia, startDate, endDate);

  // Filter & sort the list
  const filteredItems = categoryExpenses
    .filter((item) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const descMatch = item.descricao.toLowerCase().includes(query);
        const obsMatch = item.observacao?.toLowerCase().includes(query);
        const respMatch = item.responsavelNome?.toLowerCase().includes(query);
        const cardObj = cards.find((c) => c.id === item.cartaoCreditoId);
        const cardMatch = cardObj?.descricao.toLowerCase().includes(query);
        if (!descMatch && !obsMatch && !respMatch && !cardMatch) return false;
      }

      if (typeFilter !== 'todos' && item.tipo !== typeFilter) {
        return false;
      }

      const { effectiveStatus } = getEffectiveExpenseStatus(item, selectedCompetencia, startDate, endDate);
      if (statusFilter !== 'todos' && effectiveStatus !== statusFilter) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      const valA = getEffectiveExpenseValue(a, selectedCompetencia, startDate, endDate);
      const valB = getEffectiveExpenseValue(b, selectedCompetencia, startDate, endDate);
      const dateA = getEffectiveExpenseStatus(a, selectedCompetencia, startDate, endDate).effectiveDueDate;
      const dateB = getEffectiveExpenseStatus(b, selectedCompetencia, startDate, endDate).effectiveDueDate;

      if (sortBy === 'val_desc') return valB - valA;
      if (sortBy === 'val_asc') return valA - valB;
      if (sortBy === 'date_asc') return dateA.localeCompare(dateB);
      return dateB.localeCompare(dateA);
    });

  // Calculate statistics for the filtered list
  const totalFiltrado = filteredItems.reduce(
    (sum, item) => sum + getEffectiveExpenseValue(item, selectedCompetencia, startDate, endDate),
    0
  );
  const totalPago = categoryExpenses
    .filter((item) => getEffectiveExpenseStatus(item, selectedCompetencia, startDate, endDate).isPaid)
    .reduce((sum, item) => sum + getEffectiveExpenseValue(item, selectedCompetencia, startDate, endDate), 0);
  const totalPendente = categoryExpenses
    .filter((item) => !getEffectiveExpenseStatus(item, selectedCompetencia, startDate, endDate).isPaid)
    .reduce((sum, item) => sum + getEffectiveExpenseValue(item, selectedCompetencia, startDate, endDate), 0);

  const handleToggleStatus = (expense: Gasto) => {
    const { isPaid } = getEffectiveExpenseStatus(expense, selectedCompetencia, startDate, endDate);
    if (!isPaid) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
      toast.success(`Lançamento "${expense.descricao}" marcado como PAGO!`);
    } else {
      toast.info(`Lançamento "${expense.descricao}" reaberto como PENDENTE.`);
    }
    toggleExpenseStatus(expense.id, selectedCompetencia);
  };

  const handleDeleteItem = async (expense: Gasto) => {
    if (confirm(`Deseja excluir o lançamento "${expense.descricao}"?`)) {
      await deleteExpense(expense.id);
      toast.success(`Lançamento "${expense.descricao}" excluído com sucesso!`);
    }
  };

  const handleCreateNewInThisCategory = () => {
    onClose();
    openNewExpense();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl border border-white/10 shadow-md"
                style={{ backgroundColor: `${category.color || category.cor || '#10b981'}25` }}
              >
                <span>{category.iconName || '🏷️'}</span>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: category.color || category.cor || '#10b981' }}
                  />
                  <h3 className="text-lg sm:text-xl font-bold text-zinc-100 truncate">
                    {category.descricao}
                  </h3>
                  <Badge variant="outline" className="text-[11px] font-mono border-zinc-700 bg-zinc-800/60 text-zinc-300">
                    {periodLabel}
                  </Badge>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Visualização detalhada dos lançamentos que compõem esta categoria
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateNewInThisCategory}
                className="hidden sm:inline-flex text-xs font-semibold border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
              >
                <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
                <span>Novo Lançamento</span>
              </Button>

              <button
                onClick={onClose}
                className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                title="Fechar (ESC)"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Budget & Statistics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Total Gasto</span>
              <p className="text-base sm:text-lg font-bold font-mono text-zinc-100 mt-0.5">
                {formatCurrency(budgetStatus.spent)}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Teto Orçamentário</span>
              <p className="text-base sm:text-lg font-bold font-mono text-emerald-400 mt-0.5">
                {budgetStatus.budget > 0 ? formatCurrency(budgetStatus.budget) : 'Sem teto'}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Pago / Pendente</span>
              <p className="text-xs sm:text-sm font-mono mt-1 flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold">{formatCurrency(totalPago)}</span>
                <span className="text-zinc-600">/</span>
                <span className="text-amber-400 font-bold">{formatCurrency(totalPendente)}</span>
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-3 flex flex-col justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Consumo da Meta</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-bold font-mono text-zinc-200">
                  {budgetStatus.budget > 0 ? `${budgetStatus.percentage}%` : '—'}
                </span>
                {budgetStatus.budget > 0 && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase ${budgetStatus.badgeClass}`}
                  >
                    {budgetStatus.alertLevel === 'danger' && '⛔ 100%'}
                    {budgetStatus.alertLevel === 'orange' && '🚨 80%'}
                    {budgetStatus.alertLevel === 'yellow' && '⚠️ 60%'}
                    {budgetStatus.alertLevel === 'normal' && '✓ Ok'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-950/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar por descrição, cartão, responsável ou observação..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 pl-10 pr-4 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="todos">Status: Todos</option>
              <option value="pago">Status: Pagos</option>
              <option value="pendente">Status: Pendentes</option>
              <option value="atrasado">Status: Atrasados</option>
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="date_desc">Vencimento (Mais recentes)</option>
              <option value="date_asc">Vencimento (Mais antigos)</option>
              <option value="val_desc">Maior valor</option>
              <option value="val_asc">Menor valor</option>
            </select>
          </div>
        </div>

        {/* Expense Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5">
          {filteredItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-12 text-center space-y-3">
              <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-zinc-800/80 text-zinc-400">
                <Receipt className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-zinc-200">Nenhum lançamento encontrado</p>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                {categoryExpenses.length === 0
                  ? `Esta categoria não possui lançamentos registrados para ${periodLabel}.`
                  : 'Nenhum lançamento corresponde aos filtros de busca informados.'}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateNewInThisCategory}
                className="text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 mt-2"
              >
                <PlusCircle className="h-3.5 w-3.5 mr-1" />
                <span>Adicionar Lançamento</span>
              </Button>
            </div>
          ) : (
            filteredItems.map((item) => {
              const effectiveValue = getEffectiveExpenseValue(item, selectedCompetencia, startDate, endDate);
              const { effectiveStatus, effectiveDueDate, isPaid, isOverdue } = getEffectiveExpenseStatus(
                item,
                selectedCompetencia,
                startDate,
                endDate
              );
              const cardObj = cards.find((c) => c.id === item.cartaoCreditoId);

              const isParcelado = item.origemLancamento === 'parcelado' || (item.numeroParcelas && item.numeroParcelas > 1);
              const isRecorrente = item.origemLancamento === 'recorrente';

              return (
                <div
                  key={item.id}
                  className="group rounded-2xl border border-zinc-800/90 bg-zinc-900/70 hover:bg-zinc-900 hover:border-zinc-700 p-3.5 sm:p-4 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                >
                  {/* Left Column: Quick Pay Toggle + Title + Badges */}
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      onClick={() => handleToggleStatus(item)}
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border transition-all ${
                        isPaid
                          ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                          : isOverdue
                          ? 'border-rose-500/40 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                          : 'border-zinc-700 bg-zinc-800/80 text-zinc-400 hover:border-emerald-500/50 hover:text-emerald-400'
                      }`}
                      title={isPaid ? 'Marcar como Pendente' : 'Marcar como Pago'}
                    >
                      {isPaid ? <Check className="h-4 w-4 stroke-[2.5]" /> : <CheckCircle2 className="h-4 w-4" />}
                    </button>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-zinc-100 truncate">{item.descricao}</h4>

                        {/* Origin Badges */}
                        {isRecorrente && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 text-[10px] font-semibold text-purple-300">
                            <Repeat className="h-3 w-3" />
                            Recorrente
                          </span>
                        )}
                        {isParcelado && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 text-[10px] font-semibold text-blue-300">
                            <Layers className="h-3 w-3" />
                            Parcelado ({item.parcelaAtual || 1}/{item.numeroParcelas})
                          </span>
                        )}

                        {/* Card Badge */}
                        {cardObj && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-zinc-800 border border-zinc-700 px-2 py-0.5 text-[10px] font-medium text-zinc-300">
                            <CreditCard className="h-3 w-3 text-indigo-400" />
                            {cardObj.descricao}
                          </span>
                        )}

                        {/* Member/Responsible */}
                        {item.responsavelNome && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-zinc-800/60 border border-zinc-700/60 px-1.5 py-0.5 text-[10px] text-zinc-400">
                            <User className="h-3 w-3 text-zinc-400" />
                            {item.responsavelNome}
                          </span>
                        )}
                      </div>

                      {/* Date & Note sub-row */}
                      <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-zinc-500" />
                          Venc: {formatDate(effectiveDueDate)}
                        </span>

                        {isPaid && item.dataPagamento && (
                          <span className="text-emerald-400 font-medium">
                            • Pago em {formatDate(item.dataPagamento)}
                          </span>
                        )}

                        {item.observacao && (
                          <span className="text-zinc-500 truncate max-w-[200px]" title={item.observacao}>
                            • {item.observacao}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Value, Status Badge & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/60">
                    <div className="text-right">
                      <p className="text-sm sm:text-base font-bold font-mono text-zinc-100">
                        {formatCurrency(effectiveValue)}
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider ${
                          isPaid
                            ? 'text-emerald-400'
                            : isOverdue
                            ? 'text-rose-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {isPaid ? 'Pago' : isOverdue ? 'Atrasado' : 'Pendente'}
                      </span>
                    </div>

                    {/* Actions: Edit & Delete */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          onClose();
                          openEditExpense(item);
                        }}
                        className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                        title="Editar Lançamento"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteItem(item)}
                        className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-950/40 hover:text-rose-400 transition-colors"
                        title="Excluir Lançamento"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400 font-mono">
          <div>
            Exibindo <strong className="text-zinc-200">{filteredItems.length}</strong> de{' '}
            <strong className="text-zinc-200">{categoryExpenses.length}</strong> lançamentos | Total Filtrado:{' '}
            <strong className="text-emerald-400">{formatCurrency(totalFiltrado)}</strong>
          </div>

          <Button variant="secondary" size="sm" onClick={onClose} className="w-full sm:w-auto text-xs">
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
