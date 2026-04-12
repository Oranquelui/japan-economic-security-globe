# Public Sources / License / Contact Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a hamburger-menu based public utility surface with `共有`, `Sources/License`, and `問い合わせ`, plus a working SES-backed contact flow and repository/source-rights documentation.

**Architecture:** Reuse the existing `ActionBar` shell and seeded `data/seed/sources.json`, but split new work into focused UI and server modules: a small header menu component, a dedicated `Sources/License` page fed by a pure source-catalog helper, and a contact stack composed of a form page, validation helpers, a route handler, and an SES delivery adapter. Abuse prevention stays partly in-app (validation, honeypot) and partly at the edge using a Cloudflare WAF rate-limiting rule, because app-level per-IP throttling is not reliable in a stateless Workers deployment without an extra data store.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS, Vitest, Cloudflare Workers via OpenNext, Amazon SES API in `ap-northeast-1`, Cloudflare DNS/WAF, existing seeded JSON source registry.

---

## File Structure

- Create `components/ShellMenu.tsx`: top-right hamburger menu that owns disclosure state and actions for share, sources/license navigation, and contact navigation.
- Modify `components/ActionBar.tsx`: replace the standalone share button with `ShellMenu`.
- Modify `components/AppShell.tsx`: stop passing share-only props if the menu API changes and keep URL-derived share links intact.
- Create `components/__tests__/shell-menu.test.tsx`: interaction tests for share copy and menu navigation.
- Modify `components/__tests__/navigation-shell.test.tsx`: assert the header exposes the menu instead of a direct share CTA.
- Modify `components/__tests__/app-shell-url-state.test.tsx`: keep URL-state behavior covered after the header prop changes.

- Create `lib/legal/source-catalog.ts`: normalize `data/seed/sources.json` into Japanese-only grouped view models for official/public vs private sources and usage policy text.
- Create `lib/legal/__tests__/source-catalog.test.ts`: assert grouping and usage-policy labels derived from the source registry.
- Create `components/SourcesLicensePage.tsx`: present the three approved sections and grouped source lists.
- Create `components/__tests__/sources-license-page.test.tsx`: render test for required headings, source groups, and rights copy.
- Create `app/sources-license/page.tsx`: route entry with page metadata and page component binding.

- Create `types/contact.ts`: shared contact categories and payload/result types.
- Create `lib/contact/validation.ts`: payload validation, category whitelist, honeypot check, and length rules.
- Create `lib/contact/config.ts`: required environment-variable lookup and configuration guards.
- Create `lib/contact/ses.ts`: AWS SigV4-signed SES API request builder and sender.
- Create `lib/contact/__tests__/validation.test.ts`: pure validation tests.
- Create `lib/contact/__tests__/ses.test.ts`: request-shape and failure-handling tests for the SES adapter.
- Create `components/ContactForm.tsx`: public inquiry form UI and submit state.
- Create `components/__tests__/contact-form.test.tsx`: form rendering and client interaction tests.
- Create `app/contact/page.tsx`: Japanese-only contact page shell and explanatory copy.
- Create `app/api/contact/route.ts`: POST endpoint that validates payload and forwards mail through SES.
- Create `app/api/contact/route.test.ts`: route test for success, validation errors, and honeypot rejection.

- Modify `.env.example`: add local-development placeholders for contact delivery.
- Create `LICENSE`: `Apache-2.0` for repository code.
- Create `DATA-SOURCES.md`: repository-level explanation of source-by-source handling and redistribution limits.
- Create `docs/operations/ses-cloudflare-setup.md`: SES verification, DKIM/SPF, Cloudflare DNS, IAM policy, and WAF rule checklist.
- Modify `README.md`: add links to `Sources/License`, contact behavior, code license, and data-source policy.

## Task 1: Replace the Header Share Button with a Hamburger Menu

**Files:**
- Create: `components/ShellMenu.tsx`
- Modify: `components/ActionBar.tsx`
- Modify: `components/AppShell.tsx`
- Test: `components/__tests__/shell-menu.test.tsx`
- Test: `components/__tests__/navigation-shell.test.tsx`
- Test: `components/__tests__/app-shell-url-state.test.tsx`

