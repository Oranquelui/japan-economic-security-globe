# Decision Memo: Approve e-Stat Spine (Option A)

Status: **Approved**  
Date: 2026-07-13  
Source: ChatGPT deep research review of internal reframe PRD  
Related: `docs/product/2026-07-13-estat-spine-concept-reframe-prd.md`

## Verdict

**A を採用。B・C は不採用。**

| Option | Result |
|--------|--------|
| A: e-Stat 骨格 + 経済安保はレンズ | **GO** |
| B: 経済安保オペ室のまま | **NO** |
| C: 純統計ポータル（経済安保ワード削除） | **NO** |

## Frozen public non-goals

1. リアルタイム脅威監視盤・AIS トラッカーを名乗らない  
2. AIS / tanker theater を **ホーム初期表示に出さない**  
3. jSTAT MAP の代替（汎用 GIS・全表検索）を作らない  

## Public framing (approved direction)

- **公開タイトル（目標）:** 日本レジリエンス地図  
- **経済安全保障:** レンズ / About / テーマ文脈に残す（メインタイトルから降格）  
- **elevator:** 日本の公式統計を地図と根拠つきで読み替え、暮らし・物価・食料・エネルギー・地域産業のどこが揺れやすいかを説明する公共 Web  

## Default surface (engineering)

- Default theme: **`rice`**  
- Default map mode: **`point`**（route theater ではない）  
- Energy theme: **maritime AIS live layer を出さない**（supporting context に降格；当面非表示）  
- Primary public themes to emphasize: **rice → energy → logistics**  

## First vertical slice (next implementation)

1. コメ都道府県収穫（e-Stat / seed）— 値・単位・調査年・出典リンク  
2. 補助 1 枚: うるち米価格 or 食料・エネルギー CPI（統計ダッシュボード API 可）  

## Validation (still recommended)

Interviews remain useful, but product engineering may proceed on A without waiting for full H1 tally, because market/layout mismatch is already structural. Optional gate before **public title rename in production**:

- A/B copy: 公式統計案 ≥60%  
- AIS 必須 <40%  

## Explicitly not this week

- Full multi-series e-Stat coverage  
- Enterprise OSINT / Phase 2 workspace  
- Regional-security or defense as homepage lead  
