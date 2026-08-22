export const TRANSITIONS = {
  fade: {
    keyframes: [
      { opacity: 0, transform: "translate(0, 0) scale(1)" },
      { opacity: 1, transform: "translate(0, 0) scale(1)" },
    ],
  },
  "fade-up": {
    keyframes: [
      { opacity: 0, transform: "translate(0, 2rem) scale(1)" },
      { opacity: 1, transform: "translate(0, 0) scale(1)" },
    ],
  },
  "fade-left": {
    keyframes: [
      { opacity: 0, transform: "translate(2rem, 0) scale(1)" },
      { opacity: 1, transform: "translate(0, 0) scale(1)" },
    ],
  },
  "fade-right": {
    keyframes: [
      { opacity: 0, transform: "translate(-2rem, 0) scale(1)" },
      { opacity: 1, transform: "translate(0, 0) scale(1)" },
    ],
  },
  "fade-down": {
    keyframes: [
      { opacity: 0, transform: "translate(0, -2rem) scale(1)" },
      { opacity: 1, transform: "translate(0, 0) scale(1)" },
    ],
  },
  "fade-grow": {
    keyframes: [
      { opacity: 0, transform: "translate(0, 0) scale(0.5)" },
      { opacity: 1, transform: "translate(0, 0) scale(1)" },
    ],
  },
  "fade-up-grow": {
    keyframes: [
      { opacity: 0, transform: "translate(0, 2rem) scale(0.5)" },
      { opacity: 1, transform: "translate(0, 0) scale(1)" },
    ],
  },
  "fade-left-grow": {
    keyframes: [
      { opacity: 0, transform: "translate(2rem, 0) scale(0.5)" },
      { opacity: 1, transform: "translate(0, 0) scale(1)" },
    ],
  },
  "fade-right-grow": {
    keyframes: [
      { opacity: 0, transform: "translate(-2rem, 0) scale(0.5)" },
      { opacity: 1, transform: "translate(0, 0) scale(1)" },
    ],
  },
  "fade-down-grow": {
    keyframes: [
      { opacity: 0, transform: "translate(0, -2rem) scale(0.5)" },
      { opacity: 1, transform: "translate(0, 0) scale(1)" },
    ],
  },
  pop: {
    keyframes: [
      {
        opacity: 0,
        transform: "translate(0, 0) scale(.45)",
      },
      {
        opacity: 1,
        transform: "translate(0, 0) scale(1.1)",
        offset: 0.62,
      },
      {
        opacity: 1,
        transform: "translate(0, 0) scale(1)",
      },
    ],
    easing: "cubic-bezier(.34, 1.45, .5, 1)",
  },
} as const satisfies Record<string, TransitionDefinition>;

export interface TransitionDefinition {
  keyframes: readonly Readonly<Record<string, string | number>>[];
  easing?: string;
}

export type TransitionName = keyof typeof TRANSITIONS;

export interface PresiTransitionConfig {
  duration?: number;
  delay?: number;
  // Milliseconds after an out-transition starts before the in-transitions
  // begin. Navigation itself is always instant; `inDelay` only stages the
  // animations.
  inDelay?: number;
  easing?: string;
}

export interface ResolvedTransitionConfig {
  duration: number;
  delay: number;
  inDelay: number;
  easing: string;
}

export const DEFAULT_TRANSITION_CONFIG: ResolvedTransitionConfig = {
  duration: 600,
  delay: 300,
  inDelay: 0,
  easing: "cubic-bezier(.2, .85, .25, 1)",
};

export interface TransitionTarget {
  element: HTMLElement;
  transition: TransitionName;
  order?: number;
  // Overrides the stagger position, so grouped targets (slide background +
  // content) share one delay slot.
  delayIndex?: number;
}

export interface TransitionRun {
  duration: number;
  finished: Promise<void>;
}

const invertOffset = (offset: string): string => {
  if (offset === "0") return offset;
  return offset.startsWith("-") ? offset.slice(1) : `-${offset}`;
};

const invertTranslateTransform = (transform: string): string => {
  const translateMatch = transform.match(/translate\(([^,]+),\s*([^\)]+)\)/);
  if (!translateMatch) return transform;

  return transform.replace(
    translateMatch[0],
    `translate(${invertOffset(translateMatch[1])}, ${invertOffset(
      translateMatch[2],
    )})`,
  );
};

const getTransitionKeyframes = (
  keyframes: readonly Readonly<Record<string, string | number>>[],
  direction: "in" | "out",
): Keyframe[] =>
  keyframes.map((frame) => ({
    ...frame,
    transform:
      direction === "out" && typeof frame.transform === "string"
        ? invertTranslateTransform(frame.transform)
        : frame.transform,
  }));

const sortTransitionTargets = (
  targets: TransitionTarget[],
): TransitionTarget[] =>
  targets
    .map((target, index) => ({ target, index }))
    .sort((a, b) => {
      const orderDiff =
        (a.target.order ?? a.index) - (b.target.order ?? b.index);
      return orderDiff || a.index - b.index;
    })
    .map(({ target }) => target);

export class TransitionEngine {
  public config: ResolvedTransitionConfig = DEFAULT_TRANSITION_CONFIG;
  public disabled: boolean = false;
  private animatedElements = new WeakSet<HTMLElement>();

  public animateIn = (
    targets: TransitionTarget[],
    baseDelay: number = 0,
  ): TransitionRun => this.animate(targets, "in", baseDelay);

  public animateOut = (targets: TransitionTarget[]): TransitionRun =>
    this.animate(targets, "out");

  private animate = (
    targets: TransitionTarget[],
    direction: "in" | "out",
    baseDelay: number = 0,
  ): TransitionRun => {
    if (this.disabled) {
      return { duration: 0, finished: Promise.resolve() };
    }

    const animations = sortTransitionTargets(targets).map(
      ({ element, transition: transitionName, delayIndex }, index) => {
        const transition: TransitionDefinition = TRANSITIONS[transitionName];
        const keyframes = getTransitionKeyframes(
          transition.keyframes,
          direction,
        );

        return {
          animation: element.animate(
            direction === "in" ? keyframes : keyframes.reverse(),
            {
              duration: this.config.duration,
              // fill "both" holds the first keyframe during the delay, so
              // waiting in-elements stay invisible until their turn.
              delay: baseDelay + (delayIndex ?? index) * this.config.delay,
              easing: transition.easing ?? this.config.easing,
              fill: "both",
            },
          ),
          element,
        };
      },
    );

    const finished = Promise.all(
      animations.map(({ animation, element }) =>
        animation.finished
          .then(() => {
            animation.commitStyles();
            this.animatedElements.add(element);
            animation.cancel();
          })
          // A canceled animation (fast navigation) must not commit styles.
          .catch(() => undefined),
      ),
    ).then(() => undefined);

    const duration = animations.reduce(
      (longest, { animation }) =>
        Math.max(
          longest,
          Number(animation.effect?.getComputedTiming().endTime) || 0,
        ),
      0,
    );

    return { duration, finished };
  };

  public resetAnimatedStyles = (root: HTMLElement) => {
    [root, ...Array.from(root.querySelectorAll<HTMLElement>("*"))].map(
      (element) => {
        if (!this.animatedElements.has(element)) return;

        element.style.opacity = "";
        element.style.transform = "";
      },
    );
  };
}
