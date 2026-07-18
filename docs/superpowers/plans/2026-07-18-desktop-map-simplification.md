# Desktop Map Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplify the `xl` desktop Japan Resilience Map so one reading path exposes the active theme, metric, period, geography, map meaning, and sources while preserving the dominant map, one inspector, intentional secondary views, and all URL/source boundaries.

**Architecture:** Add a deterministic `ActiveLayerSummary` presentation model and required authored map-encoding copy to the existing workspace registry. Render that contract through a consolidated 320-pixel context pane with one native theme select and one layer list, then reduce the desktop header and remove the separate numbered theme rail and desktop-wide source strip. Keep the semantic graph, ingestion, map canvas, inspector, Signals, comparison, and stacked/mobile product behavior unchanged.

**Tech Stack:** Next.js 16, React 19, TypeScript 5.8, Tailwind CSS, MapLibre GL 5, Vitest 3, Testing Library, GitHub Actions, Cloudflare Workers.

---

## 0. Authoritative inputs and execution boundary

Read before implementation:

- `docs/superpowers/specs/2026-07-18-desktop-map-simplification-design.md`
- `docs/product/2026-07-13-frontend-watchboard-ia-prd.md`, especially current delivery §§17-19
- `docs/superpowers/plans/2026-07-18-power-atlas-desktop-reframe.md`, especially Tasks 8-9 and release operations
- `docs/product/2026-07-13-estat-spine-handoff-prd.md`, especially the current desktop continuation guardrails

Execution worktree and branch:

```text
/Users/louistoyozaki/Documents/GitHub/jp-strategic-dependency-graph/.worktrees/codex/power-atlas-desktop-reframe
codex/power-atlas-desktop-reframe
```

Plan-writing head is `5ea1bbc` (`docs: design desktop map simplification`). Public `main` and the remote feature branch are at `dd4aec8`; `v0.5.0` package metadata is already present, but the tag and GitHub Release do not exist.

Execution prerequisite: before Task 1 starts, force-add this ignored plan path, commit it on the feature branch, and prove it is tracked with:

```bash
git add -f docs/superpowers/plans/2026-07-18-desktop-map-simplification.md
git diff --cached --check
git commit -m "docs: plan desktop map simplification"
git ls-files --error-unmatch docs/superpowers/plans/2026-07-18-desktop-map-simplification.md
```

Hard boundaries:

- Desktop `xl` workspace only. Mobile/stacked design remains deferred.
- No seed, ontology, ranking, ingestion, external-data, licensing, or source-adapter changes.
- No invented totals, averages, freshness, official attribution, current/live state, or precise-prefecture-polygon claims.
- Preserve `theme=`, `mode=`, `selected=`, `layer=`, and `view=` behavior.
- Signals and comparison remain absent from default chrome and open only on request.
- No generic `handoff.md`, PR body file, draft PR, or new release-note file.
- Use TDD for every behavior change: write the test, run it and observe the expected failure, implement minimally, rerun green, then commit.
- After each task, the controller runs spec-compliance review first and code-quality review second before starting the next task.

## 1. File responsibility map

| File | Responsibility after this plan |
|---|---|
| `types/presentation.ts` | `LayerDefinition.mapEncodingDescription` and the `ActiveLayerSummary` contract |
| `lib/presentation/workspace.ts` | Registry-authored encoding text and deterministic active-layer summary derivation |
| `lib/presentation/__tests__/workspace.test.ts` | Table-driven metric/source/encoding boundary tests |
| `components/ActiveLayerSummaryPanel.tsx` | Render the single `いま表示中` reading block and active provenance |
| `components/__tests__/active-layer-summary-panel.test.tsx` | Source count, link, official, freshness, demo, and empty-state rendering |
| `components/MapLegend.tsx` | Legend visualization only, plus authored map-meaning sentence; no source filtering |
| `components/ScopeContextPanel.tsx` | Native theme select, active summary, one layer list, Signals/comparison actions |
| `components/SemanticLayerDeck.tsx` | Compact one-column semantic layer switch with existing roving focus |
| `components/ActionBar.tsx` | Product identity, current-view trail, menu/share only |
| `components/AppShell.tsx` | Desktop geometry, summary construction, simplified surfaces, preserved state and focus wiring |
| `components/NavigationRail.tsx` | Delete after confirming no remaining consumer |
| `components/SourceStatusBar.tsx` | Preserve existing stacked/mobile status component; remove only desktop permanent placement |
| `components/InitialNoticeModal.tsx` | `v0.5.0` release sentence only |
| `components/__tests__/*.test.tsx` listed below | Desktop shell, URL, accessibility, focus, notice, and mobile non-regression contracts |
| `docs/assets/power-atlas-desktop-*.png` | Refreshed 1440x900 acceptance evidence |
| Product/release Markdown listed in Task 7 | Truthful verified delivery record and public description |

## Task 1: Add deterministic active-layer presentation contracts

**Files:**

- Modify: `types/presentation.ts:162-192`
- Modify: `lib/presentation/workspace.ts:1-370,365-715`
- Modify: `lib/presentation/__tests__/workspace.test.ts:1-372`

- [ ] **Step 1: Add failing type and registry tests**

Import `buildActiveLayerSummary`. Extend the registry test so every layer has authored map copy:

```ts
test.each(THEME_IDS)("authors truthful map encoding text for every %s layer", (themeId) => {
  const graph = loadSeedGraph();
  const workspace = buildWorkspacePresentation(graph, getThemeView(graph, themeId));

  for (const layer of workspace.layers) {
    expect(layer.mapEncodingDescription.trim(), layer.id).not.toBe("");
  }
});
```

