---
name: context7
description: >-
  Fetch up-to-date, version-specific documentation and code examples for frontend libraries using Context7 MCP (https://context7.com/).
  Activate when implementing, updating, or debugging frontend UI dependencies (React 19, Tailwind CSS v4, Vite 7, Zustand 5, Framer Motion 12, Vitest 4, Lucide React) to avoid hallucinations and deprecated patterns.
---

# Context7 - Frontend Library Documentation

Context7 serves real-time, version-specific documentation and verified code snippets for frontend libraries directly from authoritative sources.

## Frontend Libraries in Focus (NossoSaldo Frontend)
- **React 19 (`react@^19.2.5`):** Action hooks (`useActionState`, `useFormStatus`, `useOptimistic`), transition improvements, removal of deprecated legacy APIs.
- **Tailwind CSS v4 (`tailwindcss@^4.3.3`, `@tailwindcss/vite@^4.3.3`):** CSS-first architecture (`@theme` blocks, `@import "tailwindcss"`), removal of `tailwind.config.js` in favor of CSS declarations.
- **Vite 7 (`vite@^7.3.7`):** Environment API, plugin configs.
- **Zustand 5 (`zustand@^5.0.3`):** Modern store creation syntax and selectors.
- **Vitest 4 (`vitest@^4.1.11`):** Latest test runner configuration and mocks.

## MCP Tools Workflow
1. **`resolve-library-id`**:
   - Resolve package name to Context7 canonical library ID (e.g., `tailwindcss` -> `/tailwindlabs/tailwindcss`, `react` -> `/facebook/react`, `zustand` -> `/pmndrs/zustand`).
2. **`query-docs`**:
   - Query version-specific documentation and code examples.

## CLI Fallback
```bash
npx -y ctx7 docs /tailwindlabs/tailwindcss "@theme directive custom colors"
npx -y ctx7 docs /facebook/react "useActionState hook"
npx -y ctx7 docs /pmndrs/zustand "typescript create store"
```
