# Homepage App Mode Notice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/`, `/ja`, and `/en` render the current app while showing a first-visit-only MVP notice modal when homepage mode is configured as `app`.

**Architecture:** Keep routing thin by extracting the current app page logic into a shared server component, then add a small client-only modal component that reads dismissal state from `localStorage` and overlays the existing `AppShell`. Gate the behavior behind a dedicated homepage-mode config helper so the entire feature can be turned off when a real homepage ships.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS, Vitest, Testing Library, existing seed-graph data loader and AppShell.

---

## File Structure

- Create `lib/config/homepage-mode.ts`: parse the public homepage mode flag and normalize supported values.
- Create `lib/config/__tests__/homepage-mode.test.ts`: pure tests for config parsing and invalid fallback behavior.
- Create `app/_components/AppPage.tsx`: shared server component that loads graph data, parses URL state, and passes locale/homepage mode into `AppShell`.
- Modify `app/page.tsx`: delegate to `AppPage` with the default locale.
- Create `app/[locale]/page.tsx`: delegate to `AppPage` for `ja` and `en`, while preserving shared app rendering for other locale values.
- Create `app/__tests__/app-page.test.tsx`: route-entry tests proving `/` and locale pages both render the shared app component contract.

- Create `components/InitialNoticeModal.tsx`: client-only modal with dialog semantics, close button, `Escape` handling, and `localStorage` persistence.
- Create `components/__tests__/initial-notice-modal.test.tsx`: focused tests for first-visit rendering, dismissal persistence, and keyboard close behavior.
- Modify `components/AppShell.tsx`: accept `locale` and `homepageMode` props and render the modal above the existing shell layout only when enabled.
- Modify `components/__tests__/app-shell-url-state.test.tsx`: keep current URL-state coverage intact while asserting modal gating and share-path preservation.

## Task 1: Extract Shared App Page and Homepage Mode Config

**Files:**
- Create: `lib/config/homepage-mode.ts`
- Create: `lib/config/__tests__/homepage-mode.test.ts`
- Create: `app/_components/AppPage.tsx`
- Create: `app/[locale]/page.tsx`
- Modify: `app/page.tsx`
- Test: `app/__tests__/app-page.test.tsx`

- [ ] **Step 1: Write the failing config test**

Create `lib/config/__tests__/homepage-mode.test.ts` with assertions that:

```ts
expect(resolveHomepageMode("app")).toBe("app");
expect(resolveHomepageMode(undefined)).toBe("default");
expect(resolveHomepageMode("bogus")).toBe("default");
```

- [ ] **Step 2: Run the config test to verify it fails**

Run:

```bash
npm test -- lib/config/__tests__/homepage-mode.test.ts
```

Expected: FAIL because `lib/config/homepage-mode.ts` does not exist.

- [ ] **Step 3: Implement the minimal homepage-mode helper**

Create `lib/config/homepage-mode.ts` with:

```ts
export type HomepageMode = "default" | "app";

export function resolveHomepageMode(rawValue: string | undefined): HomepageMode {
  return rawValue === "app" ? "app" : "default";
}
```

- [ ] **Step 4: Write the failing shared-route test**

Create `app/__tests__/app-page.test.tsx` that mocks `loadSeedGraph`, `parseOperationsUrlState`, and `AppShell`, then verifies:

```tsx
render(await RootPage({ searchParams: Promise.resolve({ theme: "rice" }) }));
expect(screen.getByTestId("app-shell")).toHaveAttribute("data-locale", "ja");
expect(screen.getByTestId("app-shell")).toHaveAttribute("data-homepage-mode", "default");

render(
  await LocalePage({
    params: Promise.resolve({ locale: "en" }),
    searchParams: Promise.resolve({})
  })
);
expect(screen.getByTestId("app-shell")).toHaveAttribute("data-locale", "en");
```

- [ ] **Step 5: Run the route test to verify it fails**

Run:

```bash
npm test -- app/__tests__/app-page.test.tsx
```

Expected: FAIL because `AppPage` and `app/[locale]/page.tsx` do not exist.

- [ ] **Step 6: Implement the shared page extraction**

Create `app/_components/AppPage.tsx` that:

- loads the graph with `loadSeedGraph()`
- parses URL state from `searchParams`
- resolves `homepageMode` from `process.env.NEXT_PUBLIC_HOMEPAGE_MODE`
- passes `graph`, `initialUrlState`, `locale`, and `homepageMode` to `AppShell`

Update `app/page.tsx` to delegate:

```tsx
return <AppPage locale="ja" searchParams={searchParams} />;
```

Create `app/[locale]/page.tsx` to delegate:

```tsx
return <AppPage locale={(await params).locale} searchParams={searchParams} />;
```

