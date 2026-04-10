# Japan Economic Security Globe MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Phase 0 public MVP for `japan-economic-security-globe`: a Next.js semantic intelligence app with Energy-led globe, Japan impact map, evidence graph, seeded ontology data, Turtle stubs, SPARQL examples, and README.

**Architecture:** The app uses one canonical semantic graph from local seeded data, then derives theme views for globe arcs, Japan impact objects, evidence graph nodes, detail drawers, and SPARQL previews. Phase 0 remains Cloudflare-only friendly and avoids auth, RDS, paid features, live ingestion, or real SPARQL server.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, React Three Fiber/Three.js for the globe, lightweight SVG for Japan impact map, react-force-graph or D3-compatible view models for evidence graph, Vitest for semantic selectors, local JSON/TTL seed files.

---

## File Structure

- Create `package.json`: project scripts and dependencies.
- Create `next.config.ts`: Next.js config.
- Create `tsconfig.json`: TypeScript config.
- Create `tailwind.config.ts`: Tailwind theme tokens.
- Create `postcss.config.mjs`: Tailwind PostCSS config.
- Create `app/layout.tsx`: root layout and metadata.
- Create `app/page.tsx`: public MVP homepage.
- Create `app/globals.css`: visual system and global styling.
- Create `components/AppShell.tsx`: layout orchestrator.
- Create `components/ThemeRail.tsx`: theme selector.
- Create `components/StoryHeader.tsx`: active theme/story copy.
- Create `components/HeroGlobe.tsx`: client-side globe composition.
- Create `components/GlobeFallback.tsx`: non-WebGL fallback.
- Create `components/JapanImpactMap.tsx`: SVG domestic impact panel.
- Create `components/EvidenceDrawer.tsx`: selected entity detail.
- Create `components/EvidenceGraph.tsx`: source-linked graph panel.
- Create `components/SparqlPreview.tsx`: query preview.
- Create `components/SourceList.tsx`: citation/source list.
- Create `components/RelatedEntities.tsx`: related entity list.
- Create `components/DetailWindow.tsx`: selected object summary.
- Create `types/semantic.ts`: core semantic domain types.
- Create `types/presentation.ts`: UI view model types.
- Create `lib/data/seed-loader.ts`: import and validate seed data.
- Create `lib/semantic/graph.ts`: graph construction helpers.
- Create `lib/semantic/selectors.ts`: theme and selection selectors.
- Create `lib/semantic/sparql-preview.ts`: SPARQL preview generation.
- Create `lib/semantic/provenance.ts`: provenance helpers.
- Create `lib/semantic/__tests__/selectors.test.ts`: selector tests.
- Create `lib/semantic/__tests__/sparql-preview.test.ts`: SPARQL tests.
- Create `data/seed/entities.json`: canonical entities.
- Create `data/seed/flows.json`: dependency flows and routes.
- Create `data/seed/observations.json`: time-bound observations.
- Create `data/seed/sources.json`: source documents.
- Create `ontology/core.ttl`: core ontology stubs.
- Create `ontology/observations.ttl`: observation ontology stubs.
- Create `ontology/provenance.ttl`: provenance ontology stubs.
- Create `queries/energy-dependency.rq`: Energy query example.
- Create `queries/rice-energy-impact.rq`: Rice bridge query.
- Create `queries/water-stress.rq`: Water query example.
- Create `queries/defense-budget-flow.rq`: Defense query example.
- Create `queries/semiconductor-dependency.rq`: Semiconductor query example.
- Create `README.md`: public project framing, semantic-web explanation, setup.

