import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { AnnualProjectionView } from './AnnualProjectionView';
import { ProjecaoAnual } from './projecaoAnual';

function serie(valores: number[]) {
  const meses = Array.from({ length: 12 }, (_, indice) => valores[indice] ?? 0);
  return {
    meses,
    total: meses.reduce((acumulado, valor) => acumulado + valor, 0),
  };
}

function relatorio(parcial: Partial<ProjecaoAnual>): ProjecaoAnual {
  return {
    ano: 2026,
    receitas: [],
    despesas: [],
    totalReceitas: serie([]),
    totalDespesas: serie([]),
    saldo: serie([]),
    anosDisponiveis: [2024, 2025, 2026],
    categoriasDisponiveis: [],
    contaConjunta: null,
    semMovimentacaoNoAno: false,
    semMovimentacaoNosFiltros: false,
    ...parcial,
  };
}

function renderView(report: ProjecaoAnual, handlers?: Partial<{ onYearChange: (ano: number) => void; onCategoryChange: (id: string) => void }>) {
  const onYearChange = handlers?.onYearChange ?? vi.fn();
  const onCategoryChange = handlers?.onCategoryChange ?? vi.fn();

  render(
    <AnnualProjectionView
      ano={report.ano}
      categoriaId=""
      responsavelId=""
      report={report}
      isLoading={false}
      error={null}
      onYearChange={onYearChange}
      onCategoryChange={onCategoryChange}
      onResponsavelChange={vi.fn()}
      onRetry={vi.fn()}
    />,
  );

  return { onYearChange, onCategoryChange };
}

describe('AnnualProjectionView', () => {
  it('mostra saldo positivo de janeiro e o saldo liquido do ano', () => {
    renderView(
      relatorio({
        receitas: [{ categoriaId: 'cat-salario', categoria: 'Salario', ...serie([5000]) }],
        despesas: [{ categoriaId: 'cat-moradia', categoria: 'Moradia', ...serie([3200]) }],
        totalReceitas: serie([5000]),
        totalDespesas: serie([3200]),
        saldo: serie([1800]),
        categoriasDisponiveis: [
          { id: 'cat-moradia', nome: 'Moradia' },
          { id: 'cat-salario', nome: 'Salario' },
        ],
      }),
    );

    expect(screen.getByRole('button', { name: 'Projeção Anual de Receitas e Despesas' })).toHaveAttribute('aria-pressed', 'true');
    const grade = within(screen.getByTestId('projection-grid'));
    expect(grade.getByRole('rowheader', { name: 'Salario' })).toBeInTheDocument();
    expect(grade.getByRole('rowheader', { name: 'Moradia' })).toBeInTheDocument();
    expect(screen.getAllByText('R$ 1.800,00').length).toBeGreaterThan(0);
    expect(screen.getByTestId('saldo-liquido')).toHaveTextContent('R$ 1.800,00');
    expect(screen.getByTestId('saldo-liquido')).not.toHaveClass('text-red-400');
  });

  it('destaca saldo negativo em vermelho', () => {
    renderView(
      relatorio({
        totalDespesas: serie([200]),
        saldo: serie([-200]),
      }),
    );

    const saldo = screen.getByTestId('saldo-liquido');
    expect(saldo).toHaveTextContent('-R$ 200,00');
    expect(saldo).toHaveClass('text-red-400');
  });

  it('mostra ano vazio, ano intermediario e filtro vazio', () => {
    const { onYearChange } = renderView(
      relatorio({
        ano: 2025,
        semMovimentacaoNoAno: true,
        anosDisponiveis: [2024, 2025, 2026],
      }),
    );

    expect(screen.getByText('Nenhuma movimentação encontrada para o ano selecionado.')).toBeInTheDocument();
    expect(screen.getByLabelText('Ano')).toHaveTextContent('2025');
    fireEvent.change(screen.getByLabelText('Ano'), { target: { value: '2024' } });
    expect(onYearChange).toHaveBeenCalledWith(2024);

    const filtro = renderView(
      relatorio({
        semMovimentacaoNosFiltros: true,
        categoriasDisponiveis: [{ id: 'cat-moradia', nome: 'Moradia' }],
      }),
    );
    expect(screen.getByText('Nenhuma movimentação encontrada para os filtros selecionados.')).toBeInTheDocument();
    fireEvent.change(screen.getAllByLabelText('Categoria')[1], { target: { value: 'cat-moradia' } });
    expect(filtro.onCategoryChange).toHaveBeenCalledWith('cat-moradia');
  });

  it('esconde o responsavel na conta individual e oferece os membros na conta conjunta', () => {
    renderView(relatorio({ contaConjunta: null }));
    expect(screen.queryByLabelText('Responsável')).not.toBeInTheDocument();

    renderView(
      relatorio({
        contaConjunta: {
          membros: [
            { id: 'user-1', nome: 'Joao' },
            { id: 'user-2', nome: 'Maria' },
          ],
        },
      }),
    );

    expect(screen.getAllByLabelText('Responsável')[0]).toHaveTextContent('Todos');
    expect(screen.getAllByLabelText('Responsável')[0]).toHaveTextContent('Maria');
  });
});
