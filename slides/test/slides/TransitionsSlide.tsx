import { Fragment, type TransitionName } from "presi-js/react";
import Slide from "../theme/Slide.tsx";

const FADES: TransitionName[] = [
  "fade",
  "fade-up",
  "fade-down",
  "fade-left",
  "fade-right",
];

const GROWS: TransitionName[] = [
  "fade-grow",
  "fade-up-grow",
  "fade-down-grow",
  "fade-left-grow",
  "fade-right-grow",
];

export default function TransitionsSlide() {
  return (
    <Slide
      id="transitions"
      title="Every Transition, Typed"
      notes={[
        "Step 1 shows the plain fades, step 2 the growing variants, step 3 pop.",
        "Transition names are TypeScript-checked; a typo fails the build.",
      ]}
      className="bg-white"
      transitionIn="fade-left"
      transitionOut="fade-left"
    >
      <p className="max-w-3xl text-sm text-slate-600">
        <code className="rounded bg-slate-100 px-2 py-1">transitionIn</code> and{" "}
        <code className="rounded bg-slate-100 px-2 py-1">transitionOut</code>{" "}
        take a typed transition name — every tile below animates in with the
        transition it is labeled with.
      </p>
      <div className="grid grid-cols-5 gap-4 text-center">
        {FADES.map((name, index) => (
          <Fragment
            as="div"
            key={name}
            stepIndex={1}
            order={index}
            transitionIn={name}
            className="rounded-2xl bg-sky-100 p-5 text-sky-950 shadow-sm"
          >
            <p className="font-mono text-xs font-bold">{name}</p>
          </Fragment>
        ))}
        {GROWS.map((name, index) => (
          <Fragment
            as="div"
            key={name}
            stepIndex={2}
            order={index}
            transitionIn={name}
            className="rounded-2xl bg-rose-100 p-5 text-rose-950 shadow-sm"
          >
            <p className="font-mono text-xs font-bold">{name}</p>
          </Fragment>
        ))}
      </div>
      <Fragment
        as="div"
        stepIndex={3}
        transitionIn="pop"
        className="mx-auto w-max rounded-full bg-slate-900 px-8 py-3 text-sm font-bold text-white shadow-lg"
      >
        <span className="font-mono">pop</span> — with its own springy easing
      </Fragment>
    </Slide>
  );
}
