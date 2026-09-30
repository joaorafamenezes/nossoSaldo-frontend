import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ExpensesPage } from '../expenses/ExpensesPage';
import { InvoiceDetailsDrawer } from './InvoiceDetailsDrawer';
import { useAppStore } from '../../stores/useAppStore';
import { Gasto } from '../../types/financial';
import { CartaoCredito, FaturaCartao } from '../../types/cards';

// Mock canvas-confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Sample data representing Nubank September 2026 exactly as in PostgreSQL nossosaldo_dev
const mockNubank: CartaoCredito = {
  id: 'c-nubank-1',
  descricao: 'Cartão Nubank',
  bandeira: 'mastercard',
  ultimosDigitos: '1234',
  cor: '#820AD1',
  corGradiente: 'from-purple-600 to-indigo-600',
  diaFechamento: 15,
  diaVencimento: 22,
  valorLimite: 5000,
  limiteDisponivel: 4327.57,
  faturaAtual: 672.43,
};

const mockInvoiceNubankSep: FaturaCartao = {
  id: 'inv-nubank-sep-2026',
  cartaoCreditoId: 'c-nubank-1',
  competencia: '2026-09',
  dataAbertura: '2026-08-16',
  dataFechamento: '2026-09-15',
  dataVencimento: '2026-09-22',
  valorTotal: 672.43,
  status: 'aberta',
};

const createMockExpense = (overrides: Partial<Gasto>): Gasto => ({
  id: overrides.id || 'exp-default',
  descricao: overrides.descricao || 'Despesa',
  tipo: overrides.tipo || 'despesa',
  status: overrides.status || 'pendente',
  origemLancamento: overrides.origemLancamento || 'unico',
  numeroParcelas: overrides.numeroParcelas || 1,
  naoCompartilhar: false,
  valor: overrides.valor || 0,
  competencia: overrides.competencia || '2026-09-01',
  dataVencimento: overrides.dataVencimento || '2026-09-22',
  cartaoCreditoId: 'c-nubank-1',
  cartaoNome: 'Cartão Nubank',
  responsavelId: overrides.responsavelId || 'usr-joao',
  responsavelNome: overrides.responsavelNome || 'João',
  categoriaId: overrides.categoriaId || 'cat-servicos',
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
  ...overrides,
});

const mockExpensesNubankSep: Gasto[] = [
  createMockExpense({ id: 'exp-chatgpt', descricao: 'ChatGPT', origemLancamento: 'recorrente', valor: 107.54 }),
  createMockExpense({ id: 'exp-amazon', descricao: 'Amazon Prime Video', origemLancamento: 'recorrente', valor: 19.90 }),
  createMockExpense({ id: 'exp-nucel', descricao: 'NuCel', origemLancamento: 'recorrente', valor: 45.00 }),
  createMockExpense({ id: 'exp-teste', descricao: 'Teste pagament na data da fatura', origemLancamento: 'unico', valor: 300.00 }),
  createMockExpense({ id: 'exp-google', descricao: 'Google Play', origemLancamento: 'recorrente', valor: 9.99 }),
  createMockExpense({
    id: 'exp-cinthia',
    descricao: 'Gasto da Cinthia 006',
    origemLancamento: 'recorrente',
    valor: 90.00,
    responsavelId: 'usr-cinthia',
    responsavelNome: 'Cinthia',
    categoriaId: 'cat-pessoal',
  }),
  createMockExpense({
    id: 'exp-presente',
    descricao: 'Presente Nick dia das crianças',
    origemLancamento: 'parcelado',
    numeroParcelas: 3,
    parcelaAtual: 1,
    valor: 300.00,
    status: 'pago',
    dataVencimento: '2026-09-24',
    categoriaId: 'cat-presentes',
    lancamentosBase: [
      {
        id: 'parc-presente-1',
        gastoId: 'exp-presente',
        descricao: 'Presente Nick 1/3',
        numeroParcela: 1,
        valorParcela: 100.00,
        competencia: '2026-09-01',
        dataVencimentoParcela: '2026-09-24',
        status: 'pago',
      },
    ],
  }),
];

