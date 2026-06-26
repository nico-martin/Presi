import { Slide, Step, useSlideMount } from "@presi/react";

export default function SlideOne() {
  useSlideMount(() => {
    console.log("hello");

    return () => {
      console.log("cleanup hello");
    };
  });

  return (
    <Slide title="Title" notes={["Das sind meine Notes für die erste Seite"]}>
      <p>Hello</p>
      <p className="fragment" data-step-index="1">
        World 1
      </p>
      <Step stepIndex={2} run={() => console.log("hello from Presi step")} />
      <p className="fragment" data-step-index="3">
        World 2
      </p>
      <p className="fragment" data-step-index="4">
        World 3
      </p>
      <p className="fragment" data-step-index="7">
        World 4
      </p>
      <p className="fragment" data-step-index="7">
        World 5
      </p>
    </Slide>
  );
}
