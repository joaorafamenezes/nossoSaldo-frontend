import * as React from 'react';
import { useAuthStore } from './stores/useAuthStore';
import { useAppStore } from './stores/useAppStore';
import { AuthPage } from './features/auth/AuthPage';
import { AppShell } from './components/layout/AppShell';
import { DashboardOverview } from './features/dashboard/DashboardOverview';
import { ExpensesPage } from './features/expenses/ExpensesPage';
import { CardsPage } from './features/cards/CardsPage';
import { SupermarketPage } from './features/supermarket/SupermarketPage';
import { CategoriesPage } from './features/categories/CategoriesPage';
import { AiPage } from './features/ai-copilot/AiPage';
import { JointAccountView } from './features/joint-account/JointAccountView';
import { AiCopilotDrawer } from './features/ai-copilot/AiCopilotDrawer';

export function App() {
  const { isAuthenticated, loadSession, token } = useAuthStore();
  const { activeTab, loadApiData, selectedCompetencia } = useAppStore();

  React.useEffect(() => {
    loadSession();
  }, [loadSession]);

  React.useEffect(() => {
    if (token) {
      loadApiData(token);
    }
  }, [token, selectedCompetencia, loadApiData]);

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <AppShell>
      {activeTab === 'dashboard' && <DashboardOverview />}
      {activeTab === 'expenses' && <ExpensesPage />}
      {activeTab === 'categories' && <CategoriesPage />}
      {activeTab === 'cards' && <CardsPage />}
      {activeTab === 'supermarket' && <SupermarketPage />}
      {activeTab === 'ai' && <AiPage />}
      {activeTab === 'joint' && <JointAccountView />}

      {/* Floating Global Slide-over Copilot Drawer */}
      <AiCopilotDrawer />
    </AppShell>
  );
}

export default App;
