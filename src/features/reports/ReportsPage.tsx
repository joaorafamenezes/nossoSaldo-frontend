import * as React from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { getAnnualProjection } from '../../services/api';
import { AnnualProjectionView } from './AnnualProjectionView';
import { ProjecaoAnual } from './projecaoAnual';

export function ReportsPage() {
  const token = useAuthStore((state) => state.token);
  const [ano, setAno] = React.useState(() => new Date().getUTCFullYear());
  const [categoriaId, setCategoriaId] = React.useState('');
  const [responsavelId, setResponsavelId] = React.useState('');
  const [report, setReport] = React.useState<ProjecaoAnual | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [reloadKey, setReloadKey] = React.useState(0);

  React.useEffect(() => {
    if (!token) {
      setReport(null);
      setError('Entre novamente para ver o relatório.');
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    let aguardandoNovoRecorte = false;
    setIsLoading(true);
    setError(null);
    setReport(null);

    getAnnualProjection(token, {
      ano,
      categoriaId: categoriaId || undefined,
      responsavelId: responsavelId || undefined,
    })
      .then((data: ProjecaoAnual) => {
        if (cancelled) {
          return;
        }

        if (categoriaId && !data.categoriasDisponiveis.some((categoria) => categoria.id === categoriaId)) {
          aguardandoNovoRecorte = true;
          setCategoriaId('');
          return;
        }

        if (responsavelId && !data.contaConjunta) {
          aguardandoNovoRecorte = true;
          setResponsavelId('');
          return;
        }

        setReport(data);
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message || 'Não foi possível carregar o relatório.');
        }
      })
      .finally(() => {
        if (!cancelled && !aguardandoNovoRecorte) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token, ano, categoriaId, responsavelId, reloadKey]);

  return (
    <AnnualProjectionView
      ano={ano}
      categoriaId={categoriaId}
      responsavelId={responsavelId}
      report={report}
      isLoading={isLoading}
      error={error}
      onYearChange={(proximoAno) => {
        setReport(null);
        setAno(proximoAno);
      }}
      onCategoryChange={(proximaCategoria) => {
        setReport(null);
        setCategoriaId(proximaCategoria);
      }}
      onResponsavelChange={(proximoResponsavel) => {
        setReport(null);
        setResponsavelId(proximoResponsavel);
      }}
      onRetry={() => setReloadKey((valor) => valor + 1)}
    />
  );
}
