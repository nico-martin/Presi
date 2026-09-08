import { Fragment, Step } from "presi-js/react";
import Slide from "../theme/Slide.tsx";

// The second row carries the lower `order` values, so it animates in before
// the first row even though it comes later in the DOM.
const cards = [
  { label: "Fragments", order: 2 },
  { label: "Ordering", order: 3 },
  { label: "Effects", order: 0 },
  { label: "Cleanup", order: 1 },
];

export default function StepControlSlide() {
  return (
    <Slide
      id="step-control"
      title="One Step Can Control Many Things"
      notes={[
        "All four cards share step 1; the order prop reveals the bottom row first.",
        "Step 2 runs a JavaScript effect alongside a fragment.",
      ]}
      className="bg-amber-50"
      transitionIn="fade-left"
      transitionOut="fade-left"
    >
      <p className="max-w-3xl text-sm text-slate-600">
        One step reveals all four cards. The{" "}
        <code className="rounded bg-amber-100 px-2 py-1">order</code> prop
        overrides DOM order, so the bottom row animates in first.
      </p>
      <div className="grid grid-cols-2 gap-5 text-sm font-bold text-slate-900">
        {cards.map(({ label, order }) => (
          <Fragment
            as="div"
            key={label}
            className="rounded-2xl border-2 border-amber-200 bg-white p-6 shadow-sm"
            stepIndex={1}
            transitionIn="fade-up-grow"
            order={order}
          >
            <p className="text-xs uppercase tracking-wide text-amber-600">
              order {order}
            </p>
            <p className="mt-3 text-xl font-black">{label}</p>
          </Fragment>
        ))}
      </div>
      <Step
        stepIndex={2}
        run={() => {
          console.log("Presi JavaScript step mounted");
          return (context) =>
            console.log("Presi JavaScript step cleaned up", context);
        }}
      />
      <Fragment
        as="p"
        className="rounded-2xl bg-slate-900 p-5 text-sm font-semibold text-white"
        stepIndex={2}
        transitionIn="pop"
      >
        Step 2 also runs a JavaScript effect. Check the console to see mount and
        cleanup logs.
      </Fragment>
    </Slide>
  );
}
