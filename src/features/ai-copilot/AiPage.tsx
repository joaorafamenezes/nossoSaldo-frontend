import * as React from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { NaturalLanguageComposer } from './NaturalLanguageComposer';
import { BudgetAuditCard } from './BudgetAuditCard';
import { UserSettingsModal } from '../auth/UserSettingsModal';
import { ReceiptScannerModal } from './ReceiptScannerModal';
import { AiHistoryTab } from './AiHistoryTab';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../stores/useAuthStore';
import {
  Sparkles,
  Send,
  Bot,
  Lightbulb,
  Settings,
  Camera,
  RotateCcw,
  History,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';

export function AiPage() {
  const { aiInsights, aiMessages, sendAiUserMessage, clearAiConversation, iaConfig, setActiveTab, isAiResponding } = useAppStore();
  const { user } = useAuthStore();
  const isAdmin = user?.perfil === 'ADMIN';

  const [activeSubTab, setActiveSubTab] = React.useState<'chat' | 'history'>('chat');
  const [chatInput, setChatInput] = React.useState('');
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [isScannerOpen, setIsScannerOpen] = React.useState(false);
  const chatScrollRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [aiMessages, isAiResponding]);

  const handleSend = async (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    const query = chatInput.trim();
    if (!query || isAiResponding) return;
    setChatInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    await sendAiUserMessage(query);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setChatInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  const handleInsightAction = (ins: typeof aiInsights[0]) => {
    if (ins.acaoRota) {
      setActiveTab(ins.acaoRota as any);
    } else {
      sendAiUserMessage(ins.titulo);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-indigo-400" />
            Copilot & Inteligência Financeira
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Diagnósticos em tempo real, auditoria de tetos de gastos e transcrição por voz/imagem
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsScannerOpen(true)}
            className="text-xs border-indigo-500/30 text-indigo-300"
          >
            <Camera className="h-3.5 w-3.5 mr-1" />
            <span>Escanear Cupom</span>
          </Button>

          {isAdmin ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsSettingsOpen(true)}
              className="text-xs border border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
            >
              <Settings className="h-3.5 w-3.5 mr-1" />
              <span>Configurar IA Global ({iaConfig.modelo})</span>
            </Button>
          ) : (
            <span className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-400 font-mono flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              {iaConfig.modelo}
            </span>
          )}
        </div>
      </div>

      {/* Sub-Tabs: Chat Interativo vs Histórico & Auditoria */}
      <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-3">
        <button
          onClick={() => setActiveSubTab('chat')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'chat'
              ? 'bg-indigo-600 text-white shadow-glow-sm'
              : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-zinc-800/60'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          <span>Chat Interativo & Diagnósticos</span>
        </button>

        <button
          onClick={() => setActiveSubTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'history'
              ? 'bg-indigo-600 text-white shadow-glow-sm'
              : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-zinc-800/60'
          }`}
        >
          <History className="h-4 w-4" />
          <span>Histórico & Auditoria de Ações</span>
        </button>
      </div>

      {activeSubTab === 'history' ? (
        <AiHistoryTab
          onContinueChat={(prompt) => {
            setChatInput(prompt);
            setActiveSubTab('chat');
          }}
        />
      ) : (
        <>
          {/* Budget & Category Audit */}
          <BudgetAuditCard />

          {/* Grid of AI Insights & Recommendations */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-400" />
              Diagnósticos & Recomendações Automáticas
            </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {aiInsights.map((ins) => (
            <div
              key={ins.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3 flex flex-col justify-between hover:border-zinc-700 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase font-mono ${
                      ins.tipo === 'alerta'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : ins.tipo === 'oportunidade'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    }`}
                  >
                    {ins.tipo}
                  </span>
                  {ins.impacto && (
                    <span className="font-mono text-xs text-zinc-400 font-bold">
                      Impacto: R$ {ins.impacto.toFixed(2)}
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-bold text-zinc-100 mt-2">{ins.titulo}</h4>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{ins.descricao}</p>
              </div>

              {ins.acaoTexto && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleInsightAction(ins)}
                  className="w-full text-xs"
                >
                  {ins.acaoTexto}
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Chat Console */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
            <Bot className="h-4 w-4 text-indigo-400" />
            Console Interativo ({iaConfig.provedor.toUpperCase()})
          </h3>
          <div className="flex items-center gap-2">
            {aiMessages.length > 0 && (
              <button
                type="button"
                onClick={async () => {
                  await clearAiConversation();
                  toast.success('Diálogo reiniciado. Nova conversa iniciada!');
                }}
                className="text-[11px] font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 px-2.5 py-1 rounded-lg border border-zinc-800 flex items-center gap-1.5 transition-colors"
                title="Limpar histórico e começar nova conversa"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Nova Conversa</span>
              </button>
            )}
            <span className="text-[11px] text-zinc-500 font-mono hidden sm:inline">Diálogo contínuo ativo</span>
          </div>
        </div>

        <div
          ref={chatScrollRef}
          className="max-h-96 overflow-y-auto space-y-3 p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 scroll-smooth"
        >
          {aiMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 text-xs leading-relaxed ${
                msg.role === 'user' ? 'justify-end text-emerald-400' : 'justify-start text-zinc-300'
              }`}
            >
              <div
                className={`p-3.5 rounded-2xl max-w-[85%] ${
                  msg.role === 'user'
                    ? 'bg-zinc-800 border border-zinc-700 text-zinc-100 font-medium'
                    : 'bg-zinc-900 border border-zinc-800/90'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {/* Typing Indicator (Simulating Human / Assistant typing) */}
          {isAiResponding && (
            <div className="flex gap-3 justify-start text-xs text-zinc-300 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-glow-sm mt-0.5">
                <Bot className="h-4 w-4" />
              </div>
              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800/90 flex items-center gap-2.5 shadow-sm">
                <span className="text-zinc-400 font-medium">NossoSaldo Copilot está digitando</span>
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce" />
                </div>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSend} className="flex items-end gap-2">
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder={
                isAiResponding
                  ? 'Aguarde o Copilot responder...'
                  : 'Pergunte ao Copilot... (Shift + Enter para nova linha)'
              }
              value={chatInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={isAiResponding}
              className="w-full min-h-[44px] max-h-40 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-xs text-zinc-100 placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 resize-none leading-relaxed transition-all"
            />
          </div>
          <Button
            type="submit"
            variant="ai"
            size="sm"
            disabled={!chatInput.trim() || isAiResponding}
            className="h-11 px-6 shadow-glow-sm font-semibold shrink-0"
          >
            <Send className="h-4 w-4 mr-1.5" />
            <span>{isAiResponding ? 'Enviando...' : 'Enviar'}</span>
          </Button>
        </form>
      </div>
    </>
  )}

      <UserSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} defaultTab="ai" />
      <ReceiptScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} />
    </div>
  );
}
