---
name: presi-react
description: Use when authoring, styling, or debugging a React presentation that uses Presi via presi-js/react.
---

# Presi React

Use this skill when working in a React presentation app that consumes Presi. Do not use it for modifying Presi's own library source.

Use the public React subpath:

```tsx
import { Wrapper, Slide, Step, usePresi } from "presi-js/react";
```

Do not import from `@presi/react`, `presi-js/dist/*`, `library/*`, or `packages/*`.

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
  ReactDOM.createRoot(mountElement).render(<App />);
}
```

## Wrapper

`Wrapper` owns the Presi runtime instance for the rendered presentation.

```tsx
<Wrapper aspectRatio="16:9">
  <Slide title="Intro">Hello</Slide>
</Wrapper>
```

Everything that needs `usePresi` must render inside `Wrapper`.

## Slide

`Slide` renders the actual slide `<section>` and forwards `className` to that slide surface.

```tsx
<Slide title="Intro" className="space-y-6 p-10">
  <p>Initial content</p>
</Slide>
```

Recommended theme wrapper:

```tsx
import { Slide as PresiSlide } from "presi-js/react";
import type { ReactNode } from "react";

export default function Slide({ children, title = "", notes }: {
  children: ReactNode;
  title?: string;
  notes?: string[];
}) {
  return (
    <PresiSlide className="space-y-6 p-10" title={title} notes={notes}>
      {Boolean(title) && <h1 className="font-heading text-5xl">{title}</h1>}
      {children}
    </PresiSlide>
  );
}
```

## Fragments

Fragments are normal elements with the `fragment` class.

```tsx
<p className="fragment" data-step-index="1">
  Appears on step 1
</p>
```

Multiple fragments can share a step:

```tsx
<p className="fragment" data-step-index="2">A</p>
<p className="fragment" data-step-index="2">B</p>
```

## Transitions

Transitions are opt-in. Add `data-transition-in` or `data-transition-out` to slides or step elements.

```tsx
<Slide title="Intro" data-transition-out="fade-left">
  <p className="fragment" data-step-index="1" data-transition-in="fade-up">
    First point
  </p>
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

Supported values are `fade`, `fade-up`, `fade-left`, `fade-right`, `fade-down`, `fade-grow`, `fade-up-grow`, `fade-left-grow`, `fade-right-grow`, and `fade-down-grow`.

Use `data-transition-in-order` or `data-transition-out-order` to override the default DOM-order stagger.

Customize timing or attribute names on `Wrapper` with `transition={{ duration, delay, easing, attributes }}`.

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

Cleanup runs when the step is no longer active or when the presentation unmounts.

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
const { slideIndex, stepIndex, totalSlides, totalSteps, currentSlide } = usePresi();
```

Indexes are zero-based.

## Notes

Use the `notes` prop:

```tsx
<Slide title="Intro" notes={["Mention the goal", "Pause here"]}>
  Hello
</Slide>
```

Notes render in dev by default and are omitted from production builds by default.
