export interface ReleaseItem {
  type: 'feat' | 'fix' | 'improvement';
  badge: string;
  title: string;
  description: string;
}

export interface ReleaseNote {
  version: string;
  date: string;
  title: string;
  isLatest?: boolean;
  items: ReleaseItem[];
}

export const RELEASE_NOTES: ReleaseNote[] = [
  {
    version: '2.1.0',
    date: '04 de Outubro de 2026',
    title: 'Visualização em Lista & Ordenação Alfabética de Categorias',
    isLatest: true,
    items: [
      {
        type: 'feat',
        badge: '🚀 Novidade',
        title: 'Categorias em Ordem Alfabética (A-Z)',
        description:
          'Agora suas categorias são listadas automaticamente em ordem alfabética de A a Z, permitindo também inverter a ordem ou ordenar por maior gasto e teto orçamentário.',
      },
      {
        type: 'feat',
        badge: '📋 Modo de Visualização',
        title: 'Visualização em Formato de Lista',
        description:
          'Alterne entre o formato tradicional em Grade (Cards) e a nova Lista estruturada, com leitura rápida de saldo, teto e barra de consumo.',
      },
      {
        type: 'improvement',
        badge: '🔍 Busca Rápida',
        title: 'Filtro Dinâmico de Categorias',
        description:
          'Encontre qualquer categoria instantaneamente digitando seu nome no campo de busca com botão de limpeza rápida.',
      },
      {
        type: 'feat',
        badge: '✨ Experiência',
        title: 'Central de Novidades & Release Notes',
        description:
          'Fique por dentro de todas as novas funcionalidades a cada atualização do sistema diretamente no aplicativo.',
      },
    ],
  },
  {
    version: '2.0.0',
    date: 'Setembro de 2026',
    title: 'Lançamento Oficial do NossoSaldo 2.0',
    isLatest: false,
    items: [
      {
        type: 'feat',
        badge: '✨ Design',
        title: 'Nova Interface 360° com Modo Escuro',
        description:
          'Visual remodelado, intuitivo e moderno para gestão financeira do casal com alternância de temas.',
      },
      {
        type: 'feat',
        badge: '🤖 Inteligência Artificial',
        title: 'Copilot Financeiro Integrado',
        description:
          'Assistente financeiro em linguagem natural para responder dúvidas sobre faturas, limites e distribuição de orçamento.',
      },
      {
        type: 'feat',
        badge: '🛒 Modo Mercado',
        title: 'Lista de Compras em Tempo Real',
        description:
          'Controle de compras com itens essenciais, cálculo dinâmico de carrinho e conversão automática em despesa.',
      },
      {
        type: 'improvement',
        badge: '💳 Cartões & Faturas',
        title: 'Reconciliação Automática de Faturas',
        description:
          'Visualização unificada de faturas, limites utilizados e projeções de parcelas futuras.',
      },
    ],
  },
];
