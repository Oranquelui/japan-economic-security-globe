# Official Source Registry

English | [日本語](official-source-registry.ja.md)

Last updated: 2026-06-19

This project assumes a Japan-first dependency-intelligence layer for people living in Japan.
Accordingly, primary sources should prioritize official government and public-institution APIs, SPARQL endpoints, CSV or Excel files, PDFs, and publication pages. Private-sector materials should remain limited to supporting context such as household impact or supply-chain framing.

## Ingestion Policy

### Data access order

Use the most machine-readable official source available, but support the public-sector reality that valuable Japanese sources often appear as CSV, Excel, PDF, or HTML publication pages.

Preferred order:

1. official API, SPARQL endpoint, or CKAN API
2. official CSV, Excel, GeoJSON, vector tile, or XYZ tile endpoint
3. official PDF or HTML publication page with a bounded parser or manual seed review
4. public-institution or international official source
5. private or community source as supporting context only

Every source adapter should record source URL, access method, update cadence, rights notes, parser confidence, and whether credentials are required.

### Tier A: machine-readable sources to connect directly

- `e-Gov Data Portal metadata API`
  - URL: https://data.e-gov.go.jp/data/api_guide
  - Use: official open-data catalog discovery and dataset metadata
- `e-Gov Laws and Regulations Search`
  - URL: https://elaws.e-gov.go.jp/
  - Use: law, policy-document, and legal provenance
- `e-Stat API 3.0`
  - URL: https://www.e-stat.go.jp/api/api-info/e-stat-manual3-0
  - Use: statistical tables, metadata, and regional data
  - Implementation note: requires `appId`; in development it should come from `ESTAT_APP_ID` in `.env.local`
- `Statistics LOD SPARQL`
  - URL: https://data.e-stat.go.jp/lod/sparql/
  - Use: Phase 1 foundation for RDF and SPARQL access
- `National Diet Library Proceedings Search API`
  - URL: https://kokkai.ndl.go.jp/api.html
  - Use: policy statements, deliberation history, and evidence links into laws and budgets
- `BOJ Time-Series Data Search API`
  - URL: https://www.stat-search.boj.or.jp/info/api_manual_en.pdf
  - Use: prices, FX, and macro time-series context
- `G-Spatial Information Center CKAN API`
  - URL: https://front.geospatial.jp/how_to_use/manual8/
  - Use: geospatial dataset search and resource discovery, including PLATEAU and national spatial datasets
- `Geospatial Information Authority of Japan tiles`
  - URL: https://maps.gsi.go.jp/development/siyou.html
  - Use: basemaps, terrain, disaster-related tiles, and map context
- `JAXA G-Portal Web API`
  - URL: https://eolp.jaxa.jp/webapi/
  - Use: satellite observation product search and space/earth-observation source metadata
- `JAXA Earth API`
  - URL: https://data.earth.jaxa.jp/
  - Use: satellite imagery and derived earth-observation visualization
- `QZSS API`
  - URL: https://sys.qzss.go.jp/dod/api.html
  - Use: Japanese satellite-positioning and space-infrastructure context

### Tier B: public statistics and published data files

- `Trade Statistics of Japan`
  - URL: https://www.customs.go.jp/toukei/srch/index.htm
  - Use: country-level import dependency and energy or semiconductor flows
- `Agency for Natural Resources and Energy - Energy Trends`
  - URL: https://www.enecho.meti.go.jp/about/energytrends/202506/pdf/energytrends_all.pdf
  - Use: crude import origins, Middle East dependency, strategic-stockpile days
- `MAFF rice relative transaction prices and volumes, private inventories`
  - URL: https://www.maff.go.jp/j/press/nousan/kikaku/260313.html
  - Use: rice prices and transaction volume
- `MAFF rice distribution trends`
  - URL: https://www.maff.go.jp/j/press/nousan/kikaku/260331.html
  - Use: private inventories, sales volume, and market impact of government stock releases
- `Kanto Regional Development Bureau - real-time capital-region water resources`
  - URL: https://www.ktr.mlit.go.jp/river/shihon/river_shihon00000226.html
  - Use: dam reservoir ratios, drought monitoring, and same-day values such as Ogochi Dam
- `METI Kanto Bureau - Middle East situation response portal`
  - URL: https://www.kanto.meti.go.jp/press/20260402chuto_josei_press.html
  - Use: official guidance on supply consultation, substitution, and stockpile response under Middle East disruption
- `National Land Numerical Information`
  - URL: https://nlftp.mlit.go.jp/ksj/
  - Use: administrative boundaries, transport, land use, disaster risk, public facilities, and GeoJSON/GIS layers
- `Project PLATEAU / 3D city model portal`
  - URL: https://front.geospatial.jp/plateau_portal_site/
  - Use: urban digital-twin context for infrastructure exposure and dense-area visualization
- `JEPX market data`
  - URL: https://www.jepx.jp/en/electricpower/market-data/spot/
  - Use: electricity price and volume context for energy and compute/data-center themes
