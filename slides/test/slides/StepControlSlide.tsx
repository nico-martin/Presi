import { Step } from "presi-js/react";
import Slide from "../theme/Slide.tsx";

export default function StepControlSlide() {
  return (
    <Slide
      title="One Step Can Control Many Things"
      notes={["The first row appears together, then the second row appears."]}
      className="bg-amber-50"
      data-transition-out="fade-left"
    >
      <div className="grid grid-cols-2 gap-5 text-sm font-bold text-slate-900">
        {["Fragments", "Ordering", "Effects", "Cleanup"].map((label, index) => (
          <div
            key={label}
            className="fragment rounded-2xl border-2 border-amber-200 bg-white p-6 shadow-sm"
            data-step-index={index < 2 ? 1 : 2}
            data-transition-in="fade-up-grow"
            data-transition-in-order={index % 2}
          >
            <p className="text-xs uppercase tracking-wide text-amber-600">
              {index < 2 ? "Grouped step 1" : "Grouped step 2"}
            </p>
            <p className="mt-3 text-xl font-black">{label}</p>
          </div>
        ))}
      </div>
      <Step
        stepIndex={3}
        run={() => {
          console.log("Presi JavaScript step mounted");
          return () => console.log("Presi JavaScript step cleaned up");
        }}
      />
      <p
        className="fragment rounded-2xl bg-slate-900 p-5 text-sm font-semibold text-white"
        data-step-index="3"
        data-transition-in="pop"
      >
        Step 3 also runs a JavaScript effect. Check the console to see mount and
        cleanup logs.
      </p>
    </Slide>
  );
}
