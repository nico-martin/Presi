import Slide from "../theme/Slide.tsx";

export default function FeatureTourSlide() {
  return (
    <Slide
      id="feature-tour"
      title="Presi Feature Tour"
      notes={["Use the arrow keys to move through slides and steps."]}
      className="bg-slate-50"
      data-transition-out="fade-left"
    >
      <div className="grid grid-cols-[1.1fr_0.9fr] gap-8">
        <div className="space-y-5">
          <p className="text-sm font-semibold text-slate-700">
            Builds presentations with React components, URL navigation, speaker
            notes, fragments, and JavaScript-powered steps.
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
            <p className="text-xl font-black leading-none">React slides</p>
            <p className="text-sm text-slate-300">with progressive steps</p>
          </div>
        </div>
      </div>
    </Slide>
  );
}
