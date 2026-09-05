export type CorredorSupermercado =
  | 'hortifruti'
  | 'carnes_frios'
  | 'padaria_matinais'
  | 'laticinios'
  | 'mercearia_graos'
  | 'bebidas'
  | 'limpeza'
  | 'higiene_pessoal'
  | 'congelados'
  | 'outros';

export interface SupermarketItem {
  id: string;
  nome: string;
  quantidade: number;
  unidade: 'un' | 'kg' | 'g' | 'l' | 'ml' | 'pct' | 'cx';
  corredor: CorredorSupermercado;
  precoEstimado: number;
  precoReal?: number;
  noCarrinho: boolean;
  observacao?: string;
  adicionadoPor?: string;
}

export interface CategoriaCorredorInfo {
  key: CorredorSupermercado;
  nome: string;
  icone: string;
  cor: string;
}

export interface ListaSupermercado {
  id: string;
  nome: string;
  dataCriacao: string;
  finalizada: boolean;
  totalEstimado: number;
  totalNoCarrinho: number;
  itens: SupermarketItem[];
}
