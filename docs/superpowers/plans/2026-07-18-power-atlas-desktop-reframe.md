# Power Atlas Desktop Surface Reframe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Reframe the desktop Japan Resilience Map into a map-dominant workspace with a compact scope-and-layer pane on the left, one contextual inspector on the right, and signals/comparison available only as intentional secondary views.

**Architecture:** Keep the semantic graph and official-source pipeline unchanged. Add a presentation registry that turns each theme into a scope summary and user-meaningful layers, derive the existing MapLibre render mode from the selected semantic layer, and normalize selected entities, observations, and flows into one inspector model. The existing mobile tree stays behaviorally unchanged and is not redesigned in this delivery.

**Tech Stack:** Next.js 16, React 19, TypeScript 5.8, Tailwind CSS, MapLibre GL 5, Vitest 3, Testing Library.

**Delivery status (2026-07-18):** Tasks 1–8 and P0–P3 are implemented and verified on `codex/power-atlas-desktop-reframe`. Product-doc base: `9e32d82`. Pre-documentation delivery head: `c6a06cf487a8e0a26acbce114c920f58f9d15979`. PR: **not opened / awaiting explicit authorization**. Mobile redesign remains deferred and is not complete.

---

## 0. Authoritative inputs and delivery boundary

Read these files before making implementation changes:

- docs/product/2026-07-13-frontend-watchboard-ia-prd.md, especially sections 11–18.
- docs/product/2026-07-13-estat-spine-handoff-prd.md, especially section 12.
- docs/product/2026-07-13-estat-spine-decision-memo.md for the official-statistics spine and Japan-first boundary.
- docs/official-source-registry.md and docs/official-source-registry.ja.md for source and attribution rules.

Target desktop composition:

~~~text
Desktop workspace >= xl (1280 px)

rail 72 px | scope + layers 320 px | dominant Japan map | inspector 360 px when open

Secondary state, never permanent chrome:
- signals: replaces the left pane body when explicitly opened
- comparison: opens a deliberate bottom drawer when explicitly opened
~~~

Design-evidence record: the 2026-07-18 [Lazyweb desktop map report](https://www.lazyweb.com/report/lazyweb/9fa507c8-c9a3-4ec0-9e7a-dce3f0bfec6e/?source=create) supported reducing reading density, using a meaning-based layer shelf, keeping the map central, and opening the inspector on demand. Its contrarian suggestion to remove the left pane entirely is not adopted: this product must keep scope, period, unit, legend, and official-source context legible beside the map.

### In scope

- Desktop information architecture and the xl desktop-workspace layout.
- One selected-object inspector.
- Compact scope summary.
- Semantic layer deck for every existing theme, with a richer four-layer rice contract.
- Rice magnitude layer as the default desktop map presentation.
- Legend, unit, period, missing-data language, source disclosure, and lightweight hover feedback.
- Explicit signals and comparison views.
- Backward-compatible query-string migration.
- Keyboard, focus, and screen-reader behavior for changed desktop surfaces.
- Documentation, tests, typecheck, build, and desktop visual verification.

### Explicitly deferred

- **All mobile product and visual redesign.** Revisit only after the desktop phases in this plan are complete and accepted.
- Mobile semantic layer deck, mobile inspector redesign, and mobile secondary-view navigation.
- Brand/name changes, a Power Atlas clone, generic GIS authoring, arbitrary uploads, comprehensive infrastructure claims, or live-threat positioning.
- Ontology replacement, new external data ingestion, and production deployment without separate authorization.

Shared types and builders may be reused by both layouts. Move the workspace visibility boundary consistently from lg to xl so 1024–1279 px keeps the existing stacked/mobile composition instead of receiving a crushed four-column workspace. Apart from that breakpoint correction, the existing mobile controls, popup behavior, and content order remain unchanged. Mobile is a build-regression boundary, not a design acceptance surface.

## 1. Architecture decisions

### 1.1 State ownership

~~~ts
export type WorkspaceView = "map" | "signals" | "comparison";

export interface OperationsUrlState {
  themeId: ThemeId;
  selectedId: string | null;
  layerId: SemanticLayerId;
  mapModeOverride: OperationMapMode | null;
  workspaceView: WorkspaceView;
}
~~~

- themeId, selectedId, layerId, and workspaceView are product state.
- mapModeOverride exists only for legacy mode= URLs and current mobile render-mode controls.
- Desktop uses mapModeOverride when present; otherwise it derives render mode from the semantic layer.
- Mobile uses mapModeOverride when present; otherwise it retains its current point default.
- Desktop layer changes set layerId and clear mapModeOverride.
- Mobile render-mode changes set mapModeOverride without redesigning mobile controls.
- New desktop URLs serialize layer= and view=. Legacy mode= URLs continue to parse.

The split is intentional: a bare URL opens desktop rice as harvest/choropleth while the deferred mobile surface keeps its existing point presentation. AppShell computes the two render props explicitly:

~~~ts
const desktopMapMode = mapModeOverride ?? activeLayer.renderMode;
const mobileMapMode = mapModeOverride ?? "point";
~~~

When mapModeOverride is non-null, both trees use the legacy/theme-wide map model. When it is null, desktop uses the active semantic model and mobile still uses the legacy/theme-wide model. resolveLegacyPresentation prevents unsupported choropleth overrides from surviving on themes without regional data.

### 1.2 Surface ownership

| Surface | Owns | Does not own |
|---|---|---|
| NavigationRail | Theme switching and left-pane visibility | Layer/render controls |
| ScopeContextPanel | Scope summary, semantic layers, legend, secondary entries | Long ranked lists |
| JapanMainMap | Map, zoom/recenter, lightweight hover | Long-form selected detail |
| ContextInspector | Exactly one selected object and official evidence | Theme navigation or ranked lists |
| SignalsPanel | Searchable ranked watch items | Default map context |
| ComparisonPanel | Comparable MetricSeries rows with one unit/period/source contract | Ranked signal inbox or permanent chrome |

OperationsSignalTable remains available only in the deferred mobile tree during this delivery; it is not the new desktop comparison model.

### 1.3 Data discipline

- Keep SemanticEntity, Observation, DependencyFlow, SourceDocument, and GraphEdge as the source of truth.
- Derive UI contracts in lib/presentation; do not add UI-only fields to seed semantic objects.
- Rice harvest uses properties.riceMainUseHarvestTonsR5 and source:estat-rice-prefecture-harvest-r5.
- The seed invariant is 47 prefectures and 6,610,315 total main-use harvest tons for R5.
- Keep normalized JapanMapRegion.value for visual intensity when data exists and use null when it does not; add raw display metadata.
- Missing values render neutrally and read データなし; never coerce missing to zero.
- The current regional geometry is a magnitude-bearing centroid marker, not a precise administrative polygon. Do not claim otherwise. True prefecture-boundary ingestion requires a separate licensed-data authorization.

### 1.4 Phased PR boundary

1. P0: presentation/URL contracts and one desktop inspector.
2. P1: scope summary and semantic layer deck.
3. P2: thematic map, legend, and hover.
4. P3: explicit signals/comparison, accessibility, docs, and release verification.

Do not begin a phase until the prior phase is green and reviewable.

## Task 1: Reconcile state and establish an isolated worktree

**Files:**

- Verify: docs/product/2026-07-13-frontend-watchboard-ia-prd.md
- Verify: docs/product/2026-07-13-estat-spine-handoff-prd.md
- Modify only if stale: docs/product/2026-07-13-estat-spine-handoff-prd.md
- Create: isolated worktree outside the current dirty main worktree

- [x] **Step 1: Preserve user-owned changes**

Run:

~~~bash
git status --short
git branch --show-current
git rev-parse HEAD
git log -5 --oneline --decorate
~~~

At plan-writing time the repository is main at 192e12b with dirty product docs and untracked reference screenshots. Do not discard, stash, stage, or rewrite them without authorization.

- [x] **Step 2: Land or carry the docs decision safely**

Use one route based on live state:

~~~text
A. If product-doc changes are committed or merged, create the worktree from updated main.
B. If still uncommitted, ask the user to land the docs-only change first.
~~~

Do not begin implementation on dirty main and do not manually copy dirty files into a coding branch.

This repository's .gitignore intentionally ignores docs/superpowers. Because this file is the user-requested formal execution plan and the new worktree must be able to read it, include this one file deliberately in the docs-only commit with:

~~~bash
git add -f docs/superpowers/plans/2026-07-18-power-atlas-desktop-reframe.md
~~~

Do not unignore or bulk-add other local agent planning files.

- [x] **Step 3: Create the implementation worktree**

~~~bash
git fetch origin
git worktree add ../jp-strategic-dependency-graph-power-atlas -b codex/power-atlas-desktop-reframe origin/main
cd ../jp-strategic-dependency-graph-power-atlas
git status --short
~~~

Expected: branch codex/power-atlas-desktop-reframe and clean status.

- [x] **Step 4: Reconcile historical WP2 status**

~~~bash
git log --oneline -- data/seed/entities.json data/seed/sources.json components/AppShell.tsx
rg -n "riceMainUseHarvestTonsR5|source:estat-rice-prefecture-harvest-r5" data/seed lib components
~~~

If the handoff still presents WP2 not started as current rather than historical, update only status wording. Preserve the pause history and cite current commit evidence.

- [x] **Step 5: Record fresh baseline**

~~~bash
npm test
npm run typecheck
~~~

Expected at plan-writing time: 64 test files and 228 tests pass; Next typegen and tsc pass. If live counts differ but pass, record them. If either fails, stop and diagnose baseline first.

- [x] **Step 6: Commit any status-only correction separately**

~~~bash
git add docs/product/2026-07-13-estat-spine-handoff-prd.md
git commit -m "docs: reconcile e-Stat handoff status"
~~~

Skip when no correction is needed.

## Task 2: Add deterministic workspace presentation contracts

**Files:**

- Modify: types/presentation.ts
- Create: lib/presentation/workspace.ts
- Create: lib/presentation/__tests__/workspace.test.ts
- Modify: lib/presentation/map-canvas.ts
- Modify: lib/presentation/__tests__/map-canvas.test.ts

- [x] **Step 1: Write the failing rice contract test**

~~~ts
describe("buildWorkspacePresentation", () => {
  test("builds the R5 rice scope from 47 prefectures", () => {
    const graph = loadSeedGraph();
    const workspace = buildWorkspacePresentation(graph, getThemeView(graph, "rice"));

    expect(workspace.scope.coverage).toEqual({
      label: "対象地域",
      value: "47都道府県"
    });
    expect(workspace.scope.metrics).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "rice-harvest-total",
        value: "6,610,315",
        unit: "トン"
      })
    ]));
    expect(workspace.layers.map((layer) => layer.label)).toEqual([
      "収穫量",
      "価格",
      "在庫・政策",
      "物流・投入コスト"
    ]);
    expect(workspace.defaultLayerId).toBe("rice-harvest");
    expect(workspace.layers[0]).toMatchObject({
      renderMode: "choropleth",
      periodLabel: "令和5年産",
      sourceIds: ["source:estat-rice-prefecture-harvest-r5"]
    });
  });

  test.each(THEME_IDS)("has a meaningful layer for %s", (themeId) => {
    const graph = loadSeedGraph();
    const workspace = buildWorkspacePresentation(graph, getThemeView(graph, themeId));
    expect(workspace.layers.length).toBeGreaterThan(0);
    expect(workspace.layers.some((layer) =>
      ["地点", "集約", "地域塗り", "ルート"].includes(layer.label)
    )).toBe(false);
  });
});
~~~