## Task 1: Scaffold Next.js and Tooling

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `tailwind.config.ts`
- Create: `postcss.config.mjs`
- Create: `.gitignore`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/globals.css`

- [ ] **Step 1: Initialize project files**

Create a minimal Next.js App Router project by adding the listed files. Use `npm` scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run:

```bash
npm install next react react-dom three @react-three/fiber d3-force clsx
npm install -D typescript @types/node @types/react @types/react-dom tailwindcss postcss autoprefixer vitest @vitejs/plugin-react
```

Expected: dependencies install successfully and `package-lock.json` is created.

- [ ] **Step 3: Add root shell**

Add a basic `app/page.tsx` that imports `AppShell` later but temporarily renders project title:

```tsx
export default function Page() {
  return <main>Japan Economic Security Globe</main>;
}
```

- [ ] **Step 4: Verify scaffold**

Run:

```bash
npm run build
```

Expected: build succeeds.

## Task 2: Define Semantic and Presentation Types

**Files:**
- Create: `types/semantic.ts`
- Create: `types/presentation.ts`
- Test: `lib/semantic/__tests__/selectors.test.ts`

- [ ] **Step 1: Write failing type-driven selector test**

Create `lib/semantic/__tests__/selectors.test.ts` with a test that imports `getThemeView` from `lib/semantic/selectors` before it exists.

Run:

```bash
npm test -- lib/semantic/__tests__/selectors.test.ts
```

Expected: fails because module or function does not exist.

- [ ] **Step 2: Add semantic types**

Implement `types/semantic.ts` with:

- `ThemeId = "energy" | "rice" | "water" | "defense" | "semiconductors"`
- `EntityKind`
- `SemanticEntity`
- `Observation`
- `DependencyFlow`
- `SourceDocument`
- `GraphEdge`
- `SemanticGraph`

- [ ] **Step 3: Add presentation types**

Implement `types/presentation.ts` with:

- `ThemeView`
- `DetailViewModel`
- `GlobeFlowViewModel`
- `JapanImpactViewModel`
- `EvidenceGraphViewModel`
- `SparqlPreviewViewModel`

- [ ] **Step 4: Add minimal selector implementation**

Create `lib/semantic/selectors.ts` with `getThemeView(graph, themeId)` returning a `ThemeView`.

- [ ] **Step 5: Verify test passes**

Run:

```bash
npm test -- lib/semantic/__tests__/selectors.test.ts
```

Expected: selector test passes.

## Task 3: Add Seed Data and Loader

**Files:**
- Create: `data/seed/entities.json`
- Create: `data/seed/flows.json`
- Create: `data/seed/observations.json`
- Create: `data/seed/sources.json`
- Create: `lib/data/seed-loader.ts`
- Modify: `lib/semantic/__tests__/selectors.test.ts`

- [ ] **Step 1: Extend failing test**

Extend selector test to load seeds and assert that all five themes return at least one entity, one source, and one flow or observation.

Run:

```bash
npm test -- lib/semantic/__tests__/selectors.test.ts
```

Expected: fails because seed loader and data do not exist.

- [ ] **Step 2: Add seeded entities**

Create entities for:

- Japan
- Energy supplier countries
- Taiwan, South Korea, Netherlands, United States, China
- Hormuz and Malacca chokepoints
- Japanese ports, LNG terminals, refinery examples
- selected prefectures/reservoirs
- policy documents, budget lines, organizations, source documents

- [ ] **Step 3: Add flows and observations**

Create thin but complete slices:

- Energy: oil/LNG/coal supplier routes to Japan
- Rice: price, stockpile, import, policy signal
- Water: reservoir/prefecture observations
- Defense: FY2026 budget categories and capability areas
- Semiconductors: country/product/policy dependencies

- [ ] **Step 4: Implement loader**

Create `lib/data/seed-loader.ts` to normalize seed JSON into `SemanticGraph`.

- [ ] **Step 5: Verify test passes**

Run:

```bash
npm test -- lib/semantic/__tests__/selectors.test.ts
```

Expected: all five theme slices load.

## Task 4: Add SPARQL Preview and Provenance Helpers

**Files:**
- Create: `lib/semantic/sparql-preview.ts`
- Create: `lib/semantic/provenance.ts`
- Create: `lib/semantic/__tests__/sparql-preview.test.ts`
- Create: `queries/energy-dependency.rq`
- Create: `queries/rice-energy-impact.rq`
- Create: `queries/water-stress.rq`
- Create: `queries/defense-budget-flow.rq`
- Create: `queries/semiconductor-dependency.rq`

- [ ] **Step 1: Write failing SPARQL preview test**

Test that `buildSparqlPreview("energy", selectedEntityId)` returns a query containing `prov:wasDerivedFrom` and the selected theme/entity filter.

Run:

```bash
npm test -- lib/semantic/__tests__/sparql-preview.test.ts
```

Expected: fails because function does not exist.

- [ ] **Step 2: Implement SPARQL preview builder**

Create deterministic preview strings for each theme.

- [ ] **Step 3: Implement provenance helpers**

Create helpers that map selected entities and observations to source documents and citations.

- [ ] **Step 4: Add query files**

Write one `.rq` file per theme. Keep them valid-looking and aligned with ontology prefixes, even though Phase 0 does not run a real SPARQL endpoint.

- [ ] **Step 5: Verify tests**

Run:

```bash
npm test -- lib/semantic/__tests__/sparql-preview.test.ts
npm test
```

Expected: tests pass.

## Task 5: Add Ontology Turtle Stubs

**Files:**
- Create: `ontology/core.ttl`
- Create: `ontology/observations.ttl`
- Create: `ontology/provenance.ttl`
- Modify: `README.md` later in Task 10

- [ ] **Step 1: Add core ontology**

Create classes for:

- `Country`
- `Prefecture`
- `WorldRegion`
- `Resource`
- `Product`
- `DependencyFlow`
- `Route`
- `Chokepoint`
- `Port`
- `Terminal`
- `Refinery`
- `Reservoir`
- `PolicyDocument`
- `Law`
- `BudgetLine`
- `CapabilityArea`
- `Organization`

- [ ] **Step 2: Add observation ontology**

Create classes for:

- `Observation`
- `PriceObservation`
- `ImportObservation`
- `ReservoirObservation`
- `WaterObservation`
- `BudgetObservation`
- `DependencyObservation`
- `PolicySignal`

- [ ] **Step 3: Add provenance ontology**

Create classes/properties for:

- `SourceDocument`
- `ExtractedClaim`
- `Citation`
- `DatasetRelease`
- `prov:wasDerivedFrom`

- [ ] **Step 4: Verify files exist**

Run:

```bash
test -f ontology/core.ttl && test -f ontology/observations.ttl && test -f ontology/provenance.ttl
```

Expected: command exits 0.

## Task 6: Build App Shell and Theme Rail

**Files:**
- Create: `components/AppShell.tsx`
- Create: `components/ThemeRail.tsx`
- Create: `components/StoryHeader.tsx`
- Modify: `app/page.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Write minimal render expectation manually**

