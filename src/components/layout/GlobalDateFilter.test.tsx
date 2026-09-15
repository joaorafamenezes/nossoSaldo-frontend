import '@testing-library/jest-dom/vitest';
import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import * as React from 'react';
import { GlobalDateFilter } from './GlobalDateFilter';
import { useAppStore } from '../../stores/useAppStore';

describe('Navegação de Períodos e Filtro de Datas (GlobalDateFilter)', () => {
  beforeEach(() => {
    useAppStore.setState({
      selectedCompetencia: '2026-09',
      dateFilterMode: 'month',
      customStartDate: null,
      customEndDate: null,
    });
  });

  it('renderiza os botões de navegação rápida em 1 clique (< e >)', () => {
    render(<GlobalDateFilter />);

    const prevButton = screen.getByLabelText('Mês anterior');
    const nextButton = screen.getByLabelText('Próximo mês');
    const triggerButton = screen.getByTitle(/Selecionar mês ou personalizar/i);

    expect(prevButton).toBeInTheDocument();
    expect(nextButton).toBeInTheDocument();
    expect(triggerButton).toHaveTextContent(/Setembro de 2026/i);
  });

  it('avança e recua o mês em 1 clique usando as setas do header', () => {
    render(<GlobalDateFilter />);

    const prevButton = screen.getByLabelText('Mês anterior');
    const nextButton = screen.getByLabelText('Próximo mês');

    // 1 clique para voltar -> Agosto de 2026
    fireEvent.click(prevButton);
    expect(useAppStore.getState().selectedCompetencia).toBe('2026-08');
    expect(screen.getByTitle(/Selecionar mês ou personalizar/i)).toHaveTextContent(/Agosto de 2026/i);

    // 1 clique para avançar -> Setembro de 2026
    fireEvent.click(nextButton);
    expect(useAppStore.getState().selectedCompetencia).toBe('2026-09');
    expect(screen.getByTitle(/Selecionar mês ou personalizar/i)).toHaveTextContent(/Setembro de 2026/i);

    // Outro clique para avançar -> Outubro de 2026
    fireEvent.click(nextButton);
    expect(useAppStore.getState().selectedCompetencia).toBe('2026-10');
    expect(screen.getByTitle(/Selecionar mês ou personalizar/i)).toHaveTextContent(/Outubro de 2026/i);
  });

  it('abre o popover e permite selecionar mês pelo grid de 12 meses em 1 clique', () => {
    render(<GlobalDateFilter />);

    const triggerButton = screen.getByTitle(/Selecionar mês ou personalizar/i);
    fireEvent.click(triggerButton);

    // Popover deve estar aberto com grid e chips rápidos
    expect(screen.getByText('Navegação Rápida')).toBeInTheDocument();
    expect(screen.getByText('-3M')).toBeInTheDocument();
    expect(screen.getByText('+3M')).toBeInTheDocument();

    // Clicar em "Dez" (Dezembro) no grid
    const dezButton = screen.getByTitle(/Dezembro de 2026/i);
    fireEvent.click(dezButton);

    // Deve atualizar imediatamente para 2026-12 e fechar o popover
    expect(useAppStore.getState().selectedCompetencia).toBe('2026-12');
    expect(screen.queryByText('Navegação Rápida')).not.toBeInTheDocument();
    expect(screen.getByTitle(/Selecionar mês ou personalizar/i)).toHaveTextContent(/Dezembro de 2026/i);
  });

  it('permite saltar -3M e +3M através dos chips de navegação rápida', () => {
    render(<GlobalDateFilter />);

    // Abrir popover
    fireEvent.click(screen.getByTitle(/Selecionar mês ou personalizar/i));

    // Clicar em -3M (de 2026-09 para 2026-06)
    const minus3Button = screen.getByTitle('Voltar 3 meses');
    fireEvent.click(minus3Button);
    expect(useAppStore.getState().selectedCompetencia).toBe('2026-06');

    // Clicar em +3M (de 2026-06 para 2026-09)
    const plus3Button = screen.getByTitle('Avançar 3 meses');
    fireEvent.click(plus3Button);
    expect(useAppStore.getState().selectedCompetencia).toBe('2026-09');
  });
});
