import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as React from 'react';
import { ExpenseDrawerForm } from './ExpenseDrawerForm';
import { useAppStore } from '../../stores/useAppStore';
import { Gasto } from '../../types/financial';

describe('Edição de Recorrência com Escopo (THIS_ONLY, THIS_AND_FUTURE, ALL_SERIES)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('abre o modal de escopo ao editar um gasto recorrente e salva como THIS_ONLY', async () => {
    const mockRecurringRGE: Gasto = {
      id: 'gst-rec-rge',
      descricao: 'RGE Energia',
      tipo: 'despesa',
      status: 'pendente',
      origemLancamento: 'recorrente',
      numeroParcelas: 1,
      naoCompartilhar: false,
      valor: 200,
      competencia: '2026-09-01',
      dataVencimento: '2026-09-20',
      dataInicioRecorrencia: '2026-09-20',
      categoriaId: 'cat-1',
      responsavelId: 'usr-1',
      createdAt: '2026-09-01T10:00:00.000Z',
      updatedAt: '2026-09-01T10:00:00.000Z',
    };

    useAppStore.setState({
      isExpenseDrawerOpen: true,
      editingExpense: mockRecurringRGE,
      categories: [{ id: 'cat-1', descricao: 'Contas', iconName: 'Home' }],
      cards: [],
      expenses: [mockRecurringRGE],
      selectedCompetencia: '2026-09',
    });

    render(<ExpenseDrawerForm />);

    // Altera o valor de R$ 200 para R$ 280
    const inputValor = screen.getByLabelText(/Valor \(R\$\)/i);
    fireEvent.change(inputValor, { target: { value: '280' } });

    // Clica em Salvar Alterações
    const submitBtn = screen.getByRole('button', { name: /Salvar Alterações/i });
    fireEvent.click(submitBtn);

    // O modal de escopo de recorrência deve abrir
    expect(screen.getByText('Como deseja aplicar esta alteração?')).toBeInTheDocument();
    expect(screen.getByText(/Apenas este lançamento/i)).toBeInTheDocument();
    expect(screen.getByText(/Deste mês em diante/i)).toBeInTheDocument();
    expect(screen.getByText(/Em todas as ocorrências da série/i)).toBeInTheDocument();

    // Seleciona a opção "Apenas este lançamento" (default)
    const confirmScopeBtn = screen.getByRole('button', { name: /Confirmar e Salvar/i });
    fireEvent.click(confirmScopeBtn);

    await waitFor(() => {
      const updated = useAppStore.getState().expenses.find((e) => e.id === 'gst-rec-rge');
      expect(updated).toBeDefined();
      expect(updated?.valor).toBe(280);
      expect(updated?.origemLancamento).toBe('recorrente');
    });
  });

  it('permite reajustar com escopo THIS_AND_FUTURE propagando para ocorrências futuras da série', async () => {
    const rootNetflix: Gasto = {
      id: 'gst-rec-netflix-root',
      descricao: 'Netflix Premium',
      tipo: 'despesa',
      status: 'pendente',
      origemLancamento: 'recorrente',
      numeroParcelas: 1,
      naoCompartilhar: false,
      valor: 55,
      competencia: '2026-08-01',
      dataVencimento: '2026-08-10',
      dataInicioRecorrencia: '2026-08-10',
      categoriaId: 'cat-1',
      responsavelId: 'usr-1',
      createdAt: '2026-08-01T10:00:00.000Z',
      updatedAt: '2026-08-01T10:00:00.000Z',
    };

    const futureNetflixOct: Gasto = {
      id: 'gst-rec-netflix-oct',
      descricao: 'Netflix Premium',
      tipo: 'despesa',
      status: 'pendente',
      origemLancamento: 'recorrente',
      numeroParcelas: 1,
      naoCompartilhar: false,
      valor: 55,
      competencia: '2026-10-01',
      dataVencimento: '2026-10-10',
      recorrenciaPaiId: 'gst-rec-netflix-root',
      categoriaId: 'cat-1',
      responsavelId: 'usr-1',
      createdAt: '2026-08-01T10:00:00.000Z',
      updatedAt: '2026-08-01T10:00:00.000Z',
    };

    useAppStore.setState({
      isExpenseDrawerOpen: true,
      editingExpense: rootNetflix,
      categories: [{ id: 'cat-1', descricao: 'Lazer', iconName: 'Film' }],
      cards: [],
      expenses: [rootNetflix, futureNetflixOct],
      selectedCompetencia: '2026-09',
    });

    render(<ExpenseDrawerForm />);

    // Altera o valor de 55 para 65
    const inputValor = screen.getByLabelText(/Valor \(R\$\)/i);
    fireEvent.change(inputValor, { target: { value: '65' } });

    // Salva
    const submitBtn = screen.getByRole('button', { name: /Salvar Alterações/i });
    fireEvent.click(submitBtn);

    // Modal de escopo abre
    expect(screen.getByText('Como deseja aplicar esta alteração?')).toBeInTheDocument();

    // Seleciona "Deste mês em diante"
    const radioFuture = screen.getByLabelText(/Deste mês em diante/i);
    fireEvent.click(radioFuture);

    // Confirma
    const confirmScopeBtn = screen.getByRole('button', { name: /Confirmar e Salvar/i });
    fireEvent.click(confirmScopeBtn);

    await waitFor(() => {
      const root = useAppStore.getState().expenses.find((e) => e.id === 'gst-rec-netflix-root');
      const oct = useAppStore.getState().expenses.find((e) => e.id === 'gst-rec-netflix-oct');
      expect(root?.valor).toBe(65);
      expect(oct?.valor).toBe(65);
    });
  });
});
