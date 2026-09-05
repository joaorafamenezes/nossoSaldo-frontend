import * as React from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { ExpenseFilters, PeriodPreset } from './ExpenseFilters';
import { ExpenseCategoryAccordion } from './ExpenseCategoryAccordion';
import { ExpenseTable } from './ExpenseTable';
import { ExpenseGrid } from './ExpenseGrid';
import { ExpenseDrawerForm } from './ExpenseDrawerForm';
import { BatchActionsBar } from './BatchActionsBar';
import { Button } from '../../components/ui/Button';
import { PlusCircle, Receipt } from 'lucide-react';
import { StatusGasto } from '../../types/financial';
import { toast } from 'sonner';

export function ExpensesPage() {
  const {
    expenses,
    jointInfo,
    selectedCompetencia,
    openNewExpense,
    batchToggleStatus,
    batchDeleteExpenses,
  } = useAppStore();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedType, setSelectedType] = React.useState('todos');
  const [selectedStatus, setSelectedStatus] = React.useState('todos');
  const [selectedCategoryId, setSelectedCategoryId] = React.useState('todos');
  const [selectedResponsavelId, setSelectedResponsavelId] = React.useState('todos');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [periodPreset, setPeriodPreset] = React.useState<PeriodPreset>('all');
  const [viewMode, setViewMode] = React.useState<'category' | 'table' | 'grid'>('category');
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  // Filter expenses strictly by selected competence / date range, search and joint account responsible
  const filteredExpenses = React.useMemo(() => {
    return expenses.filter((item) => {
      // Date period filtering (vencimento)
      if (startDate || endDate) {
        const vencimentoStr = item.dataVencimento ? item.dataVencimento.split('T')[0] : '';
        if (startDate && (!vencimentoStr || vencimentoStr < startDate)) {
          return false;
        }
        if (endDate && (!vencimentoStr || vencimentoStr > endDate)) {
          return false;
        }
      } else {
        if (!item.competencia.startsWith(selectedCompetencia)) return false;
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesDesc = item.descricao.toLowerCase().includes(query);
        const matchesCard = item.cartaoNome?.toLowerCase().includes(query);
        if (!matchesDesc && !matchesCard) return false;
      }

      if (selectedType !== 'todos' && item.tipo !== selectedType) return false;
      if (selectedStatus !== 'todos' && item.status !== selectedStatus) return false;
      if (selectedCategoryId !== 'todos' && item.categoriaId !== selectedCategoryId) return false;

      if (selectedResponsavelId !== 'todos') {
        const matchesId = item.responsavelId === selectedResponsavelId;
        const matchesName = item.responsavelNome && (
          (jointInfo?.usuario1?.id === selectedResponsavelId && item.responsavelNome === jointInfo.usuario1.nome) ||
          (jointInfo?.usuario2?.id === selectedResponsavelId && item.responsavelNome === jointInfo.usuario2.nome)
        );
        if (!matchesId && !matchesName) return false;
      }

      return true;
    });
  }, [expenses, jointInfo, selectedCompetencia, startDate, endDate, searchQuery, selectedType, selectedStatus, selectedCategoryId, selectedResponsavelId]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredExpenses.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredExpenses.map((e) => e.id));
    }
  };

  const handleBatchStatus = async (status: StatusGasto) => {
    await batchToggleStatus(selectedIds, status);
    toast.success(`${selectedIds.length} itens marcados como ${status}!`);
    setSelectedIds([]);
  };

  const handleBatchDelete = async () => {
    if (confirm(`Deseja excluir ${selectedIds.length} lançamentos selecionados?`)) {
      await batchDeleteExpenses(selectedIds);
      toast.success(`${selectedIds.length} lançamentos excluídos.`);
      setSelectedIds([]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            <Receipt className="h-6 w-6 text-emerald-400" />
            Gastos & Receitas
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Gestão granular com agrupamento inteligente por categorias e competências
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={openNewExpense}
          className="text-xs font-bold shadow-glow-emerald"
        >
          <PlusCircle className="h-3.5 w-3.5 mr-1" />
          <span>Novo Lançamento</span>
        </Button>
      </div>

      {/* Dynamic Filters Bar */}
      <ExpenseFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        selectedCategoryId={selectedCategoryId}
        onCategoryChange={setSelectedCategoryId}
        selectedResponsavelId={selectedResponsavelId}
        onResponsavelChange={setSelectedResponsavelId}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        periodPreset={periodPreset}
        onPeriodPresetChange={setPeriodPreset}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Active Period Feedback Banner */}
      {(periodPreset !== 'all' || !!startDate || !!endDate) && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/20 text-emerald-900 dark:text-emerald-200 text-xs shadow-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              Filtrando por período de vencimento:{' '}
              <strong className="font-mono">
                {startDate ? startDate.split('-').reverse().join('/') : 'Início'}
              </strong>{' '}
              até{' '}
              <strong className="font-mono">
                {endDate ? endDate.split('-').reverse().join('/') : 'Fim'}
              </strong>
              {periodPreset === 'first_half' && ' (1ª Quinzena)'}
              {periodPreset === 'second_half' && ' (2ª Quinzena)'}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span>
              Total de despesas no período:{' '}
              <strong className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  filteredExpenses
                    .filter((e) => e.tipo === 'despesa')
                    .reduce((acc, curr) => acc + curr.valor, 0)
                )}
              </strong>
            </span>
            <button
              onClick={() => {
                setPeriodPreset('all');
                setStartDate('');
                setEndDate('');
              }}
              className="text-emerald-700 dark:text-emerald-400 hover:underline font-semibold"
            >
              Ver mês completo
            </button>
          </div>
        </div>
      )}

      {/* Content View: Category Accordion vs Table vs Grid */}
      {viewMode === 'category' ? (
        <ExpenseCategoryAccordion
          expenses={filteredExpenses}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
        />
      ) : viewMode === 'table' ? (
        <ExpenseTable
          expenses={filteredExpenses}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAll}
        />
      ) : (
        <ExpenseGrid
          expenses={filteredExpenses}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
        />
      )}

      {/* Floating Batch Actions Bar */}
      <BatchActionsBar
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        onBatchStatus={handleBatchStatus}
        onBatchDelete={handleBatchDelete}
      />

      {/* Drawer Form Modal */}
      <ExpenseDrawerForm />
    </div>
  );
}
