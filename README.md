# Presi

Presi is a presentation framework built as local pnpm workspace packages.

The core idea is that presentations are normal frontend apps. Presi provides the presentation runtime, React bindings, and a framework-agnostic dev/build server around Vite.

## Packages

This repo is a pnpm workspace.

- `@presi/core` lives in `library/core` and builds to `packages/core`.
- `@presi/react` lives in `library/react` and builds to `packages/react`.
- `@presi/server` lives in `library/server` and builds to `packages/server`.
- `@presi/slides-test` lives in `slides/test` and is the local example presentation app.

Generated files under `packages/*/dist` are build output. Do not edit them manually.

## Commands

Install dependencies:

```sh
pnpm install
```

Build the Presi packages:

```sh
pnpm build
```

Run library watch mode and the test presentation dev server:

```sh
pnpm dev
```

Build the test presentation:

```sh
pnpm --filter @presi/slides-test build
```

Type-check the test presentation:

```sh
pnpm --filter @presi/slides-test exec tsc --noEmit
```

## Architecture

### `@presi/core`

`@presi/core` owns the browser presentation runtime.

Responsibilities:

- Reads the slide DOM.
- Builds a per-slide timeline of steps.
- Handles hash navigation like `/#/0/2`.
- Handles keyboard navigation.
- Handles fullscreen shortcuts.
- Shows and hides slides.
- Shows and hides fragments.
- Runs JS step effects.
- Runs cleanup functions when effects become inactive.
- Exposes state and metadata for UI bindings.

Important concepts:

- `slideIndex` is zero-based.
- `stepIndex` is the current step within the active slide.
- Internally, some older code still uses the name `fragmentIndex` for `stepIndex`.
- Step `0` is the initial state of a slide.
- Fragments are elements with the `fragment` class.
- Fragments can use `data-step-index` to choose a specific step.
- `data-fragment-index` still works as a legacy alias.
- JS effects are registered through the step registry and referenced in the DOM by `data-presi-step-id`.

### `@presi/react`

`@presi/react` provides React bindings for Presi.

Primary imports:

```tsx
import { Wrapper, Slide, Step, usePresi, useSlideMount } from "@presi/react";
```

`Wrapper` creates the core `Presi` instance:

```tsx
<Wrapper aspectRatio="16:9">
  <Slide title="Intro">Hello</Slide>
</Wrapper>
```

`Slide` renders a slide `<section>`:

```tsx
<Slide title="Intro" className="p-8">
  <p>Hello</p>
</Slide>
```

`className` is forwarded to the actual slide surface.

Fragments use the `fragment` class:

```tsx
<Slide title="Fragments">
  <p className="fragment" data-step-index="1">
    First fragment
  </p>
  <p className="fragment" data-step-index="2">
    Second fragment
  </p>
</Slide>
```

`Step` runs JS at a specific step:

```tsx
<Slide title="JS Step">
  <p className="fragment" data-step-index="1">
    First fragment
  </p>
  <Step stepIndex={2} run={() => console.log("hello")} />
  <p className="fragment" data-step-index="3">
    Second fragment
  </p>
</Slide>
```

`useSlideMount` registers a step-0 effect for the next rendered `Slide`:

```tsx
function IntroSlide() {
  useSlideMount(() => {
    console.log("slide active");

    return () => {
      console.log("slide inactive");
    };
  });

  return <Slide title="Intro">Hello</Slide>;
}
```

Call `useSlideMount` at the top of a slide component before returning `<Slide>`.

`usePresi` exposes presentation state:

```tsx
const { slideIndex, stepIndex, totalSlides, totalSteps, currentSlide } =
  usePresi();
```

Current shape:

```ts
{
  slideIndex: number;
  stepIndex: number;
  totalSlides: number;
  totalSteps: number;
  currentSlide: {
    title: string;
  };
}
```

### `@presi/server`

`@presi/server` provides a framework-agnostic dev/build layer on top of Vite.

It does not know about React, Vue, Svelte, or any specific UI framework. Framework support is passed through Vite plugins in the Presi config.

Supported commands for now:

- `presi dev`
- `presi build`

PDF export is planned but not implemented yet.

## Presi Server Config

A presentation app can define `presi.config.ts`:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "@presi/server";

