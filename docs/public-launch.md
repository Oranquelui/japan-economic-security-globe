# v0.6.0 Distribution Note

Japan Resilience Map v0.6.0 is available at:

https://economic-security.quadrillionaaa.com/

The rice-harvest view now includes 47 generalized prefecture polygons, readable full prefecture names, and direct selection from the map. The official metric remains e-Stat's prefecture rice-harvest data. Its authority is presented separately from the non-official Natural Earth geometry source.

This release does not add a precision inset. Mobile redesign remains deferred.

Repository:

https://github.com/Oranquelui/japan-economic-security-globe

## 日本語のお知らせ

日本レジリエンス地図 v0.6.0 を公開しました。

https://economic-security.quadrillionaaa.com/

コメ収穫量表示に、一般化した47都道府県の地域形状、読みやすい都道府県の正式名称、地図からの直接選択を追加しました。指標は公式の e-Stat 都道府県別コメ収穫量です。地域形状は非公式の Natural Earth オープンデータであり、指標の公式性とは分けて表示します。

精密表示用の inset は追加していません。Mobile再設計は引き続き延期しています。

## Source and boundary notice

- Official metric: [e-Stat / Ministry of Agriculture, Forestry and Fisheries](https://www.e-stat.go.jp/dbview?sid=0002114508).
- Non-official geometry: [Natural Earth Admin-1 States, Provinces](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-1-states-provinces/), version `5.1.1`.
- Terms: [Public domain](https://www.naturalearthdata.com/about/terms-of-use/).
- Fixed archive: [Natural Earth 5.1.1 Admin-1 ZIP](https://naciscdn.org/naturalearth/5.1.1/10m/cultural/ne_10m_admin_1_states_provinces.zip).
- Archive SHA-256: `efc59726337323058f9446210adc96673179cd344e053666ee3d28cb58ba2b05`.
- Processing: the source was filtered to Japan's 47 prefectures, its attributes were organized, and its shapes were simplified for a nationwide display.

Natural Earth Admin-1 is beta and generally uses de facto boundaries. These generalized shapes do not express the Japanese government's position on territory or jurisdiction. They are not legal, surveying, cadastral, or boundary-determination data and must not be used for precise administrative-boundary confirmation.

Natural Earth Admin-1 は beta で、原則として de facto（実効支配）境界を採用した一般化データです。日本政府の領土・管轄に関する公式見解を示すものではなく、法令、測量、境界確定その他の正確な行政区域確認には使用できません。

## What Is Public Now

- official-statistics-first rice launch view
- 47 generalized prefecture polygons with readable full names and selection
- separate authority labels for the official e-Stat metric and non-official Natural Earth geometry
- semantic scope and layer pane
- one contextual evidence inspector
- explicit signals and 47-prefecture comparison views
- source/license surfaces with geometry provenance and limitations
- Cloudflare Workers deployment from GitHub `main`

## What It Is Not Yet

- not a precision boundary or surveying product
- not a statement of Japanese government territory or jurisdiction
- not a completed Mobile redesign
- not complete real-time AIS coverage
- not a live operational intelligence system for real-world decisions
- not a military target-selection interface
- not a sourced regional logistics-impact index; that layer stays disabled until typed metrics exist

## License Position

The code is open source under `Apache-2.0`. Source-linked data is not relicensed as a single corpus and remains subject to source-specific conditions; see [`DATA-SOURCES.md`](../DATA-SOURCES.md).

## Suggested X / LinkedIn Copy

日本レジリエンス地図 v0.6.0 を公開しました。

公式 e-Stat の都道府県別コメ収穫量を、一般化した47都道府県の地域形状と読みやすい正式名称で確認できます。地域形状は非公式の Natural Earth オープンデータで、指標の公式性とは分けて表示しています。都道府県を選ぶと、出典付きのインスペクタが開きます。

精密境界・測量用途ではなく、日本の暮らしや産業への影響を出典付きで読み解くための公開地図です。

https://economic-security.quadrillionaaa.com/

Repo:
https://github.com/Oranquelui/japan-economic-security-globe
