import * as React from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { TipoGasto, OrigemLancamento, StatusGasto, Gasto } from '../../types/financial';
import { CategoryModal } from '../categories/CategoryModal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { X, Sparkles, Plus, Calendar, CreditCard, Tag, User, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '../../lib/utils';

export function ExpenseDrawerForm() {
  const {
    isExpenseDrawerOpen,
    closeExpenseDrawer,
    editingExpense,
    addExpense,
    addInstallmentSeries,
    updateExpense,
    categories,
    cards,
    selectedCompetencia,
    setSelectedCompetencia,
  } = useAppStore();

  const { user } = useAuthStore();

  const [isCategoryModalOpen, setIsCategoryModalOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [descricao, setDescricao] = React.useState('');
  const [valor, setValor] = React.useState('');
  const [tipo, setTipo] = React.useState<TipoGasto>('despesa');
  const [categoriaId, setCategoriaId] = React.useState('');
  const [dataVencimento, setDataVencimento] = React.useState('');
  const [origemLancamento, setOrigemLancamento] = React.useState<OrigemLancamento>('unico');
  const [numeroParcelas, setNumeroParcelas] = React.useState(1);
  const [cartaoCreditoId, setCartaoCreditoId] = React.useState('');
  const [naoCompartilhar, setNaoCompartilhar] = React.useState(false);
  const [status, setStatus] = React.useState<StatusGasto>('pendente');

  React.useEffect(() => {
    if (editingExpense) {
      setDescricao(editingExpense.descricao);
      setValor(editingExpense.valor.toString());
      setTipo(editingExpense.tipo);
      setCategoriaId(editingExpense.categoriaId);
      setDataVencimento(editingExpense.dataVencimento);
      setOrigemLancamento(editingExpense.origemLancamento);
      setNumeroParcelas(editingExpense.numeroParcelas || 1);
      setCartaoCreditoId(editingExpense.cartaoCreditoId || '');
      setNaoCompartilhar(editingExpense.naoCompartilhar);
      setStatus(editingExpense.status);
    } else {
      const today = new Date().toISOString().split('T')[0];
      setDescricao('');
      setValor('');
      setTipo('despesa');
      setCategoriaId(categories[0]?.id || '');
      setDataVencimento(today);
      setOrigemLancamento('unico');
      setNumeroParcelas(1);
      setCartaoCreditoId('');
      setNaoCompartilhar(false);
      setStatus('pendente');
    }
  }, [editingExpense, isExpenseDrawerOpen, categories]);

  if (!isExpenseDrawerOpen) return null;

  const parsedValor = parseFloat(valor.replace(',', '.')) || 0;
  const valorParcela = numeroParcelas > 1 ? parsedValor / numeroParcelas : parsedValor;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim() || parsedValor <= 0) {
      toast.error('Preencha a descrição e um valor válido');
      return;
    }

    const effectiveCategoriaId = categoriaId || categories[0]?.id;
    if (!effectiveCategoriaId) {
      toast.error('Cadastre ao menos uma categoria antes de criar um lançamento.');
      return;
    }

    const dueDate = dataVencimento || new Date().toISOString().split('T')[0];
    const dueParts = dueDate.split('-');
    const computedCompetencia = `${dueParts[0]}-${dueParts[1]}-01`;
    const targetComp = `${dueParts[0]}-${dueParts[1]}`;
    const matchedCard = cards.find((c) => c.id === cartaoCreditoId);

    const expensePayload: Omit<Gasto, 'id' | 'createdAt' | 'updatedAt'> = {
      descricao,
      tipo,
      status,
      origemLancamento,
      numeroParcelas: origemLancamento === 'parcelado' ? numeroParcelas : 1,
      naoCompartilhar,
      valor: parsedValor,
      competencia: computedCompetencia,
      dataVencimento: dueDate,
      categoriaId: effectiveCategoriaId,
      responsavelId: user?.id || '',
      responsavelNome: user?.nome || 'Usuário',
      cartaoCreditoId: cartaoCreditoId || undefined,
      cartaoNome: matchedCard?.descricao,
      dataInicioRecorrencia: origemLancamento === 'recorrente' ? dueDate : undefined,
      dataFimRecorrencia: undefined,
    };

    setIsSubmitting(true);
    try {
      if (editingExpense) {
        await updateExpense(editingExpense.id, expensePayload);
        toast.success('Lançamento atualizado com sucesso!');
      } else {
        if (origemLancamento === 'parcelado' && numeroParcelas > 1) {
          await addInstallmentSeries(expensePayload, numeroParcelas, valorParcela);
          toast.success(`Série de ${numeroParcelas} parcelas gerada com sucesso!`);
        } else {
          await addExpense(expensePayload);
          toast.success(
            origemLancamento === 'recorrente'
              ? 'Lançamento recorrente criado! Ele será projetado todo mês automaticamente.'
              : 'Lançamento criado com sucesso!'
          );
        }
        if (targetComp && targetComp !== selectedCompetencia) {
          setSelectedCompetencia(targetComp);
        }
      }
      closeExpenseDrawer();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar lançamento na API.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-zinc-900 border-l border-zinc-800 h-full overflow-y-auto flex flex-col justify-between shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-zinc-100">
                {editingExpense ? 'Editar Lançamento' : 'Novo Lançamento'}
              </h3>
              <p className="text-xs text-zinc-400">
                {editingExpense ? 'Atualize as informações contábeis' : 'Registre despesas ou receitas no NossoSaldo'}
              </p>
            </div>
            <button
              onClick={closeExpenseDrawer}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form id="expense-form" onSubmit={handleSubmit} className="space-y-4 mt-6">
            {/* Type selector */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setTipo('despesa')}
                className={`py-2 rounded-lg text-xs font-bold transition-all ${
                  tipo === 'despesa'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Despesa (-)
              </button>
              <button
                type="button"
                onClick={() => {
                  setTipo('receita');
                  if (origemLancamento === 'parcelado') setOrigemLancamento('unico');
                }}
                className={`py-2 rounded-lg text-xs font-bold transition-all ${
                  tipo === 'receita'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Receita (+)
              </button>
            </div>

            {/* Description */}
            <Input
              label="Descrição do Lançamento"
              placeholder="Ex: Aluguel, Supermercado, Salário..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              required
            />

            {/* Value & Due date */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Valor (R$)"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                required
              />

              <Input
                label={origemLancamento === 'recorrente' ? '1º Vencimento / Início' : 'Data de Vencimento'}
                type="date"
                value={dataVencimento}
                onChange={(e) => setDataVencimento(e.target.value)}
                required
              />
            </div>

            {/* Category */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Categoria
                </label>
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  <span>Nova Categoria</span>
                </button>
              </div>
              <select
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-xs text-zinc-100 outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.iconName ? `${cat.iconName} ` : ''}{cat.descricao}
                  </option>
                ))}
              </select>
            </div>

            {/* Card selection (only for expenses) */}
            {tipo === 'despesa' && (
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                  Forma de Pagamento / Cartão de Crédito
                </label>
                <select
                  value={cartaoCreditoId}
                  onChange={(e) => setCartaoCreditoId(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-xs text-zinc-100 outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">Conta Corrente / PIX / Dinheiro</option>
                  {cards.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.descricao} (Final {c.ultimosDigitos})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Recurrence and Installment controls */}
            <div className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
              <label className="text-xs font-semibold text-zinc-300 block">
                Frequência / Tipo de Lançamento
              </label>
              <div className={`grid ${tipo === 'despesa' ? 'grid-cols-3' : 'grid-cols-2'} gap-1.5`}>
                <button
                  type="button"
                  onClick={() => {
                    setOrigemLancamento('unico');
                    setNumeroParcelas(1);
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs capitalize transition-colors ${
                    origemLancamento === 'unico'
                      ? 'bg-zinc-800 text-white font-bold border border-zinc-700'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Único
                </button>
                {tipo === 'despesa' && (
                  <button
                    type="button"
                    onClick={() => {
                      setOrigemLancamento('parcelado');
                      if (numeroParcelas <= 1) setNumeroParcelas(2);
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs capitalize transition-colors ${
                      origemLancamento === 'parcelado'
                        ? 'bg-zinc-800 text-white font-bold border border-zinc-700'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Parcelado
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setOrigemLancamento('recorrente');
                    setNumeroParcelas(1);
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs capitalize transition-colors ${
                    origemLancamento === 'recorrente'
                      ? 'bg-zinc-800 text-white font-bold border border-zinc-700'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  🔁 Fixo / Recorrente
                </button>
              </div>

              {origemLancamento === 'parcelado' && (
                <div className="pt-2 space-y-2 border-t border-zinc-800/80 animate-in fade-in duration-150">
                  <label className="text-xs text-zinc-400 block">Número de Parcelas:</label>
                  <input
                    type="number"
                    min={2}
                    max={48}
                    value={numeroParcelas}
                    onChange={(e) => setNumeroParcelas(parseInt(e.target.value, 10) || 2)}
                    className="h-9 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-xs font-mono font-bold text-emerald-400 outline-none"
                  />
                  {parsedValor > 0 && (
                    <p className="text-xs text-emerald-400 font-mono font-bold">
                      ➔ {numeroParcelas}x de {formatCurrency(valorParcela)}
                    </p>
                  )}
                </div>
              )}

              {origemLancamento === 'recorrente' && (
                <div className="pt-2.5 space-y-1 border-t border-zinc-800/80 animate-in fade-in duration-150">
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Recorrência Contínua Automática</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Este lançamento será projetado automaticamente todo mês a partir do dia de vencimento ({dataVencimento ? `${dataVencimento.split('-')[2]}` : 'selecionado'}), sem data de término. Não será necessário recadastrar todo mês.
                  </p>
                </div>
              )}
            </div>

            {/* Private vs Joint Account */}
            <div className="flex items-center gap-2.5 rounded-xl border border-zinc-800 bg-zinc-950 p-3">
              <input
                type="checkbox"
                id="naoCompartilhar"
                checked={naoCompartilhar}
                onChange={(e) => setNaoCompartilhar(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500"
              />
              <label htmlFor="naoCompartilhar" className="text-xs text-zinc-300 cursor-pointer">
                <strong>Despesa Privada / Pessoal</strong> (Não dividir na conta do casal)
              </label>
            </div>
          </form>
        </div>

        {/* Footer actions */}
        <div className="pt-6 border-t border-zinc-800 flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={closeExpenseDrawer}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="expense-form"
            variant="primary"
            className="flex-1 shadow-glow-emerald"
          >
            {editingExpense ? 'Salvar Alterações' : 'Confirmar Lançamento'}
          </Button>
        </div>
      </div>

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
      />
    </div>
  );
}
