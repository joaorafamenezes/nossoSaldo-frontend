## Mandatory Task Lifecycle & Definition of Done (DoD)

Para qualquer alteração de código, refatoração ou adição de funcionalidade:

1. **Atualizar cenários de testes**: crie caso necessário ou simplesmente, atualize os cenários de testes, mantendo cobertura de testes sempre próxima a 90%;
2. **Atualizar documentação do FrontEnd**: sempre atualizar a documentação do frontEnd, incluindo ou removendo sessões. 
3. **Atualizar swagger**: sempre revisar e atualizar o Swagger. Adicionar, atualizar ou remover sessões desnecessárias.
4. **Fechamento**:
   - Inclua no final da sua resposta uma breve lista com o status das atualizações automáticas e o output do script.
5. **Não fazer commit para a branch sem autorização**: sempre solicitar para fazer git push para a branch de desenvolvimento. Ao realizar commits autorizados, utilize estritamente o padrão **Conventional Commits** (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`, etc.), conforme [docs/padrao-commits-e-versionamento.md](../../docs/padrao-commits-e-versionamento.md).
6. **Integração Context7 MCP (Documentação e Versões Atualizadas)**:
   - Antes de implementar alterações, novas features ou atualizar dependências no Frontend (React 19, Tailwind CSS v4, Vite 7, Zustand 5, Framer Motion 12, Vitest 4, Lucide React, etc.):
     - Consulte **obrigatoriamente** o servidor MCP do **Context7** (`https://context7.com/`) utilizando as ferramentas `resolve-library-id` e `query-docs` (ou CLI `npx ctx7 docs <libraryId> <query>`).
     - Garanta que as APIs, sintaxes e hooks utilizados estejam estritamente alinhados com as versões declaradas no `package.json`, eliminando alucinações de métodos legados ou sintaxes obsoletas (ex: novidades do Tailwind v4 com `@theme` sem `tailwind.config.js` obsoleto, React 19 hooks/actions, Zustand 5).