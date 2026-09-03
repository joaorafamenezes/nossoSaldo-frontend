import * as React from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { MoneyDisplay } from '../../components/common/MoneyDisplay';
import { Button } from '../../components/ui/Button';
import { CheckCircle2, Circle, X, ShoppingBag, ArrowRight, Edit3 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AISLE_CONFIGS } from '../../data/initialMockData';
import { CorredorSupermercado, SupermarketItem } from '../../types/supermarket';
import { formatCurrency } from '../../lib/utils';
import { toast } from 'sonner';

interface ShoppingFocusModeProps {
  onFinish: () => void;
}

export function ShoppingFocusMode({ onFinish }: ShoppingFocusModeProps) {
  const { groceryItems, toggleGroceryItemCart, updateGroceryItem, setShoppingFocusMode } = useAppStore();
  const [selectedCorredor, setSelectedCorredor] = React.useState<string>('todos');
  const [editingItem, setEditingItem] = React.useState<SupermarketItem | null>(null);
  const [priceInput, setPriceInput] = React.useState<string>('');

  const totalCarrinho = groceryItems
    .filter((i) => i.noCarrinho)
    .reduce((sum, item) => sum + (item.precoReal || item.precoEstimado) * item.quantidade, 0);

  const totalItens = groceryItems.length;
  const itensNoCarrinho = groceryItems.filter((i) => i.noCarrinho).length;
  const percentComplete = totalItens > 0 ? Math.round((itensNoCarrinho / totalItens) * 100) : 0;

  const handleFinishShopping = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
    onFinish();
  };

  const handleOpenPriceModal = (item: SupermarketItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingItem(item);
    setPriceInput((item.precoReal || item.precoEstimado).toString());
  };

  const handleSavePrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    const num = parseFloat(priceInput.replace(',', '.')) || 0;
    updateGroceryItem(editingItem.id, { precoReal: num });
    toast.success('Preço atualizado!');
    setEditingItem(null);
  };

  const filteredItems = groceryItems.filter((item) => {
    if (selectedCorredor === 'todos') return true;
    return item.corredor === selectedCorredor;
  });

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col justify-between text-zinc-100 animate-in fade-in">
      {/* Top sticky bar */}
      <div className="border-b border-zinc-800 bg-zinc-900/90 backdrop-blur-md px-4 py-3.5 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
            Modo Foco • Em Compras no Supermercado
          </span>
          <h3 className="text-base font-bold text-zinc-100 flex items-center gap-1.5 mt-0.5">
            <ShoppingBag className="h-4 w-4 text-emerald-400" />
            {itensNoCarrinho} de {totalItens} itens no carrinho ({percentComplete}%)
          </h3>
        </div>

        <button
          onClick={() => setShoppingFocusMode(false)}
          className="rounded-xl p-2 bg-zinc-800 text-zinc-400 hover:text-white"
          title="Sair do modo foco"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-zinc-800">
        <div
          className="h-full bg-emerald-500 transition-all duration-300 shadow-glow-emerald"
          style={{ width: `${percentComplete}%` }}
        />
      </div>

      {/* Corridors horizontal scroll filter */}
      <div className="border-b border-zinc-800/80 bg-zinc-950 px-4 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setSelectedCorredor('todos')}
          className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
            selectedCorredor === 'todos'
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Todos os Corredores
        </button>
        {Object.entries(AISLE_CONFIGS).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setSelectedCorredor(key)}
            className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
              selectedCorredor === key
                ? 'bg-zinc-800 text-white border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {config.nome.split('&')[0]}
          </button>
        ))}
      </div>

      {/* Large Touch Target Item List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredItems.map((item) => {
          const inCart = item.noCarrinho;
          const config = AISLE_CONFIGS[item.corredor as CorredorSupermercado] || AISLE_CONFIGS.outros;
          const subtotal = (item.precoReal || item.precoEstimado) * item.quantidade;

          return (
            <div
              key={item.id}
              onClick={() => toggleGroceryItemCart(item.id)}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer select-none active:scale-[0.98] ${
                inCart
                  ? 'border-emerald-500/40 bg-emerald-950/20 text-zinc-500'
                  : 'border-zinc-800 bg-zinc-900/80 text-zinc-100 hover:border-zinc-700 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                {inCart ? (
                  <CheckCircle2 className="h-7 w-7 text-emerald-400 fill-emerald-500/20 shrink-0" />
                ) : (
                  <Circle className="h-7 w-7 text-zinc-600 shrink-0" />
                )}

                <div className="min-w-0 flex-1">
                  <p
                    className={`text-base font-semibold truncate ${
                      inCart ? 'line-through text-zinc-500' : 'text-zinc-100'
                    }`}
                  >
                    {item.nome}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                    <span>
                      {item.quantidade} {item.unidade}
                    </span>
                    <span>•</span>
                    <span className="truncate">{config.nome.split('&')[0]}</span>
                    {item.precoReal && (
                      <span className="text-emerald-400 font-mono font-bold">
                        (R$ {item.precoReal.toFixed(2)})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Price & quick edit */}
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <button
                  onClick={(e) => handleOpenPriceModal(item, e)}
                  className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  title="Ajustar preço real"
                >
                  <Edit3 className="h-4 w-4" />
                </button>

                <div className="text-right">
                  <span className={`font-mono text-base font-bold ${inCart ? 'text-emerald-400' : 'text-zinc-200'}`}>
                    {formatCurrency(subtotal)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Sticky Total & Finish Button */}
      <div className="border-t border-zinc-800 bg-zinc-900/95 backdrop-blur-md p-4 pb-safe flex items-center justify-between gap-4 shadow-2xl">
        <div>
          <span className="text-[10px] uppercase font-semibold text-zinc-400">Total no Carrinho</span>
          <p className="text-2xl font-bold font-mono text-emerald-400">
            {formatCurrency(totalCarrinho)}
          </p>
        </div>

        <Button
          variant="primary"
          size="lg"
          onClick={handleFinishShopping}
          disabled={itensNoCarrinho === 0}
          className="shadow-glow-emerald px-6"
        >
          <span>Concluir Compra</span>
          <ArrowRight className="h-4 w-4 ml-1.5" />
        </Button>
      </div>

      {/* Quick Price Edit Modal in Focus Mode */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-700 bg-zinc-900 p-5 space-y-4">
            <h4 className="text-sm font-bold text-zinc-100">
              Ajustar Preço Real: {editingItem.nome}
            </h4>
            <form onSubmit={handleSavePrice} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Preço por {editingItem.unidade} (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  autoFocus
                  className="h-10 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 font-mono text-lg font-bold text-emerald-400 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setEditingItem(null)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" className="flex-1">
                  Salvar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
