import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as React from 'react';
import { calculateCardDueDate } from '../../lib/utils';
import { ExpenseDrawerForm } from './ExpenseDrawerForm';
import { useAppStore } from '../../stores/useAppStore';

describe('Lançamento Já Pago e Vencimento Automático de Cartão de Crédito', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useAppStore.setState({
      isExpenseDrawerOpen: true,
      editingExpense: null,
      categories: [
        { id: 'cat-1', descricao: 'Alimentação', cor: '#10b981', iconName: '🍔' },
        { id: 'cat-2', descricao: 'Moradia', cor: '#6366f1', iconName: '🏠' },
      ],
      cards: [
        {
          id: 'card-nubank',
          descricao: 'Nubank Roxinho',
          bandeira: 'mastercard',
          ultimosDigitos: 'e64a',
          diaFechamento: 10,
          diaVencimento: 17,
          valorLimite: 1000,
          limiteDisponivel: 1000,
          corGradiente: 'from-purple-900 to-black',
        },
        {
          id: 'card-inter',
          descricao: 'Banco Inter',
          bandeira: 'mastercard',
          ultimosDigitos: '1234',
          diaFechamento: 25,
          diaVencimento: 5,
          valorLimite: 2000,
          limiteDisponivel: 2000,
          corGradiente: 'from-amber-900 to-black',
        },
      ],
      selectedCompetencia: '2026-09',
    });
  });

  describe('Cálculo Automático de Data de Vencimento do Cartão (calculateCardDueDate)', () => {
    const cardNubank = { diaFechamento: 10, diaVencimento: 17 };
    const cardInter = { diaFechamento: 25, diaVencimento: 5 };

    it('calcula vencimento no mesmo mês se a compra ocorrer antes do fechamento (dia 7 <= 10)', () => {
      const dueDate = calculateCardDueDate(cardNubank, '2026-09-07');
      expect(dueDate).toBe('2026-09-17');
    });

    it('calcula vencimento no mês subsequente se a compra ocorrer após o fechamento (dia 15 > 10)', () => {
      const dueDate = calculateCardDueDate(cardNubank, '2026-09-15');
      expect(dueDate).toBe('2026-10-17');
    });

    it('calcula vencimento no mês seguinte quando diaVencimento <= diaFechamento (diaFechamento=25, diaVencimento=5)', () => {
      // Compra no dia 7 <= 25: fatura de setembro, que vence no dia 5 de outubro
      const dueDate = calculateCardDueDate(cardInter, '2026-09-07');
      expect(dueDate).toBe('2026-10-05');
    });

    it('calcula vencimento em 2 meses a frente se após o fechamento quando diaVencimento <= diaFechamento (dia 28 > 25)', () => {
      // Compra no dia 28 > 25: fatura de outubro, que vence no dia 5 de novembro
      const dueDate = calculateCardDueDate(cardInter, '2026-09-28');
      expect(dueDate).toBe('2026-11-05');
    });

    it('trata virada de ano corretamente (dezembro para janeiro)', () => {
      const dueDate = calculateCardDueDate(cardNubank, '2026-12-15');
      expect(dueDate).toBe('2027-01-17');
    });

    it('ajusta para o último dia do mês quando o mês tem menos dias (fevereiro)', () => {
      const cardEndMonth = { diaFechamento: 10, diaVencimento: 31 };
      const dueDate = calculateCardDueDate(cardEndMonth, '2026-02-05');
      expect(dueDate).toBe('2026-02-28');
    });
  });

  describe('Formulário de Lançamento (ExpenseDrawerForm)', () => {
    it('permite selecionar status "Já Pago" ao criar um novo lançamento', async () => {
      const addExpenseMock = vi.fn().mockResolvedValue(undefined);
      useAppStore.setState({ addExpense: addExpenseMock });

      render(<ExpenseDrawerForm />);

      // Preenche descrição e valor
      fireEvent.change(screen.getByLabelText(/Descrição do Lançamento/i), {
        target: { value: 'Almoço Restaurante' },
      });
      fireEvent.change(screen.getByLabelText(/Valor \(R\$\)/i), {
        target: { value: '45.50' },
      });

      // Clica no botão "Já Pago"
      const btnPago = screen.getByRole('button', { name: /Já Pago/i });
      fireEvent.click(btnPago);

      // Submete o formulário
      const btnConfirmar = screen.getByRole('button', { name: /Confirmar Lançamento/i });
      fireEvent.click(btnConfirmar);

      await waitFor(() => {
        expect(addExpenseMock).toHaveBeenCalledWith(
          expect.objectContaining({
            descricao: 'Almoço Restaurante',
            valor: 45.5,
            status: 'pago',
            dataPagamento: expect.any(String),
          })
        );
      });
    });

    it('preenche automaticamente a data de vencimento do cartão ao selecioná-lo', async () => {
      render(<ExpenseDrawerForm />);

      const selectCartao = screen.getByLabelText(/Forma de Pagamento \/ Cartão de Crédito/i);

      // Seleciona o cartão Nubank (vencimento dia 17)
      fireEvent.change(selectCartao, { target: { value: 'card-nubank' } });

      const inputVencimento = screen.getByLabelText(/Data de Vencimento/i) as HTMLInputElement;
      expect(inputVencimento.value).toBe('2026-09-17');

      // Verifica exibição do aviso visual de vencimento automático
      expect(screen.getByText(/Vencimento automático na fatura vigente/i)).toBeInTheDocument();
    });
  });
});
