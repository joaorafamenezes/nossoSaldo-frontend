import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | undefined | null): string {
  const val = typeof value === 'number' && !isNaN(value) ? value : Number(value) || 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(val);
}

export function formatShortCurrency(value: number | undefined | null): string {
  const val = typeof value === 'number' && !isNaN(value) ? value : Number(value) || 0;
  if (Math.abs(val) >= 1000000) {
    return `R$ ${(val / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(val) >= 1000) {
    return `R$ ${(val / 1000).toFixed(1)}k`;
  }
  return formatCurrency(val);
}

export function formatDate(dateString?: string): string {
  if (!dateString) return '';
  const cleanDate = dateString.split('T')[0];
  const parts = cleanDate.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateString;
}

export function formatShortDate(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString.split('T')[0] + 'T00:00:00');
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(date).replace('.', '');
}

export const MONTH_NAMES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const MONTH_ABBR_PT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

export function getCurrentCompetencia(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function parseCompetencia(competencia: string): { year: number; month: number } {
  if (!competencia) {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  }
  const parts = competencia.split('-');
  return {
    year: parseInt(parts[0], 10) || new Date().getFullYear(),
    month: parseInt(parts[1], 10) || 1,
  };
}

export function formatCompetencia(year: number, month: number): string {
  const safeMonth = Math.max(1, Math.min(12, month));
  return `${year}-${String(safeMonth).padStart(2, '0')}`;
}

export function shiftCompetencia(competencia: string, deltaMonths: number): string {
  const { year, month } = parseCompetencia(competencia);
  const totalMonths = year * 12 + (month - 1) + deltaMonths;
  const newYear = Math.floor(totalMonths / 12);
  const newMonth = (totalMonths % 12) + 1;
  return formatCompetencia(newYear, newMonth);
}

export function getPreviousCompetencia(competencia: string): string {
  return shiftCompetencia(competencia, -1);
}

export function getNextCompetencia(competencia: string): string {
  return shiftCompetencia(competencia, 1);
}

export function getCompetenciaDisplay(competencia: string): string {
  if (!competencia) return '';
  const { year, month } = parseCompetencia(competencia);
  return `${MONTH_NAMES_PT[month - 1]} de ${year}`;
}

export function getCompetenciaShort(competencia: string): string {
  if (!competencia) return '';
  const { year, month } = parseCompetencia(competencia);
  return `${MONTH_ABBR_PT[month - 1]}/${String(year).slice(-2)}`;
}

export function isCurrentCompetencia(competencia: string): boolean {
  return competencia === getCurrentCompetencia();
}

export function getDaysDifference(targetDateStr: string): number {
  const clean = targetDateStr.split('T')[0];
  const target = new Date(clean + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Retorna o valor efetivo de um lançamento para a competência ou período selecionado.
 * Para gastos parcelados, retorna o valor da parcela mensal correspondente em vez do valor total do contrato.
 */
export function getEffectiveExpenseValue(
  expense: {
    valor?: number;
    origemLancamento?: string;
    numeroParcelas?: number;
    lancamentosBase?: Array<{
      valorParcela?: number;
      competencia?: string;
      dataVencimentoParcela?: string;
      faturaCartaoCompetencia?: string;
    }>;
  },
  selectedCompetencia?: string,
  startDate?: string,
  endDate?: string
): number {
  if (!expense) return 0;

  const isParcelado =
    expense.origemLancamento === 'parcelado' ||
    (expense.lancamentosBase && expense.lancamentosBase.length > 0) ||
    ((expense.numeroParcelas || 0) > 1);

  if (!isParcelado) {
    return expense.valor || 0;
  }

  // Se possui lista de parcelas filhas
  if (expense.lancamentosBase && expense.lancamentosBase.length > 0) {
    if (startDate || endDate) {
      const match = expense.lancamentosBase.find((lb) => {
        const d = lb.dataVencimentoParcela ? lb.dataVencimentoParcela.split('T')[0] : '';
        return (!startDate || d >= startDate) && (!endDate || d <= endDate);
      });
      if (match && typeof match.valorParcela === 'number') {
        return match.valorParcela;
      }
    } else if (selectedCompetencia) {
      const match = expense.lancamentosBase.find(
        (lb) =>
          (lb.competencia && lb.competencia.startsWith(selectedCompetencia)) ||
          (lb.dataVencimentoParcela && lb.dataVencimentoParcela.startsWith(selectedCompetencia)) ||
          (lb.faturaCartaoCompetencia && lb.faturaCartaoCompetencia.startsWith(selectedCompetencia))
      );
      if (match && typeof match.valorParcela === 'number') {
        return match.valorParcela;
      }
    }

    // Fallback para o valor da primeira parcela cadastrada
    const firstInst = expense.lancamentosBase[0];
    if (firstInst && typeof firstInst.valorParcela === 'number') {
      return firstInst.valorParcela;
    }
  }

  // Se não tiver lancamentosBase carregados mas for parcelado por numeroParcelas
  if (expense.numeroParcelas && expense.numeroParcelas > 1) {
    return (expense.valor || 0) / expense.numeroParcelas;
  }

  return expense.valor || 0;
}

export interface EffectiveExpenseStatus {
  effectiveStatus: 'pendente' | 'pago' | 'atrasado' | 'cancelado';
  effectiveDueDate: string;
  isPaid: boolean;
  isOverdue: boolean;
  daysDiff: number;
}

/**
 * Retorna a data de vencimento efetiva de um lançamento para a competência selecionada.
 * Para gastos recorrentes, calcula dinamicamente o dia de vencimento no mês da competência (ex: tratando meses de 28/29/30/31 dias).
 */
export function getEffectiveExpenseDueDate(
  expense: {
    dataVencimento?: string;
    origemLancamento?: string;
    dataInicioRecorrencia?: string;
    lancamentosBase?: Array<{
      dataVencimentoParcela?: string;
      competencia?: string;
      faturaCartaoCompetencia?: string;
    }>;
  },
  selectedCompetencia?: string
): string {
  if (!expense) return '';

  if (expense.origemLancamento === 'recorrente' && selectedCompetencia) {
    const match = expense.lancamentosBase?.find(
      (lb) =>
        (lb.competencia && lb.competencia.startsWith(selectedCompetencia)) ||
        (lb.dataVencimentoParcela && lb.dataVencimentoParcela.startsWith(selectedCompetencia))
    );
    if (match?.dataVencimentoParcela) {
      return match.dataVencimentoParcela.split('T')[0];
    }

    const baseDate = (expense.dataVencimento || expense.dataInicioRecorrencia || '2026-01-01').split('T')[0];
    const baseDay = parseInt(baseDate.split('-')[2] || '1', 10);
    const [y, m] = selectedCompetencia.split('-');
    if (y && m) {
      const maxDays = new Date(Number(y), Number(m), 0).getDate();
      const targetDay = Math.min(baseDay, maxDays);
      return `${y}-${m}-${String(targetDay).padStart(2, '0')}`;
    }
  }

  if (expense.lancamentosBase && expense.lancamentosBase.length > 0 && selectedCompetencia) {
    const match = expense.lancamentosBase.find(
      (lb) =>
        (lb.competencia && lb.competencia.startsWith(selectedCompetencia)) ||
        (lb.dataVencimentoParcela && lb.dataVencimentoParcela.startsWith(selectedCompetencia)) ||
        (lb.faturaCartaoCompetencia && lb.faturaCartaoCompetencia.startsWith(selectedCompetencia))
    );
    if (match?.dataVencimentoParcela) {
      return match.dataVencimentoParcela.split('T')[0];
    }
  }

  return (expense.dataVencimento || '').split('T')[0];
}

/**
 * Retorna o status efetivo, data de vencimento efetiva e indicador de atraso para o mês/período.
 * Para gastos parcelados e recorrentes, avalia a ocorrência do mês correspondente em vez de travar no registro pai.
 */
export function getEffectiveExpenseStatus(
  expense: {
    status: 'pendente' | 'pago' | 'atrasado' | 'cancelado' | string;
    dataVencimento: string;
    origemLancamento?: string;
    competencia?: string;
    dataInicioRecorrencia?: string;
    dataPagamento?: string;
    lancamentosBase?: Array<{
      status: 'pendente' | 'pago' | 'atrasado' | 'cancelado' | string;
      dataVencimentoParcela?: string;
      competencia?: string;
      faturaCartaoCompetencia?: string;
    }>;
  },
  selectedCompetencia?: string,
  startDate?: string,
  endDate?: string
): EffectiveExpenseStatus {
  if (!expense) {
    return {
      effectiveStatus: 'pendente',
      effectiveDueDate: '',
      isPaid: false,
      isOverdue: false,
      daysDiff: 0,
    };
  }

  let relevantInstallment:
    | {
        status: 'pendente' | 'pago' | 'atrasado' | 'cancelado' | string;
        dataVencimentoParcela?: string;
        competencia?: string;
        faturaCartaoCompetencia?: string;
      }
    | undefined = undefined;

  if (expense.lancamentosBase && expense.lancamentosBase.length > 0) {
    if (startDate || endDate) {
      relevantInstallment = expense.lancamentosBase.find((lb) => {
        const d = lb.dataVencimentoParcela ? lb.dataVencimentoParcela.split('T')[0] : '';
        return (!startDate || d >= startDate) && (!endDate || d <= endDate);
      });
    } else if (selectedCompetencia) {
      relevantInstallment = expense.lancamentosBase.find(
        (lb) =>
          (lb.competencia && lb.competencia.startsWith(selectedCompetencia)) ||
          (lb.dataVencimentoParcela && lb.dataVencimentoParcela.startsWith(selectedCompetencia)) ||
          (lb.faturaCartaoCompetencia && lb.faturaCartaoCompetencia.startsWith(selectedCompetencia))
      );
    }

    if (!relevantInstallment && expense.origemLancamento !== 'recorrente') {
      // Se não encontrou para a competência selecionada e não for recorrente, busca a próxima parcela
      const nextPending = expense.lancamentosBase.find((lb) => lb.status !== 'pago');
      if (nextPending) {
        relevantInstallment = nextPending;
      } else {
        relevantInstallment = expense.lancamentosBase[expense.lancamentosBase.length - 1];
      }
    }
  }

  let effectiveDueDate = '';
  let rawStatus = expense.status;

  if (relevantInstallment) {
    rawStatus = relevantInstallment.status;
    effectiveDueDate = (relevantInstallment.dataVencimentoParcela || '').split('T')[0];
  } else if (expense.origemLancamento === 'recorrente') {
    effectiveDueDate = getEffectiveExpenseDueDate(expense, selectedCompetencia);
    // Para despesa recorrente sem registro na competência selecionada:
    // Se a competência selecionada for diferente da competência de criação onde foi pago, inicia como pendente
    const isCreationMonth = expense.competencia && selectedCompetencia && expense.competencia.startsWith(selectedCompetencia);
    rawStatus = isCreationMonth ? expense.status : 'pendente';
  } else {
    effectiveDueDate = (expense.dataVencimento || '').split('T')[0];
  }

  const effectiveStatus = (rawStatus || 'pendente') as 'pendente' | 'pago' | 'atrasado' | 'cancelado';
  const isPaid = effectiveStatus === 'pago';
  const daysDiff = effectiveDueDate ? getDaysDifference(effectiveDueDate) : 0;
  const isOverdue = !isPaid && daysDiff < 0;

  return {
    effectiveStatus: isOverdue ? 'atrasado' : effectiveStatus,
    effectiveDueDate,
    isPaid,
    isOverdue,
    daysDiff,
  };
}

/**
 * Retorna todos os meses (formato YYYY-MM) compreendidos em um intervalo de datas YYYY-MM-DD.
 */
export function getMonthsBetweenDates(startDate: string, endDate: string): string[] {
  const cleanStart = startDate.split('T')[0];
  const cleanEnd = endDate.split('T')[0];
  const [startYear, startMonth] = cleanStart.split('-').map(Number);
  const [endYear, endMonth] = cleanEnd.split('-').map(Number);

  if (!startYear || !startMonth || !endYear || !endMonth) {
    return [cleanStart.substring(0, 7) || cleanEnd.substring(0, 7)];
  }

  const months: string[] = [];
  let currentYear = startYear;
  let currentMonth = startMonth;

  while (
    currentYear < endYear ||
    (currentYear === endYear && currentMonth <= endMonth)
  ) {
    months.push(`${currentYear}-${String(currentMonth).padStart(2, '0')}`);
    currentMonth += 1;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear += 1;
    }
  }

  return months.length > 0 ? months : [cleanStart.substring(0, 7)];
}

/**
 * Filtra e deduplica lançamentos para a competência ou intervalo de datas selecionado.
 * Para séries recorrentes que possuem múltiplos registros legados ou instâncias físicas no banco,
 * garante que apareça EXATAMENTE 1 ocorrência por série em cada mês do período filtrado.
 */
export function getExpensesForCompetence<T extends {
  id: string;
  competencia?: string;
  dataVencimento?: string;
  origemLancamento?: string;
  recorrenciaPaiId?: string;
  dataInicioRecorrencia?: string;
  dataFimRecorrencia?: string;
  descricao?: string;
  categoriaId?: string;
  responsavelId?: string;
  lancamentosBase?: Array<{
    competencia?: string;
    dataVencimentoParcela?: string;
    faturaCartaoCompetencia?: string;
  }>;
}>(
  expenses: T[],
  selectedCompetencia: string,
  startDate?: string,
  endDate?: string
): T[] {
  const nonRecurring: T[] = [];
  const recurringBySeries = new Map<string, T[]>();

  // 1. Separa lançamentos comuns e agrupa ocorrências da mesma série recorrente
  for (const item of expenses) {
    if (item.origemLancamento !== 'recorrente') {
      let matches = false;

      let relevantInstallment = undefined;
      if (item.lancamentosBase && item.lancamentosBase.length > 0) {
        if (startDate || endDate) {
          relevantInstallment = item.lancamentosBase.find((lb) => {
            const d = lb.dataVencimentoParcela ? lb.dataVencimentoParcela.split('T')[0] : '';
            return (!startDate || d >= startDate) && (!endDate || d <= endDate);
          });
        } else {
          relevantInstallment = item.lancamentosBase.find(
            (lb) =>
              (lb.competencia && lb.competencia.startsWith(selectedCompetencia)) ||
              (lb.dataVencimentoParcela && lb.dataVencimentoParcela.startsWith(selectedCompetencia)) ||
              (lb.faturaCartaoCompetencia && lb.faturaCartaoCompetencia.startsWith(selectedCompetencia))
          );
        }
      }

      if (startDate || endDate) {
        const itemDueDate = getEffectiveExpenseDueDate(item, selectedCompetencia);
        if ((!startDate || itemDueDate >= startDate) && (!endDate || itemDueDate <= endDate)) {
          matches = true;
        }
      } else {
        if (
          (item.competencia && item.competencia.startsWith(selectedCompetencia)) ||
          (item.dataVencimento && item.dataVencimento.startsWith(selectedCompetencia)) ||
          !!relevantInstallment
        ) {
          matches = true;
        }
      }

      if (matches) {
        nonRecurring.push(item);
      }
    } else {
      const descClean = (item.descricao || '').trim().toLowerCase();
      const seriesKey = item.recorrenciaPaiId || `rec_${descClean}_${item.categoriaId || ''}_${item.responsavelId || ''}`;
      const group = recurringBySeries.get(seriesKey) || [];
      group.push(item);
      recurringBySeries.set(seriesKey, group);
    }
  }

  // 2. Determina os meses-alvo da consulta
  const targetMonths = (startDate && endDate)
    ? getMonthsBetweenDates(startDate, endDate)
    : [selectedCompetencia || (startDate ? startDate.substring(0, 7) : '2026-09')];

  const recurringResult: T[] = [];

  // 3. Para cada série recorrente, projeta no máximo 1 ocorrência por mês do período
  for (const [, seriesItems] of recurringBySeries.entries()) {
    const startMonth = (
      seriesItems.find((i) => i.dataInicioRecorrencia)?.dataInicioRecorrencia ||
      seriesItems[0]?.competencia ||
      seriesItems[0]?.dataVencimento ||
      ''
    ).substring(0, 7);

    const endMonth = seriesItems.find((i) => i.dataFimRecorrencia)?.dataFimRecorrencia?.substring(0, 7) || null;

    for (const targetMonth of targetMonths) {
      // Verifica se a série está ativa neste mês
      const isActive = (!startMonth || targetMonth >= startMonth) && (!endMonth || targetMonth <= endMonth);
      if (!isActive) continue;

      // Busca o registro físico correspondente àquele mês específico (se houver)
      const exactMonthItem = seriesItems.find(
        (i) =>
          (i.competencia && i.competencia.startsWith(targetMonth)) ||
          (i.dataVencimento && i.dataVencimento.startsWith(targetMonth))
      );

      // Prioriza o registro cadastrado para este mês ou usa o item mais recente/modelo da série
      const chosenItem = exactMonthItem || seriesItems[seriesItems.length - 1] || seriesItems[0];
      if (!chosenItem) continue;

      // Calcula a data de vencimento efetiva para este mês
      const effectiveDueDate = getEffectiveExpenseDueDate(chosenItem, targetMonth);

      // Se houver filtro de data (ex: quinzena ou personalizado), valida se a data no mês cai no intervalo
      if (startDate && effectiveDueDate < startDate) continue;
      if (endDate && effectiveDueDate > endDate) continue;

      // Emite exatamente 1 ocorrência para este mês
      recurringResult.push(chosenItem);
    }
  }

  return [...nonRecurring, ...recurringResult];
}

/**
 * Calcula dinamicamente o valor da fatura atual e o limite disponível de um cartão de crédito.
 * Regra:
 * - A fatura atual e faturas passadas em aberto comprometem o limite.
 * - Futuras parcelas de compras parceladas (origemLancamento === 'parcelado') comprometem o limite em aberto.
 * - Gastos recorrentes (assinaturas contínuas) comprometem o limite APENAS no mês vigente/fatura atual,
 *   NÃO ocupando o limite em meses futuros antecipadamente.
 */
export function calculateCardAvailableLimit(
  card: {
    id: string;
    valorLimite?: number;
    limiteTotal?: number;
  },
  invoices: Array<{
    cartaoCreditoId?: string;
    competencia: string;
    valorTotal?: number;
    status: string;
  }>,
  expenses: Array<{
    cartaoCreditoId?: string;
    tipo?: string;
    status?: string;
    valor?: number;
    competencia?: string;
    dataVencimento?: string;
    origemLancamento?: string;
    lancamentosBase?: Array<{
      competencia?: string;
      dataVencimentoParcela?: string;
      valorParcela?: number;
      status?: string;
    }>;
  }>,
  currentCompetencia: string
): { faturaAtual: number; limiteDisponivel: number } {
  const limiteTotal = Number(card.valorLimite || (card as any).limiteTotal || 0);

  // 1. Fatura da competência atual
  const currentInvoice = invoices.find(
    (inv) =>
      inv.cartaoCreditoId === card.id &&
      inv.competencia === currentCompetencia
  ) || invoices.find(
    (inv) =>
      inv.cartaoCreditoId === card.id &&
      (inv.status === 'aberta' || inv.status === 'fechada') &&
      inv.competencia <= currentCompetencia
  );

  // Despesas diretas vinculadas ao cartão no mês atual
  const currentMonthExpenses = expenses
    .filter(
      (e) =>
        e.cartaoCreditoId === card.id &&
        e.tipo === 'despesa' &&
        e.status !== 'pago' &&
        e.status !== 'cancelado' &&
        (e.competencia?.startsWith(currentCompetencia) || e.dataVencimento?.startsWith(currentCompetencia))
    )
    .reduce((sum, e) => sum + Number(e.valor || 0), 0);

  const faturaAtual = currentInvoice ? Number(currentInvoice.valorTotal || 0) : currentMonthExpenses;

  // 2. Faturas em aberto até a competência atual (fatura atual + eventuais faturas passadas não pagas)
  const faturasPassadasEAtualAbertas = invoices
    .filter(
      (inv) =>
        inv.cartaoCreditoId === card.id &&
        inv.status !== 'paga' &&
        inv.status !== 'cancelada' &&
        inv.competencia <= currentCompetencia
    )
    .reduce((sum, inv) => sum + Number(inv.valorTotal || 0), 0);

  const comprometidoFaturaAtualEPassadas = Math.max(faturasPassadasEAtualAbertas, faturaAtual);

  // 3. Futuras parcelas de compras parceladas (> currentCompetencia)
  // Assinaturas e gastos recorrentes NÃO comprometem limite futuro
  const futureInstallmentsTotal = expenses
    .filter((e) => e.cartaoCreditoId === card.id && e.origemLancamento === 'parcelado')
    .flatMap((e) => e.lancamentosBase || [])
    .filter((lb) => {
      const lbComp = (lb.competencia || lb.dataVencimentoParcela || '').substring(0, 7);
      return lbComp > currentCompetencia && lb.status !== 'pago' && lb.status !== 'cancelado';
    })
    .reduce((sum, lb) => sum + Number(lb.valorParcela || 0), 0);

  const limiteComprometido = comprometidoFaturaAtualEPassadas + futureInstallmentsTotal;
  const limiteDisponivel = Math.max(0, limiteTotal - limiteComprometido);

  return {
    faturaAtual,
    limiteDisponivel,
  };
}

/**
 * Detecta se a aplicação está rodando em ambiente local ou de desenvolvimento.
 */
export function isDevEnvironment(): boolean {
  if (typeof window === 'undefined') return false;

  // Variável Vite DEV ou MODE development
  if (import.meta.env?.DEV) return true;
  if (import.meta.env?.MODE === 'development') return true;

  // Checagem de host local / desenvolvimento
  const host = window.location?.hostname || '';
  if (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '[::1]' ||
    host.endsWith('.local') ||
    host.includes('dev.') ||
    host.includes('-dev.')
  ) {
    return true;
  }

  // Variável de ambiente personalizada se configurada
  const appEnv = (import.meta.env?.VITE_APP_ENV || import.meta.env?.VITE_ENV || '').toLowerCase();
  if (appEnv === 'development' || appEnv === 'dev' || appEnv === 'local') return true;
  if (appEnv === 'production' || appEnv === 'prod') return false;

  return false;
}

export function isProductionEnvironment(): boolean {
  return !isDevEnvironment();
}

/**
 * Calcula a data de vencimento da fatura vigente de um cartão de crédito.
 * - Se a data de referência for posterior ao dia de fechamento, o lançamento entra na fatura do mês subsequente.
 * - Se diaVencimento > diaFechamento, o vencimento é no mesmo mês da fatura; se <=, é no mês seguinte.
 */
export function calculateCardDueDate(
  card: { diaFechamento?: number; diaVencimento?: number },
  referenceDateInput?: Date | string
): string {
  if (!card) return new Date().toISOString().split('T')[0];

  const diaFechamento = Number(card.diaFechamento) || 10;
  const diaVencimento = Number(card.diaVencimento) || 17;

  let refDate: Date;
  let isFullDate = true;

  if (referenceDateInput) {
    if (typeof referenceDateInput === 'string') {
      if (referenceDateInput.length === 7) {
        // Formato "YYYY-MM"
        const [y, m] = referenceDateInput.split('-');
        refDate = new Date(Number(y), Number(m) - 1, 1);
        isFullDate = false;
      } else {
        const clean = referenceDateInput.split('T')[0];
        const [y, m, d] = clean.split('-');
        refDate = new Date(Number(y), Number(m) - 1, Number(d));
      }
    } else {
      refDate = new Date(referenceDateInput);
    }
  } else {
    refDate = new Date();
  }

  let compYear = refDate.getFullYear();
  let compMonth = refDate.getMonth(); // 0 a 11

  // Se for uma data completa e o dia for posterior ao fechamento, entra na fatura do mês subsequente
  if (isFullDate && refDate.getDate() > diaFechamento) {
    compMonth += 1;
    if (compMonth > 11) {
      compMonth = 0;
      compYear += 1;
    }
  }

  // Se diaVencimento <= diaFechamento, o vencimento é no mês seguinte ao fechamento
  let dueYear = compYear;
  let dueMonth = compMonth;
  if (diaVencimento <= diaFechamento) {
    dueMonth += 1;
    if (dueMonth > 11) {
      dueMonth = 0;
      dueYear += 1;
    }
  }

  // Ajusta para o último dia do mês caso o mês tenha menos dias (ex: fevereiro)
  const lastDayOfDueMonth = new Date(dueYear, dueMonth + 1, 0).getDate();
  const safeDueDay = Math.min(diaVencimento, lastDayOfDueMonth);

  const formattedMonth = String(dueMonth + 1).padStart(2, '0');
  const formattedDay = String(safeDueDay).padStart(2, '0');

  return `${dueYear}-${formattedMonth}-${formattedDay}`;
}

export type CategoryBudgetAlertLevel = 'normal' | 'yellow' | 'orange' | 'danger';

export interface CategoryBudgetStatus {
  categoriaId: string;
  descricao: string;
  iconName: string;
  color: string;
  spent: number;
  budget: number;
  monthlyBudget: number;
  monthMultiplier: number;
  percentage: number;
  alertLevel: CategoryBudgetAlertLevel;
  label: string;
  badgeClass: string;
  progressClass: string;
}

/**
 * Calcula o status de orçamento/teto de uma categoria para o período ou competência selecionada.
 * - Suporta períodos de 1 mês, quinzenas ou múltiplos meses (ex: 3 meses, 6 meses, anual).
 * - Em períodos multi-mês (> 35 dias), o teto orçamentário é multiplicado proporcionalmente ao número de meses
 *   para evitar falsos estouros e manter a consistência financeira.
 * - 60% a 79%: Alerta Amarelo (60% do limite)
 * - 80% a 99%: Alerta Laranja (80% do limite)
 * - 100% ou mais: Alerta Vermelho (100% do limite)
 */
export function getCategoryBudgetStatus(
  category: {
    id: string;
    descricao: string;
    iconName?: string;
    color?: string;
    cor?: string;
    teto?: number | null;
    orcamentoMensal?: number | null;
  },
  expenses: Array<{
    categoriaId?: string;
    tipo?: string;
    status?: string;
    valor?: number;
    competencia?: string;
    dataVencimento?: string;
    origemLancamento?: string;
    lancamentosBase?: Array<{
      competencia?: string;
      dataVencimentoParcela?: string;
      valorParcela?: number;
      status?: string;
    }>;
  }>,
  selectedCompetencia?: string,
  startDate?: string,
  endDate?: string
): CategoryBudgetStatus {
  const monthlyBudget = Number(category.teto ?? category.orcamentoMensal ?? 0);
  const color = category.cor || category.color || '#10b981';
  const iconName = category.iconName || '🏷️';

  // Multiplicador de meses em caso de períodos que abrangem múltiplos meses
  let monthMultiplier = 1;
  if (startDate && endDate) {
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (diffDays > 35) {
      const startYear = start.getFullYear();
      const startMonth = start.getMonth();
      const endYear = end.getFullYear();
      const endMonth = end.getMonth();
      const exactMonths = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
      monthMultiplier = Math.max(1, exactMonths > 0 ? exactMonths : Math.round(diffDays / 30.4375));
    }
  }

  const budget = monthlyBudget * monthMultiplier;

  const categoryExpenses = expenses.filter((e) => {
    if (e.categoriaId !== category.id || e.tipo !== 'despesa' || e.status === 'cancelado') {
      return false;
    }
    if (startDate || endDate) {
      const dueDate = (e.dataVencimento || e.competencia || '').split('T')[0];
      if (startDate && dueDate && dueDate < startDate) return false;
      if (endDate && dueDate && dueDate > endDate) return false;
    }
    return true;
  });

  const spent = categoryExpenses.reduce(
    (sum, e) => sum + getEffectiveExpenseValue(e, selectedCompetencia, startDate, endDate),
    0
  );

  const percentage = budget > 0 ? Math.round((spent / budget) * 100) : 0;

  let alertLevel: CategoryBudgetAlertLevel = 'normal';
  let label = 'Dentro da meta';
  let badgeClass = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  let progressClass = 'bg-emerald-500';

  if (budget > 0) {
    if (percentage >= 100) {
      alertLevel = 'danger';
      label = '100% do limite atingido';
      badgeClass = 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      progressClass = 'bg-rose-500';
    } else if (percentage >= 80) {
      alertLevel = 'orange';
      label = '80% do limite atingido';
      badgeClass = 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      progressClass = 'bg-orange-500';
    } else if (percentage >= 60) {
      alertLevel = 'yellow';
      label = '60% do limite atingido';
      badgeClass = 'bg-amber-400/20 text-amber-300 border-amber-400/30';
      progressClass = 'bg-amber-400';
    }
  }

  return {
    categoriaId: category.id,
    descricao: category.descricao,
    iconName,
    color,
    spent,
    budget,
    monthlyBudget,
    monthMultiplier,
    percentage,
    alertLevel,
    label,
    badgeClass,
    progressClass,
  };
}

/**
 * Retorna todas as categorias que atingiram 60%, 80% ou 100% do seu limite,
 * ordenadas por percentual atingido decrescente.
 */
export function getCategoryBudgetAlerts(
  categories: Array<{
    id: string;
    descricao: string;
    iconName?: string;
    color?: string;
    cor?: string;
    teto?: number | null;
    orcamentoMensal?: number | null;
  }>,
  expenses: Array<any>,
  selectedCompetencia?: string,
  startDate?: string,
  endDate?: string
): CategoryBudgetStatus[] {
  const monthExpenses = getExpensesForCompetence(expenses, selectedCompetencia || '', startDate, endDate);

  const statuses = categories
    .filter((c) => Number(c.teto ?? c.orcamentoMensal ?? 0) > 0)
    .map((c) => getCategoryBudgetStatus(c, monthExpenses, selectedCompetencia, startDate, endDate))
    .filter((s) => s.alertLevel !== 'normal');

  return statuses.sort((a, b) => b.percentage - a.percentage);
}