Run:

~~~bash
npx vitest run lib/presentation/__tests__/workspace.test.ts
~~~

Expected: fail because builder and contracts do not exist.

- [x] **Step 2: Add focused contracts to types/presentation.ts**

~~~ts
export type WorkspaceView = "map" | "signals" | "comparison";

export type SemanticLayerId =
  | "rice-harvest"
  | "rice-price"
  | "rice-inventory-policy"
  | "rice-logistics-inputs"
  | "energy-supply"
  | "energy-price"
  | "energy-route"
  | "logistics-domestic"
  | "logistics-arrival"
  | "logistics-impact"
  | "regional-security-public-events"
  | "regional-security-impact"
  | "regional-security-route"
  | "defense-capability-budget"
  | "defense-sites"
  | "defense-dependencies"
  | "semiconductors-production"
  | "semiconductors-route"
  | "semiconductors-signals"
  | "water-fill-rate"
  | "water-sources"
  | "water-supply";

export interface ScopeSummaryMetric {
  id: string;
  label: string;
  value: string;
  unit?: string;
  periodLabel?: string;
  sourceIds: string[];
}

export interface ScopeSummary {
  title: string;
  description: string;
  coverage: { label: string; value: string };
  periodLabel: string;
  metrics: ScopeSummaryMetric[];
  sourceIds: string[];
}

export interface LayerLegend {
  kind: "continuous" | "categorical";
  title: string;
  unit?: string;
  minLabel?: string;
  maxLabel?: string;
  items?: Array<{ colorToken: string; label: string }>;
  missingLabel: "データなし";
}

export interface LayerDefinition {
  id: SemanticLayerId;
  themeId: ThemeId;
  label: string;
  description: string;
  renderMode: OperationMapMode;
  periodLabel: string;
  sourceIds: string[];
  legend: LayerLegend;
  available: boolean;
  content: LayerContentDefinition;
}

export type LayerContentDefinition =
  | {
      kind: "regional-metric";
      entityKind: "Prefecture" | "Reservoir";
      property: "riceMainUseHarvestTonsR5" | "latestFillRatePercent";
    }
  | { kind: "observations"; observationIds: string[] }
  | { kind: "flows"; flowIds: string[] | "theme" }
  | { kind: "entities"; entityKinds: EntityKind[] }
  | { kind: "live-logistics"; view: "domestic" | "arrival" | "impact" }
  | { kind: "theme-composite" };

export interface WorkspacePresentation {
  defaultLayerId: SemanticLayerId;
  scope: ScopeSummary;
  layers: LayerDefinition[];
}

export interface SelectionInspectorViewModel {
  detail: DetailViewModel;
  primaryMetric: {
    valueLabel: string;
    unitLabel?: string;
    periodLabel?: string;
  } | null;
}

export interface MetricSeriesPoint {
  id: string;
  label: string;
  value: number;
  unit: string;
  period: string;
  sourceIds: string[];
}
~~~

