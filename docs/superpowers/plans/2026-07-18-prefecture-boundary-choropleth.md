# Prefecture Boundary Choropleth Implementation Plan

> **Required subskill:** `subagent-driven-development`
> **Required implementation discipline:** `test-driven-development`
> **Execution choice:** Subagent-driven execution selected by the user; for Tasks 1–8, one fresh implementation subagent implements with TDD, commits, self-reviews, then a fresh spec reviewer approves before a fresh code-quality reviewer begins. The same implementer fixes review findings in new commits and each reviewer re-reviews until approved. Task 9 uses the same release-operator → release-spec-reviewer → release-quality-reviewer sequence for external publication.

**Goal:** Replace misleading prefecture radius circles in the rice-harvest layer with a reproducible 47-prefecture Natural Earth boundary choropleth, full desktop prefecture labels, stable selection, transparent source authority, and a production `v0.6.0` release.

**Architecture:** Keep semantic prefecture entities and official e-Stat values unchanged. Add a checked-in, deterministic Natural Earth 5.1.1 GeoJSON display artifact and join it to `JapanMapRegion` values by stable `entityId`/ISO code. Render dedicated prefecture fill, outline, selected, leader-line, and label layers around the existing raster-reference layer; preserve the existing radius-polygon path only for non-prefecture regional data. Extend source metadata so Natural Earth is a non-official open-data source, with its public-domain terms, beta/de facto worldview, processing record, and accuracy limitation shown separately from e-Stat.

**Tech stack:** Next.js 16, React 19, TypeScript, MapLibre GL 5, Vitest, Testing Library, deterministic Node data-processing script, Cloudflare OpenNext deployment.

**Canonical spec:** `docs/superpowers/specs/2026-07-18-prefecture-boundary-choropleth-design.md`
**Plan review:** Independently reviewed and approved on 2026-07-18

**Release boundary:** Desktop visual layout and label placement are in scope. Shared geometry correctness and regression checks apply to smaller viewports. Mobile layout and interaction redesign remain deferred. No centered `精密表示`, minimap, second camera, modal map, or lock state will be added.

---

## Controller preflight: Commit the approved planning baseline

The worktree currently has an older staged copy of the canonical spec plus newer approved working-tree changes. Before any implementer is dispatched, the controller must reconcile this state so Task 1 cannot accidentally commit obsolete N03 content.

1. Inspect `git status --short`, `git diff --cached`, and `git diff` and inventory every path. Preserve and stop on any path outside the approved product doc, canonical spec, and implementation plan.
2. Force-add the ignored canonical spec and plan, normally add the product doc, and verify the staged content says Natural Earth 5.1.1, the immutable SHA, `open-data`, beta/de facto, `maxzoom: 9`, no precision inset, and Mobile deferred.
3. Run `git diff --cached --check`, commit the approved planning baseline, and prove both index and working tree are empty before Task 1.

```bash
git status --short
git diff --cached -- docs/product/2026-07-13-estat-data-theme-map.md docs/superpowers/specs/2026-07-18-prefecture-boundary-choropleth-design.md docs/superpowers/plans/2026-07-18-prefecture-boundary-choropleth.md
git diff -- docs/product/2026-07-13-estat-data-theme-map.md docs/superpowers/specs/2026-07-18-prefecture-boundary-choropleth-design.md docs/superpowers/plans/2026-07-18-prefecture-boundary-choropleth.md
git add docs/product/2026-07-13-estat-data-theme-map.md
git add -f docs/superpowers/specs/2026-07-18-prefecture-boundary-choropleth-design.md docs/superpowers/plans/2026-07-18-prefecture-boundary-choropleth.md
git diff --cached --check
git commit -m "docs: approve prefecture choropleth plan"
git status --short
git diff --cached --quiet
```

Expected: final `git status --short` has no output and `git diff --cached --quiet` exits 0. These planning documents are now tracked despite the broad local-agent ignore rule and form part of the durable handoff.

---

## Task 1: Pin and generate the Natural Earth artifact

**Files:**

- Create: `scripts/build-prefecture-boundaries.mjs`
- Create: `data/geo/japan-prefectures-natural-earth-5.1.1.geojson`
- Create: `data/geo/japan-prefectures-natural-earth-5.1.1.provenance.json`
- Create: `lib/geo/prefecture-boundaries.ts`
- Create: `lib/geo/__tests__/prefecture-boundaries.test.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

### Step 1.1: Write the failing artifact-integrity tests

Create tests that import the boundary loader and prove:

- exactly 47 features exist;
- `prefectureCode` is exactly `JP-01` through `JP-47`, unique and sorted after normalization;
- `entityId` and full Japanese `label` are unique and non-empty;
- every geometry is `Polygon` or `MultiPolygon`;
- every ring is closed and has only finite longitude/latitude pairs;
- every longitude is within `122..154` and latitude within `20..46`;
- no segment in a ring self-intersects except adjacent shared endpoints;
- all 47 seed entities of kind `Prefecture` map one-to-one to a feature;
- provenance pins version `5.1.1`, immutable archive URL, terms URL, beta/de facto worldview, processing statement, and SHA-256 `efc59726337323058f9446210adc96673179cd344e053666ee3d28cb58ba2b05`;
- artifact size is at most 700 KB raw and 250 KB gzip.

Run:

```bash
npx vitest run lib/geo/__tests__/prefecture-boundaries.test.ts
```

Expected: FAIL because the loader and artifact do not exist.

### Step 1.2: Add the pinned processing dependency

Query the npm registry for the exact current stable `mapshaper` version, then install that exact version as a dev dependency. Record the resolved version in `package-lock.json`; do not use an unpinned `npx -y` command in the generator.

Run:

```bash
npm view mapshaper version
npm install --save-dev --save-exact mapshaper@<verified-version>
```

### Step 1.3: Implement the deterministic generator

The script must:

1. download or accept a local copy of `https://naciscdn.org/naturalearth/5.1.1/10m/cultural/ne_10m_admin_1_states_provinces.zip`;
2. compute and reject any SHA-256 other than the pinned value;
3. invoke the repository-local `mapshaper` binary;
4. filter `adm0_a3 == "JPN"`;
5. retain all 47 island-aware `Polygon`/`MultiPolygon` features;
6. simplify conservatively with `keep-shapes` and fixed precision only if needed for the agreed budget;
7. map `JP-01..JP-47` to the repository's semantic prefecture IDs and full Japanese names through an explicit checked-in mapping in the script;
8. sort features by `prefectureCode` before serialization;
9. write stable minified GeoJSON and provenance JSON with no run-specific random values;
10. include processing date `2026-07-18`, command, upstream version, immutable URL, SHA, public-domain terms, beta/de facto worldview, artifact version, and limitation statement.

