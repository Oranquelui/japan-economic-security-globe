# Prefecture Boundary Choropleth Design

**Status:** User-approved; geometry-source amendment independently reviewed and approved on 2026-07-18
**Release target:** `v0.6.0`
**Platform:** Desktop workspace at `xl` and above; shared geometry correctness applies at every viewport
**Mobile:** Layout and interaction redesign explicitly deferred; shared-map boundary replacement plus regression checks only
**Reference:** User-approved screenshot with full-Japan choropleth, prefecture borders, and prefecture labels

## 1. Decision

Replace the rice-harvest layer's representative-point radius polygons with a geographically meaningful, explicitly generalized prefecture display surface.

The accepted default map contains:

- a 47-feature, generalized first-order administrative boundary surface for map display;
- a restrained choropleth fill driven by the typed rice-harvest value;
- a visible border for every prefecture;
- prefecture names on the full-Japan desktop view;
- the existing map zoom, pan, recenter, selection, URL, inspector, and source-evidence behavior.

Do not add the reference image's centered `精密表示` inset. It duplicates the existing zoom model, obscures the dominant map surface, introduces a second navigation state, and its lock icon could imply a paid or restricted feature. Detailed inspection remains on the primary map.

This decision supersedes the rice-prefecture geometry wording in `2026-07-18-desktop-map-simplification-design.md` section 5.4. Representative points remain valid for entity, facility, observation, reservoir, airport, port, and other point-native layers; they are no longer the final encoding for prefecture-grain statistical layers when licensed boundary geometry is available.

## 2. User problem

The current rice layer draws large circular polygons around prefecture representative coordinates. At the initial national zoom those circles overlap, hide contextual place labels, and suggest an area that is not the prefecture's administrative region. The map also lacks its own prefecture-name layer, while the current raster reference labels do not appear until a higher zoom.

The result is visually strong but geographically ambiguous: a user can see relative magnitude, but cannot reliably map the value to a prefecture shape or read the names of related regions.

## 3. Goal and success test

Make the statistical geography meaningful and legible without reducing the map's dominance or implying surveying precision.

At the default desktop rice-harvest URL, a first-time user must be able to answer:

1. Which prefecture does each value belong to?
2. Which prefectures have relatively higher or lower harvest values?
3. Which prefecture is selected?
4. Where can the user zoom for municipality and city labels plus road-network context?
5. Which source supports the official statistic, and which separate source supports the map geometry?

The design succeeds when all 47 prefectures have a valid boundary feature and readable name treatment, the choropleth remains subordinate to labels and borders, and selection still reaches the existing inspector and evidence path.

## 4. Approaches considered

### A. Bundled Natural Earth Admin-1 snapshot

Filter Natural Earth 5.1.1 Admin-1 States, Provinces data to Japan, retain its 47 prefecture-level features, join them to semantic prefecture entities by ISO 3166-2 code, and bundle a versioned processed artifact with provenance and accuracy limitations.

**Decision:** Adopt for `v0.6.0`. Natural Earth places its vector data in the public domain and allows modification and electronic redistribution without permission. Its generalized geometry is appropriate for a national overview UI, but Admin-1 is published as beta and principally follows a de facto boundary worldview. It is not an authoritative legal or surveying boundary and must not be described as a government view of territory or jurisdiction.

### B. Bundled National Land Numerical Information N03 snapshot

Process the Ministry of Land, Infrastructure, Transport and Tourism National Land Numerical Information administrative-area dataset into a simplified 47-feature artifact.

**Decision:** Defer. The official GSI use navigator determined that the planned dissolve, simplification, coordinate-bearing public Web map, and redistribution requires an application under Survey Act Article 29 or 30. No application or permission has been obtained for this project. N03 remains a future accuracy upgrade only after approval and its required wording are recorded.

### C. Runtime GSI experimental vector tiles

Use the Geospatial Information Authority of Japan experimental vector tiles directly for boundary, road, and label context.

