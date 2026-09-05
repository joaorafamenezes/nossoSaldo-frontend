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
import { formatCurrency, formatShortCurrency } from '../../lib/utils';
import { useAppStore } from '../../stores/useAppStore';

export function CashflowChart() {
  const { expenses, selectedCompetencia, isPrivacyMode } = useAppStore();

  const chartData = React.useMemo(() => {
    const monthExpenses = expenses.filter((e) =>
      e.competencia.startsWith(selectedCompetencia)
    );

    const days = [5, 10, 15, 20, 25, 28];
    let acumuladoReceitas = 0;
    let acumuladoDespesas = 0;

    return days.map((day) => {
      const dayStr = `${selectedCompetencia}-${String(day).padStart(2, '0')}`;
      
      const receitasAteHoje = monthExpenses
        .filter((e) => e.tipo === 'receita' && e.dataVencimento <= dayStr)
        .reduce((sum, e) => sum + e.valor, 0);

      const despesasAteHoje = monthExpenses
        .filter((e) => e.tipo === 'despesa' && e.dataVencimento <= dayStr)
        .reduce((sum, e) => sum + e.valor, 0);

      acumuladoReceitas = receitasAteHoje;
      acumuladoDespesas = despesasAteHoje;

      return {
        dia: `Dia ${day}`,
        receitas: acumuladoReceitas,
        despesas: acumuladoDespesas,
        saldo: acumuladoReceitas - acumuladoDespesas,
      };
    });
  }, [expenses, selectedCompetencia]);

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