Because this project starts without React Testing Library, use build verification for UI shell after semantic tests are green.

- [ ] **Step 2: Implement `AppShell`**

Load semantic graph, manage active theme and selected entity state, and pass view models into children.

- [ ] **Step 3: Implement `ThemeRail`**

Render Energy, Rice, Water, Defense, Semiconductors in that order. Default to Energy.

- [ ] **Step 4: Implement `StoryHeader`**

Show hero copy and active theme summary.

- [ ] **Step 5: Verify build**

Run:

```bash
npm run build
```

Expected: build succeeds.

## Task 7: Build Hero Globe

**Files:**
- Create: `components/HeroGlobe.tsx`
- Create: `components/GlobeFallback.tsx`
- Create: `components/GlobeFlowLayer.tsx`
- Modify: `components/AppShell.tsx`

- [ ] **Step 1: Implement client-side globe boundary**

Use `"use client"` and keep the Three.js code isolated from server components.

- [ ] **Step 2: Render dark globe and Japan anchor**

Start with a lightweight sphere, atmospheric glow, and Japan anchor point.

- [ ] **Step 3: Render flow arcs**

Render active theme flows as glowing arcs or fallback SVG/canvas projections if WebGL work becomes too heavy.

- [ ] **Step 4: Add click selection**

Clicking flow/country proxy objects should update selected detail state.

- [ ] **Step 5: Verify build**

Run:

```bash
npm run build
```

Expected: build succeeds without SSR/WebGL errors.

## Task 8: Build Japan Impact Map

**Files:**
- Create: `components/JapanImpactMap.tsx`
- Modify: `components/AppShell.tsx`
- Modify: `lib/semantic/selectors.ts`

