import * as React from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { CreditCardVisual } from './CreditCardVisual';
import { InvoiceTimeline } from './InvoiceTimeline';
import { InvoiceDetailsDrawer } from './InvoiceDetailsDrawer';
import { NewCardModal } from './NewCardModal';
import { BestCardAdvisor } from './BestCardAdvisor';
import { LimitSimulatorCard } from './LimitSimulatorCard';
import { FaturaCartao, CartaoCredito } from '../../types/cards';
import { Button } from '../../components/ui/Button';
import { PlusCircle, CreditCard as CardIcon, Edit3, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { toast } from 'sonner';

export function CardsPage() {
  const { cards, invoices, payInvoice, reopenInvoice, deleteCard } = useAppStore();
  const [cardsSortOrder, setCardsSortOrder] = React.useState<'asc' | 'desc'>('asc');
  const [selectedCardId, setSelectedCardId] = React.useState<string>(cards[0]?.id || '');
  const [activeInvoice, setActiveInvoice] = React.useState<FaturaCartao | null>(null);
  const [isNewCardModalOpen, setIsNewCardModalOpen] = React.useState(false);
  const [cardToEdit, setCardToEdit] = React.useState<CartaoCredito | null>(null);

  const sortedCards = React.useMemo(() => {
    return [...cards].sort((a, b) => {
      const dueA = Number(a.diaVencimento) || 0;
      const dueB = Number(b.diaVencimento) || 0;
      return cardsSortOrder === 'asc' ? dueA - dueB : dueB - dueA;
    });
  }, [cards, cardsSortOrder]);

  const selectedCard = cards.find((c) => c.id === selectedCardId) || sortedCards[0];
  const cardInvoices = invoices.filter((inv) => inv.cartaoCreditoId === selectedCard?.id);

  const totalLimites = cards.reduce((sum, c) => sum + (Number(c.valorLimite) || 0), 0);
  const totalDisponivel = cards.reduce((sum, c) => sum + (Number(c.limiteDisponivel) || (Number(c.valorLimite) || 0)), 0);
  const totalFaturasAbertas = cards.reduce((sum, c) => sum + (Number(c.faturaAtual) || 0), 0);

  const handleEditCard = (card: CartaoCredito, e: React.MouseEvent) => {
    e.stopPropagation();
    setCardToEdit(card);
    setIsNewCardModalOpen(true);
  };

  const handleDeleteCard = async (card: CartaoCredito, e: React.MouseEvent) => {
    e.stopPropagation();
    if (cards.length <= 1) {
      toast.error('Você precisa ter pelo menos um cartão cadastrado.');
      return;
    }
    if (confirm(`Deseja realmente remover o cartão "${card.descricao}"?`)) {
      await deleteCard(card.id);
      setSelectedCardId(cards.find((c) => c.id !== card.id)?.id || '');
      toast.success('Cartão removido.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            <CardIcon className="h-6 w-6 text-emerald-400" />
            Cartões de Crédito & Faturas
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Gestão inteligente de limites, melhores datas de compra e histórico de faturas
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setCardToEdit(null);
            setIsNewCardModalOpen(true);
          }}
          className="text-xs shadow-glow-emerald"
        >
          <PlusCircle className="h-3.5 w-3.5 mr-1" />
          <span>Cadastrar Novo Cartão</span>
        </Button>
      </div>

      {/* Intelligent Best Card Advisor */}
      <BestCardAdvisor />

      {/* Global Limit Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <p className="text-xs font-semibold uppercase text-zinc-400">Limite Combinado Total</p>
          <p className="text-xl font-bold font-mono text-zinc-100 mt-1">
            {formatCurrency(totalLimites)}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <p className="text-xs font-semibold uppercase text-zinc-400">Limite Geral Disponível</p>
          <p className="text-xl font-bold font-mono text-emerald-400 mt-1">
            {formatCurrency(totalDisponivel)}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <p className="text-xs font-semibold uppercase text-zinc-400">Faturas Abertas no Mês</p>
          <p className="text-xl font-bold font-mono text-rose-400 mt-1">
            {formatCurrency(totalFaturasAbertas)}
          </p>
        </div>
      </div>

      {/* Cards Visual Selection */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
              Seus Cartões ({sortedCards.length})
            </h3>
            <span className="text-xs text-zinc-500 hidden sm:inline">• Clique para selecionar e ver faturas</span>
          </div>

          <div className="flex items-center gap-1 text-xs">
            <span className="text-zinc-500 mr-1">Vencimento:</span>
            <button
              onClick={() => setCardsSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/80 px-2.5 py-1 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
              title="Alternar ordem de vencimento dos cartões"
            >
              {cardsSortOrder === 'asc' ? (
                <>
                  <ArrowUp className="h-3 w-3 text-emerald-400" />
                  <span>Mais Próximo (Crescente)</span>
                </>
              ) : (
                <>
                  <ArrowDown className="h-3 w-3 text-emerald-400" />
                  <span>Mais Distante (Decrescente)</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sortedCards.map((card) => (
            <div key={card.id} className="relative group">
              <CreditCardVisual
                card={card}
                isSelected={card.id === selectedCard?.id}
                onSelect={() => setSelectedCardId(card.id)}
              />

              {/* Action buttons over card */}
              <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-md rounded-xl p-1 border border-white/10 z-10">
                <button
                  onClick={(e) => handleEditCard(card, e)}
                  className="rounded-lg p-1 text-zinc-300 hover:text-white hover:bg-white/10"
                  title="Editar dados do cartão"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={(e) => handleDeleteCard(card, e)}
                  className="rounded-lg p-1 text-zinc-300 hover:text-rose-400 hover:bg-white/10"
                  title="Remover cartão"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Section: Invoices timeline & Limit Simulator */}
      {selectedCard && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-zinc-800">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <CardIcon className="h-4 w-4 text-emerald-400" />
                Faturas: {selectedCard.descricao}
              </h3>
              <span className="text-xs text-zinc-400">
                Fecha dia <strong>{selectedCard.diaFechamento}</strong> • Vence dia <strong>{selectedCard.diaVencimento}</strong>
              </span>
            </div>

            <InvoiceTimeline
              invoices={cardInvoices}
              onSelectInvoice={(inv) => setActiveInvoice(inv)}
              onPayInvoice={(invId) => payInvoice(invId)}
              onReopenInvoice={(invId) => reopenInvoice(invId)}
            />
          </div>

          <div>
            <LimitSimulatorCard />
          </div>
        </div>
      )}

      {/* Invoice Details Drawer */}
      <InvoiceDetailsDrawer
        invoice={activeInvoice}
        card={selectedCard}
        onClose={() => setActiveInvoice(null)}
      />

      {/* New / Edit Card Modal */}
      <NewCardModal
        isOpen={isNewCardModalOpen}
        onClose={() => {
          setIsNewCardModalOpen(false);
          setCardToEdit(null);
        }}
        cardToEdit={cardToEdit}
      />
    </div>
  );
}
