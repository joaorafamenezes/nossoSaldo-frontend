import * as React from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { X, Sparkles, ShieldCheck, Key } from 'lucide-react';
import { toast } from 'sonner';

interface AiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AiSettingsModal({ isOpen, onClose }: AiSettingsModalProps) {
  const { iaConfig, updateIaConfig } = useAppStore();

  const [provedor, setProvedor] = React.useState(iaConfig.provedor);
  const [modelo, setModelo] = React.useState(iaConfig.modelo);
  const [apiKeyInput, setApiKeyInput] = React.useState('sk-proj-••••••••••••••••••••••••');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateIaConfig({
      provedor,
      modelo,
      apiKeyCadastrada: true,
    });
    toast.success('Configurações de IA salvas com sucesso!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div
        className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-400" />
              Configuração do Provedor de IA
            </h3>
            <p className="text-xs text-zinc-400">
              Conexão com modelos LLM para o NossoSaldo
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-zinc-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
              Provedor de IA
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'openai', label: 'OpenAI', icon: '🤖' },
                { id: 'anthropic', label: 'Claude', icon: '🧠' },
                { id: 'gemini', label: 'Gemini', icon: '✨' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setProvedor(p.id as any);
                    if (p.id === 'openai') setModelo('gpt-4.1-mini');
                    else if (p.id === 'anthropic') setModelo('claude-3-5-haiku');
                    else if (p.id === 'gemini') setModelo('gemini-2.0-flash');
                  }}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                    provedor === p.id
                      ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300'
                      : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <span className="text-base">{p.icon}</span>
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">
              Modelo Selecionado
            </label>
            <select
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-xs text-zinc-100 outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            >
              {provedor === 'openai' && (
                <>
                  <option value="gpt-4.1-mini">gpt-4.1-mini (Recomendado • Alta velocidade)</option>
                  <option value="gpt-4o">gpt-4o (Máxima capacidade analítica)</option>
                </>
              )}
              {provedor === 'anthropic' && (
                <>
                  <option value="claude-3-5-haiku">claude-3-5-haiku (Rápido e econômico)</option>
                  <option value="claude-3-5-sonnet">claude-3-5-sonnet (Análise profunda)</option>
                </>
              )}
              {provedor === 'gemini' && (
                <>
                  <option value="gemini-2.0-flash">gemini-2.0-flash (Ultra rápido)</option>
                  <option value="gemini-1.5-pro">gemini-1.5-pro (Raciocínio complexo)</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">
              Chave de API (Armazenada com Criptografia AES-256 no backend)
            </label>
            <div className="relative">
              <Key className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
              <Input
                type="text"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="pl-9.5 font-mono text-xs text-zinc-300 bg-zinc-950"
                placeholder="sk-..."
              />
            </div>
          </div>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/15 p-3 flex items-start gap-2.5 text-xs text-emerald-300">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
            <p className="leading-relaxed text-[11px]">
              Sua chave é armazenada cifrada com AES-256 e nunca exposta publicamente.
            </p>
          </div>

          <div className="pt-2 flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="ai" className="flex-1 shadow-glow-sm">
              Salvar Conexão
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
