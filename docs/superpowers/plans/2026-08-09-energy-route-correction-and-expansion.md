# Energy Route Correction and Five-Corridor Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the five Energy centroid/inferred lines with evidence-backed representative maritime corridors, split North American geometry safely at the antimeridian, and make overview, selection, evidence, and safe-area behavior match the approved specification.

**Architecture:** Keep economic dependency semantics in `SemanticGraph`, but load a separate typed maritime-corridor dataset alongside the existing road/live datasets. Only validated Energy corridors receive precomputed route geometry; country entities remain contextual map points. Densify only between approved waypoints, split the result into antimeridian-safe `LineString`/`MultiLineString` geometry, and let MapLibre consume that geometry without reconstructing it from country points. Missing or invalid corridors fail closed as `代表航路未整備` and never fall back to `resolveGlobalSequence`.

**Tech Stack:** Next.js 16, React 19, TypeScript 5.8, MapLibre GL 5, Vitest 3, Testing Library, Playwright 1.61, `world-atlas` 2 / `topojson-client` 3.

**Canonical spec:** `docs/superpowers/specs/2026-08-09-energy-route-correction-and-expansion-design.md`

**Plan review:** Independently reviewed and approved on 2026-08-09; the reviewer advisory to make evidence machine-readable was incorporated before commit.

**Release boundary:** Repository implementation and local verification only. Production deployment is explicitly out of scope unless separately authorized.

---

## Controller preflight: isolate implementation and preserve the approved baseline

- [ ] Confirm the controller worktree is clean and the canonical spec plus this plan are committed.
- [ ] Use the `using-git-worktrees` skill to create a dedicated worktree from the current approved `main` HEAD on branch `codex/energy-route-correction`.
- [ ] In that worktree, prove the Git root, branch, and baseline before changing implementation files.

Run:

```bash
git status --short --branch
git log -3 --oneline
git worktree list
git rev-parse --show-toplevel
git branch --show-current
npm test -- --run
npm run typecheck
```

Expected: the planning baseline is clean, the dedicated worktree is on `codex/energy-route-correction`, the existing unit suite passes, and type checking passes. Stop on unrelated tracked or untracked changes; do not stash or absorb them.

---

## Task 1: Resolve and record the five-corridor evidence gate

**Files:**

- Create: `docs/research/2026-08-09-energy-maritime-route-evidence.md`
- Create: `data/seed/evidence/energy-maritime-route-evidence.json`
- Modify: `data/seed/sources.json`
- Create: `lib/maritime-routes/__tests__/source-evidence.test.ts`

This is a hard implementation gate. Do not add corridor coordinates until this task supports every mandatory claim with primary public evidence.

### Step 1.1: Write the failing evidence-quality test

- [ ] Create a table-driven test for these exact flow IDs:

```ts
const REQUIRED_ENERGY_FLOWS = [
  "flow:saudi-oil-japan",
  "flow:qatar-lng-japan",
  "flow:australia-coal-japan",
  "flow:us-gulf-energy-japan",
  "flow:canada-lng-japan"
] as const;
```

- [ ] Require an evidence row for every loading point/region, chokepoint or principal transit claim, Japan approach, and landing facility.
- [ ] Require every source to resolve to `data/seed/sources.json`, use HTTPS, carry `accessed: "2026-08-09"`, identify its publisher, and be official/primary for the claim it supports.
- [ ] Require exact ports only when the source establishes the port; otherwise require a visibly generalized loading-region label and disclosure.
- [ ] Reject `TBD`, missing claim text, unsupported coordinates, and a corridor justified only by the current presentation heuristic.
- [ ] Treat `data/seed/evidence/energy-maritime-route-evidence.json` as the machine-readable source of truth. Each claim record must have `id`, `flowId`, `waypointRole`, `claim`, `precision: "exact" | "generalized"`, `coordinateRule`, `sourceIds`, `supportSummary`, and `approvedAt`; the research Markdown explains the decisions and references those stable claim IDs rather than duplicating a second editable claim table.
- [ ] Make `coordinateRule` a closed discriminated union. `published_coordinate` carries the source-published `[lon, lat]` and requires `precision: "exact"`. `bounded_region_center` carries source-justified `{ west, south, east, north }` bounds, requires `precision: "generalized"`, and deterministically derives `[normalize((west + east) / 2), (south + north) / 2]`. Both variants record a derivation/support note; generalized claims also require the disclosure shown to users.
- [ ] Require valid, non-antimeridian-spanning bounds with finite in-range values. If a supported generalized region crosses the antimeridian, represent it as two separately justified bounds/waypoints instead of accepting an ambiguous bounding box.

