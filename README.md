# Japan Economic Security Globe

English | [日本語](README.ja.md)

Japan Economic Security Globe is a public-interest semantic web MVP that explains Japan's strategic dependencies through a Japan-first operations map, a global supporting layer, an evidence graph, and an operations table.

The default view starts with `Energy`. As of April 2026, oil, LNG, sea lanes, electricity costs, and logistics are still the most intuitive public entry point. This project is not meant to end as a one-off news visualization, though. `Rice`, `Water`, `Defense`, and `Semiconductors` are already modeled on the same ontology.

## Core Question

> What does Japan depend on, and where do those dependencies land in everyday life, public spending, and domestic infrastructure?

The app answers that question through four layers:

- `Japan operations map`: shows ports, LNG terminals, refineries, reservoirs, prefectures, and other domestic landing points.
- `Global supporting layer`: shows supplier countries, sea routes, chokepoints, and external context only insofar as they explain impact on Japan.
- `Evidence graph`: connects policy, budgets, laws, organizations, and source documents.
- `Operations table`: lists routes, signals, and domestic landing points in an operational reading order.

The grammatical subject of this project is Japan. Foreign countries are shown only to explain effects on people, infrastructure, and policy in Japan. This is not a generic country profile explorer.

## Why Semantic Web

The goal is not just to draw an attractive map. The goal is to structure Japan's dependencies, policy evidence, budgets, laws, and provenance in a way that can later migrate cleanly into OWL, RDF, SHACL, and SPARQL.

The current MVP already separates the main layers:

- `types/semantic.ts`: meaning model for countries, regions, resources, products, flows, observations, sources, and graph edges.
- `data/seed/`: Phase 0 seed JSON with provenance fields designed to map cleanly into `prov:wasDerivedFrom`.
- `ontology/`: initial Turtle files for the ontology shape.
- `queries/`: SPARQL examples for the five public stories.
- `lib/semantic/`: selectors, detail views, provenance helpers, SPARQL previews, and presentation view models.

Each detail panel is designed to show a summary, why it matters in Japan, source documents, related entities, and a future SPARQL preview.

## MVP Scope

The MVP includes a thin but coherent slice for each theme:

- `Energy`: crude oil, LNG, coal, Gulf routes, the Strait of Hormuz, the Strait of Malacca, Yokohama Port, the Sodegaura LNG terminal, and the Keihin refinery area.
- `Rice`: rice price pressure, reserve and policy signals, and how energy or fertilizer inputs can translate into household food burden.
- `Water`: a water-stress example centered on Tokyo and the Ogochi Reservoir.
- `Defense`: a budget-flow example from FY2026 defense spending into stand-off defense capability.
- `Semiconductors`: advanced semiconductor dependency flows linking Taiwan, South Korea, the Netherlands, the United States, China, and Japan.

For Phase 0, logistics granularity stops at ports and receiving terminals. The public model covers sea chokepoints, import routes, Japanese ports, LNG receiving terminals, and refineries. Domestic trucking, warehousing, and retail distribution are deferred.

## Roadmap

`Phase 0`: public MVP

- free public site
- no authentication
- no database
- local seed JSON and Turtle artifacts
- Cloudflare-first operating model
- public positioning as Japan-focused dependency intelligence

`Phase 1`: geopolitical neighbor layer

- Japan and people in Japan remain the primary frame
- expand neighboring-country context only where it helps explain Japanese impact
- widen routes, ports, facilities, and source-document coverage
- begin repeatable ingestion and validation

`Phase 2`: institutional intelligence product

- paid workspace for media, think tanks, policy teams, risk teams, and strategy teams
- alerts for routes, resources, policy, budget, and source updates
- private scenario notebooks and saved graph views
- API or data access to slices of the dependency graph
- internal data integration and custom ontology mapping
- OWL, RDF, SPARQL, and SHACL enablement packages

The long-term value is not the public map by itself. The long-term value is a semantic operating layer that connects public data, private data, source evidence, alerts, scenarios, and decision flows. The Phase 0 MVP intentionally keeps that future shape possible without prematurely turning the public product into an enterprise tool.

## Local Development

```bash
npm install
npm run dev
```

Tests and production build:

```bash
npm test
npm run build
```

Preview against the Cloudflare Workers-like environment:

```bash
npm run preview
```