**Decision:** Do not use as the sole critical prefecture surface. The tiles are useful design and validation evidence, but their experimental URL, schema, and content may change. They also do not provide the product's typed prefecture-value join and click surface as directly as a bundled artifact.

### D. Smaller circles plus a label layer

Reduce the existing radius polygons, expose the raster reference labels earlier, and add prefecture names.

**Decision:** Reject as the final state. It improves readability but keeps a geometry encoding the user has explicitly rejected.

## 5. Map rendering contract

### 5.1 Prefecture geometry source

Create one versioned GeoJSON artifact with exactly 47 features derived from Natural Earth 5.1.1 Admin-1 States, Provinces. Filter `adm0_a3 == "JPN"` and join by its `iso_3166_2` value (`JP-01` through `JP-47`). The artifact is a generalized national-overview display surface, not an official cadastral, legal, surveying, territory, jurisdiction, or boundary-determination source. Natural Earth's Admin-1 beta status and principally de facto worldview are provenance facts, not product claims, and must remain visible in metadata and license copy.

Each feature must contain:

- `prefectureCode`: stable two-digit prefecture code derived from `iso_3166_2`;
- `entityId`: matching semantic ID such as `prefecture:niigata`;
- `label`: full Japanese administrative name, including `都`, `道`, `府`, or `県`;
- `geometry`: valid `Polygon` or `MultiPolygon`;
- optional curated label coordinates for dense or multi-island cases.

Processing must:

- preserve valid island geometry and MultiPolygon structure;
- simplify topology conservatively for desktop web use;
- avoid self-intersections and invalid rings;
- retain enough detail for national and prefecture-level zooms;
- record upstream dataset name, version, immutable download URL, upstream SHA-256, terms URL, processing date, and processing command;
- record that Natural Earth vector data is public domain and credit is optional;
- record the Admin-1 beta status and principally de facto worldview;
- record the user-facing limitation that the shape is generalized map-display geometry, does not express the Japanese government's official view of territory or jurisdiction, and is not for legal, surveying, or boundary-confirmation use;
- satisfy the repository's source and license policy before the artifact is committed.

The source URLs are:

- dataset: `https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-1-states-provinces/`;
- terms: `https://www.naturalearthdata.com/about/terms-of-use/`;
- immutable archive: `https://naciscdn.org/naturalearth/5.1.1/10m/cultural/ne_10m_admin_1_states_provinces.zip`;
- verified upstream archive SHA-256: `efc59726337323058f9446210adc96673179cd344e053666ee3d28cb58ba2b05`.

The application must not download the full upstream dataset in the browser.

### 5.2 Choropleth fill

The rice-harvest metric joins to geometry by `entityId` or verified prefecture code, never by display label.

Rendering order from bottom to top:

1. neutral basemap;
2. prefecture choropleth fill;
3. prefecture border;
4. contextual basemap road linework and place labels;
5. app-owned prefecture labels;
6. point-native semantic entities, routes, hover, and selected-state treatment.

The fill uses the existing authored rice-harvest scale and legend. Large-area opacity stays restrained so coastlines, roads, borders, and labels remain readable. A missing typed value uses the existing neutral `データなし` treatment and never becomes zero.

Remove the `createCirclePolygon` path from prefecture-grain regional metric rendering. Do not remove point or radius rendering from layers whose semantics are genuinely point-based.

### 5.3 Borders

Every prefecture receives a neutral border visible at the default national zoom. The selected prefecture receives a stronger border and subtle selected fill treatment in the national and regional overview range. Hover may strengthen the border temporarily but must not introduce a second popup or persistent card.

Borders must remain legible in both supported color themes and against every authorized choropleth value.

Because the Natural Earth artifact is intentionally generalized, it must not imply higher precision as the camera approaches street context:

- from zoom 3.2 through 6.5, show the full choropleth, borders, and selected treatment;
- from zoom 6.5 through 8.5, progressively fade the base fill and borders while city labels and road-network context become dominant;
- by zoom 9, base prefecture fill and borders are visually absent and the polygon layers reach `maxzoom: 9`, removing them from feature queries and pointer hit-testing; the selected prefecture label and inspector state remain;
- verify zoom 7 and zoom 9 against coastline, city-label, and road-network context so the generalized source is not mistaken for a precise municipal or legal boundary.

### 5.4 Prefecture labels

The desktop full-Japan view shows a name treatment for all 47 prefectures. Labels use the full administrative name (`北海道`, `東京都`, `京都府`, `大阪府`, `新潟県`) and sit above the choropleth and contextual basemap.

Use an app-owned symbol source so the initial zoom does not depend on the raster reference layer's current `minzoom`. Every label feature contains an explicit anchor and optional offset. Curated anchor/offset placement is mandatory for dense Kanto and Kansai prefectures and for multi-island cases; compact leader lines are mandatory whenever the visible label is displaced far enough that its target is ambiguous. Labels use a text halo and a layer configuration that renders all 47 after the curated placements are validated rather than allowing default collision handling to hide names.

At 1280x800, 1440x900, and 1680x900, the default national viewport must render exactly 47 unique full names, with no pair of label boxes overlapping and no label clipped by the map viewport or permanent UI. The selected prefecture label must remain visible at every supported desktop zoom. The implementation may adjust label size across desktop zoom levels, but it must not omit a prefecture or reduce every prefecture to an unexplained abbreviation.

Municipality and city labels plus road-network linework remain progressive context through the retained basemap as the user zooms in. The selected Esri Light Gray reference service is intentionally minimal and does not publish stable road names or route shields at the required Kanto zoom. This release must not invent that content or imply it is present. Adding a separately sourced road-name layer requires its own data, attribution, visual-density, and interaction review. This work does not ingest municipality polygons or create a second municipality or road-label dataset.

Context-label acceptance examples:

- in the Niigata area at zoom 7 or closer, at least two city labels, including the selected area's city context, are readable above the choropleth;
- in the Kanto area at zoom 9 or closer, at least two city/ward labels and recognizable road/corridor linework are readable after the generalized polygons disappear;
- the implementation plan must capture the exact stable labels observed from the retained basemap and convert these examples into visual regression assertions.

### 5.5 Selection and zoom

Keep one map and one camera state.

- Below zoom 9, clicking a visible prefecture polygon selects the matching semantic entity.
- At zoom 9 and above, invisible generalized polygons are not interactive. The current selection persists through its label, URL, and inspector, and the user can change selection through the existing non-map selection paths before returning to the overview range.
- Selection updates the existing URL and right inspector contract.
- The selected border remains visually dominant through the national and regional overview range; at detailed zoom it follows the section 5.3 precision fade while the selected label and inspector remain visually dominant.
- Standard map zoom, pan, keyboard, and recenter controls continue to work.
- No centered precision inset, mini-map, magnifier, modal, or lock state is added.
- Selection does not require an automatic zoom. Any later `fitBounds` behavior needs separate interaction review because it changes the user's camera without an explicit zoom action.

## 6. Presentation and copy changes

For the rice-harvest layer, replace the current map-encoding description with accurate polygon language, for example:

> 都道府県の一般化された地域形状を収穫量の濃淡で表示します。境界線と都道府県名から対象地域を確認できます。

The active-layer summary, legend, unit, period, missing-data label, e-Stat source, and source-link behavior remain unchanged except where their copy currently says the map uses representative points.

Add geometry source ID `source:natural-earth-admin1-japan-5-1-1` to the repository source registry and the rice-harvest layer's ordered `sourceIds` after the e-Stat metric source. Set `official: false` and add `sourceCategory: "open-data"`. The active-layer summary therefore lists both the official statistic source and the separate geometry source without presenting them as one authority or adding the `公式` badge to Natural Earth.

