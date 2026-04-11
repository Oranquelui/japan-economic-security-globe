# Claude Code Diagnosis Kit

このファイルは、`japan-economic-security-globe` を Claude Code に診断・検証させるときの参照用ドキュメントです。  
目的は、毎回ゼロから文脈説明をせずに、同じ基準で UI / 情報設計 / semantic layer / 実装品質を評価させることです。

## 1. Project Identity

- プロジェクト名: `japan-economic-security-globe`
- 公開URL: `https://economic-security.quadrillionaaa.com/`
- 主語: 日本、日本人
- 目的:
  - 日本は何に依存しているのか
  - その依存は日本国内のどこに着地するのか
  - その見立てをどの根拠が支えているのか

このプロジェクトは、単なる地図アプリでも generic dashboard でもない。  
`Japan-first operating picture` として、地図、比較、根拠、semantic relation を一貫して見せる公共目的のサービスである。

## 2. Product Principles

### 2.1 Information Architecture

優先順位は次の順:

1. `Action bar`
2. `Navigation rail`
3. `Japan map canvas`
4. `Comparison grid`
5. `Evidence drawer`

初見ユーザーに最初に伝えるべきこと:

- 日本が主画面である
- 世界は日本の補助文脈である
- 何が動いているかを比較できる
- 根拠と出典まで辿れる

### 2.2 Map Behavior

守るべき原則:

- 初期表示は `Japan-first`
- 初期 viewport は日本固定
- 初期 map mode は `point` または `cluster`
- 初期ロードで route に auto-fit しない
- `route` は第2段階の分析モード
- 世界コンテキストは zoom-out または mode change で出る

### 2.3 Semantic Layer

守るべき原則:

- 1つの canonical semantic graph から view model を導出する
- component ごとに別データを持たない
- 各 object に provenance がある
- 根拠は将来 `prov:wasDerivedFrom` に自然に写せる
- detail panel は ontology を見せびらかすのではなく、公共的理解に翻訳する

## 3. Current Key Specs

最重要の参照ファイル:

- PRD: [japan-economic-security-globe-prd.txt](/Users/louistoyozaki/Documents/GitHub/jp-strategic-dependency-graph/.taskmaster/docs/japan-economic-security-globe-prd.txt)
- app design: [2026-04-10-app-design.md](/Users/louistoyozaki/Documents/GitHub/jp-strategic-dependency-graph/docs/superpowers/specs/2026-04-10-app-design.md)
- root cause analysis: [2026-04-11-navigation-root-cause-analysis.md](/Users/louistoyozaki/Documents/GitHub/jp-strategic-dependency-graph/docs/superpowers/specs/2026-04-11-navigation-root-cause-analysis.md)
- navigation addendum: [2026-04-11-navigation-reframe-addendum.txt](/Users/louistoyozaki/Documents/GitHub/jp-strategic-dependency-graph/.taskmaster/docs/2026-04-11-navigation-reframe-addendum.txt)
- official source registry: [official-source-registry.md](/Users/louistoyozaki/Documents/GitHub/jp-strategic-dependency-graph/docs/official-source-registry.md)

実装の主要ファイル:

- shell: [AppShell.tsx](/Users/louistoyozaki/Documents/GitHub/jp-strategic-dependency-graph/components/AppShell.tsx)
- main map: [JapanMainMap.tsx](/Users/louistoyozaki/Documents/GitHub/jp-strategic-dependency-graph/components/JapanMainMap.tsx)
- map canvas: [JapanOperationsMapCanvas.tsx](/Users/louistoyozaki/Documents/GitHub/jp-strategic-dependency-graph/components/JapanOperationsMapCanvas.tsx)
- evidence: [EvidencePanel.tsx](/Users/louistoyozaki/Documents/GitHub/jp-strategic-dependency-graph/components/EvidencePanel.tsx)
- comparison grid: [OperationsSignalTable.tsx](/Users/louistoyozaki/Documents/GitHub/jp-strategic-dependency-graph/components/OperationsSignalTable.tsx)
- url state: [url-state.ts](/Users/louistoyozaki/Documents/GitHub/jp-strategic-dependency-graph/lib/presentation/url-state.ts)
- map model: [map-canvas.ts](/Users/louistoyozaki/Documents/GitHub/jp-strategic-dependency-graph/lib/presentation/map-canvas.ts)

