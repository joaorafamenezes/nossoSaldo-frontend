import * as React from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { CartaoCredito } from '../../types/cards';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { X, CreditCard, Sparkles, Check } from 'lucide-react';
import { toast } from 'sonner';

interface NewCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardToEdit?: CartaoCredito | null;
}

const GRADIENT_PALETTES = [
  { id: 'purple', name: 'Roxo Ultravioleta', value: 'from-purple-900 via-indigo-950 to-purple-950' },
  { id: 'gold', name: 'Dourado / Dark Gold', value: 'from-amber-950 via-yellow-950 to-zinc-950' },
  { id: 'blue', name: 'Azul Personalité', value: 'from-blue-900 via-indigo-950 to-slate-950' },
  { id: 'emerald', name: 'Verde Esmeralda', value: 'from-emerald-900 via-teal-950 to-zinc-950' },
  { id: 'rose', name: 'Rubi / Rose', value: 'from-rose-900 via-pink-950 to-zinc-950' },
  { id: 'carbon', name: 'Carbon Black', value: 'from-zinc-900 via-slate-900 to-black' },
];

export function NewCardModal({ isOpen, onClose, cardToEdit }: NewCardModalProps) {
  const { addCard, updateCard } = useAppStore();
  const { user } = useAuthStore();

  const [descricao, setDescricao] = React.useState('');
  const [ultimosDigitos, setUltimosDigitos] = React.useState('');
  const [bandeira, setBandeira] = React.useState<'mastercard' | 'visa' | 'elo' | 'amex'>('mastercard');
  const [corGradiente, setCorGradiente] = React.useState(GRADIENT_PALETTES[0].value);
  const [diaFechamento, setDiaFechamento] = React.useState(15);
  const [diaVencimento, setDiaVencimento] = React.useState(22);
  const [valorLimite, setValorLimite] = React.useState('');

  React.useEffect(() => {
    if (cardToEdit) {
      setDescricao(cardToEdit.descricao);
      setUltimosDigitos(cardToEdit.ultimosDigitos || '');
      setBandeira(cardToEdit.bandeira);
      setCorGradiente(cardToEdit.corGradiente);
      setDiaFechamento(cardToEdit.diaFechamento);
      setDiaVencimento(cardToEdit.diaVencimento);
      setValorLimite(cardToEdit.valorLimite.toString());
    } else {
      setDescricao('');
      setUltimosDigitos('');
      setBandeira('mastercard');
      setCorGradiente(GRADIENT_PALETTES[0].value);
      setDiaFechamento(15);
      setDiaVencimento(22);
      setValorLimite('');
    }
  }, [cardToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const limitNum = parseFloat(valorLimite.replace(',', '.')) || 0;
    if (!descricao.trim() || limitNum <= 0) {
      toast.error('Preencha o nome do cartão e um limite válido');
      return;
    }

    if (cardToEdit) {
      await updateCard(cardToEdit.id, {
        descricao,
        ultimosDigitos: ultimosDigitos.slice(-4),
        bandeira,
        corGradiente,
        cor: corGradiente,
        diaFechamento: Number(diaFechamento),
        diaVencimento: Number(diaVencimento),
        valorLimite: limitNum,
      });
      toast.success('Cartão atualizado com sucesso!');
    } else {
      await addCard({
        descricao,
        ultimosDigitos: ultimosDigitos.slice(-4) || '1234',
        bandeira,
        corGradiente,
        cor: corGradiente,
        diaFechamento: Number(diaFechamento),
        diaVencimento: Number(diaVencimento),
        valorLimite: limitNum,
        limiteDisponivel: limitNum,
        usuarioId: user.id,
      });
      toast.success('Novo cartão cadastrado com sucesso!');
    }

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
              <CreditCard className="h-5 w-5 text-emerald-400" />
              {cardToEdit ? 'Editar Cartão' : 'Cadastrar Novo Cartão'}
            </h3>
            <p className="text-xs text-zinc-400">
              Configuração de limites e ciclos de fatura
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-zinc-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome / Apelido do Cartão"
            placeholder="Ex: Nubank Ultravioleta, XP Infinite..."
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Últimos 4 Dígitos"
              placeholder="Ex: 4892"
              maxLength={4}
              value={ultimosDigitos}
              onChange={(e) => setUltimosDigitos(e.target.value)}
            />

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                Bandeira
              </label>
              <select
                value={bandeira}
                onChange={(e) => setBandeira(e.target.value as any)}
                className="flex h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-xs font-semibold text-zinc-100 outline-none"
              >
                <option value="mastercard">Mastercard</option>
                <option value="visa">Visa</option>
                <option value="elo">Elo</option>
                <option value="amex">American Express</option>
              </select>
            </div>
          </div>

          <Input
            label="Limite Total Contratado (R$)"
            type="number"
            step="100"
            placeholder="15000"
            value={valorLimite}
            onChange={(e) => setValorLimite(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                Dia do Fechamento
              </label>
              <input
                type="number"
                min={1}
                max={31}
                value={diaFechamento}
                onChange={(e) => setDiaFechamento(parseInt(e.target.value, 10) || 1)}
                className="flex h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 font-mono text-sm text-zinc-100 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                Dia do Vencimento
              </label>
              <input
                type="number"
                min={1}
                max={31}
                value={diaVencimento}
                onChange={(e) => setDiaVencimento(parseInt(e.target.value, 10) || 1)}
                className="flex h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 font-mono text-sm text-zinc-100 outline-none"
              />
            </div>
          </div>

          {/* Palette selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 block">
              Estilo Visual / Cor do Cartão
            </label>
            <div className="grid grid-cols-3 gap-2">
              {GRADIENT_PALETTES.map((pal) => (
                <button
                  key={pal.id}
                  type="button"
                  onClick={() => setCorGradiente(pal.value)}
                  className={`h-9 rounded-xl border p-1 flex items-center justify-center transition-all bg-gradient-to-r ${pal.value} ${
                    corGradiente === pal.value
                      ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-zinc-900 border-white'
                      : 'border-white/10 opacity-70 hover:opacity-100'
                  }`}
                  title={pal.name}
                >
                  {corGradiente === pal.value && <Check className="h-4 w-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" className="flex-1 shadow-glow-emerald">
              {cardToEdit ? 'Atualizar Cartão' : 'Salvar Cartão'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
