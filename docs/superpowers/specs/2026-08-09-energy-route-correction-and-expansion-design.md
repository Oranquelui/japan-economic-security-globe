# Energy Route Correction and Five-Corridor Expansion Design

Status: Approved for specification (`Option B`); implementation requires written-spec review

Date: 2026-08-09

Decision owner: Product

Target: `Energy / 供給ルート`

Reference URL: <https://economic-security.quadrillionaaa.com/?theme=energy&layer=energy-route>

## Relationship to the 2026-08-08 design

This document extends `2026-08-08-energy-representative-maritime-route-design.md` after production review exposed two unresolved classes of defect:

1. North American routes still cross the map as horizontal lines at the antimeridian.
2. Australia, United States, and Canada routes still use country-centroid origins and inferred presentation geometry.

The product owner's 2026-08-09 approval of Option B supersedes only the earlier first-slice scope decisions that limited conversion to Saudi Arabia and Qatar and suppressed the other three route lines. All five Energy supply flows are now in scope for representative-corridor conversion. The prior design's provenance, non-live disclosure, safe-area, explicit-selection, and evidence rules remain in force.

## 1. Goal

Correct the Energy route display so all five public supply flows render as coherent, evidence-backed representative maritime corridors. No route may appear as a world-spanning horizontal line or begin at a country's geographic centroid. The result must remain an explanatory dependency view, not a vessel tracker or navigation chart.

## 2. Current behavior and confirmed root causes

### Antimeridian discontinuity

The route interpolator normalizes every generated longitude independently into `[-180, 180]`. The renderer then writes the complete coordinate array into one GeoJSON `LineString`. For the United States and Canada routes, adjacent generated points jump between opposite sides of the longitude range, and MapLibre joins them across the full map.

The current production inputs reproduce the defect deterministically:

| Flow | Adjacent longitude transition | Absolute jump |
|---|---:|---:|
| United States Gulf energy | `-179.66 -> +178.92` | `358.58 degrees` |
| Canada LNG | `-179.26 -> +179.41` | `358.67 degrees` |

### Country centroids used as shipping origins

`resolveGlobalSequence` prepends `DependencyFlow.originId` to route geometry. The affected origin entities are country context nodes:

| Flow | Current first coordinate | Problem |
|---|---|---|
| Australia coal | Australia centroid `[133.7751, -25.2744]` | The line begins inland and the generic Australia chain is not coal-corridor specific. |
| United States Gulf energy | United States centroid `[-95.7129, 37.0902]` | The point is not in the Gulf Coast classifier, so the intended Gulf/Panama chain is not selected. |
| Canada LNG | Canada centroid `[-106.3468, 56.1304]` | The point is inland rather than on the Pacific loading side. |

Saudi Arabia and Qatar also use country points as geometry anchors even though their intermediate chokepoints make the visual defect less obvious.

### Missing regression coverage

Existing route-geometry tests cover a Middle East-to-Japan route and a short domestic segment. They do not assert antimeridian topology, country-centroid exclusion, or the Australia, United States, and Canada corridor semantics.

## 3. Desired behavior

### Overview state

- Render five representative Energy corridors: Saudi crude, Qatar LNG, Australia coal, United States Gulf energy, and Canada LNG.
- Keep countries as contextual and selectable nodes, but never use country centroids as route-geometry anchors.
- Render no horizontal world-spanning connector at the antimeridian.
- Do not apply selected styling unless the user explicitly selects a route or supplies a valid `selected=` URL.
- Report `5代表航路` in route-layer coverage rather than counting theme-wide coordinate entities.
- Keep the permanent disclosure that routes are representative, generalized, non-real-time, and unsuitable for navigation.

### Selected state

- Emphasize the selected corridor while leaving the other four as subdued context.
- Fit the selected route's mandatory waypoints inside the unobscured map safe area.
- Show the loading region, principal transit/chokepoint sequence, Japan approach, landing facility, source references, verification date, and limitation statement.
- Keep route selection, country selection, evidence opening, and URL compatibility intact.

### Corridor semantics

The required representative sequences are:

1. Saudi crude: sourced loading point or generalized Gulf loading region -> Strait of Hormuz -> Indian Ocean route -> Strait of Malacca -> Japan approach -> Keihin refinery area.
2. Qatar LNG: sourced loading point or generalized Qatar LNG loading region -> Strait of Hormuz -> Indian Ocean route -> Strait of Malacca -> Japan approach -> Sodegaura LNG terminal.
3. Australia coal: sourced loading point or generalized eastern/northeastern Australia coal-loading region -> western Pacific route -> Japan approach -> Yokohama Port.
4. United States Gulf energy: sourced loading point or generalized U.S. Gulf loading region -> Caribbean approach -> Panama transit -> North Pacific route -> Japan approach -> Keihin refinery area.
5. Canada LNG: sourced loading point or generalized Pacific Coast loading region -> North Pacific route -> Japan approach -> Tomakomai LNG terminal.