Do not make the application build or browser download the upstream archive.

Run:

```bash
npm run build:prefecture-boundaries
```

Add this script to `package.json` with the repository-local processor.

### Step 1.4: Implement the typed loader and validators

`lib/geo/prefecture-boundaries.ts` owns:

- GeoJSON feature/property types;
- the immutable imported collection;
- the `prefectureCode -> entityId` and `entityId -> feature` indexes;
- runtime assertions used during development/tests;
- exported provenance metadata.

The module must not mutate the imported collection and must fail loudly on a duplicate or missing mapping.

### Step 1.5: Prove determinism and budgets

Run:

```bash
npm run build:prefecture-boundaries
cp data/geo/japan-prefectures-natural-earth-5.1.1.geojson /tmp/prefectures-first.geojson
npm run build:prefecture-boundaries
cmp /tmp/prefectures-first.geojson data/geo/japan-prefectures-natural-earth-5.1.1.geojson
npx vitest run lib/geo/__tests__/prefecture-boundaries.test.ts
git diff --check
```

Expected: deterministic `cmp`, passing tests, and no whitespace errors.

### Step 1.6: Commit, self-review, and run two-stage review

```bash
git add package.json package-lock.json scripts/build-prefecture-boundaries.mjs data/geo lib/geo
git commit -m "feat: add verified prefecture boundary artifact"
```

The implementer self-reviews the committed diff and fixes any issue in a new scoped commit. Then dispatch the fresh spec reviewer; the same implementer commits fixes and the reviewer re-reviews until approved. Only then dispatch the fresh code-quality reviewer; the implementer commits fixes and that reviewer re-reviews until approved.

---

## Task 2: Model Natural Earth as neutral open data

**Files:**

- Modify: `types/semantic.ts`
- Modify: `data/seed/sources.json`
- Modify: `lib/legal/source-catalog.ts`
- Modify: `components/ActiveLayerSummaryPanel.tsx`
- Modify: `components/EvidencePanel.tsx`
- Modify: `components/SourcesLicensePage.tsx`
- Modify: `lib/legal/__tests__/source-catalog.test.ts`
- Modify: `components/__tests__/sources-license-page.test.tsx`
- Modify: `components/__tests__/active-layer-summary-panel.test.tsx`
- Modify: `components/__tests__/evidence-panel-structure.test.tsx`
- Modify: `lib/semantic/__tests__/source-quality.test.ts`

### Step 2.1: Write failing authority and rights tests

Tests must first require:

- `SourceDocument.sourceCategory` supports `official | open-data | private`;
- optional structured `rights` metadata can contain license label/URL, source version, immutable archive URL/SHA, processing statement, and limitation statement;
- `source:natural-earth-admin1-japan-5-1-1` is `official: false`, `sourceCategory: "open-data"`, and does not receive the `公式` badge;
- Natural Earth appears only under `公開・オープンデータ` on `/sources-license`;
- the page shows public-domain, beta/de facto, immutable SHA, processing, and accuracy limitation copy;
- e-Stat remains in `政府・公的機関ソース` and keeps the `公式` badge;
- existing `official !== false` records still fall back to `official`, and existing `official: false` records without a category still fall back to `private`;
- every source badge surface, including `ActiveLayerSummaryPanel` and `EvidencePanel`, uses the centralized category resolver so explicit categories override legacy flags consistently;
- `policySummary`, `sourceSummary`, and the page's license prose accurately describe all three categories instead of retaining the old official/private binary wording.

Run:

```bash
npx vitest run lib/legal/__tests__/source-catalog.test.ts components/__tests__/sources-license-page.test.tsx components/__tests__/active-layer-summary-panel.test.tsx components/__tests__/evidence-panel-structure.test.tsx lib/semantic/__tests__/source-quality.test.ts
```

Expected: FAIL on the missing category, record, group, and metadata rendering.

### Step 2.2: Extend the source contract without reclassifying existing data

Add optional backward-compatible fields to `SourceDocument`. Implement one exported category resolver in `lib/legal/source-catalog.ts`; do not scatter classification rules across components.

The catalog order is:

1. `official` — `政府・公的機関ソース`;
2. `open-data` — `公開・オープンデータ`;
3. `private` — `民間企業ソース`.

Empty groups may remain present for deterministic page structure, but Natural Earth must not leak into official/private.

Update `policySummary`, `sourceSummary`, each group description, and the page's explanatory license paragraph so `公開・オープンデータ` is described as reusable under source-specific open terms. Do not call Natural Earth a government source or a private-company fact-summary source.

### Step 2.3: Register the complete geometry source

Add `source:natural-earth-admin1-japan-5-1-1` with:

- label `地図形状: Natural Earth Admin 1（一般化・加工）`;
- URL to the Admin-1 dataset page;
- publisher `Natural Earth`;
- accessed `2026-07-18`;
- `official: false`;
- `sourceCategory: "open-data"`;
- `accessMode: "geojson"`;
- rights and limitation fields exactly aligned with the canonical spec and provenance JSON.

### Step 2.4: Render rights details only when supplied

`SourcesLicensePage` displays the structured rights block for Natural Earth while keeping existing source cards unchanged. External links use the current `target="_blank" rel="noreferrer"` contract.

### Step 2.5: Verify and commit

```bash
npx vitest run lib/legal/__tests__/source-catalog.test.ts components/__tests__/sources-license-page.test.tsx components/__tests__/active-layer-summary-panel.test.tsx components/__tests__/evidence-panel-structure.test.tsx lib/semantic/__tests__/source-quality.test.ts
npm run typecheck
git diff --check
git add types/semantic.ts data/seed/sources.json lib/legal/source-catalog.ts components/ActiveLayerSummaryPanel.tsx components/EvidencePanel.tsx components/SourcesLicensePage.tsx lib/legal/__tests__/source-catalog.test.ts components/__tests__/sources-license-page.test.tsx components/__tests__/active-layer-summary-panel.test.tsx components/__tests__/evidence-panel-structure.test.tsx lib/semantic/__tests__/source-quality.test.ts
git commit -m "feat: classify map geometry as open data"
```

After the implementer commits and self-reviews, run the spec-review loop to approval, then the code-quality-review loop to approval. Reviewer findings are fixed by the same implementer in new scoped commits.

---

## Task 3: Join prefecture metrics to boundary geometry

**Files:**

- Create: `lib/geo/prefecture-source.ts`
- Create: `lib/geo/prefecture-map.ts`
- Create: `lib/geo/__tests__/prefecture-map.test.ts`
- Modify: `lib/presentation/map-canvas.ts`
- Modify: `lib/presentation/workspace.ts`
- Modify: `lib/presentation/__tests__/map-canvas.test.ts`
- Modify: `lib/presentation/__tests__/workspace.test.ts`
- Modify: `components/__tests__/active-layer-summary-panel.test.tsx`
- Modify: `components/__tests__/map-canvas-layer-config.test.tsx`