Add the required boundary assertion for rice:

```ts
expect(getLayerDefinition("rice", "rice-harvest")?.mapEncodingDescription).toMatch(
  /代表点.*行政区域ポリゴンではありません/
);
expect(getLayerDefinition("logistics", "logistics-domestic")?.mapEncodingDescription).toMatch(
  /固定デモデータ.*ライブ/
);
```

- [ ] **Step 2: Add failing table-driven primary-metric tests**

Use `buildActiveLayerSummary(graph, view, activeLayer, workspace.scope, live?)` and add these cases:

```ts
test.each([
  ["rice", "rice-harvest", "6,610,315", "トン"],
  ["rice", "rice-price", "35,056", "円/玄米60kg"],
  ["rice", "rice-inventory-policy", null, null],
  ["water", "water-fill-rate", null, null],
  ["defense", "defense-capability-budget", null, null]
] as const)("derives only an allowed primary metric for %s/%s", (themeId, layerId, value, unit) => {
  const graph = loadSeedGraph();
  const view = getThemeView(graph, themeId);
  const workspace = buildWorkspacePresentation(graph, view);
  const layer = getLayerDefinition(themeId, layerId, workspace)!;
  const summary = buildActiveLayerSummary(graph, view, layer, workspace.scope);

  if (value === null) {
    expect(summary.primaryMetric).toBeNull();
  } else {
    expect(summary.primaryMetric).toMatchObject({ value, unit });
  }
});
```

Clone the seed, delete one prefecture's rice value, and assert `primaryMetric` is `null`, coverage is `46/47件`, and no unit-bearing national total survives. Assert water coverage is expressed as numeric/eligible water sources without a sum or average.

- [ ] **Step 3: Add failing source-resolution tests**

Cover zero, one, and multiple sources in registry order:

```ts
expect(riceHarvest.sources.map((source) => source.id)).toEqual([
  "source:estat-rice-prefecture-harvest-r5"
]);
expect(riceInventory.sources.map((source) => source.id)).toEqual(
  getLayerDefinition("rice", "rice-inventory-policy")!.sourceIds
);
expect(logisticsDomestic.sources).toEqual([]);
expect(logisticsDomestic.sourceFallbackLabel).toBe("固定デモデータ");
```

Create a cloned view with an unresolved non-demo `sourceId` and assert `sourceFallbackLabel` is `出典情報なし` with no fabricated source.

- [ ] **Step 4: Run the tests and verify RED**

Run:

```bash
npm test -- lib/presentation/__tests__/workspace.test.ts
```

Expected: FAIL because `ActiveLayerSummary`, `buildActiveLayerSummary`, and `mapEncodingDescription` do not exist.

- [ ] **Step 5: Add the presentation contracts**

Add to `types/presentation.ts`:

```ts
export interface ActiveLayerSummary {
  title: string;
  description: string;
  coverage: { label: string; value: string };
  periodLabel: string;
  primaryMetric: ScopeSummaryMetric | null;
  missingDataLabel: "データなし" | null;
  mapEncodingDescription: string;
  sources: SourceDocument[];
  sourceFallbackLabel: "固定デモデータ" | "出典情報なし" | null;
}
```

Add `mapEncodingDescription: string` to `LayerDefinition`.

- [ ] **Step 6: Author map-encoding copy for every registry layer**

Use exact content-boundary language. At minimum the registry text must implement this mapping:

| Layer(s) | Required meaning |
|---|---|
| `rice-harvest` | prefecture representative points encode typed harvest; not administrative polygons |
| `water-fill-rate` | representative water-source points encode typed fill rate |
| all `observations` layers | related public-observation locations; marker is not itself a regional metric |
| all `entities` layers | related public entities/facilities at available representative locations |
| all semantic `flows` layers | registered representative dependency/supply paths; not live routes |
| `logistics-domestic` | fixed demo representative routes; not live tracking or official impact data |
| `logistics-arrival` | provided arrival points at the supplied data time; not comprehensive live coverage |
| `logistics-impact` | unavailable until typed, sourced regional impact values exist |
| any future `theme-composite` | related public locations and paths without quantitative claims |

Do not derive this copy from `renderMode` alone.

- [ ] **Step 7: Implement the minimal summary builder**

Implement and export:

```ts
export function buildActiveLayerSummary(
  graph: SemanticGraph,
  view: ThemeView,
  layer: LayerDefinition,
  scope: ScopeSummary,
  liveLogistics: LiveLogisticsViewModel | null = null
): ActiveLayerSummary
```

Rules:

1. Always use `layer.label`, `layer.description`, and `layer.periodLabel`.
2. Preserve `layer.sourceIds` order when resolving from `view.sources`.
3. Rice harvest: sum only with complete numeric prefecture coverage.
4. Single explicit numeric observation: expose that one metric.
5. Multiple observations, reservoir percentages, flows, entities, live logistics, and composites: `primaryMetric: null`.
6. Regional coverage uses numeric/eligible counts; other content reuses `scope.coverage`.
7. `missingDataLabel` is `データなし` only for continuous/regional metric content; otherwise `null`.
8. Empty resolved sources use `固定デモデータ` only for the fixed domestic logistics layer, otherwise `出典情報なし`.
9. Keep the optional `liveLogistics` input required by the approved design contract, but never use it to manufacture a number; live-logistics content always has `primaryMetric: null` and reuses the existing scope coverage.

- [ ] **Step 8: Run focused and presentation tests GREEN**

Run:

