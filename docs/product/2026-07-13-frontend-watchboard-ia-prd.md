# PRD: Frontend Watchboard Information Architecture

Status: Desktop Power Atlas surface reframe P0–P3 implemented and Task 8 accepted; PR not opened / awaiting explicit authorization
Date: 2026-07-13  
Repository: `jp-strategic-dependency-graph`  
Version context: public Phase 0 / `v0.4.x`
Related:

- `.taskmaster/docs/japan-economic-security-globe-prd.txt` (Phase 0 product PRD)
- `docs/superpowers/specs/2026-04-10-app-design.md`
- `docs/superpowers/specs/2026-04-11-navigation-root-cause-analysis.md`
- `docs/superpowers/specs/2026-04-26-japan-watchboard-reframe-design.md`
- `docs/review/claude-code-diagnosis-kit.md`

> **Historical scope note:** §§1–10 preserve the original 2026-07-13 pre-reframe problem statement, requirements, and execution context. Present-tense wording in those sections describes that historical baseline, not the current product state. See §17 for accepted reframe criteria and §19 for the current verified delivery record.

## 1. Original problem (historical baseline)

At the 2026-07-13 baseline, the public frontend was weaker than the semantic / ranking / seed layers underneath it.

Observed product symptoms:

1. First impression still reads as a structured explorer, not a Japan-first strategic watchboard.
2. Reading order is unstable: theme, inbox, map mode, compare, and detail compete as primary entry points.
3. Evidence depth exists in code (`EvidencePanel`) but is not wired into the live shell; selection detail is reduced to a thin `MapDetailPopup`.
4. Left command pane is overloaded (briefing + logistics board + live lanes + search + sections).
5. There is no shared UI primitive layer; polish is blocked by ad-hoc layout and inline styles.

Root cause is not primarily "missing CSS." Root cause is information architecture and surface responsibility drift, compounded by feature accretion without shell redesign.

## 2. Goal

Make the Phase 0 public frontend readable as a **Japan-first watchboard operating picture**:

> Restore correct information architecture so the map remains the stage, the left pane answers "what Japan should watch now," and evidence is a first-class analytical surface again. Visual polish is secondary and must follow layout correctness.

This PRD prioritizes **Goal A + Goal B**:

| Priority | Name | Intent |
|----------|------|--------|
| P0 | A. Shell / IA | Separate menu vs widget, restore reading order, protect map stage |
| P0 | B. Evidence path | Re-wire evidence as a real analytical surface; keep map popup thin |
| P1 | C. Watchboard feel | Strengthen ranked briefing / freshness / why-now after A+B |
| P2 | D. UI primitives | Extract Panel / Chip / SectionHeader / tokens after A+B stabilize |
| Later | E. Map decomposition | Split `JapanOperationsMapCanvas` when it blocks safe change |

## 3. Success criteria

The work is done when all of the following are true:

### 3.1 Reading order (10-second test)

A first-time desktop user can answer without hunting:

1. Japan is the main subject and the map is the stage.
2. Which theme / signal is currently being watched.
3. Where to open sources / evidence for the selected object.

### 3.2 Menu vs widget separation

- Action bar contains product identity and app-level utilities only.
- Map modes, drawer toggles, and layer controls are not presented as primary menu destinations.
- Left rail / left pane is the primary context navigator (story presets + compact watch list).
- Bottom compare and right/detail evidence behave as analytical widgets, not fake top-level destinations.

### 3.3 Evidence path

- Selecting a map/inbox/table object opens a full evidence surface (not only a short popup).
- Evidence surface includes at least: summary, why it matters for Japan, sources, related entities.
- Map popup, if retained, is a short bridge into the evidence surface.
- `EvidencePanel` is either re-wired into the shell or deliberately replaced by an equivalent first-class surface with no orphan dead path.

### 3.4 Map primacy

