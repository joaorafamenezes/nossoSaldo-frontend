import { create } from 'zustand';
import { Gasto, Categoria, ResumoFinanceiro, StatusGasto } from '../types/financial';
import { CartaoCredito, FaturaCartao } from '../types/cards';
import { SupermarketItem } from '../types/supermarket';
import { AiInsight, AiMessage, AiExpenseDraft, IaConfiguracao } from '../types/ai';
import { Usuario, ContaConjuntaInfo } from '../types/user';
import {
  INITIAL_USER,
  INITIAL_CATEGORIES,
  INITIAL_CARDS,
  INITIAL_INVOICES,
  INITIAL_EXPENSES,
  INITIAL_GROCERY_ITEMS,
  INITIAL_AI_INSIGHTS,
  INITIAL_AI_MESSAGES,
  INITIAL_JOINT_INFO,
} from '../data/initialMockData';
import { getEffectiveExpenseValue } from '../lib/utils';
import * as api from '../services/api';

export type NavigationTab = 'dashboard' | 'expenses' | 'cards' | 'supermarket' | 'categories' | 'ai' | 'joint';

interface AppState {
  // Navigation & Viewport State
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  selectedCompetencia: string; // YYYY-MM
  setSelectedCompetencia: (comp: string) => void;
  isCommandMenuOpen: boolean;
  setCommandMenuOpen: (open: boolean) => void;
  isAiDrawerOpen: boolean;
  setAiDrawerOpen: (open: boolean) => void;
  isPrivacyMode: boolean;
  togglePrivacyMode: () => void;

  // Modals & Drawers
  isExpenseDrawerOpen: boolean;
  editingExpense: Gasto | null;
  openNewExpense: () => void;
  openEditExpense: (expense: Gasto) => void;
  closeExpenseDrawer: () => void;

  // Grocery State
  isShoppingFocusMode: boolean;
  setShoppingFocusMode: (active: boolean) => void;

  // Domain Entities
  user: Usuario;
  categories: Categoria[];
  cards: CartaoCredito[];
  invoices: FaturaCartao[];
  expenses: Gasto[];
  groceryItems: SupermarketItem[];
  aiInsights: AiInsight[];
  aiMessages: AiMessage[];
  isAiResponding: boolean;
  iaConfig: IaConfiguracao;
  jointInfo: ContaConjuntaInfo;

  // API Sync
  isLoadingData: boolean;
  loadApiData: (token: string) => Promise<void>;

  // Computed / Summaries
  getResumoCompetencia: () => ResumoFinanceiro;

