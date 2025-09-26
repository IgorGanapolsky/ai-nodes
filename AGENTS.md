# Repository Guidelines

## Project Structure & Modules

- `apps/`: Executables — `server` (Fastify API), `web` (Next.js), `cli` (Node CLI), `mobile` (Expo).
- `packages/`: Libraries — `core` (types/domain), `db` (Drizzle + SQLite), `connectors` (network APIs), `notify`, `utils`.
- `scripts/`: Local utilities and demos; `.env(.example)`: configuration.

## Build, Test, and Development

- Install: `pnpm install` (Node >= 20, PNPM >= 8).
- Dev (all): `pnpm dev` via Turborepo.
- Dev (one): `pnpm --filter <pkg> dev` (e.g., `@depinautopilot/server`).
- Build: `pnpm build` (or `pnpm --filter <pkg> build`).
- Test (all): `pnpm test`.
- Lint/Type: `pnpm lint`, `pnpm type-check`.
- DB: `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:studio`, `pnpm seed`.

## Coding Style & Naming

- Language: TypeScript across apps and packages.
- Formatting: Prettier (`pnpm format`); 2‑space indentation; single quotes.
- Linting: ESLint + `@typescript-eslint`; fix with `eslint ... --fix`.
- Names: kebab-case files (`node-metrics.ts`), PascalCase types/classes, camelCase variables/functions, UPPER_SNAKE_CASE env vars.
- Packages publish as workspaces; keep imports relative within a package and use `workspace:*` for cross‑package deps.

## Testing Guidelines

- Frameworks: Vitest (core, server, db, cli) and Jest (web, connectors).
- Run per package: `pnpm --filter <pkg> test`.
- Coverage (where configured): `pnpm --filter <pkg> test:coverage`.
- Tests co-located in `tests/` or alongside `src` files; name with `.test.ts[x]`.

## Commit & Pull Requests

- Commits: Conventional Commits (e.g., `feat: add Helium earnings parser`, `fix(server): handle 429s`).
- PRs: include summary, rationale, screenshots (UI), linked issues, and test evidence. Keep diffs focused; update docs and `.env.example` if config changes.
- CI expects builds, lint, and tests to pass; run locally before pushing.

## Security & Configuration

- Never commit secrets; use `.env` (copy from `.env.example`).
- Minimum env for local API: `PORT`, `DATABASE_URL`. Network connectors may require `HELIUM_API_KEY`, `FILECOIN_API_KEY`, etc.
- Validate inputs with Zod; prefer typed APIs from `@depinautopilot/core`.

## Agent Tips

- Prefer `pnpm --filter` for targeted work to speed feedback loops.
- When editing shared packages, run an app in watch mode to verify integration (`pnpm --filter @depinautopilot/server dev`).

## Agent Resume Flow

- Use `node scripts/linear-agent-coordination.js create-workflow` to scaffold agent tasks and coordination. The script checkpoints progress to `logs/agents/linear-coordination-state.json` so it can resume after crashes.
- Resume at any time with `node scripts/linear-agent-coordination.js resume`.
- Inspect progress with `node scripts/linear-agent-coordination.js status`.
- Reset local checkpoints with `node scripts/linear-agent-coordination.js reset-state` (does not delete Linear issues).

## Revenue Loop

- Ensure labels exist in Linear: run `node scripts/linear-agent-coordination.js ensure-labels` and add any missing via the link it prints.
- Create “opportunity” issues in Linear (manually or via integrations).
- Run one-shot assignment: `node scripts/linear-agent-coordination.js revenue-loop [limit]`.
  - Finds issues labeled `opportunity`, sorts by priority, assigns “Outreach: …” agent tasks to the least-busy agent with labels `agent-task,outreach`.
- Monitor and resume via the dashboard’s Workflow Status card.

### Scheduler Jobs

- Prospecting (every 15m): pulls candidates from GitHub/Reddit and creates `[OPP/SOURCE]` Linear issues labeled `opportunity` (deduped by title/url). Trigger manually via `POST /admin/scheduler/trigger {"jobName":"prospecting"}`.
- Revenue Loop (every 10m): converts `opportunity` issues into `Outreach:` tasks (labels `agent-task,outreach`). Trigger manually via `POST /admin/scheduler/trigger {"jobName":"revenue-loop"}`.

### Env Vars

- Linear: `LINEAR_API_KEY`, `LINEAR_TEAM_ID`
- Prospecting: `GITHUB_TOKEN` (optional), `GITHUB_SEARCH_QUERY`, `REDDIT_SUBREDDIT`
- Email: `RESEND_API_KEY` or SMTP (SES) — `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE`, plus `FROM_EMAIL`, `REPLY_TO_EMAIL`
