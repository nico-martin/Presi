export interface PresiState {
  slideIndex: number;
  stepIndex: number;
}

export interface HashSlideInfo {
  id?: string;
  stepCount: number;
}

export const parseHash = (
  input: string = "",
): {
  slideReference: string | false;
  stepIndex: number | false;
} => {
  const result: {
    slideReference: string | false;
    stepIndex: number | false;
  } = { slideReference: false, stepIndex: false };
  const match = input.match(/^#\/([^/]+)\/([^/]+)$/);
  if (!match) return result;

  try {
    result.slideReference = decodeURIComponent(match[1]);
  } catch {
    return result;
  }

  if (/^\d+$/.test(match[2])) {
    result.stepIndex = Number(match[2]);
  }

  return result;
};

export const resolveHashState = (
  hash: string,
  slides: HashSlideInfo[],
): { state: PresiState; exact: boolean } => {
  const parsed = parseHash(hash);
  const lastSlideIndex = Math.max(0, slides.length - 1);
  let slideIndex = 0;
  let slideIsExact = false;

  if (parsed.slideReference !== false) {
    if (/^\d+$/.test(parsed.slideReference)) {
      const requestedIndex = Number(parsed.slideReference);
      slideIndex = Math.min(requestedIndex, lastSlideIndex);
      slideIsExact = requestedIndex === slideIndex;
    } else {
      const namedIndex = slides.findIndex(
        (slide) => slide.id === parsed.slideReference,
      );
      if (namedIndex >= 0) {
        slideIndex = namedIndex;
        slideIsExact = true;
      }
    }
  }

  const lastStepIndex = Math.max(0, (slides[slideIndex]?.stepCount || 1) - 1);
  const requestedStepIndex = parsed.stepIndex;
  const stepIndex =
    requestedStepIndex === false
      ? 0
      : Math.min(requestedStepIndex, lastStepIndex);

  return {
    state: { slideIndex, stepIndex },
    exact:
      slideIsExact &&
      requestedStepIndex !== false &&
      requestedStepIndex === stepIndex,
  };
};

export const serializeHashState = (
  { slideIndex, stepIndex }: PresiState,
  slides: HashSlideInfo[],
): string => {
  const id = slides[slideIndex]?.id;
  const slideReference = id ? encodeURIComponent(id) : String(slideIndex);
  return `#/${slideReference}/${stepIndex}`;
};

export const nextState = (
  prev: PresiState,
  slides: HashSlideInfo[],
): PresiState | false => {
  const hasNextSlide = prev.slideIndex < slides.length - 1;
  const hasNextStep =
    prev.stepIndex < (slides[prev.slideIndex]?.stepCount || 1) - 1;

  if (hasNextStep) {
    return {
      slideIndex: prev.slideIndex,
      stepIndex: prev.stepIndex + 1,
    };
  } else if (hasNextSlide) {
    return {
      slideIndex: prev.slideIndex + 1,
      stepIndex: 0,
    };
  } else {
    return false;
  }
};

export const backState = (
  prev: PresiState,
  slides: HashSlideInfo[],
): PresiState | false => {
  const hasPrevSlide = prev.slideIndex > 0;
  const hasPrevStep = prev.stepIndex > 0;

  if (hasPrevStep) {
    return {
      slideIndex: prev.slideIndex,
      stepIndex: prev.stepIndex - 1,
    };
  } else if (hasPrevSlide) {
    return {
      slideIndex: prev.slideIndex - 1,
      stepIndex: (slides[prev.slideIndex - 1]?.stepCount || 1) - 1,
    };
  } else {
    return false;
  }
};

export const validateSlideIds = (slides: HashSlideInfo[]) => {
  const ids = new Set<string>();
  slides.map((slide) => {
    const id = slide.id;
    if (!id) return;
    if (/^\d+$/.test(id)) {
      throw new Error(`Presi slide id "${id}" must not be numeric.`);
    }
    if (ids.has(id)) {
      throw new Error(`Presi slide id "${id}" must be unique.`);
    }
    ids.add(id);
  });
};
