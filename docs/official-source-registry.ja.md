# 公式ソース台帳

[English](official-source-registry.md) | 日本語

最終更新: 2026-06-19

このプロジェクトは、`日本の日本人のための dependency intelligence layer` を前提にしています。
そのため、一次ソースは原則として `政府機関・公的機関の公式 API / SPARQL / CSV / Excel / PDF / 公表ページ` を優先し、民間資料は家計影響などの補助的文脈に限定します。

## 取り込み方針

### データアクセス優先順位

利用できる場合は最も機械可読な公式ソースを使います。ただし、日本の公的データでは CSV、Excel、PDF、HTML 公表ページとして提供される重要情報も多いため、それらも同じ source adapter 層で扱います。

優先順位:

1. 公式 API / SPARQL / CKAN API
2. 公式 CSV / Excel / GeoJSON / vector tile / XYZ tile
3. 公式 PDF / HTML 公表ページ。限定的な parser または manual seed review を必須にする
4. 公的機関または国際機関の公式ソース
5. 民間・コミュニティソースは補助文脈に限定

すべての source adapter は、source URL、access method、更新頻度、rights note、parser confidence、credential 要否を記録します。

### Tier A: 直接接続する機械可読ソース

- `e-Govデータポータル メタデータ取得API`
  - URL: https://data.e-gov.go.jp/data/api_guide
  - 用途: 公式オープンデータカタログの探索、dataset metadata
- `e-Gov法令検索`
  - URL: https://elaws.e-gov.go.jp/
  - 用途: Law / PolicyDocument / legal provenance
- `e-Stat API 3.0`
  - URL: https://www.e-stat.go.jp/api/api-info/e-stat-manual3-0
  - 用途: 統計表、メタデータ、地域別データ
  - 実装メモ: `appId` 必須。開発時は `.env.local` の `ESTAT_APP_ID` から受ける。
- `統計LOD SPARQL`
  - URL: https://data.e-stat.go.jp/lod/sparql/
  - 用途: RDF / SPARQL 接続の phase 1 基盤
- `国会会議録検索システム API`
  - URL: https://kokkai.ndl.go.jp/api.html
  - 用途: 政策発言、審議、法令・予算との evidence graph
- `BOJ Time-Series Data Search API`
  - URL: https://www.stat-search.boj.or.jp/info/api_manual_en.pdf
  - 用途: 価格、為替、マクロ時系列の補助文脈
- `G空間情報センター CKAN API`
  - URL: https://front.geospatial.jp/how_to_use/manual8/
  - 用途: 地理空間データセット検索、PLATEAU や国土空間データの resource discovery
- `国土地理院 地理院タイル`
  - URL: https://maps.gsi.go.jp/development/siyou.html
  - 用途: ベースマップ、地形、災害関連タイル、地図文脈
- `JAXA G-Portal Web API`
  - URL: https://eolp.jaxa.jp/webapi/
  - 用途: 衛星観測 product search、宇宙・地球観測 metadata
- `JAXA Earth API`
  - URL: https://data.earth.jaxa.jp/
  - 用途: 衛星画像、地球観測 derived data の可視化
- `QZSS API`
  - URL: https://sys.qzss.go.jp/dod/api.html
  - 用途: 日本の衛星測位、宇宙インフラ文脈

### Tier B: 公開統計・公開データファイル

- `Trade Statistics of Japan`
  - URL: https://www.customs.go.jp/toukei/srch/index.htm
  - 用途: 国別輸入依存、エネルギー・半導体フロー
- `資源エネルギー庁 エネルギー動向`
  - URL: https://www.enecho.meti.go.jp/about/energytrends/202506/pdf/energytrends_all.pdf
  - 用途: 原油輸入先、中東依存、備蓄日数
- `農水省 米の相対取引価格・数量、民間在庫`
  - URL: https://www.maff.go.jp/j/press/nousan/kikaku/260313.html
  - 用途: コメ価格、相対取引数量
- `農水省 米穀流通の動向（集荷、販売、民間在庫）`
  - URL: https://www.maff.go.jp/j/press/nousan/kikaku/260331.html
  - 用途: 民間在庫、販売数量、政府備蓄米の市場反映
- `関東地方整備局 首都圏の水資源状況（リアルタイム）`
  - URL: https://www.ktr.mlit.go.jp/river/shihon/river_shihon00000226.html
  - 用途: ダム貯水率、渇水監視、小河内ダムなどの当日値
- `経済産業省 関東経済産業局 中東情勢関連対策ポータル`
  - URL: https://www.kanto.meti.go.jp/press/20260402chuto_josei_press.html
  - 用途: 中東情勢を受けた供給相談窓口、代替調達・備蓄対応の公式案内
- `国土数値情報`
  - URL: https://nlftp.mlit.go.jp/ksj/
  - 用途: 行政界、交通、土地利用、災害リスク、公共施設、GeoJSON/GIS layer
- `Project PLATEAU / 3D都市モデルポータル`
  - URL: https://front.geospatial.jp/plateau_portal_site/
  - 用途: 都市デジタルツイン、インフラ exposure、密集地域の可視化
- `JEPX market data`
  - URL: https://www.jepx.jp/en/electricpower/market-data/spot/
  - 用途: エネルギー、計算基盤、データセンター文脈での電力価格・取引量
- `電力広域的運営推進機関 系統情報`
  - URL: https://www.occto.or.jp/institution/keitoujouhou/
  - 用途: 系統、需要、送配電、system operation 文脈。公表CSV等を優先