export default defineConfig({
  entry: "Slides.tsx",
  title: "Presi Test Slides",
  resolveMountElement: () => document.getElementById("app"),
  vite: {
    plugins: [react()],
  },
  dev: {
    port: 3000,
    includeNotes: true,
  },
  build: {
    outDir: "dist",
    includeNotes: false,
  },
});
```

Config fields:

- `root`: presentation root directory. Defaults to `.`.
- `entry`: browser entry module. Defaults to `Slides.tsx`.
- `title`: HTML document title.
- `resolveMountElement`: browser function that returns the mount element.
- `vite`: Vite config merged into Presi's internal Vite config.
- `dev.port`: dev server port.
- `dev.host`: dev server host.
- `dev.includeNotes`: whether notes render in dev.
- `build.outDir`: production output directory.
- `build.includeNotes`: whether notes render in production.

If no `index.html` exists, Presi generates a default HTML shell with:

```html
<div id="presi"></div>
```

The default resolver is:

```ts
() => document.getElementById("presi")
```

If a presentation provides its own `index.html`, Presi preserves it.

## Presentation Entry

The presentation entry should default-export a render function.

React example:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { Wrapper, Slide } from "@presi/react";

const App = () => (
  <Wrapper aspectRatio="16:9">
    <Slide title="Hello">Hello world</Slide>
  </Wrapper>
);

export default function render(mountElement: HTMLElement) {
  ReactDOM.createRoot(mountElement).render(<App />);
}
```

This keeps `@presi/server` framework agnostic. Vue, Svelte, Solid, vanilla JS, or any other frontend stack can use the same shape as long as the entry exports a render function.

## Notes

Speaker notes are controlled through a runtime build convention.

`@presi/server` defines:

```ts
import.meta.env.PRESI_INCLUDE_NOTES
```

By default:

- Dev builds include notes.
- Production builds exclude notes.

In React, `Slide` only renders `<aside>` notes when notes are enabled:

```tsx
<Slide title="Intro" notes={["Speaker note"]}>
  Hello
</Slide>
```

## `slides/test`

`slides/test` is the local example presentation app.

Important files:

- `slides/test/presi.config.ts`: Presi server config.
- `slides/test/index.html`: custom HTML shell using `#app`.
- `slides/test/Slides.tsx`: app entry; exports the render function.
- `slides/test/slides/`: individual slide files.
- `slides/test/theme/Slide.tsx`: themed wrapper around `@presi/react`'s `Slide`.
- `slides/test/style.css`: imports fonts and Tailwind layers.
- `slides/test/fonts/font.css`: Affogato font-face declarations.
- `slides/test/tailwind.config.js`: Tailwind content/theme config.
- `slides/test/postcss.config.js`: enables Tailwind and Autoprefixer.

The app is intentionally a consumer of the built packages:

```tsx
import { Wrapper, Slide } from "@presi/react";
```

It should behave like an external app using Presi.

## Tailwind And Fonts

The test app imports styles from `slides/test/style.css`:

```css
@import "./fonts/font.css";

@tailwind base;
@tailwind components;
@tailwind utilities;
```

Tailwind scans:

- `slides/test/index.html`
- `slides/test/Slides.tsx`
- `slides/test/slides/**/*.{ts,tsx}`
- `slides/test/theme/**/*.{ts,tsx}`

The Affogato font family is available through Tailwind as:

```tsx
className="font-affogato"
```

## Development Flow

`pnpm dev` runs an initial package build, then starts:

- `node scripts/build.mjs --watch`
- `pnpm --filter @presi/slides-test dev`

When files under `library/` change, esbuild rebuilds the workspace package outputs. The test presentation consumes those workspace packages and Vite picks up the latest build.

## Build Outputs

`scripts/build.mjs` bundles library sources with esbuild:

- `library/core/index.ts` to `packages/core/dist/index.js`
- `library/react/index.ts` to `packages/react/dist/index.js`
- `library/server/index.ts` to `packages/server/dist/index.js`
- `library/server/cli.ts` to `packages/server/dist/cli.js`

The script also writes `.d.ts` files for public package types.

## Verification

Run these before committing larger changes:

```sh
pnpm build
pnpm --filter @presi/slides-test build
pnpm --filter @presi/slides-test exec tsc --noEmit
pnpm install --frozen-lockfile
```

The slides build may print a stale Browserslist `caniuse-lite` warning. That warning is unrelated to Presi.

## Current Limitations

- PDF export is not implemented yet.
- `@presi/server` currently supports dev and production SPA builds only.
- `stepIndex` is still named `fragmentIndex` in parts of core internals for historical reasons.
- Public type declarations are currently generated by `scripts/build.mjs` rather than emitted by `tsc`.
