# 公式ソース台帳

最終更新: 2026-04-11

このプロジェクトは、`日本の日本人のための dependency intelligence layer` を前提にしています。  
そのため、一次ソースは原則として `政府機関・公的機関の公式 API / SPARQL / CSV / Excel / PDF / 公表ページ` を優先し、民間資料は家計影響などの補助的文脈に限定します。

## 取り込み方針

### Tier A: 直接接続する機械可読ソース

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

### Tier B: 公開統計・公開データファイル

- `Trade Statistics of Japan`
  - URL: https://www.customs.go.jp/toukei/srch/index.htm
  - 用途: 国別輸入依存、エネルギー・半導体フロー
- `資源エネルギー庁 エネルギー動向`
  - URL: https://www.enecho.meti.go.jp/about/energytrends/202506/pdf/energytrends_all.pdf
  - 用途: 原油輸入先、中東依存、備蓄日数
- `農水省 米の相対取引価格・数量、民間在庫`
  - URL: https://www.maff.go.jp/j/seisan/keikaku/soukatu/aitaikakaku.html
  - 用途: コメ価格、民間在庫、販売数量
- `関東地方整備局 利根川水系ダム貯水状況`
  - URL: https://www.ktr.mlit.go.jp/river/shihon/river_shihon00000111.html
  - 用途: ダム貯水率、渇水監視

### Tier C: 政策・予算・説明資料

- `防衛省 FY2026 Budget ~Major Projects~`
  - URL: https://www.mod.go.jp/en/d_act/d_budget/pdf/fy2026_20251226a.pdf
  - 用途: BudgetLine / CapabilityArea
- `財務省 令和8年度一般会計歳出予算各目明細書`
  - URL: https://www.mof.go.jp/about_mof/mof_budget/budget/fy2026/ippan2026.pdf
  - 用途: 予算明細、財政 provenance
- `首相官邸 TSMC 表敬`
  - URL: https://www.kantei.go.jp/jp/104/actions/202602/05hyoukei.html
  - 用途: 半導体・経済安全保障の政策接続
- `気象庁 標準化降水指数に関する資料`
  - URL: https://www.jma.go.jp/jma/press/1903/19a/droughtinf20190319.pdf
  - 用途: 干ばつ・少雨シグナルの指標説明

## MVPへの反映

- エネルギー
  - `Trade Statistics of Japan`
  - `資源エネルギー庁 エネルギー動向`
  - 経産省公表資料
- コメ
  - 農水省の価格・在庫ページ
  - 農水省マンスリーレポート
- 水
  - 国交省のダム貯水ページ
  - 気象庁の干ばつ監視資料
- 防衛
  - 防衛省 FY2026 予算資料
  - 財務省 FY2026 予算明細
- 半導体
  - 経産省の半導体関連資料
  - 首相官邸資料
  - 財務省貿易統計

## 実装ルール

- すべての seed item は `sourceIds` と `provenance` を持つ。
- UI に表示する出典は、将来 `prov:wasDerivedFrom` にそのまま写せる粒度で保つ。
- 機械可読ソースがある場合は `API / SPARQL / CSV` を優先し、PDF は補助説明または budget / policy の一次根拠に限定する。
- 「すべてを即時 ingest」ではなく、`official-first registry -> adapter 実装 -> seed 置換` の順で拡張する。