### Step 3.1: Write failing join and regression tests

Require:

- prefecture regional metrics declare a boundary geometry kind and stable `prefectureCode`;
- `JapanMapRegion` is a true discriminated union: boundary regions require `prefectureCode`, radius regions forbid it, finite normalized values require finite `rawValue`, and missing values are the paired null/no-raw state;
- rice regions join to all 47 boundary features by `entityId`, never by display label;
- geometry feature properties include `id`, `entityId`, `prefectureCode`, `label`, `value`, `rawValue`, `unit`, `periodLabel`, `sourceIds`, and `selected`;
- missing typed values remain `null` and keep the feature;
- unmatched or duplicate entities throw an explicit validation error;
- non-prefecture regional layers retain the representative-radius contract;
- rice layer `sourceIds` are ordered `[e-Stat metric, Natural Earth geometry]`;
- rice map copy says `都道府県の一般化された地域形状` and no longer says representative point or precise administrative polygon.
- the shared Natural Earth source ID lives in a lightweight dependency-free module, so presentation-only source lookup does not import or parse the boundary artifact.

Run:

```bash
npx vitest run lib/geo/__tests__/prefecture-map.test.ts lib/presentation/__tests__/map-canvas.test.ts lib/presentation/__tests__/workspace.test.ts
```

Expected: FAIL before implementation.

### Step 3.2: Add the explicit presentation geometry discriminator

Extend `JapanMapRegion` with a narrow discriminator such as `geometryKind: "prefecture-boundary" | "representative-radius"` and optional `prefectureCode`. Assign `prefecture-boundary` only when `layer.content.kind === "regional-metric"` and `entityKind === "Prefecture"`; all other regional candidates remain `representative-radius`.

### Step 3.3: Build the boundary feature collection

`lib/geo/prefecture-map.ts` combines the immutable boundary collection with current metric properties. It must not import React or MapLibre. Keep the collection builder deterministic and pure so component tests can inspect it directly. At the builder boundary, validate the geometry discriminator/code pair and require finite paired `value`/`rawValue` numbers or the explicit missing-value state; reject mismatched codes, non-finite numbers, normalized values without raw data, and raw data attached to `null`.

### Step 3.4: Update source order and copy

Add a shared Natural Earth source ID constant in dependency-free `lib/geo/prefecture-source.ts`; importing the constant alone must not load the GeoJSON artifact. Update only the rice-harvest layer and corresponding map model. Do not add the geometry source to rice price, inventory, logistics, unrelated themes, or semantic entities.

### Step 3.5: Verify and commit

```bash
npx vitest run lib/geo/__tests__/prefecture-map.test.ts lib/presentation/__tests__/map-canvas.test.ts lib/presentation/__tests__/workspace.test.ts components/__tests__/active-layer-summary-panel.test.tsx components/__tests__/map-canvas-layer-config.test.tsx
npm run typecheck
git diff --check
git add lib/geo/prefecture-source.ts lib/geo/prefecture-map.ts lib/geo/__tests__/prefecture-map.test.ts lib/presentation/map-canvas.ts lib/presentation/workspace.ts lib/presentation/__tests__/map-canvas.test.ts lib/presentation/__tests__/workspace.test.ts components/__tests__/active-layer-summary-panel.test.tsx components/__tests__/map-canvas-layer-config.test.tsx
git commit -m "feat: join prefecture metrics to boundaries"
```

After the implementer commits and self-reviews, run the spec-review loop to approval, then the code-quality-review loop to approval. Reviewer findings are fixed by the same implementer in new scoped commits.

---

## Task 4: Render dedicated choropleth, border, selection, and precision fade layers

**Files:**

- Modify: `lib/geo/prefecture-map.ts`
- Modify: `lib/geo/__tests__/prefecture-map.test.ts`
- Modify: `components/JapanOperationsMapCanvas.tsx`
- Modify: `components/__tests__/map-canvas-layer-config.test.tsx`
- Modify: `lib/presentation/basemap-style.ts`
- Modify: `lib/presentation/__tests__/basemap-style.test.ts`

### Step 4.1: Write failing MapLibre configuration tests

Require:

- a `jp-prefectures` GeoJSON source carries `境界: Made with Natural Earth（加工）` attribution;
- `jp-prefecture-fill`, `jp-prefecture-outline`, and `jp-prefecture-selected-outline` exist;
- `world-land-fill` is reordered below the existing raster layer `gray-canvas-reference`, then fill and base outline are inserted immediately before `gray-canvas-reference` so contextual roads/place labels remain above them;
- the Task 4 order is asserted as background/terrain/base/world-land → prefecture fill → prefecture base outline → `gray-canvas-reference` → selected treatment → point/route layers; Task 5 later inserts leader/label layers between the reference and selected treatment;
- the component mock captures and asserts MapLibre `addLayer(layer, beforeId)`'s second argument, including the exact `gray-canvas-reference` anchor;
- selected treatment remains above reference context in the overview range and provides the stable `beforeId` anchor that Task 5 will use for app-owned labels;
- all prefecture polygon layers use `minzoom: 3.2` and `maxzoom: 9`;
- fill and line opacity expressions are stable through zoom 6.5 and fade toward zoom 9;
- selected state changes both fill/border and remains non-color-only;
- `jp-prefecture-fill` is interactive below zoom 9 and absent from rendered feature queries at zoom 9+ through `maxzoom`;
- `jp-region-fill`/outline and `createCirclePolygon` remain for representative-radius regions only;
- point, route, logistics, and cluster layer contracts remain unchanged;
- palette, mode, or referentially new-but-value-equal model rerenders do not rebuild or call `setData` for the 47-feature prefecture source; metric/label/source metadata or `activeId` changes update it exactly once;
- no second map, `精密表示`, minimap, lock, or automatic selection zoom is added.

Run:

```bash
npx vitest run components/__tests__/map-canvas-layer-config.test.tsx lib/presentation/__tests__/basemap-style.test.ts
```

Expected: FAIL on missing source/layers/order/fade.

### Step 4.2: Split prefecture and representative-radius sources

Create and update `jp-prefectures` independently from `jp-regions`. The prefecture source receives the joined boundary collection; `jp-regions` receives only non-prefecture radius features. Never silently fall back to circles when a prefecture geometry join fails.

Keep paint/visibility updates independent from boundary data updates. Compare a deterministic lightweight signature of the boundary-region presentation fields plus `activeId` before building the full collection; do not stringify or clone the geometry merely to decide whether it changed. Cache the last applied signature so palette-only, mode-only, and value-equal model rerenders skip `jp-prefectures.setData`, while metric/label/source metadata and external selection changes still update it.

