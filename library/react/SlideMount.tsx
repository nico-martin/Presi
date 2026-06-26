import React from "react";
import Step, { type StepProps } from "./Step.tsx";

export type SlideMountProps = Pick<StepProps, "run">;

const SlideMount: React.FC<SlideMountProps> = ({ run }) => {
  return <Step stepIndex={0} run={run} />;
};

export default SlideMount;
