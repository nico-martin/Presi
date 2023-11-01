interface PresiConfig {
  aspectRatio?: `${number}:${number}`;
}

interface PresiEvents {
  slideChange: {
    prevSlide: HTMLElement;
    slide: HTMLElement;
  };
  fragmentChange: {
    prevFragmentIndex: number;
    fragmentIndex: number;
  };
}
