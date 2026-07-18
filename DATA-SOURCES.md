# Data Sources Policy

This repository separates code licensing from source-material handling.

## Code vs. source materials

- Repository code is licensed separately under `Apache-2.0`.
- Source-linked data in `data/seed/` is not treated as a single relicensable corpus.
- `ontology/` contains project-authored semantic structure, but many seeded facts point to third-party source materials.

The public repository intentionally uses `Apache-2.0` rather than `MIT`. The code should remain easy to inspect, fork, and reuse, while the project keeps clearer patent, notice, and trademark boundaries for downstream institutional use.

## Public-sector sources

Government and public-institution sources are handled with attribution-first reuse rules, subject to the terms published by each source.

Operationally, this project:

- cites official/public sources
- summarizes source-linked facts
- links users to the original public source

## Private-sector sources

Private-company materials are handled more narrowly.

Operationally, this project:

- uses fact statements
- uses paraphrase and summary
- links to original pages

Operationally, this project does not:

- republish full private documents
- republish copied tables as a reusable dataset
- claim blanket redistribution rights over private-source materials

## Public/open-data map geometry

The prefecture choropleth separates official metric data from non-official map geometry.

- Metric: [e-Stat / Ministry of Agriculture, Forestry and Fisheries, 2023 rice harvest by prefecture](https://www.e-stat.go.jp/dbview?sid=0002114508) is the official statistical source.
- Geometry: [Natural Earth Admin-1 States, Provinces](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-1-states-provinces/) is open data and is not an official Japanese government source.
- Source version: `Natural Earth 5.1.1`.
- Terms: [Public domain](https://www.naturalearthdata.com/about/terms-of-use/).
- Fixed archive: [ne_10m_admin_1_states_provinces.zip](https://naciscdn.org/naturalearth/5.1.1/10m/cultural/ne_10m_admin_1_states_provinces.zip).
- Archive SHA-256: `efc59726337323058f9446210adc96673179cd344e053666ee3d28cb58ba2b05`.
- Processing: filter the Natural Earth Admin-1 source to Japan's 47 prefectures, organize the attributes, and simplify the shapes for a nationwide display.

Natural Earth describes Admin-1 as beta and generally uses de facto boundaries. The generalized prefecture polygons do not express the Japanese government's position on territory or jurisdiction. They are not legal, surveying, cadastral, or boundary-determination data and must not be used for precise administrative-boundary confirmation.

## Site-level statement

The public site should explain that:

- official and private sources are both referenced
- provenance is shown where possible
- source materials and repository code do not share one identical rights model

## Repository files to consult

- `data/seed/sources.json`
- `docs/official-source-registry.md`
- `docs/official-source-registry.ja.md`
- `README.md`
- `README.ja.md`
