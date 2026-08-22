import { useState } from "react";
import { Fragment, Step } from "presi-js/react";
import Slide from "../theme/Slide.tsx";

export default function FeatureTourSlide() {
  const [count, setCount] = useState(0);

  return (
    <>
      <Slide
        id="feature-tour"
        title="Presi Feature Tour"
        notes={[
          "Use the arrow keys to move through slides and steps.",
          "Each step advances the counter; after 3 the next slide follows.",
        ]}
        className="bg-slate-50"
        transitionOut="fade-left"
      >
        <div className="grid grid-cols-[1.1fr_0.9fr] gap-8">
          <div className="space-y-5">
            <p className="text-sm font-semibold text-slate-700">
              Builds presentations with React components, URL navigation,
              speaker notes, fragments, and JavaScript-powered steps.
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Current slide
                </p>
                <p className="mt-2 text-xl font-black text-slate-900">
                  Hash routed
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Runtime state
                </p>
                <p className="mt-2 text-xl font-black text-slate-900">
                  Hook driven
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center rounded-3xl bg-slate-900 p-8 text-white shadow-xl">
            <div className="space-y-3 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-cyan-300">
                presi-js
              </p>
              <p className="text-6xl font-black leading-none tabular-nums">
                {count}
              </p>
              <p className="text-sm text-slate-300">
                counted up by one {"<Step />"} per step
              </p>
            </div>
          </div>
        </div>
        {/* One Step per step index: run() fires when the step becomes active,
            the returned cleanup when stepping back — so the counter follows
            navigation in both directions and on deep links. */}
        {[1, 2, 3].map((stepIndex) => (
          <Step
            key={stepIndex}
            stepIndex={stepIndex}
            run={() => {
              setCount((current) => current + 1);
              return () => setCount((current) => current - 1);
            }}
          />
        ))}
      </Slide>
      <Slide
        id="template-big-statement"
        title="Big Statement"
        background={{ color: "#f8fafc" }}
        transitionIn="fade-left"
        transitionOut="fade-left"
      >
        <div className="flex h-full flex-col justify-center gap-2 text-center font-heading text-6xl font-black">
          <p>100% in the browser.</p>
          <Fragment
            as="p"
            className="text-brand"
            stepIndex={1}
            transitionIn="fade-up"
          >
            No server.
          </Fragment>
          {/* No stepIndex: the explicit stepIndex={1} above bumps this
              implicit fragment to step 2. */}
          <Fragment as="p" className="text-blossom" transitionIn="fade-up">
            Airplane mode on.
          </Fragment>
          <Fragment
            as="p"
            className="text-lg font-semibold text-slate-400"
            stepIndex={2}
            transitionOut="fade"
          >
            Press the arrow keys to reveal the last statement.
          </Fragment>
        </div>
      </Slide>
    </>
  );
}
