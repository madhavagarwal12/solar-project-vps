# Helios Engineering System — Full Project Guide

**Project type:** Solar site-assessment and proposal platform  
**Canonical code directory:** `helios_engineering_system/`  
**Product specification:** `../solar_field_software_spec.md`  
**Current status:** UI prototype and Phase 1–3 calculation MVP

## 1. Product Objective

Helios helps solar-company field executives turn a customer lead into a reliable site assessment and solar proposal while working in the field. Managers need visibility into the lead pipeline, assessments, calculations, proposal approvals, and commercial performance.

The product has two surfaces:

- **Field experience:** mobile-first workflow for leads, visit capture, roof planning, calculations, and proposal review.
- **Operations dashboard:** web workflow for assignment, review, approvals, configuration, reporting, and auditability.

## 2. Current Codebase

### Implemented now

- Next.js App Router with TypeScript
- Prisma 5 with Postgres (local dev via `docker-compose.yml`, prod via Supabase)
- CI/CD: GitHub Actions PR checks and a staged deploy pipeline — see `DEPLOYMENT.md`
- Lead list and lead detail pages
- Property, shading, and electrical visit steps
- Roof planner UI
- Solar generation and financial calculation screens
- Seed data and server actions
- Design system documented in `DESIGN.md`

### Main files

| Area | Location |
|---|---|
| Routes and screens | `app/` |
| Shared UI | `components/` |
| Server actions | `lib/actions.ts` |
| Calculation engine | `lib/calculations.ts` |
| PSH lookup | `lib/psh-data.ts` |
| Domain types | `lib/types.ts` |
| Database schema | `prisma/schema.prisma` |
| Database seed | `prisma/seed.ts` |
| Visual rules | `DESIGN.md` |

### Explicitly missing

- Multi-company/organization support (auth, roles, and RBAC exist; `companyId` tenant scoping does not)
- Offline mobile storage and reliable synchronization
- Device GPS capture, visit geofence validation, and timestamps
- Camera capture, photo metadata, upload queue, and private media storage
- Manager lead assignment and proposal approval workflow
- Versioned price lists and subsidy configuration
- Proposal PDF generation and customer proposal portal
- Email-only notifications and delivery
- Audit log, consent tracking, backups, observability, and deployment configuration

## 3. Product Roles

| Role | Core responsibilities |
|---|---|
| Super admin | Company settings, users, pricing, subsidy rules, reports |
| Manager / operations head | Lead assignment, visit review, proposal approval, team performance |
| Field executive | Assigned leads, site visits, photos, roof planning, calculations |
| Customer | View proposal, accept, decline, or request changes |

Every record must be tenant-scoped by `companyId` before multi-company support is enabled in production.

## 4. Core Workflow

```text
Lead created
  → Lead assigned
  → Visit scheduled
  → Visit checked in
  → Property, shading, electrical, and photo data captured
  → Roof plan completed
  → Solar and financial calculation saved
  → Proposal generated
  → Manager review
  → Proposal sent to customer
  → Customer accepts, declines, or requests changes
```

Every transition must record the actor, timestamp, previous state, new state, and optional reason.

## 5. Essential APIs Only

Only the integrations below are required for the specified product. Everything else should remain an internal module or a future option.

| Priority | Integration | Use in Helios | Required setup |
|---|---|---|---|
| Required | **Google Maps Platform** | Address autocomplete, geocoding/reverse geocoding, map display, navigation handoff | Google Cloud project, billing, restricted browser/server/mobile keys, Places + Geocoding + Maps SDK enabled |
| Required | **PVGIS API** | Location-based solar irradiation and PV production inputs | No application key is normally required; select and document the PVGIS version/dataset; call from backend and cache results |
| Required | **Device GPS** | Check-in/out location, geofence warning, photo location metadata | Native mobile location permissions; store latitude, longitude, accuracy, timestamp, and permission state |
| Required | **Amazon S3** | Private photo/video storage and generated proposal PDFs | AWS account, private bucket, IAM role, encryption, lifecycle policy, server-generated presigned upload/download URLs |
| Required | **Supabase Auth** | User authentication, sessions, passwordless login, and identity management | Supabase project, project URL, publishable/anon key, server-side secret, configured email authentication method, redirect URLs |
| Required | **Resend** | All system notifications, proposal delivery, approval updates, customer responses, and login emails | Resend account, verified sending domain, API key, sender address, SPF/DKIM/DMARC DNS records, webhook signing secret |

### Do not add these yet

