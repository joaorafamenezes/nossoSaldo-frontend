export type SerieMensal = {
  meses: number[];
  total: number;
};

export type LinhaCategoriaProjecao = SerieMensal & {
  categoriaId: string;
  categoria: string;
};

export type ProjecaoAnual = {
  ano: number;
  receitas: LinhaCategoriaProjecao[];
  despesas: LinhaCategoriaProjecao[];
  totalReceitas: SerieMensal;
  totalDespesas: SerieMensal;
  saldo: SerieMensal;
  anosDisponiveis: number[];
  categoriasDisponiveis: { id: string; nome: string }[];
  contaConjunta: { membros: { id: string; nome: string }[] } | null;
  semMovimentacaoNoAno: boolean;
  semMovimentacaoNosFiltros: boolean;
};

export const MESES_PROJECAO = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];
