# Deployment

Pipeline mechanics live in code (`.github/workflows/ci.yml`, `.github/workflows/deploy.yml`,
`Dockerfile`, `docker-compose.yml`, `deploy/`). This document is what those files
assume exists and don't automate themselves: GitHub setup, secrets, and the
one-time VPS provisioning.

## Current status

- **CI** (`ci.yml`): fully active on every PR and push to main — installs,
  lints, typechecks, validates Prisma migrations against an ephemeral
  Postgres container, and builds. No test suite exists yet, so there are no
  unit/integration/E2E stages; add them to `ci.yml` when tests exist.
- **Deploy** (`deploy.yml`): builds and pushes a Docker image to GHCR, and
  runs `prisma migrate deploy` against real staging/production databases on
  every merge to main. The VPS deploy and smoke-check steps are stubbed —
  they detect missing secrets and skip themselves with a warning rather than
  failing the workflow. Nothing gets deployed to a server until you provision
  one and add the secrets below.

## Required GitHub repo configuration

### Secrets (Settings > Secrets and variables > Actions > Secrets)

| Secret | Used by | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | build (both workflows) | Same value as `.env`; baked into the client bundle at build time |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | build (both workflows) | Same |
| `STAGING_DATABASE_URL` | `migrate-staging` | Supabase Postgres pooled connection string for the **staging** project/branch |
| `PROD_DATABASE_URL` | `deploy-production` | Supabase Postgres pooled connection string for **production** — never reuse the staging one |
| `VPS_HOST` | `deploy-staging`, `deploy-production` | VPS IP/hostname. Leave unset until the VPS exists — its absence is what keeps deploy steps skipping safely |
| `VPS_SSH_USER` | same | e.g. `deploy` |
| `VPS_SSH_KEY` | same | Private key for a deploy-only SSH user (not your personal key) |
| `DEPLOY_NOTIFY_WEBHOOK_URL` | `deploy-production` | Slack/Discord/Teams incoming webhook. Optional — notification step no-ops without it |
| `GITHUB_TOKEN` | `build-and-push` | Provided automatically by Actions, no setup needed |

### Variables (Settings > Secrets and variables > Actions > Variables)

| Variable | Used by | Notes |
|---|---|---|
| `VPS_PROVISIONED` | `deploy-staging`, `deploy-production` | Set to `true` only after completing "Provisioning the VPS" below — this is what actually flips the SSH deploy steps on |
| `STAGING_URL` | `smoke-staging` | e.g. `https://staging.helios.example.com` |
| `PROD_URL` | `deploy-production` | e.g. `https://app.helios.example.com` |

### Environments (Settings > Environments)

Create two: `staging` and `production`.

- **`production`**: add required reviewers. This is the manual approval gate
  from the pipeline spec — the `deploy-production` job in `deploy.yml`
  references this environment, so the workflow pauses for approval before
  touching the production database or the production container.
- **`staging`**: no reviewers needed; every merge to main should reach
  staging automatically.

## Provisioning the VPS (one-time, when ready to go beyond staging-in-CI)

1. Provision a VPS (any provider). Install Docker + the Compose plugin.
2. Point two DNS records at it: one for staging, one for production
   (e.g. `staging.helios.example.com`, `app.helios.example.com`).
3. Copy `deploy/docker-compose.yml` and `deploy/Caddyfile` to `/opt/helios/deploy`
   on the VPS.
4. Create `/opt/helios/deploy/.env.staging` and `.env.production` on the VPS
   (not in git) containing the app's runtime environment variables — same
   names as `.env.example`, with the matching staging/production values,
   plus `DATABASE_URL` pointing at the same Supabase project as the
   corresponding GitHub secret above.
5. Create a `deploy` Linux user with SSH key auth only, and give it
   passwordless `docker` access (add to the `docker` group). Put its
   private key in the `VPS_SSH_KEY` secret and its username in `VPS_SSH_USER`.
6. Set `STAGING_DOMAIN` and `PROD_DOMAIN` env vars on the VPS (referenced by
   `deploy/Caddyfile`) — e.g. in `/opt/helios/deploy/.env` alongside the
   compose file, or exported in the deploy user's shell profile.
7. Run `docker compose up -d caddy` once by hand to confirm Caddy issues
   certificates and both domains resolve, before relying on CI to deploy app
   containers into it.
8. Set the `VPS_HOST`, `VPS_SSH_USER`, `VPS_SSH_KEY` secrets and the
   `VPS_PROVISIONED`, `STAGING_URL`, `PROD_URL` variables in GitHub. The next
   merge to main will deploy for real.

## Rollback

- **Code**: every deployed image is tagged with its git SHA in GHCR
  (`ghcr.io/<repo>:<sha>`), so reverting is re-running the SSH deploy step
  with a previous `STAGING_IMAGE_TAG`/`PROD_IMAGE_TAG` — no rebuild needed.
- **Database**: per `ci-cd-pipeline.md`'s migration-safety rules, migrations
  must be backward-compatible during the deploy window. Prefer rolling
  forward with a fix over rolling back the database once real data has been
  written under a new schema. There is no automated migration-rollback step;
  define one only if a specific migration needs it.

## Local development

Local dev now runs against Postgres (schema provider was `sqlite`, migrated
to `postgresql` — see `prisma/schema.prisma`). Use the included compose file
for a throwaway local database instead of installing Postgres directly:

```bash
docker compose up -d postgres
# then in .env: DATABASE_URL="postgresql://helios:helios_dev@localhost:5432/helios"
npm run migrate:dev
npm run db:seed
npm run dev
```
