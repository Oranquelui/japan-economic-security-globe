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

## Desktop visual acceptance evidence

The `v0.6.0` desktop evidence was recaptured on 2026-07-19 from the reviewed readiness baseline `0f3444b`. The synthetic missing-value image was produced separately with the acceptance-only fixture gate:

```bash
PREFECTURE_EVIDENCE_DIR=docs/assets npm run test:e2e:prefecture -- --grep "missing-value evidence"
```

Result: 1 test passed in 12.8 seconds, and port 3101 had no listener after Playwright cleanup. The other ten images came from a fixture-free production build and one `next start` server on `127.0.0.1:3100`. The evidence harness required `tilesLoaded: true` twice, 750 milliseconds apart, together with 47 overview labels or the relevant selected-label and polygon expectation. It did not accept a screenshot on an arbitrary delay alone. Ports 3100 and 3101 had no listener after cleanup.

### Nationwide desktop diagnostics

| Viewport | Zoom | Source-backed prefectures | Full labels | In-camera polygons | Overlaps | Clipped | Tiles settled |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 1280x800 | 5.3 | 47 | 47 | 46 | 0 | 0 | yes |
| 1440x900 | 5.3 | 47 | 47 | 46 | 0 | 0 | yes |
| 1680x900 | 5.3 | 47 | 47 | 46 | 0 | 0 | yes |

`queryRenderedFeatures` reports 46 polygon features because the generalized Okinawa geometry is outside the fixed nationwide camera while its curated full label and leader remain in the display. The source-backed feature and full-label counts are both 47; this is not a missing-prefecture fallback. No centered precision inset was present, and the production diagnostics did not expose the acceptance-only missing-value mutation.

### Interaction and contextual-map checks

- Map-click selection kept one camera: Niigata and Tokyo both stayed at zoom 5.3 before and after selection. Their URL semantic IDs and inspector headings matched.
- Niigata showed the highest seeded value, 514,100 tons. After real pan and two zoom-control clicks, zoom 7.3 retained the selected Niigata label and 15 visible generalized polygons. The settled Esri reference visibly showed the stable place labels `Nagaoka`, `Sanjo`, and `Shibata` above the fading choropleth.
- Tokyo showed the lowest seeded value, 465 tons. After real pan and four zoom-control clicks, the Kanto view reached zoom 9.3, retained the app-owned `東京都` selected label, rendered zero generalized prefecture polygons, and kept the Tokyo URL after an invisible-polygon click attempt.
- The settled Kanto reference visibly showed `Tokyo`, `Saitama`, `Kawasaki`, `Kawaguchi`, `Koshigaya`, `Matsudo`, and other place labels together with recognizable road/corridor linework. Esri Light Gray Reference does not publish a stable road name or route shield at this scale, so `v0.6.0` makes no road-name claim. An app-owned road-label or alternative-basemap source remains a separate future data/cartography task.
- The separate Kansai capture selected Osaka, preserved zoom 5.3 on selection, then used real pan and controls to reach zoom 7.3 with 27 visible generalized polygons.
- Keyboard zoom changed 5.3 to 6.2678, and the recenter control returned the same map to zoom 5.3.
- The fixture-only missing-value test proved a neutral polygon fill, border, and label instead of zero-value styling or a circle fallback.
- At 1024x768 and 390x844, the smoke check found no horizontal overflow, crash, precision inset, or circle fallback. Desktop 47-label cartography was not forced into those layouts. Their existing point-centric presentation is retained; this is not a claim that Mobile redesign is complete.
- The 1440x900 `/sources-license` capture was positioned at the open-data section so one frame visibly includes the `公開・オープンデータ` heading, the Natural Earth entry with its rights and boundary limitation, and the `民間企業ソース` grouping.

Application logic console errors: 0. Page errors: 0. Local application request failures: 0. Other external presentation request failures: 0. During real pan, zoom, and page changes, Chromium recorded 53 Esri raster requests ending in `net::ERR_ABORTED` and MapLibre emitted 44 corresponding external-raster console messages: 7 Light Gray Base, 26 Shaded Relief, and 20 Terrain Base requests were superseded. These are recorded separately as third-party raster transport cancellations, not reclassified as application errors. Every accepted map screenshot independently passed the bounded `tilesLoaded: true` readiness gate.

### Evidence matrix

| File | Dimensions | SHA-256 |
| --- | --- | --- |
| `prefecture-choropleth-default-1280x800.png` | 1280x800 | `762f5e86f79e2b65d0229174b587107c9e7066d66ffcc38d02dc3dffcbece1da` |
| `prefecture-choropleth-default-1440x900.png` | 1440x900 | `2e79b9fad7ef773bca8181e1512fa1ae38701e5f1230bf3e7f37ece7b3ff1f50` |
| `prefecture-choropleth-default-1680x900.png` | 1680x900 | `cc42e1765661ee2f67cb51fd0488232a6c8caec19991a23c5233f2aba092e080` |
| `prefecture-choropleth-niigata-highest-z7.png` | 1440x900 | `ef9ae95658541a8e0e02e1675de63cba2d6cc0006ca830bcc2de9740d95e7ffb` |
| `prefecture-choropleth-tokyo-lowest.png` | 1440x900 | `566eeeb9133a670f8439a162d3aa233d337eeeb21734dcedef54ec2f51fb85b1` |
| `prefecture-choropleth-missing-value.png` | 1440x900 | `01158e84c465ad27264a4ad6dac614fdda9737d3d46438356b352e15cfc91132` |
| `prefecture-choropleth-kanto-z9.png` | 1440x900 | `b180ee45332d2ea46da90e0e8b8aa55856c1604db7fb2204da1d8177cbd90fce` |
| `prefecture-choropleth-kansai.png` | 1440x900 | `e9888e1ef6df3d177f36b7ffacbd6f0e763bb0de3f68f4a82e089a5b0c327e8a` |
| `prefecture-choropleth-regression-1024x768.png` | 1024x768 | `241e30a3691fee10aca62d478e2e118d509e4aa01a32a0491969183ce21b1cda` |
| `prefecture-choropleth-regression-390x844.png` | 390x844 | `f1b8fb6666d2066585364cd557a6b6491e503e272eb59a53f779fe35c39a4206` |
| `prefecture-choropleth-sources-license.png` | 1440x900 | `02d4d1bd23f9079478c5e3bb556fd8c9e385d7d703b93e260de50c887cdb761a` |

All eleven hashes are unique.

## Suggested X / LinkedIn Copy

日本レジリエンス地図 v0.6.0 を公開しました。

公式 e-Stat の都道府県別コメ収穫量を、一般化した47都道府県の地域形状と読みやすい正式名称で確認できます。地域形状は非公式の Natural Earth オープンデータで、指標の公式性とは分けて表示しています。都道府県を選ぶと、出典付きのインスペクタが開きます。

精密境界・測量用途ではなく、日本の暮らしや産業への影響を出典付きで読み解くための公開地図です。

https://economic-security.quadrillionaaa.com/

Repo:
https://github.com/Oranquelui/japan-economic-security-globe
