import * as React from 'react';
import * as api from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { toast } from 'sonner';
import {
  Search,
  Calendar,
  Trash2,
  RotateCcw,
  Bot,
  User,
  Sparkles,
  Copy,
  Check,
  Filter,
  MessageSquareText,
  Clock,
} from 'lucide-react';

interface IaConversaItem {
  id: string;
  usuarioId: string;
  pergunta: string;
  resposta: string;
  provedor: string;
  modelo: string;
  createdAt: string;
}

interface AiHistoryTabProps {
  onContinueChat?: (prompt: string) => void;
}

export function AiHistoryTab({ onContinueChat }: AiHistoryTabProps) {
  const [history, setHistory] = React.useState<IaConversaItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');
  const [selectedModel, setSelectedModel] = React.useState('all');
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const fetchHistory = React.useCallback(async () => {
    const token = localStorage.getItem('@NossoSaldo:token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.getIaConversationHistory(token);
      const data = Array.isArray(res)
        ? res
        : Array.isArray((res as any)?.data)
        ? (res as any).data
        : [];
      setHistory(data);
    } catch (err) {
      console.error('Erro ao carregar histórico da IA:', err);
      toast.error('Não foi possível carregar o histórico de conversas.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleClearHistory = async () => {
    if (!window.confirm('Tem certeza que deseja apagar todo o histórico de conversas com a IA? Esta ação não pode ser desfeita.')) {
      return;
    }

    const token = localStorage.getItem('@NossoSaldo:token');
    if (!token) return;

    try {
      setIsDeleting(true);
      await api.clearIaConversationHistory(token);
      setHistory([]);
      toast.success('Histórico da IA limpo com sucesso.');
    } catch (err: any) {
      console.error('Erro ao limpar histórico:', err);
      toast.error('Falha ao limpar histórico.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Resposta copiada para a área de transferência!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter items
  const filteredHistory = React.useMemo(() => {
    return history.filter((item) => {
      const query = search.toLowerCase().trim();
      const matchSearch =
        !query ||
        item.pergunta.toLowerCase().includes(query) ||
        item.resposta.toLowerCase().includes(query);

      const itemDate = item.createdAt ? item.createdAt.slice(0, 10) : '';
      const matchDateFrom = !dateFrom || (itemDate && itemDate >= dateFrom);
      const matchDateTo = !dateTo || (itemDate && itemDate <= dateTo);
      const matchModel = selectedModel === 'all' || item.modelo === selectedModel;

      return matchSearch && matchDateFrom && matchDateTo && matchModel;
    });
  }, [history, search, dateFrom, dateTo, selectedModel]);

  const availableModels = React.useMemo(() => {
    const set = new Set<string>();
    history.forEach((h) => {
      if (h.modelo) set.add(h.modelo);
    });
    return Array.from(set);
  }, [history]);

  const formatDate = (isoString: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Privacy Notice & Header */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 font-mono">
            PRIVACIDADE & AUDITORIA
          </span>
          <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2 mt-0.5">
            <MessageSquareText className="h-5 w-5 text-indigo-400" />
            Histórico de Consultas & Ações da IA
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Consulte todas as suas perguntas, orientações e ações financeiras realizadas pelo Copilot.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchHistory}
            disabled={isLoading}
            className="text-xs border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            <RotateCcw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleClearHistory}
            disabled={isDeleting || history.length === 0}
            className="text-xs border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            <span>Apagar Histórico</span>
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Search */}
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Pesquisar por pergunta ou resposta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-zinc-900 border-zinc-800 text-xs h-10"
          />
        </div>

        {/* Date From */}
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 pointer-events-none" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full h-10 rounded-xl border border-zinc-800 bg-zinc-900 pl-9 pr-3 text-xs text-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500"
            title="Data Inicial"
          />
        </div>

        {/* Model Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 pointer-events-none" />
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full h-10 rounded-xl border border-zinc-800 bg-zinc-900 pl-9 pr-8 text-xs text-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
          >
            <option value="all">Todos os modelos</option>
            {availableModels.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Counter */}
      <div className="flex items-center justify-between text-xs text-zinc-500 font-mono px-1">
        <span>
          Mostrando {filteredHistory.length} de {history.length} consulta(s)
        </span>
        {(search || dateFrom || dateTo || selectedModel !== 'all') && (
          <button
            onClick={() => {
              setSearch('');
              setDateFrom('');
              setDateTo('');
              setSelectedModel('all');
            }}
            className="text-indigo-400 hover:underline"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* History List */}
      {isLoading ? (
        <div className="py-16 text-center space-y-3">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="text-xs text-zinc-400 font-medium">Carregando histórico do NossoSaldo...</p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 p-12 text-center space-y-3">
          <Bot className="h-10 w-10 text-zinc-600 mx-auto" />
          <h4 className="text-sm font-semibold text-zinc-300">Nenhuma consulta encontrada</h4>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            {history.length === 0
              ? 'Faça sua primeira pergunta no console do Copilot para que ela fique registrada aqui.'
              : 'Nenhum registro coincide com os filtros selecionados.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-zinc-800/90 bg-zinc-900/70 p-5 space-y-4 hover:border-zinc-700/80 transition-all shadow-sm group"
            >
              {/* Header Info */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-[11px] font-bold font-mono text-indigo-300 flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3" />
                    {item.modelo || 'gpt-4.1-mini'}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-500 uppercase">
                    {item.provedor || 'openai'}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-zinc-400">
                  <span className="flex items-center gap-1 text-zinc-500 font-mono text-[11px]">
                    <Clock className="h-3 w-3" />
                    {formatDate(item.createdAt)}
                  </span>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(item.id, item.resposta)}
                    className="h-7 px-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                    title="Copiar resposta"
                  >
                    {copiedId === item.id ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>

                  {onContinueChat && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onContinueChat(item.pergunta)}
                      className="h-7 px-2.5 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 font-medium"
                    >
                      Continuar no Chat
                    </Button>
                  )}
                </div>
              </div>

              {/* User Question */}
              <div className="flex items-start gap-3">
                <div className="h-7 w-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 text-emerald-400 mt-0.5">
                  <User className="h-4 w-4" />
                </div>
                <div className="space-y-1 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
                    Pergunta
                  </span>
                  <p className="text-xs text-zinc-100 font-medium leading-relaxed">
                    {item.pergunta}
                  </p>
                </div>
              </div>

              {/* AI Answer */}
              <div className="flex items-start gap-3 pt-1">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-glow-sm mt-0.5">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="space-y-1 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 font-mono">
                    Resposta do Copilot
                  </span>
                  <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap font-sans">
                    {item.resposta}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