### Step 4.3: Insert layers around the raster reference overlay

First move `world-land-fill` before `gray-canvas-reference` inside `buildOperationsBasemapStyle`. Then use MapLibre's `beforeId` parameter with the exact existing layer ID `gray-canvas-reference` for prefecture fill and base borders. Keep label and selected treatment later in the stack. Update mode visibility for both geometry families without changing `getModeVisibilityState` semantics.

### Step 4.4: Make detailed zoom non-interactive

Rely on `maxzoom: 9`, not opacity alone, to stop invisible-polygon hit-testing. Preserve current URL/inspector selection when zoom crosses 9. Do not create a hidden interaction layer.

### Step 4.5: Verify and commit

```bash
npx vitest run components/__tests__/map-canvas-layer-config.test.tsx lib/presentation/__tests__/basemap-style.test.ts lib/geo/__tests__/prefecture-map.test.ts
npm run typecheck
git diff --check
git add components/JapanOperationsMapCanvas.tsx components/__tests__/map-canvas-layer-config.test.tsx lib/presentation/basemap-style.ts lib/presentation/__tests__/basemap-style.test.ts
git commit -m "feat: render prefecture choropleth boundaries"
```

After the implementer commits and self-reviews, run the spec-review loop to approval, then the code-quality-review loop to approval. Reviewer findings are fixed by the same implementer in new scoped commits.

---

## Task 5: Add the 47-label desktop cartography

**Files:**

- Create: `data/geo/japan-prefecture-labels.json`
- Create: `lib/geo/prefecture-label-layout.ts`
- Create: `lib/geo/__tests__/prefecture-label-layout.test.ts`
- Create: `e2e/prefecture-map.spec.ts`
- Create: `playwright.config.ts`
- Modify: `components/JapanOperationsMapCanvas.tsx`
- Modify: `components/__tests__/map-canvas-layer-config.test.tsx`
- Modify: `lib/presentation/basemap-style.ts`
- Modify: `lib/presentation/__tests__/basemap-style.test.ts`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `.github/workflows/ci.yml`

### Step 5.1: Write failing label-completeness and layout tests

Require:

- exactly 47 unique full Japanese names and entity IDs;
- the label artifact is runtime-validated and frozen against the canonical boundary mapping so every code, entity ID, and full Japanese name matches the same prefecture and malformed/swapped rows fail loudly;
- every item has a finite explicit label anchor and target anchor;
- dense Kanto, Kansai, Okinawa, Hokkaido, and multi-island cases have explicit curated placement;
- at nationwide default zoom 5.0 in the 1440x900 desktop map canvas, every label whose display anchor is at least 28 CSS pixels from its target anchor generates a leader-line feature; zoom 5.0 is the release camera because it keeps all 47 generalized prefecture shapes, including Okinawa, inside every required desktop viewport;
- explicit dense/multi-island placement is present at minimum for `JP-11`, `JP-12`, `JP-13`, `JP-14`, `JP-23`, `JP-26`, `JP-27`, `JP-28`, and `JP-47`; any additional label that crosses the same 28-pixel rule also receives a leader line;
- label properties carry selected state and stable semantic ID;
- a deterministic Web Mercator projection/layout validator reports no estimated label-box overlap or viewport clipping for the actual map-canvas sizes corresponding to 1280x800, 1440x900, and 1680x900;
- desktop layer config uses full names, halo, `text-allow-overlap`, and `text-ignore-placement`, relying on curated positions rather than collision-based omission;
- the now-complete order is asserted as world-land → prefecture fill → prefecture base outline → `gray-canvas-reference` → leader lines → prefecture labels → selected treatment → point/route layers;
- the selected label remains visible through detailed zoom;
- all-prefecture labels are disabled below the existing `xl` desktop boundary, while the same semantic prefecture-boundary choropleth remains active and representative-radius circles remain absent.
- label/leader sources are empty for representative-radius regional layers and contain only IDs belonging to the current prefecture-boundary model; unrelated static/choropleth layers never inherit the global 47-label artifact.

Before writing production code, install an exact verified stable `@playwright/test` dev dependency, add the browser test script/config, and write the real-rendered acceptance test:

```bash
npm view @playwright/test version
npm install --save-dev --save-exact @playwright/test@<verified-version>
npx playwright install chromium
```

The component exposes a read-only diagnostics function on its own map container element (not on `window`) that calls the real MapLibre instance's `queryRenderedFeatures` and projected label-box checker. The diagnostics returns unique rendered prefecture label IDs, rendered prefecture polygon IDs, zoom, and collision/clipping results. When and only when `NEXT_PUBLIC_MAP_ACCEPTANCE_FIXTURES=1` is compiled into the local Playwright dev server, the container diagnostics may expose a test-only method that sets one prefecture value to `null`; the normal production build must not contain an enabled mutation path.

The Playwright test must first fail and must exercise the real MapLibre canvas at 1280x800, 1440x900, and 1680x900. `playwright.config.ts` starts one isolated dev server with `NEXT_PUBLIC_MAP_ACCEPTANCE_FIXTURES=1`; production builds never set it. Acceptance mode uses a deterministic local basemap style containing the app background/world-land layers, a transparent local background placeholder with the exact layer ID `gray-canvas-reference`, and `localIdeographFontFamily` for Japanese text. The placeholder preserves Task 4's `addLayer(..., "gray-canvas-reference")` insertion contract without any source or network request. Because `app/globals.css` contains a Google Fonts `@import` and `app/layout.tsx` contains font preconnects, the Playwright page-level router must explicitly intercept `https://fonts.googleapis.com/**` and `https://fonts.gstatic.com/**`, fulfill the stylesheet request with deterministic empty local CSS and any font request with an empty local response, and record these as known presentation requests rather than application errors. A page-level request observer must fail the test on every other non-local origin. Thus no remote Esri raster, Google font response, remote glyph, or other external response participates in the automated query test. Playwright aborts every unexpected non-local request, uses a 30-second per-test timeout plus a bounded 10-second MapLibre-idle/diagnostics wait, and reports a hard failure rather than hanging. Live Esri/glyph/raster behavior remains a separate Task 7 visual acceptance check.

