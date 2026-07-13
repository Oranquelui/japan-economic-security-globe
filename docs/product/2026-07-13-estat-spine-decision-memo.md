# Decision Memo: Approve e-Stat Spine (Option A)

Status: **Approved** + **public surface partially applied**  
Date: 2026-07-13  
Source: ChatGPT deep research review of internal reframe PRD  
Related:

- **Handoff PRD (start here for agents):** `docs/product/2026-07-13-estat-spine-handoff-prd.md`
- `docs/product/2026-07-13-estat-spine-concept-reframe-prd.md`
- `docs/product/2026-07-13-estat-data-theme-map.md`
- `lib/config/estat-theme-map.ts`

## Verdict

**A を採用。B・C は不採用。再議論不要。**

| Option | Result |
|--------|--------|
| A: e-Stat 骨格 + 経済安保はレンズ | **GO** |
| B: 経済安保オペ室のまま | **NO** |
| C: 純統計ポータル（経済安保ワード削除） | **NO** |

## Frozen public non-goals

1. リアルタイム脅威監視盤・AIS トラッカーを名乗らない  
2. AIS / tanker theater を **ホーム初期表示に出さない**  
3. jSTAT MAP の代替（汎用 GIS・全表検索）を作らない  

## Public framing (approved)

- **公開タイトル:** 日本レジリエンス地図（UI 反映済み）  
- **経済安全保障:** レンズ / About / テーマ文脈に残す  
- **elevator:** 日本の公式統計を地図と根拠つきで読み替え、暮らし・物価・食料・エネルギー・地域産業のどこが揺れやすいかを説明する公共 Web  

## Default surface (shipped on main)

- Default theme: **`rice`** (`DEFAULT_THEME_ID`)  
- Default map mode: **`point`**  
- Energy: **`buildLiveLogisticsView("energy")` → null**（AIS 劇場オフ）  
- Homepage lead prefers **`PUBLIC_SPINE_THEME_IDS`**: rice → energy → logistics  
- Briefing: `最新の調査値` / `公式出典`  

## Next implementation (WP2) — for Codex / any agent

詳細・完了条件は handoff PRD §5 を正とする。

1. コメ都道府県収穫（e-Stat / seed）— 値・単位・調査年・出典リンクを evidence まで  
2. 補助 1 枚: うるち米価格 or 食料・エネルギー CPI（統計ダッシュボード API 可）  
3. `npm test` + `npm run typecheck` 緑  
4. リアルタイム主張をしない  

## Validation (optional, not a blocker for WP2)

- A/B copy: 公式統計案 ≥60%  
- AIS 必須 &lt;40%  

## Explicitly out of scope until after WP2

- Full multi-series e-Stat coverage  
- Enterprise OSINT / Phase 2 workspace  
- Regional-security or defense as homepage lead  
- Returning energy AIS theater to homepage  