```bash
npm test -- lib/presentation/__tests__/workspace.test.ts lib/presentation/__tests__/map-canvas.test.ts lib/presentation/__tests__/metrics.test.ts
npm run typecheck
```

Expected: all selected tests pass; typecheck exits 0.

- [ ] **Step 9: Commit Task 1**

```bash
git add types/presentation.ts lib/presentation/workspace.ts lib/presentation/__tests__/workspace.test.ts
git diff --cached --check
git commit -m "feat: add active layer summary contract"
```

## Task 2: Render one active summary with truthful provenance

**Files:**

- Create: `components/ActiveLayerSummaryPanel.tsx`
- Create: `components/__tests__/active-layer-summary-panel.test.tsx`
- Modify: `components/MapLegend.tsx:1-110`
- Modify: `components/__tests__/map-legend.test.tsx`

- [ ] **Step 1: Write failing summary-panel tests**

Build summaries through the real presentation builder. Test:

- rice harvest shows `いま表示中`, `収穫量`, `6,610,315`, `トン`, `47都道府県`, `令和5年産`, `データなし`, and the representative-point warning;
- one official source renders `公式` and a direct e-Stat link;
- multiple active sources all render in `sourceIds` order;
- an official source without a URL renders text and no fake link;
- `accessed: ""` or `22分前` renders `確認時点不明` and `確認日不明` via `getSourceFreshness`;
- `固定デモデータ` renders no `公式` badge and no source link;
- `出典情報なし` renders honestly with no empty link.

Use `vi.useFakeTimers()` / `vi.setSystemTime(new Date("2026-07-18T00:00:00Z"))` only for a test that asserts relative freshness; restore real timers after the test.

- [ ] **Step 2: Run component tests and verify RED**

```bash
npm test -- components/__tests__/active-layer-summary-panel.test.tsx components/__tests__/map-legend.test.tsx
```

Expected: FAIL because the new component and updated legend contract do not exist.

- [ ] **Step 3: Make `MapLegend` presentation-only**

Change its props to:

```ts
interface MapLegendProps {
  legend: LayerLegend;
  mapEncodingDescription: string;
  themePalette: ThemePalette;
}
```

Keep continuous/categorical swatches and missing-data treatment. Render `mapEncodingDescription` immediately after the swatches under a visible `地図の読み方` label. Remove source filtering and period/source props from this component.

- [ ] **Step 4: Implement `ActiveLayerSummaryPanel`**

Props:

```ts
interface ActiveLayerSummaryPanelProps {
  legend: LayerLegend;
  summary: ActiveLayerSummary;
  themePalette: ThemePalette;
}
```

Reading order inside one bordered region labelled `いま表示中`:

```text
layer title + description
primary metric when allowed
coverage / period
legend + 地図の読み方
active sources or explicit fallback
```

For each `summary.sources` item:

- call `getSourceFreshness(source)`;
- show `公式` only when `source.official === true`;
- use `<a target="_blank" rel="noreferrer">` only when `source.url` is non-empty;
- otherwise use plain text;
- show freshness per source and never aggregate authority or freshness.

- [ ] **Step 5: Run focused tests GREEN**

```bash
npm test -- components/__tests__/active-layer-summary-panel.test.tsx components/__tests__/map-legend.test.tsx components/__tests__/evidence-panel-structure.test.tsx lib/official/__tests__/source-status.test.ts
npm run typecheck
```

Expected: all selected tests pass; existing evidence/freshness behavior remains green.

- [ ] **Step 6: Commit Task 2**

```bash
git add components/ActiveLayerSummaryPanel.tsx components/MapLegend.tsx components/__tests__/active-layer-summary-panel.test.tsx components/__tests__/map-legend.test.tsx
git diff --cached --check
git commit -m "feat: show active layer scope and provenance"
```

## Task 3: Consolidate themes and layers in the fixed context pane

**Files:**

- Modify: `components/ScopeContextPanel.tsx:1-150`
- Modify: `components/SemanticLayerDeck.tsx:1-125`
- Modify: `components/__tests__/scope-context-panel.test.tsx:1-164`
- Modify: `components/__tests__/semantic-layer-deck.test.tsx:1-96`

- [ ] **Step 1: Rewrite the context-panel test to the approved contract**

New props:

```ts
interface ScopeContextPanelProps {
  activeLayerId: SemanticLayerId;
  activeSummary: ActiveLayerSummary;
  comparisonAvailable: boolean;
  onLayerChange: (id: SemanticLayerId) => void;
  onOpenComparison: () => void;
  onOpenSignals: () => void;
  onThemeChange: (id: ThemeId) => void;
  themeId: ThemeId;
  themeIds: readonly ThemeId[];
  themePalette: ThemePalette;
  workspace: WorkspacePresentation;
}
```

Assert:

```ts
expect(screen.getAllByRole("combobox", { name: "テーマ" })).toHaveLength(1);
expect(screen.getByRole("option", { name: "コメ" })).toBeTruthy();
expect(screen.getByRole("region", { name: "いま表示中" })).toBeTruthy();
expect(screen.queryByRole("region", { name: "対象範囲の要約" })).toBeNull();
expect(screen.queryByText("35,056")).toBeNull(); // harvest must not mix price
```

Use `userEvent.selectOptions(themeSelect, "energy")` and assert `onThemeChange("energy")` exactly once.

- [ ] **Step 2: Add the failing one-column layer assertion**

Change the existing expectation from `grid-cols-2` to `grid-cols-1`. Preserve tests for pressed state, disabled `データなし`, Arrow-key skipping, Enter, and Space activation.