Extend the source catalog's current official/private binary classification to `official`, `open-data`, and `private`. `/sources-license` places Natural Earth in a neutral `公開・オープンデータ` group; it must not place it under either `政府・公的機関ソース` or `民間企業ソース`. Existing source records remain backward-compatible through a deterministic category fallback.

Expose the geometry source through all three routes:

- active-layer summary: `地図形状: Natural Earth Admin 1（一般化・加工）` linked to the Natural Earth Admin-1 page;
- MapLibre attribution: compact text `境界: Made with Natural Earth（加工）`;
- `/sources-license`: dataset URL, terms URL, public-domain status, Admin-1 beta and principally de facto worldview, artifact source version `5.1.1`, immutable archive URL and SHA-256, exact processing statement, limitation statement, artifact version, and processing date.

The full processing statement is: `Natural Earth 5.1.1 Admin-1 States, Provinces を日本の47都道府県に絞り、本サービスの全国表示向けに属性整理・簡略化して作成`. The accompanying limitation is: `Natural Earth Admin-1 は beta で、原則として de facto（実効支配）境界を採用した一般化地図です。日本政府の領土・管轄に関する公式見解を示すものではなく、法令、測量、境界確定その他の正確な行政区域確認には使用できません。` It must not imply that Natural Earth, a government, or a surveying authority created or endorsed the processed artifact.

## 7. Data and component boundaries

Likely affected units:

- `components/JapanOperationsMapCanvas.tsx`: replace prefecture circle features with boundary features; add label and selected-border layers; keep point-native layers;
- `lib/presentation/map-canvas.ts`: add a stable prefecture-code/geometry join contract without moving geometry into semantic entities;
- `lib/presentation/basemap-style.ts`: ensure contextual reference labels render above the choropleth at their intended zooms;
- `lib/presentation/workspace.ts`: update the rice map-encoding description;
- `types/semantic.ts`: add the backward-compatible source-category contract;
- `lib/legal/source-catalog.ts`: add the neutral open-data catalog group and fallback classification;
- `data/geo/` or the repository's approved equivalent: versioned processed boundary artifact and provenance metadata;
- source registry and license documentation: geometry-source attribution;
- tests: geometry integrity, layer order, labels, selection, URL, copy, and regression coverage.

Do not change:

- e-Stat value ingestion or rice totals;
- semantic IDs or existing prefecture selection URLs;
- ranking, Signals, comparison, or inspector semantics;
- unrelated facility, route, reservoir, airport, port, observation, or live-logistics layer geometry;
- Mobile layout or interaction. Because `JapanOperationsMapCanvas` is shared, the generalized prefecture boundary source replaces circles at every viewport as a correctness fix; only desktop receives the new 47-label placement and visual acceptance work.

## 8. Error and empty states

- A geometry feature without a semantic match fails validation and is not silently displayed as an unselectable region.
- A semantic prefecture without geometry fails the 47-prefecture completeness test.
- A prefecture without a typed rice value still shows its border and label with neutral fill.
- Invalid or missing geometry attribution blocks release of the artifact.
- Missing Natural Earth provenance, public-domain terms evidence, version, immutable archive SHA-256, beta/de facto worldview record, processing record, neutral source classification, or limitation statement blocks artifact commit and public release.
- If the geometry artifact fails to load, the layer shows an honest unavailable state; it must not silently fall back to misleading radius polygons.
- Contextual basemap label failure must not remove app-owned prefecture names.

## 9. Accessibility

- Keyboard users can reach the existing map canvas and selection workflow.
- Every prefecture feature exposes a concise accessible name and value where the map implementation supports feature-level accessibility.
- Selected state is conveyed by more than color: border weight and inspector state change as well.
- Label contrast and halo are verified over the lowest and highest choropleth fills.
- Zoom controls retain accessible names and visible focus.

## 10. Performance budgets

