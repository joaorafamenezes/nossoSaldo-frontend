## Mandatory Task Lifecycle & Definition of Done (DoD)

Para qualquer alteração de código, refatoração ou adição de funcionalidade:

1. **Atualizar cenários de testes**: crie caso necessário ou simplesmente, atualize os cenários de testes, mantendo cobertura de testes sempre próxima a 90%;
2. **Atualizar documentação do FrontEnd**: sempre atualizar a documentação do frontEnd, incluindo ou removendo sessões. 
3. **Atualizar swagger**: sempre revisar e atualizar o Swagger. Adicionar, atualizar ou remover sessões desnecessárias.
4. **Fechamento**:
   - Inclua no final da sua resposta uma breve lista com o status das atualizações automáticas e o output do script.
5. **Não fazer commit para a branch sem autorização**: sempre solicitar para fazer git push para a branch de desenvolvimento. Ao realizar commits autorizados, utilize estritamente o padrão **Conventional Commits** (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`, etc.), conforme [docs/padrao-commits-e-versionamento.md](../../docs/padrao-commits-e-versionamento.md).