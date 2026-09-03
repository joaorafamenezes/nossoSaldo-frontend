import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { useAppStore } from '../../stores/useAppStore';
import { MoneyDisplay } from '../../components/common/MoneyDisplay';
import { CreditCard, ChevronRight } from 'lucide-react';
import { Progress } from '../../components/ui/Progress';
import { formatCurrency } from '../../lib/utils';

export function QuickCardsWidget() {
  const { cards, setActiveTab } = useAppStore();

  return (
    <Card className="flex flex-col justify-between border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-slate-900 dark:text-zinc-100">Cartões & Faturas</CardTitle>
          <button
            onClick={() => setActiveTab('cards')}
            className="flex items-center text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-semibold"
          >
            <span>Ver todos</span>
            <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
          </button>
        </div>
        <CardDescription className="text-slate-500 dark:text-zinc-400">
          Acompanhamento de limite disponível e fechamentos
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {cards.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-xs text-slate-500 dark:text-zinc-500">Nenhum cartão de crédito cadastrado.</p>
            <button
              onClick={() => setActiveTab('cards')}
              className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Cadastrar Cartão
            </button>
          </div>
        ) : (
          cards.map((card) => {
            const limiteTotal = Number(card.valorLimite) || 0;
            const available = typeof card.limiteDisponivel === 'number' && !isNaN(card.limiteDisponivel)
              ? card.limiteDisponivel
              : (typeof card.faturaAtual === 'number' && !isNaN(card.faturaAtual))
              ? Math.max(0, limiteTotal - card.faturaAtual)
              : limiteTotal;
            const used = Math.max(0, limiteTotal - available);
            const usagePercent = limiteTotal > 0 ? Math.min(100, Math.max(0, Math.round((used / limiteTotal) * 100))) : 0;

            return (
              <div
                key={card.id}
                onClick={() => setActiveTab('cards')}
                className="group cursor-pointer rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/40 p-3 hover:border-slate-300 dark:hover:border-zinc-700 transition-all shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 shadow-xs">
                      <CreditCard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-zinc-200 group-hover:text-emerald-600 dark:group-hover:text-white transition-colors">
                        {card.descricao}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-500 font-mono">
                        Fecha dia {card.diaFechamento} • Vence dia {card.diaVencimento}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 dark:text-zinc-500 block">Disponível</span>
                    <MoneyDisplay value={available} type="positive" size="xs" />
                  </div>
                </div>

                <div className="mt-2.5 space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-500 dark:text-zinc-500 font-mono">
                    <span>Uso: {usagePercent}% ({formatCurrency(used)})</span>
                    <span>Limite: {formatCurrency(limiteTotal)}</span>
                  </div>
                  <Progress
                    value={usagePercent}
                    indicatorColor={
                      usagePercent > 85
                        ? 'bg-rose-500'
                        : usagePercent > 60
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }
                  />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
