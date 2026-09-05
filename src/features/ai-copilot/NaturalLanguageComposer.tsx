import * as React from 'react';
import { Sparkles, Check, Send, Mic, Camera } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { AiExpenseDraft } from '../../types/ai';
import { Button } from '../../components/ui/Button';
import { ReceiptScannerModal } from './ReceiptScannerModal';
import { toast } from 'sonner';
import { formatCurrency } from '../../lib/utils';

export function NaturalLanguageComposer() {
  const { applyAiExpenseDraft } = useAppStore();
  const [inputText, setInputText] = React.useState('');
  const [draft, setDraft] = React.useState<AiExpenseDraft | null>(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [isRecording, setIsRecording] = React.useState(false);
  const [isScannerOpen, setIsScannerOpen] = React.useState(false);

  const QUICK_EXAMPLES = [
    'Almoço R$ 85,00 no cartão Itaú',
    'Mercado Pão de Açúcar 240 reais no Nubank',
    'Curso de Inglês 600 reais parcelado em 3x',
    'Conta de Luz 189 reais vence dia 28',
  ];

  const handleSimulateVoice = () => {
    setIsRecording(true);
    toast.info('Gravando áudio... Fale seu gasto.');

    setTimeout(() => {
      setIsRecording(false);
      setInputText('Jantar com amigos R$ 160,00 no cartão XP');
      toast.success('Áudio transcrito com sucesso!');
    }, 1500);
  };

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setIsAnalyzing(true);

    setTimeout(() => {
      const lower = inputText.toLowerCase();

      const matchValue = inputText.match(/(?:r\$|reais)?\s*(\d+(?:[.,]\d{1,2})?)/i);
      const parsedValue = matchValue ? parseFloat(matchValue[1].replace(',', '.')) : 50.0;

      let installments = 1;
      const matchInstallments = lower.match(/(?:em|parcelado em)\s*(\d+)\s*(?:x|vezes|parcelas)/i);
      if (matchInstallments) {
        installments = parseInt(matchInstallments[1], 10);
      }

      let desc = inputText;
      if (lower.includes('almoço') || lower.includes('jantar') || lower.includes('restaurante') || lower.includes('refeição')) {
        desc = 'Restaurante / Refeição';
      } else if (lower.includes('mercado') || lower.includes('supermercado') || lower.includes('feira')) {
        desc = 'Compras de Supermercado';
      } else if (lower.includes('farmácia') || lower.includes('remédio')) {
        desc = 'Farmácia & Medicamentos';
      } else if (lower.includes('uber') || lower.includes('gasolina') || lower.includes('posto')) {
        desc = 'Transporte & Combustível';
      } else if (lower.includes('luz') || lower.includes('energia') || lower.includes('enel')) {
        desc = 'Conta de Energia Elétrica';
      } else if (lower.includes('curso') || lower.includes('inglês') || lower.includes('livro')) {
        desc = 'Educação / Curso';
      }

      let cardName: string | undefined = undefined;
      if (lower.includes('nubank')) cardName = 'Nubank';
      else if (lower.includes('xp')) cardName = 'XP';
      else if (lower.includes('itau') || lower.includes('itaú')) cardName = 'Itaú';

      let catName = 'Outros & Imprevistos';
      if (lower.includes('almoço') || lower.includes('jantar') || lower.includes('comida')) catName = 'Restaurantes & Delivery';
      else if (lower.includes('mercado') || lower.includes('feira')) catName = 'Supermercado & Feira';
      else if (lower.includes('gasolina') || lower.includes('uber')) catName = 'Transporte & Combustível';
      else if (lower.includes('farmacia') || lower.includes('farmácia')) catName = 'Saúde & Farmácia';
      else if (lower.includes('luz') || lower.includes('energia') || lower.includes('aluguel')) catName = 'Moradia & Contas';
      else if (lower.includes('curso') || lower.includes('inglês')) catName = 'Educação & Cursos';

      setDraft({
        descricao: desc,
        valor: parsedValue,
        tipo: 'despesa',
        categoriaNome: catName,
        cartaoNome: cardName,
        numeroParcelas: installments,
        confianca: 0.96,
      });

      setIsAnalyzing(false);
    }, 450);
  };

  const handleConfirmDraft = async () => {
    if (!draft) return;
    await applyAiExpenseDraft(draft);
    toast.success(
      `Gasto "${draft.descricao}" de ${formatCurrency(draft.valor)} lançado com sucesso com IA!`
    );
    setDraft(null);
    setInputText('');
  };

  return (
    <>
      <div className="rounded-2xl border border-indigo-200 dark:border-indigo-500/30 bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/50 dark:from-indigo-950/30 dark:via-zinc-900/90 dark:to-zinc-950 p-5 space-y-4 shadow-sm dark:shadow-glow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Sparkles className="h-5 w-5" />
            <h4 className="text-sm font-bold tracking-tight text-slate-900 dark:text-zinc-100">
              Compositor de Gastos por Voz, Texto ou Cupom Fiscal
            </h4>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsScannerOpen(true)}
            className="text-xs border-indigo-300 dark:border-indigo-500/40 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100/50 dark:hover:bg-indigo-950/30"
          >
            <Camera className="h-3.5 w-3.5 mr-1" />
            <span>Escanear Cupom Fiscal</span>
          </Button>
        </div>

        <form onSubmit={handleAnalyze} className="relative flex items-center">
          <input
            type="text"
            placeholder="Digite ou fale: 'Paguei 120 no mercado no cartão Nubank em 2x'..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full h-12 rounded-xl border border-slate-300 dark:border-zinc-700/80 bg-white dark:bg-zinc-950 px-4 pr-24 text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />

          <div className="absolute right-2 flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleSimulateVoice}
              className={`rounded-lg p-2 transition-colors ${
                isRecording
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'text-slate-400 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-700 dark:hover:text-white'
              }`}
              title="Gravar por Voz"
            >
              <Mic className="h-4 w-4" />
            </button>

            <Button
              type="submit"
              variant="ai"
              size="icon"
              disabled={!inputText.trim() || isAnalyzing}
              className="h-8 w-8 rounded-lg shadow-glow-sm"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </form>

        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-500 font-mono">Exemplos rápidos:</span>
          {QUICK_EXAMPLES.map((ex, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setInputText(ex)}
              className="rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-2 py-0.5 text-[11px] text-slate-600 dark:text-zinc-400 hover:border-indigo-300 dark:hover:border-zinc-700 hover:text-slate-900 dark:hover:text-zinc-200 transition-colors shadow-xs"
            >
              {ex}
            </button>
          ))}
        </div>

        {draft && (
          <div className="rounded-xl border border-indigo-500/40 bg-indigo-950/20 p-4 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1">
                <Check className="h-4 w-4" /> Gasto Identificado com Alta Precisão ({(draft.confianca * 100).toFixed(0)}%)
              </span>
              <span className="font-mono text-sm text-emerald-400 font-bold">
                {formatCurrency(draft.valor)}
                {draft.numeroParcelas && draft.numeroParcelas > 1 && (
                  <span className="text-zinc-400 text-xs font-normal ml-1">
                    ({draft.numeroParcelas}x de {formatCurrency(draft.valor / draft.numeroParcelas)})
                  </span>
                )}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-zinc-300">
              <div>
                <span className="text-zinc-500 text-[10px] block">Descrição</span>
                <strong className="text-zinc-100">{draft.descricao}</strong>
              </div>
              <div>
                <span className="text-zinc-500 text-[10px] block">Categoria</span>
                <strong className="text-zinc-100">{draft.categoriaNome}</strong>
              </div>
              <div>
                <span className="text-zinc-500 text-[10px] block">Forma de Pagamento</span>
                <strong className="text-zinc-100">{draft.cartaoNome || 'Conta / PIX'}</strong>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDraft(null)}
                className="text-xs"
              >
                Descartar
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleConfirmDraft}
                className="text-xs shadow-glow-emerald"
              >
                Confirmar e Lançar no NossoSaldo
              </Button>
            </div>
          </div>
        )}
      </div>

      <ReceiptScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} />
    </>
  );
}
