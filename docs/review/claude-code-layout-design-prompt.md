# Claude Code Layout Design Prompt

以下を Claude Code にそのまま渡してください。

```text
このリポジトリの UI / layout design をレビューし、再設計案を出してください。

最重要制約:
- 絶対に新しい branch を作らないでください
- 絶対に worktree を増やさないでください
- 今の branch / 今の workspace のままで読んでください
- 今回はまず design が目的です。commit, push, branch 操作はしないでください

最初に必ず読むもの:
- docs/review/claude-code-diagnosis-kit.md
- .taskmaster/docs/japan-economic-security-globe-prd.txt
- docs/superpowers/specs/2026-04-10-app-design.md
- .taskmaster/docs/2026-04-11-navigation-reframe-addendum.txt

次に、Palantir の以下を必ず読んでください。
- https://www.palantir.com/docs/jp/foundry/workshop/concepts-layouts/
- https://www.palantir.com/docs/jp/foundry/workshop/widgets-map/
- https://www.palantir.com/docs/jp/foundry/workshop/example-applications/
- https://www.palantir.com/docs/jp/foundry/workshop/scenarios-select-model/
- https://www.palantir.com/docs/jp/foundry/slate/navigation/

このプロジェクトの絶対条件:
- Map を面積の主役にすることは絶対に変わらない
- 初期表示は Japan-first
- 世界は補助文脈であって主画面ではない
- menu と widget を混同してはいけない
- ontology / OWL / RDF / SPARQL / provenance の学びにつながる presentation であること
- public-interest product として、説明責任と citation-friendly な構造であること

いま見てほしい問い:
1. 現在の layout は Palantir の layout primitives に照らして何が足りないか
2. 現在の menu / widget / section / overlay の責務分離は正しいか
3. map を全面 stage にしたまま、left pane / bottom table / evidence drawer をどう配置すべきか
4. このプロジェクトに最も合う app shell は何か
5. semantic layer の見せ方として、どこを layout に織り込むべきか

必ず確認するファイル:
- components/AppShell.tsx
- components/ActionBar.tsx
- components/MapInboxPanel.tsx
- components/JapanMainMap.tsx
- components/JapanOperationsMapCanvas.tsx
- components/OperationsSignalTable.tsx
- components/EvidencePanel.tsx
- lib/presentation/url-state.ts
- lib/presentation/map-canvas.ts
- lib/semantic/detail.ts
- lib/semantic/view-models.ts

期待する出力:

1. Findings
- severity 順
- file/line reference 付き
- 何が Palantir の原理とズレているかを明示

2. Root Cause
- CSS の問題なのか
- layout primitive の問題なのか
- navigation architecture の問題なのか
- semantic presentation の問題なのか

3. Target Layout
- header
- left pane
- map stage
- bottom object table
- evidence drawer / overlay
- mobile fallback

4. Menu vs Widget Separation
- 何が menu にあるべきか
- 何が widget にあるべきか
- 何が overlay にあるべきか

5. Semantic Presentation
- OWL / RDF / SPARQL / provenance の学びにつながる UI 要素をどこに置くべきか
- detail / evidence / source / query preview をどう見せるべきか

6. Concrete Redesign Plan
- 抽象論ではなく、コンポーネント単位でどう直すか
- どのファイルをどう責務変更するか
- 実装順も提案すること

7. Verification Gaps
- まだブラウザ上で何を確認すべきか
- regression risk はどこにあるか

出力ルール:
- findings-first
- summary は最後に短く
- 「よかった点」は最後に短く
- 可能なら、Palantir の concepts-layouts / widgets-map / example-applications のどの考え方に対応するかも示してください

重要:
- branch を作らない
- いまある current branch のままで読む
- design review が主目的なので、勝手に大規模実装はしない
```

