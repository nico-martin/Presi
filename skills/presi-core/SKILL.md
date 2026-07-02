---
name: presi-core
description: Use when working with a Presi presentation at the framework-agnostic level: project setup, presi.config.ts, CLI commands, routing, steps, fragments, notes, and build behavior.
---

# Presi Core

Use this skill when working with a project that consumes Presi. Do not use it for modifying Presi's own library source.

Presi is distributed as one npm package named `presi`.

Public imports:

```ts
import { Presi } from "presi-js/core";
import { defineConfig } from "presi-js/server";
```

Do not import from `@presi/*`, `library/*`, or `packages/*` in a consumer app.

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
- Keep the server framework agnostic. React, Vue, Svelte, or vanilla apps should all fit the same render-entry model.

If the app provides `index.html`, its mount element must match `resolveMountElement`:

```html
<div id="app"></div>
```

If no `index.html` exists, Presi generates a default shell with:

```html
<div id="presi"></div>
```

## Presentation Entry Contract

The browser entry should default-export a render function:

```ts
export default function render(mountElement: HTMLElement) {
  // Mount your framework/app here.
}
```

## Navigation Model

Presi uses hash routes:

```txt
/#/:slideIndex/:stepIndex
```

Indexes are zero-based. Step `0` is the initial slide state.

## Steps And Fragments

A slide timeline is made of steps. A step can contain fragments, JavaScript effects, or both.

Fragments are DOM elements with the `fragment` class:

```html
<p class="fragment" data-step-index="1">Appears at step 1</p>
```

Use `data-step-index` for explicit positioning. Avoid `data-fragment-index` in new code; it only exists as a legacy alias.

## Transitions

Slides and step elements have no transition by default. Add `data-transition-in` or `data-transition-out` to opt in.

Supported values are `fade`, `fade-up`, `fade-left`, `fade-right`, `fade-down`, `fade-grow`, `fade-up-grow`, `fade-left-grow`, `fade-right-grow`, and `fade-down-grow`.

Transitions are always `200ms` with `cubic-bezier(.2, .85, .25, 1)`. Multiple elements in one step are staggered by `100ms` in DOM order. Use `data-transition-in-order` or `data-transition-out-order` to override sequencing.

The constants and attribute names are exported as `PRESI_TRANSITION_CONFIG` from `presi-js/core`.

Override timing and attribute names when creating `Presi` with `transition: { duration, delay, easing, attributes }`.

## Notes

Notes are enabled in dev and disabled in production by default.

Presi server injects the compile-time global:

```ts
PRESI_INCLUDE_NOTES
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
```
