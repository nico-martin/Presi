# Presi Contributor Notes

This file is for agents working on the Presi library repository itself. It is not shipped in the npm package.

For agents working with Presi in a presentation app, use the consumer skills under `skills/`. The build copies them into `packages/presi-js/skills` before npm packaging.

## Overview

Presi is a presentation framework built as a single npm package from local source. The library code lives under `library/`, is bundled with esbuild into generated output under `packages/presi-js`, and is exercised by example/demo slides in `slides/test`.

Presi is React-first: there is no framework-agnostic DOM-scanning core. React components register slides, fragments, and JS steps into a deck store, and an imperative engine drives visibility and Web Animations API transitions on the registered elements.

Use `pnpm` for all package operations.

## Workspace Packages

The workspace is defined in `pnpm-workspace.yaml`.

Package output:

- `packages/presi-js` publishes/represents the single public `presi-js` package.
- Public subpath imports are `presi-js/react` and `presi-js/server`; the package root re-exports `presi-js/react`.
- `slides/test` is a Vite demo app package named `@presi/slides-test`.

The root package is private and is only used to coordinate development scripts and dependencies.

## Library Source

Source files are in `library/`.

### `library/react`

The React package is the whole browser runtime plus the authoring API.

`library/react/engine/` holds the framework-independent internals:

- `deckStore.ts`: the heart. Holds slide/fragment/effect registrations, builds per-slide step timelines (DOM-position ordered), resolves and draws hash states, runs step effects with cleanup, and exposes a `useSyncExternalStore`-compatible snapshot plus export-only slide metadata and notes through `window.__PRESI_DECK__`.
- `hashState.ts`: pure hash parsing/serializing, next/back state math, slide-id validation.
- `transitions.ts`: `TRANSITIONS` keyframes, `TransitionName`, and the WAAPI `TransitionEngine` (stagger, out-inversion, commitStyles bookkeeping).
- `keyboard.ts`: keyboard navigation/fullscreen helpers and the editable-target guard.
- `notes.ts` + `notesView.html`: speaker view popup (opened with `S`), fed from the store via `postMessage`; previews are hash-URL iframes.
- `styles.ts`: injected base/instance style sheets (`presi-wrapper`, `presi-slide`, `presi-fragment`, `data-presi-static`).

Components and hooks:

- `Wrapper` owns the `DeckStore` (created once, config updates flow without teardown) and provides it via context.
- `Slide` registers a slide record and renders the `<section>` (+ background/content split).
- `Fragment` is the polymorphic (`as` prop) typed fragment component; it registers its element with `{transitionIn, transitionOut, order, stepIndex}` into the surrounding slide.
- `Step` registers a JS effect at a step; its hidden `<span>` only anchors document position for implicit ordering.
- `usePresi` reads the store snapshot; only its consumers re-render on navigation.

Primary public imports:

```tsx
import { Wrapper, Slide, Fragment, Step, usePresi } from "presi-js/react";
```

`usePresi()` currently returns:

```ts
{
  isExporting: boolean;
  slideIndex: number;
  stepIndex: number;
  totalSlides: number;
  totalSteps: number;
  currentSlide: {
    title: string;
  }
}
```

Timeline rules (preserve these when touching `deckStore.ts`):

- A step can contain fragments, JS effects, or both; multiple elements may share a step.
- Implicit steps auto-increment in DOM order; an explicit `stepIndex` bumps the implicit counter.
- `transitionOut`-only fragments are "out" elements: visible at step 0, hidden once their step is reached.
- Step 0 is the initial slide state; `stepIndex={0}` fragments animate with the slide entrance.
- An in-range numeric hash is exact and must never be rewritten to the slide id (the PDF export drives numeric hashes and waits for exact matches).
- Backwards navigation (`prev`) skips in- and out-animations by design.
- Navigation is instant: `next`/`prev` write the hash synchronously and out-animations run fire-and-forget, so rapid navigation chains off fresh state and only cuts animations short.
- `transition.inDelay` stages animations only: in-transitions start `inDelay` ms after the out-transitions begin (backwards fill holds incoming elements invisible). It must never delay the hash write.
- Navigation keys act on `keydown`; holding one fast-forwards via a deck-owned repeat timer (400ms threshold, 100ms interval), not OS key repeat. `F` stays on `keyup`.