- [ ] **Step 3: Run tests and verify RED**

```bash
npm test -- components/__tests__/scope-context-panel.test.tsx components/__tests__/semantic-layer-deck.test.tsx
```

Expected: FAIL on the missing native theme select/new summary props and old two-column class.

- [ ] **Step 4: Implement the native theme select**

At the top of `ScopeContextPanel`:

```tsx
<label>
  <span>テーマ</span>
  <select
    aria-label="テーマ"
    value={themeId}
    onChange={(event) => {
      const nextThemeId = event.target.value as ThemeId;
      if (nextThemeId !== themeId) onThemeChange(nextThemeId);
    }}
  >
    {themeIds.map((id) => (
      <option key={id} value={id}>{getThemeLabel(id).label}</option>
    ))}
  </select>
</label>
```

Use the supplied `themeIds` order so the existing ranking decision still controls option order. Do not add a custom dropdown, command palette, or duplicate theme buttons.

- [ ] **Step 5: Replace fragmented scope cards with the summary component**

Remove `SummaryCard` and the four-card `対象範囲の要約`. Render `ActiveLayerSummaryPanel` once for the resolved active layer, then the layer deck, then secondary actions. If every layer is unavailable, omit the active summary and keep all layer buttons disabled plus comparison unavailable.

- [ ] **Step 6: Compact the layer list without changing behavior**

Change the layer group to `grid grid-cols-1 gap-1.5`. Keep one short description, active border/background, `データなし`, roving focus, and no MapLibre render-mode copy.

- [ ] **Step 7: Run focused tests GREEN**

```bash
npm test -- components/__tests__/scope-context-panel.test.tsx components/__tests__/semantic-layer-deck.test.tsx components/__tests__/active-layer-summary-panel.test.tsx
npm run typecheck
```

Expected: all selected tests pass; typecheck exits 0.

- [ ] **Step 8: Commit Task 3**

```bash
git add components/ScopeContextPanel.tsx components/SemanticLayerDeck.tsx components/__tests__/scope-context-panel.test.tsx components/__tests__/semantic-layer-deck.test.tsx
git diff --cached --check
git commit -m "feat: consolidate desktop theme and layer controls"
```

## Task 4: Simplify the desktop shell and header

**Files:**

- Modify: `components/ActionBar.tsx:1-135`
- Modify: `components/AppShell.tsx:1-620`
- Delete: `components/NavigationRail.tsx`
- Modify: `components/__tests__/action-bar-selected-row.test.tsx`
- Modify: `components/__tests__/navigation-shell.test.tsx`
- Delete: `components/__tests__/navigation-rail.test.tsx`
- Modify: `components/__tests__/app-shell-url-state.test.tsx:1-1038`
- Modify: `components/__tests__/app-shell-evidence-wiring.test.tsx:1-165`
- Modify: `components/__tests__/operations-accessibility.test.tsx`

- [ ] **Step 1: Write the failing compact-header tests**

Replace selected-row assertions with:

```ts
render(
  <ActionBar
    currentViewLabel="コメ / 収穫量 / 令和5年産"
    sharePath="/?layer=rice-harvest"
    themePalette={getThemePalette("rice")}
  />
);

const header = screen.getByRole("banner");
expect(within(header).getByText("日本レジリエンス地図")).toBeTruthy();
expect(within(header).getByText("コメ / 収穫量 / 令和5年産")).toBeTruthy();
expect(within(header).getByRole("button", { name: "メニュー" })).toBeTruthy();
expect(within(header).queryByText("選択中")).toBeNull();
expect(within(header).queryByRole("button", { name: "フィルター解除" })).toBeNull();
```

- [ ] **Step 2: Write failing shell structure and geometry tests**

Update the default shell test:

```ts
expect(shell.className).toContain("xl:grid-rows-[56px,minmax(0,1fr)]");
expect(screen.queryByTestId("layout-navigation-rail")).toBeNull();
expect(within(desktop).getAllByRole("combobox", { name: "テーマ" })).toHaveLength(1);
expect(screen.getByTestId("layout-source-status-mobile").className).toContain("xl:hidden");
```

Update geometry:

```ts
expect(commandPane.style.left).toBe("0px");
expect(commandPane.style.width).toBe("320px");
expect(1280 - 320 - 360).toBe(600);
expect(map.getAttribute("data-overlay-left")).toBe("336");
expect(map.getAttribute("data-overlay-right")).toBe("376");
expect(compareDrawer.style.left).toBe("320px");
```

Delete the tests for closing/reopening the command pane; the fixed pane no longer has a rail toggle. Preserve secondary-view close/focus tests.

In `operations-accessibility.test.tsx`, remove the direct `NavigationRail` import and replace the rail-only pressed-state test with a real `ScopeContextPanel` assertion for the labelled native select and its selected option. In `app-shell-url-state.test.tsx`, remove the `NavigationRail` mock before the production component is deleted.

- [ ] **Step 3: Rewrite theme-change integration tests around the native select**

Replace mocked rail clicks with:

```ts
const themeSelect = within(desktop).getByRole("combobox", { name: "テーマ" });
await user.selectOptions(themeSelect, "energy");

await waitFor(() => {
  expect(replaceMock).toHaveBeenLastCalledWith("/?theme=energy", { scroll: false });
});
expect(themeSelect).toBe(document.activeElement);
expect(within(desktop).getByRole("button", { name: "供給拠点" }).getAttribute("aria-pressed")).toBe("true");
```

Add one state-reset test starting with a selection, Signals query, comparison or legacy mode as appropriate, then select another theme and assert: default layer, `map` view, no inspector, no popup, no query, and no legacy `mode=` in the serialized URL.

