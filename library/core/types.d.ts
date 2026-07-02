interface PresiConfig {
  aspectRatio?: `${number}:${number}`;
  calculateFontSize?: () => number;
  transition?: PresiTransitionConfig;
}

interface PresiTransitionConfig {
  duration?: number;
  delay?: number;
  easing?: string;
  attributes?: Partial<PresiTransitionAttributes>;
}

interface PresiTransitionAttributes {
  in: string;
  out: string;
  inOrder: string;
  outOrder: string;
}

interface PresiHashState {
  slideIndex: number;
  fragmentIndex: number;
}

interface PresiEventsSlideChange {
  prevSlide: HTMLElement;
  prevSlideIndex: number;
  slide: HTMLElement;
  slideIndex: number;
}

interface PresiEventsFragmentChange {
  prevFragmentIndex: number;
  fragmentIndex: number;
}

interface PresiEventsStateChange {
  currentState: PresiHashState;
  nextState: PresiHashState;
}

interface PresiEvents {
  slideChange: PresiEventsSlideChange;
  fragmentChange: PresiEventsFragmentChange;
  stateChange: PresiEventsStateChange;
}
