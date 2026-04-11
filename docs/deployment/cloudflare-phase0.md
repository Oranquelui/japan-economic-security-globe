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

## Initial Production Host

- `economic-security.quadrillionaaa.com`

This hostname should be attached as a Workers custom domain. Cloudflare's custom domains require an active Cloudflare zone, so the domain needs to be managed from Cloudflare DNS if this route is used directly.

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
