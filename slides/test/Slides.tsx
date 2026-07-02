import React from "react";
import ReactDOM from "react-dom/client";
import SlideOne from "./slides/SlideOne.tsx";
import TypographySlide from "./slides/TypographySlide.tsx";
import "./style.css";

import { Wrapper, usePresi } from "presi-js/react";
import Slide from "./theme/Slide.tsx";

function Bkg() {
  const { slideIndex, currentSlide, stepIndex, totalSteps, totalSlides } =
    usePresi();

  return (
    <div className="absolute bottom-3 right-3 rounded-full bg-black/80 px-4 py-2 text-xs font-medium text-white shadow-lg">
      <p className="tabular-nums">
        {slideIndex + 1}/{totalSlides} ({stepIndex + 1}/{totalSteps}) -{" "}
        {currentSlide.title}
      </p>
    </div>
  );
}

const App: React.FC = () => (
  <Wrapper aspectRatio="16:9">
    <SlideOne />
    <TypographySlide />
    <Slide
      title="Slide 1"
      notes={[
        "Das sind meine Notes für die zweite Seite",
        "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua.",
        "At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet",
        "At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet",
        "At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet",
        "At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet",
        "At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet",
        "At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet",
        "At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet",
        "At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet",
        "At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet",
        "At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet",
        "At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet",
        "At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet",
        "At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet",
        "At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet",
        "At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet",
      ]}
    >
      <p className="text-7xl font-black tracking-tight text-blue-700">
        LoremIpsum
      </p>
    </Slide>
    <Slide
      title="Slide 2"
      notes={["Das sind meine Notes für die dritte Seite"]}
    >
      <p className="text-7xl font-light uppercase tracking-wide text-pink-600">
        Dolor
      </p>
    </Slide>
    <Bkg />
  </Wrapper>
);

export default function render(mountElement: HTMLElement) {
  ReactDOM.createRoot(mountElement).render(<App />);
}
