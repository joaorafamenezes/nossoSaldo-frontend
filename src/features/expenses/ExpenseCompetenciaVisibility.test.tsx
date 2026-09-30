import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { ExpenseCategoryAccordion } from './ExpenseCategoryAccordion';
import { ExpenseGrid } from './ExpenseGrid';
import { ExpenseTable } from './ExpenseTable';
import { ExpensesPage } from './ExpensesPage';
import { useAppStore } from '../../stores/useAppStore';
import { Gasto } from '../../types/financial';

describe('User Story: Remoção do label de Competência na tela principal de gastos', () => {
  const mockSingleExpenseOctober: Gasto = {
    id: 'gasto-oct-1',
    descricao: 'Compra Supermercado Outubro',
    tipo: 'despesa',
    status: 'pendente',
    origemLancamento: 'unico',
    numeroParcelas: 1,
    naoCompartilhar: false,
    valor: 450.0,
    competencia: '2026-10-01',
    dataVencimento: '2026-10-15',
    categoriaId: 'cat-alimentacao',
    responsavelId: 'user-1',
    responsavelNome: 'João',
    observacao: 'Compras do mês de outubro',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
  };

  const mockRevenueOctober: Gasto = {
    id: 'receita-oct-2',
    descricao: 'Salário Outubro',
    tipo: 'receita',
    status: 'pago',
    origemLancamento: 'unico',
    numeroParcelas: 1,
    naoCompartilhar: false,
    valor: 7500.0,
    competencia: '2026-10-01',
    dataVencimento: '2026-10-05',
    categoriaId: 'cat-renda',
    responsavelId: 'user-1',
    responsavelNome: 'João',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    useAppStore.setState({
      selectedCompetencia: '2026-10',
      categories: [
        { id: 'cat-alimentacao', descricao: 'Alimentação', cor: '#10b981', iconName: '🍔' },
        { id: 'cat-renda', descricao: 'Renda & Salário', cor: '#6366f1', iconName: '💼' },
      ],
      cards: [],
      expenses: [mockSingleExpenseOctober, mockRevenueOctober],
    });
  });

  describe('CT001: Exibição do label para gasto unico', () => {
    it('Dado que estou logado e com gasto/receita em outubro, na visualização de categorias (ExpenseCategoryAccordion) o gasto é exibido sem o label "Competência: 10/2026"', () => {
      render(
        <ExpenseCategoryAccordion
          expenses={[mockSingleExpenseOctober, mockRevenueOctober]}
          selectedIds={[]}
          onToggleSelect={vi.fn()}
        />
      );

      // O título do gasto e da receita estão visíveis
      expect(screen.getByText('Compra Supermercado Outubro')).toBeInTheDocument();
      expect(screen.getByText('Salário Outubro')).toBeInTheDocument();

      // O label "Competência:" ou "Competência: 10/2026" NÃO deve existir na tela principal
      expect(screen.queryByText(/Competência:/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Competência: 10\/2026/i)).not.toBeInTheDocument();
    });

    it('Na visualização em grade (ExpenseGrid) o gasto único de outubro não exibe label de competência', () => {
      render(
        <ExpenseGrid
          expenses={[mockSingleExpenseOctober, mockRevenueOctober]}
          selectedIds={[]}
          onToggleSelect={vi.fn()}
        />
      );

      expect(screen.getByText('Compra Supermercado Outubro')).toBeInTheDocument();
      expect(screen.queryByText(/Competência:/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Competência: 10\/2026/i)).not.toBeInTheDocument();
    });

    it('Na visualização em tabela (ExpenseTable) o gasto único de outubro não exibe label de competência', () => {
      render(
        <ExpenseTable
          expenses={[mockSingleExpenseOctober, mockRevenueOctober]}
          selectedIds={[]}
          onToggleSelect={vi.fn()}
          onSelectAll={vi.fn()}
        />
      );

      expect(screen.getByText('Compra Supermercado Outubro')).toBeInTheDocument();
      expect(screen.queryByText(/Competência:/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Competência: 10\/2026/i)).not.toBeInTheDocument();
    });

    it('Na página principal (ExpensesPage) com filtro de outubro selecionado, nenhum card exibe label de competência', () => {
      render(<ExpensesPage />);

      expect(screen.getByText('Compra Supermercado Outubro')).toBeInTheDocument();
      // Não deve haver nenhum elemento contendo "Competência: " nos cards de lançamento
      expect(screen.queryByText(/Competência:\s*10\/2026/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/^Competência:/i)).not.toBeInTheDocument();
    });
  });
});
