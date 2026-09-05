import * as React from 'react';
import { FaturaCartao, StatusFaturaCartao } from '../../types/cards';
import { Badge } from '../../components/ui/Badge';
import { MoneyDisplay } from '../../components/common/MoneyDisplay';
import { formatDate, formatCurrency } from '../../lib/utils';
import {
  Calendar,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  AlertCircle,
  X,
  CreditCard,
  RotateCcw,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

interface InvoiceTimelineProps {
  invoices: FaturaCartao[];
  onSelectInvoice: (invoice: FaturaCartao) => void;
  onPayInvoice: (invoiceId: string) => void;
  onReopenInvoice?: (invoiceId: string) => void;
}

export type SortOrder = 'asc' | 'desc';

export function InvoiceTimeline({ invoices, onSelectInvoice, onPayInvoice, onReopenInvoice }: InvoiceTimelineProps) {
  const [statusFilter, setStatusFilter] = React.useState<'todos' | 'aberta' | 'fechada' | 'paga'>('todos');
  const [sortOrder, setSortOrder] = React.useState<SortOrder>('asc'); // Default: Crescente
  const [invoiceToPay, setInvoiceToPay] = React.useState<FaturaCartao | null>(null);
  const [invoiceToReopen, setInvoiceToReopen] = React.useState<FaturaCartao | null>(null);

  const filteredAndSortedInvoices = React.useMemo(() => {
    const filtered = invoices.filter((inv) => {
      if (statusFilter === 'todos') return true;
      return inv.status === statusFilter;
    });

    return [...filtered].sort((a, b) => {
      const dateA = new Date(a.dataVencimento).getTime();
      const dateB = new Date(b.dataVencimento).getTime();

      if (isNaN(dateA) || isNaN(dateB)) return 0;

      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [invoices, statusFilter, sortOrder]);

  const getStatusBadge = (status: StatusFaturaCartao) => {
    switch (status) {
      case 'paga':
        return <Badge variant="success">Fatura Paga</Badge>;
      case 'fechada':
        return <Badge variant="warning">Fatura Fechada</Badge>;
      case 'vencida':
        return <Badge variant="danger">Fatura Vencida</Badge>;
      default:
        return <Badge variant="info">Fatura Aberta</Badge>;
    }
  };

  const handleConfirmPay = () => {
    if (!invoiceToPay) return;

    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.7 },
    });
    onPayInvoice(invoiceToPay.id);
    toast.success(`Fatura de ${invoiceToPay.competencia} (${formatCurrency(invoiceToPay.valorTotal)}) liquidada com sucesso!`);
    setInvoiceToPay(null);
  };

  const handleConfirmReopen = () => {
    if (!invoiceToReopen) return;

    if (onReopenInvoice) {
      onReopenInvoice(invoiceToReopen.id);
    }
    toast.success(`Fatura de ${invoiceToReopen.competencia} reaberta com sucesso! Todos os lançamentos vinculados voltaram para o status Pendente.`);
    setInvoiceToReopen(null);
  };

  return (
    <div className="space-y-4">
      {/* Filter and Sorting Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-zinc-900/40 p-2 rounded-2xl border border-zinc-800/80">
        {/* Status filter tabs */}
        <div className="flex rounded-xl border border-zinc-800 bg-zinc-900/80 p-1">
          {(['todos', 'aberta', 'fechada', 'paga'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-lg px-3 py-1 text-xs font-semibold capitalize transition-colors ${
                statusFilter === st
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {st === 'todos' ? 'Todas as Faturas' : st === 'aberta' ? 'Abertas' : st === 'fechada' ? 'Fechadas' : 'Pagas'}
            </button>
          ))}
        </div>

        {/* Sort Order Selector (Due Date Asc / Desc) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900/80 p-1 text-xs">
            <span className="text-zinc-400 pl-2 pr-1 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-emerald-400" />
              <span>Vencimento:</span>
            </span>

            <button
              onClick={() => setSortOrder('asc')}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                sortOrder === 'asc'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Data mais próxima primeiro (Padrão)"
            >
              <ArrowUp className="h-3 w-3" />
              <span>Mais Próxima (Crescente)</span>
            </button>

            <button
              onClick={() => setSortOrder('desc')}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                sortOrder === 'desc'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Data mais antiga / distante primeiro"
            >
              <ArrowDown className="h-3 w-3" />
              <span>Mais Distante (Decrescente)</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
        <span className="font-mono">
          {filteredAndSortedInvoices.length} {filteredAndSortedInvoices.length === 1 ? 'fatura encontrada' : 'faturas encontradas'}
        </span>
        <span className="text-[11px] text-zinc-400">
          Ordenação ativa: <strong>{sortOrder === 'asc' ? 'Crescente (Vencimento mais próximo primeiro)' : 'Decrescente (Vencimento mais distante primeiro)'}</strong>
        </span>
      </div>

      {/* Invoice list */}
      <div className="space-y-3">
        {filteredAndSortedInvoices.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 text-center text-xs text-zinc-400">
            Nenhuma fatura com os filtros selecionados.
          </div>
        ) : (
          filteredAndSortedInvoices.map((invoice) => {
            const isPaid = invoice.status === 'paga';
            return (
              <div
                key={invoice.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 hover:border-zinc-700 transition-all duration-150"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-300 border border-zinc-700/50">
                    <Calendar className="h-5 w-5 text-emerald-400" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-zinc-100">
                        Competência {invoice.competencia}
                      </span>
                      {getStatusBadge(invoice.status)}
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Fechamento: {formatDate(invoice.dataFechamento)} • Vencimento:{' '}
                      <strong className="text-emerald-300 font-mono">
                        {formatDate(invoice.dataVencimento)}
                      </strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-right">
                    <p className="text-[11px] text-zinc-400">Total da Fatura</p>
                    <MoneyDisplay value={invoice.valorTotal} type="negative" size="lg" />
                  </div>

                  <div className="flex items-center gap-2">
                    {!isPaid ? (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => setInvoiceToPay(invoice)}
                        className="text-xs shadow-glow-emerald"
                      >
                        Pagar Fatura
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setInvoiceToReopen(invoice)}
                        className="text-xs text-amber-400 border-amber-500/30 hover:bg-amber-500/10 hover:border-amber-500/50"
                        title="Reabrir fatura e reverter lançamentos para pendente"
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-1" />
                        <span>Reabrir</span>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onSelectInvoice(invoice)}
                      className="text-xs"
                    >
                      <span>Ver Extrato</span>
                      <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Confirmation Payment Modal */}
      {invoiceToPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-md rounded-3xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-100">
                    Confirmar Pagamento de Fatura
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Competência {invoiceToPay.competencia}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setInvoiceToPay(null)}
                className="rounded-lg p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Vencimento:</span>
                  <strong className="text-emerald-300 font-mono">
                    {formatDate(invoiceToPay.dataVencimento)}
                  </strong>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-800/80">
                  <span className="text-zinc-400">Valor Total a Liquidar:</span>
                  <strong className="text-rose-400 font-mono text-base font-bold">
                    {formatCurrency(invoiceToPay.valorTotal)}
                  </strong>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-950/20 p-3 text-xs text-amber-200/90 leading-relaxed">
                <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Deseja realmente confirmar a liquidação desta fatura? O status passará para <strong>PAGA</strong> e o limite do cartão será liberado.
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setInvoiceToPay(null)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="primary"
                className="flex-1 shadow-glow-emerald font-bold"
                onClick={handleConfirmPay}
              >
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                <span>Sim, Pagar Fatura</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Reopen Modal */}
      {invoiceToReopen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-md rounded-3xl border border-amber-500/30 bg-zinc-900 p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-100">
                    Reabrir Fatura de Cartão
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Competência {invoiceToReopen.competencia}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setInvoiceToReopen(null)}
                className="rounded-lg p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Valor da Fatura:</span>
                  <strong className="text-zinc-100 font-mono text-sm font-bold">
                    {formatCurrency(invoiceToReopen.valorTotal)}
                  </strong>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-800/80">
                  <span className="text-zinc-400">Status Atual:</span>
                  <span className="capitalize font-semibold text-emerald-400">
                    {invoiceToReopen.status}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-950/30 p-3.5 text-xs text-amber-200 leading-relaxed">
                <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Ao reabrir esta fatura, o status voltará para <strong>ABERTA</strong> e todos os lançamentos vinculados (gastos e parcelas filhotes) serão revertidos para o status <strong>PENDENTE</strong>.
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setInvoiceToReopen(null)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="primary"
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold border-amber-400"
                onClick={handleConfirmReopen}
              >
                <RotateCcw className="h-4 w-4 mr-1.5" />
                <span>Sim, Reabrir Fatura</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
