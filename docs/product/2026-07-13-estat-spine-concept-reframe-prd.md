# PRD: e-Stat Spine Concept Reframe

Status: **Approved (Option A)** — ChatGPT deep research + decision memo  
Date: 2026-07-13  
Repository: `jp-strategic-dependency-graph`  
Decision owner: product  
Decision memo: `docs/product/2026-07-13-estat-spine-decision-memo.md`  

Related:

- Research conversation (2026-07-13): e-Stat fit vs economic-security watchboard
- `docs/product/2026-07-13-frontend-watchboard-ia-prd.md` (shell IA — keep)
- `docs/official-source-registry.md` / `.ja.md`
- `.taskmaster/docs/japan-economic-security-globe-prd.txt` (Phase 0 original)
- `lib/config/estat-theme-map.ts` (machine-readable theme ↔ e-Stat map)

---

## 1. Decision

**主従を逆転する。**

| 以前（実装の重心） | これから |
|--------------------|----------|
| 経済安保オペ室が主役 | **公式統計（e-Stat 中心）が骨格** |
| e-Stat は出典の一部 | e-Stat は **第一データ源** |
| 全球ルート / AIS が前面 | 全球・AIS は **文脈の補助線** |
| 「いま注視すべき脅威」 | **「公式数字で、日本の暮らしと産業のどこが脆いか」** |

経済安全保障は **捨てない**。製品名の“監視レーダー”ではなく、**問いのレンズ（lens）** に格下げする。

### 1.1 Product identity (new)

**日本語（推奨公開フレーミング）**

> 日本の公式統計を、地図と根拠つきで読める公共サービス。  
> 暮らし・物価・エネルギー・食料・産業の数字から、「どこが揺れるか」を説明する。

**English**

> A public interface that makes Japan’s official statistics readable on a map with provenance — explaining where household and industrial stress shows up.

**Working product line (UI サブコピー候補)**

1. **日本の数字マップ** — 統計ネイティブ、最も e-Stat と一致  
2. **日本レジリエンス地図** — 脆さ・回復力、公共中立  
3. **日本経済安全保障**（現行名を残す場合）— メインタイトルではなくバッジ / レンズ名に降格

**Approved public title:** **日本レジリエンス地図**（ChatGPT deep research + product; applied in UI via PR #27）。  
「経済安全保障」はテーマ群・レンズ・About 文に残す。  

**Agent handoff (full status + next WP2):** `docs/product/2026-07-13-estat-spine-handoff-prd.md`

---

## 2. Why this reframe

### 2.1 Structural mismatch (problem)

e-Stat is strong at:

- domestic geography (prefecture / municipality)
- periodic official tables (population, prices, production, trade series where published)
- citable, government-backed numbers

The current watchboard is strong at:

- global routes, chokepoints, tanker demo overlays
- narrative “what to watch now”
- intelligence-room UI

Those are different products. Forcing e-Stat to power a near-live geopolitical scanner makes the app feel underpowered and dishonest about data.

### 2.2 Demand signals (research summary)

| Signal | Finding |
|--------|---------|
| e-Stat public interest | High for free official data, learning, regional BI, AI-ready trusted tables; UX friction (“まとめといて”) |
| Economic security interest | High in policy / corporate layers; paid OSINT and supply-chain tools exist |
| Mass daily “econ-sec radar” | Weak; people want explanation when news hits, not a free FRONTEO clone |
| Best white space | **Official stats → Japanese life/industry consequence**, not pure stats portal and not pure intel room |

### 2.3 Non-goals of this reframe

1. Do not delete map shell, evidence panel, ranking, or semantic graph.
2. Do not promise full live AIS / threat dashboard coverage from e-Stat.
3. Do not compete head-on with enterprise economic-security OSINT as the free public MVP.
4. Do not become a raw e-Stat mirror of jSTAT MAP without narrative translation.

---

## 3. Product model

### 3.1 Two layers

```text
Layer A — Official numbers spine (public MVP priority)
  Source family: e-Stat API first; Trade Statistics / BOJ / ministry tables as needed
  Geography: Japan prefectures / regions / facilities as anchors
  UX: map + compare + evidence with citable values and survey dates
  Freshness: honest survey-cycle labels (not “near-live”)

Layer B — Strategic context (thin, bounded)
  Global routes, chokepoints, policy docs, delayed public logistics
  Always labeled as context / supporting / demo or official-public delayed
  Phase 2 institutional product may thicken this layer
```

### 3.2 Core user questions (reordered)

1. **この公式数字は何か、いつの調査か、どこまで信頼できるか**  
2. **日本のどの地域・家計・産業に効くか**  
3. **対外依存や政策の文脈はどうつながるか**（補助）

Old primary (“what should Japan watch operationally right now?”) becomes secondary for public MVP.

### 3.3 Theme priority for e-Stat wins