- Default desktop layout keeps the Japan map as the largest interactive surface.
- Initial viewport remains Japan-first; no route auto-fit on first load.
- Left and bottom surfaces do not permanently crush the map into a residual strip.

### 3.5 Verification

- Existing unit/component tests still pass, with new/updated coverage for shell structure and evidence wiring.
- `npm test` and `npm run typecheck` pass.
- Manual desktop smoke: theme switch → select object → evidence → source link path works.

## 4. Non-goals

Out of scope for this PRD / goal cycle:

1. New public themes (`regional-security`, `space-compute`, etc.).
2. Live ingestion, paid workspaces, auth, billing.
3. Full design-system overhaul before IA is correct.
4. Full rewrite of MapLibre canvas internals unless required by a blocking bug.
5. Visual "skin refresh" that only changes colors/fonts without fixing surface responsibilities.
6. Military / tactical / threat-targeting UX.
7. Claiming full real-time vessel / flight coverage.

## 5. Current-state diagnosis (baseline)

Key implementation facts at PRD write time:

| Area | State | Implication |
|------|-------|-------------|
| `AppShell.tsx` | Absolute overlays; desktop/mobile dual trees | Hard to keep stable reading order |
| `ActionBar.tsx` | Still hosts map mode controls | Menu/widget boundary is porous |
| `MapInboxPanel.tsx` | Overloaded vertical stack | Primary context is noisy |
| `EvidencePanel.tsx` | Implemented + tested, not mounted in shell | Evidence depth is effectively missing |
| `MapDetailPopup.tsx` | Thin selected-object summary | Bridge only; cannot replace evidence |
| `DependencyGlobe` / `JapanImpactMap` | Orphan components | Dead weight from older globe-first era |
| Design tokens | Thin `palette.ts` only | Polish is expensive until primitives exist |

## 6. Target information architecture

Desktop target:

```text
┌──────────────────────────────────────────────────────────┐
│ Action bar: brand / current theme label / share / menu   │
├────┬───────────────┬─────────────────────────────────────┤
│Rail│ Command pane  │ Japan map stage                     │
│    │ - preset cue  │  - overlays                         │
│    │ - ranked list │  - thin map detail bridge (optional)│
│    │ - search      │                                     │
│    ├───────────────┤                                     │
│    │               │ Evidence widget (right or docked)   │
│    │               │ - summary / sources / related       │
├────┴───────────────┴─────────────────────────────────────┤
│ Comparison widget (collapsible)                          │
└──────────────────────────────────────────────────────────┘
```

Rules:

1. Map remains the stage.
2. Left pane answers "what to watch."
3. Evidence answers "why / based on what."
4. Compare answers "how this ranks among peers."
5. Action bar does not become a control strip.

Mobile may stack, but must preserve the same conceptual order: watch context → map → evidence → compare.

## 7. Work packages

### WP1 — Shell contract

- Document and implement surface ownership in `AppShell`.
- Move map mode controls out of the primary menu/action identity row into a map/widget control zone.
- Reduce always-on chrome that steals map stage.

### WP2 — Left pane compaction

- Keep one primary scroll story in the command pane.
- Briefing remains short and ranked; logistics extras must not bury the watch list.
- Search and list remain synchronized with map/table selection.

### WP3 — Evidence re-wiring

- Mount evidence as a first-class shell surface.
- Keep popup short; deep content lives in evidence.
- Remove or clearly quarantine orphan presentation components that are no longer in the product path.

### WP4 — Regression harness

- Update shell / evidence structure tests.
- Keep URL state shareable (`theme`, `mode`, `selected`).
- Confirm keyboard labels for icon-only controls still exist.

### WP5 — Optional follow-on (after A+B)

- Watchboard feel: stronger why-now, freshness, trend chips.
- UI primitives extraction to stop style drift.
- Map canvas decomposition for maintainability.

## 8. Acceptance checklist

