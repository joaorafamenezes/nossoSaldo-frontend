import * as React from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { Card } from '../../components/ui/Card';
import { Progress } from '../../components/ui/Progress';
import { Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { formatCurrency, getCategoryBudgetStatus, getExpensesForCompetence } from '../../lib/utils';
import { CategoryBadge } from '../../components/common/CategoryBadge';

export function BudgetAuditCard() {
  const { categories, expenses, selectedCompetencia, customStartDate, customEndDate } = useAppStore();

  const categoryAudits = React.useMemo(() => {
    const periodExpenses = getExpensesForCompetence(
      expenses,
      selectedCompetencia,
      customStartDate,
      customEndDate
    );

    return categories
      .filter((c) => Number(c.teto ?? c.orcamentoMensal ?? 0) > 0)
      .map((cat) => getCategoryBudgetStatus(cat, periodExpenses, selectedCompetencia, customStartDate, customEndDate))
      .sort((a, b) => b.percentage - a.percentage);
  }, [categories, expenses, selectedCompetencia, customStartDate, customEndDate]);

  const periodLabel = customStartDate && customEndDate
    ? `${customStartDate.split('-').reverse().join('/')} a ${customEndDate.split('-').reverse().join('/')}`
    : `Competência ${selectedCompetencia}`;

  return (
    <Card className="col-span-1 lg:col-span-3 rounded-2xl border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 space-y-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-zinc-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
              Auditoria de Orçamento & Tetos de Gastos com IA
            </h4>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Acompanhamento em tempo real de metas e limites por categoria (60%, 80%, 100%)
            </p>
          </div>
        </div>

        <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">
          {periodLabel}
        </span>
      </div>

      {categoryAudits.length === 0 ? (
        <div className="flex items-center gap-2 text-xs text-zinc-400 p-4 rounded-xl bg-zinc-950/40 border border-zinc-800/80">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>Nenhuma categoria com teto ou orçamento configurado no momento.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoryAudits.map((item) => {
            const catObj = categories.find((c) => c.id === item.categoriaId) || {
              id: item.categoriaId,
              descricao: item.descricao,
              cor: item.color,
              iconName: item.iconName,
            };

            const isExceeded = item.alertLevel === 'danger' || item.percentage >= 100;
            const isOrange = item.alertLevel === 'orange' || (item.percentage >= 80 && item.percentage < 100);
            const isYellow = item.alertLevel === 'yellow' || (item.percentage >= 60 && item.percentage < 80);

            return (
              <div
                key={item.categoriaId}
                className={`rounded-xl border p-3.5 space-y-2 transition-colors ${
                  isExceeded
                    ? 'border-rose-200 dark:border-rose-500/30 bg-rose-50/50 dark:bg-rose-950/10'
                    : isOrange
                    ? 'border-orange-200 dark:border-orange-500/30 bg-orange-50/50 dark:bg-orange-950/10'
                    : isYellow
                    ? 'border-amber-200 dark:border-amber-400/30 bg-amber-50/50 dark:bg-amber-950/10'
                    : 'border-slate-200 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-950/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <CategoryBadge categoria={catObj as any} size="sm" />
                  <span
                    className={`text-xs font-mono font-bold ${
                      isExceeded
                        ? 'text-rose-600 dark:text-rose-400'
                        : isOrange
                        ? 'text-orange-600 dark:text-orange-400'
                        : isYellow
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {item.percentage}%
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-zinc-400 font-mono">
                    <span>Gasto: {formatCurrency(item.spent)}</span>
                    <span>Teto: {formatCurrency(item.budget)}</span>
                  </div>
                  <Progress
                    value={item.percentage}
                    indicatorColor={
                      isExceeded
                        ? 'bg-rose-500'
                        : isOrange
                        ? 'bg-orange-500'
                        : isYellow
                        ? 'bg-amber-400'
                        : 'bg-emerald-500'
                    }
                  />
                </div>

                {isExceeded && (
                  <p className="text-[10px] text-rose-400 font-semibold flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    {item.spent > item.budget
                      ? `Excedeu o teto em ${formatCurrency(item.spent - item.budget)}`
                      : '100% do limite atingido'}
                  </p>
                )}
                {!isExceeded && (isOrange || isYellow) && (
                  <p className={`text-[10px] font-semibold flex items-center gap-1 ${isOrange ? 'text-orange-400' : 'text-amber-400'}`}>
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    {item.label} (Resta {formatCurrency(Math.max(0, item.budget - item.spent))})
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
