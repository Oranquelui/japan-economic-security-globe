# e-Stat × Theme Data Map

Date: 2026-07-13  
Companion to: `docs/product/2026-07-13-estat-spine-concept-reframe-prd.md`  
Code: `lib/config/estat-theme-map.ts`

## Purpose

Define which official statistics should power each public theme under the **e-Stat spine** reframe, and which non-e-Stat sources remain context-only.

## Layer rules

1. **Spine series** must be official, citable, and preferably available via e-Stat API 3.0.  
2. **Context series** may be ministry PDFs, Trade Statistics, BOJ, AIS demo — always labeled.  
3. Every spine series needs: unit, geography, cadence, theme hooks, attribution.  
4. Prefer prefecture grain for map choropleth; national series for briefing trends.
5. Prefecture-grain statistics use an attributable regional-boundary artifact with its authority and accuracy stated explicitly; representative-point radius polygons are not the final encoding for the rice prefecture harvest layer.

## Implementation priority

| Order | Family key | Themes | Status in repo today |
|------:|------------|--------|----------------------|
| 1 | `rice-harvest-prefecture` | rice | Seeded (`source:estat-rice-prefecture-harvest-r5`) |
| 2 | `cpi-food-energy` | rice, energy | Not wired as live spine |
| 3 | `energy-electricity-regional` | energy | Registry mentions only |
| 4 | `trade-critical-goods` | semiconductors, energy | Trade Statistics primary; e-Stat secondary |
| 5 | `industry-production` | semiconductors | e-Stat / METI production dynamics |
| 6 | `port-cargo` | logistics | Domestic logistics stats if available |
| 7 | `population-aging` | water, rice (context) | Optional |

## Theme-by-theme map

### Rice / コメ — P0 spine

| Need | Candidate source | Grain | Notes |
|------|------------------|-------|-------|
| Prefecture harvest | e-Stat crop survey (seeded R5 harvest) | prefecture | **First vertical slice** |
| Price / transaction | MAFF releases; e-Stat if mirrored | national / region | Keep dual source |
| Stockpile / policy | MAFF docs | national | Context + evidence |

### Energy / エネルギー — P0 domestic spine + thin global context

| Need | Candidate source | Grain | Notes |
|------|------------------|-------|-------|
| Domestic electricity / energy tables | e-Stat energy-related tables | national / region | Spine for “着地” |
| Fuel import structure | Trade Statistics / ENECHO | national | Official but not always e-Stat |
| Routes / chokepoints | seeded graph + public docs | global | **Context only** |
| Tanker AIS demo | live-logistics seed | routes | **Context / demo**, not spine |

### Logistics / 物流 — P1 domestic spine

| Need | Candidate source | Grain | Notes |
|------|------------------|-------|-------|
| Port cargo / freight proxies | e-Stat / MLIT stats where published | port / region | Prefer over AIS |
| Domestic impact narrative | existing logistics model | corridor | Keep |
| Maritime AIS | demo fixtures | global | Demote in public copy |

### Semiconductors / 半導体 — P1

| Need | Candidate source | Grain | Notes |
|------|------------------|-------|-------|
| Production dynamics | e-Stat / METI | national | Spine candidate |
| Trade partners | Trade Statistics of Japan | national | Stronger than e-Stat alone |
| Foreign supply narrative | seeded flows | global | Context |

### Water / 水 — P2

| Need | Candidate source | Grain | Notes |
|------|------------------|-------|-------|
| Water / environment stats | e-Stat if present; ministry otherwise | region | Validate series before promising |
| Reservoir story | seeded entities | local | Keep as example until stats exist |

### Defense / 防衛 — P2

| Need | Candidate source | Grain | Notes |
|------|------------------|-------|-------|
| Budget flows | budget docs / diet records | national | **Not e-Stat primary** |
| e-Stat | limited | — | Do not force-fit |

### Regional security / 地域安全保障 — P3 for e-Stat

| Need | Candidate source | Grain | Notes |
|------|------------------|-------|-------|
| Missiles / air activity | MOD public historical | event | Out of e-Stat spine |
| e-Stat | none expected | — | Keep bounded non-tactical |

## First vertical slice (WP2)

**Name:** Rice prefecture harvest spine  

**Goal:** User can open theme `rice`, see prefecture values on map/list, open evidence with:

- value + unit  
- survey year / table title  
- e-Stat attribution  
- link or stable source id  

**Path:**

1. Use existing seed observations for offline.  
2. If `ESTAT_APP_ID` set, attempt `getStatsData` / meta refresh via `lib/official/estat.ts`.  
3. Write snapshot under a deterministic cache key (optional Phase).  
4. Ranking/briefing can lead with harvest stress or related price signal — still Japan impact first.

**Approved desktop geometry:**

- render the 47 prefectures with Natural Earth 5.1.1 Admin-1 generalized polygons joined by stable prefecture code or semantic entity ID;
- encode harvest value with restrained choropleth fill and visible borders;
- show full Japanese prefecture names on the national desktop view;
- keep municipality, city, and road names as progressive zoom context;
- use the primary map's existing zoom rather than adding a centered `精密表示` inset or second map state.
- progressively fade the generalized prefecture fill and borders above zoom 6.5, making them visually absent by zoom 9 so street context does not imply boundary precision;
- treat the shared-map boundary replacement as a correctness fix at every viewport while deferring Mobile layout and interaction redesign.

Canonical interaction and data-boundary specification: `docs/superpowers/specs/2026-07-18-prefecture-boundary-choropleth-design.md`.

## Attribution (always)

UI and exports must credit:

> このサービスは、政府統計の総合窓口(e-Stat)のAPI機能を使用していますが、サービスの内容は国によって保証されたものではありません。

(When e-Stat API is used; mirror official credit guidance.)

For the processed prefecture geometry, show the separate geometry source, processing statement, and limitation:

> Natural Earth 5.1.1 Admin-1 States, Provinces を日本の47都道府県に絞り、本サービスの全国表示向けに属性整理・簡略化して作成

> Natural Earth Admin-1 は beta で、原則として de facto（実効支配）境界を採用した一般化地図です。日本政府の領土・管轄に関する公式見解を示すものではなく、法令、測量、境界確定その他の正確な行政区域確認には使用できません。

The geometry source must be reachable from the active-layer summary, MapLibre attribution, and `/sources-license`. Natural Earth vector data is public domain and permits modification and electronic redistribution without permission; credit remains included for source transparency. The source record is explicitly non-official, receives no `公式` badge, and is listed in a neutral `公開・オープンデータ` catalog group. Provenance pins the immutable 5.1.1 archive URL and SHA-256 `efc59726337323058f9446210adc96673179cd344e053666ee3d28cb58ba2b05`. National Land Numerical Information N03 is deferred until this project obtains the required GSI approval for the planned processing and public map use.

## Out of scope for spine

- Real-time vessel positions from e-Stat (impossible)  
- Claiming survey data is “live”  
- Replacing Trade Statistics / BOJ where they are the true primary  
