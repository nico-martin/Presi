import React from "react";
import ReactDOM from "react-dom/client";
import "./style.css";

import { Wrapper, usePresi } from "presi-js/react";
import FeatureTourSlide from "./slides/FeatureTourSlide.tsx";
import FragmentsSlide from "./slides/FragmentsSlide.tsx";
import StepControlSlide from "./slides/StepControlSlide.tsx";

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
  <Wrapper aspectRatio="16:9" transition={{ overlap: 300 }}>
    <FeatureTourSlide />
    <FragmentsSlide />
    <StepControlSlide />
    <Bkg />
  </Wrapper>
);

export default function render(mountElement: HTMLElement) {
  const root = ReactDOM.createRoot(mountElement);
  root.render(<App />);

  return () => root.unmount();
}
