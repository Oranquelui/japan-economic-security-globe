# Theme Expansion PRD: Regional Security First

Status: Draft for implementation planning
Date: 2026-06-18
Repository: `jp-strategic-dependency-graph`

## 1. Decision

The candidate name `Direct Threats` should not become the public theme name. It is too narrow, alarm-oriented, and hard to extend to future China-related air and maritime activity.

Use this theme identity instead:

```text
Theme ID: regional-security
Public label: 地域安全保障
Sublabel: ミサイル / 航空活動 / 海空域
```

This keeps the theme broad enough for:

- North Korean missile and satellite-launch history
- China-related air and maritime activity around Japan
- Taiwan Strait, East China Sea, Sea of Japan, and Southwest Islands context
- EEZ-adjacent incidents and Japanese public-alert context
- links into Japanese defense capability, warning, and space-domain monitoring

It also keeps the theme distinct from the existing and planned dependency themes:

- `regional-security`: surrounding activity, incidents, routes, tests, exercise areas, public alerts
- `defense`: Japan-side budget, capabilities, bases, industrial base
- `space-compute`: satellites, space-domain awareness, AI compute, data centers, electricity, water
- `critical-materials`: upstream material dependence for semiconductors, batteries, defense, energy
- `energy`: fuel, electricity, terminals, and energy transport routes
- `logistics`: civilian cargo, ports, domestic movement

## 2. Expansion Priority

### Priority 1: `regional-security` / 地域安全保障

Primary purpose:

```text
Show Japan-facing regional security activity using public, historical, delayed, and aggregated evidence.
```

Initial content:

- North Korean missile flight-test history
- missile system categories, launch areas, trajectories, and estimated splash / impact areas
- Japanese public-alert and defense-publication context
- China-related air activity routes or representative activity corridors where sourced from official/public material
- links to `defense` capability nodes such as integrated air and missile defense

### Priority 2: `space-compute` / 宇宙・計算基盤

Primary purpose:

```text
Connect AI compute, data centers, satellites, space security, electricity, cooling water, and resilient communications.
```

Initial content:

- satellite and space-domain awareness context
- data-center electricity and cooling-water exposure
- AI compute as a demand driver
- space communications and disaster/defense resilience
- links to `energy`, `water`, `semiconductors`, and `regional-security`

### Priority 3: `critical-materials` / 重要鉱物・素材

Primary purpose:

```text
Explain upstream material dependence for semiconductors, batteries, defense, energy infrastructure, and advanced manufacturing.
```

Initial content:

- rare earths
- lithium, nickel, cobalt, graphite
- gallium, germanium, tungsten, titanium, and high-purity materials
- supplier concentration and chokepoint exposure
- links to `semiconductors`, `energy`, `defense`, and `space-compute`

Boundary rule: this theme owns upstream material exposure. It should not duplicate semiconductor manufacturing nodes or energy-generation assets.

### Priority 4: `bio-health-security` / 医療・バイオ安全保障

Primary purpose:

```text
Track long-run healthcare, pharmaceutical, medical supply, biosecurity, and aging-society resilience.
```

Initial content:

- pharmaceutical ingredients and medical devices
- vaccine / diagnostic supply chains
- hospital and public-health continuity
- quality-of-life / longevity themes
- links to `logistics`, `energy`, and future private institutional layers

This is important but should come after the current MVP becomes stronger at maps, dependencies, policy, and supply-chain evidence.

## 3. `regional-security` Boundary

### Include

- public, historical, delayed, or aggregated activity records
- source-linked evidence from official/public sources
- event and route summaries that explain why Japan should watch a region
- relationships to Japanese defense capabilities without turning the app into a tactical tool
- clear disclosure that the public app is not a live threat-warning system

### Exclude

- live operational tracking of military aircraft, ships, missiles, or units
- targeting, interception, evasion, or tactical guidance
- unverified social-media claims as canonical events
- raw ADS-B/AIS feeds for military activity
- CCTV or sensor feeds
- claims of complete coverage

The public version should be framed as:

```text
historical / official / public / delayed / aggregate / education and policy context
```

not as:

```text
real-time threat dashboard
```

## 4. Ontology Scope

Use:

- product-core ontology
- operational ontology
- presentation ontology

Do not introduce business/pricing ontology in this phase.

## 5. Canonical Entities

### `SecurityActivity`

Public security activity item, such as a missile test, aircraft route, maritime activity, or exercise-area event.

Identifier pattern:

```text
activity:<actor-or-region>:<slug>
```

### `MissileTest`

Historical missile flight test or satellite-launch-related missile event.

Identifier pattern:

```text
missile-test:<date>:<system-or-slug>
```

### `LaunchSite`

Public or approximate launch origin area.

Identifier pattern:

```text
launch-site:<slug>
```

### `ImpactArea`

Estimated splash, impact, overflight, or landing area.

Identifier pattern:

```text
impact-area:<slug>
```

### `MilitaryActivityRoute`

