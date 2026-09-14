import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import * as React from 'react';
import { CategoriesPage } from './CategoriesPage';
import { CategoryExpensesModal } from './CategoryExpensesModal';
import { useAppStore } from '../../stores/useAppStore';

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

describe('Visualização de Lançamentos por Categoria (CategoryExpensesModal)', () => {
  const mockCategories = [
    {
      id: 'cat-mercado',
      descricao: 'Supermercado & Feira',
      teto: 1000,
      cor: '#10b981',
      iconName: '🛒',
    },
    {
      id: 'cat-lazer',
      descricao: 'Restaurantes & Lazer',
      teto: 500,
      cor: '#f59e0b',
      iconName: '🍕',
    },
  ];

  const mockExpenses = [
    {
      id: 'exp-1',
      descricao: 'Carrefour Compras do Mês',
      categoriaId: 'cat-mercado',
      tipo: 'despesa',
      status: 'pago',
      valor: 450,
      competencia: '2026-09',
      dataVencimento: '2026-09-05',
      dataPagamento: '2026-09-05',
      responsavelNome: 'João',
      observacao: 'Carnes e limpeza',
    },
    {
      id: 'exp-2',
      descricao: 'Hortifruti da Semana',
      categoriaId: 'cat-mercado',
      tipo: 'despesa',
      status: 'pendente',
      valor: 200,
      competencia: '2026-09',
      dataVencimento: '2026-09-20',
      responsavelNome: 'Cinthia',
    },
    {
      id: 'exp-3',
      descricao: 'Jantar Italiano',
      categoriaId: 'cat-lazer',
      tipo: 'despesa',
      status: 'pago',
      valor: 180,
      competencia: '2026-09',
      dataVencimento: '2026-09-12',
    },
  ];

  beforeEach(() => {
    useAppStore.setState({
      selectedCompetencia: '2026-09',
      dateFilterMode: 'month',
      customStartDate: '',
      customEndDate: '',
      categories: mockCategories,
      expenses: mockExpenses as any,
      cards: [],
    });
  });

  it('ao clicar em um card de categoria na CategoriesPage, abre o modal de lançamentos', () => {
    render(<CategoriesPage />);

    // Verifica que as categorias estão listadas
    expect(screen.getByText('Supermercado & Feira')).toBeInTheDocument();
    expect(screen.getByText('Visualizar 2 lançamentos')).toBeInTheDocument();

    // Clica no card da categoria Supermercado & Feira
    const mercadoCard = screen.getByText('Supermercado & Feira').closest('[role="button"]')!;
    fireEvent.click(mercadoCard);

    // Modal deve abrir exibindo o título da categoria e os lançamentos correspondentes
    expect(screen.getByText('Visualização detalhada dos lançamentos que compõem esta categoria')).toBeInTheDocument();
    expect(screen.getByText('Carrefour Compras do Mês')).toBeInTheDocument();
    expect(screen.getByText('Hortifruti da Semana')).toBeInTheDocument();
    expect(screen.queryByText('Jantar Italiano')).not.toBeInTheDocument();
  });

  it('renderiza o resumo financeiro da categoria no modal (Total Gasto, Teto e Consumo)', () => {
    render(
      <CategoryExpensesModal
        isOpen={true}
        onClose={vi.fn()}
        category={mockCategories[0]}
      />
    );

    expect(screen.getByText('Total Gasto')).toBeInTheDocument();
    expect(screen.getAllByText('R$ 650,00').length).toBeGreaterThanOrEqual(1); // 450 + 200
    expect(screen.getByText('Teto Orçamentário')).toBeInTheDocument();
    expect(screen.getByText('R$ 1.000,00')).toBeInTheDocument();
    expect(screen.getByText('65%')).toBeInTheDocument();
    expect(screen.getByText('⚠️ 60%')).toBeInTheDocument();
  });

  it('permite filtrar lançamentos por busca textual no modal', () => {
    render(
      <CategoryExpensesModal
        isOpen={true}
        onClose={vi.fn()}
        category={mockCategories[0]}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Buscar por descrição/i);
    fireEvent.change(searchInput, { target: { value: 'Hortifruti' } });

    expect(screen.getByText('Hortifruti da Semana')).toBeInTheDocument();
    expect(screen.queryByText('Carrefour Compras do Mês')).not.toBeInTheDocument();
  });

  it('permite filtrar lançamentos por status (pago vs pendente)', () => {
    render(
      <CategoryExpensesModal
        isOpen={true}
        onClose={vi.fn()}
        category={mockCategories[0]}
      />
    );

    const statusSelect = screen.getByDisplayValue('Status: Todos');
    fireEvent.change(statusSelect, { target: { value: 'pago' } });

    expect(screen.getByText('Carrefour Compras do Mês')).toBeInTheDocument();
    expect(screen.queryByText('Hortifruti da Semana')).not.toBeInTheDocument();
  });

  it('permite marcar lançamento como pago/pendente pelo botão rápido no modal', () => {
    const toggleSpy = vi.fn();
    useAppStore.setState({ toggleExpenseStatus: toggleSpy });

    render(
      <CategoryExpensesModal
        isOpen={true}
        onClose={vi.fn()}
        category={mockCategories[0]}
      />
    );

    // Clica no botão de status do lançamento pendente
    const pendingPayBtn = screen.getByTitle('Marcar como Pago');
    fireEvent.click(pendingPayBtn);

    expect(toggleSpy).toHaveBeenCalledWith('exp-2', '2026-09');
  });

  it('fecha o modal ao clicar no botão de fechar ou pressionar ESC', () => {
    const onClose = vi.fn();
    render(
      <CategoryExpensesModal
        isOpen={true}
        onClose={onClose}
        category={mockCategories[0]}
      />
    );

    const closeBtn = screen.getByTitle('Fechar (ESC)');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
