import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  formatCurrency,
  formatShortCurrency,
  getExpensesForCompetence,
  getEffectiveExpenseDueDate,
  getEffectiveExpenseValue,
  resolveFaturaDueDate,
} from '../../lib/utils';
import { useAppStore } from '../../stores/useAppStore';

export function CashflowChart() {
  const {
    expenses,
    invoices = [],
    cards = [],
    selectedCompetencia,
    isPrivacyMode,
    dateFilterMode,
    customStartDate,
    customEndDate,
  } = useAppStore();

  const isCustomRange = dateFilterMode === 'custom' && Boolean(customStartDate && customEndDate);
  const startDate = isCustomRange ? customStartDate : undefined;
  const endDate = isCustomRange ? customEndDate : undefined;

  const monthExpenses = React.useMemo(() => {
    return getExpensesForCompetence(expenses, selectedCompetencia, startDate, endDate)
      .filter((e) => e.status !== 'cancelado');
  }, [expenses, selectedCompetencia, startDate, endDate]);

  const chartData = React.useMemo(() => {
    const getItemDueDate = (item: any) => {
      if (item.cartaoCreditoId && (cards.length > 0 || invoices.length > 0)) {
        const cardDueDate = resolveFaturaDueDate(item, invoices, cards);
        if (cardDueDate) return cardDueDate;
      }
      return getEffectiveExpenseDueDate(item, selectedCompetencia);
    };

    let points: Array<{ label: string; dateStr: string }>;

    if (isCustomRange && customStartDate && customEndDate) {
      const startD = new Date(customStartDate + 'T12:00:00');
      const endD = new Date(customEndDate + 'T12:00:00');
      const diffDays = Math.max(1, Math.round((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24)));

      if (diffDays <= 16) {
        const startDay = startD.getDate();
        const endDay = endD.getDate();
        const midDay1 = Math.round(startDay + (endDay - startDay) * 0.33);
        const midDay2 = Math.round(startDay + (endDay - startDay) * 0.66);
        const uniqueDays = Array.from(new Set([startDay, midDay1, midDay2, endDay])).sort((a, b) => a - b);
        const compPrefix = customStartDate.substring(0, 7);

        points = uniqueDays.map((d) => ({
          label: `Dia ${d}`,
          dateStr: `${compPrefix}-${String(d).padStart(2, '0')}`,
        }));
      } else {
        const step = Math.max(1, Math.floor(diffDays / 5));
        points = [];
        for (let i = 0; i <= 5; i++) {
          const cur = new Date(startD.getTime() + Math.min(diffDays, i * step) * (1000 * 60 * 60 * 24));
          const dateStr = cur.toISOString().split('T')[0];
          points.push({
            label: `${String(cur.getDate()).padStart(2, '0')}/${String(cur.getMonth() + 1).padStart(2, '0')}`,
            dateStr,
          });
        }
      }
    } else {
      const [yearStr, monthStr] = (selectedCompetencia || '2026-10').split('-');
      const lastDay = new Date(Number(yearStr), Number(monthStr), 0).getDate();
      const milestoneDays = [5, 10, 15, 20, 25, lastDay];

      points = milestoneDays.map((day) => ({
        label: `Dia ${day}`,
        dateStr: `${selectedCompetencia}-${String(day).padStart(2, '0')}`,
      }));
    }

    return points.map(({ label, dateStr }) => {
      const receitasAteHoje = monthExpenses
        .filter((e) => e.tipo === 'receita')
        .filter((e) => getItemDueDate(e) <= dateStr)
        .reduce((sum, e) => sum + getEffectiveExpenseValue(e, selectedCompetencia, startDate, endDate), 0);

      const despesasAteHoje = monthExpenses
        .filter((e) => e.tipo === 'despesa')
        .filter((e) => getItemDueDate(e) <= dateStr)
        .reduce((sum, e) => sum + getEffectiveExpenseValue(e, selectedCompetencia, startDate, endDate), 0);

      return {
        dia: label,
        receitas: receitasAteHoje,
        despesas: despesasAteHoje,
        saldo: receitasAteHoje - despesasAteHoje,
      };
    });
  }, [monthExpenses, isCustomRange, customStartDate, customEndDate, selectedCompetencia, cards, invoices, startDate, endDate]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      if (isPrivacyMode) {
        return (
          <div className="rounded-xl border border-zinc-700 bg-zinc-900/95 p-3 text-xs shadow-xl backdrop-blur-md">
            <p className="font-bold text-zinc-200 mb-1">{label}</p>
            <p className="text-zinc-500 font-mono">Valores ocultos (Modo Privacidade)</p>
          </div>
        );
      }

      return (
        <div className="rounded-xl border border-zinc-700 bg-zinc-900/95 p-3 text-xs shadow-xl backdrop-blur-md space-y-1">
          <p className="font-bold text-zinc-200">{label}</p>
          <div className="flex items-center justify-between gap-4 text-emerald-400">
            <span>Receitas Acumuladas:</span>
            <span className="font-mono font-bold">{formatCurrency(payload[0]?.value || 0)}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-rose-400">
            <span>Despesas Acumuladas:</span>
            <span className="font-mono font-bold">{formatCurrency(payload[1]?.value || 0)}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-indigo-300 pt-1 border-t border-zinc-800">
            <span>Saldo Líquido:</span>
            <span className="font-mono font-bold">{formatCurrency((payload[0]?.value || 0) - (payload[1]?.value || 0))}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Fluxo de Caixa & Evolução do Mês</CardTitle>
          <CardDescription>
            Receitas vs. Despesas acumuladas ao longo da competência
          </CardDescription>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-glow-emerald" />
            <span className="text-zinc-300">Receitas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-glow-rose" />
            <span className="text-zinc-300">Despesas</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-[280px] w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="dia" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => (isPrivacyMode ? '••••' : formatShortCurrency(val))}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="receitas"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorReceitas)"
              />
              <Area
                type="monotone"
                dataKey="despesas"
                stroke="#f43f5e"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorDespesas)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