Import OperationMapMode, ThemeId, and EntityKind as types. Do not move semantic-domain interfaces.

- [x] **Step 3: Implement lib/presentation/workspace.ts**

Required exports:

~~~ts
export function buildWorkspacePresentation(
  graph: SemanticGraph,
  view: ThemeView
): WorkspacePresentation;

export function getLayerDefinition(
  themeId: ThemeId,
  layerId: string | null | undefined
): LayerDefinition | null;

export function getDefaultLayerDefinition(
  themeId: ThemeId
): LayerDefinition;

export function getLegacyLayerDefinition(
  themeId: ThemeId,
  mapMode: OperationMapMode
): LayerDefinition;

export function resolveLegacyPresentation(
  themeId: ThemeId,
  requestedMode: OperationMapMode
): {
  layer: LayerDefinition;
  mapModeOverride: OperationMapMode;
};

export function buildSelectionInspector(
  graph: SemanticGraph,
  id: string,
  detail: DetailViewModel
): SelectionInspectorViewModel;

export function buildMetricSeries(
  graph: SemanticGraph,
  themeId: ThemeId,
  layerId: SemanticLayerId
): MetricSeriesPoint[];
~~~

Rice rules:

~~~text
rice-harvest:
  mode choropleth
  content regional-metric Prefecture.riceMainUseHarvestTonsR5
  period 令和5年産
  source source:estat-rice-prefecture-harvest-r5
  series all Prefecture entities with numeric riceMainUseHarvestTonsR5

rice-price:
  mode point
  content observation:rice-price-signal-2026

rice-inventory-policy:
  mode point
  content observations rice-private-inventory-feb-2026 and rice-stockpile-policy-2026

rice-logistics-inputs:
  mode route
  content all rice flows
~~~

Use this exact non-rice registry order and default (first row per theme):

| Theme | Layer ID | Label | Mode | Content selector |
|---|---|---|---|---|
| energy | energy-supply | 供給拠点 | point | entities: Country, Terminal, Refinery |
| energy | energy-price | 輸入価格 | point | observation:lng-electricity-april-2026 |
| energy | energy-route | 供給ルート | route | all energy flows |
| logistics | logistics-domestic | 国内物流 | route | live-logistics domestic |
| logistics | logistics-arrival | 到着見込み | point | live-logistics arrival |
| logistics | logistics-impact | 物流影響 | choropleth | live-logistics impact |
| regional-security | regional-security-public-events | 公開事象 | point | both regional-security observations |
| regional-security | regional-security-impact | 影響観測 | point | observation:nk-missile-history-watch |
| regional-security | regional-security-route | 代表経路 | route | flow:nk-missile-history-japan-watch |
| defense | defense-capability-budget | 能力・予算 | point | all defense observations |
| defense | defense-sites | 拠点 | point | Facility and Organization entities |
| defense | defense-dependencies | 依存関係 | route | all defense flows |
| semiconductors | semiconductors-production | 生産・供給拠点 | point | Country, Facility, Organization entities |
| semiconductors | semiconductors-route | 供給ルート | route | all semiconductor flows |
| semiconductors | semiconductors-signals | 監視指標 | point | observation:semiconductor-policy-signal-2026 |
| water | water-fill-rate | 貯水率 | choropleth | Reservoir.latestFillRatePercent |
| water | water-sources | 水源 | point | Reservoir entities |
| water | water-supply | 供給関係 | point | observation:capital-lifeline-watch-2026 |

Mark missing-input layers available: false and disable them in UI. Legacy mode mapping chooses the first available layer with the same render mode. Cluster, route, and static may use the theme default plus the legacy/theme-wide model because each mode can still display theme-wide points. Choropleth is retained only when the theme has an available choropleth layer; otherwise resolveLegacyPresentation normalizes it to point plus the theme default so the map cannot open blank.

Implementation note: the delivered builder computes availability from the actual runtime workspace input, including live-logistics data. Registry metadata without runtime input is retained only for URL/capability parsing; it is not allowed to advertise a layer whose current workspace model has no usable feature.

buildSelectionInspector must use the already-resolved DetailViewModel supplied by AppShell; it must not call getDetailView internally. This preserves live-logistics:* selections, whose detail comes from buildLiveLogisticsDetail and is not stored in SemanticGraph. Selection metric rules:

~~~text
Observation -> value + localized unit + observation.period
Rice Prefecture -> riceMainUseHarvestTonsR5 + トン + 令和5年産
Flow -> magnitudeLabel + flow.period when magnitude exists
Other entity -> null; never fabricate a metric
Live logistics ID -> preserve the supplied detail and return null unless a typed live metric is already present
~~~

Use Intl.NumberFormat("ja-JP"). Centralize unit localization in the builder.

Add a test with id live-logistics:tanker-qatar-tokyo-bay and a supplied DetailViewModel fixture. Assert the builder returns that detail and does not throw even though the ID is absent from SemanticGraph.

- [x] **Step 4: Add raw region metadata without changing normalization**

Extend JapanMapRegion:

~~~ts
export type JapanMapRegion = {
  id: string;
  label: string;
  lat: number;
  lon: number;
  value: number | null;
  rawValue?: number;
  unit?: string;
  periodLabel?: string;
  sourceIds?: string[];
};
~~~

Rice receives rawValue, トン, 令和5年産, and the e-Stat source. Preserve the existing logarithmic normalization in value.

For regional-metric content, retain every in-scope coordinate-bearing entity of the requested kind. Entities with the property receive normalized value and rawValue; entities without it receive value: null and no rawValue. Geometry may use a fixed minimum display radius when value is null, but must not write zero into data or feature properties. Add a fixture test with one missing prefecture/reservoir and assert it remains in the model as value: null.

- [x] **Step 5: Run focused checks**

~~~bash
npx vitest run lib/presentation/__tests__/workspace.test.ts lib/presentation/__tests__/map-canvas.test.ts
npm run typecheck
~~~

Expected: pass.

- [x] **Step 6: Commit**

~~~bash
git add types/presentation.ts lib/presentation/workspace.ts lib/presentation/__tests__/workspace.test.ts lib/presentation/map-canvas.ts lib/presentation/__tests__/map-canvas.test.ts
git commit -m "feat: add semantic map workspace contracts"
~~~

## Task 3: Migrate URL state while preserving legacy links

**Files:**

- Modify: lib/presentation/url-state.ts
- Modify: lib/presentation/__tests__/url-state.test.ts
- Modify: app/_components/AppPage.tsx
- Modify: app/__tests__/app-page.test.tsx
- Modify: components/AppShell.tsx
- Modify: components/__tests__/app-shell-url-state.test.tsx

- [x] **Step 1: Write failing URL tests**

~~~ts
test("defaults rice to harvest with no legacy mode override", () => {
  expect(parseOperationsUrlState({})).toEqual({
    themeId: "rice",
    selectedId: null,
    layerId: "rice-harvest",
    mapModeOverride: null,
    workspaceView: "map"
  });
});

test("parses semantic layer and secondary view", () => {
  expect(parseOperationsUrlState({
    theme: "rice",
    layer: "rice-price",
    view: "signals",
    selected: "observation:rice-price-signal-2026"
  })).toMatchObject({
    layerId: "rice-price",
    mapModeOverride: null,
    workspaceView: "signals"
  });
});