- [ ] **Step 7: Run the shared-page test set**

Run:

```bash
npm test -- lib/config/__tests__/homepage-mode.test.ts app/__tests__/app-page.test.tsx
```

Expected: PASS.

- [ ] **Step 8: Commit the routing/config slice**

Run:

```bash
git add lib/config/homepage-mode.ts lib/config/__tests__/homepage-mode.test.ts app/_components/AppPage.tsx app/page.tsx app/[locale]/page.tsx app/__tests__/app-page.test.tsx
git commit -m "feat: add homepage app mode routing"
```

## Task 2: Add the First-Visit Notice Modal

**Files:**
- Create: `components/InitialNoticeModal.tsx`
- Test: `components/__tests__/initial-notice-modal.test.tsx`

- [ ] **Step 1: Write the failing modal test**

Create `components/__tests__/initial-notice-modal.test.tsx` with tests that:

- render the modal when `homepageMode="app"` and no dismissal exists
- do not render it when dismissal is already stored
- close on `Escape`
- persist dismissal on close button click

Example core assertions:

```tsx
render(<InitialNoticeModal homepageMode="app" />);
expect(screen.getByRole("dialog")).toBeTruthy();
expect(screen.getByText("MVP/テスト運用中")).toBeTruthy();

fireEvent.keyDown(window, { key: "Escape" });
expect(screen.queryByRole("dialog")).toBeNull();
expect(window.localStorage.getItem("jp-sdg:homepage-notice:v1")).toBe("dismissed");
```

- [ ] **Step 2: Run the modal test to verify it fails**

Run:

```bash
npm test -- components/__tests__/initial-notice-modal.test.tsx
```

Expected: FAIL because the modal component does not exist.

- [ ] **Step 3: Implement the minimal modal component**

Create `components/InitialNoticeModal.tsx` with:

- internal `open` state initialized after mount
- `localStorage` key `jp-sdg:homepage-notice:v1`
- a centered panel with a monochrome circular mark
- fixed Japanese copy
- close button
- `Escape` key handling
- `role="dialog"` and `aria-modal="true"`

Minimal persistence shape:

```ts
const STORAGE_KEY = "jp-sdg:homepage-notice:v1";
```

When storage access fails, do not render the modal.

- [ ] **Step 4: Run the modal test to verify it passes**

Run:

```bash
npm test -- components/__tests__/initial-notice-modal.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit the modal slice**

Run:

```bash
git add components/InitialNoticeModal.tsx components/__tests__/initial-notice-modal.test.tsx
git commit -m "feat: add homepage notice modal"
```

## Task 3: Integrate the Modal into AppShell and Verify the Full Behavior

**Files:**
- Modify: `components/AppShell.tsx`
- Modify: `components/__tests__/app-shell-url-state.test.tsx`
- Modify: `.env.example`

- [ ] **Step 1: Write the failing AppShell integration test**

Extend `components/__tests__/app-shell-url-state.test.tsx` with tests that:

- modal appears when `homepageMode="app"`
- modal does not appear when `homepageMode="default"`
- existing URL replacement behavior still works with the new props

Example assertion:

```tsx
render(<AppShell graph={loadSeedGraph()} homepageMode="app" locale="ja" />);
expect(screen.getByRole("dialog")).toBeTruthy();

render(<AppShell graph={loadSeedGraph()} homepageMode="default" locale="ja" />);
expect(screen.queryByRole("dialog")).toBeNull();
```

- [ ] **Step 2: Run the AppShell test to verify it fails**

Run:

```bash
npm test -- components/__tests__/app-shell-url-state.test.tsx
```

Expected: FAIL because `AppShell` does not accept the new props and does not render the modal.

- [ ] **Step 3: Implement the AppShell integration**

Update `components/AppShell.tsx` to:

- accept `locale?: string` and `homepageMode?: HomepageMode`
- render `<InitialNoticeModal homepageMode={homepageMode} locale={locale} />` near the top of the shell tree
- leave the existing layout, URL-sync, and share-path logic unchanged

Keep prop defaults conservative:

```ts
locale = "ja"
homepageMode = "default"
```

- [ ] **Step 4: Document the config flag**

Update `.env.example` to include:

```env
NEXT_PUBLIC_HOMEPAGE_MODE=app
```

- [ ] **Step 5: Run the focused verification set**

Run:

```bash
npm test -- lib/config/__tests__/homepage-mode.test.ts app/__tests__/app-page.test.tsx components/__tests__/initial-notice-modal.test.tsx components/__tests__/app-shell-url-state.test.tsx
```

Then run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit the integrated feature**

Run:

```bash
git add components/AppShell.tsx components/__tests__/app-shell-url-state.test.tsx .env.example
git commit -m "feat: gate homepage notice behind app mode"
```
