import '@testing-library/jest-dom/vitest';
import * as React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { App } from '../../App';
import { useAppStore } from '../../stores/useAppStore';
import { useAuthStore } from '../../stores/useAuthStore';

// Mocks for dependencies that use complex canvas/svg
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
  Toaster: () => null,
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  CartesianGrid: () => null,
}));

describe('US - Novo Lançamento em Qualquer Tela (CT001)', () => {
  const mockAddExpense = vi.fn().mockResolvedValue({ id: 'gst-created-123' });
  const mockCategories = [
    { id: 'cat-lazer', descricao: 'Lazer & Entretenimento', cor: '#8b5cf6', iconName: 'Film' },
    { id: 'cat-alimentacao', descricao: 'Alimentação', cor: '#10b981', iconName: 'ShoppingCart' },
  ];
  const mockCards = [
    {
      id: 'card-nubank',
      descricao: 'Nubank Roxinho',
      limiteTotal: 5000,
      valorLimite: 5000,
      limiteDisponivel: 4500,
      diaFechamento: 15,
      diaVencimento: 22,
      cor: '#820ad1',
      ultimosDigitos: '1234',
      bandeira: 'mastercard' as const,
      corGradiente: 'from-purple-900 to-indigo-950',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Authenticated user
    localStorage.setItem('@NossoSaldo:token', 'fake-token');
    useAuthStore.setState({
      isAuthenticated: true,
      token: 'fake-token',
      loadSession: vi.fn().mockResolvedValue(undefined),
      user: {
        id: 'usr-1',
        nome: 'João Silva',
        email: 'joao@nossosaldo.com.br',
        perfil: 'ADMIN',
      } as any,
    });

    // Reset store state
    useAppStore.setState({
      activeTab: 'dashboard',
      selectedCompetencia: '2026-10',
      categories: mockCategories,
      cards: mockCards,
      expenses: [],
      invoices: [],
      groceryItems: [],
      aiInsights: [],
      aiMessages: [],
      jointInfo: null,
      isExpenseDrawerOpen: false,
      editingExpense: null,
      newExpenseDefaults: null,
      loadApiData: vi.fn().mockResolvedValue(undefined) as any,
      addExpense: mockAddExpense,
    });
  });

  it('CT001.1: Abre Novo Lançamento e salva lançamento a partir da aba Dashboard 360', async () => {
    useAppStore.setState({ activeTab: 'dashboard' });
    render(<App />);

    // Verifica que estamos na tela de Dashboard
    expect(screen.getByText('Painel Financeiro 360°')).toBeInTheDocument();

    // O drawer deve estar fechado inicialmente
    expect(screen.queryByPlaceholderText('Ex: Aluguel, Supermercado, Salário...')).not.toBeInTheDocument();

    // Clica no botão "Novo Lançamento" no Header ou no Dashboard
    const novoBtn = screen.getAllByRole('button', { name: /novo lançamento/i })[0];
    fireEvent.click(novoBtn);

    // O Drawer deve abrir sem que o usuário tenha que sair do Dashboard
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /novo lançamento/i })).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Ex: Aluguel, Supermercado, Salário...')).toBeInTheDocument();
    });

    // Preenche o formulário
    fireEvent.change(screen.getByPlaceholderText('Ex: Aluguel, Supermercado, Salário...'), {
      target: { value: 'Ingresso Cinema' },
    });
    fireEvent.change(screen.getByPlaceholderText('0,00'), {
      target: { value: '65.00' },
    });

    // Clica em Confirmar Lançamento
    const saveBtn = screen.getByRole('button', { name: /confirmar lançamento/i });
    fireEvent.click(saveBtn);

    // Verifica que addExpense foi chamado com os dados corretos
    await waitFor(() => {
      expect(mockAddExpense).toHaveBeenCalledTimes(1);
      expect(mockAddExpense).toHaveBeenCalledWith(
        expect.objectContaining({
          descricao: 'Ingresso Cinema',
          valor: 65,
          tipo: 'despesa',
          categoriaId: 'cat-lazer',
        })
      );
    });

    // O usuário continua no Dashboard
    expect(screen.getByText('Painel Financeiro 360°')).toBeInTheDocument();
  });

  it('CT001.2: Abre Novo Lançamento a partir da aba Categorias', async () => {
    useAppStore.setState({ activeTab: 'categories' });
    render(<App />);

    expect(screen.getByText('Gerenciamento de Categorias')).toBeInTheDocument();

    // Clica no botão Novo Lançamento
    const novoBtn = screen.getAllByRole('button', { name: /novo lançamento/i })[0];
    fireEvent.click(novoBtn);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /novo lançamento/i })).toBeInTheDocument();
    });
  });

  it('CT001.3: Abre Novo Lançamento a partir da aba Cartões & Faturas com cartão pré-selecionado', async () => {
    useAppStore.setState({ activeTab: 'cards' });
    render(<App />);

    expect(screen.getByText('Cartões de Crédito & Faturas')).toBeInTheDocument();

    // Clica no botão "Novo Lançamento no Cartão"
    const cardLaunchBtn = screen.getByRole('button', { name: /novo lançamento no cartão/i });
    fireEvent.click(cardLaunchBtn);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /novo lançamento/i })).toBeInTheDocument();
      // O select de cartão deve estar com o Nubank selecionado
      const selectCard = screen.getByLabelText(/Forma de Pagamento/i) as HTMLSelectElement;
      expect(selectCard.value).toBe('card-nubank');
    });
  });

  it('CT001.4: Abre Novo Lançamento a partir da aba Copilot IA', async () => {
    useAppStore.setState({ activeTab: 'ai' });
    render(<App />);

    expect(screen.getByText(/Copilot & Inteligência Financeira/i)).toBeInTheDocument();

    // Clica em Novo Lançamento no Header
    const novoBtn = screen.getAllByRole('button', { name: /novo lançamento/i })[0];
    fireEvent.click(novoBtn);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /novo lançamento/i })).toBeInTheDocument();
    });
  });

  it('CT001.5: Abre Novo Lançamento a partir da aba Conta Conjunta', async () => {
    useAppStore.setState({ activeTab: 'joint' });
    render(<App />);

    // Clica em Novo Lançamento no Header
    const novoBtn = screen.getAllByRole('button', { name: /novo lançamento/i })[0];
    fireEvent.click(novoBtn);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /novo lançamento/i })).toBeInTheDocument();
    });
  });

  it('CT001.6: Exibe categorias em ordem alfabética no select do Novo Lançamento', async () => {
    useAppStore.setState({
      activeTab: 'dashboard',
      isExpenseDrawerOpen: true,
      categories: [
        { id: 'cat-supermercado', descricao: 'Supermercado', iconName: '🛒' },
        { id: 'cat-academia', descricao: 'Academia', iconName: '🏋️' },
        { id: 'cat-cinema', descricao: 'Cinema', iconName: '🎬' },
        { id: 'cat-aluguel', descricao: 'Aluguel', iconName: '🏠' },
      ],
    });
    render(<App />);

    await waitFor(() => {
      const selectCat = screen.getByLabelText(/Categoria/i) as HTMLSelectElement;
      expect(selectCat).toBeInTheDocument();

      const options = Array.from(selectCat.options).map((opt) => opt.text.trim());
      expect(options).toEqual([
        '🏋️ Academia',
        '🏠 Aluguel',
        '🎬 Cinema',
        '🛒 Supermercado',
      ]);
    });
  });
});
