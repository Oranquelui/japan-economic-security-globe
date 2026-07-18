# PRD / Handoff: e-Stat Spine — Japan Resilience Map

**Status:** Option A **approved**; rice/e-Stat public path present; desktop surface reframe P0–P3 implemented and Task 8 accepted; PR not opened / awaiting explicit authorization
**Date:** 2026-07-13  
**Historical pause:** 2026-07-13 (usage budget) — superseded by the 2026-07-18 implementation authorization
**Repo:** `jp-strategic-dependency-graph` (public remote: `Oranquelui/japan-economic-security-globe`)  
**Audience:** Product owner + any coding agent (Codex / Claude / Grok) continuing without prior chat

---

## 0. Current continuation state

### Current state and historical reconciliation

| Item | State |
|------|--------|
| Strategy | **Option A closed** — e-Stat spine, econ-sec = lens |
| Surface ship | Done (PR #27): title 日本レジリエンス地図, default `rice`, energy AIS off |
| Theater UI | Done earlier: Night Atlas, scanner, curved maritime routes |
| **Rice/e-Stat path** | Present on current `main` and reviewed production: 47 prefectures, Niigata `514,100 トン`, survey context, official source |
| **2026-07-13 WP2 pause** | Historical only; do not restart the old checklist |
| **Desktop surface reframe** | P0–P3 implemented; Task 8 desktop acceptance completed |
| Implementation branch | `codex/power-atlas-desktop-reframe` (product-doc base `9e32d82`; pre-documentation delivery head `c6a06cf487a8e0a26acbce114c920f58f9d15979`) |
| PR | **Not opened / awaiting explicit authorization** |
| Production | `https://economic-security.quadrillionaaa.com/` |

### Continuation checklist (agent or human)

1. Read this current-status section and §12.
2. Read `docs/product/2026-07-13-frontend-watchboard-ia-prd.md` §11–18.
3. Read `docs/superpowers/plans/2026-07-18-power-atlas-desktop-reframe.md`.
4. Use the isolated branch `codex/power-atlas-desktop-reframe`.
5. Review the completed P0–P3 delivery and Task 8 evidence; do not restart the historical WP2 checklist or treat Mobile as redesigned.

### Implementation direction (north star for code)

```text
DO
  · Make rice theme prove: official number → prefecture → evidence (unit, year, source)
  · Prefer seed-first reliability; live e-Stat when ESTAT_APP_ID present
  · Add one monthly price/CPI auxiliary so the product is not annual-only
  · Keep Japan-first shell, ranking, evidence drawer, URL state

DON'T
  · Put AIS / tanker theater on homepage
  · Claim real-time for survey series
  · Build jSTAT MAP feature parity
  · Multi-theme live e-Stat before rice path is solid
  · Large-bang English→Japanese internal renames that block WP2
```

### Historical 2026-07-13 WP2 task plan (retained for provenance)

| Step | Task | Done when |
|------|------|-----------|
| 1 | Audit rice seed + sources (`data/seed/*`, `source:estat-rice-prefecture-harvest-r5`) | Know what already exists vs gaps |
| 2 | Surface unit + survey year + source in evidence/detail/ranking for a prefecture | Niigata (or any pref) shows provenance in UI |
| 3 | Optional live path: `lib/official/estat.ts` + snapshot/cache when `ESTAT_APP_ID` | Documented; seed still works without key |
| 4 | Map/list: rice = prefecture choropleth or ranked list first (not global route hero) | Default rice UX matches spine story |
| 5 | One monthly auxiliary (うるち米価格 or food CPI) card/trend | Habit-loop note in briefing/evidence |
| 6 | Tests + typecheck | `npm test` + `npm run typecheck` green |
| 7 | PR → CI → merge → production smoke (`?theme=rice`) | Acceptance checklist §5.3 all true |

**Timebox hint:** one focused session for steps 1–3 + tests; second session for auxiliary + polish + ship if needed.

### Later e-Stat work

See §6: optional interviews (WP1), copy polish (WP3), more series (WP4), institutional Layer B (WP5).

---

## 0b. Read this first (agent bootstrap)

If you are continuing from Codex or a new session:

1. Read **this file entirely** (or at least §0 + §5).
2. Then skim:  
   - `docs/product/2026-07-13-estat-spine-decision-memo.md`  
   - `docs/product/2026-07-13-estat-data-theme-map.md`  
   - `lib/config/estat-theme-map.ts`  
3. **Do not** reopen the product-strategy debate (A vs B vs C). A is closed.  
4. **The authorized desktop surface reframe is implemented through P0–P3 and Task 8 acceptance**; the old WP2 pause instructions are historical.
5. Keep Japan-first map shell, evidence panel, ranking, URL state, provenance discipline.

### One-line product identity

> **日本レジリエンス地図** — 公式統計を地図と根拠つきで読み、暮らし・物価・食料・エネルギー・地域産業のどこが揺れやすいかを説明する公共Web。  
> 経済安全保障は **問いのレンズ** であり、製品の監視レーダー名ではない。

### Elevator / non-goal / credit

| Field | Text |
|-------|------|
| Elevator | 日本の公式統計を、地図と根拠つきで読み替え、暮らし・物価・食料・エネルギー・地域産業のどこが揺れやすいかを一目で説明する公共Webアプリ。 |
| Non-goal | リアルタイム脅威監視盤・AISトラッカーを名乗らない。jSTAT MAP の代替を作らない。 |
| Credit | e-Stat API 利用時は公式クレジット（国が内容を保証するものではない）を必ず表示。 |

---

## 1. Strategic decision (CLOSED) — Option A explained

| Option | Meaning | Result |
|--------|---------|--------|
| **A** | e-Stat / official stats = **spine**; economic security = **lens** | **APPROVED** |
| B | Keep econ-sec ops room / AIS theater as hero | Rejected |
| C | Pure stats portal; drop econ-sec language entirely | Rejected |

### What Option A means in plain language

**Problem we hit:** The product was drifting into a free “economic security ops room” (tankers, chokepoints, near-live drama). That story needs trade/AIS/policy OSINT. e-Stat is excellent at **survey-cycle official statistics by prefecture**, not at becoming MarineTraffic. Free MVP cannot win as OSINT theater; it also should not become a jSTAT MAP clone.

**Option A’s answer:**

1. **Spine (what the product is built on)**
   Official Japanese statistics (e-Stat first, 統計ダッシュボード for monthly prices when useful).
   Map + ranking + evidence show **numbers you can cite**: value, unit, survey date, source URL/id.

2. **Lens (how we frame why it matters)**
   Economic security / resilience language stays as the **question**:
   “Where is Japan’s household, food, energy, industry exposure fragile?”
   — not as the product name or a claim of live threat radar.

3. **Two layers**
   - **Layer A (public MVP priority):** prefecture official numbers, rice-first.
   - **Layer B (thin, later thicker for institutions):** routes, policy context, delayed demos — always labeled supporting/historical/demo.

4. **What users should feel**
   “I understand **Niigata rice harvest (year, unit, official source)** in under a minute” — not “I am watching tankers in real time.”

5. **What we refuse**
   Homepage AIS theater; “real-time” for annual surveys; jSTAT feature race; multi-theme live API before one theme is honest end-to-end.

**Why not B:** Free ops room loses to commercial maritime intel and overclaims relative to data quality.
**Why not C:** Dropping all resilience/econ-sec framing throws away the product’s distinctive “why it matters” narrative; A keeps the lens without lying about the spine.

**Approval source:** ChatGPT deep research review of the reframe PRD (2026-07-13), accepted by product owner.

**Why A (short, do not re-litigate):**

- e-Stat is strong at prefecture/official/citable/survey-cycle data.  
- Econ-sec “radar” needs trade, policy, AIS, geopolitics — not e-Stat’s core.  
- Free public MVP should not compete with Windward/Kpler/MarineTraffic or enterprise OSINT.  
- White space: **official numbers → household/industry consequence narrative**, not GIS clone and not free OSINT.

Related docs:

| Doc | Role |
|-----|------|
| `docs/product/2026-07-13-estat-spine-concept-reframe-prd.md` | Original reframe PRD |
| `docs/product/2026-07-13-estat-spine-decision-memo.md` | Short A/B/C freeze |
| `docs/product/2026-07-13-estat-data-theme-map.md` | Human data map |
| `docs/product/2026-07-13-estat-validation-plan.md` | Optional interviews |
| `docs/product/2026-07-13-frontend-watchboard-ia-prd.md` | Shell IA (keep) |
| `lib/config/estat-theme-map.ts` | Machine-readable series registry |

---

## 2. Frozen public non-goals

1. Do **not** claim real-time threat monitoring or full AIS tracking.  
2. Do **not** put AIS / tanker theater on **homepage initial display**.  
3. Do **not** build a jSTAT MAP / generic GIS replacement (save/extract/report factory).  
4. Do **not** force e-Stat to power global chokepoint / missile themes.  
5. Do **not** large-bang rename remaining English internal strings if it delays WP2; public-facing title/copy already updated.

---

## 3. What is already shipped (do not redo)

As of main after PR #27 (`feat: apply e-Stat spine public surface`):

| Area | State | Key files |
|------|--------|-----------|
| Public title | `日本レジリエンス地図` | `components/ActionBar.tsx` |
| Subtitle | `公式統計から読む暮らしと産業` | `ActionBar.tsx` |
| Default theme | `rice` | `lib/config/theme-registry.ts` → `DEFAULT_THEME_ID` |
| Spine theme preference | `rice → energy → logistics` | `PUBLIC_SPINE_THEME_IDS`, `buildHomepageLeadSelection` in `lib/presentation/ranking.ts` |
| Briefing labels | `最新の調査値` / `公式出典` (not “Now watching”) | `WatchboardBriefing.tsx`, `watchboard.ts` |
| Energy AIS theater | **Disabled** (`buildLiveLogisticsView("energy")` returns `null`) | `lib/presentation/live-logistics.ts` |
| Theme copy (rice/energy) | Domestic/official-stats oriented questions | `theme-registry.ts` |
| README | Points at reframe docs | `README.md`, `README.ja.md` |
| Night-atlas UI / scanner routes / curved maritime geometry | Already on main from prior PRs | map canvas, palette, route-geometry |

**Production:** `https://economic-security.quadrillionaaa.com/`  
**Default unauthenticated homepage should open rice-first, not energy tanker theater.**

### Shell / IA constraints still in force

From IA PRD (keep):

- Map is the stage  
- Action bar is identity/utility, not map-mode menu (map modes live on map widget)  
- Evidence is first-class drawer  
- Single semantic graph → presentation models  

---

## 4. Product model (two layers)

```text
Layer A — Official numbers spine (PUBLIC MVP priority)
  Sources: e-Stat API first; 統計ダッシュボード API for monthly price/CPI if useful
  Geography: Japan prefectures / regions
  UX: map + ranked list + evidence with unit, survey date, official URL
  Freshness language: survey cycle — never “near-live” for e-Stat

Layer B — Strategic context (thin)
  Global routes, chokepoints, policy docs, delayed logistics demos
  Always labeled supporting / historical / delayed / demo
  Phase 2 institutional product may thicken this later
```

### Theme priority (public MVP front)

```text
rice → energy → logistics → semiconductors → water → defense → regional-security
```

- **P0 spine:** rice, domestic energy numbers, (price auxiliary)  
- **P1:** logistics domestic stats, semiconductors production/trade  
- **Not e-Stat front:** regional-security, defense budget theater  

---

## 5. Historical WP2 acceptance reference — do not restart

### 5.1 Goal

Prove the e-Stat spine with **one end-to-end theme**:

User can open **rice**, see **prefecture harvest values** on map and/or ranked list, open evidence, and see:

- value + **unit**  
- **survey year / table title**  
- e-Stat (or seed) **attribution**  
- official **link or stable source id**  
- e-Stat credit disclaimer when API used  

### 5.2 Preferred data path

| Piece | Guidance |
|-------|----------|
| Primary | Pref. rice harvest — already seeded as `source:estat-rice-prefecture-harvest-r5` |
| Registry | `lib/config/estat-theme-map.ts` → `rice-harvest-prefecture` (`status: "seeded"`, first vertical slice) |
| Live path | `lib/official/estat.ts` when `ESTAT_APP_ID` is set |
| Fallback | Deterministic seed JSON when appId missing (must still pass tests offline) |
| Auxiliary (required design, implement with or right after primary) | One monthly series: うるち米小売価格 **or** food/energy CPI via 統計ダッシュボード API if easier |

### 5.3 Acceptance criteria (WP2 done only if all true)

- [ ] 47 prefectures have harvest (or clear missing) values on map choropleth **or** ranked list  
- [ ] Selecting a prefecture/observation shows unit + survey year + source label + link/source id in evidence or detail  
- [ ] With `ESTAT_APP_ID`: documented live refresh path works (or explicit snapshot write)  
- [ ] Without `ESTAT_APP_ID`: seed path works; CI/tests green  
- [ ] Manual task: “Find Niigata rice harvest + source” completable in &lt;60s  
- [ ] No UI copy claims e-Stat series are real-time  
- [ ] e-Stat credit string present when API path used  
- [ ] `npm test` and `npm run typecheck` pass  

### 5.4 Suggested implementation order (agent)

1. Audit existing rice seed: `data/seed/observations.json`, `entities.json` (prefectures), `sources.json` (`source:estat-rice-prefecture-harvest-r5`).  
2. Ensure presentation path surfaces unit + survey date (detail / evidence / ranking explanation).  
3. Wire optional live fetch in `lib/official/estat.ts` + thin loader; cache snapshot if needed.  
4. Map: prefer prefecture choropleth / ranked list for rice over global route mode.  
5. Add **one** price auxiliary card or trend in briefing/evidence (dashboard API or seed).  
6. Tests: unit for loader/mapping; component test that evidence shows unit + year for a prefecture.  
7. Update README public framing if default launch URL should be `?theme=rice`.  

### 5.5 Key code entry points

| Concern | Path |
|---------|------|
| Default theme | `lib/config/theme-registry.ts` |
| e-Stat series registry | `lib/config/estat-theme-map.ts` |
| e-Stat client | `lib/official/estat.ts` |
| Seed load | `lib/data/seed-loader.ts` |
| Theme view / detail | `lib/semantic/selectors.ts`, `lib/semantic/detail.ts` |
| Map model | `lib/presentation/map-canvas.ts` |
| App shell | `components/AppShell.tsx` |
| Evidence | `components/EvidencePanel.tsx` |
| Env | `.env.example` → `ESTAT_APP_ID` |

### 5.6 Out of scope for WP2

- AIS theater return on energy  
- Multi-theme live e-Stat  
- Full 統計ダッシュボード coverage  
- Paid / institutional workspace  
- Renaming git repository  

---

## 6. Later work packages (after WP2)

| WP | Name | Notes |
|----|------|-------|
| WP1 (optional) | Validation interviews | `docs/product/2026-07-13-estat-validation-plan.md` — not a blocker for WP2 |
| WP3 | Public copy/launch polish | README launch URL, remove remaining ops language |
| WP4 | Expand series | CPI, electricity, port cargo, production |
| WP5 | Institutional Layer B | Alerts, private overlays, API — separate product |

---

## 7. Success metrics (product)

| Metric | Target |
|--------|--------|
| Homepage default | rice / official-stats framing, not tanker theater |
| e-Stat-backed rice path | unit + survey date + source on every displayed harvest observation |
| User task (Niigata harvest + source) | &lt;60s for most testers |
| Overclaim audit | zero “real-time” claims for survey series |
| Tests | `npm test` + `npm run typecheck` green |

---

## 8. Risks (for implementers)

| Risk | Mitigation |
|------|------------|
| e-Stat API complexity / no appId in CI | Seed fallback always; live optional |
| Rice is annual → weak habit loop | Add one monthly price/CPI auxiliary |
| jSTAT MAP comparison | Narrative + evidence + ranking, not GIS feature parity |
| Econ-sec fans miss tanker drama | Keep Layer B accessible via energy theme context later; not homepage |

---

## 9. Commands

```bash
npm test
npm run typecheck
npm run dev
# optional live e-Stat
# ESTAT_APP_ID=... in .env.local
```

Deploy path (this repo): push/merge to `main` → GitHub Actions CI → Cloudflare Workers (`economic-security.quadrillionaaa.com`).

---

## 10. Definition of “Codex can continue safely”

An agent with **only this PRD** can:

1. Know A is approved and not reopen strategy.  
2. Know what is already on production.  
3. Know the WP2 rice semantic slice and desktop P0–P3 reframe are already delivered and must not be rebuilt as continuation work.
4. Independently review the delivered branch and publish only when explicitly authorized, or extend it through separately scoped new work.
5. Avoid forbidden product moves (AIS home, jSTAT clone, real-time claims).

If anything conflicts with older Phase 0 PRD (`.taskmaster/docs/japan-economic-security-globe-prd.txt`), **this handoff PRD wins for public MVP direction**.

---

## 11. Changelog of product decisions (2026-07-13)

| When | What |
|------|------|
| Research | Google + X + market layout: e-Stat demand ≠ free econ-sec radar |
| PRD | Concept reframe + data map + validation plan landed (PR #26) |
| Deep research | ChatGPT approved A; recommended 日本レジリエンス地図 + rice first + price auxiliary |
| Surface apply | Title, default rice, disable energy AIS, briefing copy (PR #27) |
| Handoff PRD | Agent bootstrap + WP2 acceptance (§0–5) written for Codex |
| **Historical pause** | 2026-07-13 usage-budget pause; superseded after current-state verification |
| **Delivered desktop work** | P0–P3 completed on `codex/power-atlas-desktop-reframe`; PR not opened / awaiting explicit authorization (`docs/superpowers/plans/2026-07-18-power-atlas-desktop-reframe.md`) |

---

## 12. 2026-07-15 UI direction: Power Atlas surface responsibilities

**Canonical UI decision:** `docs/product/2026-07-13-frontend-watchboard-ia-prd.md` §11–18
**Decision:** Adopt the reference video's surface responsibilities, not its brand or global-infrastructure product scope.
**Implementation status:** P0–P3 implemented and Task 8 accepted on `codex/power-atlas-desktop-reframe`; PR not opened / awaiting explicit authorization.

### Current guardrails and delivered state

1. Keep the approved Option A product model: official statistics are the spine; economic security is the explanatory lens.
2. Keep Japan and the map as the primary subject.
3. The default left surface is the compact scope summary and semantic layer deck; do not restore the permanent monitoring inbox as the desktop default.
4. Desktop detailed selection is consolidated into one contextual right-side inspector; keep map click/hover feedback lightweight and do not reintroduce a duplicate long-form popup.
5. Ranked signals and comparison are deliberate secondary views; keep them reachable without making them permanent map chrome.
6. Keep user-meaningful layer names (`収穫量`, `価格`, `在庫・政策`, `物流・投入コスト`) rather than rendering mechanics (`地点`, `集約`, `地域塗り`, `ルート`).
7. Keep value, unit, survey year, official URL/source id, freshness language, URL state, and accessibility intact.
8. Do not restart completed P0–P3. Independently review the delivered branch, and publish only with explicit authorization; any extension must be separately scoped new work.

### Status reconciliation completed 2026-07-18

The earlier sections in this handoff record the 2026-07-13 pause state as `WP2 not started`. A live production review on 2026-07-15 showed a rice-first surface with 47 prefectures and a Niigata detail path exposing `514,100 トン`, survey context, official sources, and related flows.

The reconciliation confirmed that current `main` already contains the rice-first semantic/data path described above. The 2026-07-13 `WP2 not started` wording is historical, not an instruction to rebuild or delete current work.

### Desktop delivery evidence (2026-07-18)

The implementation branch starts from the product-doc decision commit `9e32d82`. P0 consolidated desktop selection into one inspector and preserved legacy URLs; P1 added the scope/semantic-layer workspace with data-aware runtime availability; P2 preserved raw and null regional values and added disciplined hover; P3 made signals and comparison explicit secondary views, with comparable series constrained to a shared unit, period, and common source. New `layer=` and `view=` URLs are supported without invalidating legacy `theme=`, `mode=`, and `selected=` links.

Task 8 browser acceptance covered desktop at 1280×800, 1440×900, and 1680×900. Non-regression smoke covered the existing stacked tree at 1024×768 and 390×844 only; Mobile redesign remains deferred and is not complete.

Acceptance screenshots (all 1440×900):

- [Default rice workspace](../assets/power-atlas-desktop-rice-default.png)
- [Niigata inspector](../assets/power-atlas-desktop-rice-niigata.png)
- [Signals view](../assets/power-atlas-desktop-signals.png)
- [Comparison view](../assets/power-atlas-desktop-comparison.png)

At pre-documentation head `c6a06cf487a8e0a26acbce114c920f58f9d15979`, fresh Task 8 verification passed: `npm test` (72 files / 322 tests), `npm run typecheck`, `npm run build`, and `git diff --check`; the worktree was clean. There are no known desktop acceptance blockers. Independent final code review remains outstanding, and no push or PR is authorized. Broader external-data coverage and provenance expansion remain separate data work rather than a UI blocker.

### Handoff file policy

Do **not** create a new generic `handoff.md`. This file remains the e-Stat/product-state handoff, while the frontend IA PRD above remains the canonical source for the Power Atlas-style UI decision.
