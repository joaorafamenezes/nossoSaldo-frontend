import * as React from 'react';
import { Sparkles, ArrowRight, Lightbulb } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { Button } from '../../components/ui/Button';

export function AiSummaryBanner() {
  const { aiInsights, setAiDrawerOpen } = useAppStore();

  const topInsight = aiInsights[0];
  if (!topInsight) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-zinc-900 to-zinc-900 p-4 md:p-5 shadow-glow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-glow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 font-mono">
                Insight do Copilot Financeiro
              </span>
              <span className="rounded-md bg-indigo-500/20 px-1.5 py-0.2 text-[10px] text-indigo-300 font-mono font-semibold">
                IA Ativa
              </span>
            </div>
            <h4 className="text-sm font-bold text-zinc-100 mt-0.5">{topInsight.titulo}</h4>
            <p className="text-xs text-zinc-400 mt-0.5 max-w-2xl leading-relaxed">
              {topInsight.descricao}
            </p>
          </div>
        </div>

        <Button
          variant="ai"
          size="sm"
          onClick={() => setAiDrawerOpen(true)}
          className="text-xs font-semibold shrink-0 shadow-glow-sm"
        >
          <span>Abrir Copilot</span>
          <ArrowRight className="h-3.5 w-3.5 ml-1" />
        </Button>
      </div>
    </div>
  );
}
