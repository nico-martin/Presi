---
name: presi-core
description: Use when working with a Presi presentation at the project level: setup, presi.config.ts, CLI commands, routing, static rendering, notes builds, and export.
---

# Presi Core

Use this skill when working with a project that consumes Presi. Do not use it for modifying Presi's own library source. For authoring slides, fragments, and transitions, use the `presi-react` skill — Presi is React-first, and slides are React components.

Presi is distributed as one npm package named `presi-js`.

Public imports:

```ts
import { Wrapper, Slide, Fragment } from "presi-js/react";
import { defineConfig } from "presi-js/server";
```

Do not import from `@presi/*`, `presi-js/core`, `library/*`, or `packages/*` in a consumer app.

## Creating A Presentation

Create a React presentation:

```sh
npx presi-js create react my-talk
```

Shortcut:

```sh
npx presi-js react my-talk
```

After creation:

```sh
cd my-talk
pnpm install
pnpm dev
```

The generated app should have scripts like:

```json
{
  "scripts": {
    "dev": "presi-js dev",
    "build": "presi-js build"
  }
}
```

## Presi Config

Presentation apps use `presi.config.ts`.

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "presi-js/server";

export default defineConfig({
  entry: "Slides.tsx",
  title: "My Presentation",
  resolveMountElement: () => document.getElementById("app"),
  vite: {
    plugins: [react()],
  },
});
```

Important rules:

- Use `resolveMountElement`; do not add a `mountId` option.
- Pass framework integration through `vite.plugins`.

If the app provides `index.html`, its mount element must match `resolveMountElement`:

```html
<div id="app"></div>
```

If no `index.html` exists, Presi generates a default shell with:

```html
<div id="presi"></div>
```

## Presentation Entry Contract

The browser entry should default-export a render function that mounts the React deck and returns a cleanup function:

```tsx
export default function render(mountElement: HTMLElement) {
  const root = ReactDOM.createRoot(mountElement);
  root.render(<App />);

  return () => root.unmount();
}
```

## Navigation Model

Presi uses hash routes:

```txt
/#/:slideIndex/:stepIndex
/#/:slideId/:stepIndex
```

Indexes are zero-based. Step `0` is the initial slide state.

Give slides stable `id` props when they need to be opened directly without knowing their deck position. That slide can then be opened at step `2` with `/#/architecture/2`. Named routes continue to target the same slide when the deck is reordered. Slide IDs are optional, but IDs used for routing must be unique and must not contain only digits. Numeric routes remain supported for slides without IDs and for backward compatibility, and an in-range numeric route is kept as-is rather than rewritten to the slide's ID.

Navigation serializes the destination slide's ID when it has one. Invalid slide or step indexes are clamped to a valid state, while an unknown slide ID returns to the first slide.

Keyboard shortcuts are `ArrowRight` or `Space` for next, `ArrowLeft` for previous, `F` for fullscreen, and `S` for speaker view. Holding a navigation key fast-forwards through the deck. Presi ignores these shortcuts while focus is in an `input`, `textarea`, `select`, or contenteditable element. The speaker view applies the same guard before forwarding navigation keys.

## Static Rendering

Add the `presi-static` query parameter to disable Presi transitions and CSS animations or transitions inside the presentation wrapper:

```txt
/?presi-static#/architecture/2
```

The query string comes before the hash. Fragments and JavaScript steps still resolve to the requested state. Use this mode for deterministic screenshots and visual inspection; use the normal URL when checking transition behavior.

## Notes

Notes are enabled in dev and disabled in production by default.

Presi server injects the compile-time global:

```ts
PRESI_INCLUDE_NOTES;
```

Config overrides:

```ts
export default defineConfig({
  dev: { includeNotes: true },
  build: { includeNotes: false },
});
```

## Commands

Run in a Presi presentation app:

```sh
pnpm dev
pnpm build
```

If debugging directly:

```sh
pnpm exec presi-js dev
pnpm exec presi-js build
pnpm exec presi-js present
pnpm exec presi-js export
pnpm exec presi-js export --mode=transcript
pnpm exec presi-js export --mode=notes
```

`present` builds and serves the static deck. Export modes are:

- The default `pdf` mode renders every slide step to a PDF at `export.file`.
- `transcript` renders one A4 page per slide with its final step above its notes.
- `notes` writes all notes as Markdown with one level-two heading per slide.

For an `export.file` of `deck.pdf`, alternate outputs are
`deck.transcript.pdf` and `deck.notes.md`.

During any export, `usePresi().isExporting` is `true`. Presentation components
can use this to replace interactive-only content with a static explanation.