test("maps a legacy mode link to the closest semantic layer", () => {
  expect(parseOperationsUrlState({
    theme: "rice",
    mode: "route"
  })).toMatchObject({
    layerId: "rice-logistics-inputs",
    mapModeOverride: "route"
  });
});

test("normalizes unsupported legacy choropleth to visible point content", () => {
  expect(parseOperationsUrlState({
    theme: "energy",
    mode: "choropleth"
  })).toMatchObject({
    layerId: "energy-supply",
    mapModeOverride: "point"
  });
});

test("serializes semantic state and omits defaults", () => {
  expect(serializeOperationsUrlState(DEFAULT_OPERATIONS_URL_STATE)).toBe("");
  expect(serializeOperationsUrlState({
    themeId: "rice",
    selectedId: null,
    layerId: "rice-price",
    mapModeOverride: null,
    workspaceView: "comparison"
  })).toBe("layer=rice-price&view=comparison");
});
~~~

Run:

~~~bash
npx vitest run lib/presentation/__tests__/url-state.test.ts app/__tests__/app-page.test.tsx
~~~

Expected: fail on missing fields and old point default.

- [x] **Step 2: Implement parsing precedence**

~~~text
1. Validate theme; default rice.
2. If layer is valid for theme, choose it and leave mapModeOverride null.
3. Else if mode is valid, call resolveLegacyPresentation. Preserve cluster, route, and static; preserve choropleth only for themes with an available choropleth layer; otherwise normalize to point. Store the resolved override and layer.
4. Else use the theme default layer and a null override.
5. Accept only map, signals, comparison for view.
6. Preserve non-empty selected.
~~~

Serialization:

~~~text
- omit rice theme
- omit the default layer
- serialize a non-default semantic layer when mapModeOverride is null
- when mapModeOverride is non-null, serialize mode and omit layer so parsing cannot prefer the layer over the compatibility override
- omit view=map
- preserve selected
~~~

Use the workspace registry, not duplicate hard-coded validation sets.

- [x] **Step 3: Update explicit URL detection**

In app/_components/AppPage.tsx:

~~~ts
const hasExplicitUrlState =
  ["theme", "layer", "mode", "view", "selected"].some((key) => {
    const value = resolvedSearchParams[key];
    return Array.isArray(value) ? value.some(Boolean) : Boolean(value);
  });
~~~

Test layer, view, and legacy mode individually.

- [x] **Step 4: Migrate AppShell state in the same task**

Do not leave AppShell consuming the removed mapMode field. Before this task can be green:

~~~ts
const [layerId, setLayerId] = useState(resolvedInitialState.layerId);
const [mapModeOverride, setMapModeOverride] = useState(
  resolvedInitialState.mapModeOverride
);
const [workspaceView, setWorkspaceView] = useState(
  resolvedInitialState.workspaceView
);
const workspace = buildWorkspacePresentation(graph, view);
const activeLayer =
  getLayerDefinition(themeId, layerId) ??
  getDefaultLayerDefinition(themeId);
const desktopMapMode = mapModeOverride ?? activeLayer.renderMode;
const mobileMapMode = mapModeOverride ?? "point";
~~~

For this transitional P0 state, keep the existing desktop mechanical controls mounted and have their handler call setMapModeOverride(mode). Pass desktopMapMode to the desktop map and mobileMapMode to the mobile map. Task 5 replaces the desktop controls with the semantic deck and clears the override on semantic selection.

Route both temporary desktop controls and existing mobile controls through resolveLegacyPresentation(themeId, mode): update layerId to the returned layer.id and mapModeOverride to the returned compatible override. This prevents a user-selected unsupported choropleth from producing an empty map.

When homepageLead overrides the initial theme and that theme differs from initialUrlState.themeId, resolve layerId from getDefaultLayerDefinition(homepageLead.themeId) rather than carrying an invalid rice layer into another theme. Keep mapModeOverride null for an auto-lead. Add this case to the existing homepage-ranking AppShell test.

Every serializeOperationsUrlState call and effect dependency uses layerId, mapModeOverride, and workspaceView. On theme change choose getDefaultLayerDefinition(nextThemeId).id and clear the override. Update AppShell URL tests so this task typechecks and passes before Task 4 begins.

- [x] **Step 5: Verify and commit**

~~~bash
npx vitest run lib/presentation/__tests__/url-state.test.ts app/__tests__/app-page.test.tsx components/__tests__/app-shell-url-state.test.tsx
npm run typecheck
git add lib/presentation/url-state.ts lib/presentation/__tests__/url-state.test.ts app/_components/AppPage.tsx app/__tests__/app-page.test.tsx components/AppShell.tsx components/__tests__/app-shell-url-state.test.tsx
git commit -m "feat: add semantic layer URL state"
~~~

## Task 4: Make the inspector the only detailed desktop selection surface (P0)

**Files:**

- Create: components/ContextInspector.tsx
- Create: components/__tests__/context-inspector.test.tsx
- Modify: components/EvidencePanel.tsx
- Modify: components/AppShell.tsx
- Modify: components/JapanMainMap.tsx
- Modify: components/__tests__/app-shell-evidence-wiring.test.tsx
- Modify: components/__tests__/app-shell-url-state.test.tsx
- Modify: components/__tests__/japan-main-map-popup.test.tsx
- Preserve: components/MapDetailPopup.tsx
- Preserve: components/__tests__/map-detail-popup.test.tsx

- [x] **Step 1: Write one-surface tests first**

Desktop integration must assert absence of duplication:

~~~ts
test("opens one desktop inspector and no anchored map detail", async () => {
  render(<AppShell graph={loadSeedGraph()} />);

  const desktop = screen.getByTestId("layout-desktop-workspace");
  expect(within(desktop).queryByTestId("context-inspector")).toBeNull();

  await userEvent.click(
    within(desktop).getByRole("button", { name: "新潟県を選択" })
  );

  expect(await within(desktop).findByTestId("context-inspector")).toBeTruthy();
  expect(within(desktop).queryByTestId("map-detail-popup-anchor")).toBeNull();
  expect(within(desktop).queryByTestId("map-detail-open-evidence")).toBeNull();
  expect(within(desktop).getByText(/514,100/)).toBeTruthy();
  expect(within(desktop).getByText(/令和5年産/)).toBeTruthy();
});
~~~

Mock JapanMainMap in this integration file with a button named 新潟県を選択 that calls onSelect("prefecture:niigata"). Scope assertions to the desktop root because jsdom mounts the separate mobile tree too.

- [x] **Step 2: Extract ContextInspector**

Props:

~~~ts
interface ContextInspectorProps {
  inspector: SelectionInspectorViewModel;
  evidenceGraph: EvidenceGraphViewModel;
  onClose: () => void;
  onSelect: (id: string) => void;
  rankingExplanation?: RankingExplanationViewModel | null;
  selectedId: string;
  statusPalette: StatusPalette;
  themePalette: ThemePalette;
  themeTitle: string;
}
~~~

Render primary value/unit/period near the title, then tabs 概要, 出典, 関連. Preserve source links, freshness/trust, why-it-matters, related selection, ranking explanation, and evidence graph. Use data-testid=context-inspector and aria-label=選択中の詳細と根拠.

