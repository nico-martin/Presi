interface PresiConfig {
  aspectRatio?: `${number}:${number}`;
  calculateFontSize?: () => number;
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