At each default viewport the test waits for the bounded MapLibre diagnostics-ready state, calls the element diagnostics, and requires exactly 47 unique rendered labels and exactly 47 unique rendered polygon IDs. Readiness includes both 47-count requirements plus settled tiles. It obtains the actual DOM rectangles for `[data-testid="scope-context-panel"]`, `[aria-label="選択中の詳細と根拠"]` when present, and the map container, then requires no label box to intersect the map edge or either permanent UI exclusion rectangle. At zoom 9 it requires zero rendered prefecture polygon features from `queryRenderedFeatures`, then clicks the map and proves the invisible polygon cannot change the existing URL selection. At 1024x768 and 390x844 it requires a rendered semantic prefecture-boundary choropleth, zero representative-radius region IDs, and no forced 47-label desktop cartography. A separate fixture assertion sets one value to `null` and proves the real rendered feature keeps neutral fill, border, and label. Its screenshot goes to `testInfo.outputPath(...)` during normal local/CI E2E. Only when `PREFECTURE_EVIDENCE_DIR` is explicitly set may the test resolve that filename beneath the requested evidence directory; normal Task 5 and CI runs must never write into `docs/assets/`.

Run the RED gates:

```bash
npx vitest run lib/geo/__tests__/prefecture-label-layout.test.ts components/__tests__/map-canvas-layer-config.test.tsx
npm run build
npx playwright test e2e/prefecture-map.spec.ts
```

Expected: FAIL because label data/layers do not exist.

### Step 5.2: Curate label and leader anchors

Create a stable JSON record ordered by `prefectureCode`. Use Natural Earth shape context plus existing representative coordinates as targets, but move display anchors deliberately for dense regions. Full administrative names are mandatory; abbreviations alone are not accepted.

The initial implementation must include leader lines for the explicit prefecture-code set above and every other label at or above the 28 CSS-pixel default-view displacement threshold. Keep leader lines restrained and subordinate to borders/labels.

### Step 5.3: Add the pure label builders and layout validator

`prefecture-label-layout.ts` validates and freezes the imported JSON against `prefectureBoundaryCollection`, then returns:

- a label-point FeatureCollection;
- a leader-line FeatureCollection;
- a projected label-box collision report used by tests and browser acceptance diagnostics.

Use the same font-size/anchor assumptions in the validator and MapLibre layer configuration.
Export the normal runtime validator so negative fixtures can prove malformed coordinates and swapped `(prefectureCode, entityId, label)` mappings are rejected without adding a test-only production API.

### Step 5.4: Add MapLibre label layers

Add `jp-prefecture-leader-line`, `jp-prefecture-label`, and a selected-label treatment. Put reference context below app labels and selected treatment above. Toggle the all-prefecture label/leader layers at the desktop breakpoint without recreating the map or changing Mobile layout.

Build these sources only from layout entries whose entity ID and prefecture code occur in the current `prefecture-boundary` region set. Return empty label, selected-detail, and leader collections when the model has no boundary regions; add a representative-radius choropleth regression test.

Add the container-scoped read-only diagnostics hook and remove it during map cleanup. Add the local acceptance-style option and unit-test that it contains no remote source/glyph/font URL while retaining the exact transparent `gray-canvas-reference` insertion anchor. Add `test:e2e:prefecture` to `package.json`. In `.github/workflows/ci.yml`, after the production build, run `npx playwright install --with-deps chromium` and then `npm run test:e2e:prefecture`. The test must use one isolated port and terminate its web server after completion.

### Step 5.5: Verify and commit

```bash
npx vitest run lib/geo/__tests__/prefecture-label-layout.test.ts components/__tests__/map-canvas-layer-config.test.tsx
npm run typecheck
npm run build
npx playwright test e2e/prefecture-map.spec.ts
git diff --check
git add data/geo/japan-prefecture-labels.json lib/geo/prefecture-label-layout.ts lib/geo/__tests__/prefecture-label-layout.test.ts e2e/prefecture-map.spec.ts playwright.config.ts components/JapanOperationsMapCanvas.tsx components/__tests__/map-canvas-layer-config.test.tsx lib/presentation/basemap-style.ts lib/presentation/__tests__/basemap-style.test.ts package.json package-lock.json .github/workflows/ci.yml
git commit -m "feat: add readable prefecture labels"
```

After the implementer commits and self-reviews, run the spec-review loop to approval, then the code-quality-review loop to approval. Reviewer findings are fixed by the same implementer in new scoped commits.

---

## Task 6: Integrate source evidence, unavailable states, and release copy

**Files:**

- Modify: `components/JapanOperationsMapCanvas.tsx`
- Modify: `components/InitialNoticeModal.tsx`
- Modify: `components/__tests__/initial-notice-modal.test.tsx`
- Modify: `components/__tests__/app-shell-url-state.test.tsx`
- Modify: `components/__tests__/active-layer-summary-panel.test.tsx`
- Modify: `components/__tests__/sources-license-page.test.tsx`
- Create: `components/__tests__/map-unavailable-state.test.tsx`
- Modify: `README.md`
- Modify: `README.ja.md`
- Modify: `docs/public-launch.md`
- Modify: `DATA-SOURCES.md`

### Step 6.1: Write failing end-to-end presentation contract tests

Require:

- active rice summary lists e-Stat first and Natural Earth second;
- only e-Stat has the `公式` badge;
- geometry source link and compact map attribution are reachable;
- `/sources-license` exposes the complete structured rights/limitation block;
- invalid/missing prefecture geometry renders an honest unavailable state and never falls back to radius circles;
- only a typed prefecture boundary/model validation error is recovered as unavailable; label/programming/unknown errors remain visible to error handling and are never misreported as geometry failure;
- click selection below zoom 9 continues to call the existing semantic ID selection callback;
- existing URL selection and inspector tests for Niigata still pass;
- the update notice says `v0.6.0` and accurately describes the change;
- public copy distinguishes official statistics from generalized map-display geometry and keeps Mobile redesign deferred.

The genuinely new RED assertions are the accessible geometry-unavailable overlay/no-circle fallback, `v0.6.0` notice copy, and updated URL/selection behavior when geometry is unavailable. Run exactly:

```bash
npx vitest run components/__tests__/map-unavailable-state.test.tsx components/__tests__/initial-notice-modal.test.tsx components/__tests__/app-shell-url-state.test.tsx
```

Expected: FAIL because the unavailable-state test/module behavior and `v0.6.0` notice do not exist. Re-run the already-green authority/source tests after implementation as regressions; do not misreport them as the RED proof.

### Step 6.2: Add the honest unavailable state

If the boundary builder rejects the dataset/model join, do not add misleading circle features. Represent expected join/model validation failures with a dedicated exported error class. Build labels outside the recovery block; catch only that typed boundary error, emit a useful diagnostic, and rethrow unknown errors. Surface a concise non-modal map status through the existing presentation shell or an accessible map overlay. Keep the rest of the app usable.

### Step 6.3: Update durable release documentation

Update only current product/release surfaces. Do not rewrite historical `v0.5.0` PRD records. `docs/public-launch.md` becomes the `v0.6.0` distribution note and names:

- 47 generalized prefecture polygons;
- readable names and selection;
- e-Stat/Natural Earth authority separation;
- no precision inset;
- Mobile still deferred;
- Natural Earth beta/de facto and non-surveying limitation.

### Step 6.4: Verify and commit

```bash
npx vitest run lib/geo/__tests__/prefecture-map.test.ts components/__tests__/map-unavailable-state.test.tsx components/__tests__/initial-notice-modal.test.tsx components/__tests__/app-shell-url-state.test.tsx components/__tests__/active-layer-summary-panel.test.tsx components/__tests__/sources-license-page.test.tsx components/__tests__/map-canvas-layer-config.test.tsx
npm run typecheck
git diff --check
git add lib/geo/prefecture-map.ts lib/geo/__tests__/prefecture-map.test.ts components/JapanOperationsMapCanvas.tsx components/InitialNoticeModal.tsx components/__tests__/map-unavailable-state.test.tsx components/__tests__/initial-notice-modal.test.tsx components/__tests__/app-shell-url-state.test.tsx components/__tests__/active-layer-summary-panel.test.tsx components/__tests__/sources-license-page.test.tsx README.md README.ja.md docs/public-launch.md DATA-SOURCES.md
git commit -m "docs: prepare prefecture map release"
```

After the implementer commits and self-reviews, run the spec-review loop to approval, then the code-quality-review loop to approval. Reviewer findings are fixed by the same implementer in new scoped commits.

---

## Task 7: Run desktop visual and interaction acceptance

**Files:**

- Modify: `components/JapanOperationsMapCanvas.tsx`
- Modify: `components/__tests__/map-canvas-layer-config.test.tsx`
- Modify: `e2e/prefecture-map.spec.ts`
- Create: `docs/assets/prefecture-choropleth-default-1280x800.png`
- Create: `docs/assets/prefecture-choropleth-default-1440x900.png`
- Create: `docs/assets/prefecture-choropleth-default-1680x900.png`
- Create: `docs/assets/prefecture-choropleth-niigata-highest-z7.png`
- Create: `docs/assets/prefecture-choropleth-tokyo-lowest.png`
- Create: `docs/assets/prefecture-choropleth-missing-value.png`
- Create: `docs/assets/prefecture-choropleth-kanto-z9.png`
- Create: `docs/assets/prefecture-choropleth-kansai.png`
- Create: `docs/assets/prefecture-choropleth-regression-1024x768.png`
- Create: `docs/assets/prefecture-choropleth-regression-390x844.png`
- Create: `docs/assets/prefecture-choropleth-sources-license.png`
- Modify: `docs/public-launch.md`

### Step 7.0: Keep prefecture selection semantic and camera-neutral

Write a failing regression test first. With `focusTargetId` set to a `prefecture-boundary` region, selecting the prefecture must continue to update the semantic selection outside the canvas, but the canvas must not call `easeTo` or `fitBounds` and must preserve its current zoom/camera. Keep the existing focus behavior for representative-radius regions, points, and routes.

After the RED test proves the current automatic zoom, add the smallest canvas-side guard that suppresses focus only for `prefecture-boundary` selections. Update the existing selected-prefecture detail E2E so it first proves the selected URL keeps the overview camera, then uses actual pan and zoom controls to bring Tokyo into view before asserting the selected label, zoom-9 polygon absence, and invisible-click behavior. The E2E must not regain a programmatic or URL-triggered camera shortcut. Run the focused test, full unit suite, typecheck, production build, and prefecture Playwright acceptance. Commit this behavior fix separately before recapturing evidence, then run fresh spec and code-quality reviews for the fix.

```bash
npx vitest run components/__tests__/map-canvas-layer-config.test.tsx
npm test
npm run typecheck
npm run build
npm run test:e2e:prefecture
git diff --check
git add components/JapanOperationsMapCanvas.tsx components/__tests__/map-canvas-layer-config.test.tsx e2e/prefecture-map.spec.ts
git commit -m "fix: preserve camera on prefecture selection"
```

### Step 7.1: Capture the fixture-only missing state, then start one production-like server

The named Playwright test writes `docs/assets/prefecture-choropleth-missing-value.png` only because this release-evidence command explicitly sets `PREFECTURE_EVIDENCE_DIR=docs/assets`; its configured web server command remains exactly `NEXT_PUBLIC_MAP_ACCEPTANCE_FIXTURES=1 npm run dev -- --hostname 127.0.0.1 --port 3101` with `reuseExistingServer: false`. The test must reject an evidence directory outside the repository and must otherwise use `testInfo.outputPath(...)` when the variable is absent.

```bash
PREFECTURE_EVIDENCE_DIR=docs/assets npm run test:e2e:prefecture -- --grep "missing-value evidence"
lsof -nP -iTCP:3101 -sTCP:LISTEN
```

Expected after Playwright cleanup: no port 3101 listener. Now build without the fixture environment variable and start the production-like server:

```bash
npm run build
npm run start -- --hostname 127.0.0.1 --port 3100
```

Use the in-app browser only after confirming port 3100 is owned by this worktree. Evaluate the map-container diagnostics and prove the test-only missing-value mutation method is absent in this production build. Do not touch other local ports or servers.

The read-only diagnostics must expose bounded MapLibre readiness in addition to rendered feature counts. Write a failing test first, then add a `tilesLoaded` result backed by `map.areTilesLoaded()` without adding a new global hook or production mutation. The automated E2E must poll this readiness together with its existing rendered-label requirements. The production evidence harness must wait for remote tile completion, 47 rendered overview labels, and the selected-label expectation before every relevant screenshot; arbitrary sleep alone is not acceptance evidence.

Run the focused unit test, full unit suite, typecheck, production build, and prefecture Playwright acceptance. Commit the readiness change separately, then run fresh spec and code-quality reviews before recapturing evidence.

```bash
npx vitest run components/__tests__/map-canvas-layer-config.test.tsx
npm test
npm run typecheck
npm run build
npm run test:e2e:prefecture
git diff --check
git add components/JapanOperationsMapCanvas.tsx components/__tests__/map-canvas-layer-config.test.tsx e2e/prefecture-map.spec.ts
git commit -m "fix: wait for prefecture map readiness"
```

### Step 7.2: Verify required desktop viewports

At `?theme=rice&layer=rice-harvest`, verify 1280x800, 1440x900, and 1680x900:

- 47 region shapes are present;
- exactly 47 unique full prefecture names render;
- no label overlaps or viewport/panel clipping are visible;
- Hokkaido, Okinawa, islands, Kanto, and Kansai remain legible;
- choropleth is subordinate to borders/names;
- no centered `精密表示` window exists;
- no application-origin console errors exist.

