# Guia Rápido de Commits — NossoSaldo Frontend

Este repositório adota o padrão **Conventional Commits** para automação de releases e changelog via GitHub Actions (*Release Please*).

Para a documentação completa, consulte [docs/padrao-commits-e-versionamento.md](../docs/padrao-commits-e-versionamento.md).

---

## Formato Básico

```bash
git commit -m "<tipo>(<escopo>): <descrição no imperativo e em minúsculas>"
```

### Tipos e Efeito no Versionamento:
- `fix:` ➔ Correção de bug de interface/fluxo (Gera versão **PATCH**: `2.0.0` ➔ `2.0.1`)
- `feat:` ➔ Nova funcionalidade ou componente (Gera versão **MINOR**: `2.0.0` ➔ `2.1.0`)
- `feat!:` ou `fix!:` ➔ Quebra de comportamento existente (Gera versão **MAJOR**: `2.0.0` ➔ `3.0.0`)
- `refactor:` ➔ Refatoração interna de componentes ou hooks (Sem alteração de versão)
- `test:` ➔ Criação ou atualização de testes com Vitest (Sem alteração de versão)
- `docs:` ➔ Documentação (Sem alteração de versão)
- `style:` ➔ Ajustes visuais, CSS, Tailwind ou lint (Sem alteração de versão)
- `chore:` ➔ Manutenção de dependências, builds, Vite (Sem alteração de versão)

### Escopos mais comuns no Frontend:
- `(expenses)` ou `(gastos)` — Tabelas, cards e drawer de gastos
- `(cards)` ou `(cartao)` — Visualização de cartões, faturas e limites
- `(categories)` ou `(categorias)` — Gestão de categorias e modal
- `(supermarket)` — Lista e modo foco de supermercado
- `(ai-copilot)` — Drawer do Copilot, prompts e sugestões
- `(dashboard)` — Gráficos, métricas e timeline de faturas
- `(auth)` — Login, cadastro e modal de perfil
- `(ui)` — Componentes base (`Button`, `Modal`, `Badge`, `Input`)

### Exemplos:
- `feat(expenses): adiciona modal de confirmacao de troca de cartao para parcelas`
- `fix(types): corrige import de CartaoCredito e LancamentoBase para build da Vercel`
- `test(expenses): adiciona testes unitarios para ct001 e ct002`
