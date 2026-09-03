import * as React from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { CorredorSupermercado } from '../../types/supermarket';
import { AISLE_CONFIGS } from '../../data/initialMockData';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { X, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

interface AddItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddItemDialog({ isOpen, onClose }: AddItemDialogProps) {
  const { addGroceryItem } = useAppStore();
  const { user } = useAuthStore();

  const [nome, setNome] = React.useState('');
  const [quantidade, setQuantidade] = React.useState(1);
  const [unidade, setUnidade] = React.useState<'un' | 'kg' | 'g' | 'l' | 'pct' | 'cx'>('un');
  const [corredor, setCorredor] = React.useState<CorredorSupermercado>('hortifruti');
  const [precoEstimado, setPrecoEstimado] = React.useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    addGroceryItem({
      nome,
      quantidade: Number(quantidade),
      unidade,
      corredor,
      precoEstimado: parseFloat(precoEstimado.replace(',', '.')) || 10.0,
      noCarrinho: false,
      adicionadoPor: user?.nome ? user.nome.split(' ')[0] : 'Eu',
    });

    toast.success(`"${nome}" adicionado à lista!`);
    setNome('');
    setQuantidade(1);
    setPrecoEstimado('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div
        className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-emerald-400" />
            Adicionar Item à Lista
          </h3>
          <button onClick={onClose} className="rounded-lg p-1 text-zinc-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome do Produto / Alimento"
            placeholder="Ex: Leite Desnatado, Maçã Gala..."
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Quantidade
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={quantidade}
                onChange={(e) => setQuantidade(parseFloat(e.target.value) || 1)}
                className="flex h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 font-mono outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Unidade de Medida
              </label>
              <select
                value={unidade}
                onChange={(e) => setUnidade(e.target.value as any)}
                className="flex h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-xs font-semibold text-zinc-100 outline-none"
              >
                <option value="un">Unidade (un)</option>
                <option value="kg">Quilo (kg)</option>
                <option value="g">Gramas (g)</option>
                <option value="l">Litros (l)</option>
                <option value="pct">Pacote (pct)</option>
                <option value="cx">Caixa (cx)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Corredor do Mercado
              </label>
              <select
                value={corredor}
                onChange={(e) => setCorredor(e.target.value as any)}
                className="flex h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-xs text-zinc-100 outline-none"
              >
                {Object.entries(AISLE_CONFIGS).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.nome}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Preço Estimado (R$)"
              type="number"
              step="0.01"
              placeholder="12,50"
              value={precoEstimado}
              onChange={(e) => setPrecoEstimado(e.target.value)}
            />
          </div>

          <div className="pt-2 flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" className="flex-1 shadow-glow-emerald">
              Adicionar à Lista
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
