# Storefront and administration

This branch is a standard Next.js App Router deployment target for Vercel. It preserves the supplied photographs, Chakra UI v3 design, TypeScript models, product catalogue, furnishing packs, enquiries, stock reservations and Stripe webhook behaviour. Node.js 24 and npm are required. Exact resolved dependencies are recorded in package-lock.json.

The currently published Site remains on its existing runtime and uses the same Neon database. Its existing ChatGPT authentication remains in place. This branch has not been deployed to Vercel: the connected Vercel account currently rejects team access with HTTP 403.

## Implemented and verified

- Standard Next.js scripts and Vercel configuration, without the Cloudflare/Vinext build adapter.
- Neon HTTP queries for commerce and a bounded Neon serverless connection pool for authentication.
- Better Auth sessions with HTTP-only cookies, database-backed sign-in limits, disabled public registration and a server-side administrator allowlist. Browser-supplied platform identity headers are ignored.
- Product and settings version checks, database stock reservations, server-owned prices, checkout request idempotency and signed Stripe webhook verification.
- Private Vercel Blob uploads with verified JPEG/PNG/WebP signatures. Uploads are capped at 4 MB to fit Vercel's request limit. Product image URLs remain /api/media/<key>, so no storage credentials reach browsers.
- Shared basket state across mounted components and browser tabs; overlapping catalogue and administration refreshes are cancelled to prevent stale responses replacing newer state.
- Atomic, serialized database migrations with existing edits preserved. Authentication tables are generated from the installed Better Auth version rather than an assumed schema.

Verification commands:

```sh
npm ci
npm run typecheck
npm test
npm run build
```

Tests exercise real PostgreSQL semantics through PGlite. They cover stock reservations, replayed or reordered payment events, transactional rollback, schema migrations, administrator sign-in/sign-out, tampered sessions, cross-origin requests, shared sign-in limits and media validation. PGlite does not replace a multi-connection Neon load test. Live Stripe/Mapbox calls and Blob uploads have not been verified without those services' credentials.

## Configuration

Use the hosting secret editor. Never commit real values or expose them through NEXT_PUBLIC_ variables.

| Key                   | Purpose                                                                                                                                                    |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DATABASE_URL          | Existing Neon pooled PostgreSQL connection. Required for shared data.                                                                                      |
| ADMIN_EMAILS          | Comma-separated administrator email allowlist.                                                                                                             |
| BETTER_AUTH_SECRET    | Random secret of at least 32 characters for standalone authentication.                                                                                     |
| BETTER_AUTH_URL       | Canonical HTTPS origin for standalone authentication; exact local origin during development. Preview deployments can use Vercel's injected deployment URL. |
| BLOB_STORE_ID         | Private Vercel Blob store connected to the deployed project using OIDC.                                                                                    |
| BLOB_READ_WRITE_TOKEN | Optional alternative to Blob OIDC authentication for local development or an existing store.                                                               |
| STRIPE_SECRET_KEY     | Stripe server key; start with test mode.                                                                                                                   |
| STRIPE_WEBHOOK_SECRET | Secret for the deployed /api/stripe/webhook endpoint.                                                                                                      |
| MAPBOX_ACCESS_TOKEN   | Server token for Geocoding v6 and Static Images.                                                                                                           |

Vercel's VERCEL_URL, VERCEL_PROJECT_PRODUCTION_URL, VERCEL_ENV and VERCEL_OIDC_TOKEN are platform-provided variables. They are not fabricated application credentials.

Missing payment or mapping keys are reported as unavailable. Unknown product prices and quantities remain unknown. A quotation can be saved without enabling checkout. No claims of a completed payment, delivered message or connected service are shown when the operation did not happen.

The database migration runner is npm run db:migrate. It applies checked-in migrations and the supplied portfolio in one transaction, preserving existing data. It must run against a verified connection before a production release; the build never creates tables.

## Administrator access

The published Site uses its existing authenticated account and ADMIN_EMAILS. Standalone Vercel authentication is a separate security boundary and fails closed when unconfigured. No standalone administrator account was created: automatic approval review rejected that access-control change. The included provisioning utility requires explicit account details, preserves existing accounts and is never invoked by installation, build or deployment.

## Image cutover

The published Site currently uses its existing image bucket. This Vercel target uses private Blob. The supplied static photographs are included in both builds. Before changing the public URL or iOS endpoint, copy any subsequently uploaded images to the Blob media/<key> paths, retaining the /api/media/<key> metadata URLs in Neon. Do not switch an active site before that copy is verified.

## iOS

The SwiftUI source in ios/ continues to open the existing protected administration URL, which now uses the shared Neon database. It is not a signed application. Building, device-testing, signing and TestFlight distribution require macOS, Xcode and the owner's Apple Developer account. Change WorkspaceURL only after a replacement deployment is verified.

## Operational limits

- The Vercel deployment is blocked by team authorization; there is no Vercel deployment URL to report.
- Stripe, Mapbox and Vercel Blob require real service configuration before live acceptance tests.
- Checkout reservations rely on signed Stripe completion/expiration events. An unresolved provider/network failure must be reconciled before its reservation is released; no guessed release is performed.
- The site remains noindex during private review. Final trading information, policies, public domain and access settings require a deliberate launch decision.
- The secure configuration runner accepts a documented environment object through hidden terminal stdin, redacts credentials from child output and does not write secrets to disk.