- [ ] **Step 1: Add selector output for Japan impacts**

Derive active theme domestic impact objects: ports, terminals, reservoirs, prefectures, refineries, budget areas.

- [ ] **Step 2: Render SVG impact strip**

Use a lightweight stylized Japan map rather than precise GIS for MVP. Highlight points and labels.

- [ ] **Step 3: Add click selection**

Clicking Japan impact objects should update selected detail state and evidence drawer.

- [ ] **Step 4: Verify selector tests and build**

Run:

```bash
npm test
npm run build
```

Expected: tests and build pass.

## Task 9: Build Evidence Drawer and Graph

**Files:**
- Create: `components/EvidenceDrawer.tsx`
- Create: `components/EvidenceGraph.tsx`
- Create: `components/SparqlPreview.tsx`
- Create: `components/SourceList.tsx`
- Create: `components/RelatedEntities.tsx`
- Create: `components/DetailWindow.tsx`
- Modify: `components/AppShell.tsx`
- Modify: `lib/semantic/provenance.ts`
- Modify: `lib/semantic/selectors.ts`

- [ ] **Step 1: Add detail view selector**

Given selected entity ID, return summary, why it matters for Japan, sources, related entities, and SPARQL preview.

- [ ] **Step 2: Render evidence drawer**

Render the required sections:

- Summary
- Why this matters in Japan
- Linked flows
- Evidence
- Related entities
- SPARQL preview

- [ ] **Step 3: Render evidence graph**

Create a lightweight graph panel with nodes/edges derived from the selected neighborhood.

- [ ] **Step 4: Add foreign country detail window**

Render flag/geographic cue, relation to Japan, active flows, sources, related themes. Do not create a generic country profile.

- [ ] **Step 5: Verify tests and build**

Run:

```bash
npm test
npm run build
```

Expected: tests and build pass.

## Task 10: Add Visual Polish and Responsive Layout

**Files:**
- Modify: `app/globals.css`
- Modify: `tailwind.config.ts`
- Modify: `components/AppShell.tsx`
- Modify: `components/ThemeRail.tsx`
- Modify: `components/HeroGlobe.tsx`
- Modify: `components/EvidenceDrawer.tsx`

- [ ] **Step 1: Add visual tokens**

Implement theme colors:

- Energy: amber / flare orange
- Rice: warm grain gold
- Water: cyan / deep blue
- Defense: muted red / signal crimson
- Semiconductors: electric teal

- [ ] **Step 2: Add atmospheric background**

Add near-black navy, subtle radial glow around Japan, grid/noise texture, and restrained bloom effects.

- [ ] **Step 3: Add responsive behavior**

Ensure mobile uses top story selector and collapsible evidence drawer.

- [ ] **Step 4: Verify build**

Run:

```bash
npm run build
```

Expected: build succeeds.

## Task 11: Add README and Public Project Framing

**Files:**
- Create: `README.md`
- Modify: `docs/superpowers/specs/2026-04-07-japan-economic-security-globe-design.md` only if implementation reveals an inconsistency

- [ ] **Step 1: Write README**

README must explain:

- project concept
- why semantic web matters
- current MVP scope
- Phase 0/1/2 roadmap
- OWL/RDF/SPARQL plan
- local setup
- data and provenance model
- public-interest caveats

- [ ] **Step 2: Reference ontology and queries**

Link `ontology/` and `queries/` examples in README.

- [ ] **Step 3: Verify links and setup commands**

Run:

```bash
npm run build
```

Expected: build succeeds.

## Task 12: Final Verification

**Files:**
- All implementation files

- [ ] **Step 1: Run semantic tests**

Run:

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 2: Run production build**

Run:

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Inspect app locally**

Run:

```bash
npm run dev
```

Expected: local app starts and the home page renders the Energy-led MVP shell.

- [ ] **Step 4: Verify requirement checklist**

Check:

- Energy default theme
- Rice, Water, Defense, Semiconductors available
- clickable Japan operations map
- global route inset
- operations signal table
- evidence drawer
- SPARQL preview
- source documents
- ontology stubs
- query examples
- README

Expected: all MVP requirements are represented.