Run:

```bash
npx vitest run lib/maritime-routes/__tests__/source-evidence.test.ts
```

Expected: FAIL because the evidence matrix is absent.

### Step 1.2: Research only primary public sources

- [ ] Verify the currently registered official sources live; a `403` from a command-line client is not by itself proof that a public browser URL is invalid.
- [ ] Add new source records only when needed for one of the mandatory claims.
- [ ] Record, per route and waypoint: claim, label, role, coordinate method, source ID, source URL, publisher, publication date if present, access date, quoted-or-paraphrased support, and why the coordinate is no more precise than the evidence.
- [ ] Record separate evidence for the existing Japanese landing facilities if it is not already sufficient.
- [ ] Record the permanent limitation copy exactly:

```text
公表資料に基づく代表航路です。実際の航行経路は船舶・天候・運航判断により異なります。リアルタイム追跡ではありません。
```

Do not invent a port, center point, Panama transit, Japan approach, or sea-lane waypoint. If any mandatory corridor claim cannot be supported, stop the implementation and report the exact missing claim to the user.

### Step 1.3: Make the evidence test pass

- [ ] Populate the evidence document with all five complete rows and add only the source registry entries those rows cite.
- [ ] Make the test parse/check the JSON evidence manifest. The Markdown must list all five flows and link each decision to the manifest's stable claim IDs without restating a second mutable coordinate/source table.

Run:

```bash
npx vitest run lib/maritime-routes/__tests__/source-evidence.test.ts
git diff --check
```

Expected: PASS with five complete, source-resolved evidence records and no placeholders.

### Step 1.4: Commit

```bash
git add docs/research/2026-08-09-energy-maritime-route-evidence.md data/seed/evidence/energy-maritime-route-evidence.json data/seed/sources.json lib/maritime-routes/__tests__/source-evidence.test.ts
git commit -m "docs: verify energy maritime corridor evidence"
```

---

## Task 2: Add the typed corridor dataset and fail-closed source gate

**Files:**

- Create: `types/maritime-routes.ts`
- Create: `data/seed/energy-maritime-corridors.json`
- Create: `lib/maritime-routes/corridor-loader.ts`
- Create: `lib/maritime-routes/source-gate.ts`
- Create: `lib/maritime-routes/__tests__/corridor-loader.test.ts`
- Modify: `lib/data/seed-loader.ts`
- Modify: `app/_components/AppPage.tsx`
- Modify: `components/AppShell.tsx`

### Step 2.1: Write failing contract tests

- [ ] Assert the seed returns exactly one validated corridor for each of the five flow IDs and no duplicate `flowId` or corridor ID.
- [ ] Assert every corridor has a nonblank version, ISO verification date, permanent limitation statement, at least two ordered waypoints, and corridor-level sources.
- [ ] Assert every waypoint has a unique stable ID, continuous order, allowed role, finite `[lon, lat]`, nonempty label, and at least one source ID.
- [ ] Assert the first waypoint role is `loading_region` or `export_port`, the last is `landing_facility`, and neither endpoint equals its flow's country-centroid coordinate.
- [ ] Assert every source ID resolves through `SemanticGraph.sources` and every `flowId` resolves to an Energy `DependencyFlow`.
- [ ] Mutate cloned fixtures to prove the source gate rejects missing sources, invalid role/order/date, duplicate flow, out-of-range published coordinates or bounds, mismatched precision/rule, a forbidden seed coordinate override, a non-deterministic or unknown coordinate rule, unsupported exactness, and empty limitation text.
- [ ] Assert every load returns an isolated clone.

Run:

```bash
npx vitest run lib/maritime-routes/__tests__/corridor-loader.test.ts
```

Expected: FAIL because the types, seed, and loader do not exist.

### Step 2.2: Define the narrow domain types

- [ ] Add types equivalent to:

