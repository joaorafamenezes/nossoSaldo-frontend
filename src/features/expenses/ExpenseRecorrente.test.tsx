import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ExpensesPage } from './ExpensesPage';
import { ExpenseCategoryAccordion } from './ExpenseCategoryAccordion';
import { Gasto } from '../../types/financial';
import { getEffectiveExpenseDueDate, getEffectiveExpenseStatus, getEffectiveExpenseValue } from '../../lib/utils';

const mockToggleExpenseStatus = vi.fn();
const mockToggleInstallmentStatus = vi.fn();
const mockOpenNewExpense = vi.fn();
const mockBatchToggleStatus = vi.fn();
const mockBatchDeleteExpenses = vi.fn();

const mockRecurringAluguel: Gasto = {
  id: 'gst-rec-aluguel',
  descricao: 'Aluguel do Apartamento',
  tipo: 'despesa',
  status: 'pendente',
  origemLancamento: 'recorrente',
  numeroParcelas: 1,
  naoCompartilhar: false,
  valor: 2500,
  competencia: '2026-08-01',
  dataVencimento: '2026-08-10',
  dataInicioRecorrencia: '2026-08-10',
  dataFimRecorrencia: undefined, // Sem data final
  categoriaId: 'cat-moradia',
  responsavelId: 'usr-1',
  responsavelNome: 'João Ricardo',
  createdAt: '2026-08-01T10:00:00.000Z',
  updatedAt: '2026-08-01T10:00:00.000Z',
};

const mockRecurringInternetPaidInSept: Gasto = {
  id: 'gst-rec-internet',
  descricao: 'Internet Fibra 600MB',
  tipo: 'despesa',
  status: 'pendente',
  origemLancamento: 'recorrente',
  numeroParcelas: 1,
  naoCompartilhar: false,
  valor: 150,
  competencia: '2026-08-01',
  dataVencimento: '2026-08-15',
  dataInicioRecorrencia: '2026-08-15',
  categoriaId: 'cat-moradia',
  responsavelId: 'usr-1',
  responsavelNome: 'João Ricardo',
  lancamentosBase: [
    {
      id: 'lb-rec-internet-2026-09',
      gastoId: 'gst-rec-internet',
      descricao: 'Internet Fibra 600MB (Setembro de 2026)',
      valorParcela: 150,
      numeroParcela: 1,
      dataVencimentoParcela: '2026-09-15',
      dataPagamentoParcela: '2026-09-14',
      status: 'pago',
      competencia: '2026-09-01',
    },
  ],
  createdAt: '2026-08-01T10:00:00.000Z',
  updatedAt: '2026-09-14T10:00:00.000Z',
};

const mockRecurringCancelledInSept: Gasto = {
  id: 'gst-rec-academia',
  descricao: 'Academia SmartFit',
  tipo: 'despesa',
  status: 'pendente',
  origemLancamento: 'recorrente',
  numeroParcelas: 1,
  naoCompartilhar: false,
  valor: 120,
  competencia: '2026-05-01',
  dataVencimento: '2026-05-20',
  dataInicioRecorrencia: '2026-05-20',
  dataFimRecorrencia: '2026-09-30', // Cancelado no final de Setembro
  categoriaId: 'cat-saude',
  responsavelId: 'usr-1',
  responsavelNome: 'João Ricardo',
  createdAt: '2026-05-01T10:00:00.000Z',
  updatedAt: '2026-09-30T10:00:00.000Z',
};

let storeState: any = {};

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

vi.mock('../../stores/useAppStore', () => ({
  useAppStore: () => ({
    categories: [
      { id: 'cat-moradia', descricao: 'Moradia & Contas Fixas', iconName: 'Home', color: '#10b981' },
      { id: 'cat-saude', descricao: 'Saúde & Exercício', iconName: 'Heart', color: '#ef4444' },
    ],
    cards: [],
    expenses: storeState.expenses || [mockRecurringAluguel, mockRecurringInternetPaidInSept, mockRecurringCancelledInSept],
    jointInfo: null,
    selectedCompetencia: storeState.selectedCompetencia || '2026-09',
    openNewExpense: mockOpenNewExpense,
    batchToggleStatus: mockBatchToggleStatus,
    batchDeleteExpenses: mockBatchDeleteExpenses,
    toggleExpenseStatus: mockToggleExpenseStatus,
    toggleInstallmentStatus: mockToggleInstallmentStatus,
  }),
}));