| Priority | Theme | Role of e-Stat | Global/AIS role |
|----------|-------|----------------|-----------------|
| P0 | Rice / コメ | Harvest, price-related tables where available | thin |
| P0 | Household cost / 物価・家計 * | CPI, household survey | none |
| P0 | Energy domestic / 電力・燃料の国内数字 | electricity, energy balance tables | routes = context only |
| P1 | Logistics domestic / 港湾・貨物の国内統計 | port cargo, freight where published | tanker demo demoted |
| P1 | Semiconductors / 生産・貿易 | production dynamics, trade stats | supply countries = context |
| P2 | Water | reservoir / water stats if on e-Stat; else ministry | thin |
| P2 | Defense budget | not e-Stat primary (budget docs) | keep as policy theme |
| P3 | Regional security | not e-Stat; historical public sources only | keep bounded |

\* Household cost may ship as a **lens/sub-theme** under rice/energy first if we avoid a new `ThemeId` in code immediately; full theme id can follow.

Default homepage theme for public MVP should move from logistics/energy **route theater** toward **rice or domestic energy numbers** once e-Stat live slice lands.

---

## 4. Naming and UI tone

### 4.1 Shell copy direction

| Surface | Avoid | Prefer |
|---------|-------|--------|
| Top title | 経済安全保障オペ室 | 日本の数字 / レジリエンス地図 |
| Briefing | NOW WATCHING threat | 公式に確認できる変化 / 最新の調査値 |
| Source bar | near-live implication | 調査日・公表日・API 取得日 |
| Map routes | primary hero | optional context layer |
| Evidence | ontology flex | 数字・単位・出典 URL・調査周期 |

### 4.2 Keep from current product

- Japan-first map stage
- Left watch/inbox as ranked list of **signals backed by numbers**
- Evidence drawer with sources
- URL state, Apache-2.0, provenance discipline
- Night-atlas visual language (can soften “ops room” language without full reskin)

---

## 5. e-Stat data map (summary)

Machine-readable detail: `lib/config/estat-theme-map.ts`  
Human detail: `docs/product/2026-07-13-estat-data-theme-map.md`

**Spine series families (implementation order)**

1. **Rice** — crop survey / harvest by prefecture (already partially seeded)  
2. **Prices** — CPI items linked to energy/food stress narratives  
3. **Energy** — electricity generation/demand or related energy tables available via e-Stat  
4. **Trade / industry** — where series exist for semiconductors or critical goods proxies  
5. **Population / region** — optional for water stress and labor context  

Every series entry must define:

- `statsDataId` or discovery query strategy  
- geography grain (nation / prefecture)  
- update cadence  
- unit  
- theme ids  
- narrative hook (“why Japan cares”)  
- rights / attribution note  

---

## 6. Work packages

### WP0 — Product freeze (this document) ✅

- Concept reframe written
- Theme priority declared
- Non-goals declared

### WP1 — Validation (1 week, parallel)

See `docs/product/2026-07-13-estat-validation-plan.md`.

- 5–8 interviews (citizen / student / analyst / small biz)
- Landing copy A/B (econ-sec ops vs official-numbers map)
- Success: ≥60% prefer e-Stat-spine framing for free public tool

### WP2 — First vertical slice (implementation)

**One theme, real e-Stat path if `ESTAT_APP_ID` present, seed fallback otherwise.**

Recommended slice: **Rice prefecture harvest (existing seed) → live e-Stat refresh path**

Deliverables:

- adapter call → observation/entity update path (or snapshot cache)
- map choropleth or ranked prefecture list driven by value
- evidence panel shows survey year, unit, e-Stat source link
- source status strip shows official + freshness honestly

### WP3 — Public copy and homepage mode

- Update README / public-launch framing
- Default theme and briefing copy for e-Stat spine
- Demote tanker/AIS to supporting disclosure in energy/logistics

### WP4 — Expand series coverage

- CPI / household
- Domestic energy stats
- Trade/production proxies for semiconductors

### WP5 — Institutional fork (later)

- Keep Layer B thickened for paid: alerts, private overlays, API
- Public site remains civic e-Stat spine

---

## 7. Success metrics

| Metric | Target |
|--------|--------|
| e-Stat-backed signals on homepage lead | ≥1 live or scheduled series within 2 sprints |
| Evidence shows unit + survey date + official URL | 100% of e-Stat-backed observations |
| User task: “find rice harvest for Niigata + source” | completable in <60s without leaving app |
| Overclaim audit | zero “real-time” claims for e-Stat series |
| Interview preference | majority prefer reframe copy vs ops-radar copy |

---

## 8. Risks

| Risk | Mitigation |
|------|------------|
| e-Stat API complexity / appId | seed fallback; clear .env docs; cache snapshots |
| Users still want tanker drama | keep as optional context layer, labeled |
| Name change costs | keep repo name; change public title/copy first |
| Scope creep into full stats portal | one vertical slice before expanding |

---

## 9. Open questions (resolve in validation)

1. Public title: 日本の数字マップ vs 日本レジリエンス地図 vs keep 経済安全保障 as subtitle  
2. New ThemeId for household costs now or later  
3. Whether logistics public default should hide tanker demo entirely  
4. Hosting of e-Stat appId on Cloudflare (secret) for public live fetch vs build-time snapshots only  

---

## 10. Immediate next engineering steps

1. Land this PRD + data map + validation plan in repo  
2. Run validation interviews (WP1)  
3. Implement WP2 rice e-Stat vertical slice on a feature branch  
4. Only after slice works: change default homepage theme/copy  

**Do not** large-bang rename UI before WP2 proves the data path.
