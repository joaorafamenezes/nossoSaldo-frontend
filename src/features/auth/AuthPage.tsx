import * as React from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Wallet, Sparkles, Mail, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { APP_NAME, APP_VERSION } from '../../config/appMeta';

export function AuthPage() {
  const { login, register, requestPasswordReset, isLoading, error } = useAuthStore();
  const [mode, setMode] = React.useState<'login' | 'register' | 'forgot'>('login');

  const [email, setEmail] = React.useState('');
  const [senha, setSenha] = React.useState('');
  const [nome, setNome] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === 'login') {
        await login({ email, senha });
        toast.success('Login efetuado com sucesso!');
      } else if (mode === 'register') {
        await register({ nome, email, senha });
        toast.success('Conta criada com sucesso! Faça seu login.');
        setMode('login');
      } else if (mode === 'forgot') {
        await requestPasswordReset(email);
        toast.success('Instruções de recuperação enviadas para o seu e-mail.');
        setMode('login');
      }
    } catch (err: any) {
      toast.error(err.message || 'Ocorreu um erro.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-zinc-950 flex items-center justify-center p-4 select-none relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Logo & Headline */}
        <div className="text-center space-y-3">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 dark:bg-zinc-900/80 border border-slate-200/40 dark:border-zinc-800 p-2 shadow-xl backdrop-blur-md mb-1 overflow-hidden">
            <img
              src="/nossosaldo-logo.png"
              alt="NossoSaldo Logo"
              className="h-full w-full object-contain drop-shadow-md rounded-xl"
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
            {APP_NAME} <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">v{APP_VERSION}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
            Gestão financeira inteligente, contas de casal e copilot com IA
          </p>
        </div>

        {/* Auth Card */}
        <Card className="p-6 md:p-8 space-y-6 bg-zinc-900/80 border-zinc-800 shadow-2xl backdrop-blur-xl">
          <div className="flex border-b border-zinc-800 pb-3">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 pb-2 text-xs font-bold transition-colors ${
                mode === 'login'
                  ? 'border-b-2 border-emerald-500 text-emerald-400'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 pb-2 text-xs font-bold transition-colors ${
                mode === 'register'
                  ? 'border-b-2 border-emerald-500 text-emerald-400'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Criar Conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <Input
                label="Seu Nome Completo"
                placeholder="Ex: João Ricardo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                icon={<User className="h-4 w-4" />}
                required
              />
            )}

            <Input
              label="E-mail"
              type="email"
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="h-4 w-4" />}
              required
            />

            {mode !== 'forgot' && (
              <Input
                label="Senha de Acesso"
                type="password"
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                icon={<Lock className="h-4 w-4" />}
                required
              />
            )}

            {mode === 'login' && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-[11px] text-zinc-400 hover:text-emerald-400 transition-colors"
                >
                  Esqueceu a senha?
                </button>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="w-full shadow-glow-emerald text-sm font-bold"
            >
              {mode === 'login' && 'Acessar Plataforma'}
              {mode === 'register' && 'Criar Minha Conta'}
              {mode === 'forgot' && 'Enviar Link de Redefinição'}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </form>
        </Card>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-500">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>Criptografia de ponta a ponta e conexões seguras</span>
        </div>
      </div>
    </div>
  );
}
