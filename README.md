# Japan Economic Security Globe

Japan Economic Security Globe is a public-interest semantic web MVP for explaining Japan's strategic dependencies through an interactive globe, a domestic Japan impact map, and a source-linked evidence graph.

The launch view is Energy-led because the April 2026 attention wave is around oil, LNG, sea lanes, electricity, and logistics. Rice, Water, Defense, and Semiconductors are already modeled as the next layers so the project does not become a one-news-cycle dashboard.

## Product Concept

Main question:

> What does Japan depend on, and where does that dependency land in daily life, public spending, and domestic infrastructure?

The UI is intentionally split into three layers:

- `Globe`: global dependency stories, including crude oil, LNG, coal, semiconductors, supplier countries, routes, and maritime chokepoints.
- `Japan map`: domestic impact stories, including rice, water, reservoir stress, ports, LNG receiving terminals, refineries, and prefectures.
- `Evidence graph`: policy, budget, law, organization, source document, and provenance relationships.

The project is Japan-centered. Foreign countries are shown only when they explain a relationship that matters for people in Japan.

## Why Semantic Web Matters

The goal is not just to draw a beautiful map. The product is designed as a knowledge-graph-first system that can later map to OWL, RDF, SHACL, and SPARQL without rewriting the product ontology.

The current MVP already separates:

- `types/semantic.ts`: canonical entity, flow, observation, source, and graph-edge model.
- `data/seed/`: local seeded JSON with provenance fields aligned to `prov:wasDerivedFrom`.
- `ontology/`: initial Turtle stubs for the OWL/RDF model.
- `queries/`: example SPARQL files for the five public stories.
- `lib/semantic/`: selectors, view models, provenance helpers, and SPARQL preview generation.

Every visible detail panel includes source documents, related entities, and a future-facing SPARQL preview block.

## MVP Scope

The MVP includes one thin but complete slice for each theme:

- `Energy`: crude oil, LNG, coal, Gulf routes, Hormuz, Malacca, Yokohama Port, Sodegaura LNG Terminal, and Keihin refinery area.
- `Rice`: rice price pressure, stockpile and policy signal, and the bridge from energy and fertilizer inputs into household food exposure.
- `Water`: Tokyo and Ogouchi Reservoir as a reservoir-stress example.
- `Defense`: FY2026 defense budget flow into stand-off capability.
- `Semiconductors`: Japan linked to Taiwan, South Korea, Netherlands, United States, and China through advanced semiconductor dependency flows.

Logistics scope for Phase 0 is `ports and receiving infrastructure`: maritime chokepoints, import routes, Japanese ports, LNG receiving terminals, and refineries. Domestic trucking, warehousing, and retail distribution are intentionally left for later.

## Roadmap

`Phase 0`: Public MVP

- Free public site.
- No auth.
- No database.
- Local seeded JSON and Turtle artifacts.
- Cloudflare-only deployment target.
- Japan-centered dependency intelligence for citizens.

`Phase 1`: Strategic neighborhood layer

- Still Japan-centered and still public.
- Add geopolitical-neighbor relationships only when they explain Japan's exposure.
- Add richer route, port, facility, and source-document coverage.
- Begin repeatable ingestion jobs and validation.

`Phase 2`: Institutional intelligence product

- Paid workspaces for media, think tanks, policy teams, risk teams, and business strategy teams.
- Alerts on route, resource, policy, budget, and source changes.
- Private scenario notebooks and saved graph views.
- API/data access for dependency graph slices.
- Internal data integration and custom ontology mapping.
- Advisory/implementation packages for OWL/RDF/SPARQL/SHACL adoption.

If Palantir were approaching this, the durable value would not be the public globe alone. It would be the semantic operating layer that lets an institution connect public evidence, private data, alerts, scenarios, and decision workflows. This MVP keeps that option open without turning Phase 0 into enterprise software too early.

## Local Setup

```bash
npm install
npm run dev
```

Run tests and production build:

```bash
npm test
npm run build
```

The app runs without external environment variables.

## Repository Structure

```text
app/                    Next.js App Router entry points
components/             Globe, Japan map, evidence drawer, and app shell
data/seed/              Local semantic seed data for Phase 0
docs/superpowers/       Product design, roadmap, and implementation plan notes
lib/data/               Seed graph loader
lib/semantic/           Selectors, detail view, provenance, SPARQL, and view models
ontology/               Initial Turtle ontology stubs
queries/                Example SPARQL query files
types/                  Semantic and presentation TypeScript types
```

## Data and Provenance

This is a manual seed-data MVP. It is not yet a real-time public data feed and should not be treated as operational intelligence.

Every seeded entity, flow, and observation must keep source references. The long-term target is to convert these source references into RDF triples using `prov:wasDerivedFrom`, then validate them with SHACL and serve them through a SPARQL endpoint.

## Public-Interest Caveat

This project is designed to help people in Japan understand dependency exposure, public evidence, and domestic impact. It should avoid becoming a military targeting UI, a fear dashboard, or a generic country-profile explorer. The product subject is Japan and the Japanese public.
