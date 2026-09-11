import React from "react";
import { DeckContext } from "./context.ts";
import { DeckStore } from "./engine/deckStore.ts";
import type { PresiTransitionConfig } from "./engine/transitions.ts";

export interface WrapperProps {
  children: React.ReactNode;
  aspectRatio: `${number}:${number}`;
  transition?: PresiTransitionConfig;
  calculateFontSize?: () => number;
  fontScale?: number;
}

const Wrapper: React.FC<WrapperProps> = ({
  children,
  aspectRatio,
  transition,
  calculateFontSize,
  fontScale,
}) => {
  const [store] = React.useState(() => new DeckStore());
  const ref = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    store.updateConfig({
      aspectRatio,
      transition,
      calculateFontSize,
      fontScale,
    });
  });

  React.useLayoutEffect(() => {
    if (!ref.current) return;

    store.mount(ref.current);
    return () => store.unmount();
  }, [store]);

  return (
    <DeckContext.Provider value={store}>
      <div ref={ref}>{children}</div>
    </DeckContext.Provider>
  );
};

export default Wrapper;
