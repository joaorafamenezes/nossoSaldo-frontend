import * as React from 'react';
import { Button } from '../../components/ui/Button';
import { CheckCircle2, Clock, Trash2, X } from 'lucide-react';
import { StatusGasto } from '../../types/financial';

interface BatchActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBatchStatus: (status: StatusGasto) => void;
  onBatchDelete: () => void;
}

export function BatchActionsBar({
  selectedCount,
  onClearSelection,
  onBatchStatus,
  onBatchDelete,
}: BatchActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-2xl border border-zinc-700 bg-zinc-900/95 px-4 py-2.5 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-center gap-2 pr-2 border-r border-zinc-800">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-zinc-950 font-bold text-xs font-mono">
          {selectedCount}
        </span>
        <span className="text-xs font-semibold text-zinc-200">
          {selectedCount === 1 ? 'item selecionado' : 'itens selecionados'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onBatchStatus('pago')}
          className="text-xs text-emerald-400 hover:text-emerald-300"
        >
          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
          <span>Marcar Pago</span>
        </Button>

        <Button
          size="sm"
          variant="secondary"
          onClick={() => onBatchStatus('pendente')}
          className="text-xs text-zinc-300"
        >
          <Clock className="h-3.5 w-3.5 mr-1" />
          <span>Marcar Pendente</span>
        </Button>

        <Button
          size="sm"
          variant="danger"
          onClick={onBatchDelete}
          className="text-xs"
        >
          <Trash2 className="h-3.5 w-3.5 mr-1" />
          <span>Excluir</span>
        </Button>

        <button
          onClick={onClearSelection}
          className="ml-1 p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          title="Limpar seleção"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
