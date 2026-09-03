import * as React from 'react';
import { Categoria } from '../../types/financial';
import { useAppStore } from '../../stores/useAppStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { X, Tag, Sparkles, Check } from 'lucide-react';
import { toast } from 'sonner';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryToEdit?: Categoria | null;
}

const EMOJI_PALETTE = [
  '🏠', '🛒', '🍽️', '🚗', '💊', '🎬', '🎓', '🏋️',
  '💈', '💡', '🎮', '✈️', '💼', '🎁', '🐶', '👶',
  '💄', '🧾', '📦', '📱', '☕', '⚡', '🏖️', '🔧'
];

const COLOR_PALETTE = [
  { name: 'Esmeralda', value: '#10b981' },
  { name: 'Roxo', value: '#8b5cf6' },
  { name: 'Azul', value: '#3b82f6' },
  { name: 'Âmbar / Laranja', value: '#f59e0b' },
  { name: 'Rosa / Rubi', value: '#ef4444' },
  { name: 'Ciano', value: '#06b6d4' },
  { name: 'Índigo', value: '#6366f1' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Grafite', value: '#64748b' },
];

export function CategoryModal({ isOpen, onClose, categoryToEdit }: CategoryModalProps) {
  const { addCategory, updateCategory } = useAppStore();

  const [descricao, setDescricao] = React.useState('');
  const [iconName, setIconName] = React.useState('🏷️');
  const [color, setColor] = React.useState(COLOR_PALETTE[0].value);
  const [orcamentoMensal, setOrcamentoMensal] = React.useState('');

  React.useEffect(() => {
    if (categoryToEdit) {
      setDescricao(categoryToEdit.descricao);
      setIconName(categoryToEdit.iconName || '🏷️');
      setColor(categoryToEdit.cor || categoryToEdit.color || COLOR_PALETTE[0].value);
      const currentTeto = categoryToEdit.teto ?? categoryToEdit.orcamentoMensal;
      setOrcamentoMensal(currentTeto !== undefined && currentTeto !== null ? currentTeto.toString() : '');
    } else {
      setDescricao('');
      setIconName('🛒');
      setColor(COLOR_PALETTE[0].value);
      setOrcamentoMensal('');
    }
  }, [categoryToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim()) {
      toast.error('Informe o nome da categoria');
      return;
    }

    const budgetNum = orcamentoMensal ? parseFloat(orcamentoMensal.replace(',', '.')) : null;

    if (categoryToEdit) {
      await updateCategory(categoryToEdit.id, {
        descricao,
        iconName,
        color,
        cor: color,
        teto: budgetNum,
        orcamentoMensal: budgetNum,
      });
      toast.success(`Categoria "${descricao}" atualizada com sucesso!`);
    } else {
      await addCategory({
        descricao,
        iconName,
        color,
        cor: color,
        teto: budgetNum,
        orcamentoMensal: budgetNum,
      });
      toast.success(`Nova categoria "${descricao}" criada com sucesso!`);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div
        className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-xl shadow-sm border border-white/10"
              style={{ backgroundColor: `${color}25` }}
            >
              <span>{iconName}</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100">
                {categoryToEdit ? 'Editar Categoria' : 'Nova Categoria'}
              </h3>
              <p className="text-xs text-zinc-400">
                Personalize nome, ícone, cor e teto de gastos
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-zinc-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome da Categoria"
            placeholder="Ex: Educação & Cursos, Assinaturas, Pet..."
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            required
            autoFocus
          />

          <Input
            label="Teto de Orçamento Mensal Sugerido (R$) - Opcional"
            placeholder="Ex: 800,00"
            type="number"
            step="10"
            value={orcamentoMensal}
            onChange={(e) => setOrcamentoMensal(e.target.value)}
          />

          {/* Emoji / Icon Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 block">
              Ícone da Categoria
            </label>
            <div className="grid grid-cols-8 gap-1.5 p-2 rounded-xl bg-zinc-950 border border-zinc-800 max-h-32 overflow-y-auto">
              {EMOJI_PALETTE.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIconName(emoji)}
                  className={`h-9 w-9 rounded-lg flex items-center justify-center text-lg transition-all ${
                    iconName === emoji
                      ? 'bg-zinc-800 ring-2 ring-emerald-400 scale-110'
                      : 'hover:bg-zinc-900'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 block">
              Cor Temática da Categoria (Bolinha)
            </label>
            <div className="grid grid-cols-5 gap-2 p-2 rounded-xl bg-zinc-950 border border-zinc-800">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`h-8 rounded-lg flex items-center justify-center transition-all ${
                    color === c.value
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-105'
                      : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                >
                  {color === c.value && <Check className="h-4 w-4 text-white drop-shadow" />}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" className="flex-1 shadow-glow-emerald">
              {categoryToEdit ? 'Atualizar Categoria' : 'Salvar Categoria'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