- `JOGMEC 公開資料`
  - URL: https://www.jogmec.go.jp/index.html
  - 用途: エネルギー・鉱物資源安全保障の文脈
- `厚労省 NDBオープンデータ`
  - URL: https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000177182.html
  - 用途: 医療需要、地域別健康、長期 bio-health-security 文脈
- `厚労省 医療用医薬品供給状況報告`
  - URL: https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/iryou/kouhatu-iyaku/04_00003.html
  - 用途: 医薬品の限定出荷、供給停止、供給制約 signal
- `PMDA 公表・製品情報`
  - URL: https://www.pmda.go.jp/
  - 用途: 医薬品・医療機器の規制、製品、安全性文脈
- `医療情報ネットのオープンデータ`
  - URL: https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/iryou/newpage_43373.html
  - 用途: 病院・薬局 facility context

### Tier C: 政策・予算・説明資料

- `防衛省 FY2026 Budget Major Projects`
  - URL: https://www.mod.go.jp/en/d_act/d_budget/pdf/fy2026_20260302a.pdf
  - 用途: BudgetLine / CapabilityArea / capability別予算額
- `財務省 令和8年度一般会計歳出予算各目明細書`
  - URL: https://www.mof.go.jp/about_mof/mof_budget/budget/fy2026/ippan2026.pdf
  - 用途: 予算明細、財政 provenance
- `首相官邸 TSMC 表敬`
  - URL: https://www.kantei.go.jp/jp/104/actions/202602/05hyoukei.html
  - 用途: 半導体・経済安全保障の政策接続
- `気象庁 標準化降水指数に関する資料`
  - URL: https://www.jma.go.jp/jma/press/1903/19a/droughtinf20190319.pdf
  - 用途: 干ばつ・少雨シグナルの指標説明
- `防衛省 北朝鮮のミサイル等関連情報`
  - URL: https://www.mod.go.jp/j/surround/northKorea/index.html
  - 用途: 日本向けの公式ミサイル事案文脈、北朝鮮ミサイル・核開発資料
- `統合幕僚監部 報道発表`
  - URL: https://www.mod.go.jp/js/press/
  - 用途: 日本周辺の航空・海上・地域活動に関する公式公開情報
- `消防庁 J-Alert概要`
  - URL: https://www.fdma.go.jp/about/organization/post-18.html
  - 用途: public-alert system、国内警報伝達経路の説明
- `内閣府 宇宙政策`
  - URL: https://www8.cao.go.jp/space/
  - 用途: 日本の宇宙政策、QZSS、宇宙安全保障文脈
- `USGS Mineral Commodity Summaries`
  - URL: https://www.usgs.gov/centers/national-minerals-information-center/mineral-commodity-summaries
  - 用途: 世界の鉱物生産、埋蔵量、市場文脈
- `UN Comtrade`
  - URL: https://comtrade.un.org/
  - 用途: 重要鉱物フローの国際貿易 cross-check

## MVPへの反映

- エネルギー
  - `Trade Statistics of Japan`
  - `資源エネルギー庁 エネルギー動向`
  - `中東情勢関連対策ポータル`
- コメ
  - 農水省の令和8年2月相対取引価格
  - 農水省の令和8年2月民間在庫
- 水
  - 国交省のリアルタイム水資源ページ
  - 気象庁の干ばつ監視資料
- 防衛
  - 防衛省 FY2026 予算資料
  - 財務省 FY2026 予算明細
- 半導体
  - 経産省の半導体関連資料
  - 首相官邸資料
  - 財務省貿易統計
- 地域安全保障
  - 防衛省 北朝鮮のミサイル等関連情報
  - 統合幕僚監部 報道発表
  - 消防庁 J-Alert概要
  - CNS/NTI などの公開 missile-history dataset は補助 source group として扱う
- 宇宙・計算基盤
  - JAXA G-Portal Web API
  - JAXA Earth API
  - QZSS API
  - JEPX market data と電力広域的運営推進機関の系統情報
  - e-Stat の地域別電力・産業統計
- 重要鉱物・素材
  - 財務省貿易統計
  - e-Stat / METI 生産動態統計
  - JOGMEC 公開資料
  - UN Comtrade と USGS mineral data による国際 cross-check
- 医療・バイオ安全保障
  - 厚労省 NDBオープンデータ
  - 厚労省 医療用医薬品供給状況報告
  - PMDA 公表・製品情報
  - 医療情報ネットのオープンデータ

## 実装ルール

- すべての seed item は `sourceIds` と `provenance` を持つ。
- UI に表示する出典は、将来 `prov:wasDerivedFrom` にそのまま写せる粒度で保つ。
- 機械可読ソースがある場合は `API / SPARQL / CKAN / CSV / Excel / GeoJSON / tile` を優先し、PDF は補助説明または budget / policy の一次根拠に限定する。
- Theme 側のコードは raw source payload ではなく、正規化された `SourceSnapshot`、`EvidenceClaim`、`GeoFeature`、`TimeSeriesObservation`、`PolicySignal` に依存する。
- `ESTAT_APP_ID` などの API credential は local environment variable に置き、seed data へ commit しない。
- PDF / HTML 由来の record は reviewed または parser-generated として明示する。
- 「すべてを即時 ingest」ではなく、`official-first registry -> adapter 実装 -> seed 置換` の順で拡張する。
