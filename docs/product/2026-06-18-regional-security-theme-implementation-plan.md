# Regional Security Theme Implementation Plan

> For agentic workers: implement task-by-task. Keep the public product bounded to historical, official, delayed, or aggregate context. Do not add live operational tracking.

**Goal:** Add `regional-security` as a first-class public theme for Japan-facing missile, air, maritime, public-alert, and regional security activity without turning the app into a live threat dashboard.

**Architecture:** Extend the existing semantic graph, ranking, theme registry, map model, inbox, and detail surfaces. Keep `regional-security` as the surrounding-activity theme and keep `defense` as the Japan-side capability/budget theme. Add a small source-adapter foundation before theme seeding so official APIs, CSV/Excel/GeoJSON files, and reviewed PDF/HTML claims normalize into the same evidence model. Use source-backed seed data first; live or provider integrations are explicitly out of scope.

**Tech Stack:** Next.js App Router, TypeScript, existing seed JSON graph, existing ranking system, MapLibre canvas model, Vitest, Turtle ontology stubs, Markdown docs.

---

## Files

- Create: `lib/sources/types.ts`
- Create: `lib/sources/registry.ts`
- Create: `lib/sources/source-adapter.ts`
- Create: `lib/sources/__tests__/source-adapter.test.ts`
- Modify: `types/semantic.ts`
- Modify: `types/ranking.ts`
- Modify: `lib/config/theme-registry.ts`
- Modify: `lib/config/ranking-registry.ts`
- Modify: `lib/presentation/japanese.ts`
- Modify: `lib/presentation/palette.ts`
- Modify: `lib/presentation/ranking.ts`
- Modify: `lib/presentation/operations.ts`
- Modify: `lib/presentation/map-canvas.ts`
- Modify: `lib/semantic/selectors.ts`
- Modify: `lib/semantic/detail.ts`
- Modify: `lib/semantic/signal-narrative.ts`
- Modify: `ontology/core.ttl`
- Modify: `data/seed/entities.json`
- Modify: `data/seed/flows.json`
- Modify: `data/seed/observations.json`
- Modify: `data/seed/ranking-signals.json`
- Modify: `data/seed/sources.json`
- Create: `queries/regional-security-evidence.rq`
- Create: `lib/semantic/__tests__/regional-security-theme.test.ts`
- Modify: `lib/ranking/__tests__/decision.test.ts`
- Modify: `lib/semantic/__tests__/rdf-artifacts.test.ts`
- Modify: `components/__tests__/navigation-rail.test.tsx`
- Modify: `components/__tests__/map-detail-popup.test.tsx`
- Modify: `README.ja.md`
- Modify: `README.md`
- Modify: `docs/official-source-registry.ja.md`
- Modify: `docs/official-source-registry.md`

## Task 0: Add Source Adapter Foundation

Files:

- Create: `lib/sources/types.ts`
- Create: `lib/sources/registry.ts`
- Create: `lib/sources/source-adapter.ts`
- Create: `lib/sources/__tests__/source-adapter.test.ts`
- Modify: `data/seed/sources.json`
- Modify: `docs/official-source-registry.ja.md`
- Modify: `docs/official-source-registry.md`

- [ ] Write a failing source adapter test

Add tests asserting:

```ts
expect(SOURCE_ACCESS_METHODS).toEqual([
  "api",
  "sparql",
  "ckan",
  "csv",
  "excel",
  "geojson",
  "tile",
  "pdf",
  "html"
]);
expect(SOURCE_OUTPUT_KINDS).toEqual([
  "SourceSnapshot",
  "EvidenceClaim",
  "GeoFeature",
  "TimeSeriesObservation",
  "PolicySignal"
]);
```

Run:

```bash
npm test -- lib/sources/__tests__/source-adapter.test.ts
```

Expected: FAIL because the source adapter module does not exist yet.

- [ ] Add source adapter types

Define:

```ts
export type SourceAccessMethod =
  | "api"
  | "sparql"
  | "ckan"
  | "csv"
  | "excel"
  | "geojson"
  | "tile"
  | "pdf"
  | "html";

export type SourceOutputKind =
  | "SourceSnapshot"
  | "EvidenceClaim"
  | "GeoFeature"
  | "TimeSeriesObservation"
  | "PolicySignal";
```