### `library/server`

Dev/build/present/export around Vite, plus the CLI and the `create react` scaffolder. The export flow reads `window.__PRESI_DECK__` for the slide/step map and scrapes `.presi-wrapper` outerHTML per hash state into a PDF, so those class names and the `<section>` slide element are part of the server contract.

## Build Outputs

Do not edit files under `packages/` manually. They are generated by:

```sh
pnpm build
```

The build script is `scripts/build.mjs`. It bundles:

- `library/react/index.ts` to `packages/presi-js/dist/react.js`
- `library/server/index.ts` to `packages/presi-js/dist/server.js`
- `library/server/cli.ts` to `packages/presi-js/dist/cli.js`

It also writes `dist/index.js` (a re-export of `./react.js`, so root and subpath imports share one module instance) and the public `.d.ts` files. The `.d.ts` files are hand-written string templates in `scripts/build.mjs` — update them whenever the public API changes.

The build uses esbuild. Vite is not used for library bundling.

## Development Flow

Run everything for local development with:

```sh
pnpm dev
```

This runs:

- `node scripts/build.mjs --watch`
- `pnpm --filter @presi/slides-test dev`

The library watcher rebuilds `packages/presi-js` whenever `library/` changes. The Vite demo app runs through the generated CLI while its config aliases `presi-js/react` back to local source.

## Demo App: `slides/test`

`slides/test` is the local consumer app. It should behave like an external app using the packages:

```tsx
import { Wrapper, Slide, Fragment } from "presi-js/react";
```

It is a Vite React app with Tailwind CSS.

Important files:

- `slides/test/Slides.tsx` is the app entry.
- `slides/test/slides/` contains individual slide files.
- `slides/test/theme/Slide.tsx` wraps `presi-js/react`'s `Slide` with theme defaults.
- `slides/test/style.css` imports fonts and Tailwind layers.
- `slides/test/fonts/` contains locally hosted Nunito and Nunito Sans variable fonts.
- `slides/test/tailwind.config.js` controls Tailwind content scanning and theme extensions.

The demo deck deliberately exercises the timeline edge cases: shared steps with `order`, a `Step` sharing an index with a fragment, an explicit `stepIndex` bumping an implicit fragment, and a `transitionOut`-only element.

## Styling

The demo app imports Tailwind through `slides/test/style.css`.

The theme wrapper can style the actual slide surface because `presi-js/react`'s `Slide` accepts `className` and forwards it to the underlying `<section>`.

Use Tailwind classes in files matched by `slides/test/tailwind.config.js`:

- `slides/test/Slides.tsx`
- `slides/test/slides/**/*.{ts,tsx}`
- `slides/test/theme/**/*.{ts,tsx}`

## Verification

Useful checks:

```sh
pnpm build
pnpm --filter @presi/slides-test build
npx tsc --noEmit
pnpm install --frozen-lockfile
```

`pnpm --filter @presi/slides-test build` may print a Browserslist stale `caniuse-lite` warning. That warning is unrelated to the presentation library.

## Implementation Notes

- Keep package source in `library/`; generated package output belongs in `packages/presi-js`.
- Registration happens in `useLayoutEffect` with cleanup — never during render.
- Ordering comes from DOM position (`compareDocumentPosition`), not effect order.
- Avoid reintroducing Vite for library builds; Vite is only for `slides/test`.
- `Slide` `onMount` runs when the slide becomes active (a step-0 effect).
- `Slide` `onUnmount` runs when the slide is no longer active or when the presentation unmounts.

## Packaging

- The npm package is `packages/presi-js`.
- `packages/presi-js/package.json` is generated by `scripts/build.mjs` and controls what ships to npm.
- Source skills live in root `skills/`.
- The build copies root `skills/` to `packages/presi-js/skills`.
- Ship `dist` and generated `skills`.
- Do not ship `AGENTS.md`; it is repository-only contributor guidance.
- Do not ship `slides/`; it is the local example app.