```ts
export type MaritimeWaypointRole =
  | "loading_region"
  | "export_port"
  | "chokepoint"
  | "sea_lane"
  | "japan_approach"
  | "landing_facility";

export interface RepresentativeMaritimeWaypoint {
  id: string;
  order: number;
  role: MaritimeWaypointRole;
  label: string;
  coordinates: readonly [number, number];
  sourceIds: string[];
  evidenceClaimIds: string[];
  generalizedRegionDisclosure?: string;
}

export interface RepresentativeMaritimeCorridor {
  id: string;
  flowId: string;
  version: string;
  verifiedAt: string;
  status: "validated";
  sourceIds: string[];
  limitationStatement: string;
  waypoints: RepresentativeMaritimeWaypoint[];
}
```

Keep the dataset separate from `SemanticGraph`; do not expand every graph fixture/mocked graph for presentation-only route coordinates.

`RepresentativeMaritimeWaypoint` is the resolved runtime type. The JSON corridor seed uses a separate `RepresentativeMaritimeWaypointSeed` with `id`, `order`, `role`, `label`, and `evidenceClaimIds`, but **no free-form `coordinates` field**. The loader derives the runtime coordinate solely from the claim's closed `coordinateRule`, preventing corridor data from drifting away from its approved geographic evidence.

### Step 2.3: Populate and validate the dataset

- [ ] Translate the approved evidence matrix into five explicit ordered waypoint arrays whose seed waypoints reference evidence claims and contain no independent coordinate values.
- [ ] Preserve evidence precision: use an evidence-supported generalized loading region where exact port evidence is unavailable.
- [ ] Implement `validateEnergyMaritimeCorridors(graph, corridors)` returning `{ ok, errors }` with route/waypoint-specific messages.
- [ ] Resolve every waypoint's `evidenceClaimIds` against `data/seed/evidence/energy-maritime-route-evidence.json`; require matching `flowId`, role, source IDs, and exact/generalized coordinate rule. Derive the runtime coordinate from the canonical rule: copy `published_coordinate`, or compute the normalized center of `bounded_region_center`. Reject any seed-level coordinate field so corridor coordinates cannot become more precise than or displaced from their approved claim.
- [ ] Unit-test derivation with exact numeric expectations, including longitude normalization, bounds validation, and equality between each resolved runtime waypoint and its canonical evidence-derived coordinate.
- [ ] Implement `enforceEnergyMaritimeCorridorGate` and `loadSeedEnergyMaritimeCorridors(graph)` using `structuredClone`.
- [ ] Pass the loaded corridors from `AppPage` into an optional `maritimeCorridors` `AppShell` prop; default it to `[]` in component tests and stories.

Run:

```bash
npx vitest run lib/maritime-routes/__tests__/corridor-loader.test.ts lib/maritime-routes/__tests__/source-evidence.test.ts
npm run typecheck
```

Expected: PASS; all five records are validated before reaching presentation code.

### Step 2.4: Commit

```bash
git add types/maritime-routes.ts data/seed/energy-maritime-corridors.json lib/maritime-routes lib/data/seed-loader.ts app/_components/AppPage.tsx components/AppShell.tsx
git commit -m "feat: add validated energy maritime corridors"
```

---

## Task 3: Build explicit-waypoint geometry and deterministic antimeridian splitting

**Files:**

- Create: `lib/presentation/antimeridian.ts`
- Create: `lib/presentation/maritime-route-geometry.ts`
- Create: `lib/presentation/__tests__/antimeridian.test.ts`
- Create: `lib/presentation/__tests__/maritime-route-geometry.test.ts`
- Modify: `lib/presentation/route-geometry.ts`
- Modify: `lib/presentation/__tests__/route-geometry.test.ts`

### Step 3.1: Write failing splitter tests

- [ ] Reproduce the confirmed `-179.66 -> +178.92` and `-179.26 -> +179.41` jumps.
- [ ] Test eastbound and westbound crossings, exactly-on-boundary points, multiple crossings, non-crossing routes, duplicate boundary inputs, and invalid parts.
- [ ] Require every emitted part to contain at least two points and every adjacent longitude delta within a part to be `<= 180`.
- [ ] Require the closing `+180/-180` and opening opposite-boundary point to have the same interpolated latitude.
- [ ] Require input arrays to remain unchanged.

Run:

```bash
npx vitest run lib/presentation/__tests__/antimeridian.test.ts
```

Expected: FAIL because `splitRouteAtAntimeridian` does not exist.

### Step 3.2: Implement the pure splitter

- [ ] Implement a direction-agnostic algorithm:

```ts
export function splitRouteAtAntimeridian(coordinates: readonly LonLat[]): LonLat[][] {
  // Normalize start, unwrap each destination onto the nearest world copy,
  // interpolate at the crossed boundary, close/open matching route parts,
  // normalize the destination, and reject parts shorter than two points.
}
```

- [ ] Keep normalization and split logic isolated from React and MapLibre.
- [ ] Never insert a world-spanning connector to make the output look continuous.

### Step 3.3: Write failing representative-geometry tests

- [ ] Assert route construction takes only approved waypoint coordinates.
- [ ] Assert cartographic vertices are derived between those waypoints with `densifyGeodesicPolyline`, then antimeridian-split.
- [ ] Assert all mandatory waypoints remain represented in order.
- [ ] Assert Saudi/Qatar retain Hormuz and Malacca, Australia uses its eastern/northeastern loading side, U.S. uses Gulf/Caribbean/Panama/Pacific order, and Canada uses Pacific Coast/North Pacific order.
- [ ] Assert no country centroid appears in any rendered route.
- [ ] Assert the U.S. and Canada produce `MultiLineString`; non-crossing corridors produce `LineString`.

Run:

```bash
npx vitest run lib/presentation/__tests__/maritime-route-geometry.test.ts
```

Expected: FAIL because the explicit corridor builder does not exist.

### Step 3.4: Implement the geometry builder

- [ ] Define a local geometry union:

```ts
export type MaritimeRouteGeometry =
  | { type: "LineString"; coordinates: LonLat[] }
  | { type: "MultiLineString"; coordinates: LonLat[][] };
```

- [ ] Densify consecutive approved waypoints, deduplicating only the shared joint.
- [ ] Split after densification and choose the geometry type from the resulting part count.
- [ ] Do **not** call `expandWithSeaLanes` for representative corridors. Keep legacy heuristic construction only for non-Energy routes until separately redesigned.
- [ ] Export reusable coordinate validators and remove any now-dead Energy-specific classifier constants only after focused tests prove non-Energy behavior is unchanged.

Run:

```bash
npx vitest run lib/presentation/__tests__/antimeridian.test.ts lib/presentation/__tests__/maritime-route-geometry.test.ts lib/presentation/__tests__/route-geometry.test.ts
npm run typecheck
```

Expected: PASS with antimeridian-safe geometry and existing generic route tests intact.

### Step 3.5: Commit

```bash
git add lib/presentation/antimeridian.ts lib/presentation/maritime-route-geometry.ts lib/presentation/route-geometry.ts lib/presentation/__tests__
git commit -m "fix: split representative routes at antimeridian"
```

---

## Task 4: Block land-cutting and endpoint overprecision

**Files:**

- Create: `lib/maritime-routes/landmask.ts`
- Create: `lib/maritime-routes/__tests__/corridor-landmask.test.ts`
- Modify: `lib/maritime-routes/source-gate.ts`
- Modify: `lib/maritime-routes/__tests__/corridor-loader.test.ts`

### Step 4.1: Write failing landmask tests

- [ ] Convert the installed `world-atlas/land-50m.json` topology with `topojson-client`; do not add a second geospatial dependency.
- [ ] Sample every densified segment at intervals no greater than 25 km.
- [ ] Reject samples inside land polygons except documented loading/landing connectors within 25 km of the first or last mandatory waypoint.
- [ ] Test polygon holes, multipolygons, boundary tolerance, antimeridian parts, and a deliberately land-cutting mutation for each corridor family.
- [ ] Require any endpoint allowance to identify the endpoint waypoint and never exempt a mid-route segment.

Run:

```bash
npx vitest run lib/maritime-routes/__tests__/corridor-landmask.test.ts
```

Expected: FAIL until the landmask validator exists.

### Step 4.2: Implement and attach the validation gate

- [ ] Implement deterministic even-odd point-in-ring/polygon handling over the Natural Earth land fixture.
- [ ] Validate the generated geometry, not merely the sparse waypoints.
- [ ] Add route/segment coordinates to error messages so an evidence or waypoint correction is actionable.
- [ ] Run this check in the seed source gate used by `loadSeedEnergyMaritimeCorridors`; invalid geometry must not reach the map model.

Run:

```bash
npx vitest run lib/maritime-routes/__tests__/corridor-landmask.test.ts lib/maritime-routes/__tests__/corridor-loader.test.ts
```

Expected: PASS for all five evidence-backed corridors and FAIL for the deliberate land-cutting fixtures.

