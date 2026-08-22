import { useState } from "react";
import { Step } from "presi-js/react";
import Slide from "../theme/Slide.tsx";

const stops = ["Idea", "Prototype", "Test", "Ship"];

// Steps are plain JavaScript: each one moves React state, and CSS transitions
// animate the rocket across the track — in both directions.
export default function JourneySlide() {
  const [stop, setStop] = useState(0);
  const progress = (stop / (stops.length - 1)) * 75;

  return (
    <Slide
      id="journey"
      title="Steps Can Drive Anything"
      notes={[
        "Each step moves the rocket one stop further; going back moves it back.",
        "The motion is plain React state plus CSS transitions.",
      ]}
      className="bg-white"
      transitionIn="fade-left"
    >
      <p className="max-w-3xl text-sm text-slate-600">
        Steps are not limited to revealing fragments. Here every{" "}
        <code className="rounded bg-slate-100 px-2 py-1">{"<Step />"}</code>{" "}
        moves React state one stop further and CSS transitions animate the
        rocket — backwards navigation moves it back.
      </p>
      {/* !mt-* because the theme's space-y-6 sibling selector outranks a
          plain mt-* utility */}
      <div className="relative !mt-24">
        <div
          className="absolute top-2.5 h-2 rounded-full bg-slate-200"
          style={{ left: "12.5%", right: "12.5%" }}
        />
        <div
          className="absolute top-2.5 h-2 rounded-full bg-cyan-500 transition-all duration-700"
          style={{ left: "12.5%", width: `${progress}%` }}
        />
        <div
          data-rocket
          className="absolute -top-14 z-10 -translate-x-1/2 text-6xl transition-all duration-700"
          style={{ left: `${12.5 + progress}%` }}
        >
          🚀
        </div>
        <div className="relative grid grid-cols-4">
          {stops.map((label, index) => (
            <div key={label} className="flex flex-col items-center gap-3">
              <div
                className={`h-7 w-7 rounded-full border-4 transition-colors duration-500 ${
                  index <= stop
                    ? "border-cyan-500 bg-cyan-100"
                    : "border-slate-300 bg-white"
                }`}
              />
              <p
                className={`text-sm font-bold transition-colors duration-500 ${
                  index <= stop ? "text-slate-900" : "text-slate-400"
                }`}
              >
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
      {[1, 2, 3].map((stepIndex) => (
        <Step
          key={stepIndex}
          stepIndex={stepIndex}
          run={() => {
            setStop((current) => current + 1);
            return () => setStop((current) => current - 1);
          }}
        />
      ))}
    </Slide>
  );
}
