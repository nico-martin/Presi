# Presi

Presi is a presentation framework built as a single npm package from local source.

The core idea is that presentations are normal frontend apps. Presi provides the presentation runtime, React bindings, and a framework-agnostic dev/build server around Vite.

## Packages

This repo is a pnpm workspace for development only.

- The single public package is `presi-js`, built to `packages/presi-js`.
- Core runtime is imported from `presi-js/core`.
- React bindings are imported from `presi-js/react`.
- Server/dev/build APIs are imported from `presi-js/server`.
- `@presi/slides-test` lives in `slides/test` and is the local example presentation app.

Everything under `packages/` is generated build output. Do not edit it manually.

The npm package ships only `dist` and `skills` from `packages/presi-js`. Repository-only files like `AGENTS.md` and the local `slides/` examples are not shipped.

## Commands

Install dependencies:

```sh
pnpm install
```

Create a new React presentation with the single-package CLI:

```sh
npx presi-js create react my-talk
```

Shortcut:

```sh
npx presi-js react my-talk
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

### `presi-js/core`

`presi-js/core` owns the browser presentation runtime.

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

### `presi-js/react`

`presi-js/react` provides React bindings for Presi.

Primary imports:

```tsx
import { Wrapper, Slide, Step, usePresi } from "presi-js/react";
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

`Slide` supports lifecycle callbacks tied to slide visibility:

```tsx
function IntroSlide() {
  return (
    <Slide
      title="Intro"
      onMount={() => console.log("slide active")}
      onUnmount={() => console.log("slide inactive")}
    >
      Hello
    </Slide>
  );
}
```

Internally these callbacks are registered as a step-0 effect. `onUnmount` runs when the slide is no longer active or when the presentation unmounts.

Transitions are opt-in through data attributes. Slides and step elements have no transition by default.

```tsx
<Slide title="Intro" data-transition-out="fade-left">
  <h2 className="fragment" data-step-index="1" data-transition-in="fade-up">
    First point
  </h2>
  <p
    className="fragment"
    data-step-index="1"
    data-transition-in="fade-up"
    data-transition-in-order="2"
  >
    Second point
  </p>
</Slide>
```

Supported transition values:

- `fade`
- `fade-up`
- `fade-left`
- `fade-right`
- `fade-down`
- `fade-grow`
- `fade-up-grow`
- `fade-left-grow`
- `fade-right-grow`
- `fade-down-grow`

All transitions run for `200ms` with `cubic-bezier(.2, .85, .25, 1)`. Multiple elements entering or leaving in the same step are staggered by `100ms` in DOM order. Override order with `data-transition-in-order` or `data-transition-out-order`.

The transition constants and attribute names are exported from `presi-js/core` as `PRESI_TRANSITION_CONFIG`.

Override transition timing or attribute names when creating Presi:

```ts
new Presi(wrapper, {
  transition: {
    duration: 300,
    delay: 75,
    easing: "ease-out",
    attributes: {
      in: "data-enter",
      out: "data-leave",
      inOrder: "data-enter-order",
      outOrder: "data-leave-order",
    },
  },
});
```

React users can pass the same transition options to `Wrapper`:

```tsx
<Wrapper
  aspectRatio="16:9"
  transition={{
    duration: 300,
    delay: 75,
  }}
>
  <Slide title="Intro">Hello</Slide>
</Wrapper>
```

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

### `presi-js/server`

`presi-js/server` provides a framework-agnostic dev/build layer on top of Vite.

It does not know about React, Vue, Svelte, or any specific UI framework. Framework support is passed through Vite plugins in the Presi config.

Supported commands for now:

- `presi-js dev`
- `presi-js build`

PDF export is planned but not implemented yet.

## Presi Server Config

A presentation app can define `presi.config.ts`:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "presi-js/server";

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
import { Wrapper, Slide } from "presi-js/react";

const App = () => (
  <Wrapper aspectRatio="16:9">
    <Slide title="Hello">Hello world</Slide>
  </Wrapper>
);

export default function render(mountElement: HTMLElement) {
  ReactDOM.createRoot(mountElement).render(<App />);
}
```

This keeps `presi-js/server` framework agnostic. Vue, Svelte, Solid, vanilla JS, or any other frontend stack can use the same shape as long as the entry exports a render function.

## Notes

Speaker notes are controlled through a runtime build convention.

`presi-js/server` defines:

```ts
PRESI_INCLUDE_NOTES
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
- `slides/test/theme/Slide.tsx`: themed wrapper around `presi-js/react`'s `Slide`.
- `slides/test/style.css`: defines local variable fonts and Tailwind layers.
- `slides/test/fonts/`: locally hosted variable font files.
- `slides/test/tailwind.config.js`: Tailwind content/theme config.
- `slides/test/postcss.config.js`: enables Tailwind and Autoprefixer.

The app is intentionally a consumer of the built packages:

```tsx
import { Wrapper, Slide } from "presi-js/react";
```

It should behave like an external app using Presi.

## Tailwind And Fonts

The test app imports styles from `slides/test/style.css`:

```css
@font-face {
  font-family: "Nunito Sans";
  src: url("./fonts/NunitoSans-Variable.ttf") format("truetype");
  font-display: block;
}
```

Tailwind scans:

- `slides/test/index.html`
- `slides/test/Slides.tsx`
- `slides/test/slides/**/*.{ts,tsx}`
- `slides/test/theme/**/*.{ts,tsx}`

The test app self-hosts variable fonts under `slides/test/fonts` and references them from `slides/test/style.css` with `font-display: block` to avoid a flash of fallback text.

Available Tailwind font families:

```tsx
className="font-heading" // Nunito variable, headings
className="font-body" // Nunito Sans variable, body text
```

## Development Flow

`pnpm dev` runs an initial package build, then starts:

- `node scripts/build.mjs --watch`
- `pnpm --filter @presi/slides-test dev`

When files under `library/` change, esbuild rebuilds `packages/presi-js`. The test presentation runs through the generated CLI while its Vite config aliases imports back to local source for development.

## Build Outputs

`scripts/build.mjs` bundles library sources with esbuild:

- `library/core/index.ts` to `packages/presi-js/dist/core.js`
- `library/react/index.ts` to `packages/presi-js/dist/react.js`
- `library/server/index.ts` to `packages/presi-js/dist/server.js`
- `library/server/cli.ts` to `packages/presi-js/dist/cli.js`

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
- `presi-js/server` currently supports dev and production SPA builds only.
- `stepIndex` is still named `fragmentIndex` in parts of core internals for historical reasons.
- Public type declarations are currently generated by `scripts/build.mjs` rather than emitted by `tsc`.

## Skills

Consumer-facing skills are authored in root `skills/` and shipped in the npm package under `skills/`.

- `presi-core`: framework-agnostic Presi concepts, config, CLI, steps, notes, and builds.
- `presi-react`: authoring, styling, and debugging React presentations using `presi-js/react`.

`AGENTS.md` is intentionally not part of the package. It is only for contributors working on this repository.
