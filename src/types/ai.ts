export interface AiMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  acoesSugeridas?: {
    tipo: 'criar_gasto' | 'ver_fatura' | 'ver_relatorio' | 'adicionar_mercado';
    label: string;
    payload?: any;
  }[];
}

export interface AiExpenseDraft {
  descricao: string;
  valor: number;
  tipo: 'receita' | 'despesa';
  categoriaNome?: string;
  categoriaId?: string;
  dataVencimento?: string;
  cartaoNome?: string;
  cartaoCreditoId?: string;
  numeroParcelas?: number;
  confianca: number;
}

export interface AiInsight {
  id: string;
  tipo: 'alerta' | 'oportunidade' | 'resumo' | 'previsao';
  titulo: string;
  descricao: string;
  impacto?: number;
  icone: string;
  acaoTexto?: string;
  acaoRota?: string;
}

export type IaProvedor = 'openai' | 'anthropic' | 'gemini' | 'groq' | 'ollama';

export interface IaConfiguracao {
  provedor: IaProvedor | string;
  modelo: string;
  apiKeyCadastrada: boolean;
  atualizadaEm?: string;
}
