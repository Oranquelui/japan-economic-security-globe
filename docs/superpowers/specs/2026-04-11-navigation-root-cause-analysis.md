# Navigation Root-Cause Analysis

**Project:** `japan-economic-security-globe`  
**Date:** 2026-04-11  
**Purpose:** 再発防止のため、menu と widget の混同、map の過密化、semantic layer と presentation layer のズレを根因レベルで固定する。

## 1. Context

このプロジェクトの主語は日本であり、日本人に対して

> 日本は何に依存していて、その揺れは日本国内のどこに着地するのか

を示す public-interest semantic intelligence service である。

今回の問題は「色やCSSの調整不足」ではない。  
問題は、`Common Operating Picture` と `Alert Inbox` と `widget control strip` を同一の navigation 層に並べたことで、アプリの読み順が壊れたことにある。

## 2. Primary Source Learnings

Palantir Workshop の一次資料から、今回守るべき原則は次の通り。

### 2.1 Map widget is not the app shell

Palantir の Map widget は、

- ベースレイヤー
- オーバーレイレイヤー

から構成される地理空間可視化であり、app-level navigation そのものではない。  
Map mode は widget の設定であって、アプリの主メニューではない。

Reference:

- [Palantir Workshop Map](https://www.palantir.com/docs/jp/foundry/workshop/widgets-map)

### 2.2 Example applications are application types, not one menu to merge together

Design Hub / example applications では、`Alert Inbox`、`Metrics Dashboard`、`Common Operating Picture` は別の application pattern として扱われる。  
したがって、`受信トレイ / 比較 / 根拠` を top menu に横並びで置きつつ、同時に map operation を同列に置くのは不適切である。

Reference:

- [Palantir Workshop Example Applications](https://www.palantir.com/docs/jp/foundry/workshop/example-applications/)

### 2.3 Scenario/model selection is a preset-binding pattern

Palantir の scenario/model selection は、「ユーザーの問い」や「保存済みの状態」を presentation state に束ねる考え方である。  
このプロジェクトでは、`Energy / Rice / Water / Defense / Semiconductors` は単なる色テーマではなく、semantic preset として扱うべきである。

Reference:

- [Palantir Workshop Scenarios Select Model](https://www.palantir.com/docs/jp/foundry/workshop/scenarios-select-model/)

### 2.4 Navigation must separate destination from control

Navigation は「どこへ行くか」を示す。  
Widget control は「今見ている面をどう操作するか」を示す。  
この二つを同じ横並びの tab に見せると、UI は widget collage になる。

Reference:

- [Palantir Slate Navigation](https://www.palantir.com/docs/jp/foundry/slate/navigation/)

## 3. Root Cause

### 3.1 Menu and widget were modeled as the same primitive

現行実装では、`受信トレイ / 比較 / 根拠` が menu のように見えるが、実際には drawer の open/close である。  
これは destination ではなく widget toggle である。

### 3.2 Theme, preset, inbox, and map mode all competed as primary entry points

ユーザーが最初に操作できる入口が複数ありすぎた。

- top bar: pseudo menu
- left rail: story presets
- map right: layer controls
- bottom: grid launcher
- right: evidence launcher

これにより、どこが primary navigation なのかが読めなくなった。

### 3.3 Basemap carried more meaning than the semantic overlay

GSI pale tile は日本地図としては有用だが、道路・地名・地形情報が強く、港湾・依存ルート・国内着地点より先に読まれてしまう。  
Map widget の主役は basemap ではなく overlay であるべきだった。

### 3.4 Selected-object briefing was always-on and oversized

selected summary と grid launcher が初期状態から大きく常駐していたため、map canvas の余白を奪っていた。  
これは `first look = map` の原則に反する。

## 4. Non-Negotiable Rules

今後の front 実装では、次のルールを破ったら regression とみなす。

### 4.1 Menu

menu に置いてよいのは app-level destination または app-level utility のみ。

Allowed:

- 運用地図
- 共有

Conditionally allowed:

- 受信トレイ
- 比較
- 根拠

ただしこれらは本当に destination として独立させる場合のみ。  
drawer toggle のままなら menu に置かない。

### 4.2 Widget controls

widget に置くべきもの:

- 表示レイヤー
- ズーム / 再センタリング
- metrics strip
- selected-object briefing
- comparison grid
- evidence drawer

### 4.3 Story presets

`Energy / Rice / Water / Defense / Semiconductors` は menu ではない。  
これらは canonical semantic graph から view state を切り出す preset であり、left context panel に置く。

### 4.4 Basemap

default basemap は「意味を主張しない」こと。

Required:

- 日本全体の輪郭
- 海岸線
- 都道府県境または粗い行政境界
- 少数の都市ラベル

Avoid by default:

- 道路網の高密度表示
- 地形線の強調
- 地名の過密表示

### 4.5 Semantic discipline

presentation 上の `story preset`, `inbox`, `comparison`, `evidence` は別データを持たない。  
必ず canonical semantic graph から導出する。

これは今回の mission に含まれる OWL / RDF / SPARQL 学習とも整合する。  
UI の都合で意味体系を分岐させてはいけない。

## 5. Correct Target Architecture

### 5.1 Top bar

Top bar は最小化する。

- brand
- current app area
- utility

ここには widget toggle を置かない。

### 5.2 Left panel

Left panel は唯一の primary context navigator。

- story preset
- semantic filter
- compact inbox

### 5.3 Map

Map は primary canvas。

- first look は地図
- first interaction は point or cluster
- route は second-step analysis

### 5.4 Right / bottom

Right と bottom は analytical widgets。

- right: evidence
- bottom: comparison

default は collapsed でもよいが、menu のふりをさせない。

## 6. Immediate Follow-up

次の修正は順番を守る。

1. top bar から widget toggle を撤去する
2. left panel を唯一の primary navigation にする
3. basemap をさらに簡素化する
4. selected briefing をもっと薄くする
5. route mode を explicit drilldown に限定する

## 7. Verification Checklist

- 初見で `menu` と `widget` を取り違えないか
- map が first look になっているか
- basemap より overlay が先に読めるか
- story presets が semantic preset として機能しているか
- ontology / provenance / evidence の一貫性が presentation に保たれているか
