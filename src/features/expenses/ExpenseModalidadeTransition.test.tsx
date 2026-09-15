import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as React from 'react';
import { ExpenseDrawerForm } from './ExpenseDrawerForm';
import { useAppStore } from '../../stores/useAppStore';
import { Gasto } from '../../types/financial';

describe('Transição de Modalidade de Lançamentos (Recorrente <-> Parcelado <-> Único)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('permite converter um lançamento recorrente para único/à vista via updateExpense', async () => {
    const mockRecurringExpense: Gasto = {
      id: 'gst-rec-internet',
      descricao: 'Internet Fibra 600MB',
      tipo: 'despesa',
      status: 'pendente',
      origemLancamento: 'recorrente',
      numeroParcelas: 1,
      naoCompartilhar: false,
      valor: 150,
      competencia: '2026-09-01',
      dataVencimento: '2026-09-15',
      dataInicioRecorrencia: '2026-09-15',
      categoriaId: 'cat-1',
      responsavelId: 'usr-1',
      createdAt: '2026-09-01T10:00:00.000Z',
      updatedAt: '2026-09-01T10:00:00.000Z',
    };

    useAppStore.setState({
      isExpenseDrawerOpen: true,
      editingExpense: mockRecurringExpense,
      categories: [{ id: 'cat-1', descricao: 'Moradia', iconName: 'Home' }],
      cards: [],
      expenses: [mockRecurringExpense],
      selectedCompetencia: '2026-09',
    });

    render(<ExpenseDrawerForm />);

    // Verifica se carregou em modo Recorrente
    expect(screen.getByText('Editar Lançamento')).toBeInTheDocument();
    expect(screen.getByText(/Recorrência Contínua Automática/i)).toBeInTheDocument();

    // Clica no botão "Único"
    const unicoBtn = screen.getByRole('button', { name: /^Único$/i });
    fireEvent.click(unicoBtn);

    // Submete o formulário
    const submitBtn = screen.getByRole('button', { name: /Salvar Alterações/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      const updated = useAppStore.getState().expenses.find((e) => e.id === 'gst-rec-internet');
      expect(updated).toBeDefined();
      expect(updated?.origemLancamento).toBe('unico');
      expect(updated?.dataInicioRecorrencia).toBeUndefined();
      expect(updated?.lancamentosBase).toBeUndefined();
    });
  });

  it('permite converter um lançamento recorrente para parcelado gerando as parcelas filhas', async () => {
    const mockRecurringSeguro: Gasto = {
      id: 'gst-rec-seguro',
      descricao: 'Seguro Auto',
      tipo: 'despesa',
      status: 'pendente',
      origemLancamento: 'recorrente',
      numeroParcelas: 1,
      naoCompartilhar: false,
      valor: 600,
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
      editingExpense: mockRecurringSeguro,
      categories: [{ id: 'cat-1', descricao: 'Transporte', iconName: 'Car' }],
      cards: [],
      expenses: [mockRecurringSeguro],
      selectedCompetencia: '2026-09',
    });

    render(<ExpenseDrawerForm />);

    // Clica no botão "Parcelado"
    const parceladoBtn = screen.getByRole('button', { name: /^Parcelado$/i });
    fireEvent.click(parceladoBtn);

    // Ajusta o número de parcelas para 3
    const inputParcelas = screen.getByDisplayValue('2');
    fireEvent.change(inputParcelas, { target: { value: '3' } });

    // Salva
    const submitBtn = screen.getByRole('button', { name: /Salvar Alterações/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      const updated = useAppStore.getState().expenses.find((e) => e.id === 'gst-rec-seguro');
      expect(updated).toBeDefined();
      expect(updated?.origemLancamento).toBe('parcelado');
      expect(updated?.numeroParcelas).toBe(3);
      expect(updated?.lancamentosBase).toHaveLength(3);
      expect(updated?.lancamentosBase?.[0].valorParcela).toBe(200);
      expect(updated?.lancamentosBase?.[0].dataVencimentoParcela).toBe('2026-09-20');
      expect(updated?.lancamentosBase?.[1].dataVencimentoParcela).toBe('2026-10-20');
      expect(updated?.lancamentosBase?.[2].dataVencimentoParcela).toBe('2026-11-20');
    });
  });

  it('permite converter um lançamento único para recorrente', async () => {
    const mockUniqueExpense: Gasto = {
      id: 'gst-unico-netflix',
      descricao: 'Netflix Assinatura',
      tipo: 'despesa',
      status: 'pendente',
      origemLancamento: 'unico',
      numeroParcelas: 1,
      naoCompartilhar: false,
      valor: 55.9,
      competencia: '2026-09-01',
      dataVencimento: '2026-09-10',
      categoriaId: 'cat-1',
      responsavelId: 'usr-1',
      createdAt: '2026-09-01T10:00:00.000Z',
      updatedAt: '2026-09-01T10:00:00.000Z',
    };

    useAppStore.setState({
      isExpenseDrawerOpen: true,
      editingExpense: mockUniqueExpense,
      categories: [{ id: 'cat-1', descricao: 'Lazer', iconName: 'Film' }],
      cards: [],
      expenses: [mockUniqueExpense],
      selectedCompetencia: '2026-09',
    });

    render(<ExpenseDrawerForm />);

    // Clica no botão "🔁 Fixo / Recorrente"
    const recorrenteBtn = screen.getByRole('button', { name: /Recorrente/i });
    fireEvent.click(recorrenteBtn);

    // Salva
    const submitBtn = screen.getByRole('button', { name: /Salvar Alterações/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      const updated = useAppStore.getState().expenses.find((e) => e.id === 'gst-unico-netflix');
      expect(updated).toBeDefined();
      expect(updated?.origemLancamento).toBe('recorrente');
      expect(updated?.dataInicioRecorrencia).toBe('2026-09-10');
      expect(updated?.lancamentosBase).toBeUndefined();
    });
  });
});
