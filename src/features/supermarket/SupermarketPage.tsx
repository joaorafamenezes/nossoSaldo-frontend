import * as React from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { AisleCategoryGroup } from './AisleCategoryGroup';
import { AddItemDialog } from './AddItemDialog';
import { QuickBatchAddModal } from './QuickBatchAddModal';
import { EssentialItemsPresets } from './EssentialItemsPresets';
import { ShoppingFocusMode } from './ShoppingFocusMode';
import { ConvertToExpenseModal } from './ConvertToExpenseModal';
import { Button } from '../../components/ui/Button';
import { MoneyDisplay } from '../../components/common/MoneyDisplay';
import { CorredorSupermercado } from '../../types/supermarket';
import { AISLE_CONFIGS } from '../../data/initialMockData';
import {
  ShoppingCart,
  PlusCircle,
  Play,
  CheckCheck,
  ListPlus,
  Search,
} from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { formatCurrency } from '../../lib/utils';
import { toast } from 'sonner';

export function SupermarketPage() {
  const {
    groceryItems,
    isShoppingFocusMode,
    setShoppingFocusMode,
    clearPurchasedGroceries,
  } = useAppStore();

  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isBatchOpen, setIsBatchOpen] = React.useState(false);
  const [isConvertOpen, setIsConvertOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCorredorFilter, setSelectedCorredorFilter] = React.useState<string>('todos');

  const totalEstimado = groceryItems.reduce(
    (sum, item) => sum + item.precoEstimado * item.quantidade,
    0
  );

  const totalNoCarrinho = groceryItems
    .filter((i) => i.noCarrinho)
    .reduce((sum, item) => sum + (item.precoReal || item.precoEstimado) * item.quantidade, 0);

  const itensNoCarrinho = groceryItems.filter((i) => i.noCarrinho).length;

  if (isShoppingFocusMode) {
    return (
      <ShoppingFocusMode
        onFinish={() => {
          setShoppingFocusMode(false);
          setIsConvertOpen(true);
        }}
      />
    );
  }

  const filteredGroceryItems = groceryItems.filter((item) => {
    if (searchQuery && !item.nome.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (selectedCorredorFilter !== 'todos' && item.corredor !== selectedCorredorFilter) {
      return false;
    }
    return true;
  });

  const corridorsList = Object.keys(AISLE_CONFIGS) as CorredorSupermercado[];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-emerald-400" />
            Lista de Supermercado & Feira
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Organizada por corredores para facilitar as compras no celular
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShoppingFocusMode(true)}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
          >
            <Play className="h-3.5 w-3.5 mr-1" />
            <span>Modo "Em Compras"</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsBatchOpen(true)}
            className="text-xs"
          >
            <ListPlus className="h-3.5 w-3.5 mr-1" />
            <span>Colar Lista</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddOpen(true)}
            className="text-xs shadow-glow-emerald"
          >
            <PlusCircle className="h-3.5 w-3.5 mr-1" />
            <span>Adicionar Item</span>
          </Button>
        </div>
      </div>

      {/* 1-Click Essential Items Presets */}
      <EssentialItemsPresets />

      {/* Stats and Action Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <p className="text-xs font-semibold uppercase text-zinc-400">Total Estimado da Lista</p>
          <div className="mt-1">
            <MoneyDisplay value={totalEstimado} type="neutral" size="xl" />
          </div>
          <p className="text-xs text-zinc-400 mt-1">{groceryItems.length} itens cadastrados</p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <p className="text-xs font-semibold uppercase text-zinc-400">Subtotal no Carrinho</p>
          <div className="mt-1">
            <MoneyDisplay value={totalNoCarrinho} type="positive" size="xl" />
          </div>
          <p className="text-xs text-zinc-400 mt-1">{itensNoCarrinho} itens marcados</p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase text-zinc-400">Finalizar Compra</p>
            {itensNoCarrinho > 0 && (
              <button
                onClick={() => {
                  clearPurchasedGroceries();
                  toast.success('Itens marcados foram limpos da lista.');
                }}
                className="text-[10px] text-zinc-500 hover:text-rose-400"
              >
                Limpar comprados
              </button>
            )}
          </div>
          <Button
            variant="primary"
            size="sm"
            disabled={itensNoCarrinho === 0}
            onClick={() => setIsConvertOpen(true)}
            className="mt-2 text-xs shadow-glow-emerald"
          >
            <CheckCheck className="h-3.5 w-3.5 mr-1" />
            <span>Lançar no NossoSaldo ({formatCurrency(totalNoCarrinho)})</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
          <Input
            type="text"
            placeholder="Buscar item na lista..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9.5 h-10 bg-zinc-900/80"
          />
        </div>

        {/* Aisle filter tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setSelectedCorredorFilter('todos')}
            className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
              selectedCorredorFilter === 'todos'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Todos
          </button>
          {corridorsList.map((key) => {
            const count = groceryItems.filter((i) => i.corredor === key).length;
            if (count === 0) return null;
            return (
              <button
                key={key}
                onClick={() => setSelectedCorredorFilter(key)}
                className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                  selectedCorredorFilter === key
                    ? 'bg-zinc-800 text-white border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {AISLE_CONFIGS[key].nome.split('&')[0]} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Corridors Group Grid */}
      {filteredGroceryItems.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-12 text-center">
          <ShoppingCart className="mx-auto h-8 w-8 text-zinc-600 mb-2" />
          <h4 className="text-sm font-semibold text-zinc-300">Nenhum item encontrado</h4>
          <p className="text-xs text-zinc-400 mt-1">
            Adicione itens ou utilize as sugestões essenciais da semana.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {corridorsList.map((corredorKey) => {
            const itemsInCorridor = filteredGroceryItems.filter((i) => i.corredor === corredorKey);
            return (
              <AisleCategoryGroup
                key={corredorKey}
                corredorKey={corredorKey}
                items={itemsInCorridor}
              />
            );
          })}
        </div>
      )}

      {/* Dialogs & Modals */}
      <AddItemDialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
      <QuickBatchAddModal isOpen={isBatchOpen} onClose={() => setIsBatchOpen(false)} />
      <ConvertToExpenseModal isOpen={isConvertOpen} onClose={() => setIsConvertOpen(false)} />
    </div>
  );
}
