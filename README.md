# Presi

Presi is a presentation framework built as a single npm package from local source.

The core idea is that presentations are normal frontend apps. Presi is React-first: slides, fragments, and transitions are typed React components, backed by a dev/build/export server around Vite.

## Packages

This repo is a pnpm workspace for development only.

- The single public package is `presi-js`, built to `packages/presi-js`.
- React bindings are imported from `presi-js/react` (the package root re-exports the same API).
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

Type-check the workspace:

```sh
npx tsc --noEmit
```

## Architecture

### `presi-js/react`

`presi-js/react` is the presentation runtime and the authoring API in one. React components register themselves (slides, fragments, JavaScript steps) into a deck store; an imperative engine drives visibility and Web Animations API transitions on the registered elements. There is no DOM scanning and no separate core runtime.

Responsibilities:

- Builds a per-slide timeline of steps from registered components.
- Handles hash navigation like `/#/0/2` and `/#/intro/2`.
- Handles keyboard navigation and fullscreen shortcuts.
- Shows and hides slides and fragments.
- Runs JS step effects and their cleanup functions.
- Exposes state via `usePresi` (`useSyncExternalStore`-backed; only consumers re-render on navigation).
- Opens the speaker view (`S`).

Important concepts:

- `slideIndex` and `stepIndex` are zero-based; step `0` is the initial state of a slide.
- All slides render upfront, so assets preload and the whole deck's step map is known.
- Unrevealed fragments remain in document flow with `opacity: 0` to prevent layout shifts.

Primary imports:

```tsx
import { Wrapper, Slide, Fragment, Step, usePresi } from "presi-js/react";
```

`Wrapper` owns the deck:

```tsx
<Wrapper aspectRatio="16:9">
  <Slide title="Intro">Hello</Slide>
</Wrapper>
```

`Slide` renders a slide `<section>`:

```tsx
<Slide id="intro" title="Intro" className="p-8">
  <p>Hello</p>
</Slide>
```

`className` is forwarded to the actual slide surface. `id` is optional, must be unique and non-numeric, and makes the slide addressable in the hash route.

Define a color or image background with the `background` prop:

```tsx
<Slide background={{ color: "#15171c" }}>Dark slide</Slide>
<Slide background={{ image: landscape, className: "bg-left" }}>
  Image slide
</Slide>
<Slide background={{ style: { backgroundSize: "contain" } }}>
  Custom background
</Slide>
```

When the slide has a transition, Presi always fades the background while applying the selected transition to the slide content. Slides without `background` keep the standard whole-slide transition behavior.

Fragments are typed polymorphic components — `as` picks the DOM element (default `span`) and all of that element's native props are typed:

```tsx
<Slide title="Fragments">
  <Fragment as="p" stepIndex={1} transitionIn="fade-up">
    First fragment
  </Fragment>
  <Fragment as="p" stepIndex={2} transitionIn="fade-up">
    Second fragment
  </Fragment>
</Slide>
```

Step semantics:

- `stepIndex` omitted: the fragment takes the next implicit step.
- `stepIndex={0}`: visible from slide start, animating in with the slide entrance.
- `transitionOut` without `transitionIn`: an out element — visible from slide start, hidden once its `stepIndex` is reached (without a `stepIndex` it only animates out when leaving the slide).
- An explicit `stepIndex` bumps the implicit counter.

`Step` runs JS at a specific step:

```tsx
<Slide title="JS Step">
  <Fragment as="p" stepIndex={1}>
    First fragment
  </Fragment>
  <Step stepIndex={2} run={() => console.log("hello")} />
  <Fragment as="p" stepIndex={3}>
    Second fragment
  </Fragment>
</Slide>
```

`Slide` supports lifecycle callbacks tied to slide visibility:

```tsx
function IntroSlide() {
  return (
    <Slide
      title="Intro"
      onMount={({ direction, reason }) =>
        console.log("slide active", { direction, reason })
      }
      onUnmount={({ direction, reason }) =>
        console.log("slide inactive", { direction, reason })
      }
    >
      Hello
    </Slide>
  );
}
```

Internally these callbacks are registered as a step-0 effect. `onMount` receives `reason: "initial"` with `direction: null` for the initially opened slide, or the `"forward"`/`"backward"` navigation direction. `onUnmount` receives the navigation direction when leaving the slide, or `reason: "unmount"` with `direction: null` when the presentation unmounts.

Transitions are opt-in typed props. Slides and fragments have no transition by default.

```tsx
<Slide title="Intro" transitionOut="fade-left">
  <Fragment as="h2" stepIndex={1} transitionIn="fade-up">
    First point
  </Fragment>
  <Fragment as="p" stepIndex={1} transitionIn="fade-up" order={2}>
    Second point
  </Fragment>
</Slide>
```

Supported `TransitionName` values:

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
- `pop`

Invalid names are TypeScript errors. Multiple elements entering or leaving in the same step are staggered in DOM order; override with the `order` prop. The transition keyframes are exported from `presi-js/react` as `TRANSITIONS`.

Override transition timing on `Wrapper`:

```tsx
<Wrapper
  aspectRatio="16:9"
  transition={{
    duration: 800,
    delay: 300,
    inDelay: 400,
  }}
>
  <Slide title="Intro">Hello</Slide>
</Wrapper>
```

