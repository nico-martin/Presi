import React from "react";
import { unregisterPresiStep, type PresiStepFunction } from "@presi/core";

interface PendingSlideMount {
  id: string;
  run: PresiStepFunction;
}

const pendingSlideMounts = new Map<string, PendingSlideMount>();

export const consumePendingSlideMounts = (): PendingSlideMount[] => {
  const mounts = Array.from(pendingSlideMounts.values());
  pendingSlideMounts.clear();
  return mounts;
};

const useSlideMount = (run: PresiStepFunction) => {
  const idRef = React.useRef<string>(null);
  const runRef = React.useRef<PresiStepFunction>(run);
  runRef.current = run;

  if (!idRef.current) {
    idRef.current = `presi-slide-mount-${Math.random().toString(36).slice(2)}`;
  }

  pendingSlideMounts.set(idRef.current, {
    id: idRef.current,
    run: () => runRef.current(),
  });

  React.useEffect(() => {
    const id = idRef.current;

    return () => {
      if (!id) return;
      pendingSlideMounts.delete(id);
      unregisterPresiStep(id);
    };
  }, []);
};

export default useSlideMount;
