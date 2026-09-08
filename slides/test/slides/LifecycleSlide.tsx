import { useRef, useState } from "react";
import { Slide } from "presi-js/react";

// Uses the raw Slide (no theme wrapper) to show onMount/onUnmount lifecycle
// effects and a custom background.style.
export default function LifecycleSlide() {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<number | null>(null);

  return (
    <Slide
      id="lifecycle"
      title="Slide Lifecycle"
      notes={[
        "The timer runs only while this slide is active.",
        "Leaving the slide clears the interval and resets the counter.",
      ]}
      background={{
        style: {
          backgroundImage: "linear-gradient(135deg, #0f172a, #1e3a8a)",
        },
      }}
      transitionIn="fade-left"
      onMount={(context) => {
        console.log("Presi slide mounted", context);
        intervalRef.current = window.setInterval(
          () => setSeconds((current) => current + 1),
          1000,
        );
      }}
      onUnmount={(context) => {
        console.log("Presi slide unmounted", context);
        intervalRef.current !== null && clearInterval(intervalRef.current);
        intervalRef.current = null;
        setSeconds(0);
      }}
      className="flex h-full flex-col items-center justify-center gap-5 p-10 font-sans text-white"
    >
      <p className="text-xs font-bold uppercase tracking-[0.35em] text-sky-300">
        onMount / onUnmount
      </p>
      <p className="font-heading text-8xl font-black tabular-nums">
        {seconds}s
      </p>
      <p className="max-w-xl text-center text-sm text-slate-300">
        This timer starts when the slide becomes active and resets when you
        leave it. The gradient behind it is a custom{" "}
        <code className="rounded bg-white/10 px-2 py-1">background.style</code>,
        which fades independently of the content transition.
      </p>
    </Slide>
  );
}
