import React from "react";
import type { DeckStore, SlideRegistration } from "./engine/deckStore.ts";

export const DeckContext = React.createContext<DeckStore | null>(null);

export interface SlideHandle {
  registration: SlideRegistration;
  store: DeckStore;
}

export const SlideContext = React.createContext<SlideHandle | null>(null);