Add a `SourceAdapterDefinition` shape with:

- `id`
- `label`
- `sourceIds`
- `accessMethod`
- `outputKinds`
- `updateCadence`
- `rightsNote`
- `requiresCredential`
- `nonLiveBoundary`

- [ ] Add initial adapter registry entries

Add registry definitions for:

```text
adapter:e-stat-api
adapter:e-gov-data-portal
adapter:gsi-tiles
adapter:g-spatial-ckan
adapter:mod-publication-pages
adapter:jaxa-gportal
adapter:jepx-market-data
adapter:mhlw-drug-supply
```

Mark `adapter:mod-publication-pages` and `adapter:mhlw-drug-supply` as HTML/PDF/Excel source families, not clean APIs.

- [ ] Add a normalization contract

`lib/sources/source-adapter.ts` should expose a pure helper that validates a result contains:

- source ID
- captured date
- source URL
- access method
- at least one output kind
- provenance note

Do not fetch network data in this task.

- [ ] Update source registry docs

Document the data access order:

```text
API / SPARQL / CKAN > CSV / Excel / GeoJSON / tile > PDF / HTML > non-government public context
```

- [ ] Verify source adapter tests

Run:

```bash
npm test -- lib/sources/__tests__/source-adapter.test.ts
```

Expected: PASS.

## Task 1: Lock The Name And Theme Boundary

Files:

- Test: `lib/semantic/__tests__/regional-security-theme.test.ts`
- Modify: `types/semantic.ts`
- Modify: `lib/config/theme-registry.ts`
- Modify: `lib/presentation/japanese.ts`

- [ ] Write a failing test asserting:

```ts
expect(THEME_IDS).toContain("regional-security");
expect(THEME_IDS).not.toContain("direct-threats");
expect(getThemeDefinition("regional-security")).toEqual(
  expect.objectContaining({
    label: "地域安全保障",
    sublabel: "ミサイル / 航空活動 / 海空域"
  })
);
```

- [ ] Run:

```bash
npm test -- lib/semantic/__tests__/regional-security-theme.test.ts
```

Expected: FAIL because the theme does not exist yet.

- [ ] Add `regional-security` to the theme ID union.
- [ ] Add the registry entry:

```ts
{
  accent: "#e05243",
  headline: "日本周辺のミサイル・航空・海上活動は、どの地域に緊張を生むのか。",
  label: "地域安全保障",
  question: "日本周辺のミサイル・航空・海上活動は、どの地域に緊張を生むのか。",
  sublabel: "ミサイル / 航空活動 / 海空域",
  title: "地域安全保障"
}
```

- [ ] Update Japanese presentation labels.
- [ ] Re-run the focused test and confirm PASS.

## Task 2: Add Safe Ontology Types

Files:

- Test: `lib/semantic/__tests__/regional-security-theme.test.ts`
- Modify: `types/semantic.ts`
- Modify: `ontology/core.ttl`

- [ ] Add failing assertions that the graph can contain:

```text
SecurityActivity
MissileTest
LaunchSite
ImpactArea
MilitaryActivityRoute
PublicAlertSignal
```

- [ ] Extend `EntityKind`:

```ts
| "SecurityActivity"
| "MissileTest"
| "LaunchSite"
| "ImpactArea"
| "MilitaryActivityRoute"
| "PublicAlertSignal"
```

- [ ] Extend `ObservationKind`:

```ts
| "RegionalSecurityObservation"
```

- [ ] Add Turtle ontology stubs:

```ttl
jpsdg:SecurityActivity a owl:Class ; rdfs:subClassOf jpsdg:Entity .
jpsdg:MissileTest a owl:Class ; rdfs:subClassOf jpsdg:SecurityActivity .
jpsdg:LaunchSite a owl:Class ; rdfs:subClassOf jpsdg:Facility .
jpsdg:ImpactArea a owl:Class ; rdfs:subClassOf jpsdg:Region .
jpsdg:MilitaryActivityRoute a owl:Class ; rdfs:subClassOf jpsdg:Route .
jpsdg:PublicAlertSignal a owl:Class ; rdfs:subClassOf jpsdg:Observation .
```

