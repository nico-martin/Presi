import { Fragment } from "presi-js/react";
import Slide from "../theme/Slide.tsx";

export default function FragmentsSlide() {
  return (
    <Slide
      id="fragments"
      title="Fragments and Transitions"
      notes={[
        "Each card is revealed by advancing one step.",
        ">>>",
        "Explain how fragments stay hidden >>> then compare transition styles.",
      ]}
      className="bg-white"
      transitionIn="fade-left"
      transitionOut="fade-left"
    >
      <p className="max-w-3xl text-sm text-slate-600">
        Add <code className="rounded bg-slate-100 px-2 py-1">Fragment</code>
        components and assign step indexes to reveal content at the right
        moment.
      </p>
      <div className="grid grid-cols-3 gap-5">
        <Fragment
          as="div"
          className="rounded-3xl bg-emerald-100 p-6 text-emerald-950 shadow-sm"
          stepIndex={1}
          transitionIn="fade-up-grow"
        >
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
            Step 1
          </p>
          <p className="mt-4 text-xl font-black">Reveal fragments</p>
          <p className="mt-3 text-sm">
            Fragments stay hidden until their step.
          </p>
        </Fragment>
        <Fragment
          as="div"
          className="rounded-3xl bg-cyan-100 p-6 text-cyan-950 shadow-sm"
          stepIndex={2}
          transitionIn="fade-left-grow"
        >
          <p className="text-xs font-bold uppercase tracking-wide text-cyan-700">
            Step 2
          </p>
          <p className="mt-4 text-xl font-black">Choose motion</p>
          <p className="mt-3 text-sm">Transitions are typed props.</p>
        </Fragment>
        <Fragment
          as="div"
          className="rounded-3xl bg-violet-100 p-6 text-violet-950 shadow-sm"
          stepIndex={3}
          transitionIn="pop"
        >
          <p className="text-xs font-bold uppercase tracking-wide text-violet-700">
            Step 3
          </p>
          <p className="mt-4 text-xl font-black">Keep markup simple</p>
          <p className="mt-3 text-sm">
            Plain Tailwind classes work as expected.
          </p>
        </Fragment>
      </div>
    </Slide>
  );
}
