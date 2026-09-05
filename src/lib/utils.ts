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

