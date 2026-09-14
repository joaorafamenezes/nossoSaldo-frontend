import * as React from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { getCategoryBudgetAlerts, formatCurrency } from '../../lib/utils';
import { AlertTriangle, PieChart, ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export function CategoryBudgetAlertsWidget() {
  const {
    categories,
    expenses,
    selectedCompetencia,
    dateFilterMode,
    customStartDate,
    customEndDate,
    setActiveTab,
  } = useAppStore();

  const startDate = dateFilterMode === 'custom' && customStartDate ? customStartDate : undefined;
  const endDate = dateFilterMode === 'custom' && customEndDate ? customEndDate : undefined;

  const alerts = React.useMemo(() => {
    return getCategoryBudgetAlerts(categories, expenses, selectedCompetencia, startDate, endDate);
  }, [categories, expenses, selectedCompetencia, startDate, endDate]);

  const isCustomRange = Boolean(startDate && endDate);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 flex flex-col justify-between shadow-xs">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-xl border ${
                alerts.length > 0
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700/50'
              }`}
            >
              {alerts.length > 0 ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <PieChart className="h-4 w-4" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <span>Alertas de Limite por Categoria</span>
                {alerts.length > 0 && (
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300 border border-amber-500/30">
                    {alerts.length} {alerts.length === 1 ? 'alerta' : 'alertas'}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-zinc-400">
                {isCustomRange
                  ? 'Monitoramento automático de tetos no período selecionado'
                  : 'Monitoramento automático de tetos (60%, 80% e 100%)'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-3.5">
          {alerts.length === 0 ? (
            <div className="py-6 px-4 text-center rounded-xl bg-zinc-950/40 border border-zinc-800/60 space-y-2">
              <div className="inline-flex p-2 rounded-full bg-emerald-500/10 text-emerald-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold text-zinc-200">
                Todos os limites dentro da meta prevista
              </p>
              <p className="text-[11px] text-zinc-400 max-w-xs mx-auto">
                {isCustomRange
                  ? 'Nenhuma categoria atingiu 60% do seu limite orçamentário no período selecionado.'
                  : 'Nenhuma categoria atingiu 60% do seu limite orçamentário neste mês.'}
              </p>
            </div>
          ) : (
            alerts.map((item) => {
              const displayPercentage = Math.min(item.percentage, 100);

              return (
                <div
                  key={item.categoriaId}
                  className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3 space-y-2 hover:border-zinc-700 transition-colors"
                >
                  {/* Category Name, Icon and Severity Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0">{item.iconName}</span>
                      <span className="text-xs font-bold text-zinc-100 truncate">
                        {item.descricao}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider shrink-0 ${item.badgeClass}`}
                    >
                      {item.alertLevel === 'danger' && '⛔ '}
                      {item.alertLevel === 'orange' && '🚨 '}
                      {item.alertLevel === 'yellow' && '⚠️ '}
                      {item.percentage}%
                    </span>
                  </div>

                  {/* Horizontal Progress Bar */}
                  <div className="w-full bg-zinc-800/80 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${item.progressClass}`}
                      style={{ width: `${displayPercentage}%` }}
                    />
                  </div>

                  {/* Values Spent vs Budget */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                    <span>
                      Gasto: <strong className="text-zinc-200">{formatCurrency(item.spent)}</strong>
                    </span>
                    <span>
                      Teto: <strong className="text-zinc-200">{formatCurrency(item.budget)}</strong>
                      {item.monthMultiplier > 1 && (
                        <span className="text-[10px] text-zinc-500 font-normal">
                          {' '}({item.monthMultiplier}m)
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer link to Gastos & Receitas */}
      <div className="pt-4 mt-4 border-t border-zinc-800/80 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setActiveTab('expenses')}
          className="text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1.5"
        >
          <span>Ver em Gastos & Receitas</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export default CategoryBudgetAlertsWidget;
