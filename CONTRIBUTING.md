# Contributing

We welcome contributions! Please follow these guidelines to keep the repo healthy and productive.

## Development Setup

```bash
pnpm install
cp .env.example .env
pnpm db:generate && pnpm db:migrate && pnpm seed
pnpm dev
```

## Code Style

- TypeScript across apps and packages.
- 2-space indentation; single quotes; Prettier enforced: `pnpm format`.
- ESLint + `@typescript-eslint`: `pnpm lint` (fix with `--fix`).
- Naming: kebab-case files, PascalCase types/classes, camelCase vars/functions.

## Testing

- Vitest for core/server/db/cli; Jest for web/connectors.
- Run all: `pnpm test`. Per package: `pnpm --filter <pkg> test`.

## Commits & PRs

- Conventional Commits, e.g. `feat(server): add pricing endpoint`.
- Keep diffs focused; update docs and `.env.example` when config changes.
- PRs must include summary, rationale, screenshots (UI), and test evidence.

## Security

- Never commit secrets. Use `.env` (copy from `.env.example`).
- Validate inputs with Zod; prefer typed APIs from `@depinautopilot/core`.

## Agent Tips

- Prefer `pnpm --filter` for targeted work to speed feedback loops.
- When editing shared packages, run an app in watch mode: `pnpm --filter @depinautopilot/server dev`.
