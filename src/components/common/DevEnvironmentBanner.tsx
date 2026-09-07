import * as React from 'react';
import { AlertTriangle, Terminal } from 'lucide-react';
import { isDevEnvironment } from '../../lib/utils';

export function DevEnvironmentBanner() {
  const isDev = isDevEnvironment();

  if (!isDev) {
    return null;
  }

  return (
    <aside
      role="status"
      aria-label="Aviso de ambiente de desenvolvimento ou local"
      className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-zinc-950 text-xs font-bold py-1 px-3 flex items-center justify-center gap-2 shadow-sm shrink-0 select-none z-50 border-b border-amber-600/30"
    >
      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-zinc-950 animate-pulse" />
      <span className="tracking-wide uppercase text-[11px] md:text-xs font-black">
        Ambiente de Desenvolvimento / Local
      </span>
      <span className="hidden sm:inline-flex items-center gap-1 rounded bg-zinc-950/20 px-1.5 py-0.5 text-[10px] font-mono font-bold tracking-tight">
        <Terminal className="h-3 w-3" />
        DEV
      </span>
    </aside>
  );
}

export default DevEnvironmentBanner;
