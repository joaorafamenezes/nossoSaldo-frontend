import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import * as React from 'react';
import { getCategoryBudgetStatus, getCategoryBudgetAlerts } from '../../lib/utils';
import { CategoryBudgetAlertsWidget } from './CategoryBudgetAlertsWidget';
import { ExpenseCategoryAccordion } from '../expenses/ExpenseCategoryAccordion';
import { GlobalDateFilter } from '../../components/layout/GlobalDateFilter';
import { BudgetAuditCard } from '../ai-copilot/BudgetAuditCard';
import { useAppStore } from '../../stores/useAppStore';

describe('Alertas de Limite de Categoria (60%, 80%, 100%) e Filtro de Período', () => {
  const mockCategories = [
    {
      id: 'cat-alimentacao',
      descricao: 'Alimentação & Mercado',
      teto: 1000,
      cor: '#10b981',
      iconName: '🍔',
    },
    {
      id: 'cat-lazer',
      descricao: 'Lazer & Restaurantes',
      teto: 500,
      cor: '#f59e0b',
      iconName: '🎉',
    },
    {
      id: 'cat-transporte',
      descricao: 'Transporte & Combustível',
      teto: 400,
      cor: '#ef4444',
      iconName: '🚗',
    },
    {
      id: 'cat-sem-teto',
      descricao: 'Outros Diversos',
      teto: 0,
      cor: '#64748b',
      iconName: '📦',
    },
  ];

  beforeEach(() => {
    useAppStore.setState({
      selectedCompetencia: '2026-09',
      dateFilterMode: 'month',
      customStartDate: '',
      customEndDate: '',
      categories: mockCategories,
      expenses: [],
    });
  });

  describe('Função getCategoryBudgetStatus', () => {
    it('retorna nível "normal" quando gasto for menor que 60% do limite', () => {
      const expenses = [
        {
          id: 'exp-1',
          categoriaId: 'cat-alimentacao',
          tipo: 'despesa',
          status: 'pago',
          valor: 500, // 50% de 1000
          competencia: '2026-09',
        },
      ];

      const status = getCategoryBudgetStatus(mockCategories[0], expenses as any, '2026-09');
      expect(status.percentage).toBe(50);
      expect(status.alertLevel).toBe('normal');
      expect(status.label).toBe('Dentro da meta');
      expect(status.progressClass).toBe('bg-emerald-500');
    });

    it('retorna alerta "yellow" quando gasto atingir entre 60% e 79% do limite', () => {
      const expenses = [
        {
          id: 'exp-1',
          categoriaId: 'cat-alimentacao',
          tipo: 'despesa',
          status: 'pago',
          valor: 650, // 65% de 1000
          competencia: '2026-09',
        },
      ];

      const status = getCategoryBudgetStatus(mockCategories[0], expenses as any, '2026-09');
      expect(status.percentage).toBe(65);
      expect(status.alertLevel).toBe('yellow');
      expect(status.label).toBe('60% do limite atingido');
      expect(status.badgeClass).toContain('text-amber-300');
      expect(status.progressClass).toBe('bg-amber-400');
    });

    it('retorna alerta "orange" quando gasto atingir entre 80% e 99% do limite', () => {
      const expenses = [
        {
          id: 'exp-1',
          categoriaId: 'cat-lazer',
          tipo: 'despesa',
          status: 'pendente',
          valor: 420, // 84% de 500
          competencia: '2026-09',
        },
      ];

      const status = getCategoryBudgetStatus(mockCategories[1], expenses as any, '2026-09');
      expect(status.percentage).toBe(84);
      expect(status.alertLevel).toBe('orange');
      expect(status.label).toBe('80% do limite atingido');
      expect(status.badgeClass).toContain('text-orange-400');
      expect(status.progressClass).toBe('bg-orange-500');
    });

    it('retorna alerta "danger" quando gasto atingir 100% ou mais do limite', () => {
      const expenses = [
        {
          id: 'exp-1',
          categoriaId: 'cat-transporte',
          tipo: 'despesa',
          status: 'pago',
          valor: 450, // 113% de 400
          competencia: '2026-09',
        },
      ];

      const status = getCategoryBudgetStatus(mockCategories[2], expenses as any, '2026-09');
      expect(status.percentage).toBe(113);
      expect(status.alertLevel).toBe('danger');
      expect(status.label).toBe('100% do limite atingido');
      expect(status.badgeClass).toContain('text-rose-400');
      expect(status.progressClass).toBe('bg-rose-500');
    });

    it('calcula o status considerando o período específico de datas (startDate e endDate)', () => {
      const expenses = [
        {
          id: 'exp-1',
          categoriaId: 'cat-alimentacao',
          tipo: 'despesa',
          status: 'pago',
          valor: 400,
          dataVencimento: '2026-09-05',
          competencia: '2026-09',
        },
        {
          id: 'exp-2',
          categoriaId: 'cat-alimentacao',
          tipo: 'despesa',
          status: 'pago',
          valor: 500,
          dataVencimento: '2026-09-22',
          competencia: '2026-09',
        },
      ];

      // Apenas a 1ª quinzena (01 a 14) -> R$ 400 (40% - normal)
      const statusQuinzena1 = getCategoryBudgetStatus(
        mockCategories[0],
        expenses as any,
        '2026-09',
        '2026-09-01',
        '2026-09-14'
      );
      expect(statusQuinzena1.spent).toBe(400);
      expect(statusQuinzena1.percentage).toBe(40);
      expect(statusQuinzena1.alertLevel).toBe('normal');

      // Mês completo -> R$ 900 (90% - orange)
      const statusMesCompleto = getCategoryBudgetStatus(mockCategories[0], expenses as any, '2026-09');
      expect(statusMesCompleto.spent).toBe(900);
      expect(statusMesCompleto.percentage).toBe(90);
      expect(statusMesCompleto.alertLevel).toBe('orange');
    });

    it('multiplica o teto proporcionalmente ao número de meses quando o período abrange múltiplos meses (ex: 3 meses)', () => {
      // Categoria Transporte: teto mensal = 400
      // 3 meses (01/07/2026 a 30/09/2026) -> teto do período = 1200
      // Gasto de 720 -> 60%
      const expenses = [
        {
          id: 'exp-1',
          categoriaId: 'cat-transporte',
          tipo: 'despesa',
          status: 'pago',
          valor: 240,
          dataVencimento: '2026-07-10',
          competencia: '2026-07',
        },
        {
          id: 'exp-2',
          categoriaId: 'cat-transporte',
          tipo: 'despesa',
          status: 'pago',
          valor: 240,
          dataVencimento: '2026-08-10',
          competencia: '2026-08',
        },
        {
          id: 'exp-3',
          categoriaId: 'cat-transporte',
          tipo: 'despesa',
          status: 'pago',
          valor: 240,
          dataVencimento: '2026-09-10',
          competencia: '2026-09',
        },
      ];

      const status3Meses = getCategoryBudgetStatus(
        mockCategories[2], // Transporte (teto 400)
        expenses as any,
        '2026-09',
        '2026-07-01',
        '2026-09-30'
      );

      expect(status3Meses.monthMultiplier).toBe(3);
      expect(status3Meses.monthlyBudget).toBe(400);
      expect(status3Meses.budget).toBe(1200);
      expect(status3Meses.spent).toBe(720);
      expect(status3Meses.percentage).toBe(60);
      expect(status3Meses.alertLevel).toBe('yellow');
    });
  });

  describe('Função getCategoryBudgetAlerts', () => {
    it('filtra apenas categorias em alerta (>=60%) e ordena por maior percentual', () => {
      const expenses = [
        {
          id: 'exp-1',
          categoriaId: 'cat-alimentacao',
          tipo: 'despesa',
          status: 'pago',
          valor: 650, // 65%
          competencia: '2026-09',
        },
        {
          id: 'exp-2',
          categoriaId: 'cat-lazer',
          tipo: 'despesa',
          status: 'pago',
          valor: 450, // 90%
          competencia: '2026-09',
        },
        {
          id: 'exp-3',
          categoriaId: 'cat-transporte',
          tipo: 'despesa',
          status: 'pago',
          valor: 400, // 100%
          competencia: '2026-09',
        },
        {
          id: 'exp-4',
          categoriaId: 'cat-sem-teto',
          tipo: 'despesa',
          status: 'pago',
          valor: 1000,
          competencia: '2026-09',
        },
      ];

      const alerts = getCategoryBudgetAlerts(mockCategories, expenses, '2026-09');
      expect(alerts).toHaveLength(3);
      expect(alerts[0].categoriaId).toBe('cat-transporte');
      expect(alerts[0].percentage).toBe(100);
      expect(alerts[1].categoriaId).toBe('cat-lazer');
      expect(alerts[1].percentage).toBe(90);
      expect(alerts[2].categoriaId).toBe('cat-alimentacao');
      expect(alerts[2].percentage).toBe(65);
    });
  });

  describe('Widget CategoryBudgetAlertsWidget (Critério 01 e Período Ativo)', () => {
    it('renderiza categorias em alerta no Dashboard considerando período', () => {
      const expenses = [
        {
          id: 'exp-1',
          categoriaId: 'cat-alimentacao',
          tipo: 'despesa',
          status: 'pago',
          valor: 650,
          competencia: '2026-09',
          descricao: 'Mercado Mensal',
        },
        {
          id: 'exp-2',
          categoriaId: 'cat-transporte',
          tipo: 'despesa',
          status: 'pago',
          valor: 400,
          competencia: '2026-09',
          descricao: 'Combustível Posto',
        },
      ];

      useAppStore.setState({
        categories: mockCategories,
        expenses: expenses as any,
        selectedCompetencia: '2026-09',
      });

      render(<CategoryBudgetAlertsWidget />);

      expect(screen.getByText('Alertas de Limite por Categoria')).toBeInTheDocument();
      expect(screen.getByText(/2 alertas/i)).toBeInTheDocument();
      expect(screen.getByText('Transporte & Combustível')).toBeInTheDocument();
      expect(screen.getByText('Alimentação & Mercado')).toBeInTheDocument();
      expect(screen.getAllByText(/100%/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/65%/i).length).toBeGreaterThanOrEqual(1);
    });

    it('exibe mensagem amigável quando todos os limites estão dentro da meta', () => {
      useAppStore.setState({
        categories: mockCategories,
        expenses: [],
        selectedCompetencia: '2026-09',
      });

      render(<CategoryBudgetAlertsWidget />);

      expect(screen.getByText(/Todos os limites dentro da meta prevista/i)).toBeInTheDocument();
    });
  });

  describe('ExpenseCategoryAccordion (Critérios 02, 03 e Todas as Categorias)', () => {
    it('renderiza a barra horizontal em todas as categorias (com e sem teto)', () => {
      const expenses = [
        {
          id: 'exp-1',
          categoriaId: 'cat-alimentacao',
          tipo: 'despesa',
          status: 'pago',
          valor: 600, // 60%
          competencia: '2026-09',
          descricao: 'Supermercado',
        },
        {
          id: 'exp-2',
          categoriaId: 'cat-transporte',
          tipo: 'despesa',
          status: 'pago',
          valor: 400, // 100%
          competencia: '2026-09',
          descricao: 'Gasolina',
        },
        {
          id: 'exp-3',
          categoriaId: 'cat-sem-teto',
          tipo: 'despesa',
          status: 'pago',
          valor: 150,
          competencia: '2026-09',
          descricao: 'Taxa Bancária',
        },
      ];

      useAppStore.setState({
        categories: mockCategories,
        expenses: expenses as any,
        selectedCompetencia: '2026-09',
      });

      render(
        <ExpenseCategoryAccordion
          expenses={expenses as any}
          selectedIds={[]}
          onToggleSelect={() => {}}
        />
      );

      // Category titles
      expect(screen.getAllByText('Alimentação & Mercado').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Transporte & Combustível').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Outros Diversos').length).toBeGreaterThanOrEqual(1);

      // Alert badges in accordion header
      expect(screen.getAllByText(/60% do limite/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/100% do limite/i).length).toBeGreaterThanOrEqual(1);

      // Categoria sem teto também exibe a barra e indicação
      expect(screen.getAllByText(/Sem teto/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GlobalDateFilter (Header Superior)', () => {
    it('renderiza o botão com o mês selecionado e permite abrir o modal', () => {
      render(<GlobalDateFilter />);

      const triggerBtn = screen.getByTitle(/Selecionar mês ou personalizar intervalo/i);
      expect(triggerBtn).toBeInTheDocument();

      // Abre popover
      fireEvent.click(triggerBtn);
      expect(screen.getByText('Filtro de Período')).toBeInTheDocument();
      expect(screen.getByText('Por Mês')).toBeInTheDocument();
      expect(screen.getByText('Personalizado')).toBeInTheDocument();
    });

    it('permite alternar para modo personalizado e definir intervalo de datas', () => {
      render(<GlobalDateFilter />);

      const triggerBtn = screen.getByTitle(/Selecionar mês ou personalizar intervalo/i);
      fireEvent.click(triggerBtn);

      const customTabBtn = screen.getByRole('button', { name: 'Personalizado' });
      fireEvent.click(customTabBtn);

      const dateInputs = screen.getAllByDisplayValue('');
      expect(dateInputs.length).toBeGreaterThanOrEqual(2);

      fireEvent.change(dateInputs[0], { target: { value: '2026-09-01' } });
      fireEvent.change(dateInputs[1], { target: { value: '2026-09-15' } });

      const applyBtn = screen.getByRole('button', { name: 'Aplicar Período' });
      fireEvent.click(applyBtn);

      const state = useAppStore.getState();
      expect(state.dateFilterMode).toBe('custom');
      expect(state.customStartDate).toBe('2026-09-01');
      expect(state.customEndDate).toBe('2026-09-15');
    });
  });

  describe('BudgetAuditCard & Autonomia da IA em Categorias', () => {
    it('renderiza os cards de auditoria com percentuais e alertas corretos', () => {
      const expenses = [
        {
          id: 'exp-1',
          categoriaId: 'cat-alimentacao',
          tipo: 'despesa',
          status: 'pago',
          valor: 1050, // 105% de 1000 -> 100% atingido
          competencia: '2026-09',
        },
        {
          id: 'exp-2',
          categoriaId: 'cat-lazer',
          tipo: 'despesa',
          status: 'pago',
          valor: 420, // 84% de 500 -> 80% atingido
          competencia: '2026-09',
        },
      ];

      useAppStore.setState({
        categories: mockCategories,
        expenses: expenses as any,
        selectedCompetencia: '2026-09',
      });

      render(<BudgetAuditCard />);

      expect(screen.getByText(/Auditoria de Orçamento & Tetos de Gastos com IA/i)).toBeInTheDocument();
      expect(screen.getByText('105%')).toBeInTheDocument();
      expect(screen.getByText('84%')).toBeInTheDocument();
      expect(screen.getByText(/Excedeu o teto em R\$ 50,00/i)).toBeInTheDocument();
    });

    it('responde corretamente no chat do Copilot sobre categorias que atingiram 100%', async () => {
      const expenses = [
        {
          id: 'exp-1',
          categoriaId: 'cat-alimentacao',
          tipo: 'despesa',
          status: 'pago',
          valor: 1050,
          competencia: '2026-09',
        },
      ];

      useAppStore.setState({
        categories: mockCategories,
        expenses: expenses as any,
        selectedCompetencia: '2026-09',
        aiMessages: [],
      });

      await useAppStore.getState().sendAiUserMessage('Quais as categorias que atingiram 100% do limite configurado?');

      // Aguarda timeout da simulação
      await new Promise((resolve) => setTimeout(resolve, 700));

      const messages = useAppStore.getState().aiMessages;
      const botMsg = messages.find((m) => m.role === 'assistant');
      expect(botMsg).toBeDefined();
      expect(botMsg?.content).toContain('Alimentação & Mercado');
      expect(botMsg?.content).toContain('105%');
    });
  });
});
