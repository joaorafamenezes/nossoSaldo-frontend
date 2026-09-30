import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as React from 'react';
import { UpcomingBillsTimeline } from './UpcomingBillsTimeline';
import { resolveFaturaDueDate, getUpcomingBills } from '../../lib/utils';
import { useAppStore } from '../../stores/useAppStore';

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Próximos Vencimentos - Monitoramento de Faturas e Parcelas', () => {
  const cardNubank = {
    id: 'card-nubank',
    descricao: 'Nubank Ultravioleta',
    diaFechamento: 25,
    diaVencimento: 5,
  };

  const mockInvoices = [
    {
      id: 'fat-sep',
      cartaoCreditoId: 'card-nubank',
      competencia: '2026-09',
      dataVencimento: '2026-10-05',
      status: 'aberta' as const,
    },
    {
      id: 'fat-aug',
      cartaoCreditoId: 'card-nubank',
      competencia: '2026-08',
      dataVencimento: '2026-09-05',
      status: 'fechada' as const,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({
      selectedCompetencia: '2026-09',
      cards: [cardNubank as any],
      invoices: mockInvoices as any,
      expenses: [],
    });
  });

  describe('Função resolveFaturaDueDate', () => {
    it('retorna a data de vencimento da fatura vinculada diretamente por faturaCartaoId', () => {
      const dueDate = resolveFaturaDueDate(
        {
          dataVencimento: '2026-09-10',
          faturaCartaoId: 'fat-sep',
        },
        mockInvoices,
        [cardNubank]
      );

      expect(dueDate).toBe('2026-10-05');
    });

    it('retorna a data de vencimento da fatura encontrada por cartão e competência', () => {
      const dueDate = resolveFaturaDueDate(
        {
          dataVencimento: '2026-08-10',
          competencia: '2026-08',
          cartaoCreditoId: 'card-nubank',
        },
        mockInvoices,
        [cardNubank]
      );

      expect(dueDate).toBe('2026-09-05');
    });

    it('calcula a data de vencimento dinamicamente pelas regras do cartão quando a fatura não está em cache', () => {
      // Compra feita em 2026-09-28 (> diaFechamento 25) entra na fatura de outubro, vencimento em 05/11/2026
      const dueDate = resolveFaturaDueDate(
        {
          dataVencimento: '2026-09-28',
          cartaoCreditoId: 'card-nubank',
        },
        [],
        [cardNubank]
      );

      expect(dueDate).toBe('2026-11-05');
    });

    it('retorna a dataVencimentoParcela quando não é vinculada a cartão', () => {
      const dueDate = resolveFaturaDueDate(
        {
          dataVencimento: '2026-01-10',
          dataVencimentoParcela: '2026-09-15',
        },
        [],
        []
      );

      expect(dueDate).toBe('2026-09-15');
    });
  });

  describe('Critério CT001: Fatura vencida', () => {
    it('exibe na tela de próximos vencimentos uma parcela vencida que está no top 5 registros mais distantes da data atual', () => {
      // Gasto parcelado de R$ 1.200 em 3x (R$ 400 cada)
      // Parcela 1: vencida em 2026-08-10 (passado distante)
      // Parcela 2: vencida em 2026-09-05 (passado recente)
      // Parcela 3: a vencer em 2026-10-05 (futuro)
      const expenseParcelado: any = {
        id: 'exp-notebook',
        descricao: 'Notebook Dell',
        tipo: 'despesa',
        status: 'pendente',
        origemLancamento: 'parcelado',
        numeroParcelas: 3,
        valor: 1200,
        competencia: '2026-08',
        dataVencimento: '2026-08-10', // Data do registro pai
        cartaoCreditoId: 'card-nubank',
        lancamentosBase: [
          {
            id: 'parc-1',
            gastoId: 'exp-notebook',
            numeroParcela: 1,
            descricao: 'Notebook Dell (1/3)',
            valorParcela: 400,
            dataVencimentoParcela: '2026-08-10',
            faturaCartaoId: 'fat-aug', // Venceu em 2026-09-05
            status: 'pendente',
          },
          {
            id: 'parc-2',
            gastoId: 'exp-notebook',
            numeroParcela: 2,
            descricao: 'Notebook Dell (2/3)',
            valorParcela: 400,
            dataVencimentoParcela: '2026-09-10',
            faturaCartaoId: 'fat-sep', // Vence em 2026-10-05
            status: 'pendente',
          },
        ],
      };

      const bills = getUpcomingBills({
        expenses: [expenseParcelado],
        invoices: mockInvoices,
        cards: [cardNubank],
        selectedCompetencia: '2026-09',
        limit: 5,
      });

      expect(bills.length).toBeGreaterThan(0);
      const overdueBill = bills.find((b) => b.installmentId === 'parc-1');
      expect(overdueBill).toBeDefined();
      expect(overdueBill?.dataVencimento).toBe('2026-09-05'); // Data da fatura de agosto
      expect(overdueBill?.valor).toBe(400); // Valor da parcela, não R$ 1.200 do registro pai
      expect(overdueBill?.descricao).toContain('Notebook Dell (1/3)');
    });

    it('ordena os itens vencidos pelos mais distantes da data atual primeiro', () => {
      const expenses: any[] = [
        {
          id: 'exp-1',
          descricao: 'Conta Antiga',
          tipo: 'despesa',
          status: 'pendente',
          origemLancamento: 'unico',
          valor: 100,
          dataVencimento: '2026-08-01', // 60 dias atrás
        },
        {
          id: 'exp-2',
          descricao: 'Conta Intermediária',
          tipo: 'despesa',
          status: 'pendente',
          origemLancamento: 'unico',
          valor: 200,
          dataVencimento: '2026-09-01', // 29 dias atrás
        },
        {
          id: 'exp-3',
          descricao: 'Conta Recente',
          tipo: 'despesa',
          status: 'pendente',
          origemLancamento: 'unico',
          valor: 300,
          dataVencimento: '2026-09-25', // 5 dias atrás
        },
      ];

      const bills = getUpcomingBills({
        expenses,
        invoices: [],
        cards: [],
        selectedCompetencia: '2026-09',
        limit: 5,
      });

      expect(bills[0].descricao).toBe('Conta Antiga');
      expect(bills[1].descricao).toBe('Conta Intermediária');
      expect(bills[2].descricao).toBe('Conta Recente');
    });
  });

  describe('Critério CT002: Fatura não vencida, mas próxima de vencer', () => {
    it('exibe na tela de próximos vencimentos uma parcela próxima de vencer no top 5', () => {
      const expense: any = {
        id: 'exp-celular',
        descricao: 'Smartphone Samsung',
        tipo: 'despesa',
        status: 'pendente',
        origemLancamento: 'parcelado',
        numeroParcelas: 2,
        valor: 2000,
        competencia: '2026-09',
        dataVencimento: '2026-09-10', // Data do registro pai
        cartaoCreditoId: 'card-nubank',
        lancamentosBase: [
          {
            id: 'parc-cel-1',
            gastoId: 'exp-celular',
            numeroParcela: 1,
            descricao: 'Smartphone Samsung (1/2)',
            valorParcela: 1000,
            dataVencimentoParcela: '2026-09-10',
            faturaCartaoId: 'fat-sep', // Vencimento em 2026-10-05
            status: 'pendente',
          },
        ],
      };

      const bills = getUpcomingBills({
        expenses: [expense],
        invoices: mockInvoices,
        cards: [cardNubank],
        selectedCompetencia: '2026-09',
        limit: 5,
      });

      expect(bills).toHaveLength(1);
      expect(bills[0].descricao).toBe('Smartphone Samsung (1/2)');
      expect(bills[0].dataVencimento).toBe('2026-10-05'); // Data da fatura
      expect(bills[0].valor).toBe(1000); // Valor da parcela, não R$ 2.000
      expect(bills[0].isPaid).toBe(false);
    });

    it('não exibe contas ou parcelas já pagas em Próximos Vencimentos', () => {
      const paidExpense: any = {
        id: 'exp-paid',
        descricao: 'Conta Paga no Início',
        tipo: 'despesa',
        status: 'pago',
        origemLancamento: 'unico',
        valor: 50,
        dataVencimento: '2026-09-01',
      };

      const pendingExpense: any = {
        id: 'exp-pending',
        descricao: 'Parcela Pendente Urgente',
        tipo: 'despesa',
        status: 'pendente',
        origemLancamento: 'parcelado',
        numeroParcelas: 2,
        valor: 300,
        lancamentosBase: [
          {
            id: 'parc-urgente',
            gastoId: 'exp-pending',
            numeroParcela: 1,
            descricao: 'Parcela Pendente Urgente (1/2)',
            valorParcela: 150,
            dataVencimentoParcela: '2026-09-15',
            status: 'pendente',
          },
        ],
      };

      const bills = getUpcomingBills({
        expenses: [paidExpense, pendingExpense],
        invoices: [],
        cards: [],
        selectedCompetencia: '2026-09',
        limit: 5,
      });

      // Apenas a parcela pendente deve ser exibida; itens quitados não devem constar
      expect(bills).toHaveLength(1);
      expect(bills[0].descricao).toBe('Parcela Pendente Urgente (1/2)');
      expect(bills[0].isPaid).toBe(false);
    });

    it('não exibe gastos recorrentes já quitados no mês vigente mesmo havendo registro raiz/legado de meses anteriores', () => {
      const recurringExpenses: any[] = [
        {
          id: 'chatgpt-legacy-root',
          descricao: 'ChatGPT',
          tipo: 'despesa',
          status: 'pendente',
          origemLancamento: 'recorrente',
          dataInicioRecorrencia: '2026-07-01',
          competencia: '2026-07-01',
          dataVencimento: '2026-07-17',
          valor: 114,
        },
        {
          id: 'chatgpt-sep-paid',
          descricao: 'ChatGPT',
          tipo: 'despesa',
          status: 'pago',
          origemLancamento: 'recorrente',
          dataInicioRecorrencia: '2026-07-01',
          recorrenciaPaiId: 'chatgpt-legacy-root',
          competencia: '2026-09-01',
          dataVencimento: '2026-09-17',
          dataPagamento: '2026-09-30',
          valor: 114,
        },
      ];

      const bills = getUpcomingBills({
        expenses: recurringExpenses,
        invoices: [],
        cards: [],
        selectedCompetencia: '2026-09',
        limit: 5,
      });

      // Não deve exibir ChatGPT pois a competência ativa (2026-09) já está quitada
      expect(bills.find((b) => b.descricao.includes('ChatGPT'))).toBeUndefined();
    });
  });

  describe('Renderização e Interações no Componente UpcomingBillsTimeline', () => {
    it('renderiza as parcelas com a data de vencimento da fatura e valor individual da parcela', () => {
      const expenseParcelado: any = {
        id: 'exp-geladeira',
        descricao: 'Geladeira Frost Free',
        tipo: 'despesa',
        status: 'pendente',
        origemLancamento: 'parcelado',
        numeroParcelas: 10,
        valor: 3500,
        competencia: '2026-08',
        dataVencimento: '2026-08-10', // Registro pai
        cartaoCreditoId: 'card-nubank',
        lancamentosBase: [
          {
            id: 'parc-gel-2',
            gastoId: 'exp-geladeira',
            numeroParcela: 2,
            descricao: 'Geladeira Frost Free (2/10)',
            valorParcela: 350,
            dataVencimentoParcela: '2026-09-10',
            faturaCartaoId: 'fat-sep', // Vence em 2026-10-05
            status: 'pendente',
          },
        ],
      };

      useAppStore.setState({
        expenses: [expenseParcelado],
        invoices: mockInvoices as any,
        cards: [cardNubank as any],
        selectedCompetencia: '2026-09',
      });

      render(<UpcomingBillsTimeline />);

      expect(screen.getByText('Próximos Vencimentos')).toBeInTheDocument();
      // Deve exibir o nome da parcela
      expect(screen.getByText('Geladeira Frost Free (2/10)')).toBeInTheDocument();
      // Deve exibir a data de vencimento da fatura (05/10/2026), e não do registro pai (10/08/2026)
      expect(screen.getByText(/Vence: 05\/10\/2026/i)).toBeInTheDocument();
      // Não deve exibir a data do registro pai
      expect(screen.queryByText(/Vence: 10\/08\/2026/i)).not.toBeInTheDocument();
      // Deve exibir o valor da parcela (R$ 350,00) e não o total de R$ 3.500,00
      expect(screen.getByText(/350/i)).toBeInTheDocument();
      expect(screen.queryByText(/3\.500/i)).not.toBeInTheDocument();
    });

    it('permite pagar uma parcela chamando toggleInstallmentStatus', async () => {
      const mockToggleInstallmentStatus = vi.fn();
      const mockToggleExpenseStatus = vi.fn();

      const expenseParcelado: any = {
        id: 'exp-tv',
        descricao: 'Smart TV 55',
        tipo: 'despesa',
        status: 'pendente',
        origemLancamento: 'parcelado',
        numeroParcelas: 4,
        valor: 2000,
        competencia: '2026-09',
        dataVencimento: '2026-09-10',
        lancamentosBase: [
          {
            id: 'parc-tv-1',
            gastoId: 'exp-tv',
            numeroParcela: 1,
            descricao: 'Smart TV 55 (1/4)',
            valorParcela: 500,
            dataVencimentoParcela: '2026-09-15',
            status: 'pendente',
          },
        ],
      };

      useAppStore.setState({
        expenses: [expenseParcelado],
        toggleInstallmentStatus: mockToggleInstallmentStatus,
        toggleExpenseStatus: mockToggleExpenseStatus,
      });

      render(<UpcomingBillsTimeline />);

      const payButton = screen.getByTitle('Marcar como pago');
      fireEvent.click(payButton);

      await waitFor(() => {
        expect(mockToggleInstallmentStatus).toHaveBeenCalledWith('exp-tv', 'parc-tv-1');
        expect(mockToggleExpenseStatus).not.toHaveBeenCalled();
      });
    });

    it('exibe mensagem quando não houver contas a vencer', () => {
      useAppStore.setState({
        expenses: [],
      });

      render(<UpcomingBillsTimeline />);

      expect(screen.getByText('Nenhuma conta a vencer neste mês.')).toBeInTheDocument();
    });
  });
});
