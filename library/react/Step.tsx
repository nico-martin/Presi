import React from "react";
import { SlideContext } from "./context.ts";
import type {
  EffectRegistration,
  PresiStepFunction,
} from "./engine/deckStore.ts";

export interface StepProps {
  stepIndex?: number;
  run: PresiStepFunction;
}

const Step: React.FC<StepProps> = ({ stepIndex, run }) => {
  const slide = React.useContext(SlideContext);
  if (!slide) {
    throw new Error("<Step> must be used inside a <Slide>.");
  }

  // The hidden span only anchors the step's document position for implicit
  // step ordering.
  const anchorRef = React.useRef<HTMLSpanElement>(null);
  const runRef = React.useRef(run);
  runRef.current = run;

  React.useLayoutEffect(() => {
    const effect: EffectRegistration = {
      anchor: anchorRef.current,
      stepIndex,
      run: () => runRef.current(),
    };
    slide.registration.effects.add(effect);
    slide.store.invalidate();

    return () => {
      slide.registration.effects.delete(effect);
      slide.store.invalidate();
    };
  }, [slide, stepIndex]);

  return <span ref={anchorRef} hidden />;
};

export default Step;
