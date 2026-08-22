import { Fragment, Step } from "presi-js/react";
import Slide from "../theme/Slide.tsx";

export default function StepControlSlide() {
  return (
    <Slide
      id="step-control"
      title="One Step Can Control Many Things"
      notes={["The first row appears together, then the second row appears."]}
      className="bg-amber-50"
      transitionOut="fade-left"
    >
      <div className="grid grid-cols-2 gap-5 text-sm font-bold text-slate-900">
        {["Fragments", "Ordering", "Effects", "Cleanup"].map((label, index) => (
          <Fragment
            as="div"
            key={label}
            className="rounded-2xl border-2 border-amber-200 bg-white p-6 shadow-sm"
            stepIndex={index < 2 ? 1 : 2}
            transitionIn="fade-up-grow"
            order={index % 2}
          >
            <p className="text-xs uppercase tracking-wide text-amber-600">
              {index < 2 ? "Grouped step 1" : "Grouped step 2"}
            </p>
            <p className="mt-3 text-xl font-black">{label}</p>
          </Fragment>
        ))}
      </div>
      <Step
        stepIndex={3}
        run={() => {
          console.log("Presi JavaScript step mounted");
          return () => console.log("Presi JavaScript step cleaned up");
        }}
      />
      <Fragment
        as="p"
        className="rounded-2xl bg-slate-900 p-5 text-sm font-semibold text-white"
        stepIndex={3}
        transitionIn="pop"
      >
        Step 3 also runs a JavaScript effect. Check the console to see mount and
        cleanup logs.
      </Fragment>
    </Slide>
  );
}