- [ ] Re-run the focused test and confirm PASS.

## Task 3: Add Source Registry Entries

Files:

- Test: `lib/semantic/__tests__/source-quality.test.ts`
- Test: `lib/sources/__tests__/source-adapter.test.ts`
- Modify: `data/seed/sources.json`
- Modify: `docs/official-source-registry.ja.md`
- Modify: `docs/official-source-registry.md`

- [ ] Add failing source coverage tests for:

```text
source:cns-north-korea-missile-test-database
source:nagix-nk-missile-tests
source:mod-dprk-missile-nuclear-development
source:mod-joint-staff-air-activity
```

- [ ] Assert each source has a concrete URL.
- [ ] Assert `source:nagix-nk-missile-tests` is marked as code/reference, not the sole canonical data source.
- [ ] Assert official Japanese sources are prioritized for Japan-facing context.
- [ ] Add source records to `data/seed/sources.json`.
- [ ] Link each source record to the appropriate source adapter family from Task 0.
- [ ] Update source registry docs with license, data-rights, and non-live boundaries.
- [ ] Re-run source tests and confirm PASS.

## Task 4: Seed The First Regional Security Story

Files:

- Test: `lib/semantic/__tests__/regional-security-theme.test.ts`
- Modify: `data/seed/entities.json`
- Modify: `data/seed/flows.json`
- Modify: `data/seed/observations.json`

- [ ] Add failing seed graph tests for:
  - `country:north-korea` exists with `themes: ["regional-security"]`
  - at least one `MissileTest` exists
  - at least one `LaunchSite` exists
  - at least one `ImpactArea` exists
  - a regional-security flow links a missile activity to Japan-facing context
  - all items have provenance

- [ ] Add conservative starter entities:

```text
country:north-korea
activity:north-korea-missile-test-history
launch-site:north-korea-representative
impact-area:sea-of-japan
activity-route:nk-missile-representative-arc
```

- [ ] Add flow:

```text
flow:nk-missile-history-japan-watch
```

Required flow shape:

- origin: `country:north-korea`
- destination: `country:japan`
- route IDs: representative route / impact area
- source IDs: CNS/NTI, MOD, optional `nagix/nk-missile-tests` as visualization reference
- theme: `regional-security`

- [ ] Add observation:

```text
observation:nk-missile-history-watch
```

Use `RegionalSecurityObservation`, a qualitative value, and provenance. Do not create a false live metric.

- [ ] Re-run the focused test and confirm PASS.

## Task 5: Add Placeholder-Safe China Air / Maritime Structure

Files:

- Test: `lib/semantic/__tests__/regional-security-theme.test.ts`
- Modify: `data/seed/entities.json`
- Modify: `data/seed/observations.json`

- [ ] Add failing boundary tests asserting:
  - a China-related activity route can exist without live position data
  - the route has `coverageClass: "official_public_aggregate"`
  - no row or summary claims live aircraft tracking

- [ ] Add representative entity:

```text
activity-route:china-air-activity-east-china-sea-public
```

Required properties:

```json
{
  "coverageClass": "official_public_aggregate",
  "liveTracking": false,
  "displayPriority": 80
}
```

- [ ] Add qualitative observation:

```text
observation:china-air-activity-public-watch
```

Summary must say this is public/aggregate context, not live flight tracking.

- [ ] Re-run the focused test and confirm PASS.

## Task 6: Connect Ranking And Watchboard Surfaces

Files:

- Test: `lib/ranking/__tests__/decision.test.ts`
- Modify: `types/ranking.ts`
- Modify: `lib/config/ranking-registry.ts`
- Modify: `lib/presentation/ranking.ts`
- Modify: `data/seed/ranking-signals.json`

- [ ] Add failing ranking tests asserting:
  - `IMPORTANCE_AXES` includes `regional_security`
  - `resolveRankingThemeId` maps `regional_security` to `regional-security`
  - a `regional-security` ranking signal can decorate operation rows

- [ ] Add ranking axis:

```text
regional_security
```

Label:

```text
地域安全保障
```

- [ ] Add seed ranking signal:

