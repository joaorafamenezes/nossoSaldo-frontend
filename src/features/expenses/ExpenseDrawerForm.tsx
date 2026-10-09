import * as React from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { TipoGasto, OrigemLancamento, StatusGasto, Gasto } from '../../types/financial';
import { CategoryModal } from '../categories/CategoryModal';
import { RecurringScopeModal, RecurringEditScope } from './RecurringScopeModal';
import { PaymentMethodChangeModal } from './PaymentMethodChangeModal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { X, Sparkles, Plus, Calendar, CreditCard, Tag, User, Layers, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, formatDate, calculateCardDueDate } from '../../lib/utils';

export function ExpenseDrawerForm() {
  const {
    isExpenseDrawerOpen,
    closeExpenseDrawer,
    editingExpense,
    editingInstallment,
    newExpenseDefaults,
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
  const [isScopeModalOpen, setIsScopeModalOpen] = React.useState(false);
  const [isPaymentMethodModalOpen, setIsPaymentMethodModalOpen] = React.useState(false);
  const [paymentMethodModalMode, setPaymentMethodModalMode] = React.useState<'parcelado' | 'recorrente'>('parcelado');
  const [pendingRecurringPayload, setPendingRecurringPayload] = React.useState<any | null>(null);
  const [pendingParceladoPayload, setPendingParceladoPayload] = React.useState<any | null>(null);
  const [initialCardIdOnOpen, setInitialCardIdOnOpen] = React.useState<string>('');
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
  const [observacao, setObservacao] = React.useState('');
  const [dataFimRecorrencia, setDataFimRecorrencia] = React.useState('');

  const sortedCategories = React.useMemo(() => {
    return [...categories].sort((a, b) =>
      (a.descricao || '').localeCompare(b.descricao || '', 'pt-BR', { sensitivity: 'base' })
    );
  }, [categories]);

  React.useEffect(() => {
    if (editingExpense) {
      setDescricao(editingExpense.descricao);
      setTipo(editingExpense.tipo);
      setCategoriaId(editingExpense.categoriaId);
      setOrigemLancamento(editingExpense.origemLancamento);
      setNumeroParcelas(editingExpense.numeroParcelas || 1);
      setNaoCompartilhar(editingExpense.naoCompartilhar);
      setObservacao(editingExpense.observacao || '');
      setDataFimRecorrencia(editingExpense.dataFimRecorrencia ? editingExpense.dataFimRecorrencia.split('T')[0] : '');

      if (editingInstallment) {
        setValor(editingInstallment.valorParcela ? editingInstallment.valorParcela.toString() : (editingExpense.valor / (editingExpense.numeroParcelas || 1)).toString());
        setDataVencimento(editingInstallment.dataVencimentoParcela || editingExpense.dataVencimento);
        setStatus(editingInstallment.status || editingExpense.status);
        const instCardId = editingInstallment.faturaCartaoId ? (editingExpense.cartaoCreditoId || '') : '';
        setCartaoCreditoId(instCardId);
        setInitialCardIdOnOpen(instCardId);
      } else {
        setValor(editingExpense.valor.toString());
        setDataVencimento(editingExpense.dataVencimento);
        setStatus(editingExpense.status);
        const expCardId = editingExpense.cartaoCreditoId || '';
        setCartaoCreditoId(expCardId);
        setInitialCardIdOnOpen(expCardId);
      }
    } else {
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const initialTipo = newExpenseDefaults?.tipo || 'despesa';
      const initialCatId = newExpenseDefaults?.categoriaId || categories[0]?.id || '';
      const initialCardId = newExpenseDefaults?.cartaoCreditoId || '';

      setDescricao('');
      setValor('');
      setTipo(initialTipo);
      setCategoriaId(initialCatId);
      setOrigemLancamento('unico');
      setNumeroParcelas(1);
      setCartaoCreditoId(initialCardId);
      setInitialCardIdOnOpen('');
      setNaoCompartilhar(false);
      setStatus('pendente');
      setObservacao('');
      setDataFimRecorrencia('');

      if (initialCardId) {
        const card = cards.find((c) => c.id === initialCardId);
        if (card) {
          const autoDueDate = calculateCardDueDate(card, now);
          setDataVencimento(autoDueDate);
        } else {
          setDataVencimento(today);
        }
      } else {
        setDataVencimento(today);
      }
    }
  }, [editingExpense, editingInstallment, isExpenseDrawerOpen, categories, cards, newExpenseDefaults, selectedCompetencia]);

  if (!isExpenseDrawerOpen) return null;

  const parsedValor = parseFloat(valor.replace(',', '.')) || 0;
  const valorParcela = numeroParcelas > 1 ? parsedValor / numeroParcelas : parsedValor;
  const matchedCard = cards.find((c) => c.id === cartaoCreditoId);

  const handleCardChange = (newCardId: string) => {
    setCartaoCreditoId(newCardId);
    if (newCardId) {
      const card = cards.find((c) => c.id === newCardId);
      if (card) {
        const autoDueDate = calculateCardDueDate(card, new Date());
        setDataVencimento(autoDueDate);
      }
    }
  };

  const handleConfirmScope = async (scope: RecurringEditScope) => {
    if (!editingExpense || !pendingRecurringPayload) return;

    setIsSubmitting(true);
    try {
      await updateExpense(editingExpense.id, {
        ...pendingRecurringPayload,
        escopoEdicao: scope,
        targetCompetencia: selectedCompetencia,
      });

      if (scope === 'THIS_ONLY') {
        toast.success('Alteração aplicada exclusivamente para este mês!');
      } else if (scope === 'THIS_AND_FUTURE') {
        toast.success('Reajuste aplicado deste mês em diante!');
      } else {
        toast.success('Recorrência atualizada em toda a série!');
      }

      setIsScopeModalOpen(false);
      setPendingRecurringPayload(null);
      closeExpenseDrawer();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar alteração da recorrência.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmPaymentMethodChange = async (atualizarTodos: boolean) => {
    if (!editingExpense) return;

    setIsSubmitting(true);
    try {
      if (paymentMethodModalMode === 'parcelado') {
        const payload = pendingParceladoPayload || {
          descricao,
          tipo,
          status,
          origemLancamento,
          numeroParcelas,
          naoCompartilhar,
          valor: parsedValor,
          competencia: `${(dataVencimento || new Date().toISOString().split('T')[0]).substring(0, 7)}-01`,
          dataVencimento,
          categoriaId: categoriaId || categories[0]?.id,
          cartaoCreditoId: cartaoCreditoId || undefined,
          cartaoNome: matchedCard?.descricao,
          observacao: observacao.trim() || undefined,
        };

        await updateExpense(editingExpense.id, {
          ...payload,
          atualizarTodasParcelas: atualizarTodos,
          parcelaId: editingInstallment?.id,
          numeroParcela: editingInstallment?.numeroParcela,
          cartaoCreditoId: cartaoCreditoId || null,
        });

        if (atualizarTodos) {
          toast.success('Todas as parcelas foram migradas para a forma de pagamento selecionada!');
        } else {
          toast.success('Parcela atualizada! As demais parcelas continuam no cartão de crédito.');
        }
      } else {
        const payload = pendingRecurringPayload || {
          descricao,
          tipo,
          status,
          origemLancamento,
          numeroParcelas: 1,
          naoCompartilhar,
          valor: parsedValor,
          competencia: `${(dataVencimento || new Date().toISOString().split('T')[0]).substring(0, 7)}-01`,
          dataVencimento,
          categoriaId: categoriaId || categories[0]?.id,
          cartaoCreditoId: cartaoCreditoId || null,
          cartaoNome: matchedCard?.descricao,
          observacao: observacao.trim() || undefined,
        };

        const scope: RecurringEditScope = atualizarTodos ? 'ALL_SERIES' : 'THIS_ONLY';
        await updateExpense(editingExpense.id, {
          ...payload,
          escopoEdicao: scope,
          targetCompetencia: selectedCompetencia,
          cartaoCreditoId: cartaoCreditoId || null,
        });

        if (atualizarTodos) {
          toast.success('Forma de pagamento atualizada para toda a série da recorrência!');
        } else {
          toast.success('Forma de pagamento atualizada somente para o mês selecionado!');
        }
      }

      setIsPaymentMethodModalOpen(false);
      setPendingParceladoPayload(null);
      setPendingRecurringPayload(null);
      closeExpenseDrawer();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar forma de pagamento.');
    } finally {
      setIsSubmitting(false);
    }
  };

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

    const isPaid = status === 'pago';
    const dueDate = dataVencimento || new Date().toISOString().split('T')[0];
    const dueParts = dueDate.split('-');
    const computedCompetencia = `${dueParts[0]}-${dueParts[1]}-01`;
    const targetComp = `${dueParts[0]}-${dueParts[1]}`;

    const expensePayload: Omit<Gasto, 'id' | 'createdAt' | 'updatedAt'> = {
      descricao,
      tipo,
      status,
      dataPagamento: isPaid ? (dueDate || new Date().toISOString().split('T')[0]) : undefined,
      origemLancamento,
      numeroParcelas: origemLancamento === 'parcelado' ? numeroParcelas : 1,
      naoCompartilhar,
      valor: parsedValor,
      competencia: computedCompetencia,
      dataVencimento: dueDate,
      categoriaId: effectiveCategoriaId,
      responsavelId: user?.id || '',
      responsavelNome: user?.nome || 'Usuário',
      cartaoCreditoId: cartaoCreditoId || null,
      cartaoNome: matchedCard?.descricao,
      dataInicioRecorrencia: origemLancamento === 'recorrente' ? dueDate : undefined,
      dataFimRecorrencia: (origemLancamento === 'recorrente' && dataFimRecorrencia) ? dataFimRecorrencia : undefined,
      observacao: observacao.trim() ? observacao.trim() : (editingExpense ? '' : undefined),
    };

    // CT001: Se estiver editando um gasto parcelado e houve alteração na forma de pagamento (ex: cartão -> Conta Corrente ou troca de cartão)
    if (editingExpense && editingExpense.origemLancamento === 'parcelado' && origemLancamento === 'parcelado') {
      const hasCardChanged = (initialCardIdOnOpen || '') !== (cartaoCreditoId || '');
      if (hasCardChanged) {
        setPendingParceladoPayload(expensePayload);
        setPaymentMethodModalMode('parcelado');
        setIsPaymentMethodModalOpen(true);
        return;
      }
    }

    // CT002: Se estiver editando uma recorrência e mantendo ela como recorrente
    if (editingExpense && editingExpense.origemLancamento === 'recorrente' && origemLancamento === 'recorrente') {
      const hasCardChanged = (initialCardIdOnOpen || '') !== (cartaoCreditoId || '');
      if (hasCardChanged) {
        setPendingRecurringPayload(expensePayload);
        setPaymentMethodModalMode('recorrente');
        setIsPaymentMethodModalOpen(true);
        return;
      }
      setPendingRecurringPayload(expensePayload);
      setIsScopeModalOpen(true);
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingExpense) {
        if (editingInstallment) {
          await updateExpense(editingExpense.id, {
            ...expensePayload,
            parcelaId: editingInstallment.id,
            numeroParcela: editingInstallment.numeroParcela,
            atualizarTodasParcelas: false,
          });
          toast.success(`Parcela ${editingInstallment.numeroParcela} atualizada com sucesso!`);
        } else {
          await updateExpense(editingExpense.id, expensePayload);
          toast.success('Lançamento atualizado com sucesso!');
        }
      } else {
        if (origemLancamento === 'parcelado' && numeroParcelas > 1) {
          await addInstallmentSeries(expensePayload, numeroParcelas, valorParcela);
          toast.success(`Série de ${numeroParcelas} parcelas gerada com sucesso!`);
        } else {
          await addExpense(expensePayload);
          if (status === 'pago') {
            toast.success(
              tipo === 'receita'
                ? 'Receita cadastrada já como recebida!'
                : 'Lançamento cadastrado já como pago!'
            );
          } else {
            toast.success(
              origemLancamento === 'recorrente'
                ? 'Lançamento recorrente criado! Ele será projetado todo mês automaticamente.'
                : 'Lançamento criado com sucesso!'
            );
          }
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
                {editingInstallment
                  ? `Editar Parcela ${editingInstallment.numeroParcela}`
                  : editingExpense
                  ? 'Editar Lançamento'
                  : 'Novo Lançamento'}
              </h3>
              <p className="text-xs text-zinc-400">
                {editingInstallment
                  ? `Ajuste o vencimento, valor ou forma de pagamento da parcela ${editingInstallment.numeroParcela} de ${editingExpense?.numeroParcelas || '?'}`
                  : editingExpense
                  ? 'Atualize as informações contábeis'
                  : 'Registre despesas ou receitas no NossoSaldo'}
              </p>
            </div>
            <button
              onClick={closeExpenseDrawer}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {editingInstallment && (
            <div className="mt-4 p-3 rounded-xl bg-purple-950/20 border border-purple-800/40 text-xs text-purple-300 flex items-start gap-2.5">
              <Layers className="h-4 w-4 shrink-0 text-purple-400 mt-0.5" />
              <div>
                <span className="font-bold">Editando Parcela Específica:</span>
                <p className="text-zinc-300 mt-0.5">
                  Você pode alterar a forma de pagamento (Cartão ou Conta Corrente) desta parcela. Ao salvar, você poderá escolher se atualiza apenas ela ou todas as demais.
                </p>
              </div>
            </div>
          )}

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

            {/* Status do Lançamento: Pendente vs Já Pago / Já Recebido */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 block">
                Status do Lançamento
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setStatus('pendente')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    status === 'pendente'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" />
                  <span>Pendente</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('pago')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    status === 'pago'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{tipo === 'receita' ? 'Já Recebido' : 'Já Pago'}</span>
                </button>
              </div>
            </div>

            {/* Category */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="categoriaId" className="text-xs font-semibold text-zinc-300">
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
                id="categoriaId"
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-xs text-zinc-100 outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                {sortedCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.iconName ? `${cat.iconName} ` : ''}{cat.descricao}
                  </option>
                ))}
              </select>
            </div>

            {/* Card selection (only for expenses) */}
            {tipo === 'despesa' && (
              <div>
                <label htmlFor="cartaoCreditoId" className="text-xs font-semibold text-zinc-300 block mb-1.5">
                  Forma de Pagamento / Cartão de Crédito
                </label>
                <select
                  id="cartaoCreditoId"
                  value={cartaoCreditoId}
                  onChange={(e) => handleCardChange(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-xs text-zinc-100 outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="">Conta Corrente / PIX / Dinheiro</option>
                  {cards.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.descricao} (Final {c.ultimosDigitos}) • Venc. dia {c.diaVencimento}
                    </option>
                  ))}
                </select>
                {matchedCard && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-emerald-400 font-medium bg-emerald-950/30 border border-emerald-800/40 rounded-lg px-2.5 py-1">
                    <CreditCard className="h-3.5 w-3.5 shrink-0" />
                    <span>Vencimento sugerido pela data de fechamento: <strong>{formatDate(dataVencimento)}</strong></span>
                  </div>
                )}
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
                <div className="pt-2.5 space-y-2.5 border-t border-zinc-800/80 animate-in fade-in duration-150">
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Recorrência Contínua Automática</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Este lançamento será projetado automaticamente todo mês a partir do dia {dataVencimento ? `${dataVencimento.split('-')[2]}` : 'selecionado'}.
                  </p>
                  <div className="pt-1 space-y-1">
                    <label htmlFor="dataFimRecorrencia" className="text-xs font-semibold text-zinc-300 block">
                      Data de Término <span className="text-zinc-500 font-normal">(Opcional)</span>
                    </label>
                    <input
                      id="dataFimRecorrencia"
                      type="date"
                      value={dataFimRecorrencia}
                      onChange={(e) => setDataFimRecorrencia(e.target.value)}
                      min={dataVencimento || undefined}
                      className="h-9 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-xs text-zinc-100 outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <p className="text-[11px] text-zinc-400">
                      {dataFimRecorrencia
                        ? `O lançamento será encerrado em ${formatDate(dataFimRecorrencia)}.`
                        : 'Deixe em branco para assinaturas contínuas (ex: PSN, Netflix, academia). Será renovado automaticamente.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Observações */}
            <div className="space-y-1.5">
              <label htmlFor="observacao" className="text-xs font-medium text-zinc-300 block">
                Observações
              </label>
              <textarea
                id="observacao"
                name="observacao"
                rows={3}
                placeholder="Detalhes ou especificidades deste lançamento (opcional)..."
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors resize-none"
              />
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

      <RecurringScopeModal
        isOpen={isScopeModalOpen}
        onClose={() => {
          setIsScopeModalOpen(false);
          setPendingRecurringPayload(null);
        }}
        onConfirm={handleConfirmScope}
        competencia={selectedCompetencia || (editingExpense?.competencia ? editingExpense.competencia.substring(0, 7) : '2026-09')}
        descricao={descricao}
        isSubmitting={isSubmitting}
      />

      <PaymentMethodChangeModal
        isOpen={isPaymentMethodModalOpen}
        onClose={() => {
          setIsPaymentMethodModalOpen(false);
          setPendingParceladoPayload(null);
          setPendingRecurringPayload(null);
        }}
        onConfirm={handleConfirmPaymentMethodChange}
        mode={paymentMethodModalMode}
        descricao={descricao}
        origemNome={cards.find((c) => c.id === initialCardIdOnOpen)?.descricao || (initialCardIdOnOpen ? 'Cartão de Crédito' : 'Conta Corrente / PIX / Dinheiro')}
        destinoNome={cartaoCreditoId ? (cards.find((c) => c.id === cartaoCreditoId)?.descricao || 'Cartão de Crédito') : 'Conta Corrente / PIX / Dinheiro'}
        numeroParcela={editingInstallment?.numeroParcela}
        totalParcelas={editingExpense?.numeroParcelas || editingExpense?.lancamentosBase?.length}
        competencia={selectedCompetencia || (editingExpense?.competencia ? editingExpense.competencia.substring(0, 7) : '2026-09')}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
