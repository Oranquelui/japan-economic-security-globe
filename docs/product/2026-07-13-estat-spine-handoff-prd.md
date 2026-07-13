# PRD / Handoff: e-Stat Spine — Japan Resilience Map

**Status:** Option A **approved** and **partially shipped**  
**Date:** 2026-07-13  
**Repo:** `jp-strategic-dependency-graph` (public remote: `Oranquelui/japan-economic-security-globe`)  
**Audience:** Any coding agent (Codex / Claude / Grok) continuing this work without prior chat context  

---

## 0. Read this first (agent bootstrap)

If you are continuing from Codex or a new session:

1. Read **this file entirely**.  
2. Then skim:  
   - `docs/product/2026-07-13-estat-spine-decision-memo.md`  
   - `docs/product/2026-07-13-estat-data-theme-map.md`  
   - `lib/config/estat-theme-map.ts`  
3. **Do not** reopen the product-strategy debate (A vs B vs C). A is closed.  
4. **Next engineering work is WP2** (rice e-Stat vertical slice + one monthly price auxiliary), not more AIS/theater UI.  
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

## 1. Strategic decision (CLOSED)

| Option | Meaning | Result |
|--------|---------|--------|
| **A** | e-Stat / official stats = spine; economic security = lens | **APPROVED** |
| B | Keep econ-sec ops room as hero | Rejected |
| C | Pure stats portal; drop econ-sec language entirely | Rejected |

**Why A (do not re-litigate):**

- e-Stat is strong at prefecture/official/citable/survey-cycle data.  
- Econ-sec “radar” needs trade, policy, AIS, geopolitics — not e-Stat’s core.  
- Free public MVP should not compete with Windward/Kpler/MarineTraffic or enterprise OSINT.  
- White space: **official numbers → household/industry consequence narrative**, not GIS clone and not free OSINT.

**Approval source:** ChatGPT deep research review of the reframe PRD (2026-07-13), accepted by product owner.

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

## 5. NEXT WORK: WP2 — Rice vertical slice (IMPLEMENT THIS)

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
3. Implement WP2 rice slice with clear acceptance criteria.  
4. Avoid forbidden product moves (AIS home, jSTAT clone, real-time claims).  

If anything conflicts with older Phase 0 PRD (`.taskmaster/docs/japan-economic-security-globe-prd.txt`), **this handoff PRD wins for public MVP direction**.

---

## 11. Changelog of product decisions (2026-07-13)

| When | What |
|------|------|
| Research | Google + X + market layout: e-Stat demand ≠ free econ-sec radar |
| PRD | Concept reframe + data map + validation plan landed (PR #26) |
| Deep research | ChatGPT approved A; recommended 日本レジリエンス地図 + rice first + price auxiliary |
| Surface apply | Title, default rice, disable energy AIS, briefing copy (PR #27) |
| **Next** | **WP2 rice e-Stat vertical slice** (this PRD §5) |
