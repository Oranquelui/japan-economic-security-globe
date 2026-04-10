# App Design

**Project:** `japan-economic-security-globe`  
**Date:** 2026-04-10  
**Status:** App design draft before implementation planning

## 0. 2026-04-10 UI Decision Update

The front end is **Japan-first**, not globe-first.

The reference direction is Palantir-style operations mapping in information structure, not in color:

- left: signal inbox, theme filters, operational scope
- center top: Japan operations map as the main canvas
- center lower: signal/event table for routes, observations, domestic landing points
- right: evidence drawer with graph, sources, related entities, and SPARQL preview
- global layer: supporting inset map and evidence graph only; it explains foreign suppliers and chokepoints as relationships to Japan

The service region is Japan. Foreign countries are not user-service regions; they are explanatory nodes for Japan's dependency intelligence.

The first screen should answer:

> 日本は何に依存していて、その揺れは日本国内のどこに着地するのか。

The globe-style view should not dominate the first screen until it can show readable geography. For Phase 0, a small global route inset is safer than a large 3D globe with weak map legibility.

## 1. App Purpose

The app is a public-interest semantic intelligence interface for people in Japan.

It should help a user answer:

> What is Japan dependent on, and how do those dependencies flow back into rice, water, electricity, daily life, and defense?

The app must feel like a serious semantic-web and public-interest data product, not a generic analytics dashboard.

## 2. Phase 0 Experience

Phase 0 is a free public MVP.

The first screen should launch with the `Energy` story because the April 2026 attention wave is about energy, chokepoints, oil, LNG, and electricity costs.

The story path should be:

1. energy shock or route risk shown as a global-to-Japan relationship
2. Japanese port / terminal / refinery exposure on the main Japan map
3. domestic household or policy impact
4. operations table row for the selected signal
5. evidence graph and source documents
6. bridge to Rice, Water, Defense, or Semiconductors

The default hero copy:

> 原油・LNG・海上輸送路の揺れは、日本のどこに着地するのか。

Secondary copy:

> 日本地図を主画面にして、国際供給元・政策文書・出典をセマンティックグラフで確認する。

## 3. Visual Direction

Tone:

- public knowledge atlas: 70
- intelligence room: 30

The app should borrow:

- the dark globe gravity of Harvard's Globe of Economic Complexity
- the cinematic urgency of spatial intelligence explainers
- the evidence density of a knowledge graph browser

The app should avoid:

- generic SaaS cards
- bright dashboard styling
- military target-selection aesthetics
- vague "AI insight" language

## 4. Layout

### 4.1 Shell

Desktop layout:

- left vertical theme rail
- central Japan operations map
- right evidence drawer
- bottom operations signal table
- floating selected-entity inspector

Mobile layout:

- top story selector
- Japan operations map hero
- collapsible evidence drawer
- horizontal theme chips
- operations signal table below the map

### 4.2 Left Theme Rail

Order:

1. Energy
2. Rice
3. Water
4. Defense
5. Semiconductors

Each theme should show:

- short label
- color marker
- active story count
- current selected story headline

### 4.3 Japan Operations Map

Responsibilities:

- show Japan as the fixed semantic anchor
- show where supplier-country dependency lands in Japan
- show ports, LNG terminals, refineries, reservoirs, prefectures, and budget landing points
- show sea lanes and chokepoints as inbound routes to Japan
- show a small global context inset only as a supporting layer

Interactions:

- click domestic landing point
- click route
- click chokepoint
- click flow arc
- click signal row
- selected object opens detail inspector and evidence drawer

### 4.4 Global Supporting Layer

Responsibilities:

- show supplier countries
- show dependency arcs to Japan
- show chokepoints and sea lanes as explanatory context
- avoid becoming the main user-service map

The global layer should be an inset or secondary view in Phase 0. A large 3D globe can return later only if the map geography is visually legible.

### 4.5 Operations Signal Table

Responsibilities:

- show routes, observations, and domestic landing points in an operational list
- support fast triage by type, urgency, status, action, and period
- make the product feel like an intelligence workflow, not a static dashboard

This should not become a full domestic logistics product in Phase 0.

### 4.6 Evidence Drawer

Responsibilities:

- explain selected entity or flow
- show why it matters for people in Japan
- show source documents
- show related entities
- show SPARQL preview

Sections:

- Summary
- Why this matters in Japan
- Linked flows
- Evidence
- Related entities
- SPARQL preview

### 4.7 Evidence Graph Panel

Responsibilities:

- show source-linked graph around selected story
- connect policy documents, budget lines, laws, organizations, facilities, products, and observations

The graph should be visible enough to prove semantic-web depth, but not dominate the first 10 seconds.

## 5. Interaction Model

### 5.1 Theme switching

Switching theme should change:

- active Japan operations map objects
- active global route inset arcs
- active operations table rows
- active evidence graph neighborhood
- hero headline
- color accents
- SPARQL preview

It should not change the underlying data model.

### 5.2 Selection model

Selectable objects:

- `Country`
- `DependencyFlow`
- `Route`
- `Chokepoint`
- `Port`
- `Terminal`
- `Refinery`
- `Reservoir`
- `Prefecture`
- `PolicyDocument`
- `BudgetLine`
- `Observation`
- `SourceDocument`

Every selected object should have a normalized `DetailViewModel`.

### 5.3 Detail window for foreign countries

Foreign countries are explanatory variables, not service regions.

When selected, a country detail window should show:

- flag
- small map or geographic cue
- relation to Japan
- active flows to Japan
- key sources
- related themes

It should not become a general country profile.

## 6. Semantic Data Flow

The app should use one canonical semantic graph and derive views from it.

Data pipeline for Phase 0:

1. load seeded JSON/TTL
2. normalize into canonical entities and edges
3. derive theme views
4. derive global-to-Japan flows
5. derive Japan operations map data
6. derive evidence graph nodes and links
7. derive SPARQL preview text

Do not hard-code separate mini datasets per component.

## 7. Frontend Data Modules

Recommended modules:

- `types/semantic.ts`
- `types/presentation.ts`
- `lib/semantic/graph.ts`
- `lib/semantic/selectors.ts`
- `lib/semantic/sparql-preview.ts`
- `lib/semantic/provenance.ts`
- `lib/data/seed-loader.ts`
- `data/seed/entities.json`
- `data/seed/flows.json`
- `data/seed/observations.json`
- `data/seed/sources.json`

## 8. Components

Recommended component boundaries:

- `AppShell`
- `ThemeRail`
- `JapanMainMap`
- `GlobalRouteInset`
- `OperationsSignalTable`
- `EvidenceDrawer`
- `EvidenceGraph`
- `SparqlPreview`
- `SourceList`
- `RelatedEntities`
- `DetailWindow`
- `StoryHeader`

Each component should receive view models rather than raw seed data.

## 9. Visual System

Theme colors should be restrained and high contrast:

- Energy: amber / flare orange
- Rice: warm grain gold
- Water: cyan / deep blue
- Defense: muted red / signal crimson
- Semiconductors: electric teal

Background:

- near-black navy
- subtle radial glow around Japan
- fine grid/noise texture
- restrained bloom effects

Typography:

- use a distinctive but sober display face if available
- use a highly readable body face
- avoid default SaaS typography

Motion:

- one strong initial reveal
- route arc shimmer
- evidence drawer slide
- subtle graph node pulse
- no excessive micro-animation

## 10. Phase 2 Design Hooks

The app should visually prepare for future paid features without implementing auth in Phase 0.

Allowed Phase 0 hints:

- "Monitor this dependency" disabled or labeled as future
- "Save query" disabled or labeled as future
- "Export graph" disabled or labeled as future
- "Workspace overlay" shown as roadmap copy, not a real private feature

Do not implement:

- authentication
- billing
- private workspaces
- real alerts
- private data upload

This keeps Phase 0 focused while preserving product direction.

## 11. Technical Architecture

Phase 0 recommended stack:

- Next.js App Router
- TypeScript
- Tailwind CSS
- React Three Fiber or Three.js for globe
- SVG or lightweight D3 for Japan map
- react-force-graph or similar graph component
- local seeded JSON/TTL
- Cloudflare-only deployment path

Hosting:

- Cloudflare Workers for the app runtime
- repo data first
- R2 optional for public datasets later
- D1 optional only for lightweight metadata later

Do not add RDS in Phase 0.

## 12. App Success Criteria

A visitor should understand within 10 seconds:

- this is about Japan
- the main map exists to explain domestic impact in Japan
- the global inset and graph explain Japan's external dependencies
- the graph exists to show evidence and source relationships

A reviewer should understand within 2 minutes:

- this is not a generic dashboard
- the ontology design is intentional
- source provenance is built in
- the app is ready to evolve toward OWL/RDF/SPARQL

## 13. Implementation Boundary

The first implementation should build one polished end-to-end vertical slice across all five themes.

It should not try to:

- fully model all Japanese logistics
- ingest live data
- implement auth
- implement paid features
- implement a real SPARQL server

It should implement:

- working homepage
- theme switching
- clickable Japan operations map
- global route inset
- operations signal table
- evidence graph section
- seeded semantic data
- ontology stubs
- SPARQL query examples
- README

## 14. Next Step

After this app design is approved, create an implementation plan with tasks for:

1. scaffold Next.js app
2. define semantic TypeScript types
3. create seed data and ontology files
4. build visual shell
5. wire theme switching
6. implement Japan operations map interactions
7. implement global route inset
8. implement evidence graph and drawer
9. add README and public project framing
10. verify build and local app
