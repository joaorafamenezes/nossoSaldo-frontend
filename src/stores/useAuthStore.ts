import { create } from 'zustand';
import { Usuario } from '../types/user';
import { login as apiLogin, getProfile, createUser as apiCreateUser, requestPasswordReset as apiRequestReset } from '../services/api';
import { useAppStore } from './useAppStore';

interface AuthState {
  token: string | null;
  user: Usuario | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: { email: string; senha: string }) => Promise<void>;
  register: (data: { nome: string; email: string; senha: string }) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  logout: () => void;
  loadSession: () => Promise<void>;
}

const STORAGE_KEY = '@NossoSaldo:token';

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem(STORAGE_KEY),
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      useAppStore.getState().resetStore();
      const { token } = await apiLogin(credentials);
      localStorage.setItem(STORAGE_KEY, token);
      set({ token, isAuthenticated: true });

      const profile = await getProfile(token);
      set({ user: profile, isLoading: false, isAuthenticated: true });

      await useAppStore.getState().loadApiData(token);
    } catch (err: any) {
      localStorage.removeItem(STORAGE_KEY);
      useAppStore.getState().resetStore();
      set({ error: err.message || 'Erro ao realizar login', isLoading: false, isAuthenticated: false, token: null, user: null });
      throw err;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await apiCreateUser(data);
      set({ isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Erro ao criar conta', isLoading: false });
      throw err;
    }
  },

  requestPasswordReset: async (email) => {
    set({ isLoading: true, error: null });
    try {
      await apiRequestReset(email);
      set({ isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Erro ao solicitar redefinição', isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
    useAppStore.getState().resetStore();
    set({ token: null, user: null, isAuthenticated: false });
  },

  loadSession: async () => {
    const token = localStorage.getItem(STORAGE_KEY);
    if (!token) {
      useAppStore.getState().resetStore();
      set({ isAuthenticated: false, user: null, token: null, isLoading: false });
      return;
    }

    set({ isLoading: true });
    try {
      const profile = await getProfile(token);
      set({ user: profile, token, isAuthenticated: true, isLoading: false });
    } catch (err) {
      console.warn('Sessão expirada ou inválida na API. Redirecionando para login.');
      localStorage.removeItem(STORAGE_KEY);
      useAppStore.getState().resetStore();
      set({ token: null, user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