These are semantic corridor requirements, not permission to invent exact port or sea-lane claims. A generalized loading region must be labeled as generalized and carry supporting public evidence.

## 4. Domain entities

### DependencyFlow

The economic dependency relation. It keeps the supplier country, destination country, resource, period, magnitude, and risk semantics. It does not directly own render coordinates.

### RepresentativeMaritimeCorridor

A typed, versioned route record linked one-to-one with an approved Energy `DependencyFlow` for this slice.

Required fields:

- stable corridor ID;
- linked flow ID;
- version and verification date;
- ordered mandatory waypoints;
- corridor-level source IDs;
- limitation statement;
- status indicating whether its evidence gate passed.

### RouteWaypoint

An evidence-backed ordered anchor with:

- stable waypoint ID;
- order;
- role: `loading_region`, `export_port`, `chokepoint`, `sea_lane`, `japan_approach`, or `landing_facility`;
- label and coordinates;
- source IDs;
- optional generalized-region disclosure.

### CartographicVertex

A derived interpolation point between approved waypoints. It has no semantic identity and must never appear as a factual node or source claim.

### RenderedRoutePart

One antimeridian-safe coordinate part. A corridor produces one `LineString` when it does not cross the antimeridian and a `MultiLineString` composed of two or more parts when it does.

### ContextCountry

The existing country entity and marker. It remains selectable and related to its flow, but it is not a maritime geometry waypoint.

## 5. Business rules

1. Every rendered Energy route must resolve from a validated `RepresentativeMaritimeCorridor`.
2. A country centroid must never be the first or last coordinate of a maritime corridor.
3. Every mandatory `RouteWaypoint` requires claim-level public evidence.
4. If an exact export port is not supported, use an explicitly generalized loading region only when that region is supported by the approved sources.
5. Missing evidence blocks that corridor from being reported as complete; presentation heuristics must not silently fill the gap.
6. Cartographic interpolation may smooth the path only between approved waypoints.
7. Antimeridian handling must preserve shortest-path continuity and split the geometry at `+180/-180` before GeoJSON rendering.
8. Within every emitted route part, adjacent longitude values must differ by at most 180 degrees.
9. A dateline split must create matching boundary points with the same interpolated latitude on opposite longitude boundaries.
10. Route lines and direction symbols must preserve the existing selection ID and interaction contract after conversion to `MultiLineString`.
11. The UI must identify all five routes as representative and non-real-time.
12. No source, label, or popup may imply a real vessel track, current position, exact voyage, or navigation-grade course.
13. Middle East chokepoint semantics must not regress while the three non-Gulf corridors are added.
14. The public rice-first homepage and non-Energy themes must not change.

## 6. Approved approach and evidence gate

Option B is approved:

- fix antimeridian topology;
- replace centroid-based route origins;
- represent all five flows with explicit corridor data;
- add regression and visual acceptance coverage.

The following remain evidence-resolution tasks during implementation:

- the source-supported loading point or generalized loading region for each corridor;
- the supported principal sea-lane sequence between mandatory chokepoints;
- the supported Japan approach before the existing landing facility.

These are not product-scope choices. If an approved source cannot support one of them, implementation must stop and report the evidence gap rather than substitute an inferred port or route.

## 7. Architecture and data flow

1. Load source records, corridor records, and waypoint records with the semantic graph inputs.
2. Validate corridor-to-flow uniqueness, waypoint order, roles, coordinates, source references, version, and limitation statement.
3. Resolve the active Energy flow to its representative corridor.
4. Build map context points independently from corridor geometry so country markers remain contextual only.
5. Densify each consecutive approved waypoint pair into derived cartographic vertices.
6. Split the densified coordinates at every antimeridian crossing.
7. Emit a GeoJSON `LineString` for one part or `MultiLineString` for multiple parts, preserving one feature ID and selection contract per corridor.
8. Render overview or selected styling from explicit URL/user selection state.
9. Present evidence and disclosure through the existing inspector and active-layer summary.

### Antimeridian split contract

For each adjacent normalized pair:

1. If the absolute longitude delta is at most 180 degrees, keep both points in the current part.
2. If the delta exceeds 180 degrees, temporarily unwrap the destination onto the nearest longitudinal world copy.
3. Interpolate the latitude at the crossed `+180` or `-180` boundary.
4. Close the current part at that boundary.
5. Start the next part at the opposite boundary with the same latitude.
6. Continue with the normalized destination.

The splitter must be deterministic, direction-agnostic, and independently unit tested.

## 8. UI and copy

Permanent route disclosure:

> 公表資料に基づく代表航路です。実際の航行経路は船舶・天候・運航判断により異なります。リアルタイム追跡ではありません。

Required route states:

- validated corridor: `代表航路`;
- evidence gate not passed: `代表航路未整備` with no inferred line;
- selected validated corridor: selected styling plus `選択ルート全体を見る`;
- no explicit selection: five contextual corridor lines with none presented as selected.