- Push notifications: not required; all notifications are delivered by email.
- WhatsApp API: not required; proposals and customer communication use email.
- SMS/OTP provider: not required; Supabase Auth manages authentication emails.
- Weather API: not necessary for the deterministic MVP calculation engine.
- Government subsidy API: no dependency should be assumed; maintain admin-managed, effective-dated rules instead.
- Payment API: payments are not in the current specification.
- Separate analytics platform: add only after product metrics and privacy requirements are defined.
- AI API: optional future enhancement, not required for the core workflow.

## 6. API Rules and Constraints

### Maps and navigation

- Use Places autocomplete for customer address entry.
- Store the selected place ID, normalized address, latitude, longitude, city, state, and PIN code.
- Use reverse geocoding only to enrich or verify coordinates; do not overwrite user-confirmed addresses silently.
- Navigation can use a Google Maps URL/deep link; the app does not need to build turn-by-turn navigation.
- Keep API keys restricted by application, domain, package, and API wherever possible.

### Solar data

- Use PVGIS from a backend endpoint, never expose provider logic directly in the client.
- Cache by coordinate, date/model, and system parameters to reduce repeated calls.
- Store the source dataset, API version, request parameters, response timestamp, and calculation version with each calculation.
- Keep manual/admin PSH fallback data for outages and historical reproducibility.
- Do not silently replace proposal values with weather forecasts.

### GPS

- GPS is supplied by the device, not by Google Maps.
- Store check-in and check-out coordinates, accuracy, timestamp, and distance from the lead location.
- Default geofence is 200 meters, configurable by company policy.
- A failed geofence should warn and require a reason; it should not erase or block legitimate offline work.
- Request location only during an active visit unless continuous tracking is explicitly approved.

### Media storage

- Keep S3 private. The browser/mobile app receives only short-lived presigned URLs.
- Validate file type, size, image dimensions, ownership, and assessment association on the server.
- Store GPS/timestamp metadata separately from the binary file.
- Generate thumbnails for dashboard viewing and retain originals according to company policy.
- Never place permanent S3 credentials in the mobile or browser client.

### Email notifications and delivery

- Store notification intent and delivery status in the database.
- Email delivery through Resend must be retryable and idempotent.
- Use separate email templates for lead assignments, visit completion, proposal approval, proposal delivery, customer responses, and operational alerts.
- Store provider message IDs, delivery status, bounce status, complaint status, and timestamps.
- Verify Resend webhook signatures and record provider event IDs to prevent duplicate processing.
- The in-app notification center may show email events, but email is the only outbound notification channel.

## 7. Required Environment Variables

Values belong in the deployment secret manager, never in Git.

```text
DATABASE_URL

GOOGLE_MAPS_SERVER_API_KEY
NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY

AWS_REGION
AWS_S3_BUCKET
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY

NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SECRET_KEY

RESEND_API_KEY
RESEND_FROM_EMAIL
RESEND_WEBHOOK_SECRET
```

Only define provider-specific variables for the selected provider. Prefer workload identity/IAM roles over long-lived AWS keys in production.

## 8. Data and Architecture Requirements

### Production data model additions

The current schema covers leads, assessments, obstructions, and calculations. Add these before production:

- `Company`
- `User`
- `Role`/permission mapping or a documented RBAC policy
- `VisitEvent` / audit log
- `SitePhoto` and optional `SiteVideo`
- `SyncOperation` or equivalent idempotency record
- `PriceConfig` with effective dates and version history
- `SubsidyRule` with state, eligibility, source, effective dates, and approval history
- `Proposal` and proposal versions
- `Notification` and Resend delivery events
- `CustomerAccessToken` or equivalent revocable proposal link
- Consent records for location, media, email communication, and proposal sharing

### Calculation integrity

Each calculation must save:

- Input values and units
- Formula version
- PSH/PVGIS dataset and retrieval timestamp
- Orientation, shading, dust, temperature, and cable/inverter assumptions
- Price configuration version
- Subsidy rule version
- User who generated it

Approved proposals must be immutable. Recalculation creates a new calculation and proposal version.

### Offline-first behavior

- Save every form step locally before attempting sync.
- Assign client IDs and idempotency keys to offline writes.
- Queue media uploads independently from form synchronization.
- Retry with exponential backoff.
- Define field-level conflict rules; never use blind last-write-wins for approvals, status changes, or pricing.
- Show sync state clearly: saved locally, syncing, synced, or needs attention.

## 9. Security and Compliance Baseline

