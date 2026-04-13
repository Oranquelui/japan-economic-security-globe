# Sources / License / Contact Design

Date: 2026-04-13

## Summary

This spec defines the public-facing legal and contact surface for `economic-security.quadrillionaaa.com`.

The product should not scatter compliance notices across the main experience. Instead, it should keep the map UI focused and concentrate source, license, and contact handling behind a hamburger menu with three entries:

- `共有`
- `Sources/License`
- `問い合わせ`

The design goal is to make the public site legally clearer without turning the main product into a policy portal.

## Product Decisions

### 1. Navigation change

Replace the current share button with a hamburger menu in the top-right area of the shell.

The menu contains:

- `共有`
  - preserves the existing share action
- `Sources/License`
  - opens a dedicated Japanese-only page
- `問い合わせ`
  - opens a dedicated inquiry form surface

This keeps legal and operational actions available, but out of the primary narrative path.

### 2. Sources / License page

Create a dedicated page for source and rights handling instead of a footer notice.

The page is Japanese-only and should be written for ordinary users, not lawyers. It should have three sections:

1. `このサイトの利用方針`
2. `出典ソース一覧`
3. `ライセンス / 権利処理`

The first section explains the operating rule:

- government and public-institution sources are handled with attribution-first reuse rules
- private-company sources are handled as fact extraction, summary, and outbound links
- the site does not claim that all underlying data can be freely redistributed as one bundle

The second section lists source groups and representative entries. At minimum the page should separate:

- `政府・公的機関ソース`
- `民間企業ソース`

The third section explains repository and site-level rights handling:

- code license
- data handling policy
- third-party source handling policy

### 3. Contact flow

Inquiry should be a lightweight public form, not a support platform.

Required fields:

- `カテゴリ`
- `返信先メールアドレス`
- `件名`
- `本文`

No name field is required.

Category options:

- `開発依頼`
- `データ修正/追加`
- `不具合・エラー`
- `取材・引用/連携`
- `その他`

The category is important because the inbox will be triaged manually.

## Legal / Compliance Position

### 1. Recommended repository stance

Use `Apache-2.0` for repository code.

Reasoning:

- clear open-source signal on GitHub
- commercial reuse remains possible
- better long-term fit than MIT for a project that may evolve into institutional tooling

### 2. Data stance

Do not place one blanket open-data license over `data/seed/` at this stage.

Reasoning:

- the seed layer contains a mix of official public-sector sources and private-company sources
- some public-sector sites are compatible with attribution-based reuse rules
- some private-company sites do not support broad republication

Recommended handling:

- keep code licensing separate from source-data handling
- add a repository document such as `DATA-SOURCES.md` or `THIRD_PARTY.md`
- explain on the site that source-linked facts are presented with attribution, summary, and links, not as a universally relicensable corpus

### 3. Source handling policy

Operational rule for the public site:

- official government/public sources:
  - can be cited and summarized with attribution, subject to each source's stated terms
- private-company sources:
  - use fact statements, paraphrase, and links
  - do not republish full documents, copied tables, or substantial original text

This policy is stricter than necessary for some sources, but it creates a clean operational standard for the MVP.

## Technical Design

### 1. Information architecture

The application shell should expose a single menu trigger. The main product routes remain map-first. Legal and contact routes sit outside the primary story path.

Expected route additions:

- `/sources-license`
- `/contact` or a modal-driven inquiry surface backed by an API route

Recommendation:

- use a dedicated page for `Sources/License`
- use a dedicated page for `問い合わせ` if the shell already supports page navigation cleanly

A dedicated page is easier to test, easier to share, and easier to extend than a deeply stateful modal.

### 2. Form submission architecture

The inquiry form submits to an application endpoint running on Cloudflare Workers.

Flow:

1. user submits categorized inquiry
2. server validates payload
3. server sends mail through Amazon SES in `ap-northeast-1`
4. mail is delivered to `ai@quadrillion-ai.com`

The planned sender is:

- `no-reply@quadrillionaaa.com`

This requires Amazon SES domain verification for `quadrillionaaa.com`.

### 3. SES and DNS requirements

Current assumptions confirmed during design:

- AWS CLI default region is `ap-northeast-1`
- SES is expected to run in production mode
- DNS for `quadrillionaaa.com` is managed in Cloudflare

Required DNS work:

- SES domain verification record for `quadrillionaaa.com`
- DKIM records
- SPF alignment for the chosen sending pattern

The implementation should prefer direct SES API calls from Workers using SigV4 signing rather than adding Lambda or API Gateway.

Reasoning:

- smallest infrastructure footprint
- consistent with the current Cloudflare-first deployment model
- avoids introducing a second runtime unless needed later

### 4. Abuse controls

The inquiry endpoint is public and therefore must include basic anti-abuse controls.

Required controls:

- server-side email validation
- category whitelist validation
- subject/body length limits
- honeypot field
- per-IP rate limiting

Optional but reasonable:

- Turnstile if abuse appears after launch

Turnstile is not required for the first iteration if rate limiting and honeypot are present.

## Content Requirements

### 1. Sources / License page copy requirements

The page must clearly say all of the following:

- this site combines official and private source references
- source-linked facts are shown with provenance and links
- government/public sources are used under their published reuse conditions
- private-company materials are not being republished as a reusable data bundle
- repository code and underlying source material are not governed by the same rights model

### 2. Inquiry page copy requirements

The page must clarify:

- the inquiry channel is for public feedback and collaboration contact
- responses are not guaranteed
- the user should avoid sending sensitive personal information

Because the reply email is required, the form should also say that the submitted address will be used only to respond to the inquiry.

## Out of Scope

The following are explicitly out of scope for this spec:

- a full privacy-policy framework
- a full terms-of-service document
- CRM integration
- ticketing workflows
- auto-reply sequences
- analytics dashboards for inquiries
- a generalized source-ingestion compliance engine

## Implementation Notes

When implementation starts, the work should be split into four slices:

1. shell navigation update
2. `Sources/License` page
3. inquiry form + API
4. SES/DNS setup documentation and repository licensing files

The legal-display and inquiry work are small enough for MVP scope, but they touch public trust directly, so the implementation should be verified with both UI checks and live endpoint validation.
