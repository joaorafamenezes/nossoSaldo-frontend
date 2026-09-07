import * as React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { CommandMenu } from './CommandMenu';
import { Toaster } from 'sonner';
import { DevEnvironmentBanner } from '../common/DevEnvironmentBanner';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-zinc-950 text-zinc-100 antialiased selection:bg-emerald-500 selection:text-zinc-950">
      {/* Dev/Local Environment Banner */}
      <DevEnvironmentBanner />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Navigation Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />

          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>

          {/* Mobile Bottom Navigation */}
          <BottomNav />
        </div>
      </div>

      {/* Global Command Palette */}
      <CommandMenu />

      {/* Toast Notifications */}
      <Toaster position="top-right" theme="dark" richColors closeButton />
    </div>
  );
}