Add a failing inspector focus-restoration test. Open the inspector from a still-mounted mocked map selection button, close it with `詳細を閉じる`, and assert focus returns to that exact button. Repeat the close with Escape. For selection from Signals or comparison, assert the logical fallback is the corresponding still-mounted `data-secondary-action` trigger because the selected row is unmounted when the view returns to the map.

- [ ] **Step 4: Run shell tests and verify RED**

```bash
npm test -- components/__tests__/action-bar-selected-row.test.tsx components/__tests__/navigation-shell.test.tsx components/__tests__/app-shell-url-state.test.tsx components/__tests__/app-shell-evidence-wiring.test.tsx components/__tests__/operations-accessibility.test.tsx
```

Expected: FAIL against the old selected header, rail, three-row desktop grid, and 72-pixel inset.

- [ ] **Step 5: Implement the compact ActionBar**

Replace the prop contract with:

```ts
interface ActionBarProps {
  currentViewLabel: string;
  sharePath: string;
  themePalette: ThemePalette;
}
```

Keep product identity and menu/share. Remove selected kind/label/status, selected scroll/fade, filter reset, and theme chip duplication. Render the current-view trail as non-interactive text.

- [ ] **Step 6: Integrate `ActiveLayerSummary` in AppShell**

After resolving `activeLayer`, build:

```ts
const activeLayerSummary = buildActiveLayerSummary(
  graph,
  view,
  activeLayer,
  workspace.scope,
  liveLogistics
);
const currentViewLabel = [themeLabel, activeLayer.label, activeLayer.periodLabel].join(" / ");
```

Pass the summary, current theme, ordered theme IDs, and `handleThemeChange` to `ScopeContextPanel`. Pass `currentViewLabel` to `ActionBar`.

- [ ] **Step 7: Remove the rail and closeable-pane state**

Remove:

- `NavigationRail` import/render;
- `railWidth` geometry;
- `isInboxOpen` state;
- `inboxToggleRef`;
- `handleCloseInbox` and rail open/close handlers.

Keep the command pane always mounted in desktop map/signals states. Use:

```ts
const DESKTOP_WORKSPACE_GEOMETRY = {
  comparisonHeight: 264,
  contextPaneWidth: 320,
  inspectorWidth: 360
} as const;
```

Set map left inset to `contextPaneWidth + 16`, comparison left to `contextPaneWidth`, and map right/bottom insets from only the inspector/comparison.

Delete `NavigationRail.tsx` and its component-only test only after every external consumer, test import, and mock has been removed.

The required deletion sequence is:

1. remove the AppShell import/render and all test imports/mocks/usages, including `operations-accessibility.test.tsx`;
2. run `rg -n "NavigationRail" components app` and confirm only the component file and its component-only test remain;
3. delete those two files;
4. rerun `rg -n "NavigationRail" components app` and expect no matches before typecheck.

- [ ] **Step 8: Implement inspector focus restoration**

Add an `inspectorReturnFocusRef` for the last connected invoking element and an origin fallback for `signals` or `comparison`. Capture `document.activeElement` before opening the inspector from map, Signals, comparison, or other desktop controls. Route the close button and Escape through one `handleCloseInspector` that closes the inspector and schedules focus in this order:

1. the captured element when it remains connected;
2. the corresponding `[data-secondary-action="signals"]` or `[data-secondary-action="comparison"]` trigger when a secondary-view row was unmounted;
3. the active layer button as the deterministic fallback for URL-hydrated or pointer-only selections.

Do not clear the selected object or change theme/layer state when only the inspector is closed. Add the minimal `data-layer-id` hook to the active layer button only if the deterministic fallback cannot be selected accessibly without it.

- [ ] **Step 9: Make the source strip stacked/mobile-only**

Keep `SourceStatusBar` and its summary logic, but wrap its AppShell placement:

```tsx
<div data-testid="layout-source-status-mobile" className="xl:hidden">
  <SourceStatusBar ... />
</div>
```

Change desktop main grid rows to `xl:grid-rows-[56px,minmax(0,1fr)]`. Do not change `SourceStatusBar` content or stacked/mobile behavior.

- [ ] **Step 10: Run focused shell tests GREEN**

```bash
npm test -- components/__tests__/action-bar-selected-row.test.tsx components/__tests__/navigation-shell.test.tsx components/__tests__/app-shell-url-state.test.tsx components/__tests__/app-shell-evidence-wiring.test.tsx components/__tests__/operations-accessibility.test.tsx components/__tests__/source-status-bar.test.tsx
npm run typecheck
```

Expected: all selected tests pass; exactly one desktop theme control; no rail or selected header duplication; preserved inspector and URLs.

- [ ] **Step 11: Commit Task 4**

```bash
git add components/ActionBar.tsx components/AppShell.tsx components/NavigationRail.tsx components/__tests__/action-bar-selected-row.test.tsx components/__tests__/navigation-shell.test.tsx components/__tests__/navigation-rail.test.tsx components/__tests__/app-shell-url-state.test.tsx components/__tests__/app-shell-evidence-wiring.test.tsx components/__tests__/operations-accessibility.test.tsx
git diff --cached --check
git commit -m "feat: simplify desktop map shell"
```

## Task 5: Lock notice, accessibility, and responsive regressions

**Files:**