Representative or official/public route/corridor for air or maritime activity. Missile stories should not use this as a connected line to Japan; they should render `ImpactArea` overlays instead. This supports future China-related air/maritime activity without adding live tracking.

Identifier pattern:

```text
activity-route:<actor>:<slug>
```

### `PublicAlertSignal`

Public-alert or public-safety signal, such as J-Alert context or official warnings.

Identifier pattern:

```text
alert-signal:<slug>
```

## 6. Relationship Map

- `MissileTest -> launchedFrom -> LaunchSite`
- `MissileTest -> followsRoute -> MilitaryActivityRoute | Route`
- `MissileTest -> endsNear -> ImpactArea`
- `MissileTest -> usesSystem -> Product | MissileSystem`
- `MissileTest -> hasOutcome -> success | failure | unknown`
- `SecurityActivity -> attributedTo -> Country | Organization`
- `SecurityActivity -> affectsRegion -> Region | Prefecture | SeaArea`
- `SecurityActivity -> observedBy -> SourceDocument`
- `SecurityActivity -> linkedCapability -> CapabilityArea`
- `PublicAlertSignal -> triggeredBy -> SecurityActivity`
- `regional-security -> connectsTo -> defense / space-compute`

Cardinality:

- one `MissileTest` has one or more sources
- one `MissileTest` can have one launch site, one estimated path, and zero or more impact areas
- one `MilitaryActivityRoute` can group many activity observations
- one `PublicAlertSignal` can reference many public-alert events, but must not imply real-time warning coverage

## 7. Source Policy

Use source groups, not a single canonical database.

Machine-readable sources should be preferred, but the product must handle the reality that many Japanese public sources are distributed as CSV, Excel, PDF, or HTML publication pages rather than clean APIs.

Source preference order:

1. official API / SPARQL / CKAN API
2. official CSV / Excel / GeoJSON / tile endpoint
3. official PDF / HTML publication page with a bounded parser or manual seed review
4. public-institution or international official source
5. private or community source as supporting context only

Useful source candidates:

- CNS / NTI North Korea Missile Test Database
- `nagix/nk-missile-tests` as Apache-2.0 visualization/code reference and source-discovery aid
- Japan Ministry of Defense materials on North Korean missile / nuclear development
- Japan Ministry of Defense / Joint Staff public releases for aircraft and maritime activity
- CelesTrak for satellite orbit context when used in `space-compute`
- CSIS Missile Threat as secondary analysis where appropriate

Rights boundary:

- The repository code can stay Apache-2.0.
- Source-linked facts in `data/seed/` are not re-licensed as one corpus.
- If using `nagix/nk-missile-tests`, treat its code license and underlying data rights separately.
- Prefer linking and summarized facts over copying external tables wholesale.

## 8. Cross-Theme Data Source Layer

Theme visualization should not fetch or parse official data directly. Every source should pass through a small adapter layer that normalizes source records into evidence objects that the graph, ranking, and map can share.

Pipeline:

```text
Official/Public Source
-> SourceAdapter
-> SourceSnapshot
-> EvidenceClaim / GeoFeature / TimeSeriesObservation / PolicySignal
-> Theme visual layer
```

### 8.1 Canonical source entities

`SourceAdapter`

- What it is: connector or parser for one source family, such as e-Stat, G-Spatial CKAN, MOD publication pages, or JAXA APIs.
- Why it exists: keeps source-specific formats outside theme logic.
- Owner: source ingestion layer.
- Identifier: `adapter:<source-family>:<slug>`.

`SourceSnapshot`

- What it is: a dated capture of source metadata and source payload references.
- Why it exists: supports provenance, diffing, freshness checks, and reproducibility.
- Owner: source ingestion layer.
- Identifier: `source-snapshot:<source-id>:<YYYY-MM-DD>`.

`EvidenceClaim`

- What it is: a bounded claim extracted from a source, with source ID, date, unit, and confidence.
- Why it exists: prevents raw tables or PDFs from leaking directly into UI.
- Owner: semantic graph layer.
- Identifier: `claim:<source-id>:<slug>`.

`GeoFeature`

- What it is: point, line, polygon, tile, or approximate area used by the map.
- Why it exists: lets map visualization reuse government spatial data without tying map code to each API.
- Owner: presentation/source boundary.
- Identifier: `geo-feature:<source-id>:<slug>`.

`TimeSeriesObservation`

- What it is: normalized time-series observation with date, geography, metric, value, unit, and source.
- Why it exists: supports ranking, trend visualizations, and update checks.
- Owner: ranking/source boundary.
- Identifier: `time-series:<metric>:<date>:<region-or-source>`.

`PolicySignal`

- What it is: official policy, budget, warning, consultation, or procurement signal.
- Why it exists: connects events and dependencies to government response.
- Owner: semantic graph layer.
- Identifier: `policy-signal:<agency>:<slug>`.

### 8.2 Relationship map