EvidencePanel remains a compatibility wrapper for deferred mobile. It may reuse the body, but mobile DOM order and collapsible=false behavior do not change.

- [x] **Step 3: Remove only the desktop popup branch**

In JapanMainMap.tsx:

- Keep the fixed lg:hidden MapDetailPopup for mobile.
- Delete the hidden lg:block anchored branch and getDesktopPopupStyle.
- Keep MapDetailPopup.tsx and its tests.

The AppShell desktop call passes no detailPopup and no onOpenEvidence. The mobile call remains unchanged.

- [x] **Step 4: Wire selection to one right inspector**

In AppShell.tsx:

~~~text
- desktop ContextInspector mounts only when isEvidenceOpen
- every desktop selection opens it
- URL-selected objects open it
- homepage auto-lead may focus without opening it
- closing removes the inspector but preserves theme/layer
- no 56 px collapsed inspector strip; closed width is 0
- map right inset tracks actual inspector width
~~~

Keep the current AppShell detail resolution first:

~~~ts
const detail = liveLogisticsDetailItem
  ? buildLiveLogisticsDetail(graph, liveLogisticsDetailItem)
  : getDetailView(graph, activeId);
const inspector = buildSelectionInspector(graph, activeId, detail);
~~~

This ordering is required for live-logistics:* selections.

- [x] **Step 5: Verify and commit P0**

~~~bash
npx vitest run components/__tests__/context-inspector.test.tsx components/__tests__/app-shell-evidence-wiring.test.tsx components/__tests__/app-shell-url-state.test.tsx components/__tests__/japan-main-map-popup.test.tsx components/__tests__/map-detail-popup.test.tsx
npm run typecheck
git add components/ContextInspector.tsx components/EvidencePanel.tsx components/AppShell.tsx components/JapanMainMap.tsx components/__tests__/context-inspector.test.tsx components/__tests__/app-shell-evidence-wiring.test.tsx components/__tests__/app-shell-url-state.test.tsx components/__tests__/japan-main-map-popup.test.tsx
git commit -m "feat: consolidate desktop selection into one inspector"
~~~

## Task 5: Replace the desktop default inbox with scope and layers (P1)

**Files:**

- Create: components/ScopeContextPanel.tsx
- Create: components/SemanticLayerDeck.tsx
- Create: components/MapLegend.tsx
- Create: components/__tests__/scope-context-panel.test.tsx
- Create: components/__tests__/semantic-layer-deck.test.tsx
- Create: components/__tests__/map-legend.test.tsx
- Modify: components/AppShell.tsx
- Modify: components/__tests__/app-shell-url-state.test.tsx
- Modify: lib/presentation/map-canvas.ts
- Modify: lib/presentation/__tests__/map-canvas.test.ts
- Preserve: components/MapInboxPanel.tsx
- Preserve: components/__tests__/map-inbox-structure.test.tsx

- [x] **Step 1: Write component tests**

~~~ts
test("shows the rice scope before ranked content", () => {
  const graph = loadSeedGraph();
  const view = getThemeView(graph, "rice");
  const workspace = buildWorkspacePresentation(graph, view);
  render(<ScopeContextPanel
    activeLayerId="rice-harvest"
    onLayerChange={vi.fn()}
    onOpenComparison={vi.fn()}
    onOpenSignals={vi.fn()}
    sources={view.sources}
    themePalette={getThemePalette("rice")}
    workspace={workspace}
  />);
  expect(screen.getByText("47都道府県")).toBeTruthy();
  expect(screen.getByText("6,610,315")).toBeTruthy();
  expect(screen.getByText("令和5年産")).toBeTruthy();
  expect(
    screen.getByRole("button", { name: "収穫量" }).getAttribute("aria-pressed")
  ).toBe("true");
  expect(screen.queryByText("監視インボックス")).toBeNull();
});

test("selects by semantic layer id", async () => {
  const onLayerChange = vi.fn();
  render(<SemanticLayerDeck
    activeLayerId="rice-harvest"
    layers={riceWorkspace.layers}
    onLayerChange={onLayerChange}
    themePalette={getThemePalette("rice")}
  />);
  await userEvent.click(screen.getByRole("button", { name: "価格" }));
  expect(onLayerChange).toHaveBeenCalledWith("rice-price");
});
~~~

Expected first run: fail.

- [x] **Step 2: Implement SemanticLayerDeck**

- Buttons use aria-pressed.
- Unavailable layers are disabled with 準備中 or データなし.
- Labels and descriptions are semantic; render modes are not primary copy.
- Arrow keys move within the group; Enter/Space activates.
- Use existing palette tokens.

- [x] **Step 3: Implement MapLegend**

- Continuous: min/max, unit, period, and separate neutral missing swatch.
- Categorical: ordered labeled swatches.
- Source disclosure: official source label and real URL.
- Meaning never depends on color alone.

- [x] **Step 4: Implement ScopeContextPanel**

Props:

~~~ts
interface ScopeContextPanelProps {
  activeLayerId: SemanticLayerId;
  onLayerChange: (id: SemanticLayerId) => void;
  onOpenComparison: () => void;
  onOpenSignals: () => void;
  sources: SourceDocument[];
  themePalette: ThemePalette;
  workspace: WorkspacePresentation;
}
~~~

Order:

~~~text
1. theme and scope description
2. coverage, period, 2–4 headline metrics
3. semantic layer deck
4. active legend and official source
5. シグナルを見る and 比較する
~~~

Never render the 47-row list in this default desktop pane.

- [x] **Step 5: Wire AppShell**

~~~ts
const workspace = buildWorkspacePresentation(graph, view);
const activeLayer =
  getLayerDefinition(themeId, layerId) ??
  getDefaultLayerDefinition(themeId);

function handleLayerChange(nextLayerId: SemanticLayerId) {
  const next = getLayerDefinition(themeId, nextLayerId);
  if (!next?.available) return;
  setLayerId(next.id);
  setMapModeOverride(null);
}
~~~

Compute desktopMapMode as mapModeOverride ?? activeLayer.renderMode and mobileMapMode as mapModeOverride ?? "point". On theme change: clear selection/search/inspector, choose the new theme default, clear mapModeOverride, and return view to map. Replace only the desktop map-view pane. Preserve the mobile MapInboxPanel.

Build separate models for the two workspace trees. Desktop receives the active semantic definition; deferred mobile receives null to preserve the current theme-wide feature set:

~~~ts
const legacyMapModel = buildJapanMapCanvasModel(
  graph,
  view,
  activeId,
  null,
  liveLogistics
);
const semanticDesktopMapModel = buildJapanMapCanvasModel(
  graph,
  view,
  activeId,
  activeLayer,
  liveLogistics
);
const desktopMapModel = mapModeOverride
  ? legacyMapModel
  : semanticDesktopMapModel;
const mobileMapModel = legacyMapModel;
~~~

Change the builder's layer parameter to LayerDefinition | null. A non-null LayerDefinition.content controls semantic candidates before geometry is produced; null executes the exact pre-reframe theme-wide model behavior:

~~~text
regional-metric:
  retain all coordinate-bearing entities of entityKind
  normalize entities with the numeric property
  keep missing entities as value null / no rawValue

