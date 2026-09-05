import * as React from 'react';
import { FaturaCartao, CartaoCredito } from '../../types/cards';
import { useAppStore } from '../../stores/useAppStore';
import { MoneyDisplay } from '../../components/common/MoneyDisplay';
import { formatDate } from '../../lib/utils';
import * as api from '../../services/api';
import {
  X,
  CheckCircle2,
  CreditCard,
  ArrowUpDown,
  Search,
  Calendar,
  AlertTriangle,
  Layers,
  Sparkles,
  User,
  Filter,
  RefreshCw,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

interface ExtratoItem {
  id: string;
  gastoId: string;
  descricao: string;
  valor: number;
  dataVencimento: string;
  status: string;
  origemLancamento: string;
  parcelaAtual: number | null;
  numeroParcelas: number | null;
  categoriaId: string;
  categoriaNome: string;
  categoriaIcone: string;
  categoriaCor: string;
  responsavelId?: string;
  responsavelNome?: string;
  observacao?: string | null;
}

interface InvoiceDetailsDrawerProps {
  invoice: FaturaCartao | null;
  card: CartaoCredito | null;
  onClose: () => void;
}

export function InvoiceDetailsDrawer({ invoice, card, onClose }: InvoiceDetailsDrawerProps) {
  const { expenses, payInvoice, reopenInvoice, categories } = useAppStore();
  const [extratoItems, setExtratoItems] = React.useState<ExtratoItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [sortBy, setSortBy] = React.useState<'date_asc' | 'date_desc' | 'val_desc' | 'val_asc'>('date_asc');
  const [isConfirming, setIsConfirming] = React.useState(false);
  const [isReopeningConfirming, setIsReopeningConfirming] = React.useState(false);

  // Fetch extrato from API
  const loadExtrato = React.useCallback(async () => {
    if (!invoice) return;
    setIsLoading(true);
    const token = localStorage.getItem('@NossoSaldo:token');

    if (token) {
      try {
        const data = await api.getInvoiceExtrato(token, invoice.id);
        if (data && Array.isArray(data.itens)) {
          setExtratoItems(data.itens);
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Falha ao buscar extrato via API, usando fallback local:', err);
      }
    }

    // Fallback: Use in-memory expenses
    if (card) {
      const localMatches = expenses.filter(
        (e) => e.faturaCartaoId === invoice.id || e.cartaoCreditoId === card.id
      );
      const mapped: ExtratoItem[] = localMatches.map((exp) => {
        const cat = categories.find((c) => c.id === exp.categoriaId);
        return {
          id: exp.id,
          gastoId: exp.id,
          descricao: exp.descricao,
          valor: exp.valor,
          dataVencimento: exp.dataVencimento,
          status: exp.status,
          origemLancamento: exp.origemLancamento,
          parcelaAtual: exp.parcelaAtual || null,
          numeroParcelas: exp.numeroParcelas || null,
          categoriaId: exp.categoriaId,
          categoriaNome: cat?.descricao || 'Geral',
          categoriaIcone: cat?.iconName || '🏷️',
          categoriaCor: cat?.cor || '#10b981',
          responsavelId: exp.responsavelId,
          responsavelNome: exp.responsavelNome || 'Usuário',
          observacao: exp.observacao,
        };
      });
      setExtratoItems(mapped);
    }
    setIsLoading(false);
  }, [invoice, card, expenses, categories]);

  React.useEffect(() => {
    loadExtrato();
  }, [loadExtrato]);

  // Detect potential duplicate charges / irregularities
  const duplicateAlerts = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of extratoItems) {
      const key = `${item.descricao.toLowerCase().trim()}_${item.valor}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return extratoItems.filter(
      (item) => (counts.get(`${item.descricao.toLowerCase().trim()}_${item.valor}`) || 0) > 1
    );
  }, [extratoItems]);

  // Unique categories in this invoice
  const invoiceCategories = React.useMemo(() => {
    const catsMap = new Map<string, { id: string; nome: string; icone: string; cor: string; count: number; total: number }>();
    for (const item of extratoItems) {
      const existing = catsMap.get(item.categoriaId) || {
        id: item.categoriaId,
        nome: item.categoriaNome,
        icone: item.categoriaIcone,
        cor: item.categoriaCor,
        count: 0,
        total: 0,
      };
      existing.count += 1;
      existing.total += item.valor;
      catsMap.set(item.categoriaId, existing);
    }
    return Array.from(catsMap.values());
  }, [extratoItems]);

  // Filter and sort items
  const filteredItems = React.useMemo(() => {
    let result = [...extratoItems];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.descricao.toLowerCase().includes(q) ||
          item.categoriaNome.toLowerCase().includes(q) ||
          item.valor.toString().includes(q)
      );
    }

    if (selectedCategory !== 'all') {
      result = result.filter((item) => item.categoriaId === selectedCategory);
    }

    result.sort((a, b) => {
      const dateA = new Date(a.dataVencimento).getTime() || 0;
      const dateB = new Date(b.dataVencimento).getTime() || 0;
      if (sortBy === 'date_asc') return dateA - dateB;
      if (sortBy === 'date_desc') return dateB - dateA;
      if (sortBy === 'val_desc') return b.valor - a.valor;
      if (sortBy === 'val_asc') return a.valor - b.valor;
      return 0;
    });

    return result;
  }, [extratoItems, searchQuery, selectedCategory, sortBy]);

  const itemsTotalSum = filteredItems.reduce((acc, curr) => acc + curr.valor, 0);

  const handlePay = async () => {
    if (!invoice) return;
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
    await payInvoice(invoice.id);
    toast.success(`Fatura de R$ ${invoice.valorTotal.toFixed(2)} liquidada com sucesso!`);
    setIsConfirming(false);
    onClose();
  };

  const handleReopen = async () => {
    if (!invoice) return;
    try {
      await reopenInvoice(invoice.id);
      toast.success(`Fatura de ${invoice.competencia} reaberta com sucesso! Todos os lançamentos vinculados voltaram para o status Pendente.`);
      setIsReopeningConfirming(false);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao reabrir fatura na API.');
    }
  };

  if (!invoice || !card) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-zinc-900 border-l border-zinc-800 h-full overflow-y-auto flex flex-col justify-between shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-zinc-800 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <CreditCard className="h-4 w-4" />
                </span>
                <h3 className="text-lg font-bold text-zinc-100">{card.descricao}</h3>
                {card.ultimosDigitos && (
                  <span className="text-[11px] font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-md border border-zinc-700">
                    •••• {card.ultimosDigitos}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                Competência: <strong className="text-zinc-200">{invoice.competencia}</strong> • Fechamento:{' '}
                {formatDate(invoice.dataFechamento)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Invoice KPI Card */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 relative overflow-hidden shadow-inner">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Total Consolidado da Fatura
                </span>
                <div className="mt-1">
                  <MoneyDisplay value={invoice.valorTotal} type="negative" size="2xl" />
                </div>
              </div>
              <div className="text-right space-y-1">
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase px-2.5 py-1 rounded-full border ${
                    invoice.status === 'paga'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : invoice.status === 'fechada'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                  {invoice.status === 'paga' ? 'Fatura Paga' : invoice.status === 'fechada' ? 'Fechada' : 'Aberta'}
                </span>
                <p className="text-xs text-zinc-400">
                  Vence em: <strong className="text-zinc-200 font-mono">{formatDate(invoice.dataVencimento)}</strong>
                </p>
              </div>
            </div>

            {/* Category Breakdown Bar */}
            {invoiceCategories.length > 0 && (
              <div className="mt-4 pt-3 border-t border-zinc-800/80 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span>Distribuição por Categoria</span>
                  <span>{extratoItems.length} compras</span>
                </div>
                <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden flex">
                  {invoiceCategories.map((cat) => {
                    const pct = invoice.valorTotal > 0 ? (cat.total / invoice.valorTotal) * 100 : 0;
                    return (
                      <div
                        key={cat.id}
                        style={{ width: `${pct}%`, backgroundColor: cat.cor }}
                        title={`${cat.nome}: R$ ${cat.total.toFixed(2)} (${pct.toFixed(0)}%)`}
                        className="h-full transition-all duration-300 first:rounded-l-full last:rounded-r-full"
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Suspicious duplicates / irregularidade alert */}
          {duplicateAlerts.length > 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3.5 flex items-start gap-3 animate-in fade-in">
              <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-amber-300">
                  Possível duplicidade identificada ({duplicateAlerts.length} itens)
                </p>
                <p className="text-[11px] text-amber-200/80 leading-relaxed">
                  Identificamos lançamentos com mesmo valor e descrição nesta fatura. Confira a lista abaixo para verificar se houve cobrança duplicada.
                </p>
              </div>
            </div>
          )}

          {/* Search, Filter & Sort Controls */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Buscar lançamento por nome ou valor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 outline-none focus:border-purple-500/60 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Sort selector */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="rounded-xl border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-300 outline-none focus:border-zinc-700 cursor-pointer"
              >
                <option value="date_asc">Vencimento (Cresc.)</option>
                <option value="date_desc">Vencimento (Decresc.)</option>
                <option value="val_desc">Maior Valor</option>
                <option value="val_asc">Menor Valor</option>
              </select>

              <button
                onClick={loadExtrato}
                className="rounded-xl border border-zinc-800 bg-zinc-950 p-2 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
                title="Recarregar Extrato"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-purple-400' : ''}`} />
              </button>
            </div>

            {/* Category Filter Chips */}
            {invoiceCategories.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap border transition-all ${
                    selectedCategory === 'all'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  Todas ({extratoItems.length})
                </button>
                {invoiceCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap border transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <span>{cat.icone}</span>
                    <span>{cat.nome}</span>
                    <span className="text-[10px] opacity-70">({cat.count})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Extrato Items List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-400">
              <span>Lançamentos Analisados ({filteredItems.length})</span>
              {filteredItems.length !== extratoItems.length && (
                <span className="text-[11px] text-zinc-400 normal-case">
                  Soma dos filtrados: <strong className="text-zinc-200">R$ {itemsTotalSum.toFixed(2)}</strong>
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <Loader2 className="h-7 w-7 text-purple-400 animate-spin" />
                <p className="text-xs text-zinc-400 font-medium">Buscando extrato da fatura...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-800 p-8 text-center space-y-2">
                <CreditCard className="h-8 w-8 text-zinc-600 mx-auto" />
                <p className="text-sm font-semibold text-zinc-300">Nenhum lançamento encontrado</p>
                <p className="text-xs text-zinc-500">
                  {searchQuery || selectedCategory !== 'all'
                    ? 'Tente ajustar os filtros de busca para encontrar o lançamento.'
                    : 'Nenhum gasto ou parcela vinculada a esta fatura no momento.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredItems.map((item, idx) => {
                  const isDuplicate = duplicateAlerts.some((d) => d.id === item.id);

                  return (
                    <div
                      key={item.id || idx}
                      className={`group flex items-center justify-between rounded-xl border p-3.5 transition-all ${
                        isDuplicate
                          ? 'border-amber-500/40 bg-amber-950/10 hover:border-amber-500/60'
                          : 'border-zinc-800 bg-zinc-950/70 hover:border-zinc-700 hover:bg-zinc-950'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
                        {/* Category icon avatar */}
                        <div
                          style={{
                            backgroundColor: `${item.categoriaCor}20`,
                            borderColor: `${item.categoriaCor}40`,
                          }}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border text-base shrink-0 shadow-sm"
                        >
                          {item.categoriaIcone || '🏷️'}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs font-bold text-zinc-100 truncate">{item.descricao}</p>

                            {/* Installment Badge */}
                            {item.numeroParcelas && item.numeroParcelas > 1 && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded">
                                <Layers className="h-2.5 w-2.5" />
                                {item.parcelaAtual || 1}/{item.numeroParcelas}
                              </span>
                            )}

                            {/* Duplicate Tag */}
                            {isDuplicate && (
                              <span className="text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <AlertTriangle className="h-2.5 w-2.5" />
                                Duplicidade?
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-400 flex-wrap">
                            <span
                              style={{ color: item.categoriaCor }}
                              className="font-medium"
                            >
                              {item.categoriaNome}
                            </span>
                            <span>•</span>
                            <span className="font-mono text-zinc-400 flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-zinc-500" />
                              {formatDate(item.dataVencimento)}
                            </span>
                            {item.responsavelNome && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-zinc-400">
                                  <User className="h-3 w-3 text-zinc-500" />
                                  {item.responsavelNome.split(' ')[0]}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Money & Status */}
                      <div className="text-right shrink-0 space-y-0.5">
                        <MoneyDisplay value={item.valor} type="negative" size="sm" />
                        <span
                          className={`block text-[10px] font-semibold uppercase ${
                            item.status === 'pago' ? 'text-emerald-400' : 'text-zinc-500'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Action Footer */}
        <div className="pt-5 border-t border-zinc-800 mt-6 space-y-3">
          {invoice.status !== 'paga' ? (
            isConfirming ? (
              <div className="space-y-3 rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 animate-in fade-in">
                <p className="text-xs text-amber-200 leading-relaxed font-medium">
                  Deseja realmente confirmar o pagamento de{' '}
                  <strong className="text-white">R$ {invoice.valorTotal.toFixed(2)}</strong> da fatura de{' '}
                  <strong>{invoice.competencia}</strong>?
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => setIsConfirming(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    className="flex-1 text-xs shadow-glow-emerald font-bold"
                    onClick={handlePay}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    <span>Confirmar Pagamento</span>
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="primary"
                className="w-full shadow-glow-emerald"
                onClick={() => setIsConfirming(true)}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                <span>Liquidar Fatura (R$ {invoice.valorTotal.toFixed(2)})</span>
              </Button>
            )
          ) : (
            isReopeningConfirming ? (
              <div className="space-y-3 rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 animate-in fade-in">
                <p className="text-xs text-amber-200 leading-relaxed font-medium">
                  Deseja realmente reabrir a fatura de <strong>{invoice.competencia}</strong>? A fatura e todos os seus lançamentos vinculados voltarão para o status <strong>PENDENTE</strong>.
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => setIsReopeningConfirming(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    className="flex-1 text-xs bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold border-amber-400"
                    onClick={handleReopen}
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1" />
                    <span>Confirmar Reabertura</span>
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full text-amber-400 border-amber-500/30 hover:bg-amber-500/10 hover:border-amber-500/50"
                onClick={() => setIsReopeningConfirming(true)}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                <span>Reabrir Fatura Liquidada</span>
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
