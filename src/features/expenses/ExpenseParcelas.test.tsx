import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ExpenseCategoryAccordion } from './ExpenseCategoryAccordion';
import { ExpenseTable } from './ExpenseTable';
import { ExpenseGrid } from './ExpenseGrid';
import { ExpensesPage } from './ExpensesPage';
import { Gasto, LancamentoBase } from '../../types/financial';

const mockToggleInstallmentStatus = vi.fn();
const mockToggleExpenseStatus = vi.fn();
const mockOpenEditExpense = vi.fn();
const mockDeleteExpense = vi.fn();
const mockOpenNewExpense = vi.fn();
const mockBatchToggleStatus = vi.fn();
const mockBatchDeleteExpenses = vi.fn();

const mockInstallments: LancamentoBase[] = [
  {
    id: 'lan-1',
    gastoId: 'gst-parcelado-1',
    descricao: 'Smart TV OLED (1/3)',
    valorParcela: 500,
    numeroParcela: 1,
    dataVencimentoParcela: '2026-09-10',
    dataPagamentoParcela: '2026-09-08',
    status: 'pago',
    competencia: '2026-09-01',
  },
  {
    id: 'lan-2',
    gastoId: 'gst-parcelado-1',
    descricao: 'Smart TV OLED (2/3)',
    valorParcela: 500,
    numeroParcela: 2,
    dataVencimentoParcela: '2026-10-10',
    status: 'pendente',
    competencia: '2026-10-01',
  },
  {
    id: 'lan-3',
    gastoId: 'gst-parcelado-1',
    descricao: 'Smart TV OLED (3/3)',
    valorParcela: 500,
    numeroParcela: 3,
    dataVencimentoParcela: '2026-11-10',
    status: 'pendente',
    competencia: '2026-11-01',
  },
];

const mockPendingInstallments: LancamentoBase[] = [
  {
    id: 'lan-pending-1',
    gastoId: 'gst-curso-1',
    descricao: 'Curso de Inglês (1/2)',
    valorParcela: 300,
    numeroParcela: 1,
    dataVencimentoParcela: '2026-09-15',
    status: 'pendente',
    competencia: '2026-09-01',
  },
  {
    id: 'lan-pending-2',
    gastoId: 'gst-curso-1',
    descricao: 'Curso de Inglês (2/2)',
    valorParcela: 300,
    numeroParcela: 2,
    dataVencimentoParcela: '2026-10-15',
    status: 'pendente',
    competencia: '2026-10-01',
  },
];

const mockParceladoExpensePaidInSeptember: Gasto = {
  id: 'gst-parcelado-1',
  descricao: 'Smart TV OLED 55"',
  tipo: 'despesa',
  status: 'pendente', // Parent expense remains 'pendente' until all installments are paid
  origemLancamento: 'parcelado',
  numeroParcelas: 3,
  parcelaAtual: 2,
  naoCompartilhar: false,
  valor: 1500,
  competencia: '2026-09-01',
  dataVencimento: '2026-09-10',
  categoriaId: 'cat-lazer',
  responsavelId: 'usr-1',
  responsavelNome: 'João Ricardo',
  cartaoCreditoId: 'card-1',
  cartaoNome: 'Nubank Ultravioleta',
  faturaCartaoId: 'fat-1',
  createdAt: '2026-09-01T08:00:00Z',
  updatedAt: '2026-09-01T08:00:00Z',
  lancamentosBase: mockInstallments,
};

const mockParceladoExpensePendingInSeptember: Gasto = {
  id: 'gst-curso-1',
  descricao: 'Curso de Inglês Avançado',
  tipo: 'despesa',
  status: 'pendente',
  origemLancamento: 'parcelado',
  numeroParcelas: 2,
  parcelaAtual: 1,
  naoCompartilhar: false,
  valor: 600,
  competencia: '2026-09-01',
  dataVencimento: '2026-09-15',
  categoriaId: 'cat-educacao',
  responsavelId: 'usr-1',
  responsavelNome: 'João Ricardo',
  createdAt: '2026-09-01T08:00:00Z',
  updatedAt: '2026-09-01T08:00:00Z',
  lancamentosBase: mockPendingInstallments,
};

const mockSingleExpense: Gasto = {
  id: 'gst-unico-1',
  descricao: 'Supermercado Mensal',
  tipo: 'despesa',
  status: 'pago',
  origemLancamento: 'unico',
  numeroParcelas: 1,
  naoCompartilhar: false,
  valor: 350,
  competencia: '2026-09-01',
  dataVencimento: '2026-09-12',
  dataPagamento: '2026-09-11',
  categoriaId: 'cat-alimentacao',
  responsavelId: 'usr-1',
  responsavelNome: 'João Ricardo',
  createdAt: '2026-09-01T08:00:00Z',
  updatedAt: '2026-09-11T10:00:00Z',
};

