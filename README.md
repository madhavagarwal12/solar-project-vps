# Helios Engineering System

Solar field executive site-assessment platform: lead pipeline, site visit wizard,
roof planner, generation calculator, proposal preview, document center, Supabase Auth,
and Resend email plumbing.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 App Router + TypeScript |
| Styling | Tailwind CSS v4 with tokens in `app/globals.css` |
| Database | Postgres via Prisma 5 (local dev uses `docker-compose.yml`, see below) |
| Production Database | Supabase Postgres through Prisma via a pooled `DATABASE_URL` |
| Auth | Supabase Auth sessions mapped to Prisma `User` rows by email for roles |
| Email | Resend transactional email through `lib/email.ts` and `app/api/email/proposal` |
| Maps | Google Places API server-side proxy in `app/api/places/*` |

## Scope

Implemented: Supabase login/logout, local role lookup, lead dashboard, lead detail,
visit forms, roof planner, generation and financial calculator, proposal preview,
documents page, and proposal email API route.

Not yet implemented: stored PDF proposal generation, photo upload storage, manager
approval workflow, price-list/subsidy admin config, and Supabase Postgres migration.

## Getting Started

```bash
docker compose up -d postgres   # local Postgres, see docker-compose.yml
npm install
npm run migrate:dev
npm run db:seed
npm run auth:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app redirects to `/login`.

Demo accounts:

| Email | Password | Role |
|---|---|---|
| field@helios.dev | field1234 | Field Executive |
| manager@helios.dev | manager1234 | Manager |
| admin@helios.dev | admin1234 | Admin |

## Environment

Copy `.env.example` into local or Vercel environment variables and fill in real values.
For Vercel production data, set `DATABASE_URL` to the Supabase Supavisor session-pooler
connection string from Supabase Dashboard > Connect. The anon key and service role key
are not database passwords.

## CI/CD and Deployment

GitHub Actions runs lint, typecheck, a Prisma migration-safety check, and a build on
every PR (`.github/workflows/ci.yml`). Merges to `main` additionally build a Docker
image, migrate the staging and production databases, and deploy to a VPS behind a
manual approval gate (`.github/workflows/deploy.yml`). See [DEPLOYMENT.md](DEPLOYMENT.md)
for the required secrets, GitHub Environments, and one-time VPS setup — the deploy
steps stay disabled (skip with a warning) until that setup is done.

## Data Model

See `prisma/schema.prisma`. SQLite has no enum type, so fields that map to spec enums
are stored as `String` and constrained at the application layer in `lib/types.ts`.

## Calculation Engine

`lib/calculations.ts` implements roof area, row spacing, shading loss, generation, and
financial formulas. Peak Sun Hours come from `lib/pvgis.ts`, which calls PVGIS when
coordinates exist and falls back to `lib/psh-data.ts`.