- Modify: `components/__tests__/initial-notice-modal.test.tsx:1-65`
- Modify: `components/InitialNoticeModal.tsx:1-105`
- Modify: `components/__tests__/operations-accessibility.test.tsx`
- Modify: `components/__tests__/app-shell-url-state.test.tsx`
- Modify as required by the approved behavior only: `components/AppShell.tsx`, `components/ScopeContextPanel.tsx`, `components/ActiveLayerSummaryPanel.tsx`

- [ ] **Step 1: Change the notice expectation first**

```ts
expect(
  screen.getByText("更新: v0.5.0 - 公式統計と意味レイヤーを中心に再構成しました")
).toBeTruthy();
expect(screen.queryByText("更新: 国内物流監視と地形地図を追加しました")).toBeNull();
```

- [ ] **Step 2: Run the notice test and verify RED**

```bash
npm test -- components/__tests__/initial-notice-modal.test.tsx
```

Expected: FAIL because the old logistics/terrain sentence still renders.

- [ ] **Step 3: Make the one-line notice change and verify GREEN**

Replace only the release sentence. Preserve the existing storage key, non-blocking region role, Escape dismissal, close button, and localStorage behavior.

```bash
npm test -- components/__tests__/initial-notice-modal.test.tsx
```

Expected: all notice tests pass.

- [ ] **Step 4: Add accessibility and responsive contract assertions**

Cover:

- one `h1` product identity;
- labelled native theme select;
- active layer `aria-pressed` and unavailable layer `disabled`;
- discernible source links and plain text for no-URL sources;
- non-interactive current-view trail;
- one detailed desktop inspector after selection;
- regression coverage for Signals, comparison, and inspector Escape/close focus restoration implemented in Task 4;
- `layout-desktop-workspace` remains `hidden xl:block`;
- `layout-stacked-workspace` remains `xl:hidden` and contains its existing map controls/table/evidence path;
- desktop-only simplification does not remove the stacked SourceStatusBar or legacy point map.

- [ ] **Step 5: Run the changed-component regression set**

```bash
npm test -- components/__tests__/initial-notice-modal.test.tsx components/__tests__/operations-accessibility.test.tsx components/__tests__/app-shell-url-state.test.tsx components/__tests__/app-shell-evidence-wiring.test.tsx components/__tests__/scope-context-panel.test.tsx components/__tests__/semantic-layer-deck.test.tsx components/__tests__/active-layer-summary-panel.test.tsx components/__tests__/map-legend.test.tsx
npm run typecheck
git diff --check
```

Expected: all selected tests pass, typecheck passes, diff check is clean.

- [ ] **Step 6: Commit Task 5**

```bash
git add components/InitialNoticeModal.tsx components/AppShell.tsx components/ScopeContextPanel.tsx components/ActiveLayerSummaryPanel.tsx components/__tests__
git diff --cached --check
git commit -m "test: lock simplified desktop interactions"
```

## Task 6: Perform full and browser acceptance

**Files:**

- Replace: `docs/assets/power-atlas-desktop-rice-default.png`
- Replace: `docs/assets/power-atlas-desktop-rice-niigata.png`
- Replace: `docs/assets/power-atlas-desktop-signals.png`
- Replace: `docs/assets/power-atlas-desktop-comparison.png`
- Modify production files only if a browser-discovered regression is first reproduced by a failing test and routed back through the responsible task/review loop

- [ ] **Step 1: Run full automated verification before visual review**

```bash
npm test
npm run typecheck
npm run build
git diff --check
```

Expected: all test files/tests pass, typecheck exits 0, production build exits 0, diff check is clean. Record the actual counts; do not reuse the former 72/331 count if it changed.

- [ ] **Step 2: Start an isolated local server**

```bash
lsof -nP -iTCP:3100 -sTCP:LISTEN
npm run dev -- --hostname 127.0.0.1 --port 3100
```

If port 3100 is occupied, identify the owner before choosing another port. Do not stop an unrelated process. Keep the server session ID for cleanup.

- [ ] **Step 3: Verify desktop at three widths using the Browser skill**

Open `http://127.0.0.1:3100/?theme=rice&layer=rice-harvest` and verify at 1280x800, 1440x900, and 1680x900:

```text
Header: identity + コメ / 収穫量 / 令和5年産 + menu; no 選択中 or filter reset.
Context: one theme select, いま表示中, 6,610,315 トン, 47都道府県,
         one-column layers, truthful representative-point sentence, e-Stat link.
Chrome: no numbered theme rail and no desktop-wide source-status strip.
Map: largest surface; controls usable; no permanent Signals/comparison/inspector.
```

At 1280 with inspector open, confirm context 320 + inspector 360 leaves 600 pixels for the map and controls remain reachable.

- [ ] **Step 4: Verify interactions and capture 1440x900 evidence**

Capture the four exact files:

1. default rice harvest;
2. Niigata inspector showing `514,100 トン`, `令和5年産`, why-it-matters, and official e-Stat source;
3. Signals only after pressing `シグナルを見る`;
4. comparison only after pressing `比較する`.

Also switch the native theme select to Energy and back to Rice. Confirm default layers, URL state, inspector closure, query reset, focus retention, and absence of stale `mode=`. Exercise Escape and close/focus restoration for Signals, comparison, and inspector. Check browser console errors/warnings.

- [ ] **Step 5: Perform stacked/mobile non-regression smoke only**

At 1024x768 and 390x844 confirm:

- existing stacked layout renders;
- existing theme controls and map-mode controls remain;
- selection popup/evidence path opens;
- SourceStatusBar remains;
- bare rice URL keeps a non-empty legacy point model;
- no horizontal crash.

Do not change or approve Mobile design.

- [ ] **Step 6: Stop the local server and reset browser state**