- `SourceAdapter -> readsFrom -> SourceDocument | APIEndpoint`
- `SourceAdapter -> produces -> SourceSnapshot`
- `SourceSnapshot -> extracts -> EvidenceClaim | GeoFeature | TimeSeriesObservation | PolicySignal`
- `EvidenceClaim -> supports -> Entity | Flow | Observation | RankingSignal`
- `GeoFeature -> renders -> MapLayer`
- `TimeSeriesObservation -> feeds -> RankingSignal`
- `PolicySignal -> respondsTo -> SecurityActivity | SupplyRisk | DependencyFlow`

### 8.3 Source map by existing and new theme

Existing themes:

- `energy`: Trade Statistics of Japan, Agency for Natural Resources and Energy statistics, JEPX market data, OCCTO/grid-information CSV where applicable
- `logistics`: MLIT National Land Numerical Information, G-Spatial Information Center CKAN, GSI tiles, port/airport statistics where available
- `rice`: MAFF rice price, inventory, transaction, and distribution releases; e-Stat where the same tables are available
- `water`: MLIT river/water-resource pages, JMA drought and precipitation materials, GSI basemaps
- `defense`: MOD budget material, MOD white paper CSV appendices, MOF budget documents
- `semiconductors`: METI semiconductor policy material, Trade Statistics of Japan, e-Stat/METI production statistics where available

New themes:

- `regional-security`: MOD North Korea missile pages, MOD/Joint Staff public releases, FDMA J-Alert materials, CNS/NTI missile database, `nagix/nk-missile-tests` as reference/visualization source
- `space-compute`: JAXA G-Portal Web API, JAXA Earth API, QZSS API, CelesTrak, JEPX, OCCTO/grid information, e-Stat electricity and regional statistics
- `critical-materials`: Trade Statistics of Japan, e-Stat/METI production statistics, JOGMEC material, UN Comtrade, USGS mineral data
- `bio-health-security`: MHLW NDB Open Data, MHLW drug supply status, PMDA publications, Medical Information Net open data, e-Stat health and demographic statistics

### 8.4 Adapter guardrails

- Store source URLs, access method, update cadence, rights notes, and parser confidence with each source record.
- Do not treat unofficial mirrors or GitHub visualizations as canonical unless the source rights are clear.
- Keep API credentials such as `ESTAT_APP_ID` out of seed data and committed files.
- Mark PDF/HTML-derived claims as reviewed or parser-generated.
- For `regional-security`, every adapter must preserve the non-live boundary.

## 9. UI / IA Requirements

Add `地域安全保障` as a first-class theme in the navigation rail.

Recommended static order after addition:

1. `energy`
2. `logistics`
3. `regional-security`
4. `defense`
5. `semiconductors`
6. `rice`
7. `water`

The ranking rail can still reorder by priority, but static fallback should surface `regional-security` early.

Map support:

- historical missile context as estimated landing/impact areas
- estimated launch areas only where they add context
- impact-area radius overlays for missile stories instead of line-connected Japan routes
- representative air/maritime activity corridors
- Japan-facing regions affected by public alerts or EEZ-adjacent activity

Map exclusions:

- live operational military aircraft positions
- live missile tracks
- raw military AIS/ADS-B movement

Detail popup should show:

- source proof
- route / area disclosure
- related capability links
- related `defense` and `space-compute` flows
- non-live disclosure: `公開情報 / 履歴・集約 / ライブ追跡ではありません`

## 10. Ranking

Add an importance axis:

```text
regional_security
```

This axis should map to the `regional-security` theme.

## 11. Acceptance Criteria

The first implementation is complete when:

- `regional-security` appears as a first-class theme.
- A common source-adapter foundation exists for official APIs, public CSV/Excel/GeoJSON, and reviewed PDF/HTML source claims.
- The theme has at least one source-backed North Korea missile-history seed story.
- The theme has a placeholder-safe structure for China-related official/public air or maritime activity routes.
- The map can render at least one historical route/arc or representative corridor.
- Ranking can place a `regional_security` signal in the inbox and briefing.
- Detail popup shows provenance and bounded/non-live disclosure.
- Existing `defense`, `logistics`, and `energy` boundaries do not regress.
- Full tests, lint, and production build pass.

## 12. Follow-On Boundaries

`space-compute` should come after `regional-security`. It can share satellite and space-domain entities, but its main question is infrastructure capacity: satellites, data centers, compute, electricity, cooling water.

`critical-materials` should come after `space-compute`. It should own upstream material dependence and supplier concentration, not duplicate semiconductor manufacturing.

`bio-health-security` should come last. It should own medical and bio supply resilience, not generic healthcare investment content.

## 13. Open Questions

- Which official Japanese source should be the first China-related air-route seed: annual defense white paper, Joint Staff release, or MOD map material?
- Should `MissileSystem` be a `Product` subtype in phase 1, or a new entity kind immediately?
- Should the first map implementation use simplified arcs only, or also add area polygons for EEZ / public-alert regions?
- Should `space-compute` share satellite entities with `regional-security`, or own a separate `Satellite` entity kind from the start?
- Which adapters should be implemented first: e-Stat, G-Spatial CKAN/GSI, MOD publication pages, or JAXA/space APIs?
