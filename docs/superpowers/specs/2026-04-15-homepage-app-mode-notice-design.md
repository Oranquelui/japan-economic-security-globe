# Homepage App Mode Notice Design

Date: 2026-04-15

## Summary

This spec defines the MVP behavior for the unpublished top page state.

The product does not have a dedicated landing page yet. During this phase, `/`, `/ja`, and `/en` should all open the existing application surface directly. To avoid confusing first-time visitors, the app should show a lightweight notice modal only on the first visit when the site is operating in "homepage app mode".

The design goal is to keep the current app publicly accessible with minimal routing changes, minimal UI disruption, and a clear path to removing this behavior once a real top page exists.

## Product Decisions

### 1. Homepage behavior

The MVP homepage should not introduce a separate landing page.

Instead:

- `/` opens the current app
- `/ja` opens the same app
- `/en` opens the same app

This keeps the public entry point simple while the product is still in test operation.

### 2. First-visit notice

The app should show a modal only for the first visit to the public homepage surface.

The notice text is fixed:

1. `MVP/テスト運用中`
2. `無料公開中`
3. `仕様は予告なく変更される場合があります`

The notice is informational, not promotional. It should not interrupt the core product more than necessary.

### 3. Locale behavior

Locale-aware routes should exist, but the app itself does not need full translation in this change.

For this iteration:

- `/ja` uses the same Japanese UI as `/`
- `/en` also uses the same Japanese UI as `/`
- the modal copy remains Japanese-only

Reasoning:

- the current application shell is already Japanese-oriented
- translating only the notice would create a mismatch with the rest of the product
- full localization should be handled as a later, app-wide change

## UX Design

### 1. Modal presentation

The notice should appear as a centered modal over the current application UI.

Visual direction:

- understated, not marketing-heavy
- dark blue-gray / blue-gray backdrop treatment
- compact panel sized for quick dismissal
- small circular monochrome emblem at the top of the modal

The app itself should remain visible behind the scrim so users understand they are already in the product.

### 2. Modal layout

Expected structure:

- top-right close button
- small round emblem centered above the text
- three fixed lines of body copy
- no CTA other than dismissal

The emblem should initially be a lightweight built-in mark, not an external image dependency.

### 3. Logo direction

The modal should include a small "NSC-like" seal treatment, but adapted toward a Japanese public-institution tone rather than a U.S. agency seal.

For implementation:

- use a simple monochrome in-product mark for now
- keep the slot easy to replace later with a generated asset

The generated image work can happen separately without blocking this feature.

## Technical Design

### 1. Routing strategy

Use separate route files with a shared page implementation.

Recommended structure:

- `app/page.tsx`
- `app/[locale]/page.tsx`
- `app/_components/AppPage.tsx`

`app/page.tsx` and `app/[locale]/page.tsx` should stay thin and delegate to the shared app page component.

This is preferred over an optional catch-all or middleware rewrite because:

- it keeps the current root route stable
- it adds locale entry points with minimal risk
- it preserves room for future locale-specific behavior without adding rewrite complexity

### 2. App composition

The shared `AppPage` server component should:

- load the graph data
- parse URL state
- determine the effective locale
- read homepage mode configuration
- pass those values into `AppShell`

`AppShell` remains the main interactive client shell and receives only the extra props needed for the notice behavior.

### 3. Homepage mode configuration

The notice behavior must be gated by configuration so it can be disabled once a real homepage ships.

Recommended config shape:

- `NEXT_PUBLIC_HOMEPAGE_MODE=app`

Behavior:

- `app` means the current application is acting as the homepage and should consider showing the first-visit notice
- any missing or unsupported value falls back to non-notice behavior

This avoids hard-coding MVP-only logic into the shell.

### 4. First-visit persistence

The notice should use client-side persistence and should not require auth or server state.

Recommended storage:

- `localStorage`

Recommended key:

- `jp-sdg:homepage-notice:v1`

Behavior:

- if the key is absent and homepage mode is `app`, show the modal
- when the user dismisses the modal, store the key
- on later visits, do not show the modal again

The dismissal state should be shared across `/`, `/ja`, and `/en`.

### 5. Accessibility behavior

The modal should meet lightweight accessibility expectations for an MVP public site.

Required behavior:

- close button is keyboard reachable
- `Escape` closes the modal
- modal uses dialog semantics
- initial focus moves into the modal when it opens

Click-outside dismissal is optional and not required for this version.

## Error Handling

The notice should fail quietly and never block the application from rendering.

Rules:

- if `localStorage` access throws, skip the modal
- if homepage mode is not `app`, skip the modal
- if a locale outside the supported set is requested, fall back to the shared app behavior rather than breaking routing

This feature is auxiliary. It must not compromise app access.

## Testing

The change should include focused component and routing coverage.

Minimum test scope:

- root app route still renders the app shell
- locale route renders the same app shell for `ja` and `en`
- notice renders only when homepage mode is `app`
- notice does not render after dismissal state is stored
- `Escape` closes the notice
- close button stores dismissal state

Testing should stay narrow and avoid snapshot-heavy UI assertions.

## Implementation Notes

The implementation should preserve the current visual language of the app and avoid introducing a separate landing-page style system.

Notes:

- keep `AppShell` changes minimal
- isolate modal logic in its own client component
- keep the emblem implementation internal and lightweight
- do not attempt full i18n in this change
- keep the route additions simple and reversible

## Future Follow-Ups

The following work is intentionally out of scope for this change:

- full Japanese/English localization
- a dedicated marketing or explanatory top page
- server-managed visitor state
- analytics instrumentation for modal impressions
- replacing the placeholder emblem with a finished generated logo asset

## Appendix: Logo Prompt

If a generated seal is created later in nanobanana, use a prompt in this direction:

`Create a minimalist circular public-institution style seal for a Japanese economic security / strategic resilience product. Monochrome only. Dark blue-gray on transparent or light neutral background. Clean vector-like geometry, restrained official tone, no photorealism, no gradients, no U.S. eagle motifs, no flags, no military aggression. Use a subtle Japanese institutional mood with abstract geometric symbolism suggesting security, infrastructure, interdependence, and national resilience. Central emblem only or compact ring-seal composition. High legibility at small sizes.`