describe('Gastos Recorrentes Contínuos Sem Data Final (Projeção e Materialização Sob Demanda)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storeState = {
      expenses: [mockRecurringAluguel, mockRecurringInternetPaidInSept, mockRecurringCancelledInSept],
      selectedCompetencia: '2026-09',
    };
  });

  it('projeta automaticamente o gasto recorrente em competências futuras (Setembro, Outubro, Dezembro)', () => {
    // Competência Setembro/2026
    storeState.selectedCompetencia = '2026-09';
    const { rerender } = render(<ExpensesPage />);

    expect(screen.getByText('Aluguel do Apartamento')).toBeInTheDocument();
    expect(screen.getByText('Internet Fibra 600MB')).toBeInTheDocument();
    expect(screen.getByText('Academia SmartFit')).toBeInTheDocument();

    // Muda competência para Outubro/2026 (mesmo sem recadastrar, a despesa contínua deve aparecer)
    storeState.selectedCompetencia = '2026-10';
    rerender(<ExpensesPage />);

    expect(screen.getByText('Aluguel do Apartamento')).toBeInTheDocument();
    expect(screen.getByText('Internet Fibra 600MB')).toBeInTheDocument();
    // Academia cancelada em 09/2026 NÃO deve mais aparecer em 10/2026
    expect(screen.queryByText('Academia SmartFit')).not.toBeInTheDocument();
  });

  it('mantém o status de meses futuros como Pendente quando o mês vigente for pago', () => {
    // Em Setembro/2026, Internet foi paga com lançamento em lancamentosBase
    const statusSept = getEffectiveExpenseStatus(mockRecurringInternetPaidInSept, '2026-09');
    expect(statusSept.isPaid).toBe(true);
    expect(statusSept.effectiveStatus).toBe('pago');

    // Em Outubro/2026, Internet ainda não foi paga, logo deve ser projetada como pendente
    const statusOct = getEffectiveExpenseStatus(mockRecurringInternetPaidInSept, '2026-10');
    expect(statusOct.isPaid).toBe(false);
    expect(statusOct.effectiveStatus).toBe('pendente');
    expect(statusOct.effectiveDueDate).toBe('2026-10-15');
  });

  it('calcula dinamicamente a data de vencimento ajustando para meses com menos de 31 dias', () => {
    const expenseDia31: Gasto = {
      id: 'gst-assinatura-31',
      descricao: 'Serviço em Nuvem',
      tipo: 'despesa',
      status: 'pendente',
      origemLancamento: 'recorrente',
      numeroParcelas: 1,
      naoCompartilhar: false,
      valor: 89.9,
      competencia: '2026-01-01',
      dataVencimento: '2026-01-31',
      dataInicioRecorrencia: '2026-01-31',
      categoriaId: 'cat-moradia',
      responsavelId: 'usr-1',
      createdAt: '2026-01-01T10:00:00.000Z',
      updatedAt: '2026-01-01T10:00:00.000Z',
    };

    // Janeiro: 31 dias -> 2026-01-31
    expect(getEffectiveExpenseDueDate(expenseDia31, '2026-01')).toBe('2026-01-31');

    // Fevereiro/2026: 28 dias -> 2026-02-28
    expect(getEffectiveExpenseDueDate(expenseDia31, '2026-02')).toBe('2026-02-28');

    // Abril/2026: 30 dias -> 2026-04-30
    expect(getEffectiveExpenseDueDate(expenseDia31, '2026-04')).toBe('2026-04-30');

    // Maio/2026: 31 dias -> 2026-05-31
    expect(getEffectiveExpenseDueDate(expenseDia31, '2026-05')).toBe('2026-05-31');
  });

  it('chama toggleExpenseStatus passando a competência ativa ao pagar um lançamento recorrente', () => {
    storeState.selectedCompetencia = '2026-09';
    render(
      <ExpenseCategoryAccordion
        expenses={[mockRecurringAluguel]}
        selectedIds={[]}
        onToggleSelect={vi.fn()}
      />
    );

    const payBtn = screen.getByRole('button', { name: /^Pagar$/i });
    expect(payBtn).toBeInTheDocument();

    fireEvent.click(payBtn);

    // Modal de confirmação abre
    const confirmBtn = screen.getByRole('button', { name: /Confirmar Pagamento/i });
    fireEvent.click(confirmBtn);

    expect(mockToggleExpenseStatus).toHaveBeenCalledWith('gst-rec-aluguel', '2026-09');
  });

  it('retorna o valor nominal integral para cada competência ativa em getEffectiveExpenseValue', () => {
    expect(getEffectiveExpenseValue(mockRecurringAluguel, '2026-09')).toBe(2500);
    expect(getEffectiveExpenseValue(mockRecurringAluguel, '2026-10')).toBe(2500);
    expect(getEffectiveExpenseValue(mockRecurringAluguel, '2027-01')).toBe(2500);
  });

  it('deduplica múltiplos registros legados de uma mesma série recorrente exibindo apenas 1 ocorrência por competência', () => {
    // Simula 12 registros legados de "EFN Languages" gerados antes no banco
    const legacy12Rows: Gasto[] = Array.from({ length: 12 }, (_, i) => {
      const monthStr = String(i + 1).padStart(2, '0');
      return {
        id: `gst-legacy-efn-${i + 1}`,
        descricao: 'EFN Languages',
        tipo: 'despesa',
        status: 'pendente',
        origemLancamento: 'recorrente',
        numeroParcelas: 1,
        naoCompartilhar: false,
        valor: 435,
        competencia: `2026-${monthStr}-01`,
        dataVencimento: `2026-${monthStr}-15`,
        dataInicioRecorrencia: '2026-01-15',
        recorrenciaPaiId: 'gst-legacy-efn-1',
        categoriaId: 'cat-moradia',
        responsavelId: 'usr-1',
        createdAt: '2026-01-01T10:00:00.000Z',
        updatedAt: '2026-01-01T10:00:00.000Z',
      };
    });

    storeState.expenses = legacy12Rows;
    storeState.selectedCompetencia = '2026-12';

    render(<ExpensesPage />);

    // Deve exibir apenas 1 lançamento de "EFN Languages" na tela, e não 12 cópias
    const items = screen.getAllByText('EFN Languages');
    expect(items).toHaveLength(1);
    expect(screen.getByText('1 registros')).toBeInTheDocument();
    expect(screen.getByText('1 categorias')).toBeInTheDocument();
  });
});

