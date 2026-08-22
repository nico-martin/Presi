---
name: presi-react
description: Use when authoring, styling, or debugging a React presentation that uses Presi via presi-js/react.
---

# Presi React

Use this skill when working in a React presentation app that consumes Presi. Do not use it for modifying Presi's own library source.

Use the public React subpath:

```tsx
import { Wrapper, Slide, Fragment, Step, usePresi } from "presi-js/react";
```

Do not import from `@presi/react`, `presi-js/core`, `presi-js/dist/*`, `library/*`, or `packages/*`.

## Entry File

A React presentation entry should default-export a render function:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { Wrapper } from "presi-js/react";
import Slide from "./theme/Slide";
import "./style.css";

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

## Wrapper

`Wrapper` owns the Presi runtime for the rendered presentation.

```tsx
<Wrapper aspectRatio="16:9">
  <Slide title="Intro">Hello</Slide>
</Wrapper>
```

Everything that needs `usePresi` must render inside `Wrapper`. Non-slide children (overlays, progress indicators) are allowed anywhere inside it.

## Slide

`Slide` renders the actual slide `<section>` and forwards `className` to that slide surface.

```tsx
<Slide id="intro" title="Intro" className="space-y-6 p-10">
  <p>Initial content</p>
</Slide>
```

Use a stable, unique, non-numeric `id` on each authored slide. Presi forwards it to the underlying `<section>` and accepts it in the hash route:

```txt
/#/intro/0
/#/intro/2
```

This route remains valid when slides are reordered. Existing zero-based numeric routes such as `/#/0/2` remain supported.

## Backgrounds

Use `background` when a slide has a color or image background that should remain visually separate from its content:

```tsx
<Slide background={{ color: "#15171c" }}>Dark slide</Slide>
<Slide background={{ image: landscape, className: "bg-left" }}>
  Image slide
</Slide>
<Slide background={{ style: { backgroundSize: "contain" } }}>
  Custom background
</Slide>
```

When the slide has `transitionIn` or `transitionOut`, Presi always fades this background and applies the selected transition to the content. Slides without `background` retain whole-slide transitions.

Recommended theme wrapper:

```tsx
import { Slide as PresiSlide } from "presi-js/react";
import type { ComponentProps, ReactNode } from "react";

type ThemeSlideProps = Omit<ComponentProps<typeof PresiSlide>, "children"> & {
  children: ReactNode;
};

export default function Slide({ children, title = "", ...props }: ThemeSlideProps) {
  return (
    <PresiSlide className="space-y-6 p-10" title={title} {...props}>
      {Boolean(title) && <h1 className="font-heading text-5xl">{title}</h1>}
      {children}
    </PresiSlide>
  );
}
```

## Fragments

Fragments are typed components that render a normal DOM element chosen with `as` (default `span`). All native props of that element are typed and forwarded.

```tsx
<Fragment as="p" transitionIn="fade-up">
  Appears on the next implicit step
</Fragment>
<Fragment as="a" href="https://example.com" transitionIn="pop" stepIndex={2}>
  Appears on step 2
</Fragment>
```

Step semantics:

- `stepIndex` omitted: the fragment takes the next implicit step (hidden until its step).
- `stepIndex={0}`: visible from slide start; `transitionIn` animates it together with the slide entrance.
- `transitionOut` without `transitionIn`: an out element — visible from slide start, hidden once its `stepIndex` is reached (or, without a `stepIndex`, it stays visible and only animates out when leaving the slide).
- An explicit `stepIndex` bumps the implicit counter: after `stepIndex={5}`, the next implicit fragment is step 6.

Fragments remain in document flow before they appear. Presi uses `opacity: 0`, not `display: none`, so revealing one does not change the layout. Do not add Tailwind's `hidden` utility to a fragment unless removing it from layout is intentional.

Multiple fragments can share a step:

