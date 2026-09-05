import * as React from 'react';
import { createPortal } from 'react-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { useAppStore } from '../../stores/useAppStore';
import { useThemeStore } from '../../stores/useThemeStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  X,
  User,
  Shield,
  Sparkles,
  Key,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Trash2,
  Loader2,
  Sun,
  Moon,
  EyeOff as PrivacyIcon,
  Sliders,
  Check,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { saveIaConfiguration, removeIaConfiguration, getIaConfiguration, updatePassword } from '../../services/api';
import { IaProvedor } from '../../types/ai';
import { APP_VERSION } from '../../config/appMeta';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'account' | 'security' | 'ai' | 'preferences';
}

type TabType = 'account' | 'security' | 'ai' | 'preferences';

const PROVIDERS: {
  id: IaProvedor;
  label: string;
  icon: string;
  badge: string;
  desc: string;
  models: { id: string; name: string; tag: string }[];
  keyPrefix: string;
  keyPlaceholder: string;
}[] = [
  {
    id: 'openai',
    label: 'OpenAI',
    icon: '🤖',
    badge: 'Popular',
    desc: 'Modelos GPT-4o e GPT-4.1 de alta capacidade analítica',
    models: [
      { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', tag: 'Padrão • Mais Rápido & Econômico' },
      { id: 'gpt-4o', name: 'GPT-4o (Omni)', tag: 'Máximo Raciocínio' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', tag: 'Alta Eficiência' },
    ],
    keyPrefix: 'sk-',
    keyPlaceholder: 'sk-proj-...',
  },
  {
    id: 'gemini',
    label: 'Google Gemini',
    icon: '✨',
    badge: 'Rápido',
    desc: 'Modelos multimodais Google com altíssima velocidade',
    models: [
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', tag: 'Ultra Baixa Latência' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', tag: 'Raciocínio Complexo' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', tag: 'Econômico' },
    ],
    keyPrefix: 'AIza',
    keyPlaceholder: 'AIzaSy...',
  },
  {
    id: 'anthropic',
    label: 'Claude (Anthropic)',
    icon: '🧠',
    badge: 'Especialista',
    desc: 'Modelos Claude para análises profundas e orçamentos',
    models: [
      { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', tag: 'Análise Avançada' },
      { id: 'claude-3-5-haiku', name: 'Claude 3.5 Haiku', tag: 'Ágil e Econômico' },
    ],
    keyPrefix: 'sk-ant-',
    keyPlaceholder: 'sk-ant-api03-...',
  },
  {
    id: 'groq',
    label: 'Groq LPU',
    icon: '⚡',
    badge: 'Ultra-rápido',
    desc: 'Processamento instantâneo via chips LPU especializados',
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', tag: 'Alta Performance' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', tag: 'Contexto Amplo' },
    ],
    keyPrefix: 'gsk_',
    keyPlaceholder: 'gsk_...',
  },
  {
    id: 'ollama',
    label: 'Ollama (Local)',
    icon: '🦙',
    badge: 'Self-hosted',
    desc: 'Modelos executados diretamente no seu servidor local',
    models: [
      { id: 'llama3:latest', name: 'Llama 3 Local', tag: 'Privacidade Total' },
      { id: 'mistral:latest', name: 'Mistral Local', tag: 'Sem custo de API' },
    ],
    keyPrefix: '',
    keyPlaceholder: 'http://localhost:11434 ou token local',
  },
];

export function UserSettingsModal({ isOpen, onClose, defaultTab = 'account' }: UserSettingsModalProps) {
  const { user, token } = useAuthStore();
  const { iaConfig, updateIaConfig, isPrivacyMode, togglePrivacyMode } = useAppStore();
  const { theme, toggleTheme } = useThemeStore();

  const [activeTab, setActiveTab] = React.useState<TabType>(defaultTab);
  const isAdmin = user?.perfil === 'ADMIN';

  // AI Configuration State
  const [selectedProvider, setSelectedProvider] = React.useState<IaProvedor>((iaConfig.provedor as IaProvedor) || 'openai');
  const [selectedModel, setSelectedModel] = React.useState(iaConfig.modelo || 'gpt-4.1-mini');
  const [apiKeyInput, setApiKeyInput] = React.useState('');
  const [showApiKey, setShowApiKey] = React.useState(false);
  const [isSavingAi, setIsSavingAi] = React.useState(false);

  // Security / Password State
  const [novaSenha, setNovaSenha] = React.useState('');
  const [confirmaSenha, setConfirmaSenha] = React.useState('');
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);

  // Reset tab on open
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  // Load backend AI status on modal open
  React.useEffect(() => {
    if (isOpen && token) {
      getIaConfiguration(token)
        .then((data) => {
          if (data?.configurada) {
            setSelectedProvider((data.provedor as IaProvedor) || 'openai');
            setSelectedModel(data.modelo || 'gpt-4.1-mini');
            updateIaConfig({
              provedor: data.provedor,
              modelo: data.modelo,
              apiKeyCadastrada: true,
              atualizadaEm: data.atualizadaEm,
            });
          }
        })
        .catch(() => {});
    }
  }, [isOpen, token, updateIaConfig]);

  if (!isOpen) return null;

  const currentProviderConfig = PROVIDERS.find((p) => p.id === selectedProvider) || PROVIDERS[0];

  const handleProviderSelect = (providerId: IaProvedor) => {
    setSelectedProvider(providerId);
    const targetProv = PROVIDERS.find((p) => p.id === providerId);
    if (targetProv && targetProv.models.length > 0) {
      setSelectedModel(targetProv.models[0].id);
    }
  };

  const handleSaveAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const payloadKey = apiKeyInput.trim()
      ? apiKeyInput.trim()
      : (iaConfig.apiKeyCadastrada ? '__KEEP_CURRENT_KEY__' : '');

    if (!payloadKey) {
      toast.error('Informe a chave de API para ativar a integração.');
      return;
    }

    setIsSavingAi(true);
    try {
      await saveIaConfiguration(token, {
        apiKey: payloadKey,
        modelo: selectedModel,
        provedor: selectedProvider,
      });

      updateIaConfig({
        provedor: selectedProvider,
        modelo: selectedModel,
        apiKeyCadastrada: true,
        atualizadaEm: new Date().toISOString(),
      });

      toast.success(`Inteligência Artificial (${selectedProvider.toUpperCase()}) salva e ativada globalmente!`);
      setApiKeyInput('');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar configuração de IA.');
    } finally {
      setIsSavingAi(false);
    }
  };

  const handleRemoveAi = async () => {
    if (!token) return;
    if (!confirm('Deseja realmente desconectar o provedor global de IA?')) return;

    try {
      await removeIaConfiguration(token);
      updateIaConfig({
        provedor: 'openai',
        modelo: 'gpt-4.1-mini',
        apiKeyCadastrada: false,
      });
      toast.success('Configuração de IA removida.');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao remover configuração de IA.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (novaSenha.length < 6) {
      toast.error('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (novaSenha !== confirmaSenha) {
      toast.error('A confirmação da nova senha não confere.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await updatePassword(token, novaSenha);
      toast.success('Senha atualizada com sucesso!');
      setNovaSenha('');
      setConfirmaSenha('');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar senha.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 md:p-10 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-4xl rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Navigation Sidebar (Linear / Settings Style) */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-zinc-800/80 bg-zinc-900/40 p-5 flex flex-col justify-between shrink-0">
          <div className="space-y-6">
            {/* User Profile Summary Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-zinc-800/80">
              <div className="relative">
                <img
                  src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                  alt={user?.nome || 'Usuário'}
                  className="h-11 w-11 rounded-2xl object-cover ring-2 ring-emerald-500/40 shrink-0"
                />
                {isAdmin && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] text-zinc-950 font-bold shadow-md">
                    ★
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-bold text-zinc-100">
                  {user?.nome || 'Usuário'}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {isAdmin ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-bold font-mono text-amber-400 uppercase">
                      <Shield className="h-3 w-3" />
                      ADMIN
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-md bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">
                      USUÁRIO
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation Tab Links */}
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('account')}
                className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'account'
                    ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <User className={`h-4 w-4 ${activeTab === 'account' ? 'text-emerald-400' : 'text-zinc-400'}`} />
                  <span>Minha Conta</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 opacity-40" />
              </button>

              <button
                onClick={() => setActiveTab('security')}
                className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'security'
                    ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Lock className={`h-4 w-4 ${activeTab === 'security' ? 'text-emerald-400' : 'text-zinc-400'}`} />
                  <span>Segurança & Senha</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 opacity-40" />
              </button>

              <button
                onClick={() => setActiveTab('ai')}
                className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'ai'
                    ? 'bg-indigo-950/40 text-indigo-300 shadow-sm border border-indigo-500/40'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className={`h-4 w-4 ${activeTab === 'ai' ? 'text-indigo-400' : 'text-zinc-400'}`} />
                  <span>Inteligência Artificial</span>
                </div>
                {isAdmin && (
                  <span className="rounded bg-amber-500/20 text-amber-400 text-[9px] font-mono px-1.5 py-0.2 font-bold">
                    ADMIN
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('preferences')}
                className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'preferences'
                    ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sliders className={`h-4 w-4 ${activeTab === 'preferences' ? 'text-emerald-400' : 'text-zinc-400'}`} />
                  <span>Preferências</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 opacity-40" />
              </button>
            </nav>
          </div>

          <div className="pt-4 border-t border-zinc-800/80 hidden md:block">
            <p className="text-[11px] text-zinc-500 font-mono">NossoSaldo v{APP_VERSION} Pro</p>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col justify-between overflow-hidden bg-zinc-950">
          {/* Top Bar with Title and Close Button */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800/80 bg-zinc-950">
            <div>
              <h2 className="text-base font-bold text-zinc-100">
                {activeTab === 'account' && 'Dados e Perfil da Conta'}
                {activeTab === 'security' && 'Segurança e Alteração de Senha'}
                {activeTab === 'ai' && 'Configuração de Inteligência Artificial & LLM'}
                {activeTab === 'preferences' && 'Preferências de Interface & Privacidade'}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {activeTab === 'account' && 'Gerencie seus dados de identificação e permissões de acesso.'}
                {activeTab === 'security' && 'Mantenha sua conta segura alterando sua senha periodicamente.'}
                {activeTab === 'ai' && (isAdmin ? 'Configuração global do provedor e modelo de IA para o sistema.' : 'Status do Copilot Financeiro integrado à sua conta.')}
                {activeTab === 'preferences' && 'Personalize temas visuais e opções de privacidade.'}
              </p>
            </div>

            <button
              onClick={onClose}
              className="rounded-xl p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-800/60 transition-colors"
              title="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Main Scrollable Content */}
          <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1">
            {/* TAB 1: DADOS DA CONTA */}
            {activeTab === 'account' && (
              <div className="space-y-6 max-w-xl">
                {/* Account Details Box */}
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-zinc-400">
                        Nome Completo
                      </label>
                      <p className="text-sm font-semibold text-zinc-100 mt-1">
                        {user?.nome || 'Usuário'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-zinc-400">
                        Endereço de E-mail
                      </label>
                      <p className="text-sm font-mono text-zinc-300 mt-1">
                        {user?.email || '—'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-semibold uppercase text-zinc-400 block">
                        Nível de Acesso
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        {isAdmin ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400">
                            <Shield className="h-4 w-4" />
                            Administrador do Sistema (Acesso Total)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                            <CheckCircle2 className="h-4 w-4" />
                            Usuário Padrão
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] font-semibold uppercase text-zinc-400 block">
                        Status do E-mail
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 mt-1">
                        <Check className="h-3.5 w-3.5" />
                        Verificado
                      </span>
                    </div>
                  </div>
                </div>

                {/* Role Description Card */}
                <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/20 p-4 flex items-start gap-3 text-xs text-zinc-400 leading-relaxed">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    {isAdmin
                      ? 'Sua conta possui permissões administrativas para gerenciar configurações globais de IA, categorias e diretrizes do sistema.'
                      : 'Sua conta tem acesso aos seus registros financeiros pessoais, cartões de crédito e faturas compartilhadas.'}
                  </span>
                </div>
              </div>
            )}

            {/* TAB 2: SEGURANÇA & SENHA */}
            {activeTab === 'security' && (
              <div className="space-y-6 max-w-xl">
                <form onSubmit={handleChangePassword} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-emerald-400" />
                    Trocar Senha da Conta
                  </h3>

                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                        Nova Senha
                      </label>
                      <Input
                        type="password"
                        placeholder="Mínimo de 6 caracteres"
                        value={novaSenha}
                        onChange={(e) => setNovaSenha(e.target.value)}
                        className="bg-zinc-900 border-zinc-800 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                        Confirmar Nova Senha
                      </label>
                      <Input
                        type="password"
                        placeholder="Repita a nova senha"
                        value={confirmaSenha}
                        onChange={(e) => setConfirmaSenha(e.target.value)}
                        className="bg-zinc-900 border-zinc-800 text-xs"
                      />
                    </div>
                  </div>

                  <div className="pt-3 flex justify-end">
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      disabled={isChangingPassword || !novaSenha}
                      className="text-xs font-bold"
                    >
                      {isChangingPassword ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                          Atualizando...
                        </>
                      ) : (
                        'Salvar Nova Senha'
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 3: INTELIGÊNCIA ARTIFICIAL & LLM */}
            {activeTab === 'ai' && (
              <div className="space-y-6 max-w-2xl">
                {isAdmin ? (
                  /* Admin Global AI Configuration */
                  <form onSubmit={handleSaveAi} className="space-y-6">
                    {/* Global Admin Banner */}
                    <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 flex items-start gap-3 text-xs text-amber-200 leading-relaxed">
                      <Shield className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-bold text-amber-300 block mb-0.5">
                          Configuração Global do Sistema
                        </strong>
                        Como Administrador, o provedor e a chave de API cadastrados aqui serão utilizados por <strong>todos os usuários</strong> do NossoSaldo para análises no Copilot Financeiro.
                      </div>
                    </div>

                    {/* Step 1: Provider Selector */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-3">
                        1. Selecione o Provedor de LLM
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {PROVIDERS.map((prov) => {
                          const isSelected = selectedProvider === prov.id;
                          return (
                            <button
                              key={prov.id}
                              type="button"
                              onClick={() => handleProviderSelect(prov.id)}
                              className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 ${
                                isSelected
                                  ? 'border-indigo-500 bg-indigo-950/30 ring-1 ring-indigo-500/60 shadow-glow-sm'
                                  : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 text-zinc-400'
                              }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className="text-2xl">{prov.icon}</span>
                                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                                  isSelected ? 'bg-indigo-500/20 text-indigo-300' : 'bg-zinc-800 text-zinc-400'
                                }`}>
                                  {prov.badge}
                                </span>
                              </div>
                              <div>
                                <p className={`text-xs font-bold ${isSelected ? 'text-indigo-200' : 'text-zinc-200'}`}>
                                  {prov.label}
                                </p>
                                <p className="text-[10px] text-zinc-500 line-clamp-1 mt-0.5">{prov.desc}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Step 2: Model Selector */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2.5">
                        2. Modelo ({currentProviderConfig.label})
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {currentProviderConfig.models.map((mod) => {
                          const isSelected = selectedModel === mod.id;
                          return (
                            <button
                              key={mod.id}
                              type="button"
                              onClick={() => setSelectedModel(mod.id)}
                              className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                                isSelected
                                  ? 'border-indigo-500 bg-indigo-950/40 text-indigo-200 ring-1 ring-indigo-500'
                                  : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 text-zinc-300'
                              }`}
                            >
                              <div className="space-y-0.5 min-w-0 pr-2">
                                <p className="text-xs font-bold font-mono text-zinc-100 truncate">{mod.name}</p>
                                <p className="text-[10px] text-zinc-400">{mod.tag}</p>
                              </div>
                              {isSelected && <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Step 3: API Key */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                          3. Chave de API ({currentProviderConfig.label})
                        </label>
                        {iaConfig.apiKeyCadastrada && (
                          <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-bold">
                            <CheckCircle2 className="h-3 w-3" />
                            Chave Ativa e Criptografada
                          </span>
                        )}
                      </div>

                      <div className="relative">
                        <Key className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
                        <Input
                          type={showApiKey ? 'text' : 'password'}
                          placeholder={
                            iaConfig.apiKeyCadastrada
                              ? '•••••••••••••••••••••••• (Chave salva no servidor)'
                              : currentProviderConfig.keyPlaceholder
                          }
                          value={apiKeyInput}
                          onChange={(e) => setApiKeyInput(e.target.value)}
                          className="pl-9 pr-10 font-mono text-xs text-zinc-200 bg-zinc-900 border-zinc-800"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300"
                        >
                          {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Encryption Notice */}
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/15 p-3 flex items-start gap-2.5 text-xs text-emerald-300">
                      <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                      <p className="leading-relaxed text-[11px]">
                        Sua chave é protegida com criptografia <strong>AES-256-GCM</strong> no banco de dados e nunca é exposta publicamente.
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-3">
                      {iaConfig.apiKeyCadastrada ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleRemoveAi}
                          className="text-xs text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Desconectar IA
                        </Button>
                      ) : (
                        <div />
                      )}

                      <Button
                        type="submit"
                        variant="ai"
                        size="sm"
                        disabled={isSavingAi}
                        className="text-xs font-bold shadow-glow-sm"
                      >
                        {isSavingAi ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                            Salvando Conexão...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                            Salvar e Ativar Globalmente
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                ) : (
                  /* Standard User Informative View */
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-6 text-center space-y-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 mx-auto border border-indigo-500/30">
                        <Sparkles className="h-6 w-6" />
                      </div>
                      <h4 className="text-base font-bold text-zinc-100">
                        Copilot Financeiro Ativo no NossoSaldo
                      </h4>
                      <p className="text-xs text-zinc-300 max-w-md mx-auto leading-relaxed">
                        O serviço de inteligência artificial está habilitado globalmente para você realizar perguntas e diagnósticos financeiros a qualquer momento.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-zinc-400">
                        <span>Provedor Conectado:</span>
                        <strong className="text-zinc-200 capitalize font-mono">{iaConfig.provedor}</strong>
                      </div>
                      <div className="flex items-center justify-between text-zinc-400 pt-2 border-t border-zinc-800">
                        <span>Modelo Ativo:</span>
                        <strong className="text-emerald-400 font-mono">{iaConfig.modelo}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: PREFERÊNCIAS */}
            {activeTab === 'preferences' && (
              <div className="space-y-6 max-w-xl">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                        <PrivacyIcon className="h-4 w-4 text-amber-400" />
                        Modo Privacidade por Padrão
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Oculta saldos e valores monetários na tela inicial para evitar visualização indevida.
                      </p>
                    </div>

                    <button
                      onClick={togglePrivacyMode}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isPrivacyMode ? 'bg-emerald-500' : 'bg-zinc-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isPrivacyMode ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                        {theme === 'dark' ? <Moon className="h-4 w-4 text-indigo-400" /> : <Sun className="h-4 w-4 text-amber-400" />}
                        Tema Visual da Interface
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Alternar entre modo escuro (Dark Pro) e modo claro.
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={toggleTheme}
                      className="text-xs font-semibold capitalize"
                    >
                      {theme === 'dark' ? 'Modo Escuro' : 'Modo Claro'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
