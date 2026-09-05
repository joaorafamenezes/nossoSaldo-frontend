import * as React from 'react';
import { SupermarketItem, CorredorSupermercado } from '../../types/supermarket';
import { AISLE_CONFIGS } from '../../data/initialMockData';
import { useAppStore } from '../../stores/useAppStore';
import { MoneyDisplay } from '../../components/common/MoneyDisplay';
import { CheckCircle2, Circle, Trash2, Edit3, Plus, Minus } from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { toast } from 'sonner';

interface AisleCategoryGroupProps {
  corredorKey: CorredorSupermercado;
  items: SupermarketItem[];
}

export function AisleCategoryGroup({ corredorKey, items }: AisleCategoryGroupProps) {
  const { toggleGroceryItemCart, deleteGroceryItem, updateGroceryItem } = useAppStore();
  const config = AISLE_CONFIGS[corredorKey] || AISLE_CONFIGS.outros;

  const [editingItemId, setEditingItemId] = React.useState<string | null>(null);
  const [editingPrice, setEditingPrice] = React.useState<string>('');

  if (items.length === 0) return null;

  const handleStartEditPrice = (item: SupermarketItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingItemId(item.id);
    setEditingPrice((item.precoReal || item.precoEstimado).toString());
  };

  const handleSavePrice = (itemId: string, e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const num = parseFloat(editingPrice.replace(',', '.')) || 0;
    updateGroceryItem(itemId, { precoReal: num });
    toast.success('Preço atualizado!');
    setEditingItemId(null);
  };

  const handleAdjustQuantity = (item: SupermarketItem, delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newQtd = Math.max(0.5, item.quantidade + delta);
    updateGroceryItem(item.id, { quantidade: parseFloat(newQtd.toFixed(1)) });
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
      {/* Category header */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <span className={cn('rounded-lg px-2.5 py-0.5 text-xs font-bold border', config.cor)}>
            {config.nome}
          </span>
          <span className="text-xs text-zinc-400 font-mono">({items.length})</span>
        </div>

        <span className="text-xs font-mono text-zinc-400">
          Subtotal:{' '}
          <strong className="text-zinc-200">
            {formatCurrency(
              items.reduce(
                (s, i) => s + (i.precoReal || i.precoEstimado) * i.quantidade,
                0
              )
            )}
          </strong>
        </span>
      </div>

      {/* Item list */}
      <div className="space-y-2">
        {items.map((item) => {
          const inCart = item.noCarrinho;
          const finalPrice = (item.precoReal || item.precoEstimado) * item.quantidade;

          return (
            <div
              key={item.id}
              className={cn(
                'flex items-center justify-between rounded-xl border p-3 transition-all duration-150',
                inCart
                  ? 'border-emerald-500/30 bg-emerald-950/15 text-zinc-400'
                  : 'border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700 text-zinc-100'
              )}
            >
              {/* Left: Check & Name */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <button
                  onClick={() => toggleGroceryItemCart(item.id)}
                  className="text-zinc-400 hover:text-emerald-400 transition-colors shrink-0"
                  title={inCart ? 'Tirar do carrinho' : 'Colocar no carrinho'}
                >
                  {inCart ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 fill-emerald-500/20" />
                  ) : (
                    <Circle className="h-5 w-5 text-zinc-600 hover:text-emerald-400" />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p
                      className={cn(
                        'text-sm font-semibold truncate',
                        inCart && 'line-through text-zinc-400'
                      )}
                    >
                      {item.nome}
                    </p>
                    {item.adicionadoPor && (
                      <span className="text-[10px] text-zinc-400 bg-zinc-800/80 border border-zinc-700/60 px-1.5 py-0.2 rounded-md font-mono">
                        {item.adicionadoPor}
                      </span>
                    )}
                  </div>

                  {/* Quantity Stepper & Price info */}
                  <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400">
                    <div className="flex items-center gap-1 bg-zinc-950 rounded-lg border border-zinc-800 p-0.5">
                      <button
                        onClick={(e) => handleAdjustQuantity(item, -1, e)}
                        className="rounded p-0.5 hover:bg-zinc-800 hover:text-white"
                        title="Diminuir"
                      >
                        <Minus className="h-2.5 w-2.5" />
                      </button>
                      <span className="font-mono text-[11px] font-semibold px-1 text-zinc-200">
                        {item.quantidade} {item.unidade}
                      </span>
                      <button
                        onClick={(e) => handleAdjustQuantity(item, 1, e)}
                        className="rounded p-0.5 hover:bg-zinc-800 hover:text-white"
                        title="Aumentar"
                      >
                        <Plus className="h-2.5 w-2.5" />
                      </button>
                    </div>

                    {editingItemId === item.id ? (
                      <form onSubmit={(e) => handleSavePrice(item.id, e)} className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.01"
                          value={editingPrice}
                          onChange={(e) => setEditingPrice(e.target.value)}
                          autoFocus
                          className="h-6 w-16 rounded border border-emerald-500 bg-zinc-950 px-1.5 text-xs font-mono text-emerald-400 outline-none"
                        />
                        <button type="submit" className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] text-zinc-950 font-bold">
                          OK
                        </button>
                      </form>
                    ) : (
                      <span
                        onClick={(e) => handleStartEditPrice(item, e)}
                        className="cursor-pointer hover:text-emerald-400 transition-colors flex items-center gap-1"
                        title="Clique para ajustar o preço real"
                      >
                        Est: <span className="font-mono">R$ {item.precoEstimado.toFixed(2)}</span>
                        {item.precoReal && (
                          <span className="text-emerald-400 font-mono font-bold">
                            (Real: R$ {item.precoReal.toFixed(2)})
                          </span>
                        )}
                        <Edit3 className="h-2.5 w-2.5 text-zinc-500" />
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Subtotal & Delete */}
              <div className="flex items-center gap-3 shrink-0 ml-2">
                <MoneyDisplay
                  value={finalPrice}
                  type={inCart ? 'positive' : 'neutral'}
                  size="sm"
                />

                <button
                  onClick={() => deleteGroceryItem(item.id)}
                  className="rounded-lg p-1 text-zinc-400 hover:bg-rose-950/30 hover:text-rose-400 transition-colors"
                  title="Remover item"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
