import * as React from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { CorredorSupermercado, SupermarketItem } from '../../types/supermarket';
import { Button } from '../../components/ui/Button';
import { X, Sparkles, ListPlus } from 'lucide-react';
import { toast } from 'sonner';

interface QuickBatchAddModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickBatchAddModal({ isOpen, onClose }: QuickBatchAddModalProps) {
  const { addMultipleGroceryItems } = useAppStore();
  const { user } = useAuthStore();
  const [textList, setTextList] = React.useState('');

  if (!isOpen) return null;

  const handleBatchAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = textList
      .split(/[\n,]+/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      toast.error('Digite pelo menos um item para adicionar');
      return;
    }

    const itemsToAdd: Omit<SupermarketItem, 'id'>[] = lines.map((name) => {
      const lower = name.toLowerCase();
      let corredor: CorredorSupermercado = 'outros';
      let estPrice = 12.0;

      if (lower.includes('banana') || lower.includes('maçã') || lower.includes('alface') || lower.includes('tomate') || lower.includes('cenoura') || lower.includes('fruta') || lower.includes('legume')) {
        corredor = 'hortifruti';
        estPrice = 9.5;
      } else if (lower.includes('carne') || lower.includes('frango') || lower.includes('peixe') || lower.includes('presunto') || lower.includes('bacon')) {
        corredor = 'carnes_frios';
        estPrice = 38.0;
      } else if (lower.includes('leite') || lower.includes('queijo') || lower.includes('ovo') || lower.includes('iogurte') || lower.includes('manteiga')) {
        corredor = 'laticinios';
        estPrice = 18.0;
      } else if (lower.includes('pão') || lower.includes('café') || lower.includes('bolo') || lower.includes('torrada')) {
        corredor = 'padaria_matinais';
        estPrice = 15.0;
      } else if (lower.includes('arroz') || lower.includes('feijão') || lower.includes('macarrão') || lower.includes('azeite') || lower.includes('óleo') || lower.includes('açúcar')) {
        corredor = 'mercearia_graos';
        estPrice = 22.0;
      } else if (lower.includes('cerveja') || lower.includes('refrigerante') || lower.includes('suco') || lower.includes('água') || lower.includes('vinho')) {
        corredor = 'bebidas';
        estPrice = 16.0;
      } else if (lower.includes('sabão') || lower.includes('detergente') || lower.includes('amaciante') || lower.includes('desinfetante') || lower.includes('papel toalha')) {
        corredor = 'limpeza';
        estPrice = 24.0;
      } else if (lower.includes('shampoo') || lower.includes('sabonete') || lower.includes('pasta') || lower.includes('desodorante')) {
        corredor = 'higiene_pessoal';
        estPrice = 19.0;
      }

      return {
        nome: name.charAt(0).toUpperCase() + name.slice(1),
        quantidade: 1,
        unidade: 'un',
        corredor,
        precoEstimado: estPrice,
        noCarrinho: false,
        adicionadoPor: user.nome.split(' ')[0],
      };
    });

    addMultipleGroceryItems(itemsToAdd);
    toast.success(`${itemsToAdd.length} itens adicionados e categorizados automaticamente!`);
    setTextList('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div
        className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <ListPlus className="h-5 w-5 text-emerald-400" />
              Adicionar Múltiplos Itens de Uma Vez
            </h3>
            <p className="text-xs text-zinc-400">
              Cole sua lista de compras ou digite itens separados por vírgula ou linha
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-zinc-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleBatchAdd} className="space-y-4">
          <div>
            <textarea
              rows={6}
              placeholder="Exemplo:&#10;Café em grãos&#10;Leite desnatado&#10;Ovos caipiras&#10;Azeite de oliva&#10;Detergente"
              value={textList}
              onChange={(e) => setTextList(e.target.value)}
              autoFocus
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3.5 text-xs text-zinc-100 placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-emerald-500 font-mono leading-relaxed"
            />
          </div>

          <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-3 flex items-center gap-2.5 text-xs text-indigo-300">
            <Sparkles className="h-4 w-4 shrink-0 text-indigo-400" />
            <span>Nossa IA categoriza automaticamente cada item no seu respectivo corredor do supermercado!</span>
          </div>

          <div className="pt-2 flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" className="flex-1 shadow-glow-emerald">
              Adicionar Itens à Lista
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
