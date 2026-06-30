import React from "react";
import { registerPresiStep, unregisterPresiStep } from "presi/core";

export interface StepProps {
  stepIndex?: number;
  run: () => void | (() => void);
}

const Step: React.FC<StepProps> = ({ stepIndex, run }) => {
  const idRef = React.useRef<string>(null);

  if (!idRef.current) {
    idRef.current = `presi-step-${Math.random().toString(36).slice(2)}`;
  }

  registerPresiStep(idRef.current, run);

  React.useEffect(() => {
    const id = idRef.current;

    return () => {
      id && unregisterPresiStep(id);
    };
  }, []);

  return (
    <span
      data-presi-step-id={idRef.current}
      data-step-index={stepIndex}
      hidden
    />
  );
};

export default Step;
