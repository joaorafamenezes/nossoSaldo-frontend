import * as React from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { Card } from '../../components/ui/Card';
import { Progress } from '../../components/ui/Progress';
import { Sparkles, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { CategoryBadge } from '../../components/common/CategoryBadge';

export function BudgetAuditCard() {
  const { categories, expenses, selectedCompetencia } = useAppStore();

  const categoryAudits = React.useMemo(() => {
    const monthExpenses = expenses.filter(
      (e) => e.tipo === 'despesa' && e.competencia.startsWith(selectedCompetencia)
    );

    return categories
      .filter((c) => c.orcamentoMensal && c.orcamentoMensal > 0)
      .map((cat) => {
        const spent = monthExpenses
          .filter((e) => e.categoriaId === cat.id)
          .reduce((sum, e) => sum + e.valor, 0);

        const limit = cat.orcamentoMensal || 1000;
        const usagePercent = Math.round((spent / limit) * 100);

        return {
          category: cat,
          spent,
          limit,
          usagePercent,
          isExceeded: spent > limit,
          isNearLimit: usagePercent >= 80 && spent <= limit,
        };
      })
      .sort((a, b) => b.usagePercent - a.usagePercent);
  }, [categories, expenses, selectedCompetencia]);

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
              Acompanhamento em tempo real de metas por categoria
            </p>
          </div>
        </div>

        <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">
          Competência {selectedCompetencia}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categoryAudits.map((item) => (
          <div
            key={item.category.id}
            className={`rounded-xl border p-3.5 space-y-2 transition-colors ${
              item.isExceeded
                ? 'border-rose-200 dark:border-rose-500/30 bg-rose-50/50 dark:bg-rose-950/10'
                : item.isNearLimit
                ? 'border-amber-200 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/10'
                : 'border-slate-200 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-950/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <CategoryBadge categoria={item.category} size="sm" />
              <span
                className={`text-xs font-mono font-bold ${
                  item.isExceeded
                    ? 'text-rose-600 dark:text-rose-400'
                    : item.isNearLimit
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {item.usagePercent}%
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-zinc-400 font-mono">
                <span>Gasto: {formatCurrency(item.spent)}</span>
                <span>Teto: {formatCurrency(item.limit)}</span>
              </div>
              <Progress
                value={item.usagePercent}
                indicatorColor={
                  item.isExceeded
                    ? 'bg-rose-500'
                    : item.isNearLimit
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }
              />
            </div>

            {item.isExceeded && (
              <p className="text-[10px] text-rose-400 font-semibold flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Excedeu o teto em {formatCurrency(item.spent - item.limit)}
              </p>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
