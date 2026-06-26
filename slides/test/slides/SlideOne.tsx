import { Step, useSlideMount } from "@presi/react";
import Slide from "../theme/Slide.tsx";

export default function SlideOne() {
  useSlideMount(() => {
    console.log("hello");

    return () => {
      console.log("cleanup hello");
    };
  });

  return (
    <Slide title="Title" notes={["Das sind meine Notes für die erste Seite"]}>
      <p className="fragment font-bold text-emerald-600" data-step-index="1">
        World 1
      </p>
      <Step stepIndex={2} run={() => console.log("hello from Presi step")} />
      <p className="fragment font-medium" data-step-index="3">
        World 2
      </p>
      <p className="fragment  font-light" data-step-index="4">
        World 3
      </p>
      <p className="fragment font-black" data-step-index="7">
        World 4
      </p>
      <p className="fragment  font-black" data-step-index="7">
        World 5
      </p>
    </Slide>
  );
}
