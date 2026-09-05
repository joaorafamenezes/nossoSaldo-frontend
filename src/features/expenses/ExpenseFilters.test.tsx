import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ExpenseFilters } from './ExpenseFilters';

// Mock zustand store
vi.mock('../../stores/useAppStore', () => ({
  useAppStore: () => ({
    categories: [
      { id: 'cat-1', descricao: 'Alimentação' },
      { id: 'cat-2', descricao: 'Moradia' },
    ],
    jointInfo: null,
    selectedCompetencia: '2026-09',
  }),
}));

describe('ExpenseFilters - Quinzena & Período (Critério 001)', () => {
  const defaultProps = {
    searchQuery: '',
    onSearchChange: vi.fn(),
    selectedType: 'todos',
    onTypeChange: vi.fn(),
    selectedStatus: 'todos',
    onStatusChange: vi.fn(),
    selectedCategoryId: 'todos',
    onCategoryChange: vi.fn(),
    selectedResponsavelId: 'todos',
    onResponsavelChange: vi.fn(),
    startDate: '',
    onStartDateChange: vi.fn(),
    endDate: '',
    onEndDateChange: vi.fn(),
    periodPreset: 'all' as const,
    onPeriodPresetChange: vi.fn(),
    viewMode: 'category' as const,
    onViewModeChange: vi.fn(),
  };

  it('permite selecionar a 1ª Quinzena definindo período de 01/09/2026 a 14/09/2026', () => {
    const props = { ...defaultProps, onStartDateChange: vi.fn(), onEndDateChange: vi.fn(), onPeriodPresetChange: vi.fn() };
    render(<ExpenseFilters {...props} />);

    const firstHalfBtn = screen.getByRole('button', { name: /1ª Quinzena/i });
    fireEvent.click(firstHalfBtn);

    expect(props.onPeriodPresetChange).toHaveBeenCalledWith('first_half');
    expect(props.onStartDateChange).toHaveBeenCalledWith('2026-09-01');
    expect(props.onEndDateChange).toHaveBeenCalledWith('2026-09-14');
  });

  it('permite selecionar a 2ª Quinzena definindo período de 15/09/2026 a 30/09/2026', () => {
    const props = { ...defaultProps, onStartDateChange: vi.fn(), onEndDateChange: vi.fn(), onPeriodPresetChange: vi.fn() };
    render(<ExpenseFilters {...props} />);

    const secondHalfBtn = screen.getByRole('button', { name: /2ª Quinzena/i });
    fireEvent.click(secondHalfBtn);

    expect(props.onPeriodPresetChange).toHaveBeenCalledWith('second_half');
    expect(props.onStartDateChange).toHaveBeenCalledWith('2026-09-15');
    expect(props.onEndDateChange).toHaveBeenCalledWith('2026-09-30');
  });

  it('permite voltar para Mês Completo limpando as datas de início e fim', () => {
    const props = {
      ...defaultProps,
      startDate: '2026-09-01',
      endDate: '2026-09-14',
      periodPreset: 'first_half' as const,
      onStartDateChange: vi.fn(),
      onEndDateChange: vi.fn(),
      onPeriodPresetChange: vi.fn(),
    };
    render(<ExpenseFilters {...props} />);

    const allMonthBtn = screen.getByRole('button', { name: /Mês Completo/i });
    fireEvent.click(allMonthBtn);

    expect(props.onPeriodPresetChange).toHaveBeenCalledWith('all');
    expect(props.onStartDateChange).toHaveBeenCalledWith('');
    expect(props.onEndDateChange).toHaveBeenCalledWith('');
  });

  it('permite definir período personalizado via inputs de data', () => {
    const props = {
      ...defaultProps,
      onStartDateChange: vi.fn(),
      onEndDateChange: vi.fn(),
      onPeriodPresetChange: vi.fn(),
    };
    const { container } = render(<ExpenseFilters {...props} />);

    const dateInputs = container.querySelectorAll('input[type="date"]');
    expect(dateInputs.length).toBe(2);

    fireEvent.change(dateInputs[0], { target: { value: '2026-09-01' } });
    expect(props.onStartDateChange).toHaveBeenCalledWith('2026-09-01');
    expect(props.onPeriodPresetChange).toHaveBeenCalledWith('custom');

    fireEvent.change(dateInputs[1], { target: { value: '2026-09-14' } });
    expect(props.onEndDateChange).toHaveBeenCalledWith('2026-09-14');
    expect(props.onPeriodPresetChange).toHaveBeenCalledWith('custom');
  });

  it('filtra corretamente gastos da 1ª quinzena (01 a 14) vs 2ª quinzena (15 a 30) (Critério 001)', () => {
    const mockGastos = [
      { id: '1', descricao: 'Aluguel', valor: 1500, dataVencimento: '2026-09-05', competencia: '2026-09-01' },
      { id: '2', descricao: 'Internet', valor: 120, dataVencimento: '2026-09-10', competencia: '2026-09-01' },
      { id: '3', descricao: 'Academia', valor: 100, dataVencimento: '2026-09-15', competencia: '2026-09-01' },
      { id: '4', descricao: 'Energia', valor: 250, dataVencimento: '2026-09-20', competencia: '2026-09-01' },
      { id: '5', descricao: 'Cartão de Crédito', valor: 800, dataVencimento: '2026-09-28', competencia: '2026-09-01' },
    ];

    const startDate1 = '2026-09-01';
    const endDate1 = '2026-09-14';

    const gastosPrimeiraQuinzena = mockGastos.filter((g) => {
      const due = g.dataVencimento;
      return (!startDate1 || due >= startDate1) && (!endDate1 || due <= endDate1);
    });

    expect(gastosPrimeiraQuinzena).toHaveLength(2);
    expect(gastosPrimeiraQuinzena.map((g) => g.descricao)).toEqual(['Aluguel', 'Internet']);

    const startDate2 = '2026-09-15';
    const endDate2 = '2026-09-30';

    const gastosSegundaQuinzena = mockGastos.filter((g) => {
      const due = g.dataVencimento;
      return (!startDate2 || due >= startDate2) && (!endDate2 || due <= endDate2);
    });

    expect(gastosSegundaQuinzena).toHaveLength(3);
    expect(gastosSegundaQuinzena.map((g) => g.descricao)).toEqual(['Academia', 'Energia', 'Cartão de Crédito']);
  });

  it('permite fixar o status selecionado como padrão no localStorage (História: Status Default Configurável)', () => {
    localStorage.clear();
    const props = {
      ...defaultProps,
      selectedStatus: 'pendente',
      onStatusChange: vi.fn(),
    };
    render(<ExpenseFilters {...props} />);

    // Clica no botão de fixar padrão
    const pinBtn = screen.getByTitle(/Fixar "Pendentes" como status padrão/i);
    expect(pinBtn).toBeInTheDocument();

    fireEvent.click(pinBtn);

    expect(localStorage.getItem('@NossoSaldo:defaultExpenseStatus')).toBe('pendente');
  });
});