observations:
  map only listed observations; use a coordinate-bearing subject when present
  otherwise create one Japan-anchored point per observation whose selectionId is the observation ID

flows:
  route-scope only the listed flows or the theme's flows

entities:
  map only view entities matching the listed kinds

live-logistics:
  select the existing live points/routes/impact regions for the named view

theme-composite:
  preserve the current theme-wide fallback

null layer:
  preserve the same current theme-wide fallback for the deferred mobile tree
~~~

Update every direct builder call in tests and production code in this same task; no old four-argument call may remain at the P1 checkpoint.

The synthetic national observation point uses country:japan coordinates, the localized observation label, its value/unit/period as metaLabel, and selectionId=observation.id. Thus rice-price and rice-inventory-policy produce different selectable feature IDs even though both use point rendering. Add map-canvas tests proving their GeoJSON/model contents differ.

Pass desktopMapModel only to the xl desktop JapanMainMap and mobileMapModel only to the stacked/mobile JapanMainMap. When a legacy/mobile override is active, desktopMapModel is also legacy/theme-wide so its point/cluster/route/static visibility matches its features. Add a visible-feature regression test proving bare-URL rice has desktop regions and mobile points, so the mobile point mode is not blank.

- [x] **Step 6: Update AppShell tests**

Assert:

- default rice is rice-harvest and choropleth;
- bare-URL mobile remains point mode;
- left pane shows the four rice semantic labels;
- desktop mechanical map controls are absent;
- choosing 価格 produces point mode and layer=rice-price;
- 価格 and 在庫・政策 produce different observation selection IDs;
- every available layer produces at least one feature visible in its configured mode;
- bare-URL rice mobile point mode receives a non-empty points array;
- every theme × valid legacy mode resolves to a mode/model combination with at least one visible point, cluster input, route/point, or region;
- theme changes choose the theme default;
- mobile MapInboxPanel remains mounted.

- [x] **Step 7: Verify and commit P1**

~~~bash
npx vitest run components/__tests__/scope-context-panel.test.tsx components/__tests__/semantic-layer-deck.test.tsx components/__tests__/map-legend.test.tsx components/__tests__/app-shell-url-state.test.tsx components/__tests__/map-inbox-structure.test.tsx lib/presentation/__tests__/map-canvas.test.ts
npm run typecheck
git add components/ScopeContextPanel.tsx components/SemanticLayerDeck.tsx components/MapLegend.tsx components/AppShell.tsx components/__tests__/scope-context-panel.test.tsx components/__tests__/semantic-layer-deck.test.tsx components/__tests__/map-legend.test.tsx components/__tests__/app-shell-url-state.test.tsx lib/presentation/map-canvas.ts lib/presentation/__tests__/map-canvas.test.ts
git commit -m "feat: add desktop scope and semantic layer pane"
~~~

## Task 6: Make the thematic map legible (P2)

**Files:**

- Modify: types/presentation.ts
- Modify: lib/presentation/map-canvas.ts
- Modify: components/JapanOperationsMapCanvas.tsx
- Modify: components/JapanMainMap.tsx
- Create: components/MapHoverCard.tsx
- Create: components/__tests__/map-hover-card.test.tsx
- Modify: components/__tests__/map-canvas-layer-config.test.tsx
- Modify: components/__tests__/japan-main-map-popup.test.tsx

- [x] **Step 1: Write raw-value and hover tests**

~~~ts
test("publishes raw rice metadata", async () => {
  const graph = loadSeedGraph();
  const view = getThemeView(graph, "rice");
  const layer = getLayerDefinition("rice", "rice-harvest")!;
  const model = buildJapanMapCanvasModel(
    graph,
    view,
    "prefecture:niigata",
    layer,
    null
  );
  render(<JapanOperationsMapCanvas
    activeId="prefecture:niigata"
    focusTargetId={null}
    mapMode="choropleth"
    model={model}
    onHover={vi.fn()}
    onSelect={vi.fn()}
    statusPalette={getStatusPalette()}
    themePalette={getThemePalette("rice")}
  />);
  const source = addedSources.get("jp-regions") as FeatureCollection;
  const niigata = source.features.find(
    (feature) => feature.properties?.id === "prefecture:niigata"
  );
  expect(niigata?.properties).toMatchObject({
    label: "新潟県",
    rawValue: 514100,
    unit: "トン",
    periodLabel: "令和5年産"
  });
});

test("hover reports value without selecting", () => {
  // Invoke mocked mousemove for jp-region-fill.
  expect(onHover).toHaveBeenCalledWith(expect.objectContaining({
    selectionId: "prefecture:niigata",
    valueLabel: "514,100",
    unitLabel: "トン",
    periodLabel: "令和5年産"
  }));
  expect(onSelect).not.toHaveBeenCalled();
});
~~~

Expected first run: fail.

- [x] **Step 2: Add MapHoverViewModel**

~~~ts
export interface MapHoverViewModel {
  selectionId: string;
  label: string;
  valueLabel?: string;
  unitLabel?: string;
  periodLabel?: string;
  x: number;
  y: number;
}
~~~

Add optional onHover to JapanOperationsMapCanvas and emit null on mouseleave. Use feature properties; do not build a full detail model on pointer movement.

- [x] **Step 3: Publish raw metadata in region GeoJSON**

~~~ts
properties: {
  id: region.id,
  label: region.label,
  selectionId: region.id,
  selected: region.id === activeId,
  value: region.value,
  rawValue: region.rawValue ?? null,
  unit: region.unit ?? null,
  periodLabel: region.periodLabel ?? null,
  hasData: region.rawValue !== undefined
}
~~~

Use hasData for neutral missing-value paint. regionsToFeatureCollection uses a fixed minimum display radius only for geometry when value is null; it leaves properties.value as null and never turns missing into zero. Keep selected outline and focus distinguishable from magnitude.

- [x] **Step 4: Implement MapHoverCard**

The card contains only label, primary value/unit, and period. It is pointer-events-none, stays inside map bounds, disappears on leave/layer change, and never contains source lists, why-it-matters, or related links.

- [x] **Step 5: Remove desktop mechanical controls**

Omit onMapModeChange from the desktop JapanMainMap call and pass desktopMapMode. Keep the mobile call and MAP_MODES controls unchanged, pass mobileMapMode, and have its existing handler apply resolveLegacyPresentation before setting layerId/mapModeOverride. Continue passing the compatible resolved mode to MapLibre.

- [x] **Step 6: Prove rice behavior**

Tests cover:

~~~text
rice default mode is choropleth
bare-URL mobile default mode remains point
every theme and each valid legacy mode resolves to non-empty visible content
47 rice regions have raw values
Niigata raw value 514100 normalizes above Hokkaido
an in-scope missing regional fixture remains visible with hasData=false, value=null, neutral paint, and データなし legend language
legend source is the e-Stat harvest source
click opens one inspector
hover changes neither selection nor URL
~~~

- [x] **Step 7: Verify and commit P2**

