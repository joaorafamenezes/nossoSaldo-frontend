import * as React from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { Card } from '../../components/ui/Card';
import { MoneyDisplay } from '../../components/common/MoneyDisplay';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  Users2,
  HeartHandshake,
  Split,
  UserPlus,
  Unlink,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Receipt,
  User,
} from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import * as api from '../../services/api';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

export function JointAccountView() {
  const { jointInfo, expenses, cards, selectedCompetencia, loadApiData } = useAppStore();
  const { user } = useAuthStore();

  // Form states for creating joint account
  const [partnerEmail, setPartnerEmail] = React.useState('');
  const [nomeConta, setNomeConta] = React.useState('');
  const [isLinking, setIsLinking] = React.useState(false);
  const [isUnlinking, setIsUnlinking] = React.useState(false);

  const sharedExpenses = expenses.filter(
    (e) => !e.naoCompartilhar && e.competencia.startsWith(selectedCompetencia) && e.tipo === 'despesa'
  );

  const handleCreateJointAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerEmail.trim() || !nomeConta.trim()) {
      toast.error('Preencha o e-mail do parceiro(a) e o nome da conta.');
      return;
    }

    const token = localStorage.getItem('@NossoSaldo:token');
    if (!token) {
      toast.error('Sessão expirada. Faça login novamente.');
      return;
    }

    try {
      setIsLinking(true);
      await api.createJointAccount(token, {
        nomeConta: nomeConta.trim(),
        usuarioConjunto: partnerEmail.trim(),
      });
      await loadApiData(token);
      toast.success('Conta conjunta vinculada com sucesso!');
      setPartnerEmail('');
      setNomeConta('');
    } catch (err: any) {
      console.error('Erro ao criar conta conjunta:', err);
      toast.error(err.message || 'Não foi possível vincular a conta conjunta. Verifique o e-mail informado.');
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlink = async () => {
    if (!jointInfo) return;
    if (!window.confirm('Tem certeza que deseja desvincular esta conta conjunta? Cada usuário voltará a visualizar apenas os seus próprios lançamentos.')) {
      return;
    }

    const token = localStorage.getItem('@NossoSaldo:token');
    if (!token) return;

    try {
      setIsUnlinking(true);
      await api.unlinkJointAccount(token, jointInfo.id);
      await loadApiData(token);
      toast.success('Conta conjunta desvinculada com sucesso.');
    } catch (err: any) {
      console.error('Erro ao desvincular conta conjunta:', err);
      toast.error(err.message || 'Falha ao desvincular conta conjunta.');
    } finally {
      setIsUnlinking(false);
    }
  };

  const handleSettleUp = () => {
    if (!jointInfo?.saldoAjuste?.valor) {
      toast.info('O balanço das contas compartilhadas já está zerado!');
      return;
    }
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.6 },
    });
    toast.success(
      `Acerto de contas de ${formatCurrency(jointInfo.saldoAjuste.valor)} registrado com sucesso!`
    );
  };

  // When no joint account is linked
  if (!jointInfo) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            <Users2 className="h-6 w-6 text-emerald-400" />
            Conta Conjunta & Gestão de Casal
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Compartilhe despesas, visualize cartões mútuos e automatize a divisão de contas (50% / 50%)
          </p>
        </div>

        {/* Link account form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <UserPlus className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-100">Vincular Parceiro(a)</h3>
                <p className="text-xs text-zinc-400">
                  Insira o e-mail da pessoa que você deseja convidar para a Conta Conjunta
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateJointAccount} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 block">
                  Nome da Conta Conjunta
                </label>
                <Input
                  placeholder="Ex: Conta Casal, Nossa Casa, Viagem & Despesas"
                  value={nomeConta}
                  onChange={(e) => setNomeConta(e.target.value)}
                  className="h-11 bg-zinc-950 border-zinc-800 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 block">
                  E-mail do Parceiro(a) cadastrado no NossoSaldo
                </label>
                <Input
                  type="email"
                  placeholder="Ex: parceiro@exemplo.com"
                  value={partnerEmail}
                  onChange={(e) => setPartnerEmail(e.target.value)}
                  className="h-11 bg-zinc-950 border-zinc-800 text-xs"
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={isLinking || !partnerEmail.trim() || !nomeConta.trim()}
                className="w-full h-11 text-xs shadow-glow-emerald font-semibold"
              >
                <HeartHandshake className="h-4 w-4 mr-2" />
                <span>{isLinking ? 'Vinculando parceiro(a)...' : 'Vincular Conta Conjunta'}</span>
              </Button>
            </form>
          </div>

          <div className="lg:col-span-5 rounded-3xl border border-zinc-800 bg-zinc-900/40 p-8 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Como funciona a Conta Conjunta?
              </h4>
              <ul className="space-y-3 text-xs text-zinc-400 leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Transparência Mútua:</strong> Ambos visualizam as despesas e cartões cadastrados um do outro.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Privacidade quando necessário:</strong> Despesas marcadas com <em>"Despesa Privada / Não Compartilhar"</em> ficam visíveis apenas para quem cadastrou.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Acerto de Contas Automático:</strong> O sistema calcula quem pagou mais no mês e indica o valor exato a ser transferido via PIX.
                  </span>
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 text-[11px] text-zinc-500 font-mono">
              Ambos os usuários precisam ter cadastro prévio no NossoSaldo.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // When joint account is active
  const partner1Name = jointInfo.usuario1.nome || 'Parceiro 1';
  const partner2Name = jointInfo.usuario2.nome || 'Parceiro 2';
  const creditorName = jointInfo.saldoAjuste.credorId === jointInfo.usuario1.id ? partner1Name : partner2Name;
  const debtorName = jointInfo.saldoAjuste.devedorId === jointInfo.usuario1.id ? partner1Name : partner2Name;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
              <Users2 className="h-6 w-6 text-emerald-400" />
              {jointInfo.nomeConta}
            </h2>
            <span className="rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold font-mono px-2.5 py-0.5">
              CONTA ATIVA
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Gestão financeira compartilhada entre <strong>{partner1Name}</strong> e <strong>{partner2Name}</strong> (Divisão 50% / 50%)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleUnlink}
            disabled={isUnlinking}
            className="text-xs border-zinc-700 text-zinc-400 hover:text-rose-400 hover:border-rose-500/30"
          >
            <Unlink className="h-3.5 w-3.5 mr-1.5" />
            <span>Desvincular</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSettleUp}
            className="text-xs shadow-glow-emerald"
          >
            <HeartHandshake className="h-3.5 w-3.5 mr-1.5" />
            <span>Registrar Acerto de Contas</span>
          </Button>
        </div>
      </div>

      {/* Primary Settlement Balance Card */}
      <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 via-zinc-900/90 to-zinc-950 p-6 md:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">
                Balanço Líquido do Mês
              </span>
              <span className="rounded bg-emerald-500/20 text-emerald-400 font-mono text-[10px] px-2 py-0.5 font-bold">
                50% / 50%
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Total computado em despesas compartilhadas: <strong className="text-zinc-100 font-mono">{formatCurrency(jointInfo.totalCompartilhadoMes)}</strong>
            </p>
          </div>

          <div className="text-left md:text-right">
            <span className="text-xs text-zinc-400 block">Valor para quitação mútua</span>
            <MoneyDisplay value={jointInfo.saldoAjuste.valor} type="positive" size="2xl" />
          </div>
        </div>

        {/* Settlement narrative */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Split className="h-6 w-6" />
          </div>
          <div className="text-sm text-zinc-200 leading-relaxed">
            {jointInfo.saldoAjuste.valor > 0 ? (
              <>
                Neste mês de referência, foram pagos <strong className="text-zinc-100">{formatCurrency(jointInfo.totalCompartilhadoMes)}</strong> em despesas comuns.
                <br />
                <span className="text-emerald-400 font-semibold">{debtorName}</span> deve transferir{' '}
                <strong className="text-emerald-400 font-mono">{formatCurrency(jointInfo.saldoAjuste.valor)}</strong> para{' '}
                <span className="text-zinc-100 font-semibold">{creditorName}</span> via PIX para zerar o balanço.
              </>
            ) : (
              <>
                Tudo equilibrado! Neste mês, os dois parceiros contribuíram exatamente com valores proporcionais e o balanço está zerado.
              </>
            )}
          </div>
        </div>

        {/* Comparison columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-emerald-400" />
                {partner1Name}
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">Parceiro 1</span>
            </div>
            <p className="text-xl font-bold font-mono text-zinc-100">
              {formatCurrency(jointInfo.totalPagoUsuario1)}
            </p>
            <p className="text-[11px] text-zinc-400">Total pago em contas compartilhadas</p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-indigo-400" />
                {partner2Name}
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">Parceiro 2</span>
            </div>
            <p className="text-xl font-bold font-mono text-zinc-100">
              {formatCurrency(jointInfo.totalPagoUsuario2)}
            </p>
            <p className="text-[11px] text-zinc-400">Total pago em contas compartilhadas</p>
          </div>
        </div>
      </div>

      {/* Mutual Credit Cards List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-indigo-400" />
          Cartões de Crédito dos Parceiros ({cards.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cards.map((card) => (
            <div
              key={card.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-100">{card.descricao}</span>
                <span className="text-[10px] font-mono uppercase bg-zinc-800 px-2 py-0.5 rounded text-zinc-400 font-bold">
                  {card.bandeira}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Limite: <strong className="text-zinc-200">{formatCurrency(card.valorLimite)}</strong></span>
                <span className="text-emerald-400 font-mono text-[11px]">Disponível: {formatCurrency(card.limiteDisponivel)}</span>
              </div>
              <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
                <span>Fecha: dia {card.diaFechamento}</span>
                <span>Vence: dia {card.diaVencimento}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shared Expenses List */}
      <Card className="rounded-2xl border-zinc-800 bg-zinc-900/60 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <Receipt className="h-4 w-4 text-emerald-400" />
            Lançamentos Compartilhados ({sharedExpenses.length})
          </h4>
          <span className="text-xs text-zinc-500 font-mono">
            Gastos com "Não Compartilhar" desativado
          </span>
        </div>

        {sharedExpenses.length === 0 ? (
          <p className="text-xs text-zinc-500 text-center py-6">
            Nenhum lançamento compartilhado registrado nesta competência.
          </p>
        ) : (
          <div className="space-y-2">
            {sharedExpenses.map((exp) => (
              <div
                key={exp.id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/60 hover:border-zinc-700 transition-colors"
              >
                <div>
                  <p className="text-xs font-semibold text-zinc-100">{exp.descricao}</p>
                  <p className="text-[10px] text-zinc-500 font-mono">
                    Pago por: <strong className="text-zinc-400">{exp.responsavelNome || partner1Name}</strong> • {exp.categoriaNome || 'Geral'}
                  </p>
                </div>
                <div className="text-right">
                  <MoneyDisplay value={exp.valor} type="negative" size="sm" />
                  <span className="text-[10px] text-zinc-500 font-mono block">
                    (50%: {formatCurrency(exp.valor / 2)})
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
