import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { useAppStore } from '../../stores/useAppStore';
import { Input } from '../../components/ui/Input';
import { Progress } from '../../components/ui/Progress';
import { Calculator, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

export function LimitSimulatorCard() {
  const { cards } = useAppStore();
  const [simulatedCardId, setSimulatedCardId] = React.useState<string>(cards[0]?.id || '');
  const [simulatedValue, setSimulatedValue] = React.useState<string>('500');

  const targetCard = cards.find((c) => c.id === simulatedCardId) || cards[0];
  const simValueNum = parseFloat(simulatedValue.replace(',', '.')) || 0;

  if (!targetCard) return null;

  const currentAvailable = targetCard.limiteDisponivel;
  const simulatedRemaining = currentAvailable - simValueNum;
  const isOverLimit = simulatedRemaining < 0;

  const simulatedUsed = targetCard.valorLimite - simulatedRemaining;
  const simulatedPercent = Math.min(100, Math.round((simulatedUsed / targetCard.valorLimite) * 100));

  return (
    <Card className="rounded-2xl border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
      <div className="flex items-center gap-2.5 border-b border-zinc-800 pb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
          <Calculator className="h-4 w-4" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-zinc-100">Simulador de Impacto no Limite</h4>
          <p className="text-[11px] text-zinc-400">Verifique se uma nova compra cabe no cartão</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-zinc-300 block mb-1">
            Selecione o Cartão
          </label>
          <select
            value={simulatedCardId}
            onChange={(e) => setSimulatedCardId(e.target.value)}
            className="flex h-9 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-xs text-zinc-100 outline-none"
          >
            {cards.map((c) => (
              <option key={c.id} value={c.id}>
                {c.descricao} (Disp: {formatCurrency(c.limiteDisponivel)})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-zinc-300 block mb-1">
            Valor Simulado da Compra (R$)
          </label>
          <input
            type="number"
            step="10"
            value={simulatedValue}
            onChange={(e) => setSimulatedValue(e.target.value)}
            className="flex h-9 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-xs font-mono text-emerald-400 font-bold outline-none"
          />
        </div>

        {/* Simulation Output */}
        <div
          className={`rounded-xl border p-3 space-y-2 ${
            isOverLimit
              ? 'border-rose-500/30 bg-rose-950/20 text-rose-300'
              : 'border-zinc-800 bg-zinc-950 text-zinc-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold">
            <span>Limite após a compra:</span>
            <span className={`font-mono font-bold ${isOverLimit ? 'text-rose-400' : 'text-emerald-400'}`}>
              {formatCurrency(simulatedRemaining)}
            </span>
          </div>

          <Progress
            value={simulatedPercent}
            indicatorColor={isOverLimit ? 'bg-rose-500' : 'bg-emerald-500'}
          />

          <div className="text-[10px] flex items-center justify-between pt-1">
            {isOverLimit ? (
              <span className="text-rose-400 font-bold flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Excede o limite em {formatCurrency(Math.abs(simulatedRemaining))}!
              </span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Compra aprovada dentro do limite ({simulatedPercent}% de uso).
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