Country labels may remain visible for context. Loading-region labels should appear as route facts only when the related corridor is selected or when collision-free at the accepted overview scale.

## 9. Error handling

- Missing corridor or failed evidence validation: do not fall back to the legacy centroid line.
- Invalid waypoint order, coordinate, role, or source: reject the corridor during validation.
- Antimeridian split producing a part with fewer than two points: reject the generated geometry in tests and development diagnostics.
- Land-crossing validation failure outside an allowed loading/landing connector: block that corridor and report the failing segment.
- MapLibre `MultiLineString` interaction regression: withhold the converted route and show the fail-closed `代表航路未整備` state until the selection and direction-symbol contract passes focused tests; never restore a legacy centroid-based line.
- Missing explicit selection: render overview state with no selected route.

## 10. In scope

- all five existing Energy supply flows;
- source-backed corridor and waypoint records;
- source registry additions required by those corridors;
- country-context and geometry-anchor separation;
- deterministic antimeridian splitting;
- `LineString` and `MultiLineString` rendering;
- route disclosure, evidence state, and route-specific coverage;
- selected-route safe-area fitting;
- unit, semantic, component, accessibility, URL-state, and focused browser tests.

## 11. Out of scope

- AIS ingestion or display;
- individual vessels, positions, speed, heading, ETA, or last-seen time;
- navigation-grade routing;
- dynamic weather, conflict, congestion, or operator diversions;
- unsupported alternate corridors;
- a general-purpose maritime routing engine;
- conversion of non-Energy routes;
- broad mobile or shell redesign;
- production deployment unless separately authorized.

## 12. Acceptance criteria

1. The reference URL renders zero horizontal world-spanning route lines.
2. All five Energy supply flows either render a validated representative corridor or fail closed with `代表航路未整備`; completion requires all five to pass the evidence gate and render.
3. No rendered corridor begins or ends at a country-centroid coordinate.
4. The United States route begins on the supported Gulf loading side and passes through the supported Panama/Pacific sequence.
5. The Canada route begins on the supported Pacific Coast loading side and crosses the North Pacific without a horizontal connector.
6. The Australia coal route begins on the supported eastern/northeastern coal-loading side and follows a western-Pacific approach rather than the current inland/Timor inference.
7. Saudi and Qatar retain their required Hormuz and Malacca semantics and terminate at their existing Japan-side facilities.
8. Every emitted route part has at least two coordinates and no adjacent longitude delta greater than 180 degrees.
9. Every antimeridian split has matching boundary latitude at `+180/-180`.
10. Country context markers remain selectable but are absent from route geometry anchors.
11. Route click, hover, direction symbols, selected styling, evidence opening, and URL selection work for both `LineString` and `MultiLineString` corridors.
12. With no explicit selection, no corridor receives selected styling.
13. The active-layer summary reports `5代表航路` and the permanent non-live disclosure is visible.
14. Selected-route fitting keeps mandatory nodes at least 24 CSS pixels inside the unobscured map safe-area edge at 1280x800, 1680x900, and the reported 2048x1176 desktop viewport.
15. Automated land-crossing validation uses the existing `world-atlas` land fixture and permits only documented loading/landing connectors within a 25 km endpoint allowance.
16. The existing rice homepage default, non-Energy themes, route selection contracts, and evidence/source displays do not regress.
17. Focused tests, the full unit suite, type checking, production build, and accepted desktop screenshot checks pass before completion is claimed.

## 13. Test strategy

### Geometry unit tests

- reproduce both confirmed 358-degree North American jumps before the fix;
- assert deterministic splitting in eastbound and westbound directions;
- assert matching boundary latitude and no over-180-degree delta within parts;
- assert non-crossing routes remain one part;
- assert degenerate and boundary-touching inputs are handled without one-point parts.

### Corridor and semantic tests

- validate one corridor per Energy flow;
- validate waypoint order, required roles, coordinates, sources, and limitations;
- prove no country entity coordinate is used as a geometry endpoint;
- prove the three non-Gulf resource/corridor combinations select the approved route data rather than a generic regional heuristic;
- retain Saudi/Qatar chokepoint and landing-facility assertions.

### Map and interaction tests

- assert North American route features use antimeridian-safe `MultiLineString` geometry;
- assert non-crossing corridors use valid `LineString` geometry;
- verify hover, click, direction symbols, selection styling, and route fitting on both geometry types;
- verify overview state has no implicit first-route selection;
- verify `代表航路` and `代表航路未整備` fail-closed states.

### Browser acceptance

- capture the reference route layer at 1280x800, 1680x900, and 2048x1176;
- inspect overview plus each of the five selected corridors;
- verify no horizontal artifact, inland origin, obscured mandatory node, or misleading live language;
- run the full suite, type check, and production build after focused checks pass.
