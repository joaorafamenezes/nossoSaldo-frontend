import * as React from 'react';
import { createPortal } from 'react-dom';
import { useReleaseStore } from '../../stores/useReleaseStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { Button } from '../ui/Button';
import { Sparkles, X, CheckCircle2, ChevronRight, History } from 'lucide-react';
import confetti from 'canvas-confetti';

export function ReleaseNotesModal() {
  const {
    isOpen,
    hasUnseenRelease,
    selectedRelease,
    allReleases,
    openReleaseNotes,
    closeReleaseNotes,
    markCurrentAsViewed,
  } = useReleaseStore();

  const { token } = useAuthStore();

  const activeRelease = selectedRelease || allReleases[0];

  // Dispara confetes se o modal foi aberto porque tem novidade nova não vista
  React.useEffect(() => {
    if (isOpen && hasUnseenRelease) {
      try {
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.7 },
        });
      } catch {
        // Ignora em ambientes de teste
      }
    }
  }, [isOpen, hasUnseenRelease]);

  if (!isOpen || !activeRelease) return null;

  const handleConfirmViewed = async () => {
    if (token) {
      await markCurrentAsViewed(token);
    } else {
      closeReleaseNotes();
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="release-notes-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Glow accent bar at the top */}
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />

        {/* Modal Header */}
        <div className="p-6 border-b border-zinc-800/80 flex items-start justify-between gap-4 bg-zinc-900/40">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-sm">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="release-notes-title" className="text-lg font-bold text-zinc-100 tracking-tight">
                  Novidades do NossoSaldo
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400">
                  v{activeRelease.version}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Confira o que foi atualizado e as novas funcionalidades disponíveis
              </p>
            </div>
          </div>

          <button
            onClick={() => handleConfirmViewed()}
            className="rounded-xl p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Fechar"
            aria-label="Fechar novidades"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Versions switcher if more than one exists */}
        {allReleases.length > 1 && (
          <div className="px-6 py-2.5 bg-zinc-900/20 border-b border-zinc-800/60 flex items-center gap-2 overflow-x-auto text-xs">
            <span className="text-[11px] font-mono text-zinc-500 flex items-center gap-1 shrink-0 mr-1">
              <History className="h-3.5 w-3.5" />
              Versões:
            </span>
            {allReleases.map((rel) => {
              const isSelected = rel.version === activeRelease.version;
              return (
                <button
                  key={rel.version}
                  onClick={() => openReleaseNotes(rel)}
                  className={`px-2.5 py-1 rounded-lg font-mono text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border border-transparent'
                  }`}
                >
                  v{rel.version} {rel.isLatest && '• Atual'}
                </button>
              );
            })}
          </div>
        )}

        {/* Modal Body / Items List */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          <div>
            <h4 className="text-base font-bold text-zinc-100">{activeRelease.title}</h4>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">{activeRelease.date}</p>
          </div>

          <div className="space-y-3.5">
            {activeRelease.items.map((item, index) => (
              <div
                key={index}
                className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-4 transition-all hover:border-zinc-700/80"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="inline-flex items-center rounded-md border border-zinc-700/60 bg-zinc-800/80 px-2 py-0.5 text-[10px] font-semibold text-zinc-200">
                    {item.badge}
                  </span>
                  <h5 className="text-xs font-bold text-zinc-100">{item.title}</h5>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed pl-0.5">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-mono">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Sincronizado na sua conta</span>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => handleConfirmViewed()}
            className="text-xs font-bold shadow-glow-emerald px-5"
          >
            <span>Entendi, vamos lá!</span>
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ReleaseNotesModal;
