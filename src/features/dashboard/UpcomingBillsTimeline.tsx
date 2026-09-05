import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { useAppStore } from '../../stores/useAppStore';
import { MoneyDisplay } from '../../components/common/MoneyDisplay';
import { formatDate, getDaysDifference } from '../../lib/utils';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

export function UpcomingBillsTimeline() {
  const { expenses, toggleExpenseStatus, selectedCompetencia } = useAppStore();

  const upcomingBills = React.useMemo(() => {
    return expenses
      .filter((e) => e.tipo === 'despesa' && e.competencia.startsWith(selectedCompetencia))
      .sort((a, b) => (a.dataVencimento > b.dataVencimento ? 1 : -1))
      .slice(0, 5);
  }, [expenses, selectedCompetencia]);

  const handlePay = (id: string, descricao: string) => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
    });
    toggleExpenseStatus(id);
    toast.success(`Gasto "${descricao}" marcado como pago!`);
  };

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Próximos Vencimentos</CardTitle>
          <span className="text-xs text-zinc-500 font-mono">Top 5 do mês</span>
        </div>
        <CardDescription>
          Contas e faturas programadas para os próximos dias
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {upcomingBills.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-400">
            Nenhuma conta a vencer neste mês.
          </div>
        ) : (
          upcomingBills.map((bill) => {
            const isPaid = bill.status === 'pago';
            const daysDiff = getDaysDifference(bill.dataVencimento);

            return (
              <div
                key={bill.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-150 ${
                  isPaid
                    ? 'border-emerald-500/20 bg-emerald-950/10 text-zinc-400'
                    : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 text-zinc-100'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <button
                    onClick={() => handlePay(bill.id, bill.descricao)}
                    className="shrink-0 text-zinc-400 hover:text-emerald-400 transition-colors"
                    title={isPaid ? 'Marcar como pendente' : 'Marcar como pago'}
                  >
                    {isPaid ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <Clock className="h-5 w-5 text-zinc-500 hover:text-emerald-400" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-semibold truncate ${isPaid && 'line-through text-zinc-400'}`}>
                      {bill.descricao}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-400">
                      <span>Vence: {formatDate(bill.dataVencimento)}</span>
                      {!isPaid && (
                        <span
                          className={`font-mono font-bold ${
                            daysDiff < 0
                              ? 'text-rose-400'
                              : daysDiff <= 3
                              ? 'text-amber-400'
                              : 'text-zinc-400'
                          }`}
                        >
                          {daysDiff < 0
                            ? `(Atrasado ${Math.abs(daysDiff)}d)`
                            : daysDiff === 0
                            ? '(Vence Hoje)'
                            : `(em ${daysDiff}d)`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 ml-3">
                  <MoneyDisplay
                    value={bill.valor}
                    type={isPaid ? 'neutral' : 'negative'}
                    size="sm"
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