### Step 4.3: Commit

```bash
git add lib/maritime-routes/landmask.ts lib/maritime-routes/source-gate.ts lib/maritime-routes/__tests__
git commit -m "test: enforce maritime route landmask"
```

---

## Task 5: Separate context points from route geometry in the map model

**Files:**

- Modify: `lib/presentation/map-canvas.ts`
- Modify: `lib/presentation/__tests__/map-canvas.test.ts`
- Create: `lib/presentation/map-route-geojson.ts`
- Create: `lib/presentation/__tests__/map-route-geojson.test.ts`
- Modify: `components/JapanOperationsMapCanvas.tsx`
- Modify: `components/__tests__/map-canvas-layer-config.test.tsx`

### Step 5.1: Write failing map-model tests

- [ ] Build the Energy route layer with the five validated corridors and assert exactly five `globalRoutes`.
- [ ] Assert each route carries precomputed `geometry`, ordered `focusCoordinates`, and the existing flow selection ID.
- [ ] Assert country points still exist in `globalPoints` and remain related/selectable, but no country point ID is used as a geometry anchor.
- [ ] Assert a missing corridor yields no legacy line for that flow and a presentation status of `代表航路未整備`.
- [ ] Assert non-Energy and live-logistics route construction remains unchanged.

Run:

```bash
npx vitest run lib/presentation/__tests__/map-canvas.test.ts
```

Expected: FAIL because `JapanMapRoute` has no precomputed geometry contract.

### Step 5.2: Extend the route model narrowly

- [ ] Add optional fields so existing domestic/live route fixtures remain valid:

```ts
export type JapanMapRoute = {
  id: string;
  label: string;
  pointIds: string[];
  relatedIds: string[];
  geometry?: MaritimeRouteGeometry;
  focusCoordinates?: LonLat[];
  representativeStatus?: "validated" | "unready";
};
```

- [ ] Add `maritimeCorridors` as the last, defaulted parameter of `buildJapanMapCanvasModel` to minimize call-site churn.
- [ ] In `buildGlobalRoutes`, resolve Energy flows through a `flowId -> corridor` map and use explicit geometry. Never call `resolveGlobalSequence` for an Energy flow in the `energy-route` layer.
- [ ] Continue building country context points independently from the flow's semantic relations.

### Step 5.3: Extract and test GeoJSON conversion

- [ ] Move generic route feature creation from `JapanOperationsMapCanvas.tsx:2445` to `lib/presentation/map-route-geojson.ts`.
- [ ] Prefer `route.geometry` verbatim; only legacy routes without geometry may derive a `LineString` from `pointIds`.
- [ ] Preserve one feature, one `selectionId`, selected state, click/hover properties, and direction-symbol compatibility for both geometry types.
- [ ] Assert no produced feature contains an adjacent longitude jump greater than 180 within a line part.

Run:

```bash
npx vitest run lib/presentation/__tests__/map-route-geojson.test.ts components/__tests__/map-canvas-layer-config.test.tsx lib/presentation/__tests__/map-canvas.test.ts
npm run typecheck
```

Expected: PASS; MapLibre receives `MultiLineString` for the two North American routes without changing interaction IDs.

### Step 5.4: Commit

```bash
git add lib/presentation/map-canvas.ts lib/presentation/map-route-geojson.ts lib/presentation/__tests__ components/JapanOperationsMapCanvas.tsx components/__tests__/map-canvas-layer-config.test.tsx
git commit -m "feat: render validated representative route geometry"
```

---

## Task 6: Make selection explicit and fit route geometry inside the safe area

**Files:**

- Modify: `components/AppShell.tsx`
- Modify: `components/JapanMainMap.tsx`
- Modify: `components/JapanOperationsMapCanvas.tsx`
- Modify: `components/__tests__/app-shell-url-state.test.tsx`
- Modify: `components/__tests__/japan-main-map-attribution.test.tsx`
- Modify: `components/__tests__/map-canvas-layer-config.test.tsx`
- Create: `lib/presentation/antimeridian-bounds.ts`
- Create: `lib/presentation/__tests__/antimeridian-bounds.test.ts`

### Step 6.1: Write failing explicit-selection tests

- [ ] At `?theme=energy&layer=energy-route`, assert no route is selected when `selected=` is absent.
- [ ] Assert a valid `selected=flow:us-gulf-energy-japan` selects exactly that route and survives URL serialization.
- [ ] Assert invalid selection still resolves safely without implicitly selecting the first Energy route.
- [ ] Assert other themes retain their existing fallback behavior.

