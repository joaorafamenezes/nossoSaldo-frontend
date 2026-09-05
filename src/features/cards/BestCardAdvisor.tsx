import * as React from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { Sparkles, Calendar, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export function BestCardAdvisor() {
  const { cards, setActiveTab } = useAppStore();

  const recommendation = React.useMemo(() => {
    if (cards.length === 0) return null;

    const today = new Date();
    const currentDay = today.getDate();

    let bestCard = cards[0];
    let maxDaysToPay = 0;

    cards.forEach((card) => {
      let daysUntilClosing = card.diaFechamento - currentDay;
      if (daysUntilClosing < 0) {
        daysUntilClosing += 30;
      }

      let daysToDue = (card.diaVencimento - card.diaFechamento);
      if (daysToDue <= 0) daysToDue += 30;

      const totalDaysToPay = daysUntilClosing + daysToDue;

      if (totalDaysToPay > maxDaysToPay) {
        maxDaysToPay = totalDaysToPay;
        bestCard = card;
      }
    });

    return {
      bestCard,
      daysToPay: maxDaysToPay,
    };
  }, [cards]);

  if (!recommendation) return null;

  return (
    <div className="rounded-2xl border border-indigo-200 dark:border-indigo-500/30 bg-gradient-to-r from-indigo-50/90 via-white to-purple-50/50 dark:from-indigo-950/40 dark:via-zinc-900 dark:to-zinc-950 p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm dark:shadow-glow-sm">
      <div className="flex items-start gap-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-glow-sm">
          <Sparkles className="h-5 w-5" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-mono">
              Conselheiro Inteligente de Compras
            </span>
            <span className="rounded bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-mono text-[10px] px-1.5 py-0.5 font-bold">
              Melhor Cartão Hoje
            </span>
          </div>

          <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-0.5">
            Use o <span className="text-emerald-600 dark:text-emerald-400 font-bold">{recommendation.bestCard.descricao}</span> hoje!
          </h4>
          <p className="text-xs text-slate-600 dark:text-zinc-400 mt-0.5 max-w-xl leading-relaxed">
            A fatura deste cartão acabou de virar ou fecha em breve. Compras feitas hoje terão até{' '}
            <strong className="text-slate-900 dark:text-zinc-200 font-mono">{recommendation.daysToPay} dias</strong> para pagamento na fatura seguinte.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
          Fecha dia {recommendation.bestCard.diaFechamento}
        </span>
      </div>
    </div>
  );
}
