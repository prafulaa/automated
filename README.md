# BlastRadius

**Review AI-generated code 10x faster.** Know exactly what breaks before you merge.

BlastRadius is a GitHub App that computes the **reverse dependency blast radius** of every changed file in a pull request. On every PR open or push, it posts a single, auto-updating comment showing:

- Which downstream files are impacted (components, API routes, core utilities)
- A **risk level** (LOW / MEDIUM / HIGH)
- An AI-written reviewer tip

---

## How It Works

```
PR opened/updated
      │
      ▼
POST /webhook  ──►  validate HMAC  ──►  enqueue job  ──►  return 200 (< 2s)
                                                              │
                                          ┌───────────────────┘
                                          ▼
                                    pg-boss worker
                                          │
                              ┌───────────┼───────────┐
                              ▼           ▼           ▼
                         shallow     dependency-    Claude API
                         clone       cruiser        (reviewer tip)
                              │           │           │
                              └───────────┼───────────┘
                                          ▼
                              post/update PR comment
```

## Project Structure

```
blastradius/
├── packages/
│   └── engine/          # Core: dependency graph, blast radius, risk scoring
├── apps/
│   ├── webhook/          # Fastify server: webhook handler + pg-boss worker
│   └── web/              # Next.js 14: landing page + dashboard + auth
├── .github/workflows/    # CI (lint + test + typecheck)
└── pnpm-workspace.yaml   # Monorepo root
```

## Getting Started

### Prerequisites

- Node.js >= 20
- pnpm >= 9
- A GitHub App (create at https://github.com/settings/apps)
- Supabase account (for Postgres + Auth)

### Install

```bash
pnpm install
cp .env.example .env
# Fill in .env with your GitHub App credentials + Supabase keys
```

### Develop

```bash
pnpm dev          # Start all apps in dev mode
pnpm test         # Run all tests
pnpm lint         # Lint all packages
pnpm typecheck    # Type-check all packages
```

### Run Tests

```bash
pnpm test
```

## License

MIT