- [x] Action bar no longer presents widget toggles as primary menu items.
- [x] Left pane is the primary context navigator and is less overloaded than baseline.
- [x] Map is visibly the stage on desktop default layout.
- [x] Selected object opens full evidence path with sources.
- [x] Orphan evidence path is eliminated (wired or intentionally removed with tests updated).
- [x] `npm test` and `npm run typecheck` pass.
- [x] README / public framing does not overclaim real-time coverage.

## 9. Risks

| Risk | Mitigation |
|------|------------|
| Evidence drawer reintroduces map crush | Default collapsed or width-capped; map stage measured in review |
| Scope expands into theme expansion | Hard non-goal; link separate regional-security PRD |
| Polish requests derail IA work | Defer pure visual token work to WP5 |
| Mobile regresses while desktop improves | Keep dual-tree smoke check in acceptance |

## 10. Decision for execution

Use this single goal statement for planning and agent execution:

```text
Fix the public frontend information architecture so Japan Watchboard reads as a Japan-first operating picture: map is the stage, left pane is the watch context, evidence is a first-class analytical surface again. Do not start with cosmetic-only polish or new themes.
```

Preferred execution order: **WP1 → WP2 → WP3 → WP4**, then optionally WP5.

---

## 11. 2026-07-15 decision: adopt the Power Atlas surface contract

Status: **Approved for product design; implementation not authorized by this document update**
Reference reviewed: X video showing a Power Atlas-style physical-infrastructure map workspace
Decision owner: product

Adopt the reference product's **surface responsibilities**, not its branding, visual styling, or infrastructure coverage.

The useful pattern is:

1. a compact scope summary and semantic layer deck on the left;
2. the map as the dominant workspace in the center;
3. one contextual inspector on the right after selection;
4. progressive disclosure for signals, comparisons, relationships, and provenance.

This decision extends the earlier rule that "map is the stage." It changes the left pane from a permanently open monitoring inbox into map context, and it removes duplicated selected-object explanations across the map popup and evidence drawer.

### 11.1 What is explicitly not being copied

- The `Power Atlas` name or brand treatment.
- A global country-profile catalog as the public product identity.
- Generic GIS authoring, arbitrary dataset upload, or jSTAT MAP feature parity.
- Claims of comprehensive physical-infrastructure or real-time coverage.
- A tactical operations-room or threat-monitoring tone.

The public product remains **Japan Resilience Map / 日本レジリエンス地図**, with official statistics as the spine and economic security as the explanatory lens.

## 12. Historical 2026-07-15 baseline before the delivered reframe

The production rice surface was reviewed at `https://economic-security.quadrillionaaa.com/` on 2026-07-15.

Observed strengths:

- Japan-first rice view is live.
- The map includes prefecture points and the left pane exposes 47 prefectures.
- Selecting Niigata shows `514,100 トン`, the survey context, official source labels, and related dependency context.
- Provenance, unit, survey year, and related flows already exist in the presentation path.

Observed IA problems:

| Surface | Behavior observed on 2026-07-15 | Problem |
|---------|---------------------------------|---------|
| Left command pane | Briefing, filters, ranked signals, and 47 prefectures share one scroll story | The map context is buried inside an operations inbox |
| Map detail popup | Repeats summary, sources, related flows, and related points | Duplicates the right evidence surface and covers the map |
| Right evidence drawer | Repeats the same selected-object explanation in greater depth | Selection content is split across two competing inspectors |
| Bottom comparison bar | Always advertises comparison as another primary surface | Adds persistent chrome even when the user is not comparing |
| Map modes | `地点 / 集約 / 地域塗り / ルート` | Describes rendering mechanics instead of the user's subject |

At that time, the root problem was **duplication and surface competition**, not missing evidence or missing data primitives.

## 13. Target desktop information architecture

