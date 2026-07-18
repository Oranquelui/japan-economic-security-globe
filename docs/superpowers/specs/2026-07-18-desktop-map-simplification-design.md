# Desktop Map Simplification Design

**Status:** Product direction delegated to Codex on 2026-07-18; implementation remains gated by spec review and written-spec review
**Release target:** `v0.5.0` before tag creation
**Platform:** Desktop workspace at `xl` and above
**Mobile:** Explicitly deferred; existing stacked composition receives regression checks only

## 1. Decision context

The delivered P0-P3 desktop reframe established the correct foundation: the Japan map is the largest surface, the left pane owns scope and semantic layers, selection opens one right-side inspector, and Signals and comparison are secondary views. Production verification also confirmed that official rice data, URL state, comparison, and the Niigata evidence path work.

The remaining issue is attention competition rather than missing functionality. The desktop currently presents a selected-object strip in the header, a global source-status strip, a numbered theme rail, scope cards, semantic-layer cards, a legend, and secondary actions at the same time. The active rice-harvest view can therefore require several visual hops before a first-time user can state the active metric, unit, period, geography, source, and map meaning.

Evidence:

- [Frontend watchboard IA PRD](../../product/2026-07-13-frontend-watchboard-ia-prd.md)
- [Completed desktop reframe plan](../plans/2026-07-18-power-atlas-desktop-reframe.md)
- [Lazyweb desktop simplification report](https://www.lazyweb.com/report/lazyweb/f1c4c547-3b05-47e4-bc2a-60d55d0125f6/?source=create)

The Lazyweb report confirms two strengths that must remain: map dominance and visible official-source evidence. Its highest-ranked radical option removes the fixed left pane in favor of a map HUD. That option is not adopted because this product needs persistent, readable statistical context beside the map. The report's safer findings are adopted: consolidate the active scope into one reading block, remove competing header chrome, and provide one desktop control location for themes and layers.

## 2. Goal and success test

Make the desktop start state understandable in ten seconds without removing analytical depth.

A first-time user must be able to answer, in this order:

1. What theme and metric are shown?
2. What geography, period, and unit apply?
3. What does the map's visual encoding mean?
4. Which official source supports it?
5. Where do I open selected evidence, Signals, or comparison?

The design succeeds when those answers follow one reading path from the compact header into the left pane and then the map. Selection continues into exactly one right inspector.

## 3. Approaches considered

### A. Map HUD with no fixed left pane

Move five key facts into a ribbon over the map and open all context on demand. This maximizes map area and matches Lazyweb's boldest recommendation, but it weakens persistent provenance, makes layer discovery less obvious, and abandons the approved Power Atlas surface contract.

**Decision:** Reject for `v0.5.0`.

### B. Consolidated fixed context pane

Keep one fixed 320-pixel context pane, remove the separate desktop theme rail, consolidate active scope into one block, and reduce the header to identity, current-view trail, and menu. Theme and layer selection live in the same pane, while active provenance and map meaning remain visible.

**Decision:** Adopt. It reduces competing entry points without hiding the information that makes this product trustworthy.

### C. Copy and spacing polish only

Keep the current shell and change labels, spacing, and the stale release notice. This has the lowest implementation risk but does not solve duplicated navigation or fragmented reading order.

**Decision:** Reject as insufficient.

## 4. Target desktop information architecture

```text
compact header: product | current view trail | menu
----------------------------------------------------
fixed context pane 320 px | dominant Japan map | inspector on selection
  now showing block       | map controls       | one evidence surface
  theme switcher          | hover feedback     |
  layer switcher          |                    |
  legend + map meaning    |                    |
  official source         |                    |
  Signals / comparison    | comparison drawer when requested
```

The map remains the largest surface. The left pane remains open by default but becomes the only desktop location for theme, layer, scope, legend, and active-source context. No new permanent map overlay is introduced.

## 5. Surface design

### 5.1 Compact header

The desktop header contains:

- product identity: `日本レジリエンス地図`;
- one current-view trail, for example `コメ / 収穫量 / 令和5年産`;
- the existing menu/share entry.

Remove the default desktop `選択中` card. Selected-object context belongs to the right inspector after an explicit selection. Remove the disabled default `フィルター解除` button from the map header; filter reset remains local to the Signals workflow where a query can exist.

The global source-status strip is removed from desktop permanent chrome. The stacked/mobile composition keeps its current behavior. Desktop shows active-layer source state in the context pane instead of theme-wide aggregate chips that do not directly explain the visible map.

### 5.2 Consolidated context pane

Remove the separate numbered desktop theme rail. Add one labelled native `<select>` at the top of the fixed context pane with `aria-label="テーマ"`. It contains all existing themes, uses the current `themeId` as its value, and relies on native browser keyboard, typeahead, focus, and Escape behavior. Do not introduce a custom popover, command palette, or a second desktop theme control.

Selecting a different theme invokes the existing theme-transition contract as one state change:

- set the new `themeId`;
- clear `selectedId` and the map popup anchor;
- close the inspector;
- select the next theme's first available default layer;
- clear the legacy map-mode override;
- return the workspace to `map`;
- clear the Signals query;
- serialize the resulting theme/layer/view state through the existing URL path.

Selecting the already-active theme is a no-op. The select remains focused after the native change event; no custom focus transfer is added.

Below the theme switcher, render one `いま表示中` block from a deterministic `ActiveLayerSummary` view model driven by the active semantic layer. It contains only facts that apply to the visible map:

- active metric or subject;
- primary value and unit when a valid aggregate exists;
- geographic coverage;
- period;
- missing-data treatment;
- official-source state and direct link when available.

Do not display a value from another semantic layer in this block. For example, the rice-harvest layer must not present the rice-price signal as a second competing headline. A layer without an explicitly permitted primary metric uses honest non-quantitative copy rather than a fabricated zero, sum, average, or current-status claim. Section 6 defines the only allowed primary-metric rules.

### 5.3 One layer switch

Semantic layers remain separate from themes in the data model, but their only desktop control location is the context pane. Replace the two-column card grid with a compact one-column layer list. Each row shows:

- layer label;
- one short description;
- active state;
- `データなし` only when unavailable.

The list retains roving keyboard focus and disabled-layer behavior. It does not expose render-mode names such as point, choropleth, or route.

### 5.4 Legend, map meaning, and provenance

Attach the legend directly to the active-layer block rather than rendering it as another equal-weight card. Every `LayerDefinition` receives a required, authored `mapEncodingDescription`; do not generate this sentence from `renderMode` alone. The registry must use these content-kind rules:

- prefecture regional metric: representative prefecture points encode the typed value; explicitly say that these are not precise administrative polygons;
- reservoir regional metric: representative water-source points encode the typed fill-rate value;
- observations: related public-observation locations are shown, without claiming the marker itself is a measurement when no regional metric exists;
- entities: related public entities or facilities are shown at their available representative locations;
- flows: representative dependency or supply paths are shown from the registered semantic flows, without live-routing language;
- live logistics domestic/arrival: fixed demo routes or provided arrival points are named as such;
- live logistics impact: unavailable until typed, sourced regional impact values exist;
- theme composite: related public locations and paths are shown without quantitative claims.

The rice-harvest sentence must accurately describe representative prefecture points and value encoding; it must not claim precise prefecture polygons. Registry tests must require a non-empty description for every layer and check the demo/live and geometry-honesty boundaries.

The active source list is resolved only from `activeLayer.sourceIds`, preserving that ID order and matching against the current theme's `SourceDocument` values. Apply these rules:

- one resolved source: show that source;
- multiple resolved sources: show every source in a compact list; do not collapse them into a fabricated aggregate authority or freshness claim;
- a resolved source with a URL: render the direct link;
- a resolved source without a URL: render non-link text;
- a valid existing access date: use the existing freshness formatter;
- missing or invalid access date: keep `確認時点不明` / `確認日不明`;
- zero `sourceIds` on fixed logistics data: show `固定デモデータ` and no official-source badge or link;
- non-demo layer with no resolved sources: show `出典情報なし` and no official-source badge.

The `公式` label is applied per source only when `source.official` is true. Global source counts and stale-source totals are not required in the ten-second reading path. They remain available through the existing source/license destination; this change does not create a new source-management screen.

### 5.5 Map, selection, and secondary views

The map canvas, zoom/recenter controls, hover discipline, and Japan-first initial viewport remain unchanged unless a layout regression requires a scoped adjustment.

Clicking a map object opens the existing right inspector. The same selection must not reappear as a second header card or long map popup. Signals continues to replace the context-pane body only after `シグナルを見る`. Comparison continues to open intentionally as a bottom drawer only after `比較する`.

Escape, close, focus restoration, share URLs, legacy query parameters, `layer=`, and `view=` behavior remain intact.

### 5.6 First-visit notice

Update the stale release sentence to:

`更新: v0.5.0 - 公式統計と意味レイヤーを中心に再構成しました`

The notice remains non-blocking, dismissible, and stored under the existing dismissal contract. No layout or state redesign is included.

## 6. Data and component boundaries

The semantic graph and official-source ingestion remain unchanged. Add this presentation-only contract:

```ts
interface ActiveLayerSummary {
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

Build it from `graph`, the current `ThemeView`, the resolved active `LayerDefinition`, the existing workspace scope, and the optional live-logistics view. Derivation is deterministic:

| Active content | Primary metric | Coverage | Period |
|---|---|---|---|
| `regional-metric` + `riceMainUseHarvestTonsR5` | Sum only when every matching prefecture has a numeric typed value; otherwise `null` | complete: existing prefecture count; incomplete: `numeric/eligible件` | `activeLayer.periodLabel` |
| `regional-metric` + `latestFillRatePercent` | `null`; never sum or average percentages | numeric/eligible water-source count | `activeLayer.periodLabel` |
| `observations` | Use a metric only when the active layer resolves exactly one numeric observation from its explicit `observationIds`; otherwise `null` | existing workspace scope coverage | `activeLayer.periodLabel` |
| `flows`, `entities`, `live-logistics`, `theme-composite` | `null`; never infer a numeric headline | existing workspace scope coverage | `activeLayer.periodLabel` |

No other aggregation is authorized. `missingDataLabel` is `データなし` only for a continuous/regional metric legend or an unavailable requested layer; otherwise it is `null`. `sources` and `sourceFallbackLabel` follow the exact active-source rules in section 5.4. `mapEncodingDescription` is copied from the required authored `LayerDefinition` field; it is not synthesized from runtime data.

Likely affected units:

- `ActionBar`: compact identity and current-view trail;
- `SourceStatusBar`: desktop no longer renders it as permanent chrome; existing stacked behavior remains;
- `NavigationRail`: remove it from the desktop tree and delete the component and its component-only tests if repository search confirms no remaining consumer;
- `ScopeContextPanel`: owns the native theme select, active-layer summary, compact layer list, legend, source, and secondary actions;
- `SemanticLayerDeck`: compact one-column desktop presentation;
- `MapLegend`: visually subordinate integration with the active-layer summary;
- `InitialNoticeModal`: release copy only;
- `AppShell`: geometry and focus wiring for the simplified desktop tree;
- `lib/presentation/workspace`: add the `ActiveLayerSummary` builder and required authored `mapEncodingDescription` metadata under the deterministic rules above.

No seed, ontology, source adapter, ranking algorithm, or external-data ingestion changes are authorized.

## 7. Error and empty states

- An unavailable layer stays disabled and says `データなし`.
- Missing regional observations remain neutral and are never coerced to zero.
- A source without a URL renders as text, not a fake link.
- An unknown verification time remains `確認時点不明` or `確認日不明`.
- A theme with no comparable series keeps comparison disabled.
- An invalid requested layer continues to normalize to an available layer.
- A theme without an aggregate metric uses descriptive scope copy and does not leave a broken numeric slot.

## 8. Accessibility and responsive boundary

- The theme switcher must have an explicit accessible name and full keyboard operation.
- The active layer and unavailable layers retain programmatic pressed/disabled state.
- The current-view trail must not become a second interactive navigation system.
- Focus returns to the invoking control after closing Signals, comparison, or the inspector.
- Desktop verification covers 1280x800, 1440x900, and 1680x900.
- Existing 1024x768 and 390x844 compositions receive smoke checks only. No Mobile layout, typography, navigation, or interaction redesign is accepted in this work.

## 9. Test and verification strategy

Implementation follows test-first red-green-refactor for every behavior change.

Required automated coverage:

- active-layer summary never mixes metrics from another layer;
- compact header exposes theme, layer, and period without selected-object duplication;
- desktop tree has one theme-control location and no numbered theme rail;
- layer list preserves keyboard and disabled behavior;
- active source, missing-data language, and map-encoding sentence are truthful;
- selection still opens exactly one inspector;
- Signals and comparison entry, close, Escape, and focus restoration still work;
- legacy and current URL state remain compatible;
- first-visit notice carries the `v0.5.0` sentence and remains dismissible;
- stacked/mobile structure remains present and receives non-regression coverage.

Before distribution, run the full unit/component suite, typecheck, production build, and `git diff --check`. Then complete desktop browser acceptance at the three target widths, stacked/mobile smoke at the two boundary widths, push through the authorized `main` release path, wait for CI deployment, and verify the public site and browser console.

## 10. Release and documentation

This simplification is part of the still-untagged `v0.5.0` release. Update the frontend PRD, implementation handoff, release note, README screenshots, and formal implementation plan with the final verified result. Do not create a generic `handoff.md`.

Tag and GitHub Release creation happen only after the follow-up commit is deployed and the public desktop acceptance passes. Mobile redesign remains a later release.