Manual deploy to Cloudflare Workers:

```bash
npm run deploy
```

That command is only a manual fallback. The intended production path is commit and push to `main`, then let GitHub Actions run the deploy job.

Manual Cloudflare deploy assumes `CLOUDFLARE_API_TOKEN` is a user token with at least:

- User: `User Details (read)`
- User: `Memberships (read)`
- Account: `Account Settings (read)`
- Account: `Workers Scripts (edit)`
- Zone: `Workers Routes (edit)`

For CI or non-interactive local deploys, pass `CLOUDFLARE_ACCOUNT_ID` as needed.

The UI itself runs without external environment variables. If you later switch to live `e-Stat API` access, add the following to `.env.local`:

```bash
ESTAT_APP_ID=your-estat-app-id
```

You can obtain `appId` after registering at [e-Stat](https://www.e-stat.go.jp/). For local development, `http://localhost/` is sufficient as the registered URL.

## Cloudflare Workers Deployment

Phase 0 assumes `Cloudflare Workers + OpenNext adapter`.
The intended production hostname is `economic-security.quadrillionaaa.com`.

- Worker runtime: Cloudflare Workers
- adapter: `@opennextjs/cloudflare`
- config: [`wrangler.jsonc`](wrangler.jsonc)
- OpenNext: [`open-next.config.ts`](open-next.config.ts)

## Current Deploy Shape

The current production update path is:

- GitHub `main` as the source of truth
- commit and push to `main`
- GitHub Actions `CI` runs `verify -> deploy`
- production host: `economic-security.quadrillionaaa.com`

In normal operation, `commit & push = deploy`.

`npm run deploy` should be treated only as a manual fallback when GitHub Actions is unavailable.

Notes:

- Cloudflare Workers custom domains require an active Cloudflare zone.
- If `quadrillionaaa.com` stays authoritative in Route53, Pages may be simpler than Workers custom domains.
- Workers are currently preferred because future server-side fetches, secrets, and scheduled ingestion are expected.
- GitHub repository secrets should include `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
- If deploy fails against `/memberships` or `/workers/services/...`, treat token scope as the first suspect.
- Cloudflare dashboard Git integration is unnecessary if the repository workflow remains the source of truth.

This operating model is only for the public Phase 0 and Phase 1 period. Once the product reaches institutional or paid use in Phase 2, the public site and private runtime should be redesigned as separate systems.

## Sources, License, and Contact

On the public site, the upper-right menu exposes `Share`, `Sources/License`, and `Contact`.

`Sources/License` includes:

- source list
- usage policy
- rights-handling approach

`Contact` includes:

- development requests
- data corrections or additions
- bugs or errors
- interviews, citation, or collaboration
- other inquiries

Contact is handled through the public form and currently routes to `ai@quadrillion-ai.com`. A reply email address is required. Users are expected not to submit sensitive personal or confidential information.

## License and Source-Material Policy

Code is licensed under the repository root [`LICENSE`](LICENSE), currently `Apache-2.0`.

Source-linked data in `data/seed/` is not relicensed as a single corpus in the same way as the code. Government/public sources and private-sector sources are handled under different source-specific conditions. See [`DATA-SOURCES.md`](DATA-SOURCES.md) and the public `Sources/License` page for details.

## Directory Structure

```text
app/                    Next.js App Router entrypoints
components/             Japan map, supporting layers, operations table, evidence drawer, app shell
data/seed/              Phase 0 local semantic seed data
docs/                   Public deployment and source-registry documentation
lib/data/               seed graph loading
lib/semantic/           selectors, detail views, provenance, SPARQL, presentation models
ontology/               initial Turtle ontology stubs
queries/                SPARQL query examples
types/                  semantic and presentation types
```

## Data and Provenance

At this stage the project still uses manual seed data. It is not a real-time public-data delivery system, and it is not an operational intelligence system for live decisions.

That said, each entity, flow, and observation is already designed with source references. The long-term direction is to map those references into RDF triples with `prov:wasDerivedFrom`, validate them with SHACL, and expose them through a SPARQL endpoint.

## Public-Purpose Guardrails

This project is for helping people living in Japan understand dependencies, policy evidence, and domestic impact. It should not become a military target-selection UI, a fear dashboard, or a generic geopolitical explorer. Japan and people in Japan remain the primary subject.