```text
┌──────────────────────────────────────────────────────────┐
│ Brand / scope / search / source freshness / utilities          │
├───────────────┬──────────────────────────┬─────────────────┐
│ Scope summary  │                          │ Context inspector │
│ - headline KPIs │                          │ - value / unit     │
│ - period/source │       Japan map          │ - survey period   │
│                │   dominant workspace     │ - why it matters  │
│ Semantic layers│                          │ - sources          │
│ - harvest      │                          │ - related objects  │
│ - price        │                          │ - graph            │
│ - logistics    │                          │                    │
└───────────────┴──────────────────────────┴─────────────────┘
          Secondary views: signals / comparison / table
```

### 13.1 Surface ownership

| Surface | Owns | Must not own |
|---------|------|--------------|
| Header | Identity, active scope, search, source freshness, share/menu | Map rendering modes or dense filter controls |
| Left context pane | Scope summary, 3–4 headline metrics, semantic layers, legend | A permanent 47-row list or full monitoring inbox |
| Map | Geography, magnitude, spatial relationships, hover label | Long-form evidence or a second full detail panel |
| Right inspector | The selected entity, observation, or flow; official evidence; related relationships | Theme navigation or duplicate ranked lists |
| Signals view | Ranked changes and watch items | Default map context |
| Comparison view | Regional or series comparison when requested | Persistent bottom chrome |

## 14. Interaction rules

1. **No selection:** show the scope summary and semantic layers; keep the right inspector closed or show a concise theme brief.
2. **Hover:** show only label, primary value, unit, and period.
3. **Click:** open one right-side inspector; do not also open a large map popup.
4. **Related object click:** update the same inspector and map focus without creating another surface.
5. **Compare:** enter an explicit comparison view or drawer; do not keep the comparison bar permanently open.
6. **Signals:** open as a deliberate secondary view; do not use the monitoring inbox as the homepage's default frame.

For the rice default, the first semantic layers should be user-facing subjects such as `収穫量`, `価格`, `在庫・政策`, and `物流・投入コスト`. Rendering modes such as point, choropleth, and route remain implementation details selected by the layer definition.

## 15. Presentation and data implications

The existing semantic model remains the source of truth:

- `SemanticEntity`
- `Observation`
- `DependencyFlow`
- `SourceDocument`
- `GraphEdge`

Do not rewrite the ontology for this UI change. Add or derive focused presentation contracts instead:

| Contract | Purpose |
|----------|---------|
| `ScopeSummary` | Headline metrics, period, coverage, and source state for Japan, a prefecture, or a theme |
| `LayerDefinition` | User-facing layer label, semantic inputs, rendering method, legend, source disclosure, and default visibility |
| `SelectionInspector` | One normalized projection for entity, observation, and flow selection |
| `MetricSeries` | Comparable regional or time-series observations with unit and period discipline |

The likely component consolidation is:

```text
MapDetailPopup + EvidencePanel -> one contextual inspector
MapInboxPanel default          -> scope summary + semantic layer deck
MapInboxPanel ranking content  -> separate signals view
OperationsSignalTable          -> explicit comparison/table view
```

## 16. Phased delivery recommendation

### P0 — Remove selection duplication

- Make the right inspector the single selected-object surface.
- Reduce map click feedback to a small anchored label or highlight.
- Preserve URL state, evidence links, and keyboard access.

### P1 — Replace the default inbox frame

- Introduce scope summary metrics and semantic layer controls.
- Move ranked monitoring content into a separate signals view.
- Keep search available without permanently showing all 47 prefectures.

### P2 — Make thematic encoding primary

- Rice opens with a choropleth or another magnitude-bearing regional layer.
- Every layer has a visible legend, unit, period, missing-data treatment, and source disclosure.
- Points and routes remain available when their semantics require them.

### P3 — Separate comparison and monitoring workflows

- Comparison opens intentionally as a drawer, table mode, or dedicated view.
- Signals use ranking and freshness, but no longer frame the default civic map.

## 17. Acceptance criteria for the reframe