At every desktop viewport, run the container diagnostics backed by real MapLibre `queryRenderedFeatures` and record 47 unique rendered labels, zero collisions, and zero clipping against the map edge and permanent UI exclusion zones. Compare those results with `detectPrefectureLabelLayoutCollisions`; if visual, real-rendered, and calculated results disagree, correct anchors/tests rather than waiving the issue.

### Step 7.3: Verify selection and detailed zoom

Select Niigata and one dense-region prefecture:

- URL and inspector update to the same semantic ID;
- selected border and label dominate through overview zoom;
- zoom 7 exposes at least `新潟市` and `長岡市` (or the exact stable two-city labels observed from the retained basemap) above the fading polygon;
- Kanto zoom 9 exposes at least two stable city/ward labels and recognizable road/corridor linework; the retained Esri Light Gray reference does not publish a stable road name or route shield at this scale, so `v0.6.0` does not claim one;
- by zoom 9, generalized fill/borders are absent and invisible polygon clicks do not change selection;
- zoom/pan/recenter/keyboard controls still work;
- the map keeps one camera and no automatic selection zoom.

Capture separate Kanto and Kansai evidence. Verify the highest seeded value (`prefecture:niigata`, 514,100 tons), lowest seeded value (`prefecture:tokyo`, 465 tons), and a synthetic missing-value prefecture. The missing state must be produced only through the Playwright/local acceptance-fixture gate and must never be enabled in the production build. It must show neutral fill plus border and label, never zero or a circle.

Record the exact stable basemap labels observed in `docs/public-launch.md` acceptance notes. Raster labels are verified visually; do not invent queryable text assertions for pixels.

### Step 7.4: Run smaller-viewport regression smoke

At 1024x768 and 390x844, capture the two named regression images and verify:

- no crash, horizontal corruption, or misleading circle fallback;
- shared boundary correctness remains;
- 47-label desktop cartography is not forced into the smaller layout;
- no claim of Mobile redesign completion is made.

### Step 7.5: Capture evidence and clean up

Capture all eleven named PNGs, validate each expected dimension/content, and verify their hashes are not accidental duplicates. Use the exact Playwright/local fixture command above only for `prefecture-choropleth-missing-value.png`; use the clean production-like build for all other evidence. Then stop every acceptance server and prove ports 3100 and 3101 have no listener.

```bash
lsof -nP -iTCP:3100 -sTCP:LISTEN
lsof -nP -iTCP:3101 -sTCP:LISTEN
```

Expected after cleanup: no output.

```bash
git add docs/assets/prefecture-choropleth-*.png docs/public-launch.md
git commit -m "docs: add prefecture map visual evidence"
```

The implementer commits and self-reviews all evidence first. Then run the visual-evidence spec reviewer against the full eleven-image matrix and acceptance logs, fix/recapture/commit and re-review until approved. Only after spec approval run the code/evidence-quality reviewer; fix/commit and re-review until approved.

---

## Task 8: Version the release candidate, run full verification, and review the whole change

**Files:**

- Modify: `package.json`
- Modify: `package-lock.json`
- Modify as needed: `README.md`
- Modify as needed: `README.ja.md`
- Modify as needed: `docs/public-launch.md`
- Modify: `app/layout.tsx`
- Create: `app/__tests__/release-marker.test.tsx`
- Modify: `.github/workflows/ci.yml`
- Review: all changed files.

### Step 8.1: Add an observable release marker with a RED test

Write `app/__tests__/release-marker.test.tsx` first. It renders `RootLayout` with a test `NEXT_PUBLIC_RELEASE_SHA` and requires `<meta name="release-sha">` to contain it and `<meta name="release-version">` to equal `package.json.version`.

```bash
npx vitest run app/__tests__/release-marker.test.tsx
```

Expected: FAIL because the markers do not exist. Then add the two meta tags in `app/layout.tsx`. In the GitHub Actions deploy step, set `NEXT_PUBLIC_RELEASE_SHA: ${{ github.sha }}` for the OpenNext build/deploy command so the live HTML is tied to the exact workflow SHA. The local/manual fallback command is `NEXT_PUBLIC_RELEASE_SHA=$(git rev-parse HEAD) npm run deploy`.

### Step 8.2: Bump and verify the complete release candidate

```bash
npm version 0.6.0 --no-git-tag-version
npm test
npm run typecheck
npm run build
npx playwright test e2e/prefecture-map.spec.ts
npm run build:prefecture-boundaries
git diff --exit-code -- data/geo/japan-prefectures-natural-earth-5.1.1.geojson data/geo/japan-prefectures-natural-earth-5.1.1.provenance.json
git diff --check
git status --short
```

Expected:

- all tests pass;
- typecheck passes;
- production build passes;
- real-browser acceptance passes at all three desktop viewports and zoom 9;
- generated artifacts are deterministic;
- no whitespace errors;
- all current release surfaces and package metadata say `v0.6.0` while historical PRD records remain historical;
- only intended release changes remain.

Do not claim the npm audit baseline is resolved. Report the existing install audit count separately unless this implementation introduces a new dependency vulnerability.

### Step 8.3: Commit and self-review the versioned release candidate

```bash
git add package.json package-lock.json README.md README.ja.md docs/public-launch.md app/layout.tsx app/__tests__/release-marker.test.tsx .github/workflows/ci.yml
git commit -m "chore: release v0.6.0"
git show --stat --oneline HEAD
git status --short
```

The implementer self-reviews the committed release-candidate diff and commits any fix before reviewers start.

### Step 8.4: Run final spec and code-quality review in order

Give the fresh spec reviewer:

- canonical spec path;
- implementation plan path;
- full branch diff from `c929715`;
- versioned release-candidate commit;
- verification outputs;
- the complete eleven-image evidence matrix, real-rendered query logs for all three desktop viewports and zoom 9, and smaller-viewport smoke results.

Require line-by-line spec compliance and explicit release readiness. The same implementer commits fixes and the spec reviewer re-reviews until approved. Only then dispatch the fresh code-quality/whole-change reviewer with the final base/head SHAs; the implementer commits fixes, reruns affected and full gates, and the quality reviewer re-reviews until approved.

### Step 8.5: Confirm clean reviewed branch history

```bash
git status --short
git log --oneline --decorate c929715..HEAD
```

Expected: clean worktree and a fully versioned, independently approved `v0.6.0` release-candidate HEAD. No external push occurs before both review stages approve this exact SHA.

---

## Task 9: Publish, deploy, verify production, and review the release state

**Files:** No planned repository edits. Any live failure that requires a repository change returns to a fresh implementation task and repeats Task 8 review/verification before republishing.

The fresh release-operator subagent receives the exact reviewed release SHA and performs the following commands sequentially. It must stop on remote divergence, unrelated root-worktree changes, CI failure, or live mismatch and report `BLOCKED`/`DONE_WITH_CONCERNS` rather than force progress.