Stop only the server session started in Step 2. Reset temporary viewport emulation and finalize browser tabs according to the Browser skill.

- [ ] **Step 7: Re-run full verification after screenshots**

```bash
npm test
npm run typecheck
npm run build
git diff --check
git status --short
```

Expected: all checks pass; status contains only the four intended screenshot replacements. If production code changed during visual review, return to the relevant failing-test task and re-run both review gates before continuing.

- [ ] **Step 8: Commit visual evidence**

```bash
git add docs/assets/power-atlas-desktop-rice-default.png docs/assets/power-atlas-desktop-rice-niigata.png docs/assets/power-atlas-desktop-signals.png docs/assets/power-atlas-desktop-comparison.png
git diff --cached --check
git commit -m "test: refresh desktop simplification evidence"
```

## Task 7: Record the verified delivery and release framing

**Files:**

- Modify: `docs/product/2026-07-13-frontend-watchboard-ia-prd.md`
- Modify: `docs/product/2026-07-13-estat-spine-handoff-prd.md`
- Modify: `docs/superpowers/plans/2026-07-18-desktop-map-simplification.md`
- Modify: `docs/public-launch.md`
- Modify: `README.md`
- Modify: `README.ja.md`

- [ ] **Step 1: Record only fresh verified facts**

Append a new dated delivery section rather than rewriting the historical P0-P3 record. Record:

- implementation branch and commit range;
- removed desktop selected strip, numbered rail, and global source strip;
- consolidated native theme select, one-column layers, active summary, authored encoding copy, and active-source rules;
- actual test counts, typecheck, build, diff check, browser widths, screenshot paths, and console result;
- URL/inspector/Signals/comparison compatibility;
- fixed-demo and unknown-freshness boundaries;
- Mobile redesign deferred and smoke-only.

- [ ] **Step 2: Update public release descriptions**

README and launch copy must describe `v0.5.0` as:

```text
Desktop map workspace with one fixed context pane, one active-layer reading block,
one theme/layer control path, one selected-object inspector, and intentional
Signals/comparison views. Mobile redesign remains deferred.
```

Keep the new screenshots at the existing paths. Do not claim precise polygons, live threat monitoring, comprehensive infrastructure coverage, or current official logistics impact.

- [ ] **Step 3: Mark this plan from evidence**

Check only completed steps and add actual verification results. Do not mark Task 8 release operations complete before public deployment/tag/release evidence exists.

- [ ] **Step 4: Verify the documentation diff**

```bash
rg -n "v0.5.0|Mobile|固定デモデータ|代表点|theme=|layer=|view=" README.md README.ja.md docs/public-launch.md docs/product/2026-07-13-frontend-watchboard-ia-prd.md docs/product/2026-07-13-estat-spine-handoff-prd.md docs/superpowers/plans/2026-07-18-desktop-map-simplification.md
git ls-files --error-unmatch docs/superpowers/plans/2026-07-18-desktop-map-simplification.md
git diff --check -- README.md README.ja.md docs/public-launch.md docs/product/2026-07-13-frontend-watchboard-ia-prd.md docs/product/2026-07-13-estat-spine-handoff-prd.md docs/superpowers/plans/2026-07-18-desktop-map-simplification.md
git diff --name-only | sort
```

Expected: the plan is already tracked from the execution-prerequisite commit, and the sorted diff lists exactly the six authorized Markdown files. No `handoff.md` or release-note file exists.

- [ ] **Step 5: Commit Task 7**

```bash
git add README.md README.ja.md docs/public-launch.md docs/product/2026-07-13-frontend-watchboard-ia-prd.md docs/product/2026-07-13-estat-spine-handoff-prd.md
git add -f docs/superpowers/plans/2026-07-18-desktop-map-simplification.md
git diff --cached --check
git commit -m "docs: record simplified desktop release"
```

## Task 8: Final review, distribution, deployment, and `v0.5.0` release

**Files:**

- No planned product-file edits. Any review finding returns to the responsible task and TDD/review loop.
- No generic handoff, PR body, or release-note file.

- [ ] **Step 1: Run the final independent whole-change review**

After per-task spec and quality reviews are green, dispatch one fresh final reviewer with:

```bash
BASE=dd4aec8
git diff --stat "$BASE"..HEAD
git diff --check "$BASE"..HEAD
git log --oneline "$BASE"..HEAD
```

Review specifically for metric mixing, invented aggregation, false official/live/freshness claims, lost source links, duplicate selection detail, multiple desktop theme controls, broken URLs/focus, permanent secondary chrome, and accidental Mobile redesign. Fix every blocking finding through the originating implementer and repeat review.

- [ ] **Step 2: Run fresh release verification**

```bash
npm test
npm run typecheck
npm run build
git diff --check dd4aec8..HEAD
git status --short --branch
```

Expected: all checks pass, worktree is clean, and the branch is ahead of `origin/codex/power-atlas-desktop-reframe` only by reviewed release commits.

- [ ] **Step 3: Push the reviewed feature branch**

```bash
git push origin codex/power-atlas-desktop-reframe
```

Verify the remote branch resolves to local `HEAD`.

- [ ] **Step 4: Fast-forward the authorized public main branch**

From the main worktree:

```bash
git fetch origin
git status --short --branch
git rev-parse origin/main
git merge-base --is-ancestor origin/main codex/power-atlas-desktop-reframe
git merge --ff-only codex/power-atlas-desktop-reframe
git push origin main
```

Stop if main is dirty, `origin/main` is not an ancestor of the reviewed feature branch, or the fast-forward would include unrelated work. Direct main distribution is explicitly authorized for this `v0.5.0` release; no PR is required.

