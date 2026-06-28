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
npm run preview  # serve o build localmente
```

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