### Step 9.1: Push the development branch and verify its SHA

```bash
RELEASE_SHA=$(git rev-parse HEAD)
git push -u origin codex/prefecture-boundary-choropleth
test "$(git ls-remote origin refs/heads/codex/prefecture-boundary-choropleth | cut -f1)" = "$RELEASE_SHA"
```

Verify the remote branch SHA matches local HEAD. This is the development-repository checkpoint.

### Step 9.2: Publish the reviewed SHA to the distribution branch

The repository currently uses GitHub `origin/main` as the public distribution source and GitHub Actions as the production deploy path. Re-fetch and verify no unexpected remote divergence before integration:

```bash
git fetch origin
git log --oneline --left-right --cherry-pick origin/main...HEAD
```

`main` is checked out in the repository's root worktree, so do not attempt to switch this feature worktree to `main`. First verify that the root worktree has no unrelated user changes. If `origin/main` has not diverged beyond reviewed work and root `main` is the reviewed base, fast-forward it from the root worktree and push from there. If either worktree has unexpected changes, stop and preserve them; if remote `main` advanced, rebase/merge the feature in its own worktree, rerun verification/review, and only then integrate. Never bridge or overwrite user changes.

```bash
git -C /Users/louistoyozaki/Documents/GitHub/jp-strategic-dependency-graph status --short --branch
git -C /Users/louistoyozaki/Documents/GitHub/jp-strategic-dependency-graph merge --ff-only codex/prefecture-boundary-choropleth
git -C /Users/louistoyozaki/Documents/GitHub/jp-strategic-dependency-graph push origin main
```

Never force-push.

### Step 9.3: Locate and watch CI/deployment for the exact SHA

Use fresh GitHub workflow status for the pushed `main` SHA. Require the `verify` and `deploy` jobs to succeed:

```bash
RUN_ID=""
for attempt in {1..12}; do
  RUN_ID=$(gh run list --workflow CI --branch main --limit 30 --json databaseId,headSha,status,conclusion,url --jq ".[] | select(.headSha == \"$RELEASE_SHA\") | .databaseId" | head -n 1)
  test -n "$RUN_ID" && break
  sleep 5
done
test -n "$RUN_ID"
gh run watch "$RUN_ID" --exit-status
gh run view "$RUN_ID" --json headSha,status,conclusion,url,jobs
```

Verify `headSha == RELEASE_SHA`, workflow conclusion is `success`, and both `verify` and `deploy` jobs succeeded. If CI fails, use systematic debugging, fix on the feature branch, rerun the complete Task 8 review/verification on the new SHA, and publish that reviewed SHA.

Do not run the manual Cloudflare deploy while the normal workflow is healthy. Use `npm run deploy` only as the documented fallback when GitHub Actions is unavailable or failed for infrastructure reasons, and verify Cloudflare authentication before mutation.

### Step 9.4: Complete full live production acceptance before tagging

Open `https://economic-security.quadrillionaaa.com/?theme=rice&layer=rice-harvest` in a fresh browser state and verify:

- `<meta name="release-sha">` equals `RELEASE_SHA` and `<meta name="release-version">` equals `0.6.0`;
- the successful GitHub Actions run has `headSha == RELEASE_SHA`, its deploy job succeeded, and the live marker therefore ties the Cloudflare output to the reviewed SHA;
- 47 generalized regions and 47 desktop names render;
- Niigata and dense-region selection update URL/inspector;
- zoom 7/9 fade and context behavior match acceptance;
- Natural Earth attribution and `/sources-license` rights/limitation text are live;
- e-Stat alone has the official badge;
- no app-origin console errors, failed critical assets, or misleading circle fallback;
- `package.json`, remote feature branch, remote `main`, deployed SHA marker, deployed version marker, and public copy all agree on the reviewed `v0.6.0` candidate.

If any live check fails, do not create `v0.6.0`. Diagnose, fix, rerun Task 8's full verification and two-stage review on the new SHA, republish, and repeat the complete live acceptance.

### Step 9.5: Create and verify the immutable release only after live acceptance

```bash
git tag -a v0.6.0 -m "Japan Resilience Map v0.6.0" "$RELEASE_SHA"
git push origin v0.6.0
gh release create v0.6.0 --repo Oranquelui/japan-economic-security-globe --target "$RELEASE_SHA" --title "Japan Resilience Map v0.6.0" --notes-file docs/public-launch.md
test "$(git rev-list -n 1 v0.6.0)" = "$RELEASE_SHA"
gh release view v0.6.0 --repo Oranquelui/japan-economic-security-globe --json tagName,targetCommitish,name,url,isDraft,isPrerelease
```

The GitHub Release uses the accurate short/Japanese copy in `docs/public-launch.md`; it must not claim authoritative boundary precision or Mobile completion. Verify the release is neither draft nor prerelease. Do not move or recreate `v0.6.0` after it is pushed. If a code defect is discovered after this point, leave `v0.6.0` immutable and prepare a separately reviewed `v0.6.1` patch release.

### Step 9.6: Self-review and two-stage review of release state

The release operator self-reviews commands, SHAs, workflow output, tag, GitHub Release, Cloudflare deployment, browser diagnostics, console/network results, and live screenshots. Then:

1. dispatch a fresh release-spec reviewer to verify every Task 9 publication and live acceptance requirement against external evidence;
2. fix/re-publish/re-verify through the appropriate implementation/release operator and re-review until spec-approved;
3. only then dispatch a fresh release-quality reviewer to audit SHA consistency, command evidence, failure handling, production quality, and absence of overclaims;
4. remediate and re-review until approved.

### Step 9.7: Final handoff record

Report the actual release commit SHA, CI run, deployment result, production verification time, and known non-blocking warnings in the final operator handoff. Do not create a post-tag documentation commit that moves `main` beyond the verified `v0.6.0` release. A separate generic `handoff.md` is not required because the canonical spec, this implementation plan, the tagged release note, and the final verified operator report form the durable handoff set.

---

## Completion criteria

The work is complete only when all are true:

- the user-approved polygon/border/name design is live;
- no `精密表示` inset exists;
- all 47 geometries, entity joins, and desktop labels pass automated and visual checks;
- detailed zoom cannot hit-test invisible generalized polygons;
- official e-Stat statistic and non-official Natural Earth geometry are visibly distinct;
- source/license/provenance/limitation evidence is reachable from all required routes;
- point-native and non-prefecture regional layers retain their semantics;
- Mobile redesign remains explicitly deferred and regression-clean;
- full tests, typecheck, build, determinism, CI, deployment, and live-site checks pass;
- development branch, public `main`, tag, GitHub Release, version metadata, and production site agree on `v0.6.0`.
