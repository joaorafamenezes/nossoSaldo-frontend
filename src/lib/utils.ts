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
