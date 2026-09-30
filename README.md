# NossoSaldo Frontend

Aplicacao web do NossoSaldo, construida com React e Vite. Ela consome a API NossoSaldo para login, cadastro, validacao de email, gastos, cartoes, faturas, contas conjuntas e relatorios financeiros.

## Stack

- React 19
- Vite
- CSS modularizado em `src/App.css` e `src/index.css`
- Cliente HTTP em `src/services/api.js`

## Scripts

```bash
npm run dev      # inicia o servidor Vite local
npm run build    # gera build de producao
npm run lint     # executa ESLint
npm test         # executa os testes unitarios com Vitest
npm run preview  # serve o build localmente
```

## CI

O workflow `.github/workflows/ci.yml` executa automaticamente em pushes para `main`, `master` e `developer`, e em pull requests. Ele instala as dependencias com `npm ci`, executa lint, testes unitarios e gera o build de producao.

Os testes usam Vitest e Testing Library. A suíte cobre os contratos principais do cliente HTTP e interações críticas do assistente financeiro, incluindo envio por Enter, quebra de linha com Shift+Enter e estado de carregamento.

## Variaveis de ambiente

Configure a URL da API quando necessario:

```env
VITE_API_URL="http://localhost:10000"
```

Quando `VITE_API_URL` nao e informado, o frontend usa a configuracao padrao definida em `src/services/api.js`.

## Regras de UX e negocio no frontend

- Novo gasto exige data de vencimento.
- Ao alterar `Vencimento`, o campo `Competencia` acompanha automaticamente o mes/ano do vencimento.
- Exemplo: vencimento `2026-08-17` define competencia `2026-08` na tela e envia `2026-08-01` para a API.
- O botao de redefinicao de senha fica disponivel no fluxo publico de recuperacao, nao no menu autenticado do dashboard.
- Em lancamentos parcelados com parcela pendente no mes vigente, clicar em `Pagar` no card PAI abre diretamente a confirmacao e efetua o pagamento da parcela correspondente ao mes vigente, sem exigir a expansao da listagem de parcelas filhas.
- Campo de Observações: No cadastro (`CT001`) e na edição (`CT002`) de lançamentos, é disponibilizado um campo `textarea` para detalhar especificidades do registro. O valor informado é persistido na base existente (`Gasto.observacao`) e exibido durante as consultas nas visualizações de acordeão por categoria, grade e tabela.
- Confirmação de Exclusão de Lançamentos (`CT001`): Ao clicar no botão de exclusão de gastos e receitas, é exibido modal customizado de confirmação com mensagem explícita, detalhamento do registro e opções para confirmar a exclusão ou voltar atrás sem remover nada. Ao confirmar, o modal gerencia feedback de carregamento assíncrono (`Excluindo...`), desabilita cliques concorrentes e remove o registro de forma otimista da interface. Há suporte completo para exclusão de lançamentos únicos, parcelados e também recorrentes projetados virtualmente (`virtual-{recorrenciaId}-{mesKey}`). A funcionalidade de ações/seleção em massa (`ENABLE_BATCH_ACTIONS`) encontra-se temporariamente desabilitada/oculta da interface a pedido do usuário, com suporte preservado na arquitetura.
- **Otimização de UI/UX na Listagem Principal**: O label redundante de `Competência: MM/AAAA` foi removido dos cards de lançamentos da tela principal (`ExpenseCategoryAccordion`, `ExpenseGrid` e `ExpenseTable`), reduzindo o ruído visual e a carga cognitiva, uma vez que o período/mês já está ativamente selecionado no filtro global do topo da aplicação. O detalhamento completo da competência permanece acessível ao abrir o formulário/drawer de detalhes e edição do lançamento.
- **Conciliação e Conformidade de Faturas de Cartão (`CT001` e `CT002`)**:
  - A fatura emitida pela instituição bancária é uma unidade indivisível que consolida todos os lançamentos cobrados no cartão durante aquele ciclo de faturamento (incluindo compras de ambos os titulares em contas conjuntas e parcelas já quitadas antecipadamente).
  - Na tela de **Gastos & Receitas**, ao filtrar por um cartão específico, o sistema exibe o `CardInvoiceReconciliationBanner` (`data-testid="card-reconciliation-banner"`). Se houver filtros restritivos ativos (como responsável específico ou status `pendente`) que ocultem itens da fatura, o banner indica com clareza o subtotal filtrado (ex: R$ 482,43) em relação à fatura total do cartão (ex: R$ 672,43), e disponibiliza o botão "Ver Fatura Completa" para redefinir os filtros e alinhar a visualização com a fatura oficial.
  - Na tela de **Cartões de Crédito & Faturas**, o `InvoiceDetailsDrawer` exibe o valor total consolidado e detalha a composição por responsável e por situação dos lançamentos (Pendentes vs Pagos antecipadamente), permitindo alternar filtros e inspecionar subtotais de cada responsável sem gerar ambiguidade com o valor oficial da fatura bancária.

## Desenvolvimento local

```bash
npm install
npm run dev
```

Acesse o endereco exibido pelo Vite, normalmente `http://localhost:5173`.

## Build

```bash
npm run build
```

O build final fica em `dist/`.
