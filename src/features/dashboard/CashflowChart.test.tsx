import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { CashflowChart } from './CashflowChart';
import { useAppStore } from '../../stores/useAppStore';

let capturedChartData: any[] = [];

// Mock recharts components to avoid jsdom SVG/canvas limitations
vi.mock('recharts', () => {
  return {
    ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
    AreaChart: ({ data }: any) => {
      capturedChartData = data;
      return <div data-testid="area-chart" />;
    },
    Area: () => null,
    XAxis: () => null,
    YAxis: () => null,
    Tooltip: () => null,
    CartesianGrid: () => null,
  };
});

describe('CashflowChart - Fluxo de Caixa & Evolução do Mês', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedChartData = [];
    useAppStore.setState({
      selectedCompetencia: '2026-10',
      dateFilterMode: 'month',
      customStartDate: '',
      customEndDate: '',
      isPrivacyMode: false,
      cards: [],
      invoices: [],
      expenses: [],
    });
  });

  it('contabiliza salário no início do mês e outros recebíveis ao longo da competência no gráfico', () => {
    const salarioInicioMes: any = {
      id: 'rec-salario-inicio',
      descricao: 'Salário GFT Início do mês',
      tipo: 'receita',
      status: 'pendente',
      origemLancamento: 'recorrente',
      dataInicioRecorrencia: '2026-07-01',
      competencia: '2026-07-01', // Origem em mês anterior
      dataVencimento: '2026-07-01', // Dia 1
      valor: 4089.68,
    };

    const emprestimoReceber: any = {
      id: 'rec-emprestimo',
      descricao: 'Empréstimo Carol',
      tipo: 'receita',
      status: 'pendente',
      origemLancamento: 'parcelado',
      numeroParcelas: 10,
      valor: 11700, // Total
      competencia: '2026-07-01',
      dataVencimento: '2026-07-08',
      lancamentosBase: [
        {
          id: 'parc-4',
          gastoId: 'rec-emprestimo',
          numeroParcela: 4,
          valorParcela: 1170,
          dataVencimentoParcela: '2026-10-08',
          competencia: '2026-10-08',
          status: 'pendente',
        },
      ],
    };

    const salarioAdiantamento: any = {
      id: 'rec-adiantamento',
      descricao: 'Salário Adiantamento',
      tipo: 'receita',
      status: 'pendente',
      origemLancamento: 'recorrente',
      dataInicioRecorrencia: '2026-07-15',
      competencia: '2026-07-01',
      dataVencimento: '2026-07-15', // Dia 15
      valor: 4129.2,
    };

    const reembolsoFimMes: any = {
      id: 'rec-reembolso',
      descricao: 'Reembolso GFT Curso de Inglês',
      tipo: 'receita',
      status: 'pendente',
      origemLancamento: 'recorrente',
      dataInicioRecorrencia: '2026-07-31',
      competencia: '2026-07-01',
      dataVencimento: '2026-07-31', // Dia 31
      valor: 391.5,
    };

    const despesaAluguel: any = {
      id: 'desp-aluguel',
      descricao: 'Aluguel',
      tipo: 'despesa',
      status: 'pendente',
      origemLancamento: 'unico',
      competencia: '2026-10-01',
      dataVencimento: '2026-10-05',
      valor: 1954.1,
    };

    useAppStore.setState({
      expenses: [
        salarioInicioMes,
        emprestimoReceber,
        salarioAdiantamento,
        reembolsoFimMes,
        despesaAluguel,
      ],
    });

    render(<CashflowChart />);

    expect(screen.getByText('Fluxo de Caixa & Evolução do Mês')).toBeInTheDocument();
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();

    // Valida a evolução dos pontos acumulados no mês
    expect(capturedChartData).toHaveLength(6);

    // Dia 5: Salário do início do mês (R$ 4.089,68) já deve constar acumulado
    const dia5 = capturedChartData.find((d) => d.dia === 'Dia 5');
    expect(dia5).toBeDefined();
    expect(dia5.receitas).toBeCloseTo(4089.68);
    expect(dia5.despesas).toBeCloseTo(1954.1);
    expect(dia5.saldo).toBeCloseTo(4089.68 - 1954.1);

    // Dia 10: Acumula o empréstimo recebível de R$ 1.170,00 no dia 8
    const dia10 = capturedChartData.find((d) => d.dia === 'Dia 10');
    expect(dia10).toBeDefined();
    expect(dia10.receitas).toBeCloseTo(4089.68 + 1170);

    // Dia 15: Acumula o adiantamento de salário de R$ 4.129,20 no dia 15
    const dia15 = capturedChartData.find((d) => d.dia === 'Dia 15');
    expect(dia15).toBeDefined();
    expect(dia15.receitas).toBeCloseTo(4089.68 + 1170 + 4129.2);

    // Dia 31: Acumula o reembolso do final do mês de R$ 391,50
    const dia31 = capturedChartData.find((d) => d.dia === 'Dia 31');
    expect(dia31).toBeDefined();
    expect(dia31.receitas).toBeCloseTo(4089.68 + 1170 + 4129.2 + 391.5);
  });

  it('exclui lançamentos cancelados do cálculo acumulado de receitas e despesas', () => {
    const receitaCancelada: any = {
      id: 'rec-cancelada',
      descricao: 'Venda Cancelada',
      tipo: 'receita',
      status: 'cancelado',
      origemLancamento: 'unico',
      competencia: '2026-10-01',
      dataVencimento: '2026-10-02',
      valor: 5000,
    };

    useAppStore.setState({
      expenses: [receitaCancelada],
    });

    render(<CashflowChart />);
    expect(screen.getByText('Fluxo de Caixa & Evolução do Mês')).toBeInTheDocument();
    const dia5 = capturedChartData.find((d) => d.dia === 'Dia 5');
    expect(dia5.receitas).toBe(0);
  });

  it('adapta a escala de dias ao filtrar por quinzena personalizada', () => {
    useAppStore.setState({
      dateFilterMode: 'custom',
      customStartDate: '2026-10-01',
      customEndDate: '2026-10-14',
      expenses: [
        {
          id: 'rec-1',
          descricao: 'Salário Início',
          tipo: 'receita',
          status: 'pendente',
          origemLancamento: 'unico',
          competencia: '2026-10-01',
          dataVencimento: '2026-10-01',
          valor: 4000,
        } as any,
      ],
    });

    render(<CashflowChart />);
    expect(screen.getByText('Fluxo de Caixa & Evolução do Mês')).toBeInTheDocument();
    expect(capturedChartData.length).toBeGreaterThan(0);
    expect(capturedChartData[0].receitas).toBe(4000);
  });
});