- [ ] **Step 1: Write the failing shell-menu test**

Create `components/__tests__/shell-menu.test.tsx` with tests that render the new menu component, open the disclosure, and assert these three menu actions are present:

```tsx
expect(screen.getByRole("button", { name: "メニュー" })).toBeTruthy();
await user.click(screen.getByRole("button", { name: "メニュー" }));
expect(screen.getByRole("button", { name: "共有" })).toBeTruthy();
expect(screen.getByRole("link", { name: "Sources/License" })).toHaveAttribute("href", "/sources-license");
expect(screen.getByRole("link", { name: "問い合わせ" })).toHaveAttribute("href", "/contact");
```

- [ ] **Step 2: Run the new test to verify it fails**

Run:

```bash
npm test -- components/__tests__/shell-menu.test.tsx
```

Expected: FAIL because `components/ShellMenu.tsx` does not exist.

- [ ] **Step 3: Implement the minimal menu component**

Create `components/ShellMenu.tsx` with:

- local open/close state
- copy-to-clipboard handling for `sharePath`
- a button labeled `メニュー`
- one action button labeled `共有`
- two navigation links to `/sources-license` and `/contact`

Use the existing `themePalette` colors from `ActionBar` so the new component matches the current shell.

- [ ] **Step 4: Integrate the menu into the header**

Update `components/ActionBar.tsx` to replace the existing share button with the new `ShellMenu` component and keep `onClearFilters` unchanged.

Keep the current share URL generation contract:

```tsx
<ShellMenu sharePath={sharePath} themePalette={themePalette} />
```

If `ActionBar` no longer needs local `copied` state, remove it from `ActionBar` and keep that state inside `ShellMenu`.

- [ ] **Step 5: Update the existing header tests**

Adjust `components/__tests__/navigation-shell.test.tsx` so the header still proves that navigation and layer controls are separate, but now checks for the menu trigger rather than the direct share button:

```tsx
expect(within(header).getByRole("button", { name: "メニュー" })).toBeTruthy();
expect(within(header).queryByRole("button", { name: "共有" })).toBeNull();
```

Update `components/__tests__/app-shell-url-state.test.tsx` only as needed to keep the render expectations valid after the `ActionBar` prop path changes.

- [ ] **Step 6: Run the header test set**

Run:

```bash
npm test -- components/__tests__/shell-menu.test.tsx components/__tests__/navigation-shell.test.tsx components/__tests__/app-shell-url-state.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit the header-menu slice**

Run:

```bash
git add components/ShellMenu.tsx components/ActionBar.tsx components/AppShell.tsx components/__tests__/shell-menu.test.tsx components/__tests__/navigation-shell.test.tsx components/__tests__/app-shell-url-state.test.tsx
git commit -m "feat: replace share button with shell menu"
```

## Task 2: Build the `Sources/License` Page from the Seeded Source Registry

**Files:**
- Create: `lib/legal/source-catalog.ts`
- Create: `lib/legal/__tests__/source-catalog.test.ts`
- Create: `components/SourcesLicensePage.tsx`
- Create: `components/__tests__/sources-license-page.test.tsx`
- Create: `app/sources-license/page.tsx`

- [ ] **Step 1: Write the failing source-catalog test**

Create `lib/legal/__tests__/source-catalog.test.ts` with assertions that the helper:

- groups official/public sources separately from private sources
- surfaces at least one official source and one private source from the existing seed data
- returns Japanese policy copy for the public site

Minimal example:

```ts
const catalog = buildSourcesLicenseCatalog(loadSeedGraph().sources);
expect(catalog.groups.find((group) => group.id === "official")?.items.length).toBeGreaterThan(0);
expect(catalog.groups.find((group) => group.id === "private")?.items.length).toBeGreaterThan(0);
expect(catalog.policySummary).toContain("民間");
```

- [ ] **Step 2: Run the catalog test to verify it fails**

Run:

```bash
npm test -- lib/legal/__tests__/source-catalog.test.ts
```

Expected: FAIL because the catalog helper does not exist.

- [ ] **Step 3: Implement the catalog helper**

Create `lib/legal/source-catalog.ts` as a pure module that:

- takes `SourceDocument[]`
- splits items by `official !== false`
- sorts official items before private items
- prepares Japanese section copy for:
  - `このサイトの利用方針`
  - `出典ソース一覧`
  - `ライセンス / 権利処理`

Keep the transformation pure so it is easy to test and reuse in the page component.

- [ ] **Step 4: Write the failing page-component test**

Create `components/__tests__/sources-license-page.test.tsx` with a render test that expects:

```tsx
expect(screen.getByRole("heading", { name: "このサイトの利用方針" })).toBeTruthy();
expect(screen.getByRole("heading", { name: "出典ソース一覧" })).toBeTruthy();
expect(screen.getByRole("heading", { name: "ライセンス / 権利処理" })).toBeTruthy();
expect(screen.getByText("政府・公的機関ソース")).toBeTruthy();
expect(screen.getByText("民間企業ソース")).toBeTruthy();
```

- [ ] **Step 5: Run the page-component test to verify it fails**

Run:

```bash
npm test -- components/__tests__/sources-license-page.test.tsx
```

Expected: FAIL because the page component does not exist.

- [ ] **Step 6: Implement the page and route**

Create `components/SourcesLicensePage.tsx` and `app/sources-license/page.tsx`.

Implementation requirements:

- load the seed graph with `loadSeedGraph()`
- derive grouped source data with `buildSourcesLicenseCatalog`
- render Japanese-only prose matching the approved spec
- include representative source rows with publisher, access mode, and outbound link

Add route metadata inside `app/sources-license/page.tsx`:

```ts
export const metadata = {
  title: "Sources / License | 日本経済安全保障マップ",
  description: "出典ソース、利用方針、ライセンス情報。"
};
```

- [ ] **Step 7: Run the source page test set**

Run:

```bash
npm test -- lib/legal/__tests__/source-catalog.test.ts components/__tests__/sources-license-page.test.tsx
```

Expected: PASS.

- [ ] **Step 8: Commit the sources/license slice**

Run:

```bash
git add lib/legal/source-catalog.ts lib/legal/__tests__/source-catalog.test.ts components/SourcesLicensePage.tsx components/__tests__/sources-license-page.test.tsx app/sources-license/page.tsx
git commit -m "feat: add sources and license page"
```

## Task 3: Add the Public Contact Page and Client-Side Validation

**Files:**
- Create: `types/contact.ts`
- Create: `lib/contact/validation.ts`
- Create: `lib/contact/__tests__/validation.test.ts`
- Create: `components/ContactForm.tsx`
- Create: `components/__tests__/contact-form.test.tsx`
- Create: `app/contact/page.tsx`

- [ ] **Step 1: Write the failing validation test**

Create `lib/contact/__tests__/validation.test.ts` covering:

- allowed categories
- required reply email
- subject/body length limits
- honeypot rejection

Example:

```ts
const result = validateContactPayload({
  category: "不具合・エラー",
  replyTo: "",
  subject: "Map bug",
  message: "Details",
  website: ""
});

