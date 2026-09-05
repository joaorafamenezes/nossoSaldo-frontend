import * as React from 'react';
import { CartaoCredito } from '../../types/cards';
import { MoneyDisplay } from '../../components/common/MoneyDisplay';
import { Wifi, Sparkles, CreditCard as CardIcon } from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';

interface CreditCardVisualProps {
  card: CartaoCredito;
  isSelected?: boolean;
  onSelect?: () => void;
}

export function CreditCardVisual({ card, isSelected = false, onSelect }: CreditCardVisualProps) {
  const limiteTotal = Number(card.valorLimite) || 0;
  const limiteDisponivel = typeof card.limiteDisponivel === 'number' && !isNaN(card.limiteDisponivel)
    ? card.limiteDisponivel
    : (typeof card.faturaAtual === 'number' && !isNaN(card.faturaAtual))
    ? Math.max(0, limiteTotal - card.faturaAtual)
    : limiteTotal;

  const limiteUsado = Math.max(0, limiteTotal - limiteDisponivel);
  const percentUsado = limiteTotal > 0 ? Math.min(100, Math.max(0, Math.round((limiteUsado / limiteTotal) * 100))) : 0;

  return (
    <div
      onClick={onSelect}
      className={cn(
        'relative h-52 w-full cursor-pointer rounded-3xl p-6 transition-all duration-300 select-none overflow-hidden flex flex-col justify-between shadow-2xl',
        'bg-gradient-to-br',
        card.corGradiente || 'from-zinc-900 via-slate-900 to-black',
        isSelected
          ? 'ring-2 ring-emerald-400 ring-offset-4 ring-offset-zinc-950 scale-[1.02]'
          : 'hover:scale-[1.01] opacity-90 hover:opacity-100'
      )}
    >
      {/* Background card texture details */}
      <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/5 blur-2xl pointer-events-none" />
      <div className="absolute -left-12 -bottom-12 h-44 w-44 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

      {/* Card Header: Chip, Contactless, Issuer */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Metallic Chip */}
          <div className="flex h-8 w-11 items-center justify-center rounded-lg bg-gradient-to-tr from-amber-200 via-yellow-400 to-amber-500 p-1 shadow-inner border border-amber-600/40">
            <div className="h-full w-full rounded border border-amber-800/40 grid grid-cols-2 gap-0.5 opacity-60">
              <div className="border-r border-amber-800/40" />
              <div />
            </div>
          </div>
          <Wifi className="h-5 w-5 rotate-90 text-white/70" />
        </div>

        <div className="text-right">
          <span className="font-bold tracking-wider text-xs uppercase text-white/90 font-mono">
            {card.bandeira}
          </span>
        </div>
      </div>

      {/* Card Number & Expiry */}
      <div className="relative z-10 my-auto">
        <p className="font-mono text-sm tracking-widest text-white/80 font-semibold drop-shadow">
          •••• •••• •••• {card.ultimosDigitos || '8842'}
        </p>
        <div className="flex items-center gap-4 mt-1 text-[11px] text-white/70 font-mono">
          <span>Fecha dia: <strong className="text-white">{card.diaFechamento}</strong></span>
          <span>Vence dia: <strong className="text-white">{card.diaVencimento}</strong></span>
        </div>
      </div>

      {/* Card Footer: Name & Dynamic Limit Progress */}
      <div className="relative z-10 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-white truncate max-w-[160px]">
            {card.descricao}
          </span>
          <div className="text-right">
            <span className="text-[10px] text-white/70 block">Disponível</span>
            <span className="font-mono text-xs font-bold text-emerald-300">
              {formatCurrency(limiteDisponivel)}
            </span>
          </div>
        </div>

        {/* Limit Bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/40 backdrop-blur-sm">
          <div
            className={cn(
              'h-full transition-all duration-500',
              percentUsado > 85
                ? 'bg-rose-400'
                : percentUsado > 60
                ? 'bg-amber-400'
                : 'bg-emerald-400'
            )}
            style={{ width: `${percentUsado}%` }}
          />
        </div>
      </div>
    </div>
  );
}
