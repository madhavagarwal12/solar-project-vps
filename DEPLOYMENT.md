# Deployment

Pipeline mechanics live in code (`.github/workflows/ci.yml`,
`.github/workflows/deploy-vps.yml`, `.github/workflows/deploy.yml`,
`Dockerfile`, `docker-compose.yml`, `deploy/`). This document is what those
files assume exists and don't automate themselves: GitHub setup, secrets,
and one-time VPS provisioning.

## Current status — live

Deployed at **https://test.autopilot-studio.com** on a Hostinger VPS
(`69.62.79.214`, hostname `srv816930`), which also runs other unrelated
services (n8n, Traefik) — Helios is fully isolated from them: its own Docker
network (`helios_default`), its own volume, its own Postgres container, and
it only joins the box's existing `app-network` for Traefik routing.

- **CI** (`ci.yml`): every PR and push to main — install, lint, typecheck,
  validate Prisma migrations against an ephemeral Postgres container, build.
  No test suite exists yet, so there are no unit/integration/E2E stages; add
  them here when tests exist.
- **Deploy to VPS** (`deploy-vps.yml`): the workflow that's actually live.
  On push to main: runs `ci.yml` as a gate, then SSHes into the VPS,
  `git reset --hard` to `origin/main`, runs `prisma migrate deploy` via the
  `migrate` compose profile, rebuilds the image locally on the VPS (Postgres
  lives in a container on the same box, not Supabase — this workflow doesn't
  use GHCR or a remote database at all), and smoke-checks
  `$PROD_URL/login`. References the `production` GitHub Environment so a
  required-reviewers approval gate can be added later without touching the
  workflow file — unconfigured, it's a no-op.
- **Deploy** (`deploy.yml`): a *different*, currently-unused topology —
  GHCR-hosted image + remote Supabase Postgres + separate staging/prod VPS
  hosts behind Caddy. Kept in case that shape is ever adopted instead; not
  what's running today. Its staging/production jobs will keep failing
  (missing `STAGING_DATABASE_URL` etc.) unless you either configure it for
  real or remove it.

### Traefik integration gotcha (already fixed, worth knowing)

The `app` container is attached to two Docker networks — its own `default`
(to reach Postgres) and the box's external `app-network` (so Traefik can
reach it). Without the `traefik.docker.network: app-network` label,
Traefik's docker provider picked the *other* network's IP for its backend
pool — one it has no route to — so TLS handshakes succeeded but every
request hung forever with zero errors logged anywhere. If Traefik routing
to a multi-homed container ever breaks again, check
`docker inspect <container>` for its IP on each network against what
`docker exec <traefik> wget -qO- http://localhost:8080/api/http/services/<name>@docker`
reports as the backend — a mismatch is this exact bug.

## Required GitHub repo configuration

### Secrets (Settings > Secrets and variables > Actions > Secrets)

Active, used by `deploy-vps.yml` (the live pipeline):

| Secret | Used by | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `ci.yml` build step, VPS build | Same value as `.env`; baked into the client bundle at build time |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same | Same. Getting this wrong bakes a literal placeholder into the bundle and fails silently at login — verify the built JS actually contains a real JWT, not a template string |
| `VPS_HOST` | `deploy` job | `69.62.79.214` |
| `VPS_SSH_USER` | `deploy` job | `root` |
| `VPS_SSH_KEY` | `deploy` job | Deploy-only SSH private key. Must contain **only** the `-----BEGIN/END OPENSSH PRIVATE KEY-----` block — nothing else pasted around it, or `drone-ssh` fails instantly with `ssh: no key found` |

Only relevant if `deploy.yml`'s GHCR/Supabase/multi-VPS topology is ever adopted instead of the current setup:

| Secret | Used by |
|---|---|
| `STAGING_DATABASE_URL` | `migrate-staging` |
| `PROD_DATABASE_URL` | `deploy-production` |
| `DEPLOY_NOTIFY_WEBHOOK_URL` | `deploy-production` (optional) |

### Variables (Settings > Secrets and variables > Actions > Variables)

| Variable | Used by | Notes |
|---|---|---|
| `PROD_URL` | `deploy-vps.yml`'s smoke check | `https://test.autopilot-studio.com` |
| `STAGING_URL`, `VPS_PROVISIONED` | `deploy.yml` only | Not relevant unless that workflow's topology is adopted |

### Environments (Settings > Environments)

`production` exists and is referenced by `deploy-vps.yml`'s `deploy` job.
Currently has no required reviewers, so deploys run immediately on push to
main — add reviewers here whenever you want a manual approval gate before
touching the live VPS; no workflow file changes needed.

`staging`/`deploy.yml`'s two-environment setup only matters if that
workflow's topology is ever adopted instead.

## How the live VPS was actually provisioned

Unlike the generic steps below (which describe `deploy.yml`'s hypothetical
GHCR+Caddy+two-host topology), the current `test.autopilot-studio.com`
deployment was set up directly against the existing box:

1. VPS already had Docker + Compose and its own Traefik/n8n stack running
   (`/root/docker-compose.yml`, project name `root`) — nothing here touches
   that stack.
2. `git clone` the repo to `/opt/helios/app` on the VPS.
3. Created `deploy/.env` (compose vars: `POSTGRES_PASSWORD` — **use
   `openssl rand -hex 24`, not `-base64`**, see the compose file comment —
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `APP_PORT`,
   `APP_DOMAIN`) and `deploy/.env.production` (runtime secrets:
   `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_MAPS_SERVER_API_KEY`,
   `RESEND_API_KEY`, `RESEND_FROM_EMAIL`) — neither file is in git.
4. `docker compose -f docker-compose.vps.yml --profile tools run --rm migrate`
   then `up -d --build`.
5. Pointed `test.autopilot-studio.com`'s DNS A record at the VPS IP.
6. Added `traefik.docker.network: app-network` + routing labels (see the
   compose file) so the box's existing Traefik picks it up and issues a
   real cert via its `mytlschallenge` ACME resolver — no second reverse
   proxy, no new ports on 80/443.
7. Generated a deploy-only SSH keypair, added the public half to the VPS's
   `~/.ssh/authorized_keys`, and set the three `deploy-vps.yml` secrets
   above with the private half.

If a second environment (a real staging tier, or a second VPS) is ever
needed, the generic steps below are the closer template — they describe a
provider-agnostic multi-host setup rather than this specific box.

## Provisioning a VPS the `deploy.yml` way (hypothetical, not what's live)

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

**On the live VPS** (`deploy-vps.yml` builds locally, no GHCR tags exist to
re-pull): SSH in and reset to a known-good commit, then rebuild —
`cd /opt/helios/app && git reset --hard <good-sha> && cd deploy && docker
compose -f docker-compose.vps.yml up -d --build`. Slower than a tag-based
rollback (full rebuild each time) but requires no extra infrastructure.

**If `deploy.yml`'s GHCR topology is ever adopted**: every image is tagged
with its git SHA, so reverting is re-running the SSH deploy step with a
previous `STAGING_IMAGE_TAG`/`PROD_IMAGE_TAG` — no rebuild needed.

**Database** (either topology): per `ci-cd-pipeline.md`'s migration-safety
rules, migrations must be backward-compatible during the deploy window.
Prefer rolling forward with a fix over rolling back the database once real
data has been written under a new schema. There is no automated
migration-rollback step; define one only if a specific migration needs it.

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