Run:

```bash
npx vitest run components/__tests__/app-shell-url-state.test.tsx
```

Expected: FAIL because `mapSelectionId` currently uses `activeId` for Energy.

### Step 6.2: Narrow the selection-state change

- [ ] Compute `activeLayer` before final map-selection derivation or derive the condition from the requested/resolved layer.
- [ ] Use the explicit selection only for the Energy route layer:

```ts
const energyRouteOverview = themeId === "energy" && activeLayer.id === "energy-route";
const mapSelectionId = themeId === "logistics" || energyRouteOverview
  ? explicitSelectionId
  : activeId;
```

- [ ] Keep `activeId` for tables/detail fallback; only map selected styling changes.

### Step 6.3: Write failing antimeridian-aware fit tests

- [ ] Add a bounds helper that unwraps longitudes around the Japan-side route copy so a U.S./Canada route fit does not span 360 degrees.
- [ ] Assert bounds contain every mandatory waypoint and choose the smaller longitudinal span.
- [ ] Assert `focusMapOnSelection` uses `route.focusCoordinates`, not `pointIds`, for validated representative routes.
- [ ] Assert overlay insets plus the existing 24 CSS pixel safety margin are passed for a selected global representative route at 1280x800, 1680x900, and 2048x1176.

Run:

```bash
npx vitest run lib/presentation/__tests__/antimeridian-bounds.test.ts components/__tests__/map-canvas-layer-config.test.tsx components/__tests__/japan-main-map-attribution.test.tsx
```

Expected: FAIL until route-coordinate fitting and insets are wired.

### Step 6.4: Add the explicit fit command

- [ ] Extend the command union in `JapanMainMap.tsx:70` and `JapanOperationsMapCanvas.tsx:36` with `fitSelection`.
- [ ] Render a control labeled `選択ルート全体を見る` only when a validated representative route is explicitly selected.
- [ ] Have the command call the same antimeridian-aware selection fit as automatic selection focus.
- [ ] Preserve existing `+`, `-`, and `日本中心に戻す` controls and keyboard accessibility.

Run:

```bash
npx vitest run components/__tests__/app-shell-url-state.test.tsx components/__tests__/map-canvas-layer-config.test.tsx components/__tests__/japan-main-map-attribution.test.tsx lib/presentation/__tests__/antimeridian-bounds.test.ts
npm run typecheck
```

Expected: PASS with no implicit overview selection and safe selected-route fitting.

### Step 6.5: Commit

```bash
git add components/AppShell.tsx components/JapanMainMap.tsx components/JapanOperationsMapCanvas.tsx components/__tests__ lib/presentation/antimeridian-bounds.ts lib/presentation/__tests__/antimeridian-bounds.test.ts
git commit -m "fix: focus representative routes within safe area"
```

---

## Task 7: Expose representative-route status, evidence, and disclosure

**Files:**

- Modify: `types/presentation.ts`
- Modify: `lib/semantic/detail.ts`
- Modify: `lib/presentation/route-status.ts`
- Modify: `lib/presentation/workspace.ts`
- Modify: `components/EvidencePanel.tsx`
- Modify: `components/MapDetailPopup.tsx`
- Modify: `components/AppShell.tsx`
- Modify: `lib/presentation/__tests__/route-status.test.ts`
- Modify: `lib/presentation/__tests__/workspace.test.ts`
- Modify: `components/__tests__/active-layer-summary-panel.test.tsx`
- Modify: `components/__tests__/context-inspector.test.tsx`
- Modify: `components/__tests__/evidence-panel-structure.test.tsx`
- Modify: `components/__tests__/map-detail-popup.test.tsx`
- Modify: `components/__tests__/operations-accessibility.test.tsx`

### Step 7.1: Write failing presentation tests

- [ ] Assert Energy route-layer coverage is `5代表航路`, not a theme-wide entity count.
- [ ] Assert the permanent disclosure is visible in the active-layer summary and selected route evidence.
- [ ] Assert a validated selected route shows `代表航路`, loading region, ordered principal transit sequence, Japan approach, landing facility, source references, verification date, and limitation.
- [ ] Assert a missing/failed route shows `代表航路未整備` and no inferred geometry claim.
- [ ] Assert source tabs include corridor and waypoint sources without duplicates.
- [ ] Assert no copy says current position, actual voyage, live track, or navigation-grade route.

