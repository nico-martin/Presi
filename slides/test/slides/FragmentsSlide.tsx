import Slide from "../theme/Slide.tsx";

export default function FragmentsSlide() {
  return (
    <Slide
      id="fragments"
      title="Fragments and Transitions"
      notes={["Each card is revealed by advancing one step."]}
      className="bg-white"
      data-transition-out="fade-left"
    >
      <p className="max-w-3xl text-sm text-slate-600">
        Add <code className="rounded bg-slate-100 px-2 py-1">fragment</code>
        elements and assign step indexes to reveal content at the right moment.
      </p>
      <div className="grid grid-cols-3 gap-5">
        <div
          className="fragment rounded-3xl bg-emerald-100 p-6 text-emerald-950 shadow-sm"
          data-step-index="1"
          data-transition-in="fade-up-grow"
        >
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
            Step 1
          </p>
          <p className="mt-4 text-xl font-black">Reveal fragments</p>
          <p className="mt-3 text-sm">
            Fragments stay hidden until their step.
          </p>
        </div>
        <div
          className="fragment rounded-3xl bg-cyan-100 p-6 text-cyan-950 shadow-sm"
          data-step-index="2"
          data-transition-in="fade-left-grow"
        >
          <p className="text-xs font-bold uppercase tracking-wide text-cyan-700">
            Step 2
          </p>
          <p className="mt-4 text-xl font-black">Choose motion</p>
          <p className="mt-3 text-sm">Transitions are declared in the DOM.</p>
        </div>
        <div
          className="fragment rounded-3xl bg-violet-100 p-6 text-violet-950 shadow-sm"
          data-step-index="3"
          data-transition-in="pop"
        >
          <p className="text-xs font-bold uppercase tracking-wide text-violet-700">
            Step 3
          </p>
          <p className="mt-4 text-xl font-black">Keep markup simple</p>
          <p className="mt-3 text-sm">
            Plain Tailwind classes work as expected.
          </p>
        </div>
      </div>
    </Slide>
  );
}
