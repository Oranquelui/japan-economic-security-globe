# Validation Plan: e-Stat Spine Reframe

Date: 2026-07-13  
PRD: `docs/product/2026-07-13-estat-spine-concept-reframe-prd.md`

## Goal

Test whether the free public product should lead with **official Japanese statistics (e-Stat spine)** rather than **economic-security operations-room** framing — before large UI rename or multi-series engineering.

## Hypotheses

| ID | Hypothesis | Pass condition |
|----|------------|----------------|
| H1 | Free users prefer “official numbers map” over “econ-sec radar” | ≥60% of interviewees pick A in copy test |
| H2 | Top tasks are compare / cite / understand household-regional impact | ≥3 of top-5 tasks map to e-Stat capabilities |
| H3 | AIS/tanker theater is nice-to-have, not must-have for free MVP | <40% rank it as essential |
| H4 | Willingness to return if prefecture stats + source links work | ≥50% say monthly+ return |

## Method

### Participants (5–8)

Mix:

- 2 citizens / curious generalists  
- 1–2 students or data learners  
- 1 local business or municipality-adjacent  
- 1 policy / research / journalism adjacent  

Not required: enterprise CISO (that’s Phase 2 buyer).

### Session (25–30 min)

1. **Context** (2 min): show current live site without pitching.  
2. **Copy A/B** (5 min): show two one-liners, pick preferred.  
3. **Task probes** (10 min): think-aloud on 3 tasks.  
4. **Data trust** (5 min): what would make them cite this vs e-Stat raw / news.  
5. **Close** (3 min): return frequency, pay willingness (optional).

### Copy A/B (Japanese)

**A — e-Stat spine**

> 日本の公式統計を、地図と出典つきで読める。物価・コメ・エネルギー・地域の数字から、暮らしと産業のどこが揺れるかを説明します。

**B — economic-security ops**

> 日本経済安全保障の監視盤。エネルギー・物流・半導体など、いま注視すべき依存リスクを地図と根拠で示します。

Record first preference + one sentence why.

### Task probes (observe, don’t help first)

1. 新潟のコメ（収穫や関連）に関する公式っぽい数字と出典を探す  
2. 電気や燃料が家計に効く、と説明できそうな数字を探す  
3. 中東の船/ルートの“いま”を知りたい（ここは現行UIの強み／期待ズレ測定）

Score each: success / partial / fail; note which UI they tried.

### Scripted questions

1. e-Stat を使ったことがありますか。何が面倒でしたか。  
2. 「経済安全保障」と聞いて無料サイトに何を期待しますか。  
3. 公式統計の地図があったら、どんな場面で開きますか。  
4. 船のリアルタイムに近い表示は必要ですか。なくていいですか。  
5. このサイトをまた開く条件は何ですか。

## Artifacts to capture

- Spreadsheet or markdown notes per participant  
- Preference tally for A/B  
- Quote bank (verbatim, anonymized)  
- Decision memo: go / adjust / no-go on rename

## Decision rules after validation

| Outcome | Action |
|---------|--------|
| H1 pass + H2 pass | Proceed WP2 rice e-Stat slice; plan public title change |
| H1 fail but H2 pass | Keep dual framing; e-Stat still spine in engineering |
| H3 fail (AIS essential) | Keep Layer B more visible; still don’t claim e-Stat powers it |
| H1+H2 fail | Revisit product thesis before more features |

## Timeline

| Day | Activity |
|-----|----------|
| 0 | Docs land in repo (this plan) |
| 1–3 | Recruit + run interviews |
| 4 | Synthesize memo in `docs/product/` |
| 5+ | Start WP2 only if go / adjust |

## Out of scope

- Paid ads recruitment budget  
- Statistically significant market research  
- Building multi-theme e-Stat coverage before first slice  