Run:

```bash
npx vitest run lib/presentation/__tests__/route-status.test.ts lib/presentation/__tests__/workspace.test.ts components/__tests__/active-layer-summary-panel.test.tsx components/__tests__/context-inspector.test.tsx components/__tests__/evidence-panel-structure.test.tsx components/__tests__/map-detail-popup.test.tsx
```

Expected: FAIL because `DetailViewModel` has no corridor evidence.

### Step 7.2: Add a presentation-only route summary

- [ ] Add an optional `representativeRoute` field to `DetailViewModel`; do not overload `DependencyFlow.routeIds` with cartographic vertices.
- [ ] Change `getDetailView(graph, id, maritimeCorridors = [])` to enrich flow details only when the linked corridor is validated.
- [ ] Include role/label/source references and verification date, but never expose derived cartographic vertices as evidence.
- [ ] Merge the corridor sources into `detail.sources` and add clear source highlights for the representative-route claims.
- [ ] Update `getRouteStatus` to prefer the representative status for Energy flows and return `代表航路未整備` when none exists.

### Step 7.3: Render status and evidence consistently

- [ ] Special-case `buildActiveLayerSummary` for `energy-route`, using the validated corridor count and permanent disclosure.
- [ ] Render the ordered corridor facts in `EvidencePanel` and the compact selected-route facts in `MapDetailPopup`.
- [ ] Keep `ContextInspector` delegation and existing tabs/ARIA structure intact.
- [ ] Pass the same corridor collection used by the map to detail/summary builders so status and line rendering cannot disagree.

Run:

```bash
npx vitest run lib/presentation/__tests__/route-status.test.ts lib/presentation/__tests__/workspace.test.ts components/__tests__/active-layer-summary-panel.test.tsx components/__tests__/context-inspector.test.tsx components/__tests__/evidence-panel-structure.test.tsx components/__tests__/map-detail-popup.test.tsx components/__tests__/operations-accessibility.test.tsx
npm run typecheck
```

Expected: PASS with `5代表航路`, permanent disclosure, route-specific evidence, and fail-closed status.

### Step 7.4: Commit

```bash
git add types/presentation.ts lib/semantic/detail.ts lib/presentation/route-status.ts lib/presentation/workspace.ts lib/presentation/__tests__ components/AppShell.tsx components/EvidencePanel.tsx components/MapDetailPopup.tsx components/__tests__
git commit -m "feat: explain representative energy routes"
```

---

## Task 8: Add browser diagnostics and desktop acceptance coverage

**Files:**

- Modify: `components/JapanOperationsMapCanvas.tsx`
- Modify: `components/__tests__/map-canvas-layer-config.test.tsx`
- Create: `e2e/energy-representative-routes.spec.ts`
- Modify: `package.json`

### Step 8.1: Write the diagnostic contract first

- [ ] Extend the existing container-local `__prefectureMapDiagnostics` only when `NEXT_PUBLIC_MAP_ACCEPTANCE_FIXTURES=1` with `readEnergyRoutes()`.
- [ ] Return route feature IDs, geometry types, route parts, maximum adjacent longitude delta, selected state, projected mandatory waypoint coordinates, viewport bounds, overlay exclusion rectangles, and tile-loaded state.
- [ ] Do not create a new window-global diagnostic and remove the diagnostic on component cleanup.

Run:

```bash
NEXT_PUBLIC_MAP_ACCEPTANCE_FIXTURES=1 npx vitest run components/__tests__/map-canvas-layer-config.test.tsx
```

Expected: FAIL before `readEnergyRoutes` is implemented, then PASS with diagnostics absent when fixtures are disabled.

### Step 8.2: Write the Playwright acceptance test

- [ ] Open `/?theme=energy&layer=energy-route` at each accepted desktop viewport: 1280x800, 1680x900, and 2048x1176.
- [ ] In overview, assert five route features, zero selected routes, no route part with adjacent delta `> 180`, no world-spanning horizontal connector, `5代表航路`, and the permanent disclosure.
- [ ] Select all five routes one by one; assert exactly one selected feature, URL `selected=` compatibility, popup/evidence facts, and that the fit command keeps every mandatory waypoint at least 24 CSS pixels inside the unobscured safe-area edge.
- [ ] For U.S. and Canada, assert `MultiLineString` and matching antimeridian boundary latitudes.
- [ ] For Saudi/Qatar/Australia, assert their approved ordered waypoint labels.
- [ ] Assert country marker selection still works and does not change corridor coordinates.
- [ ] Capture screenshots for the overview plus Australia, U.S., and Canada selected states at 2048x1176.