- The processed boundary artifact must be no larger than 700 KB raw and 250 KB gzip. If the first deterministic result exceeds either budget, simplify conservatively and re-run geometry and visual checks before committing it.
- The map source is added once and updated without rebuilding geometry on every React render.
- Label and fill styling changes use MapLibre paint/layout updates rather than re-creating the map.
- Initial desktop interaction remains responsive at 1280x800, 1440x900, and 1680x900.

## 11. Required verification

Implementation follows test-first red-green-refactor.

Automated coverage must prove:

- the boundary artifact contains exactly 47 unique prefecture codes and entity IDs;
- every feature has non-empty, finite-coordinate, ring-closed, non-self-intersecting, valid Polygon or MultiPolygon geometry;
- all rice prefecture entities match one geometry feature;
- all 47 prefecture codes and entity IDs form one-to-one unique mappings;
- prefecture regional metrics no longer call the circle-polygon generator;
- choropleth, border, reference, prefecture-label, point, and selected layers have the required order;
- zoom expressions preserve the overview at zoom 3.2-6.5 and suppress generalized fill/borders by zoom 9;
- prefecture polygon layers use `maxzoom: 9`, so rendered-feature queries and pointer hit-testing return no generalized polygon at zoom 9 or above;
- the label source contains all 47 full Japanese names;
- the default desktop rendered-feature query returns 47 unique prefecture labels at each required desktop viewport;
- missing values use neutral fill while preserving border and label;
- click selection reaches the same semantic ID, URL state, and inspector as before;
- rice map-encoding copy no longer claims representative-point geometry;
- Natural Earth receives no `公式` badge and appears only in the `公開・オープンデータ` source group;
- the e-Stat rice metric remains official, while existing source records retain their prior fallback classification;
- point-native layers retain their existing rendering contract;
- no `精密表示` inset or second map state is added.

Visual verification must cover:

- rice-harvest default at 1280x800, 1440x900, and 1680x900;
- dense Kanto and Kansai labels at default zoom and one closer zoom;
- all 47 label boxes at each required desktop viewport, with no overlap or viewport clipping;
- Hokkaido, Okinawa, and multi-island prefectures;
- selected Niigata and at least one dense-region selection;
- lowest value, highest value, and missing-data treatments;
- light and dark supported themes if both remain product-supported;
- Niigata at zoom 7 or closer with at least two readable city labels;
- Kanto at zoom 9 or closer with at least two readable city/ward labels and recognizable road/corridor linework;
- zoom 7 and zoom 9 comparisons showing that generalized boundaries fade instead of implying street-level precision;
- 1024x768 and 390x844 regression smoke checks only, with no Mobile redesign.

## 12. Non-goals

- Mobile layout or interaction redesign; shared geometry correctness still applies;
- municipality or city boundary ingestion;
- a separately sourced road-name or route-shield dataset; the retained basemap road linework remains contextual only;
- a precision inset, mini-map, magnifier, modal map, or locked map feature;
- live dependence on experimental GSI vector tiles;
- use of National Land Numerical Information N03 until this project has the required GSI approval and wording;
- changing the rice statistic, period, unit, or official-source evidence;
- redesigning the left context pane, header, inspector, Signals, or comparison drawer;
- applying prefecture polygons to point-native semantic layers.

## 13. Handoff gate

Before implementation planning begins:

1. record Natural Earth 5.1.1 Admin-1, its public-domain terms, immutable archive URL, and verified SHA-256 as the `v0.6.0` geometry source;
2. record its beta/de facto worldview, non-official status, and neutral `open-data` catalog category;
3. use versioned GeoJSON and verify the 700 KB raw / 250 KB gzip budgets;
4. review this amended written specification for product, technical, source, and copy consistency;
5. retain the user's explicit approval of the map direction and delegated source judgment;
6. create the phased implementation plan, then execute it with subagent-driven development and review checkpoints.
