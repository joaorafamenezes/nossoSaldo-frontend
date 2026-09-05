import * as React from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { StatCard } from '../../components/common/StatCard';
import { CashflowChart } from './CashflowChart';
import { UpcomingBillsTimeline } from './UpcomingBillsTimeline';
import { QuickCardsWidget } from './QuickCardsWidget';
import { AiSummaryBanner } from './AiSummaryBanner';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  AlertTriangle,
  Receipt,
  Users2,
  Sparkles,
} from 'lucide-react';
import { getCompetenciaDisplay } from '../../lib/utils';

export function DashboardOverview() {
  const { getResumoCompetencia, selectedCompetencia, jointInfo } = useAppStore();
  const resumo = getResumoCompetencia();

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-100">
            Painel Financeiro 360°
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Visão consolidada para <strong className="text-zinc-200">{getCompetenciaDisplay(selectedCompetencia)}</strong>
          </p>
        </div>

        {/* Joint Account Partner Indicator */}
        <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-300">
          <Users2 className="h-4 w-4 text-emerald-400" />
          <span>Conta: <strong>{jointInfo?.nomeConta || 'Gestão Individual'}</strong></span>
          {jointInfo && (
            <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400 font-mono">50/50</span>
          )}
        </div>
      </div>

      {/* AI Copilot Highlight Banner */}
      <AiSummaryBanner />

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Saldo do Mês"
          value={resumo.saldoTotal}
          type={resumo.saldoTotal >= 0 ? 'positive' : 'negative'}
          subtitle={`Poupança projetada: ${resumo.taxaPoupanca}%`}
          icon={Wallet}
          trendPercentage={12}
        />
        <StatCard
          title="Receitas Totais"
          value={resumo.receitasTotal}
          type="positive"
          subtitle={`R$ ${resumo.receitasRecebidas.toFixed(2)} já recebidos`}
          icon={TrendingUp}
          trendPercentage={8}
        />
        <StatCard
          title="Despesas Previstas"
          value={resumo.despesasTotal}
          type="negative"
          subtitle={`R$ ${resumo.despesasPagas.toFixed(2)} quitadas`}
          icon={TrendingDown}
          trendPercentage={-4}
        />
        <StatCard
          title="Economia Projetada"
          value={resumo.economiaProjetada}
          type="neutral"
          subtitle="Meta do casal: R$ 3.000,00"
          icon={PiggyBank}
        />
      </div>

      {/* Charts & Interactive Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CashflowChart />
        <UpcomingBillsTimeline />
      </div>

      {/* Bottom widgets: Cards & Quick summaries */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <QuickCardsWidget />

        {/* Joint account mini widget / Individual financial summary */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 flex flex-col justify-between">
          {jointInfo ? (
            <>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-zinc-400">
                    Balanço Compartilhado do Casal
                  </span>
                  <span className="text-xs font-mono text-emerald-400 font-bold">
                    {Math.round((jointInfo.proporcaoDivisao || 0.5) * 100)}% / {Math.round((1 - (jointInfo.proporcaoDivisao || 0.5)) * 100)}%
                  </span>
                </div>
                <h4 className="text-base font-bold text-zinc-100 mt-2">
                  {jointInfo.nomeConta}
                </h4>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Total compartilhado este mês: <strong>R$ {(jointInfo.totalCompartilhadoMes || 0).toFixed(2)}</strong>.
                  {jointInfo.saldoAjuste && jointInfo.saldoAjuste.valor > 0 ? (
                    <>
                      {' '}Acerto sugerido: <strong className="text-emerald-400 font-mono">R$ {jointInfo.saldoAjuste.valor.toFixed(2)}</strong> para equilibrar as contas.
                    </>
                  ) : (
                    ' Contas do casal perfeitamente equilibradas.'
                  )}
                </p>
              </div>

              <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
                <span>{jointInfo.usuario1?.nome || 'Usuário 1'} pagou: R$ {(jointInfo.totalPagoUsuario1 || 0).toFixed(2)}</span>
                <span>{jointInfo.usuario2?.nome || 'Usuário 2'} pagou: R$ {(jointInfo.totalPagoUsuario2 || 0).toFixed(2)}</span>
              </div>
            </>
          ) : (
            <>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-zinc-400">
                    Gestão Financeira Individual
                  </span>
                  <span className="text-xs font-mono text-zinc-500 font-semibold">Modo Pessoal</span>
                </div>
                <h4 className="text-base font-bold text-zinc-100 mt-2">
                  Finanças Pessoais
                </h4>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Você está acompanhando seus lançamentos individuais. Você pode convidar seu parceiro(a) e ativar uma conta conjunta a qualquer momento na aba Conta Conjunta.
                </p>
              </div>

              <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
                <span>Lançamentos deste mês: <strong>{resumo.despesasTotal > 0 || resumo.receitasTotal > 0 ? 'Ativo' : 'Nenhum'}</strong></span>
                <span className="text-emerald-400 font-semibold font-mono">Base: nossosaldo_dev</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
