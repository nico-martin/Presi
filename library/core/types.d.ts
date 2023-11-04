interface PresiConfig {
  aspectRatio?: `${number}:${number}`;
  calculateFontSize?: () => number;
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

interface PresiEvents {
  slideChange: PresiEventsSlideChange;
  fragmentChange: PresiEventsFragmentChange;
}
