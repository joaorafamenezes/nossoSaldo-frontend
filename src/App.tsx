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
import { ExpenseDrawerForm } from './features/expenses/ExpenseDrawerForm';
import { useReleaseStore } from './stores/useReleaseStore';
import { ReleaseNotesModal } from './components/common/ReleaseNotesModal';

export function App() {
  const { isAuthenticated, loadSession, token } = useAuthStore();
  const { activeTab, loadApiData, selectedCompetencia } = useAppStore();
  const { checkReleaseStatus } = useReleaseStore();

  React.useEffect(() => {
    loadSession();
  }, [loadSession]);

  React.useEffect(() => {
    if (token) {
      loadApiData(token);
      checkReleaseStatus(token);
    }
  }, [token, selectedCompetencia, loadApiData, checkReleaseStatus]);

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

      {/* Global Expense Drawer Form (Acessível e funcional em qualquer aba) */}
      <ExpenseDrawerForm />

      {/* Global Release Notes / Novidades Modal */}
      <ReleaseNotesModal />
    </AppShell>
  );
}

export default App;