```text
ranking-signal:regional-security-nk-missile-watch
```

Keep the score high enough to appear in the theme, but not high enough to unintentionally dominate the homepage.

- [ ] Re-run ranking tests and confirm PASS.

## Task 7: Make Map And Detail Presentation Safe

Files:

- Test: `components/__tests__/map-detail-popup.test.tsx`
- Test: `lib/presentation/__tests__/map-canvas.test.ts`
- Modify: `lib/presentation/map-canvas.ts`
- Modify: `lib/semantic/signal-narrative.ts`
- Modify: `components/MapDetailPopup.tsx`

- [ ] Add failing presentation tests asserting:
  - regional-security detail includes `公開情報 / 履歴 / 非リアルタイム`
  - map model can render representative route points/areas
  - detail links into `defense` capability where applicable

- [ ] Update signal narrative logic for:
  - `regional-security`
  - `MissileTest`
  - `MilitaryActivityRoute` for future air/maritime corridors only
  - `ImpactArea`
  - `PublicAlertSignal`

- [ ] Render missile context as `ImpactArea` overlays:
  - no line-connected route from North Korea to Japan
  - show representative landing/impact point
  - show public-history impact radius as an approximate overlay

Recommended categories:

```text
ミサイル履歴
航空活動
海空域活動
公開警戒文脈
```

- [ ] Render disclosure in detail:

```text
公開情報 / 履歴・集約 / ライブ追跡ではありません
```

- [ ] Re-run presentation tests and confirm PASS.

## Task 8: Add SPARQL Query Artifact

Files:

- Create: `queries/regional-security-evidence.rq`
- Test: `lib/semantic/__tests__/rdf-artifacts.test.ts`

- [ ] Add failing RDF artifact test asserting the new query contains:
  - `jpsdg:theme "regional-security"`
  - `prov:wasDerivedFrom`
  - `MissileTest` or `SecurityActivity`

- [ ] Create query:

```sparql
PREFIX jpsdg: <https://data.jp-strategic-dependency-graph.org/ontology#>
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?activity ?label ?source WHERE {
  ?activity jpsdg:theme "regional-security" ;
    rdfs:label ?label .
  OPTIONAL { ?activity prov:wasDerivedFrom ?source . }
}
```

- [ ] Re-run RDF artifact tests and confirm PASS.

## Task 9: Update Public Docs

Files:

- Modify: `README.ja.md`
- Modify: `README.md`
- Modify: `docs/official-source-registry.ja.md`
- Modify: `docs/official-source-registry.md`

- [ ] Add `Regional Security / 地域安全保障` to MVP scope and roadmap.
- [ ] Add this public boundary:

```text
The public app uses historical, official, delayed, or aggregate security activity information. It is not a live warning or tracking system.
```

- [ ] Add regional-security sources and rights boundary.
- [ ] Verify docs references:

```bash
rg -n "regional-security|地域安全保障|live warning|ライブ" README.md README.ja.md docs/official-source-registry.md docs/official-source-registry.ja.md
```

## Task 10: Final Verification

- [ ] Run focused regression:

```bash
npm test -- lib/sources/__tests__/source-adapter.test.ts lib/semantic/__tests__/regional-security-theme.test.ts lib/ranking/__tests__/decision.test.ts lib/presentation/__tests__/map-canvas.test.ts components/__tests__/map-detail-popup.test.tsx
```

- [ ] Run full test suite:

```bash
npm test
```

- [ ] Run build:

```bash
npm run build
```

- [ ] Run typecheck/lint:

```bash
npm run lint
```

- [ ] Commit:

```bash
git add lib/sources types/semantic.ts types/ranking.ts lib/config/theme-registry.ts lib/config/ranking-registry.ts lib/presentation lib/semantic components data/seed ontology/core.ttl queries/regional-security-evidence.rq README.md README.ja.md docs/official-source-registry.md docs/official-source-registry.ja.md
git commit -m "Add regional security theme"
```

## Follow-On Plans

After this plan lands, create separate PRDs/plans for:

1. `space-compute`
2. `critical-materials`
3. `bio-health-security`

Do not implement those in the same change. Each should ship as a working, testable theme slice.
