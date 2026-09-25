import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as React from 'react';
import { ExpenseDrawerForm } from './ExpenseDrawerForm';
import { ExpenseCategoryAccordion } from './ExpenseCategoryAccordion';
import { ExpenseGrid } from './ExpenseGrid';
import { ExpenseTable } from './ExpenseTable';
import { useAppStore } from '../../stores/useAppStore';
import { Gasto } from '../../types/financial';

describe('Campo de Observações em Gastos (CT001 e CT002)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useAppStore.setState({
      isExpenseDrawerOpen: true,
      editingExpense: null,
      categories: [
        { id: 'cat-1', descricao: 'Alimentação', cor: '#10b981', iconName: '🍔' },
        { id: 'cat-2', descricao: 'Serviços', cor: '#6366f1', iconName: '🛠️' },
      ],
      cards: [],
      selectedCompetencia: '2026-09',
      expenses: [],
    });
  });

  describe('CT001: Novo Lançamento', () => {
    it('exibe um textArea para informar observações ao abrir a tela de novo lançamento', () => {
      render(<ExpenseDrawerForm />);

      const textarea = screen.getByLabelText(/Observações/i);
      expect(textarea).toBeInTheDocument();
      expect(textarea.tagName).toBe('TEXTAREA');
      expect(textarea).toHaveAttribute('id', 'observacao');
      expect(textarea).toHaveAttribute('name', 'observacao');
      expect((textarea as HTMLTextAreaElement).value).toBe('');
    });

    it('persiste a observação informada no payload de criação do gasto', async () => {
      const addExpenseMock = vi.fn().mockResolvedValue(undefined);
      useAppStore.setState({ addExpense: addExpenseMock });

      render(<ExpenseDrawerForm />);

      // Preenche os dados obrigatórios
      fireEvent.change(screen.getByLabelText(/Descrição do Lançamento/i), {
        target: { value: 'Notebook novo para trabalho' },
      });
      fireEvent.change(screen.getByLabelText(/Valor \(R\$\)/i), {
        target: { value: '4500.00' },
      });

      // Preenche a observação
      const textarea = screen.getByLabelText(/Observações/i);
      fireEvent.change(textarea, {
        target: { value: 'Comprado com desconto corporativo de 15% na loja oficial Dell' },
      });

      // Submete o formulário
      const btnConfirmar = screen.getByRole('button', { name: /Confirmar Lançamento/i });
      fireEvent.click(btnConfirmar);

      await waitFor(() => {
        expect(addExpenseMock).toHaveBeenCalledTimes(1);
        expect(addExpenseMock).toHaveBeenCalledWith(
          expect.objectContaining({
            descricao: 'Notebook novo para trabalho',
            valor: 4500,
            observacao: 'Comprado com desconto corporativo de 15% na loja oficial Dell',
          })
        );
      });
    });
  });

  describe('CT002: Alteração de lançamento', () => {
    const existingExpense: Gasto = {
      id: 'gasto-123',
      descricao: 'Manutenção do Carro',
      tipo: 'despesa',
      status: 'pendente',
      origemLancamento: 'unico',
      numeroParcelas: 1,
      naoCompartilhar: false,
      valor: 850,
      competencia: '2026-09-01',
      dataVencimento: '2026-09-20',
      categoriaId: 'cat-2',
      responsavelId: 'user-1',
      responsavelNome: 'João',
      observacao: 'Troca de pastilhas de freio e óleo sintético 5W30',
      createdAt: '2026-09-01T10:00:00.000Z',
      updatedAt: '2026-09-01T10:00:00.000Z',
    };

    it('exibe no textArea de observação as informações salvas previamente na base de dados', () => {
      useAppStore.setState({
        editingExpense: existingExpense,
      });

      render(<ExpenseDrawerForm />);

      const textarea = screen.getByLabelText(/Observações/i) as HTMLTextAreaElement;
      expect(textarea).toBeInTheDocument();
      expect(textarea.value).toBe('Troca de pastilhas de freio e óleo sintético 5W30');
    });

    it('permite atualizar a observação existente e envia o novo valor ao salvar', async () => {
      const updateExpenseMock = vi.fn().mockResolvedValue(undefined);
      useAppStore.setState({
        editingExpense: existingExpense,
        updateExpense: updateExpenseMock,
      });

      render(<ExpenseDrawerForm />);

      const textarea = screen.getByLabelText(/Observações/i);
      fireEvent.change(textarea, {
        target: { value: 'Revisão completa de 60.000km com troca de pastilhas e amortecedores' },
      });

      const btnSalvar = screen.getByRole('button', { name: /Salvar Alterações/i });
      fireEvent.click(btnSalvar);

      await waitFor(() => {
        expect(updateExpenseMock).toHaveBeenCalledWith(
          'gasto-123',
          expect.objectContaining({
            observacao: 'Revisão completa de 60.000km com troca de pastilhas e amortecedores',
          })
        );
      });
    });

    it('permite limpar a observação existente e envia string vazia para atualizar na base', async () => {
      const updateExpenseMock = vi.fn().mockResolvedValue(undefined);
      useAppStore.setState({
        editingExpense: existingExpense,
        updateExpense: updateExpenseMock,
      });

      render(<ExpenseDrawerForm />);

      const textarea = screen.getByLabelText(/Observações/i);
      fireEvent.change(textarea, { target: { value: '' } });

      const btnSalvar = screen.getByRole('button', { name: /Salvar Alterações/i });
      fireEvent.click(btnSalvar);

      await waitFor(() => {
        expect(updateExpenseMock).toHaveBeenCalledWith(
          'gasto-123',
          expect.objectContaining({
            observacao: '',
          })
        );
      });
    });
  });

  describe('Consulta de Lançamentos com Observação', () => {
    const expenseWithNote: Gasto = {
      id: 'gasto-nota-1',
      descricao: 'Curso de Especialização',
      tipo: 'despesa',
      status: 'pendente',
      origemLancamento: 'unico',
      numeroParcelas: 1,
      naoCompartilhar: false,
      valor: 1200,
      competencia: '2026-09-01',
      dataVencimento: '2026-09-15',
      categoriaId: 'cat-2',
      responsavelId: 'user-1',
      responsavelNome: 'João',
      observacao: 'Certificação internacional em Cloud Architecture',
      createdAt: '2026-09-01T10:00:00.000Z',
      updatedAt: '2026-09-01T10:00:00.000Z',
    };

    it('exibe a observação na visualização por Categoria (Accordion)', () => {
      render(
        <ExpenseCategoryAccordion
          expenses={[expenseWithNote]}
          selectedIds={[]}
          onToggleSelect={vi.fn()}
        />
      );

      expect(screen.getByText(/Certificação internacional em Cloud Architecture/i)).toBeInTheDocument();
      expect(screen.getByText(/Obs:/i)).toBeInTheDocument();
    });

    it('exibe a observação na visualização em Grade (Grid)', () => {
      render(
        <ExpenseGrid
          expenses={[expenseWithNote]}
          selectedIds={[]}
          onToggleSelect={vi.fn()}
        />
      );

      expect(screen.getByText(/Certificação internacional em Cloud Architecture/i)).toBeInTheDocument();
    });

    it('exibe a observação na visualização em Tabela (Table)', () => {
      render(
        <ExpenseTable
          expenses={[expenseWithNote]}
          selectedIds={[]}
          onToggleSelect={vi.fn()}
          onSelectAll={vi.fn()}
        />
      );

      expect(screen.getByText(/Certificação internacional em Cloud Architecture/i)).toBeInTheDocument();
    });
  });
});
