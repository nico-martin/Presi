import { Step } from "presi-js/react";
import Slide from "../theme/Slide.tsx";

export default function SlideOne() {
  return (
    <>
      <Slide
        title="Slide 1"
        notes={["Das sind meine Notes für die erste Seite"]}
        data-transition-out="fade-left"
        onMount={() => console.log("hello")}
        onUnmount={() => console.log("cleanup hello")}
      >
        <p
          className="fragment font-bold text-emerald-600"
          data-step-index="1"
          data-transition-in="fade-up"
        >
          World 1
        </p>
        <Step stepIndex={2} run={() => console.log("hello from Presi step")} />
        <p
          className="fragment font-medium"
          data-step-index="3"
          data-transition-in="fade-left-grow"
        >
          World 2
        </p>
        <p
          className="fragment  font-light"
          data-step-index="4"
          data-transition-in="fade-right"
        >
          World 3
        </p>
        <p
          className="fragment font-black"
          data-step-index="7"
          data-transition-in="fade-up-grow"
        >
          World 4
        </p>
        <p
          className="fragment  font-black"
          data-step-index="7"
          data-transition-in="fade-up-grow"
          data-transition-in-order="0"
        >
          World 5
        </p>
      </Slide>
      <Slide
        title="Slide 1 all"
        notes={["Das sind meine Notes für die erste Seite"]}
        data-transition-out="fade-left"
      >
        <p className="font-bold text-emerald-600" data-transition-in="fade-up">
          World 1
        </p>
        <Step stepIndex={2} run={() => console.log("hello from Presi step")} />
        <p className="font-medium" data-transition-in="fade-left-grow">
          World 2
        </p>
        <p className="  font-light" data-transition-in="fade-right">
          World 3
        </p>
        <p className=" font-black" data-transition-in="fade-up-grow">
          World 4
        </p>
        <p
          className="  font-black"
          data-transition-in="fade-up-grow"
          data-transition-in-order="0"
        >
          World 5
        </p>
      </Slide>
    </>
  );
}
