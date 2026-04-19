# Official Source Registry

English | [日本語](official-source-registry.ja.md)

Last updated: 2026-04-11

This project assumes a Japan-first dependency-intelligence layer for people living in Japan.
Accordingly, primary sources should prioritize official government and public-institution APIs, SPARQL endpoints, CSV or Excel files, PDFs, and publication pages. Private-sector materials should remain limited to supporting context such as household impact or supply-chain framing.

## Ingestion Policy

### Tier A: machine-readable sources to connect directly

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

## Implementation Rules

- Every seed item must include `sourceIds` and `provenance`.
- Sources shown in the UI should stay at a granularity that can later map directly into `prov:wasDerivedFrom`.
- When machine-readable sources exist, prefer `API`, `SPARQL`, or `CSV` before relying on PDFs.
- Do not try to ingest everything at once; expand in the order `official-first registry -> adapter implementation -> seed replacement`.
