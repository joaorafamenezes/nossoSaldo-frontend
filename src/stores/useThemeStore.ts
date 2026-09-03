import { create } from 'zustand';

interface ThemeState {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
}

const applyThemeToDom = (theme: 'dark' | 'light') => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
    root.style.colorScheme = 'light';
  }
};

const getInitialTheme = (): 'dark' | 'light' => {
  if (typeof window === 'undefined') return 'dark';
  const saved = localStorage.getItem('@NossoSaldo:theme');
  if (saved === 'dark' || saved === 'light') return saved;
  return 'dark';
};

const initialTheme = getInitialTheme();
applyThemeToDom(initialTheme);

export const useThemeStore = create<ThemeState>((set) => ({
  theme: initialTheme,
  toggleTheme: () =>
    set((state) => {
      const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('@NossoSaldo:theme', nextTheme);
      applyThemeToDom(nextTheme);
      return { theme: nextTheme };
    }),
  setTheme: (theme) => {
    localStorage.setItem('@NossoSaldo:theme', theme);
    applyThemeToDom(theme);
    set({ theme });
  },
}));