## 4. What Claude Code Should Check

### 4.1 Navigation / UX

- 画面が widget collage に見えていないか
- menu と widget が同じ primitive で扱われていないか
- map canvas が主役になっているか
- left / right / bottom surface が map を邪魔していないか
- navigation が `theme switch` のまま止まっていないか
- preset / filter / selected state の読み順が明確か

### 4.2 Map

- 初期表示が日本固定になっているか
- route-first になっていないか
- initial selection auto-fit が残っていないか
- zoom-out で global context が自然に出るか
- basemap が外部障害で壊れない構成か
- basemap が overlay より強く読まれていないか

### 4.3 Semantic / Evidence

- detail が「なぜ日本で重要か」に翻訳されているか
- evidence graph が decorative になっていないか
- source URL が粗すぎないか
- official source と補助 source の区別が見えるか
- ontology 的な一貫性が presentation に反映されているか

### 4.4 Accessibility / Public Product Quality

- keyboard で主要操作に到達できるか
- icon-only control に `aria-label` があるか
- URL state が shareable か
- report は findings-first で書けるか

## 5. Expected Review Output

Claude Code には次の形式で返させる:

1. `Findings`
2. `Why it matters`
3. `Recommended fix`
4. `Verification gap`

レビューのルール:

- findings-first
- severity 順
- file/line reference を必ず付ける
- 「よかった点」は最後に短く
- summary は findings の後に置く

## 6. Verification Commands

必要に応じて Claude Code に実行させるコマンド:

```bash
npm test
npm run lint
npm run build
```

ローカル確認:

```bash
npm run dev
```

Cloudflare Workers 前提の確認:

```bash
npm run preview
```

## 7. Prompt Template

以下を Claude Code にそのまま渡してよい。

```text
このリポジトリの診断と検証をしてください。

まず次のファイルを読んで、プロジェクトの目的とUI原則を理解してください。

- docs/review/claude-code-diagnosis-kit.md
- .taskmaster/docs/japan-economic-security-globe-prd.txt
- docs/superpowers/specs/2026-04-10-app-design.md
- .taskmaster/docs/2026-04-11-navigation-reframe-addendum.txt

前提:
- このプロジェクトは日本中心の public-interest semantic intelligence service です
- 初期表示は日本固定であるべきです
- 世界は補助文脈であり、主画面ではありません
- route mode は初見のデフォルトではなく、第2段階の分析モードです
- ontology / provenance の一貫性を壊さずに、公共向けに理解しやすいUIである必要があります

見てほしい観点:
1. navigation が目的に合っているか
2. map canvas が主役になっているか
3. 初期表示が route-first / auto-fit-first になっていないか
4. evidence / source / semantic layer が public-interest product として十分か
5. keyboard accessibility と shareable URL state に問題がないか

出力形式:
- Findings を最初に、severity 順に列挙
- 各 finding に file/line reference を付ける
- その後に open questions または verification gaps
- 最後に change summary を短く

もし修正案があるなら、抽象論ではなく具体的な実装方針まで書いてください。
```

## 8. Optional Prompt Variants

### 8.1 Navigation-only Review

```text
docs/review/claude-code-diagnosis-kit.md を前提に、navigation / information architecture だけをレビューしてください。
特に AppShell, JapanMainMap, url-state を中心に見て、map が主役か、preset / filter / drawer / grid の役割分担が整理されているかを確認してください。
```

### 8.2 Semantic Review

```text
docs/review/claude-code-diagnosis-kit.md を前提に、semantic layer と evidence presentation だけをレビューしてください。
特に ontology 的整合性、provenance、detail translation、source precision を見てください。
```

### 8.3 Regression Check Before Deploy

```text
docs/review/claude-code-diagnosis-kit.md を前提に、deploy 前の regression check をしてください。
npm test, npm run lint, npm run build を実行し、UIの主目的に反する regression がないか確認してください。
```
