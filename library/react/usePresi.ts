import React from "react";
import { DeckContext } from "./context.ts";
import type { PresiSnapshot } from "./engine/deckStore.ts";

export interface PresiSlideProps {
  title: string;
}

export type PresiContextValue = PresiSnapshot;

const usePresi = (): PresiContextValue => {
  const store = React.useContext(DeckContext);
  if (!store) {
    throw new Error("usePresi must be used inside a <Wrapper>.");
  }

  return React.useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );
};

export default usePresi;
