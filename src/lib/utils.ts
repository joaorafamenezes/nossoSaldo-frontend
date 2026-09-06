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

export function getCompetenciaDisplay(competencia: string): string {
  if (!competencia) return '';
  const parts = competencia.split('-');
  const year = parts[0];
  const month = parseInt(parts[1], 10);
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return `${monthNames[month - 1]} de ${year}`;
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
    valor: number;
    origemLancamento?: string;
    numeroParcelas?: number;
    lancamentosBase?: Array<{
      valorParcela: number;
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
 * Filtra e deduplica lançamentos para a competência selecionada.
 * Para séries recorrentes que possuem múltiplos registros legados ou instâncias físicas no banco,
 * prioriza o registro específico da competência ou mantém apenas 1 projeção modelo por série.
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
  const eligible = expenses.filter((item) => {
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

    const isRecorrente = item.origemLancamento === 'recorrente';
    const recurringStartMonth = (item.dataInicioRecorrencia || item.competencia || item.dataVencimento || '').substring(0, 7);
    const recurringEndMonth = item.dataFimRecorrencia ? item.dataFimRecorrencia.substring(0, 7) : null;
    const isRecurringActiveInCompetence =
      isRecorrente &&
      (!recurringStartMonth || selectedCompetencia >= recurringStartMonth) &&
      (!recurringEndMonth || selectedCompetencia <= recurringEndMonth);

    if (startDate || endDate) {
      const itemDueDate = getEffectiveExpenseDueDate(item, selectedCompetencia);
      if (startDate && (!itemDueDate || itemDueDate < startDate)) return false;
      if (endDate && (!itemDueDate || itemDueDate > endDate)) return false;
    } else {
      const matchesCompetence =
        (item.competencia && item.competencia.startsWith(selectedCompetencia)) ||
        (item.dataVencimento && item.dataVencimento.startsWith(selectedCompetencia)) ||
        !!relevantInstallment ||
        isRecurringActiveInCompetence;
      if (!matchesCompetence) return false;
    }

    return true;
  });

  // Deduplica séries recorrentes para que apareça apenas 1 registro por competência
  const recurringMap = new Map<string, T>();
  const nonRecurring: T[] = [];

  for (const item of eligible) {
    if (item.origemLancamento !== 'recorrente') {
      nonRecurring.push(item);
      continue;
    }

    const descClean = (item.descricao || '').trim().toLowerCase();
    const seriesKey = item.recorrenciaPaiId || `rec_${descClean}_${item.categoriaId || ''}_${item.responsavelId || ''}`;
    const isExactMonth =
      (item.competencia && item.competencia.startsWith(selectedCompetencia)) ||
      (item.dataVencimento && item.dataVencimento.startsWith(selectedCompetencia));

    const existing = recurringMap.get(seriesKey);
    if (!existing) {
      recurringMap.set(seriesKey, item);
    } else if (isExactMonth) {
      // Prioriza o registro físico cadastrado especificamente para este mês
      recurringMap.set(seriesKey, item);
    }
  }

  return [...nonRecurring, ...Array.from(recurringMap.values())];
}