Navigation is instant: advancing always updates the URL state immediately, and navigating faster than the transitions simply cuts them short — the deck never lags behind the URL. Holding a navigation key fast-forwards through the deck (repeats every 100ms after 400ms).

`inDelay` stages the animations without delaying navigation: in-transitions start `inDelay` milliseconds after the out-transitions begin, and incoming elements are held invisible until then. With `duration: 800` and `inDelay: 400`, the old slide is half flown out when the next one starts flying in. The default is `0`, which runs in- and out-transitions together. The outgoing slide stays visible underneath the incoming slide until its out-transition finishes.

`Wrapper` also accepts `calculateFontSize` to control the root font size that all `rem`-based slide styling scales from (default: `window.innerWidth / 48`).

`usePresi` exposes presentation and render state:

```tsx
const {
  isExporting,
  slideIndex,
  stepIndex,
  totalSlides,
  totalSteps,
  currentSlide,
} = usePresi();
```

Current shape:

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

`isExporting` is `true` while Presi is rendering any export mode. Use it to
replace interactive content with an informative static preview. It remains
`false` in the web presentation, including `presi-static` screenshot mode.

### `presi-js/server`

`presi-js/server` provides the dev/build/present/export layer on top of Vite.

Supported commands:

- `presi-js dev`
- `presi-js build`
- `presi-js present`
- `presi-js export`
- `presi-js export --mode=transcript`
- `presi-js export --mode=notes`

Export modes:

- `pdf` is the default and preserves the existing output: one PDF page per
  slide step.
- `transcript` writes an A4 PDF with one page per slide. Each page contains the
  slide's final step followed by its notes.
- `notes` writes a Markdown document containing every slide's notes under a
  level-two heading.

With `export.file: "deck.pdf"`, the outputs are `deck.pdf`,
`deck.transcript.pdf`, and `deck.notes.md`. The export build includes notes and
disables transitions in all modes.

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
- `dev.includeNotes`: whether notes are available in dev.
- `present.port` / `present.host`: static presentation server.
- `export.file`: default PDF output path and filename stem for alternate modes.
- `build.outDir`: production output directory.
- `build.includeNotes`: whether notes are available in production.

If no `index.html` exists, Presi generates a default HTML shell with:

```html
<div id="presi"></div>
```

The default resolver is:

```ts
() => document.getElementById("presi");
```

If a presentation provides its own `index.html`, Presi preserves it.

## Presentation Entry

The presentation entry should default-export a render function that returns a cleanup function:

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
  const root = ReactDOM.createRoot(mountElement);
  root.render(<App />);

  return () => root.unmount();
}
```

## Notes

Speaker notes are controlled through a runtime build convention.

`presi-js/server` defines:

```ts
PRESI_INCLUDE_NOTES;
```

By default:

- Dev builds include notes.
- Production builds exclude notes.

Notes are passed as data and shown in the speaker view (press `S`); they are not rendered into the slide DOM:

```tsx
<Slide title="Intro" notes={["Speaker note"]}>
  Hello
</Slide>
```

Use `>>>` to mark when to advance to the next fragment or step. It renders as
an inline cue inside a note, or as a divider when used as its own note:

```tsx
<Slide
  title="Intro"
  notes={["Introduce the topic >>> then explain the example", ">>>", "Wrap up"]}
>
  Hello
</Slide>
```

Use `[DEMO]` as its own note to render a demo divider. Instructions can follow
the marker name, for example `"[DEMO explain how it works]"`.

Notes support limited inline Markdown for `**bold**`, `*italic*`, and
`~~strikethrough~~` text. Other Markdown syntax is left unchanged.

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
import { Wrapper, Slide, Fragment } from "presi-js/react";
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
className = "font-heading"; // Nunito variable, headings
className = "font-body"; // Nunito Sans variable, body text
```

## Development Flow

`pnpm dev` runs an initial package build, then starts:

- `node scripts/build.mjs --watch`
- `pnpm --filter @presi/slides-test dev`

When files under `library/` change, esbuild rebuilds `packages/presi-js`. The test presentation runs through the generated CLI while its Vite config aliases `presi-js/react` back to local source for development.

## Build Outputs

`scripts/build.mjs` bundles library sources with esbuild:

- `library/react/index.ts` to `packages/presi-js/dist/react.js`
- `library/server/index.ts` to `packages/presi-js/dist/server.js`
- `library/server/cli.ts` to `packages/presi-js/dist/cli.js`

`dist/index.js` re-exports `dist/react.js` so `presi-js` and `presi-js/react` share one module instance. The script also writes `.d.ts` files for public package types.

## Verification

Run these before committing larger changes:

```sh
pnpm build
pnpm --filter @presi/slides-test build
npx tsc --noEmit
pnpm install --frozen-lockfile
```

The slides build may print a stale Browserslist `caniuse-lite` warning. That warning is unrelated to Presi.

## Current Limitations

- `presi-js/server` currently supports dev, production SPA builds, present, and PDF export.
- Public type declarations are currently generated by `scripts/build.mjs` rather than emitted by `tsc`.

## Skills

Consumer-facing skills are authored in root `skills/` and shipped in the npm package under `skills/`.

- `presi-core`: project-level Presi concepts, config, CLI, routing, notes, and builds.
- `presi-react`: authoring, styling, and debugging React presentations using `presi-js/react`.

`AGENTS.md` is intentionally not part of the package. It is only for contributors working on this repository.
