import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as React from 'react';
import { ExpenseDrawerForm } from './ExpenseDrawerForm';
import { ExpenseTable } from './ExpenseTable';
import { ExpenseGrid } from './ExpenseGrid';
import { useAppStore } from '../../stores/useAppStore';
import { Gasto, Categoria } from '../../types/financial';
import { CartaoCredito } from '../../types/cards';

describe('Troca de Forma de Pagamento / Cartão de Crédito (CT001 & CT002)', () => {
  const mockCardNubank: CartaoCredito = {
    id: 'crd-nubank',
    descricao: 'Nubank Roxinho',
    bandeira: 'mastercard',
    corGradiente: 'from-purple-600 to-indigo-600',
    valorLimite: 5000,
    limiteDisponivel: 5000,
    diaFechamento: 5,
    diaVencimento: 12,
    ultimosDigitos: '1234',
    cor: 'purple',
  };

  const mockCategory: Categoria = {
    id: 'cat-geral',
    descricao: 'Eletrônicos',
    iconName: 'Laptop',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('CT001: Sucesso parcelado', () => {
    const mockExpenseParcelado: Gasto = {
      id: 'gst-parcelado-tv',
      descricao: 'Smart TV 55',
      tipo: 'despesa',
      status: 'pendente',
      origemLancamento: 'parcelado',
      numeroParcelas: 3,
      naoCompartilhar: false,
      valor: 3000,
      competencia: '2026-09-01',
      dataVencimento: '2026-09-12',
      categoriaId: 'cat-geral',
      responsavelId: 'usr-1',
      cartaoCreditoId: 'crd-nubank',
      cartaoNome: 'Nubank Roxinho',
      faturaCartaoId: 'fat-1',
      lancamentosBase: [
        {
          id: 'lb-1',
          gastoId: 'gst-parcelado-tv',
          descricao: 'Smart TV 55 - Parcela 1/3',
          numeroParcela: 1,
          valorParcela: 1000,
          dataVencimentoParcela: '2026-09-12',
          status: 'pendente',
          competencia: '2026-09-01',
          faturaCartaoId: 'fat-1',
        },
        {
          id: 'lb-2',
          gastoId: 'gst-parcelado-tv',
          descricao: 'Smart TV 55 - Parcela 2/3',
          numeroParcela: 2,
          valorParcela: 1000,
          dataVencimentoParcela: '2026-10-12',
          status: 'pendente',
          competencia: '2026-10-01',
          faturaCartaoId: 'fat-2',
        },
        {
          id: 'lb-3',
          gastoId: 'gst-parcelado-tv',
          descricao: 'Smart TV 55 - Parcela 3/3',
          numeroParcela: 3,
          valorParcela: 1000,
          dataVencimentoParcela: '2026-11-12',
          status: 'pendente',
          competencia: '2026-11-01',
          faturaCartaoId: 'fat-3',
        },
      ],
      createdAt: '2026-09-01T10:00:00.000Z',
      updatedAt: '2026-09-01T10:00:00.000Z',
    };

    it('ao trocar de cartao de credito para ContaCorrente e selecionar SIM, migra todas as parcelas', async () => {
      useAppStore.setState({
        isExpenseDrawerOpen: true,
        editingExpense: mockExpenseParcelado,
        editingInstallment: null,
        categories: [mockCategory],
        cards: [mockCardNubank],
        expenses: [mockExpenseParcelado],
        selectedCompetencia: '2026-09',
      });

      render(<ExpenseDrawerForm />);

      // Troca a forma de pagamento de Nubank para Conta Corrente (valor vazio)
      const selectCard = screen.getByLabelText(/Forma de Pagamento \/ Cartão de Crédito/i);
      fireEvent.change(selectCard, { target: { value: '' } });

      // Clica em Salvar Alterações
      const submitBtn = screen.getByRole('button', { name: /Salvar Alterações/i });
      fireEvent.click(submitBtn);

      // Deve abrir o PaymentMethodChangeModal com a pergunta do CT001
      expect(screen.getByText('Atualizar forma de pagamento das parcelas')).toBeInTheDocument();
      expect(screen.getByText('Os demais registros deverão ser atualizados também?')).toBeInTheDocument();
      expect(screen.getByText('Sim, atualizar todas as parcelas')).toBeInTheDocument();
      expect(screen.getByText('Não, manter demais parcelas no cartão de crédito')).toBeInTheDocument();

      // Confirma com a opção SIM (já selecionada por padrão)
      const confirmBtn = screen.getByRole('button', { name: /Confirmar e Aplicar/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        const updated = useAppStore.getState().expenses.find((e) => e.id === 'gst-parcelado-tv');
        expect(updated).toBeDefined();
        // Não tem mais cartão de crédito vinculado
        expect(updated?.cartaoCreditoId).toBeUndefined();
        // Todas as parcelas foram desvinculadas de faturas de cartão
        updated?.lancamentosBase?.forEach((lb) => {
          expect(lb.faturaCartaoId).toBeUndefined();
        });
      });
    });

    it('ao trocar de cartao para ContaCorrente em uma parcela e selecionar NAO, mantem demais parcelas no cartao', async () => {
      const targetInstallment = mockExpenseParcelado.lancamentosBase![0];

      useAppStore.setState({
        isExpenseDrawerOpen: true,
        editingExpense: mockExpenseParcelado,
        editingInstallment: targetInstallment,
        categories: [mockCategory],
        cards: [mockCardNubank],
        expenses: [mockExpenseParcelado],
        selectedCompetencia: '2026-09',
      });

      render(<ExpenseDrawerForm />);

      // Verifica cabeçalho indicando edição da parcela
      expect(screen.getByText('Editar Parcela 1')).toBeInTheDocument();
      expect(screen.getByText(/Editando Parcela Específica:/i)).toBeInTheDocument();

      // Troca a forma de pagamento para Conta Corrente
      const selectCard = screen.getByLabelText(/Forma de Pagamento \/ Cartão de Crédito/i);
      fireEvent.change(selectCard, { target: { value: '' } });

      // Clica em Salvar Alterações
      const submitBtn = screen.getByRole('button', { name: /Salvar Alterações/i });
      fireEvent.click(submitBtn);

      // Modal abre
      expect(screen.getByText('Os demais registros deverão ser atualizados também?')).toBeInTheDocument();

      // Seleciona a opção NÃO
      const radioNao = screen.getByLabelText(/Não, manter demais parcelas no cartão de crédito/i);
      fireEvent.click(radioNao);

      // Confirma
      const confirmBtn = screen.getByRole('button', { name: /Confirmar e Aplicar/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        const updated = useAppStore.getState().expenses.find((e) => e.id === 'gst-parcelado-tv');
        expect(updated).toBeDefined();
        // Gasto pai mantém o cartão para as demais parcelas
        expect(updated?.cartaoCreditoId).toBe('crd-nubank');
        // Parcela 1 migrou para Conta Corrente (sem fatura)
        const p1 = updated?.lancamentosBase?.find((l) => l.numeroParcela === 1);
        expect(p1?.faturaCartaoId).toBeUndefined();
        // Parcelas 2 e 3 continuam no cartão
        const p2 = updated?.lancamentosBase?.find((l) => l.numeroParcela === 2);
        const p3 = updated?.lancamentosBase?.find((l) => l.numeroParcela === 3);
        expect(p2?.faturaCartaoId).toBeDefined();
        expect(p3?.faturaCartaoId).toBeDefined();
      });
    });
  });

  describe('CT002: Sucesso Recorrente', () => {
    const rootRecorrente: Gasto = {
      id: 'gst-rec-gym-root',
      descricao: 'SmartFit Mensal',
      tipo: 'despesa',
      status: 'pendente',
      origemLancamento: 'recorrente',
      numeroParcelas: 1,
      naoCompartilhar: false,
      valor: 120,
      competencia: '2026-09-01',
      dataVencimento: '2026-09-10',
      dataInicioRecorrencia: '2026-09-10',
      categoriaId: 'cat-geral',
      responsavelId: 'usr-1',
      cartaoCreditoId: 'crd-nubank',
      cartaoNome: 'Nubank Roxinho',
      faturaCartaoId: 'fat-1',
      createdAt: '2026-09-01T10:00:00.000Z',
      updatedAt: '2026-09-01T10:00:00.000Z',
    };

    const futureRecorrente: Gasto = {
      id: 'gst-rec-gym-oct',
      descricao: 'SmartFit Mensal',
      tipo: 'despesa',
      status: 'pendente',
      origemLancamento: 'recorrente',
      numeroParcelas: 1,
      naoCompartilhar: false,
      valor: 120,
      competencia: '2026-10-01',
      dataVencimento: '2026-10-10',
      recorrenciaPaiId: 'gst-rec-gym-root',
      categoriaId: 'cat-geral',
      responsavelId: 'usr-1',
      cartaoCreditoId: 'crd-nubank',
      cartaoNome: 'Nubank Roxinho',
      faturaCartaoId: 'fat-2',
      createdAt: '2026-09-01T10:00:00.000Z',
      updatedAt: '2026-09-01T10:00:00.000Z',
    };

    it('ao trocar tipo de pagamento de cartao para contacorrente e selecionar SIM, atualiza toda a recorrencia', async () => {
      useAppStore.setState({
        isExpenseDrawerOpen: true,
        editingExpense: rootRecorrente,
        editingInstallment: null,
        categories: [mockCategory],
        cards: [mockCardNubank],
        expenses: [rootRecorrente, futureRecorrente],
        selectedCompetencia: '2026-09',
      });

      render(<ExpenseDrawerForm />);

      // Troca forma de pagamento para Conta Corrente
      const selectCard = screen.getByLabelText(/Forma de Pagamento \/ Cartão de Crédito/i);
      fireEvent.change(selectCard, { target: { value: '' } });

      // Clica em Salvar
      const submitBtn = screen.getByRole('button', { name: /Salvar Alterações/i });
      fireEvent.click(submitBtn);

      // Deve abrir o PaymentMethodChangeModal de recorrência com a pergunta do CT002
      expect(screen.getByText('Atualizar forma de pagamento da recorrência')).toBeInTheDocument();
      expect(screen.getByText('Deseja que todos os registros da recorrência sejam atualizados?')).toBeInTheDocument();
      expect(screen.getByText('Sim, atualizar toda a recorrência')).toBeInTheDocument();
      expect(screen.getByText('Não, atualizar somente a recorrência selecionada')).toBeInTheDocument();

      // Confirma com SIM (toda a série)
      const confirmBtn = screen.getByRole('button', { name: /Confirmar e Aplicar/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        const root = useAppStore.getState().expenses.find((e) => e.id === 'gst-rec-gym-root');
        const oct = useAppStore.getState().expenses.find((e) => e.id === 'gst-rec-gym-oct');
        expect(root?.cartaoCreditoId).toBeUndefined();
        expect(oct?.cartaoCreditoId).toBeUndefined();
      });
    });

    it('ao trocar tipo de pagamento de cartao para contacorrente e selecionar NAO, atualiza somente o mes selecionado', async () => {
      useAppStore.setState({
        isExpenseDrawerOpen: true,
        editingExpense: rootRecorrente,
        editingInstallment: null,
        categories: [mockCategory],
        cards: [mockCardNubank],
        expenses: [rootRecorrente, futureRecorrente],
        selectedCompetencia: '2026-09',
      });

      render(<ExpenseDrawerForm />);

      // Troca forma de pagamento para Conta Corrente
      const selectCard = screen.getByLabelText(/Forma de Pagamento \/ Cartão de Crédito/i);
      fireEvent.change(selectCard, { target: { value: '' } });

      // Clica em Salvar
      const submitBtn = screen.getByRole('button', { name: /Salvar Alterações/i });
      fireEvent.click(submitBtn);

      // Modal abre
      expect(screen.getByText('Deseja que todos os registros da recorrência sejam atualizados?')).toBeInTheDocument();

      // Seleciona NAO (apenas este mês)
      const radioNao = screen.getByLabelText(/Não, atualizar somente a recorrência selecionada/i);
      fireEvent.click(radioNao);

      // Confirma
      const confirmBtn = screen.getByRole('button', { name: /Confirmar e Aplicar/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        const root = useAppStore.getState().expenses.find((e) => e.id === 'gst-rec-gym-root');
        const oct = useAppStore.getState().expenses.find((e) => e.id === 'gst-rec-gym-oct');
        // O registro do mês selecionado teve o cartão removido
        expect(root?.cartaoCreditoId).toBeUndefined();
        // O outro mês da recorrência mantém seu cartão intacto
        expect(oct?.cartaoCreditoId).toBe('crd-nubank');
      });
    });
  });

  describe('Exibição de Badges e Botão de Edição de Parcelas', () => {
    it('exibe badge Cartão e Conta Corrente nas parcelas de ExpenseTable e abre drawer ao clicar em editar', () => {
      const mockOpenEditExpense = vi.fn();

      const expenseComParcelasMistas: Gasto = {
        id: 'gst-mix',
        descricao: 'Notebook Gamer',
        tipo: 'despesa',
        status: 'pendente',
        origemLancamento: 'parcelado',
        numeroParcelas: 2,
        naoCompartilhar: false,
        valor: 4000,
        competencia: '2026-09-01',
        dataVencimento: '2026-09-12',
        categoriaId: 'cat-geral',
        responsavelId: 'usr-1',
        cartaoCreditoId: 'crd-nubank',
        lancamentosBase: [
          {
            id: 'lb-1',
            gastoId: 'gst-mix',
            descricao: 'Notebook Gamer - Parcela 1/2',
            numeroParcela: 1,
            valorParcela: 2000,
            dataVencimentoParcela: '2026-09-12',
            status: 'pendente',
            competencia: '2026-09-01',
            faturaCartaoId: null as any, // migrado para Conta Corrente
          },
          {
            id: 'lb-2',
            gastoId: 'gst-mix',
            descricao: 'Notebook Gamer - Parcela 2/2',
            numeroParcela: 2,
            valorParcela: 2000,
            dataVencimentoParcela: '2026-10-12',
            status: 'pendente',
            competencia: '2026-10-01',
            faturaCartaoId: 'fat-2', // continua no cartão
          },
        ],
        createdAt: '2026-09-01T10:00:00.000Z',
        updatedAt: '2026-09-01T10:00:00.000Z',
      };

      useAppStore.setState({
        categories: [mockCategory],
        cards: [mockCardNubank],
        expenses: [expenseComParcelasMistas],
        selectedCompetencia: '2026-09',
        openEditExpense: mockOpenEditExpense,
      });

      render(<ExpenseTable expenses={[expenseComParcelasMistas]} />);

      // Expande as parcelas clicando no botão de parcelas
      const expandBtn = screen.getByRole('button', { name: /2x parcelas/i });
      fireEvent.click(expandBtn);

      // Verifica os badges de forma de pagamento
      expect(screen.getByText('🏦 C. Corrente')).toBeInTheDocument();
      expect(screen.getByText('💳 Cartão')).toBeInTheDocument();

      // Clica no botão de editar da parcela 1
      const editButtons = screen.getAllByTitle(/Editar forma de pagamento/i);
      expect(editButtons.length).toBe(2);
      fireEvent.click(editButtons[0]);

      expect(mockOpenEditExpense).toHaveBeenCalledWith(
        expenseComParcelasMistas,
        expenseComParcelasMistas.lancamentosBase![0]
      );
    });
  });
});
