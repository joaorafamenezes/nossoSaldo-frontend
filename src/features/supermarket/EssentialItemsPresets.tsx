import * as React from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { CorredorSupermercado } from '../../types/supermarket';
import { Plus, Sparkles, Check } from 'lucide-react';
import { toast } from 'sonner';

interface PresetItem {
  nome: string;
  quantidade: number;
  unidade: 'un' | 'kg' | 'g' | 'l' | 'pct' | 'cx';
  corredor: CorredorSupermercado;
  precoEstimado: number;
}

const ESSENTIALS: PresetItem[] = [
  { nome: 'Ovos Caipiras (Cartela)', quantidade: 1, unidade: 'cx', corredor: 'laticinios', precoEstimado: 26.0 },
  { nome: 'Leite Integral / Desnatado', quantidade: 2, unidade: 'l', corredor: 'laticinios', precoEstimado: 12.0 },
  { nome: 'Café Especial 500g', quantidade: 1, unidade: 'pct', corredor: 'padaria_matinais', precoEstimado: 32.0 },
  { nome: 'Pão de Fermentação Natural', quantidade: 1, unidade: 'un', corredor: 'padaria_matinais', precoEstimado: 18.0 },
  { nome: 'Banana Prata', quantidade: 1.2, unidade: 'kg', corredor: 'hortifruti', precoEstimado: 11.5 },
  { nome: 'Azeite de Oliva Extra Virgem', quantidade: 1, unidade: 'un', corredor: 'mercearia_graos', precoEstimado: 45.0 },
  { nome: 'Detergente & Sabão Líquido', quantidade: 2, unidade: 'un', corredor: 'limpeza', precoEstimado: 28.0 },
];

export function EssentialItemsPresets() {
  const { addGroceryItem, groceryItems } = useAppStore();
  const { user } = useAuthStore();

  const handleAddPreset = (preset: PresetItem) => {
    const exists = groceryItems.some(
      (i) => i.nome.toLowerCase() === preset.nome.toLowerCase()
    );

    if (exists) {
      toast.info(`"${preset.nome}" já está na lista de compras.`);
      return;
    }

    addGroceryItem({
      ...preset,
      noCarrinho: false,
      adicionadoPor: user?.nome ? user.nome.split(' ')[0] : 'Eu',
    });
    toast.success(`"${preset.nome}" adicionado à lista!`);
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          Sugestões de Itens Essenciais da Semana (1-Clique)
        </span>
        <span className="text-[10px] text-zinc-500 font-mono">Toque para adicionar</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {ESSENTIALS.map((item, idx) => {
          const isAdded = groceryItems.some(
            (i) => i.nome.toLowerCase() === item.nome.toLowerCase()
          );

          return (
            <button
              key={idx}
              onClick={() => handleAddPreset(item)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all select-none ${
                isAdded
                  ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-400'
                  : 'border-zinc-800 bg-zinc-950/80 text-zinc-300 hover:border-zinc-700 hover:text-white'
              }`}
            >
              {isAdded ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Plus className="h-3.5 w-3.5 text-zinc-500" />
              )}
              <span>{item.nome}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
