import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as React from 'react';
import { AuthPage } from './AuthPage';
import { useAuthStore } from '../../stores/useAuthStore';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('AuthPage - Fluxo de Acesso e Login Deliberado', () => {
  const mockLogin = vi.fn();
  const mockRegister = vi.fn();
  const mockRequestPasswordReset = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isCheckingSession: false,
      error: null,
      login: mockLogin,
      register: mockRegister,
      requestPasswordReset: mockRequestPasswordReset,
    });
  });

  describe('Critério CT001: Logando', () => {
    it('renderiza a página principal com os campos de e-mail e senha editáveis e o botão Acessar Plataforma desbloqueado e clicável', () => {
      render(<AuthPage />);

      // Campos de e-mail e senha devem estar presentes e habilitados
      const emailInput = screen.getByLabelText(/E-mail/i) as HTMLInputElement;
      const senhaInput = screen.getByLabelText(/Senha de Acesso/i) as HTMLInputElement;

      expect(emailInput).toBeInTheDocument();
      expect(emailInput).not.toBeDisabled();
      expect(senhaInput).toBeInTheDocument();
      expect(senhaInput).not.toBeDisabled();

      // Botão de acesso deve estar em estado ocioso ("Acessar Plataforma") e NÃO em "Carregando..."
      const submitButton = screen.getByRole('button', { name: /Acessar Plataforma/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).not.toBeDisabled();
      expect(screen.queryByText(/Carregando\.\.\./i)).not.toBeInTheDocument();
    });

    it('permite informar e-mail e senha e clicar deliberadamente no botão para efetuar o login', async () => {
      mockLogin.mockResolvedValueOnce(undefined);

      render(<AuthPage />);

      const emailInput = screen.getByLabelText(/E-mail/i);
      const senhaInput = screen.getByLabelText(/Senha de Acesso/i);
      const submitButton = screen.getByRole('button', { name: /Acessar Plataforma/i });

      // Usuário preenche os dados
      fireEvent.change(emailInput, { target: { value: 'usuario@nossosaldo.com' } });
      fireEvent.change(senhaInput, { target: { value: 'senhaForte123' } });

      expect(emailInput).toHaveValue('usuario@nossosaldo.com');
      expect(senhaInput).toHaveValue('senhaForte123');

      // Usuário clica deliberadamente no botão de login
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledTimes(1);
        expect(mockLogin).toHaveBeenCalledWith({
          email: 'usuario@nossosaldo.com',
          senha: 'senhaForte123',
        });
      });
    });

    it('não bloqueia e não coloca o botão em Carregando... mesmo se houver verificação de sessão em segundo plano no store', () => {
      // Simula estado onde useAuthStore está com verificação de sessão ativa
      useAuthStore.setState({
        isCheckingSession: true,
        isLoading: true, // Garante que a flag global antiga não contamina mais o botão
      });

      render(<AuthPage />);

      // O botão Acessar Plataforma NÃO deve ficar em Carregando...
      const submitButton = screen.getByRole('button', { name: /Acessar Plataforma/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).not.toBeDisabled();
      expect(screen.queryByText(/Carregando\.\.\./i)).not.toBeInTheDocument();
    });

    it('exibe estado de Carregando... somente durante a submissão deliberada e o restaura em caso de erro', async () => {
      let resolveLogin: () => void = () => {};
      mockLogin.mockImplementation(
        () =>
          new Promise<void>((resolve, reject) => {
            resolveLogin = () => reject(new Error('Credenciais inválidas'));
          })
      );

      render(<AuthPage />);

      const emailInput = screen.getByLabelText(/E-mail/i);
      const senhaInput = screen.getByLabelText(/Senha de Acesso/i);
      const submitButton = screen.getByRole('button', { name: /Acessar Plataforma/i });

      fireEvent.change(emailInput, { target: { value: 'usuario@nossosaldo.com' } });
      fireEvent.change(senhaInput, { target: { value: 'errada' } });

      fireEvent.click(submitButton);

      // Enquanto a requisição está em andamento, deve mostrar Carregando...
      expect(screen.getByText(/Carregando\.\.\./i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      // Finaliza com erro
      resolveLogin();

      // Após o erro, o botão deve voltar ao estado inicial "Acessar Plataforma"
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Acessar Plataforma/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Acessar Plataforma/i })).not.toBeDisabled();
      });
    });
  });

  describe('Navegação entre Modos (Recuperar Senha)', () => {
    it('permite alternar para "Esqueceu a senha?" e voltar para o Login', () => {
      render(<AuthPage />);

      fireEvent.click(screen.getByText(/Esqueceu a senha\?/i));

      expect(screen.getByRole('button', { name: /Enviar Link de Redefinição/i })).toBeInTheDocument();
      expect(screen.queryByLabelText(/Senha de Acesso/i)).not.toBeInTheDocument();

      fireEvent.click(screen.getByText(/Voltar para o Login/i));

      expect(screen.getByRole('button', { name: /Acessar Plataforma/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/Senha de Acesso/i)).toBeInTheDocument();
    });
  });
});
