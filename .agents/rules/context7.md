# Diretriz de Versões e Documentação: Context7 MCP (Frontend)

1. **Consulta Obrigatória de Dependências:**
   - Sempre consulte a documentação oficial atualizada no **Context7 MCP** (`https://context7.com/`) antes de introduzir novos padrões ou alterar implementações de bibliotecas no frontend.
   - Ferramentas MCP disponíveis: `resolve-library-id` e `query-docs`.

2. **Padrões Críticos do Frontend (NossoSaldo Frontend):**
   - **Tailwind CSS v4:** O projeto utiliza `@tailwindcss/vite` e configuração CSS-first (`@theme`). Não utilize diretrizes antigas ou arquivos de configuração obsoletos do Tailwind v3.
   - **React 19:** Verifique a assinatura de novos hooks e patterns nativos do React 19 antes de escrever utilitários redundantes.
   - **Zustand 5 & Framer Motion 12:** Utilize as assinaturas e tipos mais recentes.