~~~bash
npx vitest run lib/presentation/__tests__/workspace.test.ts lib/presentation/__tests__/map-canvas.test.ts components/__tests__/map-canvas-layer-config.test.tsx components/__tests__/map-hover-card.test.tsx components/__tests__/japan-main-map-popup.test.tsx components/__tests__/app-shell-evidence-wiring.test.tsx
npm run typecheck
git add types/presentation.ts lib/presentation/map-canvas.ts components/JapanOperationsMapCanvas.tsx components/JapanMainMap.tsx components/MapHoverCard.tsx components/__tests__/map-hover-card.test.tsx components/__tests__/map-canvas-layer-config.test.tsx components/__tests__/japan-main-map-popup.test.tsx
git commit -m "feat: make semantic map layers legible"
~~~

## Task 7: Make signals and comparison explicit secondary views (P3)

**Files:**

- Create: components/SignalsPanel.tsx
- Create: components/__tests__/signals-panel.test.tsx
- Create: components/ComparisonPanel.tsx
- Create: components/__tests__/comparison-panel.test.tsx
- Modify: components/AppShell.tsx
- Modify: components/__tests__/operations-accessibility.test.tsx
- Modify: components/__tests__/app-shell-url-state.test.tsx
- Modify: components/ScopeContextPanel.tsx
- Modify: components/__tests__/scope-context-panel.test.tsx
- Preserve: components/MapInboxPanel.tsx and components/OperationsSignalTable.tsx for mobile

- [x] **Step 1: Write failing secondary-view tests**

~~~ts
test("does not mount persistent desktop secondary chrome", () => {
  render(<AppShell graph={loadSeedGraph()} />);
  const desktop = screen.getByTestId("layout-desktop-workspace");
  expect(within(desktop).queryByTestId("signals-panel")).toBeNull();
  expect(within(desktop).queryByTestId("layout-compare-drawer")).toBeNull();
});

test("opens one secondary view at a time", async () => {
  render(<AppShell graph={loadSeedGraph()} />);
  await userEvent.click(screen.getByRole("button", { name: "シグナルを見る" }));
  expect(screen.getByTestId("signals-panel")).toBeTruthy();

  await userEvent.click(screen.getByRole("button", { name: "比較する" }));
  expect(screen.queryByTestId("signals-panel")).toBeNull();
  expect(screen.getByTestId("layout-compare-drawer")).toBeTruthy();
});
~~~

Expected first run: fail because current compare chrome is always mounted.

- [x] **Step 2: Extract SignalsPanel**

Props:

~~~ts
interface SignalsPanelProps {
  activeId: string;
  onBackToMap: () => void;
  onQueryChange: (query: string) => void;
  onSelect: (id: string) => void;
  query: string;
  rows: OperationRow[];
  themeId: ThemeId;
  themeLabel: string;
  themePalette: ThemePalette;
}
~~~

Reuse existing presentation data. Selection returns to map, focuses the object, and opens the inspector. Keep ranking/freshness evidence. Do not delete mobile MapInboxPanel.

- [x] **Step 3: Implement a real MetricSeries comparison surface**

Create ComparisonPanel with:

~~~ts
interface ComparisonPanelProps {
  activeId: string;
  layer: LayerDefinition;
  onClose: () => void;
  onSelect: (id: string) => void;
  series: MetricSeriesPoint[];
  sources: SourceDocument[];
  themePalette: ThemePalette;
}
~~~

It renders one sortable row per comparable point with label, formatted numeric value, one shared unit, one period, and source disclosure. For rice-harvest it compares all 47 prefectures; selecting 新潟県 selects prefecture:niigata and opens the normal inspector. It must reject mixed units or periods, missing provenance, or series without at least one common source in the builder/test rather than silently placing incompatible rows in one comparison.

Add tests:

~~~ts
test("compares rice prefectures with disciplined metadata", () => {
  const series = buildMetricSeries(
    loadSeedGraph(),
    "rice",
    "rice-harvest"
  );
  render(<ComparisonPanel
    activeId="prefecture:niigata"
    layer={riceHarvestLayer}
    onClose={vi.fn()}
    onSelect={vi.fn()}
    series={series}
    sources={riceSources}
    themePalette={getThemePalette("rice")}
  />);

  expect(screen.getAllByRole("row")).toHaveLength(48);
  expect(screen.getByText("514,100")).toBeTruthy();
  expect(screen.getByText("トン")).toBeTruthy();
  expect(screen.getByText("令和5年産")).toBeTruthy();
  expect(screen.getByRole("link", { name: /e-Stat/ })).toBeTruthy();
});
~~~

ScopeContextPanel enables 比較する only when buildMetricSeries returns at least two points with one unit and period. Otherwise the action is disabled with 比較可能な系列なし. Do not substitute OperationRow data.

- [x] **Step 4: Conditionally mount comparison**

~~~text
view=map:
  left ScopeContextPanel
  comparison unmounted

view=signals:
  left SignalsPanel
  comparison unmounted

view=comparison:
  left ScopeContextPanel
  ComparisonPanel mounted at 264 px with buildMetricSeries output
~~~

Remove compareCollapsedHeight and the permanent desktop OperationsSignalTable. Close returns to map. Keep the current mobile OperationsSignalTable call unchanged.

- [x] **Step 5: Implement focus and Escape behavior**

- Opening signals focuses its heading/back control.
- Opening comparison focuses its heading/close control.
- Escape closes the active secondary view before the inspector.
- Close restores focus to its trigger.
- Row selection returns to map, opens inspector, and focuses its heading.
- Use buttons/headings, not clickable divs.

- [x] **Step 6: Test URL hydration**

Cover view=signals, view=comparison, invalid view fallback, comparison requested for a layer without a comparable series falling back to map, secondary selection, and theme reset to view=map.

- [x] **Step 7: Verify and commit P3**

~~~bash
npx vitest run components/__tests__/signals-panel.test.tsx components/__tests__/comparison-panel.test.tsx components/__tests__/scope-context-panel.test.tsx components/__tests__/operations-accessibility.test.tsx components/__tests__/app-shell-url-state.test.tsx components/__tests__/app-shell-evidence-wiring.test.tsx lib/presentation/__tests__/workspace.test.ts
npm run typecheck
git add components/SignalsPanel.tsx components/ComparisonPanel.tsx components/ScopeContextPanel.tsx components/AppShell.tsx components/__tests__/signals-panel.test.tsx components/__tests__/comparison-panel.test.tsx components/__tests__/scope-context-panel.test.tsx components/__tests__/operations-accessibility.test.tsx components/__tests__/app-shell-url-state.test.tsx
git commit -m "feat: make signals and comparison secondary views"
~~~

## Task 8: Desktop visual and accessibility acceptance

**Files:**

- Modify: components/AppShell.tsx
- Modify as needed: components/NavigationRail.tsx
- Modify as needed: components/ActionBar.tsx
- Modify: components/__tests__/operations-accessibility.test.tsx
- Create: docs/assets/power-atlas-desktop-rice-default.png
- Create: docs/assets/power-atlas-desktop-rice-niigata.png
- Create: docs/assets/power-atlas-desktop-signals.png
- Create: docs/assets/power-atlas-desktop-comparison.png

- [x] **Step 1: Lock desktop geometry**

~~~ts
const DESKTOP_RAIL_WIDTH = 72;
const DESKTOP_CONTEXT_WIDTH = 320;
const DESKTOP_INSPECTOR_WIDTH = 360;
const DESKTOP_COMPARISON_HEIGHT = 264;
~~~