- [ ] **Step 5: Wait for CI verify and Cloudflare deploy**

```bash
RELEASE_SHA=$(git rev-parse HEAD)
RUN_ID=""
for attempt in {1..24}; do
  RUN_ID=$(gh run list --workflow CI --branch main --commit "$RELEASE_SHA" --limit 1 --json databaseId --jq '.[0].databaseId // empty')
  if [ -n "$RUN_ID" ]; then
    break
  fi
  sleep 5
done
test -n "$RUN_ID"
gh run watch "$RUN_ID" --exit-status
gh run view "$RUN_ID" --json status,conclusion,url,jobs
```

Expected: the run for the exact release commit becomes visible within two minutes, then `verify` and `deploy` both conclude `success`. Do not tag while CI/deploy is queued, running, cancelled, or failed.

- [ ] **Step 6: Verify the public distribution site**

```bash
curl -fsSI 'https://economic-security.quadrillionaaa.com/?theme=rice&layer=rice-harvest'
```

Use the Browser skill on the public URL and repeat the essential 1440x900 checks: compact header, one theme select, active rice summary and e-Stat source, no numbered rail/global desktop source strip, Niigata inspector, Signals, comparison, `v0.5.0` notice, and clean console. Verify the deployed commit only after CI success.

- [ ] **Step 7: Create and push the annotated tag**

Confirm the tag is still absent:

```bash
git tag --list v0.5.0
git ls-remote --exit-code --tags origin v0.5.0
gh release view v0.5.0
```

Expected: all three absence checks report no existing local tag, remote tag, or GitHub Release. `git ls-remote --exit-code` and `gh release view` are expected to exit non-zero in this absence gate; stop if either finds an existing release artifact.

Then:

```bash
git tag -a v0.5.0 -m "Japan Resilience Map v0.5.0"
git push origin v0.5.0
```

- [ ] **Step 8: Create the GitHub Release**

```bash
gh release create v0.5.0 \
  --verify-tag \
  --title "Japan Resilience Map v0.5.0" \
  --notes $'- Simplifies the desktop map into one context and layer-reading path.\n- Keeps official source, unit, period, missing-data, and representative-point disclosures visible.\n- Preserves one inspector, Signals/comparison, and legacy/current URLs.\n- Keeps fixed logistics routes explicitly demo-only; regional logistics impact remains disabled without typed sourced data.\n- Mobile redesign remains deferred.'
```

- [ ] **Step 9: Verify final public release state**

```bash
RELEASE_SHA=$(git rev-parse HEAD)
git ls-remote --heads origin main codex/power-atlas-desktop-reframe
test "$(git rev-list -n 1 v0.5.0)" = "$RELEASE_SHA"
test "$(git ls-remote origin 'refs/tags/v0.5.0^{}' | awk '{print $1}')" = "$RELEASE_SHA"
gh release view v0.5.0 --json tagName,name,isDraft,isPrerelease,url,publishedAt
git status --short --branch
```

Expected: public main, reviewed feature branch, and `v0.5.0` tag resolve to the reviewed release commit; the GitHub Release is published, not draft/prerelease; both worktrees are clean.

## Final acceptance checklist

- [ ] Desktop header contains identity, current-view trail, and menu only.
- [ ] Desktop has exactly one theme control and no numbered theme rail.
- [ ] Fixed 320-pixel context pane begins with one native theme select followed by one active-layer summary.
- [ ] Rice harvest shows `6,610,315 トン`, `47都道府県`, `令和5年産`, missing-data treatment, representative-point disclosure, and direct official e-Stat source.
- [ ] Rice harvest does not show the rice-price signal as a second headline.
- [ ] No unapproved sum or average is created for reservoir percentages, multiple observations, flows, entities, or demo data.
- [ ] Zero/one/multiple sources, missing URLs, official labels, and unknown freshness render per source without fabrication.
- [ ] Layer list is one column and preserves roving focus, disabled state, Enter, and Space behavior.
- [ ] Map remains the largest surface at all three desktop widths and retains 600 pixels at 1280 with inspector open.
- [ ] Selecting Niigata opens exactly one inspector with `514,100 トン`, period, source, and why-it-matters.
- [ ] Signals and comparison remain intentional secondary views with Escape/close/focus restoration.
- [ ] `theme=`, `mode=`, `selected=`, `layer=`, and `view=` compatibility remains green.
- [ ] Initial notice says `v0.5.0` and remains non-blocking/dismissible.
- [ ] Desktop has no permanent global source strip; stacked/mobile retains its existing strip and behavior.
- [ ] No live, comprehensive, precise-polygon, or official-demo overclaim appears.
- [ ] Full tests, typecheck, build, diff check, desktop browser acceptance, stacked/mobile smoke, and console check pass.
- [ ] Public `main` deploy passes CI and live smoke before tag/Release creation.
- [ ] `v0.5.0` tag and published GitHub Release point to the verified deployment commit.
- [ ] Mobile redesign remains explicitly deferred and is not claimed complete.

## Stop conditions

Stop and request direction if:

- the worktree or main worktree contains unrelated user changes;
- `origin/main` diverges from the reviewed feature branch;
- an active summary requires a new metric, aggregation, source, date, or external dataset not authorized here;
- truthful encoding copy requires precise prefecture boundaries or new licensed geometry;
- the Desktop goal requires Mobile redesign;
- CI/deployment fails three consecutive attempts for the same external blocker;
- the public site cannot be verified as serving the reviewed commit.
