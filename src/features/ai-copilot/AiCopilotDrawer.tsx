import * as React from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { NaturalLanguageComposer } from './NaturalLanguageComposer';
import { Button } from '../../components/ui/Button';
import { Sparkles, X, Send, Bot, User, Settings, HelpCircle, Shield, RotateCcw } from 'lucide-react';
import { UserSettingsModal } from '../auth/UserSettingsModal';
import { toast } from 'sonner';

export function AiCopilotDrawer() {
  const { isAiDrawerOpen, setAiDrawerOpen, aiMessages, sendAiUserMessage, clearAiConversation, iaConfig, isAiResponding } = useAppStore();
  const { user } = useAuthStore();
  const isAdmin = user?.perfil === 'ADMIN';

  const [inputMsg, setInputMsg] = React.useState('');
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const QUICK_QUESTIONS = [
    'Quanto gastamos no supermercado este mês?',
    'Qual fatura de cartão fecha primeiro?',
    'Como está a taxa de poupança do casal?',
  ];

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages, isAiResponding]);

  if (!isAiDrawerOpen) return null;

  const handleSend = async (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    const query = inputMsg.trim();
    if (!query || isAiResponding) return;
    setInputMsg('');
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
    setInputMsg(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
  };

  const handleQuickPrompt = async (prompt: string) => {
    if (isAiResponding) return;
    await sendAiUserMessage(prompt);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div
          className="w-full max-w-lg bg-zinc-900 border-l border-zinc-800 h-full flex flex-col justify-between shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 p-4 bg-zinc-950/80 backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-glow-sm">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                  Copilot Financeiro NossoSaldo
                  <span className="rounded bg-indigo-500/20 text-indigo-400 text-[10px] font-mono px-1.5 py-0.2 uppercase">
                    {iaConfig.modelo}
                  </span>
                </h3>
                <p className="text-[11px] text-zinc-400">Inteligência Financeira Pessoal & Casal</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {aiMessages.length > 0 && (
                <button
                  onClick={async () => {
                    await clearAiConversation();
                    toast.success('Diálogo reiniciado. Nova conversa iniciada!');
                  }}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                  title="Reiniciar diálogo e começar nova conversa"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-amber-300 transition-colors"
                  title="Configurações Globais de IA (Admin)"
                >
                  <Settings className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setAiDrawerOpen(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                title="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Natural language composer widget */}
          <div className="p-4 border-b border-zinc-800 bg-zinc-950/40">
            <NaturalLanguageComposer />
          </div>

          {/* Quick Prompts strip */}
          <div className="px-4 py-2 bg-zinc-950 border-b border-zinc-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <HelpCircle className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            {QUICK_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickPrompt(q)}
                className="shrink-0 rounded-lg bg-zinc-900 border border-zinc-800 px-2 py-1 text-[10px] text-zinc-300 hover:border-indigo-500/40 hover:text-white transition-colors"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {aiMessages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white mt-1 shadow-glow-sm">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div
                    className={`rounded-2xl px-4 py-3 text-xs leading-relaxed max-w-[85%] ${
                      isUser
                        ? 'bg-emerald-600 text-zinc-950 font-semibold shadow-sm'
                        : 'bg-zinc-800/90 text-zinc-200 border border-zinc-700/60 shadow-inner'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    {msg.acoesSugeridas && (
                      <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-zinc-700/60">
                        {msg.acoesSugeridas.map((action, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleQuickPrompt(action.label)}
                            className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-[11px] font-semibold text-indigo-300 hover:bg-indigo-500/20 transition-colors"
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-zinc-700 text-zinc-300 mt-1">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Typing Indicator (Simulating Human / Assistant typing) */}
            {isAiResponding && (
              <div className="flex gap-3 justify-start animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white mt-1 shadow-glow-sm">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-2xl px-4 py-3 bg-zinc-800/90 text-zinc-300 border border-zinc-700/60 flex items-center gap-2.5 shadow-inner">
                  <span className="text-xs text-zinc-400 font-medium">NossoSaldo Copilot está digitando</span>
                  <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form onSubmit={handleSend} className="p-4 border-t border-zinc-800 bg-zinc-950/90 flex items-end gap-2">
            <div className="relative flex-1">
              <textarea
                ref={textareaRef}
                rows={1}
                placeholder={
                  isAiResponding
                    ? 'Aguarde o Copilot responder...'
                    : 'Pergunte ao Copilot... (Shift + Enter para nova linha)'
                }
                value={inputMsg}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                disabled={isAiResponding}
                className="w-full min-h-[40px] max-h-36 rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 resize-none leading-relaxed transition-all"
              />
            </div>
            <Button
              type="submit"
              variant="ai"
              size="icon"
              disabled={!inputMsg.trim() || isAiResponding}
              className="h-10 w-10 rounded-xl shadow-glow-sm shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      <UserSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} defaultTab="ai" />
    </>
  );
}