Move the AppShell workspace branches from hidden lg:block / lg:hidden to hidden xl:block / xl:hidden. Move the JapanMainMap mobile popup guard from lg:hidden to xl:hidden so the 1024–1279 px stacked composition does not lose its popup. Audit related lg-only height/overflow rules in AppShell and update only those that choose between the two workspace trees.

Map insets derive only from open surfaces. At the minimum 1280 px desktop workspace, an open inspector still leaves 528 px for the map (1280 - 72 - 320 - 360). The map is the largest single surface by width and area at 1280×800, 1440×900, and 1680×900. Add data-testid=layout-desktop-workspace so tests do not count the separate stacked/mobile tree.

- [x] **Step 2: Add accessibility regressions**

Test:

- logical page/surface headings;
- accessible semantic-layer group;
- aria-pressed active layer;
- Japanese inspector close name;
- discernible source links;
- absent, not visually collapsed, closed drawers;
- accessible map controls;
- no duplicated desktop interactive IDs.

- [x] **Step 3: Run the app and verify desktop**

~~~bash
npm run dev
~~~

Use a separate browser session at http://localhost:3000. Do not persist a global browser MCP registration. If temporary automation is used, remove it and stop its processes after the check.

At 1280×800, 1440×900, and 1680×900 verify:

~~~text
Default:
map dominates; left begins with scope/layers; 収穫量 active;
legend shows unit/period/source; no inspector or comparison bar.

Niigata:
one inspector; 514,100 トン; 令和5年産; official e-Stat link;
no long-form map popup.

Signals:
only opens deliberately; selection returns to map + inspector.

Comparison:
only opens deliberately; map controls are not covered.
~~~

- [x] **Step 4: Capture four screenshots**

Save at the exact paths listed above. Preserve existing current/reference screenshots.

- [x] **Step 5: Perform mobile non-regression smoke only**

At 1024×768 and one narrow phone viewport, confirm the existing stacked layout renders, theme buttons work, the existing popup opens, and no horizontal crash appears. Do not redesign or approve mobile. Record regressions caused by this branch; defer design issues.

- [x] **Step 6: Run full verification**

~~~bash
npm test
npm run typecheck
npm run build
git diff --check
git status --short
~~~

Expected: all tests pass, typecheck passes, production build succeeds, diff check is clean, and status contains only intended changes.

- [x] **Step 7: Commit visual evidence**

~~~bash
git add components app lib types docs/assets
git commit -m "test: verify desktop map workspace reframe"
~~~

Verified Task 8 result: desktop browser acceptance passed at 1280×800, 1440×900, and 1680×900. The existing stacked tree passed non-regression smoke at 1024×768 and 390×844 only. All four captured screenshots are 1440×900. Fresh checks at the Task 8 acceptance head passed 72 test files / 322 tests, typecheck, production build, and diff check; the worktree was clean.

## Task 9: Record delivery and prepare review handoff

**Files:**

- Modify: docs/product/2026-07-13-frontend-watchboard-ia-prd.md
- Modify: docs/product/2026-07-13-estat-spine-handoff-prd.md
- Modify: docs/superpowers/plans/2026-07-18-power-atlas-desktop-reframe.md

- [x] **Step 1: Record actual status only after verification**

Append:

~~~text
branch and PR
completed P0–P3
verification commands/results
acceptance screenshot paths
known desktop follow-ups
Mobile: explicitly deferred, not complete
~~~

Update the e-Stat handoff with the implementation branch and truthful PR status. Do not create a generic handoff.md.

- [x] **Step 2: Mark plan checkboxes from evidence**

Check only completed/verified tasks. Never claim mobile complete.

- [ ] **Step 3: Request final code review**

Status: awaiting independent parent review; do not mark complete from the documentation implementer's own pass.

Use superpowers:requesting-code-review, then run:

~~~bash
BASE=$(git merge-base HEAD origin/main)
git diff --stat "$BASE"..HEAD
git diff --check "$BASE"..HEAD
git log --oneline "$BASE"..HEAD
npm test
npm run typecheck
npm run build
~~~

Review for duplicate desktop detail, false live/comprehensive claims, lost provenance, invalid legacy URLs, permanent secondary chrome, accidental mobile redesign, and broken focus.

- [ ] **Step 4: Commit documentation evidence**

Status before this commit: intentionally unchecked. The parent can close it after verifying the resulting documentation commit.

~~~bash
git add docs/product/2026-07-13-frontend-watchboard-ia-prd.md docs/product/2026-07-13-estat-spine-handoff-prd.md docs/superpowers/plans/2026-07-18-power-atlas-desktop-reframe.md
git commit -m "docs: record desktop map workspace delivery"
~~~

- [ ] **Step 5: Push and open a draft PR only when authorized**

Status: **not authorized**. No temporary PR body, push, or PR has been created; publication awaits explicit authorization.

Create /tmp/power-atlas-desktop-reframe-pr-body.md with the verified P0–P3 summary, exact command outputs, acceptance screenshot paths, legacy URL behavior, and the line Mobile redesign: deferred. Use apply_patch so the body is reviewable before sending it.

~~~bash
git push -u origin codex/power-atlas-desktop-reframe
gh pr create --draft --title "Reframe the desktop Japan map workspace" --body-file /tmp/power-atlas-desktop-reframe-pr-body.md
~~~

The PR body leads with the IA outcome, lists P0–P3, verification and screenshots, states Mobile redesign: deferred, and describes legacy URL compatibility.

## Final acceptance checklist

- [x] Desktop launch makes the Japan map the largest and clearest surface.
- [x] Default left pane starts with scope metrics and semantic layers.
- [x] Rice defaults to 収穫量 with a magnitude-bearing regional presentation.
- [x] Rice legend shows unit, period, missing-data treatment, and official e-Stat source.
- [x] Layer labels describe subjects, not MapLibre mechanics.
- [x] Every enabled layer produces at least one feature visible in its configured render mode.
- [x] Missing regional data remains visible as neutral データなし and is never converted to zero.
- [x] Hover shows only label, value, unit, and period.
- [x] Selecting Niigata opens exactly one desktop inspector.
- [x] Niigata exposes 514,100 トン, 令和5年産, official URL, and why it matters.
- [x] No desktop long-form map popup duplicates the inspector.
- [x] Signals and comparison are reachable but absent from default chrome.
- [x] New layer= and view= URLs hydrate correctly.
- [x] Legacy theme=, mode=, and selected= links still work.
- [x] Keyboard/focus behavior works across changed desktop surfaces.
- [x] No copy implies live threat monitoring or comprehensive infrastructure coverage.
- [x] Full tests, typecheck, build, diff check, and desktop smoke pass.
- [x] Mobile redesign remains explicitly deferred and is not claimed complete.
- [x] Deferred mobile keeps a non-empty legacy/theme-wide point model on the bare rice URL.

## Stop conditions

Stop and request direction if:

- product decisions are absent from the implementation branch;
- the implementation worktree is dirty before the first change;
- current production/branch facts materially contradict the handoff;
- a layer needs new external data or licensing;
- the desktop goal requires a mobile redesign;
- provenance, value, unit, period, or URL cannot be preserved;
- baseline tests fail or a phase cannot restore green tests.