expect(result.ok).toBe(false);
expect(result.errors.replyTo).toContain("必須");
```

- [ ] **Step 2: Run the validation test to verify it fails**

Run:

```bash
npm test -- lib/contact/__tests__/validation.test.ts
```

Expected: FAIL because the validation module does not exist.

- [ ] **Step 3: Implement contact types and validation**

Create `types/contact.ts` with:

- `CONTACT_CATEGORIES` constant
- `ContactCategory`
- `ContactPayload`
- `ContactValidationResult`

Create `lib/contact/validation.ts` with a pure `validateContactPayload` helper that:

- enforces the fixed category whitelist
- validates a reply email
- limits subject and body lengths
- rejects non-empty honeypot input

- [ ] **Step 4: Write the failing contact-form test**

Create `components/__tests__/contact-form.test.tsx` to assert the form renders the required fields and prevents empty submission:

```tsx
expect(screen.getByLabelText("カテゴリ")).toBeTruthy();
expect(screen.getByLabelText("返信先メールアドレス")).toBeTruthy();
expect(screen.getByLabelText("件名")).toBeTruthy();
expect(screen.getByLabelText("本文")).toBeTruthy();
```

Add a submit-path test that expects inline validation errors when the form is submitted with empty required fields.

- [ ] **Step 5: Run the contact-form test to verify it fails**

Run:

```bash
npm test -- components/__tests__/contact-form.test.tsx
```

Expected: FAIL because the form component does not exist.

- [ ] **Step 6: Implement the contact page UI**

Create `components/ContactForm.tsx` and `app/contact/page.tsx`.

Implementation requirements:

- fixed category select with the five approved options
- required `返信先メールアドレス`
- required `件名`
- required `本文`
- hidden honeypot field
- concise Japanese note that sensitive personal information should not be submitted
- submit state placeholders, but do not wire the real endpoint yet in this task

Page metadata:

```ts
export const metadata = {
  title: "問い合わせ | 日本経済安全保障マップ",
  description: "開発依頼、データ修正、不具合、取材連携などの問い合わせ窓口。"
};
```

- [ ] **Step 7: Run the contact UI test set**

Run:

```bash
npm test -- lib/contact/__tests__/validation.test.ts components/__tests__/contact-form.test.tsx
```

Expected: PASS.

- [ ] **Step 8: Commit the contact UI slice**

Run:

```bash
git add types/contact.ts lib/contact/validation.ts lib/contact/__tests__/validation.test.ts components/ContactForm.tsx components/__tests__/contact-form.test.tsx app/contact/page.tsx
git commit -m "feat: add public contact page"
```

## Task 4: Implement the SES Delivery Path and Contact API

**Files:**
- Create: `lib/contact/config.ts`
- Create: `lib/contact/ses.ts`
- Create: `lib/contact/__tests__/ses.test.ts`
- Create: `app/api/contact/route.ts`
- Create: `app/api/contact/route.test.ts`
- Modify: `components/ContactForm.tsx`

- [ ] **Step 1: Write the failing SES adapter test**

Create `lib/contact/__tests__/ses.test.ts` with tests that verify:

- required config values are enforced
- the SES request body includes `Destination`, `Message`, and `Source`
- non-2xx SES responses throw a useful error

Example:

```ts
const request = buildSesSendEmailRequest({
  region: "ap-northeast-1",
  accessKeyId: "key",
  secretAccessKey: "secret",
  fromEmail: "no-reply@quadrillionaaa.com",
  toEmail: "ai@quadrillion-ai.com",
  payload
});

expect(request.url).toContain("email.ap-northeast-1.amazonaws.com");
expect(request.body).toContain("ai@quadrillion-ai.com");
```

- [ ] **Step 2: Run the SES adapter test to verify it fails**

Run:

```bash
npm test -- lib/contact/__tests__/ses.test.ts
```

Expected: FAIL because the SES adapter does not exist.

- [ ] **Step 3: Implement config and SES helpers**

Create `lib/contact/config.ts` with a single environment-loader helper for:

- `CONTACT_TO_EMAIL`
- `CONTACT_FROM_EMAIL`
- `SES_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

Create `lib/contact/ses.ts` with:

- a pure request builder for `SendEmail`
- SigV4 signing
- a `sendContactEmail(payload, config)` helper that performs the fetch

Keep the signing logic encapsulated in one module so the route handler stays small.

- [ ] **Step 4: Write the failing route test**

Create `app/api/contact/route.test.ts` and mock `sendContactEmail`.

Cover:

- valid POST returns `200`
- invalid payload returns `400`
- non-empty honeypot returns `400`
- SES failure returns `502`

Example:

```ts
const response = await POST(
  new Request("http://localhost/api/contact", {
    method: "POST",
    body: JSON.stringify(validPayload),
    headers: { "content-type": "application/json" }
  })
);

expect(response.status).toBe(200);
```

- [ ] **Step 5: Run the route test to verify it fails**

Run:

```bash
npm test -- app/api/contact/route.test.ts
```

Expected: FAIL because the route handler does not exist.

- [ ] **Step 6: Implement the route handler and wire the form**

Create `app/api/contact/route.ts` and update `components/ContactForm.tsx` to submit to it.

Route requirements:

- accept only POST
- parse JSON safely
- validate with `validateContactPayload`
- call `sendContactEmail`
- return Japanese success and error messages

Form requirements:

- send JSON to `/api/contact`
- disable submit while pending
- show success/error messages inline

