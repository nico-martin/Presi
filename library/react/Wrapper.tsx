import React from "react";
import { Presi, type PresiConfig } from "presi-js/core";
import { PresiContext, type PresiContextValue } from "./usePresi.ts";

const Wrapper: React.FC<{
  children: React.ReactNode;
  aspectRatio: `${number}:${number}`;
  transition?: PresiConfig["transition"];
}> = ({ children, aspectRatio, transition }) => {
  const [state, setState] = React.useState<PresiContextValue>({
    slideIndex: 0,
    stepIndex: 0,
    totalSlides: 0,
    totalSteps: 0,
    currentSlide: {
      title: "",
    },
  });
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!ref.current) return;

    const p = new Presi(ref.current, { aspectRatio, transition });
    const setPresiState = (currentState: {
      slideIndex: number;
      fragmentIndex: number;
    }) => {
      setState({
        slideIndex: currentState.slideIndex,
        stepIndex: currentState.fragmentIndex,
        totalSlides: p.getTotalSlides(),
        totalSteps: p.getTotalSteps(currentState.slideIndex),
        currentSlide: p.getSlideProps(currentState.slideIndex),
      });
    };

    setPresiState(p.getCurrentHashStateSave());
    const unsubscribeStateChange = p.onStateChange(({ currentState }) => {
      setPresiState(currentState);
    });

    return () => {
      unsubscribeStateChange();
      p.cleanUp();
    };
  }, [aspectRatio, transition]);

  return (
    <PresiContext.Provider value={state}>
      <div ref={ref}>{children}</div>
    </PresiContext.Provider>
  );
};

export default Wrapper;
