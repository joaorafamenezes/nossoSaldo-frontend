import * as React from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { Button } from '../../components/ui/Button';
import { MoneyDisplay } from '../../components/common/MoneyDisplay';
import { ShoppingCart, Check, X, CreditCard, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface ConvertToExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConvertToExpenseModal({ isOpen, onClose }: ConvertToExpenseModalProps) {
  const { groceryItems, convertGroceryListToExpense, cards } = useAppStore();
  const [selectedCardId, setSelectedCardId] = React.useState<string>(cards[0]?.id || '');

  if (!isOpen) return null;

  const purchasedItems = groceryItems.filter((i) => i.noCarrinho);
  const totalValue = purchasedItems.reduce(
    (sum, item) => sum + (item.precoReal || item.precoEstimado) * item.quantidade,
    0
  );

  const handleConfirm = async () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
    await convertGroceryListToExpense(selectedCardId || undefined);
    toast.success(`Compra de supermercado (R$ ${totalValue.toFixed(2)}) lançada como despesa com sucesso!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div
        className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-emerald-400" />
              Lançar Compras no Extrato
            </h3>
            <p className="text-xs text-zinc-400">
              Transforme os itens do carrinho em uma despesa financeira real
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-zinc-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Summary Card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-center space-y-1">
          <p className="text-xs text-zinc-400 uppercase font-semibold">Total dos Itens Comprados</p>
          <MoneyDisplay value={totalValue} type="negative" size="2xl" />
          <p className="text-xs text-zinc-500 font-mono mt-1">
            {purchasedItems.length} itens marcados no carrinho
          </p>
        </div>

        {/* Payment Method Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-300 block">
            Forma de Pagamento Utilizada
          </label>
          <div className="space-y-2">
            <div
              onClick={() => setSelectedCardId('')}
              className={`cursor-pointer rounded-xl border p-3 flex items-center justify-between transition-colors ${
                selectedCardId === ''
                  ? 'border-emerald-500 bg-emerald-950/20 text-white'
                  : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300">
                  <ShoppingCart className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-200">Débito / PIX / Conta Corrente</p>
                  <p className="text-[10px] text-zinc-500">Deduzido imediatamente do saldo</p>
                </div>
              </div>
              {selectedCardId === '' && <Check className="h-4 w-4 text-emerald-400" />}
            </div>

            {cards.map((card) => (
              <div
                key={card.id}
                onClick={() => setSelectedCardId(card.id)}
                className={`cursor-pointer rounded-xl border p-3 flex items-center justify-between transition-colors ${
                  selectedCardId === card.id
                    ? 'border-emerald-500 bg-emerald-950/20 text-white'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300">
                    <CreditCard className="h-4 w-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-200">{card.descricao}</p>
                    <p className="text-[10px] text-zinc-500 font-mono">
                      Fatura fecha dia {card.diaFechamento}
                    </p>
                  </div>
                </div>
                {selectedCardId === card.id && <Check className="h-4 w-4 text-emerald-400" />}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            className="flex-1 shadow-glow-emerald"
            onClick={handleConfirm}
          >
            Confirmar e Registrar
          </Button>
        </div>
      </div>
    </div>
  );
}