```tsx
<Fragment as="p" stepIndex={2}>A</Fragment>
<Fragment as="p" stepIndex={2}>B</Fragment>
```

To reveal a custom component as one fragment, wrap it in a `Fragment` (the default `span` works; use `as="div"` for block content):

```tsx
<Fragment as="div" transitionIn="fade-up" stepIndex={1}>
  <MyChart />
</Fragment>
```

## Transitions

Transitions are opt-in, typed props on `Slide` and `Fragment`: `transitionIn` and `transitionOut`.

```tsx
<Slide title="Intro" transitionOut="fade-left">
  <Fragment as="p" stepIndex={1} transitionIn="fade-up">
    First point
  </Fragment>
  <Fragment as="p" stepIndex={1} transitionIn="fade-up" order={2}>
    Second point
  </Fragment>
</Slide>
```

`TransitionName` values are `fade`, `fade-up`, `fade-left`, `fade-right`, `fade-down`, `fade-grow`, `fade-up-grow`, `fade-left-grow`, `fade-right-grow`, `fade-down-grow`, and `pop`. Invalid names are TypeScript errors.

Use `order` to override the default DOM-order stagger within a step.

Customize timing on `Wrapper` with `transition={{ duration, delay, inDelay, easing }}`.

Navigation is instant: advancing always updates the URL state immediately, and navigating faster than the transitions simply cuts them short — the deck never lags behind the URL. Holding a navigation key fast-forwards through the deck.

Use `inDelay` to stage the animations: in-transitions start `inDelay` milliseconds after the out-transitions begin, while incoming elements are held invisible. With `duration: 800` and `inDelay: 400`, the old slide is half flown out when the next one starts flying in. The default is `0` (in and out run together). The outgoing slide stays visible underneath the incoming slide until its out-transition finishes.

```tsx
<Wrapper aspectRatio="16:9" transition={{ duration: 800, inDelay: 400 }}>
  {slides}
</Wrapper>
```

## Agent Visual Check

When authoring or revising a slide, inspect the slide file's `id` and open its exact state without calculating its position in the deck:

```txt
http://localhost:3000/?presi-static#/intro/2
```

The query string must appear before the hash. `presi-static` disables Presi transitions and CSS animations or transitions inside the wrapper, while fragments and JavaScript steps still resolve to step `2`. After the page and local fonts are ready, capture a screenshot and inspect it. Use the normal `/#/intro/2` route separately when validating motion.

If a slide has no ID, add a short kebab-case ID based on its purpose. Do not derive its numeric index by searching the deck entry because that index changes when slides are reordered.

## JavaScript Steps

Use `Step` to run JavaScript at a specific step.

```tsx
<Step stepIndex={2} run={() => console.log("hello")} />
```

The callback may return cleanup:

```tsx
<Step
  stepIndex={2}
  run={() => {
    const controller = startSomething();
    return () => controller.stop();
  }}
/>
```

Cleanup runs when the step is no longer active or when the presentation unmounts. Omitting `stepIndex` assigns the next implicit step, based on the component's position in the slide.

## Slide Lifecycle Effects

Use `onMount` and `onUnmount` on `Slide` for step-0 effects tied to slide visibility.

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

Rules:

- `onMount` runs when the slide becomes active.
- `onUnmount` runs when the slide is no longer active or when the presentation unmounts.
- Do not use React `useEffect` for slide lifecycle; the whole deck mounts at once.

## Presentation State

Use `usePresi` for current state UI.

```tsx
const { slideIndex, stepIndex, totalSlides, totalSteps, currentSlide } =
  usePresi();
```

Indexes are zero-based. Only components calling `usePresi` re-render on navigation; slides themselves do not.

## Notes

Use the `notes` prop:

```tsx
<Slide title="Intro" notes={["Mention the goal", "Pause here"]}>
  Hello
</Slide>
```

Notes render in the speaker view (press `S`) in dev by default and are omitted from production builds by default.