  // Actions: Expenses
  addExpense: (expense: Omit<Gasto, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  addInstallmentSeries: (baseExpense: Omit<Gasto, 'id' | 'createdAt' | 'updatedAt'>, totalParcelas: number, valorPorParcela: number) => Promise<void>;
  updateExpense: (id: string, updates: Partial<Gasto>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  toggleExpenseStatus: (id: string) => Promise<void>;
  toggleInstallmentStatus: (gastoId: string, installmentId: string) => Promise<void>;
  batchToggleStatus: (ids: string[], targetStatus: StatusGasto) => Promise<void>;
  batchDeleteExpenses: (ids: string[]) => Promise<void>;

  // Actions: Cards & Invoices
  payInvoice: (invoiceId: string) => Promise<void>;
  reopenInvoice: (invoiceId: string) => Promise<void>;
  addCard: (card: Omit<CartaoCredito, 'id'>) => Promise<void>;
  updateCard: (id: string, updates: Partial<CartaoCredito>) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;

  // Actions: Categories
  addCategory: (category: Omit<Categoria, 'id'>) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Categoria>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Actions: Grocery List (Local Storage Persistence)
  addGroceryItem: (item: Omit<SupermarketItem, 'id'>) => void;
  addMultipleGroceryItems: (items: Omit<SupermarketItem, 'id'>[]) => void;
  toggleGroceryItemCart: (id: string) => void;
  updateGroceryItem: (id: string, updates: Partial<SupermarketItem>) => void;
  deleteGroceryItem: (id: string) => void;
  clearPurchasedGroceries: () => void;
  convertGroceryListToExpense: (cardId?: string) => Promise<void>;

  // Actions: AI Copilot
  sendAiUserMessage: (content: string) => Promise<void>;
  clearAiConversation: () => Promise<void>;
  applyAiExpenseDraft: (draft: AiExpenseDraft) => Promise<void>;
  updateIaConfig: (config: Partial<IaConfiguracao>) => void;

  // Session & Store Reset
  resetStore: () => void;
}

const GROCERY_STORAGE_KEY = '@NossoSaldo:groceries';

function normalizeGastoFromApi(gasto: any, categories: Categoria[], cards: CartaoCredito[]): Gasto {
  const compRaw = gasto.competencia || gasto.dataVencimento || new Date().toISOString();
  const compStr = typeof compRaw === 'string'
    ? (compRaw.includes('T') ? compRaw.split('T')[0].substring(0, 7) + '-01' : compRaw.substring(0, 7) + '-01')
    : new Date(compRaw).toISOString().substring(0, 7) + '-01';

  const dueRaw = gasto.dataVencimento || gasto.competencia || new Date().toISOString();
  const dueStr = typeof dueRaw === 'string'
    ? (dueRaw.includes('T') ? dueRaw.split('T')[0] : dueRaw.substring(0, 10))
    : new Date(dueRaw).toISOString().substring(0, 10);

  const payStr = gasto.dataPagamento
    ? (typeof gasto.dataPagamento === 'string'
        ? (gasto.dataPagamento.includes('T') ? gasto.dataPagamento.split('T')[0] : gasto.dataPagamento.substring(0, 10))
        : new Date(gasto.dataPagamento).toISOString().substring(0, 10))
    : undefined;

  const card = cards.find((c) => c.id === gasto.cartaoCreditoId);
  const cat = categories.find((c) => c.id === gasto.categoriaId);

  const normalizedLancamentos = Array.isArray(gasto.lancamentosBase)
    ? gasto.lancamentosBase.map((lb: any) => ({
        id: lb.id,
        gastoId: lb.gastoId || gasto.id,
        descricao: lb.descricao,
        valorParcela: Number(lb.valorParcela),
        numeroParcela: Number(lb.numeroParcela),
        dataVencimentoParcela: lb.dataVencimentoParcela
          ? (typeof lb.dataVencimentoParcela === 'string'
              ? lb.dataVencimentoParcela.split('T')[0]
              : new Date(lb.dataVencimentoParcela).toISOString().split('T')[0])
          : '',
        dataPagamentoParcela: lb.dataPagamentoParcela
          ? (typeof lb.dataPagamentoParcela === 'string'
              ? lb.dataPagamentoParcela.split('T')[0]
              : new Date(lb.dataPagamentoParcela).toISOString().split('T')[0])
          : undefined,
        status: (lb.status || 'pendente') as StatusGasto,
        competencia: lb.competencia
          ? (typeof lb.competencia === 'string'
              ? lb.competencia.split('T')[0]
              : new Date(lb.competencia).toISOString().split('T')[0])
          : '',
        observacao: lb.observacao || '',
        faturaCartaoId: lb.faturaCartaoId || undefined,
        faturaCartaoCompetencia: lb.faturaCartaoCompetencia || lb.faturaCartao?.competencia,
        faturaCartaoStatus: lb.faturaCartaoStatus || lb.faturaCartao?.status,
      }))
    : undefined;

  return {
    id: gasto.id,
    descricao: gasto.descricao,
    valor: Number(gasto.valor),
    tipo: gasto.tipo === 'receita' ? 'receita' : 'despesa',
    status: (gasto.status || 'pendente') as StatusGasto,
    origemLancamento: gasto.origemLancamento || 'unico',
    numeroParcelas: gasto.numeroParcelas || 1,
    parcelaAtual: gasto.parcelaAtual || gasto.numeroParcela,
    naoCompartilhar: !!gasto.naoCompartilhar,
    competencia: compStr,
    dataVencimento: dueStr,
    dataPagamento: payStr,
    observacao: gasto.observacao || '',
    categoriaId: gasto.categoriaId || cat?.id || 'outros',
    categoriaNome: gasto.categoriaDescricao || gasto.categoria?.descricao || cat?.descricao || 'Outros & Imprevistos',
    responsavelId: gasto.responsavelId,
    responsavelNome: gasto.responsavelNome || gasto.responsavel?.nome,
    cartaoCreditoId: gasto.cartaoCreditoId || undefined,
    cartaoNome: gasto.cartaoCreditoDescricao || gasto.cartaoCredito?.descricao || card?.descricao,
    faturaCartaoId: gasto.faturaCartaoId || undefined,
    lancamentosBase: normalizedLancamentos,
    createdAt: gasto.createdAt ? new Date(gasto.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: gasto.updatedAt ? new Date(gasto.updatedAt).toISOString() : new Date().toISOString(),
  };
}

function normalizeCardFromApi(c: any): CartaoCredito {
  const limiteTotal = parseFloat(c.valorLimite || c.limiteTotal || 0) || 0;
  const faturaAtual = parseFloat(c.faturaAtual || 0) || 0;
  const limiteDisponivel = typeof c.limiteDisponivel === 'number' && !isNaN(c.limiteDisponivel)
    ? c.limiteDisponivel
    : Math.max(0, limiteTotal - faturaAtual);

  const descLower = (c.descricao || '').toLowerCase();
  let defaultGrad = 'from-zinc-900 via-slate-900 to-black';
  if (descLower.includes('nubank')) defaultGrad = 'from-purple-900 via-indigo-950 to-purple-950';
  else if (descLower.includes('inter')) defaultGrad = 'from-amber-950 via-yellow-950 to-zinc-950';
  else if (descLower.includes('itau') || descLower.includes('itaú')) defaultGrad = 'from-blue-900 via-indigo-950 to-slate-950';
  else if (descLower.includes('bradesco') || descLower.includes('bradescard')) defaultGrad = 'from-rose-900 via-pink-950 to-zinc-950';
  else if (descLower.includes('emerald') || descLower.includes('verde') || descLower.includes('sicredi')) defaultGrad = 'from-emerald-900 via-teal-950 to-zinc-950';

  const chosenGrad = c.corGradiente || c.cor || defaultGrad;

  return {
    id: c.id,
    descricao: c.descricao || 'Cartão de Crédito',
    ultimosDigitos: c.ultimosDigitos || (c.id && c.id.length >= 4 ? c.id.slice(-4) : '8842'),
    bandeira: c.bandeira || (descLower.includes('visa') ? 'visa' : descLower.includes('elo') ? 'elo' : 'mastercard'),
    valorLimite: limiteTotal,
    limiteDisponivel: limiteDisponivel,
    faturaAtual: faturaAtual,
    diaFechamento: Number(c.diaFechamento) || 10,
    diaVencimento: Number(c.diaVencimento) || 17,
    corGradiente: chosenGrad,
    cor: chosenGrad,
    observacoes: c.observacoes,
    usuarioId: c.usuarioId,
    usuarioNome: c.usuario?.nome || c.usuarioNome || undefined,
    usuarioEmail: c.usuario?.email || c.usuarioEmail || undefined,
  };
}

const getCurrentCompetencia = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const useAppStore = create<AppState>((set, get) => ({
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),
  selectedCompetencia: getCurrentCompetencia(),
  setSelectedCompetencia: (comp) => {
    set({ selectedCompetencia: comp });
    const token = localStorage.getItem('@NossoSaldo:token');
    if (token) {
      get().loadApiData(token);
    }
  },
  isCommandMenuOpen: false,
  setCommandMenuOpen: (open) => set({ isCommandMenuOpen: open }),
  isAiDrawerOpen: false,
  setAiDrawerOpen: (open) => set({ isAiDrawerOpen: open }),
  isPrivacyMode: false,
  togglePrivacyMode: () => set((state) => ({ isPrivacyMode: !state.isPrivacyMode })),

  isExpenseDrawerOpen: false,
  editingExpense: null,
  openNewExpense: () => set({ isExpenseDrawerOpen: true, editingExpense: null }),
  openEditExpense: (expense) => set({ isExpenseDrawerOpen: true, editingExpense: expense }),
  closeExpenseDrawer: () => set({ isExpenseDrawerOpen: false, editingExpense: null }),

  isShoppingFocusMode: false,
  setShoppingFocusMode: (active) => set({ isShoppingFocusMode: active }),

  user: null as any,
  categories: [],
  cards: [],
  invoices: [],
  expenses: [],
  groceryItems: (() => {
    try {
      const saved = localStorage.getItem(GROCERY_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  })(),
  aiInsights: [],
  aiMessages: [],
  isAiResponding: false,
  iaConfig: {
    provedor: 'openai',
    modelo: 'gpt-4.1-mini',
    apiKeyCadastrada: true,
  },
  jointInfo: null,
  isLoadingData: false,

  loadApiData: async (token: string) => {
    if (!token) return;
    set({ isLoadingData: true });

    try {
      const comp = get().selectedCompetencia; // '2026-08'
      const [year, month] = comp.split('-');
      const lastDay = new Date(Number(year), Number(month), 0).getDate();
      const de = `${year}-${month}-01`;
      const ate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

      // 1. Fetch Categories, Credit Cards, Joint Accounts in parallel
      const [catsRes, cardsRes, jointRes] = await Promise.allSettled([
        api.getCategories(token),
        api.getCreditCards(token),
        api.getJointAccounts(token),
      ]);

      let categories: Categoria[] = [];
      if (catsRes.status === 'fulfilled' && catsRes.value) {
        const catData = Array.isArray(catsRes.value)
          ? catsRes.value
          : Array.isArray((catsRes.value as any)?.data)
          ? (catsRes.value as any).data
          : [];
        categories = catData.map((c: any) => ({
          ...c,
          iconName: c.iconName || '🏷️',
          cor: c.cor || c.color || '#10b981',
          color: c.cor || c.color || '#10b981',
          teto: c.teto !== undefined && c.teto !== null ? Number(c.teto) : null,
          orcamentoMensal: c.teto !== undefined && c.teto !== null ? Number(c.teto) : null,
        }));
      }
      set({ categories });

      let cards: CartaoCredito[] = [];
      if (cardsRes.status === 'fulfilled' && cardsRes.value) {
        const cardData = Array.isArray(cardsRes.value)
          ? cardsRes.value
          : Array.isArray((cardsRes.value as any)?.data)
          ? (cardsRes.value as any).data
          : [];
        cards = cardData.map((c: any) => normalizeCardFromApi(c));
      }
      set({ cards });

      let jointInfo: any = null;
      if (jointRes.status === 'fulfilled' && jointRes.value) {
        const jointList = Array.isArray(jointRes.value)
          ? jointRes.value
          : Array.isArray((jointRes.value as any)?.data)
          ? (jointRes.value as any).data
          : [];
        if (jointList.length > 0) {
          const acc = jointList[0];
          jointInfo = {
            id: acc.id,
            nomeConta: acc.nomeConta || 'Conta Conjunta',
            usuario1: { id: acc.usuario1Id, nome: acc.usuario1?.nome || 'Usuário 1' },
            usuario2: { id: acc.usuario2Id, nome: acc.usuario2?.nome || 'Usuário 2' },
            proporcaoDivisao: acc.proporcaoDivisao ?? 0.5,
            totalCompartilhadoMes: 0,
            totalPagoUsuario1: 0,
            totalPagoUsuario2: 0,
            saldoAjuste: { devedorId: '', credorId: '', valor: 0 },
          };
        }
      }
      set({ jointInfo });

      // 2. Fetch Expenses with current month filters
      const expensesRes = await api.getExpenses(token, { competencia: comp, de, ate });
      const rawGastos = expensesRes?.gastos || (Array.isArray(expensesRes) ? expensesRes : (Array.isArray(expensesRes?.data) ? expensesRes.data : []));

      const normalizedExpenses = (Array.isArray(rawGastos) ? rawGastos : []).map((g: any) =>
        normalizeGastoFromApi(g, categories, cards)
      );
      set({ expenses: normalizedExpenses });

      // Calculate real joint balance if account is active
      if (jointInfo) {
        const sharedInMonth = normalizedExpenses.filter(
          (g: any) => !g.naoCompartilhar && g.tipo === 'despesa' && g.status !== 'cancelado'
        );
        let totalU1 = 0;
        let totalU2 = 0;

        for (const exp of sharedInMonth) {
          if (exp.responsavelId === jointInfo.usuario1.id) {
            totalU1 += exp.valor;
          } else if (exp.responsavelId === jointInfo.usuario2.id) {
            totalU2 += exp.valor;
          } else {
            totalU1 += exp.valor;
          }
        }

        const totalCompartilhado = totalU1 + totalU2;
        const targetShareU1 = totalCompartilhado * (jointInfo.proporcaoDivisao ?? 0.5);
        const diff = totalU1 - targetShareU1;

        jointInfo.totalCompartilhadoMes = totalCompartilhado;
        jointInfo.totalPagoUsuario1 = totalU1;
        jointInfo.totalPagoUsuario2 = totalU2;
        jointInfo.saldoAjuste = {
          devedorId: diff > 0 ? jointInfo.usuario2.id : diff < 0 ? jointInfo.usuario1.id : '',
          credorId: diff > 0 ? jointInfo.usuario1.id : diff < 0 ? jointInfo.usuario2.id : '',
          valor: Math.abs(diff),
        };
      }
      set({ jointInfo });

      // 3. Fetch Invoices for cards
      let invoiceData: FaturaCartao[] = [];
      try {
        const invoicesRes = await api.getCreditCardInvoices(token);
        invoiceData = Array.isArray(invoicesRes)
          ? invoicesRes
          : Array.isArray((invoicesRes as any)?.data)
          ? (invoicesRes as any).data
          : [];
        set({ invoices: invoiceData });
      } catch {
        set({ invoices: [] });
      }

      // 4. Recalculate each Card's real available limit and invoice totals dynamically
      const updatedCards = cards.map((card) => {
        const limiteTotal = Number(card.valorLimite) || 0;

        // Sum unpaid invoices for this card
        const cardInvoicesTotal = invoiceData
          .filter(
            (inv) =>
              inv.cartaoCreditoId === card.id &&
              inv.status !== 'paga' &&
              inv.status !== 'cancelada'
          )
          .reduce((sum, inv) => sum + Number(inv.valorTotal || 0), 0);

        // Sum unpaid expenses directly linked to this card
        const cardExpensesTotal = normalizedExpenses
          .filter(
            (e: any) =>
              e.cartaoCreditoId === card.id &&
              e.tipo === 'despesa' &&
              e.status !== 'pago' &&
              e.status !== 'cancelado'
          )
          .reduce((sum: number, e: any) => sum + Number(e.valor || 0), 0);

        const faturaAtual = Math.max(cardInvoicesTotal, cardExpensesTotal);
        const limiteDisponivel = Math.max(0, limiteTotal - faturaAtual);

        return {
          ...card,
          faturaAtual,
          limiteDisponivel,
        };
      });
      set({ cards: updatedCards });

      // 5. Fetch IA Conversation History
      try {
        const historyRes = await api.getIaConversationHistory(token);
        const historyData = Array.isArray(historyRes)
          ? historyRes
          : Array.isArray((historyRes as any)?.data)
          ? (historyRes as any).data
          : [];
        if (historyData.length > 0) {
          const loadedMessages: AiMessage[] = [...historyData].reverse().flatMap((h: any) => [
            {
              id: `user-${h.id}`,
              role: 'user' as const,
              content: h.pergunta,
              timestamp: h.createdAt || new Date().toISOString(),
            },
            {
              id: `ai-${h.id}`,
              role: 'assistant' as const,
              content: h.resposta,
              timestamp: h.createdAt || new Date().toISOString(),
            },
          ]);
          set({ aiMessages: loadedMessages });
        } else {
          set({ aiMessages: [] });
        }
      } catch (err) {
        console.error('Erro ao carregar histórico da IA:', err);
        set({ aiMessages: [] });
      }
    } catch (err) {
      console.error('Erro ao consultar dados da base de dados:', err);
    } finally {
      set({ isLoadingData: false });
    }
  },

  getResumoCompetencia: () => {
    const { expenses, selectedCompetencia } = get();
    const filtered = expenses.filter((g) => {
      if (g.lancamentosBase && g.lancamentosBase.length > 0) {
        return g.lancamentosBase.some(
          (lb) =>
            (lb.competencia && lb.competencia.startsWith(selectedCompetencia)) ||
            (lb.dataVencimentoParcela && lb.dataVencimentoParcela.startsWith(selectedCompetencia)) ||
            (lb.faturaCartaoCompetencia && lb.faturaCartaoCompetencia.startsWith(selectedCompetencia))
        );
      }
      return (
        g.competencia.startsWith(selectedCompetencia) ||
        (g.dataVencimento && g.dataVencimento.startsWith(selectedCompetencia))
      );
    });

    let receitasTotal = 0;
    let receitasRecebidas = 0;
    let receitasPendentes = 0;
    let despesasTotal = 0;
    let despesasPagas = 0;
    let despesasPendentes = 0;
    let despesasAtrasadas = 0;

    const todayStr = new Date().toISOString().split('T')[0];

    filtered.forEach((item) => {
      const val = getEffectiveExpenseValue(item, selectedCompetencia);
      let relevantInstallment = undefined;
      if (item.lancamentosBase && item.lancamentosBase.length > 0) {
        relevantInstallment = item.lancamentosBase.find(
          (lb) =>
            (lb.competencia && lb.competencia.startsWith(selectedCompetencia)) ||
            (lb.dataVencimentoParcela && lb.dataVencimentoParcela.startsWith(selectedCompetencia)) ||
            (lb.faturaCartaoCompetencia && lb.faturaCartaoCompetencia.startsWith(selectedCompetencia))
        );
      }
      const effectiveStatus = relevantInstallment ? relevantInstallment.status : item.status;
      const effectiveDue = relevantInstallment ? relevantInstallment.dataVencimentoParcela : item.dataVencimento;

      if (item.tipo === 'receita') {
        receitasTotal += val;
        if (effectiveStatus === 'pago') receitasRecebidas += val;
        else receitasPendentes += val;
      } else {
        despesasTotal += val;
        if (effectiveStatus === 'pago') {
          despesasPagas += val;
        } else if (effectiveDue && effectiveDue < todayStr) {
          despesasAtrasadas += val;
        } else {
          despesasPendentes += val;
        }
      }
    });

    const saldoTotal = receitasTotal - despesasTotal;
    const economiaProjetada = Math.max(0, saldoTotal);
    const taxaPoupanca = receitasTotal > 0 ? Math.round((saldoTotal / receitasTotal) * 100) : 0;

    return {
      saldoTotal,
      receitasTotal,
      receitasRecebidas,
      receitasPendentes,
      despesasTotal,
      despesasPagas,
      despesasPendentes,
      despesasAtrasadas,
      economiaProjetada,
      taxaPoupanca,
    };
  },

  addExpense: async (expenseData) => {
    const token = localStorage.getItem('@NossoSaldo:token');
    if (token) {
      const payload: any = {
        descricao: expenseData.descricao,
        tipo: expenseData.tipo,
        status: expenseData.status || 'pendente',
        origemLancamento: expenseData.origemLancamento || 'unico',
        numeroParcelas: expenseData.numeroParcelas || 1,
        naoCompartilhar: !!expenseData.naoCompartilhar,
        valor: Number(expenseData.valor),
        categoriaId: expenseData.categoriaId,
        dataVencimento: expenseData.dataVencimento ? new Date(expenseData.dataVencimento).toISOString() : new Date().toISOString(),
      };

      if (expenseData.competencia) {
        payload.competencia = new Date(expenseData.competencia).toISOString();
      }
      if (expenseData.dataPagamento) {
        payload.dataPagamento = new Date(expenseData.dataPagamento).toISOString();
      }
      if (expenseData.observacao) {
        payload.observacao = expenseData.observacao;
      }
      if (expenseData.cartaoCreditoId) {
        payload.cartaoCreditoId = expenseData.cartaoCreditoId;
      }

      const created = await api.createExpense(token, payload);
      await get().loadApiData(token);
      return created;
    } else {
      const now = new Date().toISOString();
      const newExpense: Gasto = {
        ...expenseData,
        id: `gst-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        createdAt: now,
        updatedAt: now,
      };
      set((state) => ({ expenses: [newExpense, ...state.expenses] }));
    }
  },

  addInstallmentSeries: async (baseExpense, totalParcelas, valorPorParcela) => {
    const token = localStorage.getItem('@NossoSaldo:token');
    if (token) {
      const payload: any = {
        descricao: baseExpense.descricao,
        tipo: 'despesa',
        status: 'pendente',
        origemLancamento: 'parcelado',
        numeroParcelas: totalParcelas,
        naoCompartilhar: !!baseExpense.naoCompartilhar,
        valor: Number(baseExpense.valor),
        categoriaId: baseExpense.categoriaId,
        dataVencimento: baseExpense.dataVencimento ? new Date(baseExpense.dataVencimento).toISOString() : new Date().toISOString(),
      };

      if (baseExpense.cartaoCreditoId) {
        payload.cartaoCreditoId = baseExpense.cartaoCreditoId;
      }
      if (baseExpense.observacao) {
        payload.observacao = baseExpense.observacao;
      }

      await api.createExpense(token, payload);
      await get().loadApiData(token);
    } else {
      const baseDate = new Date(baseExpense.dataVencimento + 'T00:00:00');
      const now = new Date().toISOString();
      const parentId = `gst-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const childInstallments = Array.from({ length: totalParcelas }, (_, index) => {
        const num = index + 1;
        const dueDate = new Date(baseDate);
        dueDate.setMonth(baseDate.getMonth() + index);
        const dueStr = dueDate.toISOString().split('T')[0];
        const compStr = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-01`;

        return {
          id: `lb-${parentId}-${num}`,
          gastoId: parentId,
          descricao: `${baseExpense.descricao} - parcela ${num}/${totalParcelas}`,
          valorParcela: valorPorParcela,
          numeroParcela: num,
          dataVencimentoParcela: dueStr,
          status: 'pendente' as StatusGasto,
          competencia: compStr,
        };
      });

      const newParentExpense: Gasto = {
        ...baseExpense,
        id: parentId,
        origemLancamento: 'parcelado',
        numeroParcelas: totalParcelas,
        parcelaAtual: 1,
        status: 'pendente',
        lancamentosBase: childInstallments,
        createdAt: now,
        updatedAt: now,
      };

      set((state) => ({ expenses: [newParentExpense, ...state.expenses] }));
    }
  },

  updateExpense: async (id, updates) => {
    const token = localStorage.getItem('@NossoSaldo:token');
    if (token) {
      const payload: any = {};
      if (updates.descricao !== undefined) payload.descricao = updates.descricao;
      if (updates.tipo !== undefined) payload.tipo = updates.tipo;
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.origemLancamento !== undefined) payload.origemLancamento = updates.origemLancamento;
      if (updates.numeroParcelas !== undefined) payload.numeroParcelas = updates.numeroParcelas;
      if (updates.naoCompartilhar !== undefined) payload.naoCompartilhar = updates.naoCompartilhar;
      if (updates.valor !== undefined) payload.valor = Number(updates.valor);
      if (updates.competencia !== undefined) payload.competencia = updates.competencia ? new Date(updates.competencia).toISOString() : null;
      if (updates.dataVencimento !== undefined) payload.dataVencimento = updates.dataVencimento ? new Date(updates.dataVencimento).toISOString() : null;
      if (updates.dataPagamento !== undefined) payload.dataPagamento = updates.dataPagamento ? new Date(updates.dataPagamento).toISOString() : null;
      if (updates.observacao !== undefined) payload.observacao = updates.observacao;
      if (updates.categoriaId !== undefined) payload.categoriaId = updates.categoriaId;
      if (updates.cartaoCreditoId !== undefined) payload.cartaoCreditoId = updates.cartaoCreditoId || null;

      await api.updateExpense(token, id, payload);
      await get().loadApiData(token);
    } else {
      set((state) => ({
        expenses: state.expenses.map((e) => (e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e)),
      }));
    }
  },

  deleteExpense: async (id) => {
    const token = localStorage.getItem('@NossoSaldo:token');
    if (token) {
      await api.deleteExpense(token, id);
      await get().loadApiData(token);
    } else {
      set((state) => ({
        expenses: state.expenses.filter((e) => e.id !== id),
      }));
    }
  },

  toggleExpenseStatus: async (id) => {
    const expense = get().expenses.find((e) => e.id === id);
    if (!expense) return;

    const nextStatus: StatusGasto = expense.status === 'pago' ? 'pendente' : 'pago';
    const token = localStorage.getItem('@NossoSaldo:token');
    if (token) {
      if (nextStatus === 'pago') {
        await api.payExpense(token, id, { dataPagamento: new Date().toISOString() });
      } else {
        await api.reopenExpense(token, id);
      }
      await get().loadApiData(token);
    } else {
      const now = new Date().toISOString().split('T')[0];
      set((state) => ({
        expenses: state.expenses.map((e) =>
          e.id === id
            ? {
                ...e,
                status: nextStatus,
                dataPagamento: nextStatus === 'pago' ? now : undefined,
                updatedAt: new Date().toISOString(),
              }
            : e
        ),
      }));
    }
  },

  toggleInstallmentStatus: async (gastoId: string, installmentId: string) => {
    const expense = get().expenses.find((e) => e.id === gastoId);
    const installment = expense?.lancamentosBase?.find((lb) => lb.id === installmentId);
    const nextStatus: StatusGasto = installment?.status === 'pago' ? 'pendente' : 'pago';
    const now = new Date().toISOString().split('T')[0];

    // Optimistically update local state
    set((state) => ({
      expenses: state.expenses.map((e) => {
        if (e.id !== gastoId) return e;
        const updatedLancamentos = (e.lancamentosBase || []).map((lb) => {
          if (lb.id !== installmentId) return lb;
          return {
            ...lb,
            status: nextStatus,
            dataPagamentoParcela: nextStatus === 'pago' ? now : undefined,
          };
        });
        const allPaid = updatedLancamentos.length > 0 && updatedLancamentos.every((lb) => lb.status === 'pago');
        return {
          ...e,
          status: allPaid ? 'pago' : 'pendente',
          dataPagamento: allPaid ? now : undefined,
          lancamentosBase: updatedLancamentos,
          updatedAt: new Date().toISOString(),
        };
      }),
    }));

    const token = localStorage.getItem('@NossoSaldo:token');
    if (token) {
      try {
        if (nextStatus === 'pago') {
          await api.payInstallment(token, installmentId, { dataPagamento: new Date().toISOString() });
        } else {
          await api.reopenInstallment(token, installmentId);
        }
        await get().loadApiData(token);
      } catch (err) {
        console.error('Erro ao atualizar status da parcela na API:', err);
        await get().loadApiData(token);
      }
    }
  },

  batchToggleStatus: async (ids, targetStatus) => {
    const now = new Date().toISOString().split('T')[0];
    set((state) => ({
      expenses: state.expenses.map((e) =>
        ids.includes(e.id)
          ? {
              ...e,
              status: targetStatus,
              dataPagamento: targetStatus === 'pago' ? now : undefined,
              updatedAt: new Date().toISOString(),
            }
          : e
      ),
    }));

    const token = localStorage.getItem('@NossoSaldo:token');
    if (token) {
      for (const id of ids) {
        try {
          if (targetStatus === 'pago') {
            await api.payExpense(token, id, { dataPagamento: new Date().toISOString() });
          } else {
            await api.reopenExpense(token, id);
          }
        } catch {
          // Continue
        }
      }
      await get().loadApiData(token);
    }
  },

  batchDeleteExpenses: async (ids) => {
    set((state) => ({
      expenses: state.expenses.filter((e) => !ids.includes(e.id)),
    }));

    const token = localStorage.getItem('@NossoSaldo:token');
    if (token) {
      for (const id of ids) {
        try {
          await api.deleteExpense(token, id);
        } catch {
          // Continue
        }
      }
      await get().loadApiData(token);
    }
  },

  payInvoice: async (invoiceId) => {
    const now = new Date().toISOString().split('T')[0];
    set((state) => ({
      invoices: state.invoices.map((inv) =>
        inv.id === invoiceId ? { ...inv, status: 'paga' as const, dataPagamento: now } : inv
      ),
    }));

    const token = localStorage.getItem('@NossoSaldo:token');
    if (token) {
      try {
        await api.payCreditCardInvoice(token, invoiceId, { dataPagamento: new Date().toISOString() });
        await get().loadApiData(token);
      } catch (err) {
        console.error('Erro ao pagar fatura na API:', err);
        throw err;
      }
    }
  },

  reopenInvoice: async (invoiceId) => {
    set((state) => ({
      invoices: state.invoices.map((inv) =>
        inv.id === invoiceId ? { ...inv, status: 'aberta' as const, dataPagamento: undefined } : inv
      ),
    }));

    const token = localStorage.getItem('@NossoSaldo:token');
    if (token) {
      try {
        await api.reopenCreditCardInvoice(token, invoiceId);
        await get().loadApiData(token);
      } catch (err) {
        console.error('Erro ao reabrir fatura na API:', err);
        throw err;
      }
    }
  },

  addCard: async (cardData) => {
    const newCard: CartaoCredito = {
      ...cardData,
      id: `crd-${Date.now()}`,
    };
    set((state) => ({ cards: [...state.cards, newCard] }));

    const token = localStorage.getItem('@NossoSaldo:token');
    if (token) {
      try {
        await api.createCreditCard(token, cardData);
        await get().loadApiData(token);
      } catch (err) {
        console.error('Erro ao criar cartão na API:', err);
      }
    }
  },

  updateCard: async (id, updates) => {
    set((state) => ({
      cards: state.cards.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));

    const token = localStorage.getItem('@NossoSaldo:token');
    if (token) {
      try {
        await api.updateCreditCard(token, id, updates);
        await get().loadApiData(token);
      } catch (err) {
        console.error('Erro ao atualizar cartão na API:', err);
      }
    }
  },

  deleteCard: async (id) => {
    set((state) => ({
      cards: state.cards.filter((c) => c.id !== id),
    }));
  },

  addCategory: async (categoryData) => {
    const corValue = categoryData.cor || categoryData.color || '#10b981';
    const tetoValue = categoryData.teto !== undefined ? categoryData.teto : categoryData.orcamentoMensal;
    const newCat: Categoria = {
      ...categoryData,
      id: `cat-${Date.now()}`,
      color: corValue,
      cor: corValue,
      teto: tetoValue,
      orcamentoMensal: tetoValue,
    };
    set((state) => ({ categories: [...state.categories, newCat] }));

    const token = localStorage.getItem('@NossoSaldo:token');
    if (token) {
      try {
        await api.createCategory(token, {
          descricao: categoryData.descricao,
          iconName: categoryData.iconName || '🏷️',
          cor: corValue,
          teto: tetoValue,
          orcamentoMensal: tetoValue,
        });
        await get().loadApiData(token);
      } catch (err) {
        console.error('Erro ao criar categoria na API:', err);
      }
    }
  },

  updateCategory: async (id, updates) => {
    const corValue = updates.cor || updates.color;
    const tetoValue = updates.teto !== undefined ? updates.teto : updates.orcamentoMensal;
    set((state) => ({
      categories: state.categories.map((c) =>
        c.id === id
          ? {
              ...c,
              ...updates,
              color: corValue || c.color || c.cor || '#10b981',
              cor: corValue || c.cor || c.color || '#10b981',
              teto: tetoValue !== undefined ? tetoValue : c.teto,
              orcamentoMensal: tetoValue !== undefined ? tetoValue : c.orcamentoMensal,
            }
          : c
      ),
    }));

    const token = localStorage.getItem('@NossoSaldo:token');
    if (token) {
      try {
        await api.updateCategory(token, id, {
          descricao: updates.descricao,
          iconName: updates.iconName,
          cor: corValue,
          teto: tetoValue,
          orcamentoMensal: tetoValue,
        });
        await get().loadApiData(token);
      } catch (err) {
        console.error('Erro ao atualizar categoria na API:', err);
      }
    }
  },

  deleteCategory: async (id) => {
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
    }));

    const token = localStorage.getItem('@NossoSaldo:token');
    if (token) {
      try {
        await api.deleteCategory(token, id);
        await get().loadApiData(token);
      } catch (err) {
        console.error('Erro ao excluir categoria na API:', err);
      }
    }
  },

  addGroceryItem: (item) => {
    const newItem: SupermarketItem = {
      ...item,
      id: `groc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    set((state) => {
      const next = [newItem, ...state.groceryItems];
      localStorage.setItem(GROCERY_STORAGE_KEY, JSON.stringify(next));
      return { groceryItems: next };
    });
  },

  addMultipleGroceryItems: (items) => {
    const newItems: SupermarketItem[] = items.map((item, idx) => ({
      ...item,
      id: `groc-${Date.now()}-${idx}`,
    }));
    set((state) => {
      const next = [...newItems, ...state.groceryItems];
      localStorage.setItem(GROCERY_STORAGE_KEY, JSON.stringify(next));
      return { groceryItems: next };
    });
  },

  toggleGroceryItemCart: (id) => {
    set((state) => {
      const next = state.groceryItems.map((item) =>
        item.id === id ? { ...item, noCarrinho: !item.noCarrinho } : item
      );
      localStorage.setItem(GROCERY_STORAGE_KEY, JSON.stringify(next));
      return { groceryItems: next };
    });
  },

  updateGroceryItem: (id, updates) => {
    set((state) => {
      const next = state.groceryItems.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      );
      localStorage.setItem(GROCERY_STORAGE_KEY, JSON.stringify(next));
      return { groceryItems: next };
    });
  },

  deleteGroceryItem: (id) => {
    set((state) => {
      const next = state.groceryItems.filter((item) => item.id !== id);
      localStorage.setItem(GROCERY_STORAGE_KEY, JSON.stringify(next));
      return { groceryItems: next };
    });
  },

  clearPurchasedGroceries: () => {
    set((state) => {
      const next = state.groceryItems.filter((i) => !i.noCarrinho);
      localStorage.setItem(GROCERY_STORAGE_KEY, JSON.stringify(next));
      return { groceryItems: next };
    });
  },

  convertGroceryListToExpense: async (cardId) => {
    const { groceryItems, categories, addExpense } = get();
    const purchased = groceryItems.filter((i) => i.noCarrinho);
    if (purchased.length === 0) return;

    const total = purchased.reduce(
      (sum, item) => sum + (item.precoReal || item.precoEstimado) * item.quantidade,
      0
    );

    const supermarketCat = categories.find((c) =>
      c.descricao.toLowerCase().includes('supermercado')
    ) || categories[0];

    const todayStr = new Date().toISOString().split('T')[0];
    const compStr = `${todayStr.substring(0, 7)}-01`;

    await addExpense({
      descricao: `Supermercado (${purchased.length} itens)`,
      valor: total,
      tipo: 'despesa',
      status: cardId ? 'pendente' : 'pago',
      origemLancamento: 'unico',
      numeroParcelas: 1,
      competencia: compStr,
      dataVencimento: todayStr,
      dataPagamento: cardId ? undefined : todayStr,
      categoriaId: supermarketCat?.id || '',
      responsavelId: '',
      responsavelNome: 'Usuário',
      cartaoCreditoId: cardId,
      naoCompartilhar: false,
      observacao: `Itens: ${purchased.map((i) => `${i.nome} (${i.quantidade} ${i.unidade})`).join(', ')}`,
    });

    get().clearPurchasedGroceries();
  },

  sendAiUserMessage: async (content: string) => {
    const userMsg: AiMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    set((state) => ({ aiMessages: [...state.aiMessages, userMsg], isAiResponding: true }));

    const token = localStorage.getItem('@NossoSaldo:token');
    if (token) {
      try {
        const response = await api.askIa(token, content);
        const botMsg: AiMessage = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: response?.resposta || 'Análise financeira processada com sucesso.',
          timestamp: new Date().toISOString(),
        };
        set((state) => ({ aiMessages: [...state.aiMessages, botMsg], isAiResponding: false }));

        if (response?.acaoRealizada) {
          get().loadApiData(token).catch(console.error);
        }
        return;
      } catch (err: any) {
        console.error('Erro ao consultar IA:', err);
        const errorMsg: AiMessage = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: err.message || 'Desculpe, ocorreu uma falha ao comunicar com o provedor de IA. Verifique sua chave de API nas configurações.',
          timestamp: new Date().toISOString(),
        };
        set((state) => ({ aiMessages: [...state.aiMessages, errorMsg], isAiResponding: false }));
        return;
      }
    }

    // Dynamic response generator simulation
    setTimeout(() => {
      const lower = content.toLowerCase();
      let reply = 'Analisei seus dados financeiros e está tudo dentro do planejado!';

      if (lower.includes('supermercado') || lower.includes('mercado')) {
        reply = 'Neste mês de referência, os gastos com Supermercado & Feira somam R$ 684,30, representando 23% do orçamento familiar.';
      } else if (lower.includes('fatura') || lower.includes('cartão')) {
        reply = 'Seu cartão Nubank Ultravioleta tem o melhor ciclo de fechamento para hoje. Compras realizadas agora entram apenas na fatura de Setembro.';
      } else if (lower.includes('taxa') || lower.includes('poupança') || lower.includes('sobra')) {
        reply = 'A taxa de poupança atual do casal está em 44%, com um superávit projetado de R$ 4.706,40.';
      }

      const botMsg: AiMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
      };
      set((state) => ({ aiMessages: [...state.aiMessages, botMsg], isAiResponding: false }));
    }, 600);
  },

  clearAiConversation: async () => {
    set({ aiMessages: [] });
    const token = localStorage.getItem('@NossoSaldo:token');
    if (token) {
      try {
        await api.clearIaConversationHistory(token);
      } catch (err) {
        console.error('Erro ao limpar histórico de IA no backend:', err);
      }
    }
  },

  applyAiExpenseDraft: async (draft) => {
    const { categories, cards, addExpense } = get();
    const cat = categories.find((c) =>
      c.descricao.toLowerCase().includes(draft.categoriaNome?.toLowerCase() || '')
    ) || categories[0];

    const card = cards.find((c) =>
      c.descricao.toLowerCase().includes(draft.cartaoNome?.toLowerCase() || '')
    );

    const todayStr = draft.dataVencimento || new Date().toISOString().split('T')[0];
    const compStr = `${todayStr.substring(0, 7)}-01`;

    await addExpense({
      descricao: draft.descricao,
      valor: draft.valor,
      tipo: draft.tipo,
      status: 'pendente',
      origemLancamento: (draft.numeroParcelas && draft.numeroParcelas > 1) ? 'parcelado' : 'unico',
      numeroParcelas: draft.numeroParcelas || 1,
      competencia: compStr,
      dataVencimento: todayStr,
      categoriaId: cat?.id || '',
      responsavelId: '',
      responsavelNome: 'Usuário',
      cartaoCreditoId: card?.id,
      naoCompartilhar: false,
    });
  },

  updateIaConfig: (config) => {
    set((state) => ({ iaConfig: { ...state.iaConfig, ...config } }));
  },

  resetStore: () => {
    set({
      categories: [],
      cards: [],
      invoices: [],
      expenses: [],
      aiMessages: [],
      aiInsights: [],
      jointInfo: null,
      editingExpense: null,
      isExpenseDrawerOpen: false,
      groceryItems: [],
    });
  },
}));
