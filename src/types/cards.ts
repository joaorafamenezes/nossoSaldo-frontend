export type StatusFaturaCartao = 'aberta' | 'fechada' | 'paga' | 'vencida' | 'cancelada';

export interface CartaoCredito {
  id: string;
  descricao: string;
  ultimosDigitos?: string;
  bandeira: 'mastercard' | 'visa' | 'elo' | 'amex';
  corGradiente: string;
  cor?: string;
  diaFechamento: number;
  diaVencimento: number;
  valorLimite: number;
  limiteDisponivel: number;
  faturaAtual?: number;
  observacoes?: string;
  usuarioId?: string;
  usuarioNome?: string;
  usuarioEmail?: string;
}

export interface FaturaCartao {
  id: string;
  cartaoCreditoId: string;
  competencia: string;
  dataAbertura: string;
  dataFechamento: string;
  dataVencimento: string;
  valorTotal: number;
  status: StatusFaturaCartao;
  dataPagamento?: string;
  observacoes?: string;
  quantidadeLancamentos?: number;
}
