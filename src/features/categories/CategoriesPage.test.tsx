import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import * as React from 'react';
import { CategoriesPage } from './CategoriesPage';
import { useAppStore } from '../../stores/useAppStore';

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

describe('CategoriesPage - Visualização em Lista e Ordenação Alfabética', () => {
  const mockCategories = [
    {
      id: 'cat-transporte',
      descricao: 'Transporte & Combustível',
      teto: 600,
      cor: '#3b82f6',
      iconName: '🚗',
    },
    {
      id: 'cat-alimentacao',
      descricao: 'Alimentação & Feira',
      teto: 1200,
      cor: '#10b981',
      iconName: '🛒',
    },
    {
      id: 'cat-lazer',
      descricao: 'Lazer & Restaurantes',
      teto: 400,
      cor: '#f59e0b',
      iconName: '🍕',
    },
  ];

  const mockExpenses = [
    {
      id: 'exp-1',
      descricao: 'Supermercado Central',
      categoriaId: 'cat-alimentacao',
      tipo: 'despesa',
      status: 'pago',
      valor: 800,
      competencia: '2026-09',
      dataVencimento: '2026-09-05',
    },
    {
      id: 'exp-2',
      descricao: 'Gasolina Posto Shell',
      categoriaId: 'cat-transporte',
      tipo: 'despesa',
      status: 'pago',
      valor: 250,
      competencia: '2026-09',
      dataVencimento: '2026-09-10',
    },
    {
      id: 'exp-3',
      descricao: 'Cinema & Pipoca',
      categoriaId: 'cat-lazer',
      tipo: 'despesa',
      status: 'pago',
      valor: 150,
      competencia: '2026-09',
      dataVencimento: '2026-09-15',
    },
  ];

  beforeEach(() => {
    localStorage.clear();
    useAppStore.setState({
      selectedCompetencia: '2026-09',
      dateFilterMode: 'month',
      customStartDate: '',
      customEndDate: '',
      categories: mockCategories,
      expenses: mockExpenses as any,
      cards: [],
    });
  });

  const getTableCategoryNames = () => {
    const table = screen.getByRole('table');
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    return rows.map((row) => row.querySelector('.font-bold')?.textContent);
  };

  it('exibe as categorias em formato de lista e em ordem alfabética (A-Z) por padrão', () => {
    render(<CategoriesPage />);

    // Verifica que a tabela de lista está presente
    expect(screen.getByRole('table')).toBeInTheDocument();

    // Ordem alfabética esperada:
    // 1. Alimentação & Feira
    // 2. Lazer & Restaurantes
    // 3. Transporte & Combustível
    expect(getTableCategoryNames()).toEqual([
      'Alimentação & Feira',
      'Lazer & Restaurantes',
      'Transporte & Combustível',
    ]);
  });

  it('permite alternar a ordenação para Z-A', () => {
    render(<CategoriesPage />);

    const selectSort = screen.getByLabelText('Ordenar categorias') as HTMLSelectElement;
    fireEvent.change(selectSort, { target: { value: 'name-desc' } });

    expect(getTableCategoryNames()).toEqual([
      'Transporte & Combustível',
      'Lazer & Restaurantes',
      'Alimentação & Feira',
    ]);
  });

  it('permite alternar a ordenação para Maior Gasto', () => {
    render(<CategoriesPage />);

    const selectSort = screen.getByLabelText('Ordenar categorias') as HTMLSelectElement;
    fireEvent.change(selectSort, { target: { value: 'spent-desc' } });

    // Gastos: Alimentação = 800, Transporte = 250, Lazer = 150
    expect(getTableCategoryNames()).toEqual([
      'Alimentação & Feira',
      'Transporte & Combustível',
      'Lazer & Restaurantes',
    ]);
  });

  it('permite alternar entre os modos Lista e Grade', () => {
    render(<CategoriesPage />);

    // Inicia no modo Lista
    expect(screen.getByRole('table')).toBeInTheDocument();

    // Clica no botão Grade
    const gridButton = screen.getByRole('button', { name: /visualização em grade/i });
    fireEvent.click(gridButton);

    // Tabela não deve mais estar visível
    expect(screen.queryByRole('table')).not.toBeInTheDocument();

    // Cards devem estar visíveis
    expect(screen.getByText('Alimentação & Feira')).toBeInTheDocument();
    expect(screen.getByText('Lazer & Restaurantes')).toBeInTheDocument();
    expect(screen.getByText('Transporte & Combustível')).toBeInTheDocument();

    // Clica de volta no botão Lista
    const listButton = screen.getByRole('button', { name: /visualização em lista/i });
    fireEvent.click(listButton);

    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('filtra categorias em tempo real através do campo de busca', () => {
    render(<CategoriesPage />);

    const searchInput = screen.getByPlaceholderText('Buscar categoria...');
    fireEvent.change(searchInput, { target: { value: 'lazer' } });

    // Apenas Lazer deve aparecer
    expect(screen.getByText('Lazer & Restaurantes')).toBeInTheDocument();
    expect(screen.queryByText('Alimentação & Feira')).not.toBeInTheDocument();
    expect(screen.queryByText('Transporte & Combustível')).not.toBeInTheDocument();

    // Limpa a busca clicando no botão X
    const clearButton = screen.getByTitle('Limpar busca');
    fireEvent.click(clearButton);

    // Todas as categorias voltam a ser exibidas
    expect(screen.getByText('Alimentação & Feira')).toBeInTheDocument();
    expect(screen.getByText('Lazer & Restaurantes')).toBeInTheDocument();
    expect(screen.getByText('Transporte & Combustível')).toBeInTheDocument();
  });

  it('exibe estado amigável quando nenhuma categoria corresponde à busca', () => {
    render(<CategoriesPage />);

    const searchInput = screen.getByPlaceholderText('Buscar categoria...');
    fireEvent.change(searchInput, { target: { value: 'inexistente' } });

    expect(screen.getByText('Nenhuma categoria encontrada')).toBeInTheDocument();
    expect(screen.getByText(/Não encontramos categorias correspondentes ao termo "inexistente"/i)).toBeInTheDocument();

    // Clica em limpar busca no estado vazio
    const clearSearchBtn = screen.getByText('Limpar busca').closest('button')!;
    fireEvent.click(clearSearchBtn);

    expect(screen.getByText('Alimentação & Feira')).toBeInTheDocument();
  });

  it('permite alternar ordenação alfabética clicando no cabeçalho da coluna Categoria', () => {
    render(<CategoriesPage />);

    // Clica no cabeçalho "Categoria" para inverter para Z-A
    const headerCol = screen.getByTitle('Clique para alternar ordem alfabética');
    fireEvent.click(headerCol);

    expect(getTableCategoryNames()).toEqual([
      'Transporte & Combustível',
      'Lazer & Restaurantes',
      'Alimentação & Feira',
    ]);

    // Clica novamente para voltar a A-Z
    fireEvent.click(headerCol);
    expect(getTableCategoryNames()).toEqual([
      'Alimentação & Feira',
      'Lazer & Restaurantes',
      'Transporte & Combustível',
    ]);
  });
});