describe('Reconciliação e Conformidade: Fatura de Cartão vs Gastos e Receitas', () => {
  beforeEach(() => {
    localStorage.clear();
    const store = useAppStore.getState();
    store.cards = [mockNubank];
    store.invoices = [mockInvoiceNubankSep];
    store.expenses = mockExpensesNubankSep;
    store.selectedCompetencia = '2026-09';
    store.categories = [
      { id: 'cat-servicos', descricao: 'Serviços & Assinaturas', iconName: '💻', cor: '#820AD1' },
      { id: 'cat-pessoal', descricao: 'Pessoal', iconName: '👤', cor: '#ec4899' },
      { id: 'cat-presentes', descricao: 'Presentes', iconName: '🎁', cor: '#f59e0b' },
    ];
    store.jointInfo = {
      id: 'joint-1',
      nomeConta: 'Conta Casal',
      usuario1: { id: 'usr-joao', nome: 'João' },
      usuario2: { id: 'usr-cinthia', nome: 'Cinthia' },
      proporcaoDivisao: 50,
      totalCompartilhadoMes: 0,
      totalPagoUsuario1: 0,
      totalPagoUsuario2: 0,
      saldoAjuste: { devedorId: 'usr-joao', credorId: 'usr-cinthia', valor: 0 },
    };
  });

  describe('CT001: Conferência em Gastos e Receitas', () => {
    it('exibe subtotal de R$ 482,43 quando filtrado por Nubank e status pendente/responsável João, informando o valor consolidado da fatura de R$ 672,43', () => {
      // Mock default filter to João or pendente
      localStorage.setItem(
        '@NossoSaldo:defaultExpenseFilters',
        JSON.stringify({
          selectedType: 'todos',
          selectedStatus: 'pendente',
          selectedCategoryId: 'todos',
          selectedResponsavelId: 'usr-joao',
          selectedCardId: 'c-nubank-1',
        })
      );

      render(<ExpensesPage />);

      // Verifica que o banner de conciliação do cartão está visível
      const banner = screen.getByTestId('card-reconciliation-banner');
      expect(banner).toBeInTheDocument();

      // Exibe subtotal com filtros: R$ 482,43 (CT001)
      expect(banner).toHaveTextContent(/482,43/);

      // Exibe a fatura oficial consolidada do Nubank: R$ 672,43
      expect(banner).toHaveTextContent(/672,43/);

      // Exibe botão para ver a fatura completa
      const fullInvoiceBtn = screen.getByRole('button', { name: /Ver Fatura Completa/i });
      expect(fullInvoiceBtn).toBeInTheDocument();

      // Ao clicar em "Ver Fatura Completa", redefine os filtros para conformidade total
      fireEvent.click(fullInvoiceBtn);

      // Agora o banner atesta a conformidade
      expect(screen.getByText(/Em conformidade \(7 lançamentos\)/i)).toBeInTheDocument();
    });

    it('exibe a fatura em conformidade com R$ 672,43 quando nenhum filtro restritivo de responsável/status estiver ativo', () => {
      localStorage.setItem(
        '@NossoSaldo:defaultExpenseFilters',
        JSON.stringify({
          selectedType: 'todos',
          selectedStatus: 'todos',
          selectedCategoryId: 'todos',
          selectedResponsavelId: 'todos',
          selectedCardId: 'c-nubank-1',
        })
      );

      render(<ExpensesPage />);

      const banner = screen.getByTestId('card-reconciliation-banner');
      expect(banner).toBeInTheDocument();
      expect(banner).toHaveTextContent(/Fatura \(2026-09\):.*672,43/);
      expect(banner).toHaveTextContent(/Em conformidade \(7 lançamentos\)/);
    });
  });

  describe('CT002: Conferência em Cartão de Crédito e Drawer de Fatura', () => {
    it('exibe o valor total consolidado de R$ 672,43 e detalha a composição por responsável (João: R$ 582,43, Cinthia: R$ 90,00) e status (Pendente: R$ 572,43, Pago: R$ 100,00)', () => {
      render(
        <InvoiceDetailsDrawer
          invoice={mockInvoiceNubankSep}
          card={mockNubank}
          onClose={vi.fn()}
        />
      );

      // Verifica total consolidado da fatura
      expect(screen.getByText('Total Consolidado da Fatura')).toBeInTheDocument();
      expect(screen.getAllByText(/672,43/).length).toBeGreaterThanOrEqual(1);

      // Verifica widget de composição
      const breakdown = screen.getByTestId('invoice-composition-breakdown');
      expect(breakdown).toBeInTheDocument();

      // Divisão por Responsável
      expect(breakdown).toHaveTextContent(/João/);
      expect(breakdown).toHaveTextContent(/582,43/);
      expect(breakdown).toHaveTextContent(/Cinthia/);
      expect(breakdown).toHaveTextContent(/90,00/);

      // Situação dos Lançamentos
      expect(breakdown).toHaveTextContent(/Pendente na fatura/);
      expect(breakdown).toHaveTextContent(/572,43/);
      expect(breakdown).toHaveTextContent(/Pago antecipado/);
      expect(breakdown).toHaveTextContent(/100,00/);
    });

    it('permite filtrar por responsável e status no drawer, evidenciando o subtotal de R$ 482,43 sem ambiguidade com o total da fatura', () => {
      render(
        <InvoiceDetailsDrawer
          invoice={mockInvoiceNubankSep}
          card={mockNubank}
          onClose={vi.fn()}
        />
      );

      const breakdown = screen.getByTestId('invoice-composition-breakdown');

      // Clica em "João" para filtrar
      const joaoBtn = within(breakdown).getByText('João');
      fireEvent.click(joaoBtn);

      // Clica em "Pendente na fatura" para filtrar
      const pendenteBtn = within(breakdown).getByText('Pendente na fatura');
      fireEvent.click(pendenteBtn);

      // Banner de filtro ativo aparece
      const activeFilters = screen.getByTestId('invoice-active-filters-banner');
      expect(activeFilters).toBeInTheDocument();
      expect(activeFilters).toHaveTextContent(/João/);
      expect(activeFilters).toHaveTextContent(/pendente/);

      // O subtotal filtrado evidencia exatamente R$ 482,43 (CT002)
      const subtotalLabel = screen.getByText(/Subtotal filtrado:/i);
      expect(subtotalLabel).toBeInTheDocument();
      expect(subtotalLabel.parentElement).toHaveTextContent(/482,43/);

      // E mantém a referência transparente ao total oficial de R$ 672,43
      expect(subtotalLabel.parentElement).toHaveTextContent(/672,43/);

      // Clica em "Ver Fatura Completa" para restaurar a visão integral
      const resetBtn = screen.getByRole('button', { name: /Ver Fatura Completa/i });
      fireEvent.click(resetBtn);

      expect(screen.queryByTestId('invoice-active-filters-banner')).not.toBeInTheDocument();
      expect(screen.getByText(/Total:/i)).toBeInTheDocument();
    });
  });
});