Add:

```json
"test:e2e:energy": "playwright test e2e/energy-representative-routes.spec.ts"
```

Run:

```bash
npm run test:e2e:energy
```

Expected: PASS at all three viewport sizes with no horizontal dateline artifact and no clipped selected waypoint.

### Step 8.3: Inspect screenshots manually

- [ ] Compare the 2048x1176 overview against the reported screenshot.
- [ ] Confirm the two former horizontal lines are absent, Australia begins on the approved loading side rather than inland, route labels do not imply live tracking, and overlay panels do not cover selected mandatory waypoints.
- [ ] Record screenshot paths and findings in the implementation handoff; do not approve visual acceptance from numeric diagnostics alone.

### Step 8.4: Commit

```bash
git add components/JapanOperationsMapCanvas.tsx components/__tests__/map-canvas-layer-config.test.tsx e2e/energy-representative-routes.spec.ts package.json
git commit -m "test: cover representative energy routes"
```

---

## Task 9: Run the complete regression and completion review

**Files:**

- Modify only files required by discovered regressions; every fix begins with a reproducing test.

### Step 9.1: Run focused suites together

- [ ] Run:

```bash
npx vitest run lib/maritime-routes/__tests__ lib/presentation/__tests__/antimeridian.test.ts lib/presentation/__tests__/antimeridian-bounds.test.ts lib/presentation/__tests__/maritime-route-geometry.test.ts lib/presentation/__tests__/map-route-geojson.test.ts lib/presentation/__tests__/map-canvas.test.ts lib/presentation/__tests__/route-status.test.ts lib/presentation/__tests__/workspace.test.ts components/__tests__/app-shell-url-state.test.tsx components/__tests__/map-canvas-layer-config.test.tsx components/__tests__/active-layer-summary-panel.test.tsx components/__tests__/context-inspector.test.tsx components/__tests__/evidence-panel-structure.test.tsx components/__tests__/map-detail-popup.test.tsx components/__tests__/operations-accessibility.test.tsx
```

Expected: PASS.

### Step 9.2: Run all repository checks

- [ ] Run:

```bash
npm test
npm run typecheck
npm run build
npm run test:e2e:prefecture
npm run test:e2e:logistics
npm run test:e2e:energy
git diff --check
git status --short --branch
```

Expected: all tests, type checking, production build, and all focused E2E suites pass. The worktree contains only intentional changes.

### Step 9.3: Review against the canonical specification

- [ ] Use the `verification-before-completion` skill and re-check all 17 acceptance criteria in the canonical spec.
- [ ] Review the complete branch diff from the planning baseline, not just the last commit.
- [ ] Confirm all five corridors passed the evidence gate, all source URLs/claims remain accurate, and no legacy centroid fallback exists for Energy.
- [ ] Confirm rice homepage and every non-Energy theme are unchanged by direct tests/browser checks.
- [ ] Dispatch a final code review using the `requesting-code-review` skill; fix each accepted finding with a failing regression test and a scoped commit, then re-run the affected checks.

### Step 9.4: Commit any final regression fixes

If fixes were required, inspect `git status --short`, stage only the reviewed reproducing test and source files by their exact paths, then run:

```bash
git diff --cached --check
git commit -m "fix: close energy route regressions"
```

Skip this commit when no fix is needed. Do not deploy. Hand back the clean branch, commit list, evidence-gate result, verification output, screenshot paths, and any residual limitation for an explicit integration decision.

---

## Implementation invariants

- [ ] Evidence precedes coordinates; unsupported claims stop the task.
- [ ] Country centroids are context only, never maritime route endpoints.
- [ ] Energy never falls back to the legacy inferred line when a corridor is missing or invalid.
- [ ] Derived cartographic vertices are not semantic facts and never receive source claims.
- [ ] Each antimeridian route is one selectable feature with multiple safe line parts.
- [ ] Overview selection is explicit; selected-route fitting is antimeridian-aware and safe-area-aware.
- [ ] The permanent representative/non-live disclosure is identical across summary and evidence surfaces.
- [ ] Production deployment remains outside this plan.
