import * as React from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { Button } from '../../components/ui/Button';
import { Camera, UploadCloud, Check, X, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '../../lib/utils';

interface ReceiptScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SAMPLE_RECEIPTS = [
  {
    id: 'rec-1',
    merchant: 'Supermercado Pão de Açúcar',
    total: 184.60,
    category: 'Supermercado & Feira',
    date: '2026-08-26',
    items: ['Café Gourmet 500g', 'Queijo Parmesão', 'Vinho Chileno Tinto', 'Azeite Extra Virgem'],
  },
  {
    id: 'rec-2',
    merchant: 'Drogaria São Paulo',
    total: 92.40,
    category: 'Saúde & Farmácia',
    date: '2026-08-25',
    items: ['Vitamina C + Zinco', 'Protetor Solar FPS 50', 'Curativos'],
  },
  {
    id: 'rec-3',
    merchant: 'Posto Ipiranga Combustíveis',
    total: 210.00,
    category: 'Transporte & Combustível',
    date: '2026-08-24',
    items: ['Gasolina Aditivada (35 Litros)'],
  },
];

export function ReceiptScannerModal({ isOpen, onClose }: ReceiptScannerModalProps) {
  const { applyAiExpenseDraft, cards } = useAppStore();
  const [isScanning, setIsScanning] = React.useState(false);
  const [scannedResult, setScannedResult] = React.useState<typeof SAMPLE_RECEIPTS[0] | null>(null);

  if (!isOpen) return null;

  const handleSimulateScan = (sample: typeof SAMPLE_RECEIPTS[0]) => {
    setIsScanning(true);
    setScannedResult(null);

    setTimeout(() => {
      setIsScanning(false);
      setScannedResult(sample);
      toast.success('Cupom fiscal lido com sucesso pela IA!');
    }, 800);
  };

  const handleConfirmAndAdd = async () => {
    if (!scannedResult) return;

    await applyAiExpenseDraft({
      descricao: `${scannedResult.merchant} (Cupom)`,
      valor: scannedResult.total,
      tipo: 'despesa',
      categoriaNome: scannedResult.category,
      cartaoNome: cards[0]?.descricao,
      dataVencimento: scannedResult.date,
      confianca: 0.98,
    });

    toast.success(`Gasto de ${formatCurrency(scannedResult.total)} cadastrado via OCR com IA!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div
        className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <Camera className="h-5 w-5 text-indigo-400" />
              Scanner de Cupom Fiscal com IA
            </h3>
            <p className="text-xs text-zinc-400">
              Extração instantânea de valores e itens via OCR inteligente
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-zinc-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="rounded-2xl border-2 border-dashed border-zinc-700 bg-zinc-950 p-6 text-center space-y-3">
          <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-indigo-950/40 text-indigo-400 border border-indigo-500/20">
            <UploadCloud className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-200">
              Arraste a foto do cupom ou clique para selecionar
            </p>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Formatos suportados: JPG, PNG, PDF ou QR Code de Nota Fiscal
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Ou teste com cupons de exemplo:
          </span>
          <div className="grid grid-cols-3 gap-2">
            {SAMPLE_RECEIPTS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSimulateScan(s)}
                className="rounded-xl border border-zinc-800 bg-zinc-950 p-2 text-left hover:border-indigo-500/40 transition-colors"
              >
                <FileText className="h-4 w-4 text-indigo-400 mb-1" />
                <p className="text-[11px] font-semibold text-zinc-200 truncate">{s.merchant.split(' ')[0]}</p>
                <p className="text-[10px] text-emerald-400 font-mono font-bold">R$ {s.total.toFixed(2)}</p>
              </button>
            ))}
          </div>
        </div>

        {isScanning && (
          <div className="rounded-xl border border-indigo-500/40 bg-indigo-950/30 p-4 text-center text-xs text-indigo-300 animate-pulse font-mono">
            🔍 Processando imagem e detectando itens do cupom com OCR...
          </div>
        )}

        {scannedResult && !isScanning && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-2.5 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <Check className="h-4 w-4" /> Dados Extraídos com Sucesso
              </span>
              <span className="font-mono text-sm font-bold text-emerald-400">
                {formatCurrency(scannedResult.total)}
              </span>
            </div>

            <div className="text-xs text-zinc-300 space-y-1">
              <p><strong>Estabelecimento:</strong> {scannedResult.merchant}</p>
              <p><strong>Categoria:</strong> {scannedResult.category}</p>
              <p><strong>Itens detectados:</strong> {scannedResult.items.join(', ')}</p>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmAndAdd}
              className="w-full mt-2 shadow-glow-emerald text-xs"
            >
              Lançar Despesa no NossoSaldo
            </Button>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
