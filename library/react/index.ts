export { default as Wrapper, type WrapperProps } from "./Wrapper.tsx";
export { default as Slide } from "./Slide.tsx";
export type { SlideBackground, SlideProps } from "./Slide.tsx";
export { default as Fragment } from "./Fragment.tsx";
export type { FragmentOwnProps, FragmentProps } from "./Fragment.tsx";
export { default as Step } from "./Step.tsx";
export type { StepProps } from "./Step.tsx";
export { default as usePresi, type PresiContextValue } from "./usePresi.ts";
export {
  TRANSITIONS,
  type PresiTransitionConfig,
  type TransitionName,
} from "./engine/transitions.ts";
export type {
  DeckConfig,
  FragmentConfig,
  PresiSnapshot,
  PresiStepCleanup,
  PresiStepFunction,
} from "./engine/deckStore.ts";
