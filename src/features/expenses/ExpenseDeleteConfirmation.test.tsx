import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as React from 'react';
import { ExpenseCategoryAccordion } from './ExpenseCategoryAccordion';
import { ExpenseGrid } from './ExpenseGrid';
import { ExpenseTable } from './ExpenseTable';
import { ExpensesPage } from './ExpensesPage';
import { ExpenseDeleteModal } from './ExpenseDeleteModal';
import { useAppStore } from '../../stores/useAppStore';
import { Gasto } from '../../types/financial';

describe('Confirmação de Exclusão de Lançamentos - CT001', () => {
  const mockExpense: Gasto = {
    id: 'gasto-delete-1',
    descricao: 'Almoço de Negócios',
    tipo: 'despesa',
    status: 'pendente',
    origemLancamento: 'unico',
    numeroParcelas: 1,
    naoCompartilhar: false,
    valor: 145.5,
    competencia: '2026-09-01',
    dataVencimento: '2026-09-25',
    categoriaId: 'cat-alimentacao',
    responsavelId: 'user-1',
    responsavelNome: 'João',
    observacao: 'Almoço com clientes da consultoria',
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  };

  const mockRevenue: Gasto = {
    id: 'receita-delete-2',
    descricao: 'Consultoria Freelance',
    tipo: 'receita',
    status: 'pendente',
    origemLancamento: 'unico',
    numeroParcelas: 1,
    naoCompartilhar: false,
    valor: 3500.0,
    competencia: '2026-09-01',
    dataVencimento: '2026-09-28',
    categoriaId: 'cat-servicos',
    responsavelId: 'user-1',
    responsavelNome: 'João',
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    useAppStore.setState({
      selectedCompetencia: '2026-09',
      categories: [
        { id: 'cat-alimentacao', descricao: 'Alimentação', cor: '#10b981', iconName: '🍔' },
        { id: 'cat-servicos', descricao: 'Serviços & Renda', cor: '#6366f1', iconName: '💼' },
      ],
      cards: [],
      expenses: [mockExpense, mockRevenue],
    });
  });

  describe('Visualização por Categoria (ExpenseCategoryAccordion)', () => {
    it('exibe mensagem pedindo confirmação ao clicar no botão de excluir', async () => {
      const deleteExpenseMock = vi.fn().mockResolvedValue(undefined);
      useAppStore.setState({ deleteExpense: deleteExpenseMock });

      render(
        <ExpenseCategoryAccordion
          expenses={[mockExpense]}
          selectedIds={[]}
          onToggleSelect={vi.fn()}
        />
      );

      // Clica no botão de excluir (ícone de lixeira)
      const deleteBtn = screen.getByTitle('Excluir Lançamento');
      fireEvent.click(deleteBtn);

      // Deve exibir mensagem perguntando se o usuário deseja remover o item
      expect(screen.getByText('Confirmar Exclusão')).toBeInTheDocument();
      expect(
        screen.getByText(/Deseja realmente remover o lançamento/i)
      ).toBeInTheDocument();
      expect(screen.getByText('"Almoço de Negócios"')).toBeInTheDocument();
      expect(screen.getByText(/Esta ação removerá este registro do seu histórico financeiro/i)).toBeInTheDocument();

      // Botão "Voltar atrás" permite cancelar a ação
      const btnVoltar = screen.getByRole('button', { name: /Voltar atrás/i });
      fireEvent.click(btnVoltar);

      // Modal fecha e deleteExpense NÃO foi chamado
      expect(deleteExpenseMock).not.toHaveBeenCalled();
      expect(screen.queryByText('Confirmar Exclusão')).not.toBeInTheDocument();
    });

    it('executa a exclusão quando o usuário confirma no modal', async () => {
      const deleteExpenseMock = vi.fn().mockResolvedValue(undefined);
      useAppStore.setState({ deleteExpense: deleteExpenseMock });

      render(
        <ExpenseCategoryAccordion
          expenses={[mockExpense]}
          selectedIds={[]}
          onToggleSelect={vi.fn()}
        />
      );

      // Clica para excluir
      const deleteBtn = screen.getByTitle('Excluir Lançamento');
      fireEvent.click(deleteBtn);

      // Clica no botão "Sim, Excluir"
      const btnConfirmar = screen.getByRole('button', { name: /Sim, Excluir/i });
      fireEvent.click(btnConfirmar);

      await waitFor(() => {
        expect(deleteExpenseMock).toHaveBeenCalledTimes(1);
        expect(deleteExpenseMock).toHaveBeenCalledWith('gasto-delete-1');
      });
    });
  });

  describe('Visualização em Grade (ExpenseGrid)', () => {
    it('exibe mensagem de confirmação para receita e permite confirmar', async () => {
      const deleteExpenseMock = vi.fn().mockResolvedValue(undefined);
      useAppStore.setState({ deleteExpense: deleteExpenseMock });

      render(
        <ExpenseGrid
          expenses={[mockRevenue]}
          selectedIds={[]}
          onToggleSelect={vi.fn()}
        />
      );

      const deleteBtn = screen.getByTitle('Excluir');
      fireEvent.click(deleteBtn);

      expect(screen.getByText('Confirmar Exclusão')).toBeInTheDocument();
      expect(screen.getByText(/Deseja realmente remover o lançamento/i)).toBeInTheDocument();
      expect(screen.getByText('"Consultoria Freelance"')).toBeInTheDocument();

      const btnConfirmar = screen.getByRole('button', { name: /Sim, Excluir/i });
      fireEvent.click(btnConfirmar);

      await waitFor(() => {
        expect(deleteExpenseMock).toHaveBeenCalledWith('receita-delete-2');
      });
    });
  });

  describe('Visualização em Tabela (ExpenseTable)', () => {
    it('exibe mensagem de confirmação na tabela e fecha ao clicar em voltar atrás', async () => {
      const deleteExpenseMock = vi.fn().mockResolvedValue(undefined);
      useAppStore.setState({ deleteExpense: deleteExpenseMock });

      render(
        <ExpenseTable
          expenses={[mockExpense]}
          selectedIds={[]}
          onToggleSelect={vi.fn()}
          onSelectAll={vi.fn()}
        />
      );

      const deleteBtn = screen.getByTitle('Excluir');
      fireEvent.click(deleteBtn);

      expect(screen.getByText('Confirmar Exclusão')).toBeInTheDocument();
      expect(screen.getByText('"Almoço de Negócios"')).toBeInTheDocument();

      const btnVoltar = screen.getByRole('button', { name: /Voltar atrás/i });
      fireEvent.click(btnVoltar);

      expect(deleteExpenseMock).not.toHaveBeenCalled();
      expect(screen.queryByText('Confirmar Exclusão')).not.toBeInTheDocument();
    });
  });

  describe('Ações em Massa e Modal de Exclusão em Lote', () => {
    it('oculta checkboxes de seleção e barra flutuante de ações em massa na ExpensesPage por padrão', () => {
      useAppStore.setState({
        expenses: [mockExpense, mockRevenue],
      });

      render(<ExpensesPage />);

      // Não deve exibir checkboxes de seleção em massa na listagem
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
      // Não deve exibir barra flutuante de ações em massa
      expect(screen.queryByText(/itens selecionados/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^Excluir$/i })).not.toBeInTheDocument();
    });

    it('ExpenseDeleteModal renderiza corretamente os dados ao receber múltiplos itens para exclusão em lote', async () => {
      const onConfirmMock = vi.fn();
      const onCloseMock = vi.fn();

      render(
        <ExpenseDeleteModal
          isOpen={true}
          selectedExpenses={[mockExpense, mockRevenue]}
          selectedCount={2}
          onClose={onCloseMock}
          onConfirm={onConfirmMock}
        />
      );

      expect(screen.getByText('Confirmar Exclusão')).toBeInTheDocument();
      expect(screen.getByText(/Deseja realmente remover os/i)).toBeInTheDocument();
      expect(screen.getAllByText(/2 lançamentos selecionados/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('2 itens')).toBeInTheDocument();
      expect(screen.getByText(/Almoço de Negócios/i)).toBeInTheDocument();
      expect(screen.getByText(/Consultoria Freelance/i)).toBeInTheDocument();

      // Clica em "Voltar atrás"
      const btnVoltar = screen.getByRole('button', { name: /Voltar atrás/i });
      fireEvent.click(btnVoltar);
      expect(onCloseMock).toHaveBeenCalledTimes(1);

      // Clica em "Sim, Excluir (2)"
      const btnConfirmar = screen.getByRole('button', { name: /Sim, Excluir \(2\)/i });
      fireEvent.click(btnConfirmar);
      await waitFor(() => {
        expect(onConfirmMock).toHaveBeenCalledTimes(1);
      });
    });

    it('permite excluir despesa recorrente projetada virtualmente via confirmação', async () => {
      const deleteExpenseMock = vi.fn().mockResolvedValue(undefined);
      useAppStore.setState({ deleteExpense: deleteExpenseMock });

      const virtualRecurringExpense: Gasto = {
        id: 'virtual-d6e8f82b-fb44-47d4-b8f2-63d946612dc9-2026-09',
        descricao: 'Pensão Alimentícia',
        tipo: 'despesa',
        status: 'pendente',
        origemLancamento: 'recorrente',
        numeroParcelas: 1,
        naoCompartilhar: false,
        valor: 1200.0,
        competencia: '2026-09-01',
        dataVencimento: '2026-09-10',
        categoriaId: 'cat-alimentacao',
        responsavelId: 'user-1',
        responsavelNome: 'João',
        createdAt: '2026-09-01T10:00:00.000Z',
        updatedAt: '2026-09-01T10:00:00.000Z',
      };

      render(
        <ExpenseCategoryAccordion
          expenses={[virtualRecurringExpense]}
          selectedIds={[]}
          onToggleSelect={vi.fn()}
        />
      );

      const deleteBtn = screen.getByTitle('Excluir Lançamento');
      fireEvent.click(deleteBtn);

      expect(screen.getByText('Confirmar Exclusão')).toBeInTheDocument();
      expect(screen.getByText('"Pensão Alimentícia"')).toBeInTheDocument();

      const btnConfirmar = screen.getByRole('button', { name: /Sim, Excluir/i });
      fireEvent.click(btnConfirmar);

      await waitFor(() => {
        expect(deleteExpenseMock).toHaveBeenCalledTimes(1);
        expect(deleteExpenseMock).toHaveBeenCalledWith('virtual-d6e8f82b-fb44-47d4-b8f2-63d946612dc9-2026-09');
      });
    });
  });
});
