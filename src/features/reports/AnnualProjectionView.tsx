import { cn, formatCurrency } from '../../lib/utils';
import { MESES_PROJECAO, ProjecaoAnual, SerieMensal } from './projecaoAnual';

type AnnualProjectionViewProps = {
  ano: number;
  categoriaId: string;
  responsavelId: string;
  report: ProjecaoAnual | null;
  isLoading: boolean;
  error: string | null;
  onYearChange: (ano: number) => void;
  onCategoryChange: (categoriaId: string) => void;
  onResponsavelChange: (responsavelId: string) => void;
  onRetry: () => void;
};

function CelulaValor({ valor, negativo }: { valor: number; negativo?: boolean }) {
  const destacar = Boolean(negativo && valor < 0);

  return (
    <td
      className={cn(
        'px-3 py-2 text-right font-mono text-xs whitespace-nowrap tabular-nums',
        destacar ? 'text-red-400 font-semibold' : 'text-zinc-200',
      )}
    >
      {formatCurrency(valor)}
    </td>
  );
}

function LinhaSerie({
  nome,
  serie,
  destacarNegativo,
  destaque,
}: {
  nome: string;
  serie: SerieMensal;
  destacarNegativo?: boolean;
  destaque?: boolean;
}) {
  return (
    <tr className={destaque ? 'bg-zinc-900/80' : undefined}>
      <th
        scope="row"
        className={cn(
          'sticky left-0 z-10 min-w-40 bg-zinc-950 px-3 py-2 text-left text-sm font-medium',
          destaque ? 'text-zinc-100' : 'text-zinc-300',
        )}
      >
        {nome}
      </th>
      {serie.meses.map((valor, indice) => (
        <CelulaValor key={`${nome}-${indice}`} valor={valor} negativo={destacarNegativo} />
      ))}
      <CelulaValor valor={serie.total} negativo={destacarNegativo} />
    </tr>
  );
}

export function AnnualProjectionView({
  ano,
  categoriaId,
  responsavelId,
  report,
  isLoading,
  error,
  onYearChange,
  onCategoryChange,
  onResponsavelChange,
  onRetry,
}: AnnualProjectionViewProps) {
  const anos = report?.anosDisponiveis?.length ? report.anosDisponiveis : [ano];
  const categorias = report?.categoriasDisponiveis ?? [];
  const membros = report?.contaConjunta?.membros ?? [];

  return (
    <section className="flex flex-col gap-6 p-4 md:p-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Relatórios</p>
        <h1 className="text-2xl font-semibold text-zinc-100">Projeção anual</h1>
        <p className="max-w-2xl text-sm text-zinc-400">
          Receitas, despesas e saldo de janeiro a dezembro, pelo mês de competência dos lançamentos já registrados.
        </p>
      </header>

      <div className="flex flex-wrap gap-2" role="listbox" aria-label="Relatórios disponíveis">
        <button
          type="button"
          aria-pressed="true"
          className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300"
        >
          Projeção Anual de Receitas e Despesas
        </button>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:flex-wrap">
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-400">
          Ano
          <select
            aria-label="Ano"
            value={ano}
            onChange={(event) => onYearChange(Number(event.target.value))}
            className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
          >
            {anos.map((anoOpcao) => (
              <option key={anoOpcao} value={anoOpcao}>
                {anoOpcao}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-400">
          Categoria
          <select
            aria-label="Categoria"
            value={categorias.some((categoria) => categoria.id === categoriaId) ? categoriaId : ''}
            onChange={(event) => onCategoryChange(event.target.value)}
            className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
          >
            <option value="">Todas</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nome}
              </option>
            ))}
          </select>
        </label>

        {membros.length > 0 && (
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-400">
            Responsável
            <select
              aria-label="Responsável"
              value={responsavelId}
              onChange={(event) => onResponsavelChange(event.target.value)}
              className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
            >
              <option value="">Todos</option>
              {membros.map((membro) => (
                <option key={membro.id} value={membro.id}>
                  {membro.nome}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {isLoading && <p className="text-sm text-zinc-400">Carregando o relatório...</p>}

      {error && !isLoading && (
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-sm text-red-300">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="rounded-xl bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-950"
          >
            Tentar de novo
          </button>
        </div>
      )}

      {!isLoading && !error && report && (
        <div className="flex flex-col gap-4">
          {report.semMovimentacaoNoAno && (
            <p className="text-sm text-zinc-300">Nenhuma movimentação encontrada para o ano selecionado.</p>
          )}
          {report.semMovimentacaoNosFiltros && (
            <p className="text-sm text-zinc-300">Nenhuma movimentação encontrada para os filtros selecionados.</p>
          )}

          <div className="overflow-x-auto rounded-2xl border border-zinc-800">
            <table className="min-w-full border-collapse" data-testid="projection-grid">
              <thead>
                <tr className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-500">
                  <th className="sticky left-0 z-10 bg-zinc-950 px-3 py-3 text-left">Categoria</th>
                  {MESES_PROJECAO.map((mes) => (
                    <th key={mes} className="px-3 py-3 text-right font-medium">
                      {mes}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th
                    colSpan={14}
                    className="bg-emerald-500/5 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-emerald-400"
                  >
                    Receitas
                  </th>
                </tr>
                {report.receitas.map((linha) => (
                  <LinhaSerie key={`receita-${linha.categoriaId}`} nome={linha.categoria} serie={linha} />
                ))}
                <LinhaSerie nome="Total de receitas" serie={report.totalReceitas} destaque />
                <tr>
                  <th
                    colSpan={14}
                    className="bg-zinc-900 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400"
                  >
                    Despesas
                  </th>
                </tr>
                {report.despesas.map((linha) => (
                  <LinhaSerie key={`despesa-${linha.categoriaId}`} nome={linha.categoria} serie={linha} />
                ))}
                <LinhaSerie nome="Total de despesas" serie={report.totalDespesas} destaque />
                <LinhaSerie nome="Saldo" serie={report.saldo} destacarNegativo destaque />
              </tbody>
            </table>
          </div>
          <p className="text-sm text-zinc-400">
            Saldo líquido do período:{' '}
            <span
              data-testid="saldo-liquido"
              className={cn('font-mono font-semibold', report.saldo.total < 0 ? 'text-red-400' : 'text-zinc-100')}
            >
              {formatCurrency(report.saldo.total)}
            </span>
          </p>
        </div>
      )}
    </section>
  );
}