- [x] At desktop launch, the map is the largest and clearest surface.
- [x] Left pane shows scope metrics and semantic layers before ranked monitoring content.
- [x] Selecting Niigata opens exactly one detailed inspector.
- [x] Niigata still exposes value, unit, survey year, official source, and why it matters.
- [x] The map is not covered by a second long-form detail popup.
- [x] Rice layer names describe user subjects, not rendering mechanics.
- [x] Comparison and signals remain reachable but are not permanently open.
- [x] URL state, source links, mobile conceptual order, and accessibility remain intact.
- [x] No copy implies live threat monitoring or comprehensive infrastructure coverage.

## 18. Execution boundary

This addendum originally recorded a product and IA decision only. On 2026-07-18, the product owner authorized desktop implementation P0–P3 with Mobile redesign deferred. The reviewed execution source is `docs/superpowers/plans/2026-07-18-power-atlas-desktop-reframe.md`; implementation must remain within that plan and its phased review gates.

## 19. Verified delivery record (2026-07-18)

The desktop reframe was implemented on `codex/power-atlas-desktop-reframe`, starting from the product-doc decision commit `9e32d82`. The pre-documentation delivery head was `c6a06cf487a8e0a26acbce114c920f58f9d15979`. No PR has been opened; publishing remains **awaiting explicit authorization**.

Delivered phases:

| Phase | Verified outcome |
|-------|------------------|
| P0 | Desktop selection resolves into one contextual inspector; the long-form desktop map popup no longer duplicates it. Legacy `theme=`, `mode=`, and `selected=` URLs remain supported, alongside new `layer=` and `view=` state. |
| P1 | The default desktop left pane now owns scope metrics, source/period context, legend, and user-meaningful semantic layers. Layer availability is computed from the runtime workspace inputs so unavailable content is not advertised as usable. Fixed logistics seed routes are labeled `固定デモデータ` and carry no official-source attribution; `物流影響` stays disabled until a typed, sourced impact metric exists. |
| P2 | Regional values keep raw display metadata, missing values remain neutral `データなし`, and hover is limited to label, value, unit, and period. |
| P3 | Signals and comparison are explicit secondary views. Comparison series enforce a shared unit, period, and at least one common source rather than silently combining incompatible rows. URL hydration, Escape/close behavior, and focus restoration are covered. |

Task 8 acceptance was completed with desktop browser checks at 1280×800, 1440×900, and 1680×900. The existing stacked tree received non-regression smoke checks only at 1024×768 and 390×844; this is not Mobile design acceptance.

Acceptance screenshots (all 1440×900):

- [Default rice workspace](../assets/power-atlas-desktop-rice-default.png)
- [Niigata inspector](../assets/power-atlas-desktop-rice-niigata.png)
- [Signals view](../assets/power-atlas-desktop-signals.png)
- [Comparison view](../assets/power-atlas-desktop-comparison.png)

Fresh Task 8 quality evidence: `npm test` passed 72 files / 322 tests, `npm run typecheck` passed, `npm run build` passed, `git diff --check` was clean, and the worktree was clean at `c6a06cf`.

The checked no-live-overclaim criterion means the delivered UI does not present the bundled logistics fixture as current official impact data: fixed demo routes are disclosed as demo, fabricated regional impact scores and `現在` labels are not rendered, and an unavailable demo source is shown as non-link text rather than `href="#"`. Relative fixture labels such as `22分前` are not treated as retrieval dates; when verification time is not provided, the evidence surface says `確認時点不明` / `確認日不明`. A requested `layer=logistics-impact` normalizes to an available visible layer when one exists. Typed, sourced logistics-impact data remains future data work, not silently inferred from route items.

Fresh remediation verification passed `npm test` (72 files / 331 tests), `npm run typecheck`, `npm run build`, and `git diff --check`.

Independent re-review approved remediation head `e731ff7` with no blocking findings. The only remaining delivery step is push/PR publication after explicit authorization. Broader external-data coverage and provenance expansion remain separate data work, not a blocker for this UI delivery. Mobile redesign remains explicitly deferred and is not complete; only the existing stacked-tree smoke boundary passed.