let storeState: any = {};

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

vi.mock('../../stores/useAppStore', () => ({
  useAppStore: () => ({
    categories: [
      { id: 'cat-lazer', descricao: 'Lazer & Eletrônicos', iconName: 'Film', color: '#8b5cf6' },
      { id: 'cat-alimentacao', descricao: 'Alimentação', iconName: 'ShoppingCart', color: '#10b981' },
      { id: 'cat-educacao', descricao: 'Educação', iconName: 'Book', color: '#3b82f6' },
    ],
    expenses: storeState.expenses || [mockParceladoExpensePaidInSeptember, mockParceladoExpensePendingInSeptember, mockSingleExpense],
    jointInfo: null,
    selectedCompetencia: storeState.selectedCompetencia || '2026-09',
    openNewExpense: mockOpenNewExpense,
    batchToggleStatus: mockBatchToggleStatus,
    batchDeleteExpenses: mockBatchDeleteExpenses,
    toggleExpenseStatus: mockToggleExpenseStatus,
    toggleInstallmentStatus: mockToggleInstallmentStatus,
    openEditExpense: mockOpenEditExpense,
    deleteExpense: mockDeleteExpense,
  }),
}));

describe('Gestão de Gastos Parcelados & Critérios 001 e 002', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storeState = {
      expenses: [mockParceladoExpensePaidInSeptember, mockParceladoExpensePendingInSeptember, mockSingleExpense],
      selectedCompetencia: '2026-09',
    };
  });

  describe('Critério 001: Mensagem de confirmação ao realizar operação em parcela/fatura', () => {
    it('renderiza o botão de expansão das parcelas para gastos parcelados', () => {
      render(
        <ExpenseCategoryAccordion
          expenses={[mockParceladoExpensePaidInSeptember, mockSingleExpense]}
          selectedIds={[]}
          onToggleSelect={vi.fn()}
        />
      );

      expect(screen.getByText('Smart TV OLED 55"')).toBeInTheDocument();
      expect(screen.getByText(/3x parcelas/i)).toBeInTheDocument();
    });

    it('maximiza e visualiza as parcelas filhas ao clicar no registro pai / botão de parcelas', () => {
      render(
        <ExpenseCategoryAccordion
          expenses={[mockParceladoExpensePaidInSeptember]}
          selectedIds={[]}
          onToggleSelect={vi.fn()}
        />
      );

      expect(screen.queryByText('Parcela 2/3')).not.toBeInTheDocument();

      const expandBtn = screen.getByText(/3x parcelas/i);
      fireEvent.click(expandBtn);

      expect(screen.getByText('Parcela 1/3')).toBeInTheDocument();
      expect(screen.getByText('Parcela 2/3')).toBeInTheDocument();
      expect(screen.getByText('Parcela 3/3')).toBeInTheDocument();
    });

    it('minimiza as parcelas filhas ao clicar novamente', () => {
      render(
        <ExpenseCategoryAccordion
          expenses={[mockParceladoExpensePaidInSeptember]}
          selectedIds={[]}
          onToggleSelect={vi.fn()}
        />
      );

      const expandBtn = screen.getByText(/3x parcelas/i);
      fireEvent.click(expandBtn);
      expect(screen.getByText('Parcela 2/3')).toBeInTheDocument();

      fireEvent.click(expandBtn);
      expect(screen.queryByText('Parcela 2/3')).not.toBeInTheDocument();
    });

    it('abre modal de confirmação ao clicar em Pagar parcela no ExpenseCategoryAccordion e confirma', () => {
      render(
        <ExpenseCategoryAccordion
          expenses={[mockParceladoExpensePendingInSeptember]}
          selectedIds={[]}
          onToggleSelect={vi.fn()}
        />
      );

      // Expand installments
      fireEvent.click(screen.getByText(/2x parcelas/i));

      // Find child pay button (index 0 is parent, index 1 is first installment)
      const allPayButtons = screen.getAllByRole('button', { name: /Pagar/i });
      const childPayBtn = allPayButtons[1];
      fireEvent.click(childPayBtn);

      // Verify confirmation modal is shown
      expect(screen.getByText(/Confirmar Pagamento da Parcela/i)).toBeInTheDocument();
      expect(screen.getByText(/Deseja realmente confirmar o/i)).toBeInTheDocument();

      // Click confirmation button in modal
      const modalConfirmBtn = screen.getByRole('button', { name: /Sim, Confirmar Pagamento/i });
      fireEvent.click(modalConfirmBtn);

      expect(mockToggleInstallmentStatus).toHaveBeenCalledWith(
        mockParceladoExpensePendingInSeptember.id,
        mockPendingInstallments[0].id
      );
    });

    it('abre modal de confirmação no ExpenseTable e executa o pagamento da parcela após confirmação', () => {
      render(
        <ExpenseTable
          expenses={[mockParceladoExpensePendingInSeptember]}
          selectedIds={[]}
          onToggleSelect={vi.fn()}
          onSelectAll={vi.fn()}
        />
      );

      // Expand installments
      fireEvent.click(screen.getByText(/2x parcelas/i));

      const childPayBtn = screen.getAllByRole('button', { name: /Pagar/i })[0];
      fireEvent.click(childPayBtn);

      // Modal appears
      expect(screen.getByText(/Confirmar Pagamento da Parcela/i)).toBeInTheDocument();

      const modalConfirmBtn = screen.getByRole('button', { name: /Sim, Confirmar Pagamento/i });
      fireEvent.click(modalConfirmBtn);

      expect(mockToggleInstallmentStatus).toHaveBeenCalledWith(
        mockParceladoExpensePendingInSeptember.id,
        mockPendingInstallments[0].id
      );
    });

    it('abre modal de confirmação no ExpenseGrid e executa o pagamento da parcela após confirmação', () => {
      render(
        <ExpenseGrid
          expenses={[mockParceladoExpensePendingInSeptember]}
          selectedIds={[]}
          onToggleSelect={vi.fn()}
        />
      );

      // Expand installments
      const expandBtn = screen.getByTitle(/Minimizar \/ Maximizar parcelas/i);
      fireEvent.click(expandBtn);

      const payBtn = screen.getAllByRole('button', { name: /Pagar/i })[0];
      fireEvent.click(payBtn);

      expect(screen.getByText(/Confirmar Pagamento da Parcela/i)).toBeInTheDocument();

      const modalConfirmBtn = screen.getByRole('button', { name: /Sim, Confirmar Pagamento/i });
      fireEvent.click(modalConfirmBtn);

      expect(mockToggleInstallmentStatus).toHaveBeenCalledWith(
        mockParceladoExpensePendingInSeptember.id,
        mockPendingInstallments[0].id
      );
    });
  });

  describe('Critério 002: Exibir somente pagamentos pendentes no filtro quando parcela vigente for paga', () => {
    it('não exibe registro pai no filtro Pendentes se a parcela da competência vigente (Setembro) estiver paga', () => {
      storeState.expenses = [
        mockParceladoExpensePaidInSeptember, // Parcela 1 (Setembro) is PAGO, Parent is PENDENTE
        mockParceladoExpensePendingInSeptember, // Parcela 1 (Setembro) is PENDENTE
      ];
      storeState.selectedCompetencia = '2026-09';

      render(<ExpensesPage />);

      // Select "Pendentes" status filter
      const statusSelect = screen.getByDisplayValue(/Todos os Status/i);
      fireEvent.change(statusSelect, { target: { value: 'pendente' } });

      // O gasto com parcela de setembro paga NÃO deve aparecer
      expect(screen.queryByText('Smart TV OLED 55"')).not.toBeInTheDocument();

      // O gasto com parcela de setembro pendente DEVE aparecer
      expect(screen.getByText('Curso de Inglês Avançado')).toBeInTheDocument();
    });

    it('exibe o registro pai no filtro Pagos quando a parcela da competência vigente estiver paga', () => {
      storeState.expenses = [
        mockParceladoExpensePaidInSeptember, // Parcela 1 (Setembro) is PAGO
        mockParceladoExpensePendingInSeptember, // Parcela 1 (Setembro) is PENDENTE
      ];
      storeState.selectedCompetencia = '2026-09';

      render(<ExpensesPage />);

      const statusSelect = screen.getByDisplayValue(/Todos os Status/i);
      fireEvent.change(statusSelect, { target: { value: 'pago' } });

      // O gasto com parcela de setembro paga DEVE aparecer no filtro Pagos
      expect(screen.getByText('Smart TV OLED 55"')).toBeInTheDocument();

      // O gasto com parcela pendente NÃO deve aparecer no filtro Pagos
      expect(screen.queryByText('Curso de Inglês Avançado')).not.toBeInTheDocument();
    });

    it('exibe o registro pai como Pendente quando a competência muda para o próximo mês (Outubro)', () => {
      // For Outubro (2026-10), Parcela 2 of Smart TV is PENDENTE
      storeState.expenses = [mockParceladoExpensePaidInSeptember];
      storeState.selectedCompetencia = '2026-10';

      render(<ExpensesPage />);

      const statusSelect = screen.getByDisplayValue(/Todos os Status/i);
      fireEvent.change(statusSelect, { target: { value: 'pendente' } });

      // Em Outubro, a parcela 2 está pendente, logo deve ser exibido como pendente
      expect(screen.getByText('Smart TV OLED 55"')).toBeInTheDocument();
    });
  });

  describe('História: Data de Criação vs Data de Vencimento no Card Principal', () => {
    it('exibe "Criado em:" para gasto parcelado e "Vencimento:" para gasto à vista no ExpenseCategoryAccordion', () => {
      render(
        <ExpenseCategoryAccordion
          expenses={[mockParceladoExpensePaidInSeptember, mockSingleExpense]}
          selectedIds={[]}
          onToggleSelect={vi.fn()}
        />
      );

      // Gasto parcelado deve exibir "Criado em:"
      expect(screen.getByText(/Criado em: 01\/09\/2026/i)).toBeInTheDocument();

      // Gasto à vista deve exibir "Vencimento:"
      expect(screen.getByText(/Vencimento: 12\/09\/2026/i)).toBeInTheDocument();
    });

    it('exibe "Criado:" para gasto parcelado e "Vence:" para gasto à vista no ExpenseGrid', () => {
      render(
        <ExpenseGrid
          expenses={[mockParceladoExpensePaidInSeptember, mockSingleExpense]}
          selectedIds={[]}
          onToggleSelect={vi.fn()}
        />
      );

      expect(screen.getByText(/Criado: 01\/09\/2026/i)).toBeInTheDocument();
      expect(screen.getByText(/Vence: 12\/09\/2026/i)).toBeInTheDocument();
    });
  });

  describe('História: Soma da Categoria com Valor da Parcela e Não Total do Gasto (Critério 001)', () => {
    it('soma o valor da parcela mensal (ex: R$ 200,00) e não o total do contrato (ex: R$ 1000,00) na categoria', () => {
      // Exemplo da US:
      // Gasto 1: À vista R$ 500,00 na categoria Alimentação
      // Gasto 2: Parcelado R$ 1000,00 em 5x de R$ 200,00 na categoria Alimentação
      // Total da categoria deve ser R$ 700,00 (500 + 200) e NÃO R$ 1500,00
      const mockGastoAVista: Gasto = {
        id: 'gst-a-vista-500',
        descricao: 'Supermercado Mensal',
        tipo: 'despesa',
        status: 'pendente',
        origemLancamento: 'unico',
        numeroParcelas: 1,
        naoCompartilhar: false,
        valor: 500,
        competencia: '2026-09-01',
        dataVencimento: '2026-09-10',
        categoriaId: 'cat-alimentacao',
        responsavelId: 'usr-1',
        createdAt: '2026-09-01T08:00:00Z',
        updatedAt: '2026-09-01T08:00:00Z',
      };

      const mockGastoParcelado1000: Gasto = {
        id: 'gst-parcelado-1000',
        descricao: 'Cafeteira Expressa',
        tipo: 'despesa',
        status: 'pendente',
        origemLancamento: 'parcelado',
        numeroParcelas: 5,
        parcelaAtual: 1,
        naoCompartilhar: false,
        valor: 1000,
        competencia: '2026-09-01',
        dataVencimento: '2026-09-15',
        categoriaId: 'cat-alimentacao',
        responsavelId: 'usr-1',
        createdAt: '2026-09-01T08:00:00Z',
        updatedAt: '2026-09-01T08:00:00Z',
        lancamentosBase: Array.from({ length: 5 }, (_, idx) => ({
          id: `lb-cafeteira-${idx + 1}`,
          gastoId: 'gst-parcelado-1000',
          descricao: `Cafeteira Expressa (${idx + 1}/5)`,
          valorParcela: 200,
          numeroParcela: idx + 1,
          dataVencimentoParcela: `2026-0${9 + idx}-15`,
          status: 'pendente' as const,
          competencia: `2026-0${9 + idx}-01`,
        })),
      };

      render(
        <ExpenseCategoryAccordion
          expenses={[mockGastoAVista, mockGastoParcelado1000]}
          selectedIds={[]}
          onToggleSelect={vi.fn()}
        />
      );

      // Total no cabeçalho da categoria deve ser R$ 700,00 (500 + 200), não R$ 1500,00
      expect(screen.getByText('R$ 700,00')).toBeInTheDocument();
      expect(screen.queryByText('R$ 1.500,00')).not.toBeInTheDocument();

      // Card parcelado exibe o valor da parcela (R$ 200,00) e o total do contrato (Total: R$ 1.000,00 (5x))
      expect(screen.getByText('R$ 200,00')).toBeInTheDocument();
      expect(screen.getByText(/Total: R\$ 1\.000,00 \(5x\)/i)).toBeInTheDocument();
    });
  });

  describe('Correção: Status e Atraso Efetivo em Gastos Parcelados (Evitar Falso ATRASADO)', () => {
    it('exibe Quitado/Pago quando a parcela da competência atual já foi paga, mesmo que a data inicial do contrato seja anterior a hoje', () => {
      // Exemplo do usuário: "Acordo Bradescard" (10x parcelas)
      // Parcela 1/10 venceu dia 04/09/2026 e foi PAGA dia 28/08/2026.
      // Hoje é 05/09/2026. O card NÃO deve exibir ATRASADO, deve exibir Quitado!
      const mockAcordoBradescard: Gasto = {
        id: 'gst-acordo-bradescard',
        descricao: 'Acordo Bradescard',
        tipo: 'despesa',
        status: 'pendente', // Status global do contrato permanece pendente até pagar todas as 10x
        origemLancamento: 'parcelado',
        numeroParcelas: 10,
        parcelaAtual: 1,
        naoCompartilhar: false,
        valor: 2574.70,
        competencia: '2026-09-01',
        dataVencimento: '2026-09-04', // Data da parcela 1 no passado
        categoriaId: 'cat-lazer',
        responsavelId: 'usr-1',
        createdAt: '2026-08-28T08:00:00Z',
        updatedAt: '2026-08-28T08:00:00Z',
        lancamentosBase: [
          {
            id: 'lb-1',
            gastoId: 'gst-acordo-bradescard',
            descricao: 'Acordo Bradescard (1/10)',
            valorParcela: 257.47,
            numeroParcela: 1,
            dataVencimentoParcela: '2026-09-04',
            dataPagamentoParcela: '2026-08-28',
            status: 'pago',
            competencia: '2026-09-01',
          },
          {
            id: 'lb-2',
            gastoId: 'gst-acordo-bradescard',
            descricao: 'Acordo Bradescard (2/10)',
            valorParcela: 257.47,
            numeroParcela: 2,
            dataVencimentoParcela: '2026-10-04',
            status: 'pendente',
            competencia: '2026-10-01',
          },
        ],
      };

      render(
        <ExpenseCategoryAccordion
          expenses={[mockAcordoBradescard]}
          selectedIds={[]}
          onToggleSelect={vi.fn()}
        />
      );

      // Deve exibir Quitado para o mês de setembro (competência atual)
      expect(screen.getByText('Quitado')).toBeInTheDocument();
      expect(screen.queryByText('Atrasado')).not.toBeInTheDocument();
      expect(screen.getByText(/STATUS: PAGO/i)).toBeInTheDocument();
    });

    it('exibe Pendente quando a parcela da competência atual vence no futuro, mesmo se a data inicial do contrato for anterior', () => {
      // Parcela de setembro vence em 20/09 (no futuro relativo a 05/09).
      const mockGastoFuturo: Gasto = {
        id: 'gst-futuro',
        descricao: 'Financiamento Automotivo',
        tipo: 'despesa',
        status: 'pendente',
        origemLancamento: 'parcelado',
        numeroParcelas: 12,
        parcelaAtual: 1,
        naoCompartilhar: false,
        valor: 12000,
        competencia: '2026-09-01',
        dataVencimento: '2026-09-20',
        categoriaId: 'cat-lazer',
        responsavelId: 'usr-1',
        createdAt: '2026-08-01T08:00:00Z',
        updatedAt: '2026-08-01T08:00:00Z',
        lancamentosBase: [
          {
            id: 'lb-auto-1',
            gastoId: 'gst-futuro',
            descricao: 'Financiamento Automotivo (1/12)',
            valorParcela: 1000,
            numeroParcela: 1,
            dataVencimentoParcela: '2026-09-20',
            status: 'pendente',
            competencia: '2026-09-01',
          },
        ],
      };

      render(
        <ExpenseCategoryAccordion
          expenses={[mockGastoFuturo]}
          selectedIds={[]}
          onToggleSelect={vi.fn()}
        />
      );

      expect(screen.getByText('Pendente')).toBeInTheDocument();
      expect(screen.queryByText('Atrasado')).not.toBeInTheDocument();
      expect(screen.getByText(/STATUS: PENDENTE/i)).toBeInTheDocument();
    });
  });
});
