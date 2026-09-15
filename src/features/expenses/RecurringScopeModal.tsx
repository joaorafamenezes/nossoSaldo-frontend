import * as React from 'react';
import { Button } from '../../components/ui/Button';
import { Calendar, Repeat, ArrowRight, X, AlertCircle } from 'lucide-react';
import { getCompetenciaDisplay } from '../../lib/utils';

export type RecurringEditScope = 'THIS_ONLY' | 'THIS_AND_FUTURE' | 'ALL_SERIES';

interface RecurringScopeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (scope: RecurringEditScope) => void;
  competencia: string;
  descricao: string;
  isSubmitting?: boolean;
}

export function RecurringScopeModal({
  isOpen,
  onClose,
  onConfirm,
  competencia,
  descricao,
  isSubmitting = false,
}: RecurringScopeModalProps) {
  const [selectedScope, setSelectedScope] = React.useState<RecurringEditScope>('THIS_ONLY');

  if (!isOpen) return null;

  const displayCompetencia = getCompetenciaDisplay(competencia || '2026-09');

  const options: Array<{
    id: RecurringEditScope;
    title: string;
    subtitle: string;
    badge?: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      id: 'THIS_ONLY',
      title: `Apenas este lançamento (${displayCompetencia})`,
      subtitle: 'Altera o valor pontualmente neste mês (ex: conta com variação). Não afeta os meses anteriores nem futuros.',
      badge: 'Recomendado para contas variáveis',
      icon: Calendar,
    },
    {
      id: 'THIS_AND_FUTURE',
      title: `Deste mês em diante (${displayCompetencia} em diante)`,
      subtitle: 'Aplica um reajuste definitivo nos meses futuros da série.',
      badge: 'Recomendado para reajustes de preço',
      icon: ArrowRight,
    },
    {
      id: 'ALL_SERIES',
      title: 'Em todas as ocorrências da série',
      subtitle: 'Atualiza a descrição, categoria ou dados em todo o histórico da recorrência.',
      icon: Repeat,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl p-6 text-zinc-100 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Repeat className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100">
                Como deseja aplicar esta alteração?
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Você está editando o lançamento recorrente: <strong className="text-zinc-200">{descricao}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Options List */}
        <div className="space-y-2.5 my-5">
          {options.map((opt) => {
            const isSelected = selectedScope === opt.id;
            const Icon = opt.icon;

            return (
              <label
                key={opt.id}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-emerald-500/50 bg-emerald-950/20 shadow-xs'
                    : 'border-zinc-800 bg-zinc-950/40 hover:bg-zinc-800/40 hover:border-zinc-700'
                }`}
              >
                <input
                  type="radio"
                  name="recurring-edit-scope"
                  value={opt.id}
                  checked={isSelected}
                  onChange={() => setSelectedScope(opt.id)}
                  className="mt-1 h-4 w-4 text-emerald-500 border-zinc-700 bg-zinc-900 focus:ring-emerald-500 cursor-pointer"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-zinc-100">
                      {opt.title}
                    </span>
                    {opt.badge && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {opt.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                    {opt.subtitle}
                  </p>
                </div>
              </label>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-2.5 pt-2 border-t border-zinc-800">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            className="flex-1 shadow-glow-emerald"
            disabled={isSubmitting}
            onClick={() => onConfirm(selectedScope)}
          >
            {isSubmitting ? 'Salvando...' : 'Confirmar e Salvar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