- `OCCTO grid information`
  - URL: https://www.occto.or.jp/institution/keitoujouhou/
  - Use: grid, demand, transmission, and system-operation context where published as downloadable data
- `JOGMEC public materials`
  - URL: https://www.jogmec.go.jp/index.html
  - Use: energy and mineral resource security context
- `MHLW NDB Open Data`
  - URL: https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000177182.html
  - Use: healthcare demand, regional health, and long-run bio-health-security context
- `MHLW drug supply status`
  - URL: https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/iryou/kouhatu-iyaku/04_00003.html
  - Use: medical drug supply constraints, limited shipment, and suspension signals
- `PMDA publication and product information`
  - URL: https://www.pmda.go.jp/
  - Use: medicine and medical-device regulatory context
- `Medical Information Net open data`
  - URL: https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/iryou/newpage_43373.html
  - Use: hospital and pharmacy facility context

### Tier C: policy, budget, and explanatory materials

- `Ministry of Defense FY2026 Budget Major Projects`
  - URL: https://www.mod.go.jp/en/d_act/d_budget/pdf/fy2026_20260302a.pdf
  - Use: budget lines, capability areas, and capability-level budget amounts
- `Ministry of Finance FY2026 General Account detailed expenditure statement`
  - URL: https://www.mof.go.jp/about_mof/mof_budget/budget/fy2026/ippan2026.pdf
  - Use: detailed budget items and fiscal provenance
- `Prime Minister's Office TSMC courtesy visit`
  - URL: https://www.kantei.go.jp/jp/104/actions/202602/05hyoukei.html
  - Use: policy linkage around semiconductors and economic security
- `Japan Meteorological Agency material on the standardized precipitation index`
  - URL: https://www.jma.go.jp/jma/press/1903/19a/droughtinf20190319.pdf
  - Use: explanation of drought and low-rainfall signal methodology
- `Ministry of Defense North Korea missile-related information`
  - URL: https://www.mod.go.jp/j/surround/northKorea/index.html
  - Use: official Japan-facing missile event context and DPRK missile/nuclear development material
- `Japan Joint Staff press releases`
  - URL: https://www.mod.go.jp/js/press/
  - Use: official public releases on aircraft, maritime, and regional activity around Japan
- `FDMA J-Alert overview`
  - URL: https://www.fdma.go.jp/about/organization/post-18.html
  - Use: public-alert system context and domestic warning-routing explanation
- `Cabinet Office space policy`
  - URL: https://www8.cao.go.jp/space/
  - Use: Japanese space policy, QZSS, and space-security policy context
- `USGS Mineral Commodity Summaries`
  - URL: https://www.usgs.gov/centers/national-minerals-information-center/mineral-commodity-summaries
  - Use: global mineral production, reserve, and market context
- `UN Comtrade`
  - URL: https://comtrade.un.org/
  - Use: international trade cross-checks for critical-material flows

## Current MVP Mapping

- Energy
  - `Trade Statistics of Japan`
  - `Agency for Natural Resources and Energy - Energy Trends`
  - `Middle East situation response portal`
- Rice
  - MAFF February 2026 relative rice transaction prices
  - MAFF February 2026 private rice inventories
- Water
  - MLIT real-time water-resources page
  - JMA drought-monitoring material
- Defense
  - Ministry of Defense FY2026 budget material
  - Ministry of Finance FY2026 detailed budget statement
- Semiconductors
  - METI semiconductor-related materials
  - Prime Minister's Office material
  - Ministry of Finance trade statistics
- Regional Security
  - Ministry of Defense North Korea missile-related information
  - Japan Joint Staff press releases
  - FDMA J-Alert overview
  - CNS/NTI or other public missile-history datasets as supporting source groups
- Space / Compute
  - JAXA G-Portal Web API
  - JAXA Earth API
  - QZSS API
  - JEPX market data and OCCTO grid information
  - e-Stat regional electricity and industry statistics
- Critical Materials
  - Trade Statistics of Japan
  - e-Stat / METI production statistics
  - JOGMEC public materials
  - UN Comtrade and USGS mineral data for international cross-checks
- Bio / Health Security
  - MHLW NDB Open Data
  - MHLW drug supply status
  - PMDA publication and product information
  - Medical Information Net open data

## Implementation Rules

- Every seed item must include `sourceIds` and `provenance`.
- Sources shown in the UI should stay at a granularity that can later map directly into `prov:wasDerivedFrom`.
- When machine-readable sources exist, prefer `API`, `SPARQL`, `CKAN`, `CSV`, `Excel`, `GeoJSON`, or tiles before relying on PDFs.
- Theme code should depend on normalized `SourceSnapshot`, `EvidenceClaim`, `GeoFeature`, `TimeSeriesObservation`, and `PolicySignal` objects, not raw source payloads.
- API credentials such as `ESTAT_APP_ID` must stay in local environment variables and never in committed seed data.
- PDF/HTML-derived records must be marked as reviewed or parser-generated.
- Do not try to ingest everything at once; expand in the order `official-first registry -> adapter implementation -> seed replacement`.
