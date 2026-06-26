export type PresiStepCleanup = void | (() => void);
export type PresiStepFunction = () => PresiStepCleanup;

const stepRegistry = new Map<string, PresiStepFunction>();

export const registerPresiStep = (id: string, run: PresiStepFunction) => {
  stepRegistry.set(id, run);
};

export const unregisterPresiStep = (id: string) => {
  stepRegistry.delete(id);
};

export const getPresiStep = (id: string): PresiStepFunction | undefined =>
  stepRegistry.get(id);
