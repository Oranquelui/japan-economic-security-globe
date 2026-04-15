# Cloudflare Phase 0 Deployment Note

Phase 0 should stay Cloudflare-only and avoid RDS or any external managed relational database.

## Recommended Phase 0 Shape

- Next.js app deployed to Cloudflare Workers via the OpenNext adapter.
- Local `data/seed/*.json` bundled at build time.
- Turtle and SPARQL examples shipped as repository artifacts.
- No authentication.
- No private user data.
- No server-side database dependency.

This keeps the public launch cheap, easy to fork, and easy to verify, while still leaving room for server-side source fetches and secret-backed adapters.

## Operating Rule

The current deployment and operations model is only for the pre-monetization period.

- GitHub public repository as the main source of truth
- `main` branch push and GitHub Actions deployment for the public site
- single public hostname for the civic product
- no separation between public delivery runtime and institutional runtime

This is the correct shape for Phase 0 and Phase 1 because the product is still proving public framing, ontology quality, provenance discipline, and attention.

Once monetization starts in Phase 2, this should be re-evaluated. At that point the architecture should likely split into:

- public civic site
- institutional/private product runtime
- separate data refresh and customer-specific operational layers

## Initial Production Host

- `economic-security.quadrillionaaa.com`

This hostname should be attached as a Workers custom domain. Cloudflare's custom domains require an active Cloudflare zone, so the domain needs to be managed from Cloudflare DNS if this route is used directly.

## Primary Deploy Path

The normal production path is:

- commit to `main`
- push to GitHub
- GitHub Actions `CI` workflow runs `verify` and then `deploy`

This is the intended day-to-day operating model.

## Manual Fallback Deploy

The manual production deploy entrypoint is:

```bash
npm run deploy
```

This runs `opennextjs-cloudflare build && opennextjs-cloudflare deploy`.

Use this only when GitHub Actions is unavailable or needs a one-off fallback.

## Required Cloudflare Auth Shape

Local or CI fallback deploys should use `CLOUDFLARE_API_TOKEN`, and preferably `CLOUDFLARE_ACCOUNT_ID`, instead of interactive login.

The token should be a **user token** with at least:

- User: `User Details (read)`
- User: `Memberships (read)`
- Account: `Account Settings (read)`
- Account: `Workers Scripts (edit)`
- Zone: `Workers Routes (edit)`

If `wrangler whoami` works but deploy fails against `/memberships` or `/workers/services/...`, treat that as an auth-scope problem first, not as an app build problem.

## What Is Defined In Repo vs Cloudflare

Inside this repository:

- `.github/workflows/ci.yml` verifies lint, test, build, and deploy on pushes to `main`
- `wrangler.jsonc` defines the Worker and custom domain
- `npm run deploy` exists as a manual fallback

Outside this repository:

- Cloudflare account secrets and route configuration decide whether deploy succeeds
- the Worker custom domain still lives in Cloudflare dashboard configuration

So `commit & push = deploy` is a valid operating rule only if the repository secrets remain set and the workflow stays enabled.

## Why Not RDS Yet

RDS is the wrong default for this phase because the main uncertainty is not transactional persistence. The main uncertainty is whether the public framing, semantic model, source provenance, and visual interface earn attention.

The first durable backend should probably be a graph/data layer, not a generic app database.

## Later Cloudflare Additions

- `R2`: store source snapshots, generated TTL files, and ingestion artifacts.
- `D1`: store lightweight ingestion metadata, source refresh state, and public app settings.
- `Workers`: run scheduled source checks, source adapters, and publish refreshed graph artifacts.
- `Queues`: decouple ingestion from validation if refresh volume grows.

## Later Graph Endpoint

Once the ontology and public audience are validated, add a real SPARQL endpoint using a graph store such as RDF4J, GraphDB, Oxigraph, Apache Jena Fuseki, or another dedicated RDF store.

The endpoint should be introduced only after the seed model has stabilized enough to avoid a premature schema migration.
