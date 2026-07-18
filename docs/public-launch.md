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

The `v0.6.0` desktop evidence was recaptured on 2026-07-19 from the final local release candidate after the nationwide-camera and shared-geometry remediation. The synthetic missing-value image was produced separately with the acceptance-only fixture gate:

```bash
PREFECTURE_EVIDENCE_DIR=docs/assets npm run test:e2e:prefecture -- --grep "missing-value evidence"
```

Result: 1 test passed in 15.4 seconds, and port 3101 had no listener after Playwright cleanup. The other ten images came from a fixture-free production build and one `next start` server on `127.0.0.1:3100`. The evidence harness required `tilesLoaded: true` twice, 750 milliseconds apart, together with 47 overview labels and 47 overview polygon IDs, or the relevant selected/smaller-viewport expectation. It did not accept a screenshot on an arbitrary delay alone. Ports 3100 and 3101 had no listener after cleanup.

### Nationwide desktop diagnostics

| Viewport | Zoom | Source-backed prefectures | Full labels | In-camera polygons | Overlaps | Clipped | Tiles settled |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 1280x800 | 5.0 | 47 | 47 | 47 | 0 | 0 | yes |
| 1440x900 | 5.0 | 47 | 47 | 47 | 0 | 0 | yes |
| 1680x900 | 5.0 | 47 | 47 | 47 | 0 | 0 | yes |

The nationwide camera is centered at `[138.45, 35]` with zoom 5.0 so every required desktop viewport reports all 47 unique generalized prefecture polygon IDs, including Okinawa, together with all 47 full labels. No centered precision inset was present, no representative-radius regions were rendered, and the production diagnostics did not expose the acceptance-only missing-value mutation.

### Interaction and contextual-map checks

- Prefecture selection kept one camera: Niigata and Tokyo both stayed at zoom 5.0 when selected, and their URL semantic IDs and inspector headings matched.
- Niigata showed the highest seeded value, 514,100 tons. After real pan and two zoom-control clicks, zoom 7.0 retained the selected Niigata label and 18 visible generalized polygons. The settled Esri reference visibly showed the stable place labels `Nagaoka`, `Sanjo`, and `Shibata` above the fading choropleth.
- Tokyo showed the lowest seeded value, 465 tons. After real pan and four zoom-control clicks, the Kanto view reached zoom 9.0, retained the app-owned `東京都` selected label, rendered zero generalized prefecture polygons, and kept the Tokyo URL after an invisible-polygon click attempt.
- The settled Kanto reference visibly showed `Tokyo`, `Saitama`, `Kawasaki`, `Kawaguchi`, `Koshigaya`, `Matsudo`, and other place labels together with recognizable road/corridor linework. Esri Light Gray Reference does not publish a stable road name or route shield at this scale, so `v0.6.0` makes no road-name claim. An app-owned road-label or alternative-basemap source remains a separate future data/cartography task.
- The separate Kansai capture selected Osaka, preserved zoom 5.0 on selection, then used real pan and controls to reach zoom 7.0 with 32 visible generalized polygons.
- Keyboard `Equal` zoom changed 5.0 to 6.0, and the recenter control returned the same map to zoom 5.0.
- The fixture-only missing-value test proved a neutral polygon fill, border, and label instead of zero-value styling or a circle fallback.
- At 1024x768 and 390x844, the smoke check found no horizontal overflow, crash, precision inset, or circle fallback. The same semantic prefecture-boundary choropleth remained active, with 42 and 31 in-camera polygon IDs respectively, zero representative-radius region IDs, and no forced 47-label desktop cartography. This is not a claim that Mobile redesign is complete.
- The 1440x900 `/sources-license` capture was positioned at the open-data section so one frame visibly includes the `公開・オープンデータ` heading and the Natural Earth entry with rights, boundary limitation, artifact version `natural-earth-5.1.1-japan-prefectures-v1`, and processing date `2026-07-18`.

Application logic console errors: 0. Page errors: 0. Local application request failures: 0. External presentation request failures: 0. Every accepted production-like map screenshot independently passed the bounded `tilesLoaded: true` readiness gate.

### Evidence matrix

| File | Dimensions | SHA-256 |
| --- | --- | --- |
| `prefecture-choropleth-default-1280x800.png` | 1280x800 | `de48790a50e4cf768ec5a8190e7eb4dc2c64ed5a02647e2685e2aa8e50e2ed9e` |
| `prefecture-choropleth-default-1440x900.png` | 1440x900 | `bf67e7df24d3fd4b7aaa9f1ee5267149302680c6a85995c8e1082a43a5001d40` |
| `prefecture-choropleth-default-1680x900.png` | 1680x900 | `015f38300732f9554dae34b7654c2af463342e9036abd14bede301b156632ec4` |
| `prefecture-choropleth-niigata-highest-z7.png` | 1440x900 | `6718f528059f9c81fa31660db111484191f6abf5fa57e27c9579d796d4450465` |
| `prefecture-choropleth-tokyo-lowest.png` | 1440x900 | `e9ec1b544fb443a96e1f398c54540712c6162024c6189530ffca0e97cf229bd7` |
| `prefecture-choropleth-missing-value.png` | 1440x900 | `7763428dba692da09f7d02949271ad9d089b8926ba443691b57e77864e4d2146` |
| `prefecture-choropleth-kanto-z9.png` | 1440x900 | `72f72f3b0464e24dc77dea8ad45a1be394a318c146c5810951965f894c742825` |
| `prefecture-choropleth-kansai.png` | 1440x900 | `a169476027c4284586b403f6e0fc7d76000d81d4a2b1984e5c1a8f49aac424af` |
| `prefecture-choropleth-regression-1024x768.png` | 1024x768 | `5d569da2f1631f56ea11e78d778fc1593638d004a5af54632eb3b799d52d2f37` |
| `prefecture-choropleth-regression-390x844.png` | 390x844 | `283924512b0d25752a10296e33eb7bdc6d9d716231a3b0625296fa8e5fb77ae3` |
| `prefecture-choropleth-sources-license.png` | 1440x900 | `90972d97a1e5092b65e0e9bc93f0b8ef2f850f6e7cf20bc4c1a91dc16d196b86` |

All eleven hashes are unique.

## Suggested X / LinkedIn Copy

日本レジリエンス地図 v0.6.0 を公開しました。

公式 e-Stat の都道府県別コメ収穫量を、一般化した47都道府県の地域形状と読みやすい正式名称で確認できます。地域形状は非公式の Natural Earth オープンデータで、指標の公式性とは分けて表示しています。都道府県を選ぶと、出典付きのインスペクタが開きます。

精密境界・測量用途ではなく、日本の暮らしや産業への影響を出典付きで読み解くための公開地図です。

https://economic-security.quadrillionaaa.com/

Repo:
https://github.com/Oranquelui/japan-economic-security-globe