Important operational note:

- do **not** implement fake in-memory per-IP throttling inside the route
- instead, document and require Cloudflare WAF rate limiting in `docs/operations/ses-cloudflare-setup.md`

This avoids a misleading "rate limit" that would not behave correctly on distributed Workers instances.

- [ ] **Step 7: Run the contact delivery test set**

Run:

```bash
npm test -- lib/contact/__tests__/ses.test.ts app/api/contact/route.test.ts components/__tests__/contact-form.test.tsx
```

Expected: PASS.

- [ ] **Step 8: Commit the SES/API slice**

Run:

```bash
git add lib/contact/config.ts lib/contact/ses.ts lib/contact/__tests__/ses.test.ts app/api/contact/route.ts app/api/contact/route.test.ts components/ContactForm.tsx
git commit -m "feat: add ses-backed contact delivery"
```

## Task 5: Add Repository Rights Documents and Deployment Setup Notes

**Files:**
- Modify: `.env.example`
- Create: `LICENSE`
- Create: `DATA-SOURCES.md`
- Create: `docs/operations/ses-cloudflare-setup.md`
- Modify: `README.md`

- [ ] **Step 1: Write the failing documentation test or checklist**

Because the repository does not currently test docs, create a lightweight manual verification checklist inside the task and use it as the failing gate:

- `LICENSE` exists and is Apache-2.0 text
- `.env.example` contains the new contact env placeholders
- `README.md` links to the rights/contact surfaces
- `DATA-SOURCES.md` explains official-vs-private source handling
- `docs/operations/ses-cloudflare-setup.md` contains SES verification and Cloudflare DNS steps

Treat any missing document as a failure for this task.

- [ ] **Step 2: Add environment placeholders**

Update `.env.example` to include:

```dotenv
ESTAT_APP_ID=your-estat-app-id
CONTACT_TO_EMAIL=ai@quadrillion-ai.com
CONTACT_FROM_EMAIL=no-reply@quadrillionaaa.com
SES_REGION=ap-northeast-1
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
```

- [ ] **Step 3: Add rights and source-policy documents**

Create:

- `LICENSE` with Apache-2.0
- `DATA-SOURCES.md` explaining:
  - code vs source-material rights separation
  - government/public sources handled with attribution and source terms
  - private-company sources handled as paraphrase, facts, and links rather than republished corpora

- [ ] **Step 4: Add SES + Cloudflare setup documentation**

Create `docs/operations/ses-cloudflare-setup.md` with:

- AWS CLI commands for SES domain verification and DKIM:

```bash
aws ses verify-domain-identity --domain quadrillionaaa.com --region ap-northeast-1 --profile default
aws ses verify-domain-dkim --domain quadrillionaaa.com --region ap-northeast-1 --profile default
```

- Cloudflare DNS record instructions for the verification token and DKIM CNAMEs
- SPF record guidance for `quadrillionaaa.com`
- IAM policy scope for SES send-only credentials
- Cloudflare WAF/rate-limit rule requirement for `/api/contact`

- [ ] **Step 5: Update the README**

Modify `README.md` to add:

- code license reference
- source-data policy reference
- `Sources/License` page mention
- inquiry/contact behavior mention

- [ ] **Step 6: Run verification**

Run:

```bash
npm run typecheck
npm test
```

Expected: PASS.

Then manually verify:

- `/sources-license` renders with grouped source content
- `/contact` renders and posts successfully in local or preview mode with configured env vars
- the header menu exposes `共有`, `Sources/License`, and `問い合わせ`

- [ ] **Step 7: Commit the documentation and release-prep slice**

Run:

```bash
git add .env.example LICENSE DATA-SOURCES.md docs/operations/ses-cloudflare-setup.md README.md
git commit -m "docs: add licensing and contact setup guidance"
```

## Execution Notes

- Keep the implementation on top of the current `main` branch state unless the user asks for a feature branch.
- Do not touch unrelated untracked files such as `.claude/` or `.taskmaster/`.
- If SES verification is performed during implementation, do the AWS and Cloudflare record changes after the code path is ready so the developer can validate end-to-end once.
- Prefer one live smoke test in `npm run preview` before touching production deployment.