- Enforce authorization on server actions and API routes.
- Scope every query by company and authorized user role.
- Delegate authentication and passwordless email flows to Supabase Auth; never store raw authentication tokens.
- Encrypt database backups and object storage.
- Use HTTPS for the app, customer links, and webhooks.
- Rate-limit authentication requests, file uploads, public proposal links, and webhook endpoints.
- Record audit events for role changes, exports, proposal approvals, price changes, subsidy changes, and customer responses.
- Obtain consent before storing customer photos, GPS data, and sending customer emails.
- Define retention and deletion policies before launch.

## 10. Delivery Plan

### Phase 1 — Production foundation

- [x] Move from SQLite to Postgres.
- [x] Add company, user, Supabase Auth integration, and RBAC.
- [ ] Add server-side validation and audit events (audit log model/logging for login exists; not yet extended to leads/assessments/calculations).
- [x] Preserve the current lead and assessment workflow.
- [x] CI/CD pipeline (`.github/workflows/`, `DEPLOYMENT.md`).

**Exit condition:** authorized users can create, assign, and view tenant-scoped leads.
`companyId` tenant scoping is still outstanding — see §2 "Explicitly missing."

### Phase 2 — Field visit reliability

- Add real mobile shell or mobile client.
- Add device GPS and geofence check-in/out.
- Add local drafts and sync queue.
- Add required photo capture and S3 upload.

**Exit condition:** a visit can be completed with poor connectivity and safely synchronized later.

### Phase 3 — Accurate calculation service

- Add backend PVGIS adapter and cache.
- Store calculation inputs, source metadata, and formula version.
- Add admin-managed pricing and subsidy rules.
- Add automated calculation tests and review fixtures.

**Exit condition:** the same saved inputs reproduce the same calculation.

### Phase 4 — Proposal and approval

- Add branded server-side PDF generation.
- Add private proposal storage and revocable customer links.
- Add manager approval/rejection/change-request workflow.
- Add proposal versioning.

**Exit condition:** only approved proposal versions can be sent to customers.

### Phase 5 — Notifications and launch readiness

- Add Resend email delivery with status tracking.
- Add Supabase Auth email authentication and session handling.
- Add an email-backed notification center.
- Add backups, monitoring, rate limits, load tests, and deployment runbook.

**Exit condition:** critical workflow events are observable and recoverable.

## 11. Acceptance Criteria

### Lead and visit

- Manager creates a lead with normalized address and coordinates.
- Manager assigns a lead to an active field executive.
- Executive opens the assigned lead and starts a visit.
- Check-in/out stores coordinates, accuracy, timestamps, and geofence result.
- Required visit sections cannot be marked complete with invalid or missing values.

### Photos and offline behavior

- Four-direction roof photos are required before assessment completion.
- Photos can be captured offline and queued for upload.
- Duplicate retries do not create duplicate media records.
- Dashboard users can view only media authorized for their company and role.

### Calculation and proposal

- Calculation output shows its assumptions and source dataset.
- Admin changes to price/subsidy rules are versioned and auditable.
- A proposal stores the exact calculation version used to generate it.
- Customer links can be revoked and expire.
- Customer responses update the lead only through validated server transitions.

## 12. Local Development

From `helios_engineering_system/`:

```bash
docker compose up -d postgres
npm install
npm run migrate:dev
npm run db:seed
npm run dev
```

Open `http://localhost:3000`. See `DEPLOYMENT.md` for CI/CD and how staging/production deploys work.

## 13. Reference Documentation

- [Google Maps Platform](https://developers.google.com/maps/documentation)
- [PVGIS API](https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis/using-pvgis-5/api-non-interactive-service_en)
- [Amazon S3 presigned uploads](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Resend documentation](https://resend.com/docs)
- [OpenWeather documentation is intentionally not required for MVP](https://openweathermap.org/api/current)

## 14. Decisions Needed Before Production Implementation

1. Is the first release single-company or multi-tenant?
2. Which states, DISCOMs, languages, and customer segments are in scope?
3. Which Supabase organization/project and deployment environments will be used?
4. Which verified Resend sending domain and sender address will be used?
5. Which email templates and customer consent wording are required?
6. Is the customer portal required in the first release?
7. What are the retention and consent rules for photos, GPS, and proposals?
8. Who is authorized to edit prices, subsidy rules, and approved proposals?
9. What are the expected user, lead, media, and concurrent-device volumes?
10. Which PVGIS dataset/model and engineering review process will govern commercial estimates?

**Next implementation step:** decide the provider choices in Question 3–5, then implement authentication/RBAC and the production lead-to-visit vertical slice before adding proposal delivery.
