# PRD: Frontend Watchboard Information Architecture

Status: P0 implemented (IA + evidence rewiring)  
Date: 2026-07-13  
Repository: `jp-strategic-dependency-graph`  
Version context: public Phase 0 / `v0.3.x`  
Related:

- `.taskmaster/docs/japan-economic-security-globe-prd.txt` (Phase 0 product PRD)
- `docs/superpowers/specs/2026-04-10-app-design.md`
- `docs/superpowers/specs/2026-04-11-navigation-root-cause-analysis.md`
- `docs/superpowers/specs/2026-04-26-japan-watchboard-reframe-design.md`
- `docs/review/claude-code-diagnosis-kit.md`

## 1. Problem

The public frontend is weaker than the semantic / ranking / seed layers underneath it.

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
