export type TipoGasto = 'receita' | 'despesa';

export type StatusGasto = 'pendente' | 'pago' | 'atrasado' | 'cancelado';

export type OrigemLancamento = 'unico' | 'recorrente' | 'parcelado';

export interface Categoria {
  id: string;
  descricao: string;
  iconName: string;
  color?: string;
  cor?: string;
  teto?: number | null;
  orcamentoMensal?: number | null;
}

export interface LancamentoBase {
  id: string;
  gastoId: string;
  descricao: string;
  valorParcela: number;
  numeroParcela: number;
  dataVencimentoParcela: string;
  dataPagamentoParcela?: string;
  status: StatusGasto;
  competencia: string;
  observacao?: string;
  faturaCartaoId?: string;
  faturaCartaoCompetencia?: string;
  faturaCartaoStatus?: string;
}

export interface Gasto {
  id: string;
  descricao: string;
  tipo: TipoGasto;
  status: StatusGasto;
  origemLancamento: OrigemLancamento;
  numeroParcelas: number;
  parcelaAtual?: number;
  naoCompartilhar: boolean;
  valor: number;
  competencia: string;
  dataVencimento: string;
  dataPagamento?: string;
  observacao?: string;
  categoriaId: string;
  categoria?: Categoria;
  categoriaNome?: string;
  responsavelId: string;
  responsavelNome?: string;
  cartaoCreditoId?: string;
  cartaoNome?: string;
  faturaCartaoId?: string;
  recorrenciaPaiId?: string;
  dataInicioRecorrencia?: string;
  dataFimRecorrencia?: string;
  lancamentosBase?: LancamentoBase[];
  createdAt: string;
  updatedAt: string;
}

export interface ResumoFinanceiro {
  saldoTotal: number;
  receitasTotal: number;
  receitasRecebidas: number;
  receitasPendentes: number;
  despesasTotal: number;
  despesasPagas: number;
  despesasPendentes: number;
  despesasAtrasadas: number;
  economiaProjetada: number;
  taxaPoupanca: number;
}
