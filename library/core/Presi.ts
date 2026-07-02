import EventBus from "./EventBus";
import Notes from "./plugins/Notes.ts";
import { getPresiStep, type PresiStepCleanup } from "./StepRegistry.ts";
import {
  keyBoardFullscreen,
  keyBoardNavigation,
  parseHash,
} from "./utils/functions.ts";

interface PresiTimelineEffect {
  id: string;
}

interface PresiTimelineElement {
  element: HTMLElement;
  direction: "in" | "out";
}

interface PresiTimelineStep {
  elements: PresiTimelineElement[];
  effects: PresiTimelineEffect[];
}

export interface PresiTransitionAttributes {
  in: string;
  out: string;
  inOrder: string;
  outOrder: string;
}

export interface PresiTransitionConfig {
  duration?: number;
  delay?: number;
  easing?: string;
  attributes?: Partial<PresiTransitionAttributes>;
}

export interface PresiConfig {
  aspectRatio?: `${number}:${number}`;
  calculateFontSize?: () => number;
  transition?: PresiTransitionConfig;
}

export const PRESI_TRANSITION_CONFIG = {
  duration: 400,
  delay: 200,
  easing: "cubic-bezier(.2, .85, .25, 1)",
  attributes: {
    in: "data-transition-in",
    out: "data-transition-out",
    inOrder: "data-transition-in-order",
    outOrder: "data-transition-out-order",
  },
  transitions: {
    fade: { x: "0", y: "0", scale: 1 },
    "fade-up": { x: "0", y: "2rem", scale: 1 },
    "fade-left": { x: "2rem", y: "0", scale: 1 },
    "fade-right": { x: "-2rem", y: "0", scale: 1 },
    "fade-down": { x: "0", y: "-2rem", scale: 1 },
    "fade-grow": { x: "0", y: "0", scale: 0.5 },
    "fade-up-grow": { x: "0", y: "2rem", scale: 0.5 },
    "fade-left-grow": { x: "2rem", y: "0", scale: 0.5 },
    "fade-right-grow": { x: "-2rem", y: "0", scale: 0.5 },
    "fade-down-grow": { x: "0", y: "-2rem", scale: 0.5 },
  },
} as const;

type PresiTransitionName = keyof typeof PRESI_TRANSITION_CONFIG.transitions;
type PresiResolvedTransitionConfig = {
  duration: number;
  delay: number;
  easing: string;
  attributes: PresiTransitionAttributes;
  transitions: typeof PRESI_TRANSITION_CONFIG.transitions;
};

const styles = {
  wrapper: "presi-wrapper",
  slide: "presi-slide",
};

const injectBaseStyles = () => {
  if (document.getElementById("presi-base-styles")) return;

  const presiStyles = document.createElement("style");
  presiStyles.id = "presi-base-styles";
  presiStyles.innerHTML = `body {
  margin: 0;
  padding: 0;
  background-color: #000;
}

.${styles.wrapper} {
  position: fixed;
  left: 50%;
  top: 50%;
  aspect-ratio: var(--aspect-ratio);
  background-color: white;
  transform: translate(-50%, -50%);
  width: 100vw;
}

.${styles.slide} {
  background-color: #fff;
  width: 100%;
  aspect-ratio: var(--aspect-ratio);
}

.${styles.slide} .fragment {
  opacity: 0;
}

.${styles.slide} .fragment.visible {
  opacity: 1;
}

.${styles.slide} aside {
  display: none;
}`;
  document.head.appendChild(presiStyles);
};

class Presi {
  private readonly wrapper: HTMLElement = null;
  public aspect: `${number}:${number}`;
  public backwards: boolean = false;
  private readonly calculateFontSize: () => number;
  public eventBus: EventBus<PresiEvents> = new EventBus<PresiEvents>();
  private slides: Array<{
    slide: HTMLElement;
    steps: PresiTimelineStep[];
  }> = [];
  private activeEffects = new Map<string, PresiStepCleanup>();
  private currentState: PresiHashState | null = null;
  private readonly transitionConfig: PresiResolvedTransitionConfig;

  public constructor(
    wrapper: HTMLElement,
    {
      aspectRatio = "16:9",
      calculateFontSize = () => window.innerWidth / 48,
      transition = {},
    }: PresiConfig,
  ) {
    this.calculateFontSize = calculateFontSize;
    this.transitionConfig = {
      ...PRESI_TRANSITION_CONFIG,
      ...transition,
      attributes: {
        ...PRESI_TRANSITION_CONFIG.attributes,
        ...transition.attributes,
      },
    };
    this.aspect = aspectRatio;
    const aspect = aspectRatio.replace(":", "/");
    this.wrapper = wrapper;
    injectBaseStyles();
    this.wrapper.classList.add(styles.wrapper);
    this.wrapper.style.setProperty("--aspect-ratio", aspect);

    const existingPresiStyles = document.getElementById("presi-styles");
    existingPresiStyles && existingPresiStyles.remove();

    const presiStyles = document.createElement("style");
    presiStyles.id = "presi-styles";
    presiStyles.innerHTML = `.${styles.slide} [${this.transitionConfig.attributes.in}]:not(.visible),
.${styles.slide} [${this.transitionConfig.attributes.out}].hidden {
  opacity: 0;
}

@media (min-aspect-ratio: ${aspect}) {
  .${styles.wrapper} {
    width: auto;
    height: 100vh;
  }
}`;
    document.head.appendChild(presiStyles);
    const slides = Array.from(this.wrapper.querySelectorAll("section"));
    slides.map((slide) => {
      slide.style.display = "none";
      slide.classList.add(styles.slide);
      this.slides.push({
        slide,
        steps: this.getStepsFromSlide(slide),
      });
    });
    const currentHash = this.getCurrentHashState();

    if (
      currentHash.slideIndex === false ||
      currentHash.fragmentIndex === false
    ) {
      window.location.hash = `#/${currentHash.slideIndex || 0}/${
        currentHash.fragmentIndex || 0
      }`;
    } else {
      this.drawSlide(currentHash.slideIndex, currentHash.fragmentIndex);
    }

    addEventListener("hashchange", this.onHashChanged);
    addEventListener("keyup", this.keyup);
    addEventListener("resize", this.resize);
    this.resize();

    new Notes(this);
  }

  private resize = () => {
    document.documentElement.style.fontSize = `${this.calculateFontSize()}px`;
  };

  public onSlideChange = (cb: (data: PresiEventsSlideChange) => void) =>
    this.eventBus.subscribe("slideChange", (data) =>
      cb(data as PresiEventsSlideChange),
    );

  public onFragmentChange = (cb: (data: PresiEventsFragmentChange) => void) =>
    this.eventBus.subscribe("fragmentChange", (data) =>
      cb(data as PresiEventsFragmentChange),
    );

  public onStateChange = (cb: (data: PresiEventsStateChange) => void) =>
    this.eventBus.subscribe("stateChange", (data) =>
      cb(data as PresiEventsStateChange),
    );

  public cleanUp = () => {
    removeEventListener("hashchange", this.onHashChanged);
    removeEventListener("keyup", this.keyup);
    this.cleanInactiveEffects(new Set());
  };

  private getCurrentHashState = (): {
    slideIndex: number | false;
    fragmentIndex: number | false;
  } => parseHash(window.location.hash);

  public getCurrentHashStateSave = (): {
    slideIndex: number;
    fragmentIndex: number;
  } => {
    const state = parseHash(window.location.hash);
    return {
      slideIndex: state.slideIndex || 0,
      fragmentIndex: state.fragmentIndex || 0,
    };
  };

  private onHashChanged = (e: HashChangeEvent) => {
    const { slideIndex, fragmentIndex } = parseHash(
      "#" + e.newURL.split("#")[1],
    );

    this.drawSlide(slideIndex || 0, fragmentIndex || 0);
  };

  private drawSlide = (slideIndex: number, fragmentIndex: number) => {
    const prevState = this.currentState;
    this.slides.map(({ slide }) => {
      slide.style.display = "none";
    });
    const currentSlide = this.slides[slideIndex];
    currentSlide.slide.style.display = "block";

    const activeEffectIds = new Set<string>();
    const transitionInElements: HTMLElement[] = [];

    currentSlide.steps.map((step, i) => {
      step.elements.map(({ element, direction }) => {
        const wasVisible = this.isElementVisibleAtStep(
          i,
          direction,
          prevState?.slideIndex === slideIndex ? prevState.fragmentIndex : null,
        );
        const isVisible = this.isElementVisibleAtStep(
          i,
          direction,
          fragmentIndex,
        );

        element.classList.toggle("visible", isVisible);
        element.classList.toggle("hidden", !isVisible);

        if (!wasVisible && isVisible) {
          transitionInElements.push(element);
        }
      });

      if (i <= fragmentIndex) {
        step.effects.map((effect) => activeEffectIds.add(effect.id));
      }
    });

    this.cleanInactiveEffects(activeEffectIds);
    currentSlide.steps
      .slice(0, fragmentIndex + 1)
      .flatMap((step) => step.effects)
      .map((effect) => this.runEffect(effect.id));

    const currentState = { slideIndex, fragmentIndex };
    this.currentState = currentState;
    this.eventBus.publish("stateChange", {
      currentState,
      nextState: this.nextState(currentState) || currentState,
    });

    const shouldAnimateSlideIn =
      prevState && prevState.slideIndex !== slideIndex;
    shouldAnimateSlideIn && this.animateTransitionIn([currentSlide.slide]);
    this.animateTransitionIn(transitionInElements);
  };

  private isElementVisibleAtStep = (
    stepIndex: number,
    direction: PresiTimelineElement["direction"],
    currentStep: number | null,
  ): boolean => {
    if (currentStep === null) return false;
    return direction === "in"
      ? stepIndex <= currentStep
      : stepIndex > currentStep;
  };

  private getStepsFromSlide = (slide: HTMLElement): PresiTimelineStep[] => {
    const timeline: PresiTimelineStep[] = [{ elements: [], effects: [] }];
    const elements: HTMLElement[] = Array.from(
      slide.querySelectorAll(
        `.fragment, [data-presi-step-id], [${this.transitionConfig.attributes.in}], [${this.transitionConfig.attributes.out}]`,
      ),
    );
    let nextImplicitIndex = 1;

    elements.map((element) => {
      const explicitIndex = this.getExplicitStepIndex(element);
      const usesImplicitStep = this.usesImplicitStep(element);
      const stepIndex =
        explicitIndex ?? (usesImplicitStep ? nextImplicitIndex : 0);
      if (usesImplicitStep) {
        nextImplicitIndex = Math.max(nextImplicitIndex, stepIndex + 1);
      }
      timeline[stepIndex] = timeline[stepIndex] || {
        elements: [],
        effects: [],
      };

      if (
        element.classList.contains("fragment") ||
        element.hasAttribute(this.transitionConfig.attributes.in)
      ) {
        timeline[stepIndex].elements.push({ element, direction: "in" });
      } else if (element.hasAttribute(this.transitionConfig.attributes.out)) {
        timeline[stepIndex].elements.push({ element, direction: "out" });
      }

      const effectId = element.getAttribute("data-presi-step-id");
      if (effectId) {
        timeline[stepIndex].effects.push({ id: effectId });
      }
    });

    return timeline.map((step) => step || { elements: [], effects: [] });
  };

  private usesImplicitStep = (element: HTMLElement): boolean =>
    element.classList.contains("fragment") ||
    element.hasAttribute("data-presi-step-id");

  private getExplicitStepIndex = (element: HTMLElement): number | null => {
    const index =
      element.getAttribute("data-step-index") ||
      element.getAttribute("data-fragment-index");
    if (index === null) return null;

    const stepIndex = parseInt(index);
    return Number.isNaN(stepIndex) ? null : stepIndex;
  };

  private runEffect = (id: string) => {
    if (this.activeEffects.has(id)) return;

    const run = getPresiStep(id);
    if (!run) return;
    this.activeEffects.set(id, run());
  };

  private cleanInactiveEffects = (activeEffectIds: Set<string>) => {
    Array.from(this.activeEffects.entries()).map(([id, cleanup]) => {
      if (activeEffectIds.has(id)) return;

      typeof cleanup === "function" && cleanup();
      this.activeEffects.delete(id);
    });
  };

  private keyup = (e: KeyboardEvent) => {
    keyBoardNavigation(e.code, this.next, this.prev);
    keyBoardFullscreen(e.code);
  };

  public next = async () => {
    this.backwards = false;
    const prev = this.getCurrentHashStateSave();
    const next = this.nextState(prev);
    if (next === false) {
      // end
    } else {
      await this.updateHash(prev, next);
    }
  };

  public prev = async () => {
    this.backwards = true;
    const prev = this.getCurrentHashStateSave();
    const back = this.backState(prev);
    if (back === false) {
      console.log("start");
    } else {
      await this.updateHash(prev, back);
    }
  };

  public nextState = (prev: PresiHashState): PresiHashState | false => {
    const currentSlide = this.slides[prev.slideIndex];
    const hasNextSlide = prev.slideIndex < this.slides.length - 1;
    const hasNextFragment = prev.fragmentIndex < currentSlide.steps.length - 1;

    if (hasNextFragment) {
      return {
        slideIndex: prev.slideIndex,
        fragmentIndex: prev.fragmentIndex + 1,
      };
    } else if (hasNextSlide) {
      return {
        slideIndex: prev.slideIndex + 1,
        fragmentIndex: 0,
      };
    } else {
      return false;
    }
  };

  public backState = (prev: PresiHashState): PresiHashState | false => {
    const hasPrevSlide = prev.slideIndex > 0;
    const hasPrevFragment = prev.fragmentIndex > 0;

    if (hasPrevFragment) {
      return {
        slideIndex: prev.slideIndex,
        fragmentIndex: prev.fragmentIndex - 1,
      };
    } else if (hasPrevSlide) {
      return {
        slideIndex: prev.slideIndex - 1,
        fragmentIndex: this.slides[prev.slideIndex - 1].steps.length - 1,
      };
    } else {
      return false;
    }
  };

  private updateHash = async (
    prevState: PresiHashState,
    nextState: PresiHashState,
  ) => {
    await this.animateStateOut(prevState, nextState);

    if (prevState.slideIndex !== nextState.slideIndex) {
      this.eventBus.publish("slideChange", {
        prevSlide: this.slides[prevState.slideIndex].slide,
        prevSlideIndex: prevState.slideIndex,
        slide: this.slides[nextState.slideIndex].slide,
        slideIndex: nextState.slideIndex,
      });
    }

    if (prevState.fragmentIndex !== nextState.fragmentIndex) {
      this.eventBus.publish("fragmentChange", {
        prevFragmentIndex: prevState.fragmentIndex,
        fragmentIndex: nextState.fragmentIndex,
      });
    }

    window.location.hash = `#/${nextState.slideIndex}/${nextState.fragmentIndex}`;
  };

  private animateStateOut = async (
    prevState: PresiHashState,
    nextState: PresiHashState,
  ) => {
    const prevSlide = this.slides[prevState.slideIndex];
    if (!prevSlide) return;

    const elements: HTMLElement[] = [];
    if (prevState.slideIndex !== nextState.slideIndex) {
      elements.push(prevSlide.slide);
    }

    if (prevState.slideIndex === nextState.slideIndex) {
      prevSlide.steps.map((step, stepIndex) => {
        step.elements.map(({ element, direction }) => {
          const wasVisible = this.isElementVisibleAtStep(
            stepIndex,
            direction,
            prevState.fragmentIndex,
          );
          const isVisible = this.isElementVisibleAtStep(
            stepIndex,
            direction,
            nextState.fragmentIndex,
          );
          if (wasVisible && !isVisible) {
            elements.push(element);
          }
        });
      });
    }

    await this.animateTransitionOut(elements);
  };

  private getTransitionName = (
    element: HTMLElement,
    attribute: string,
  ): PresiTransitionName | null => {
    const transition = element.getAttribute(attribute);
    if (!transition) return null;
    return transition in PRESI_TRANSITION_CONFIG.transitions
      ? (transition as PresiTransitionName)
      : null;
  };

  private getTransitionOrder = (
    element: HTMLElement,
    index: number,
    direction: "in" | "out",
  ): number => {
    const order = element.getAttribute(
      direction === "in"
        ? this.transitionConfig.attributes.inOrder
        : this.transitionConfig.attributes.outOrder,
    );
    if (order === null) return index;

    const parsedOrder = parseInt(order);
    return Number.isNaN(parsedOrder) ? index : parsedOrder;
  };

  private sortTransitionElements = (
    elements: HTMLElement[],
    direction: "in" | "out",
  ): HTMLElement[] =>
    elements
      .map((element, index) => ({ element, index }))
      .sort((a, b) => {
        const orderDiff =
          this.getTransitionOrder(a.element, a.index, direction) -
          this.getTransitionOrder(b.element, b.index, direction);
        return orderDiff || a.index - b.index;
      })
      .map(({ element }) => element);

  private invertOffset = (offset: string): string => {
    if (offset === "0") return offset;
    return offset.startsWith("-") ? offset.slice(1) : `-${offset}`;
  };

  private animateTransitionIn = (elements: HTMLElement[]) => {
    this.animateTransitions(
      elements,
      this.transitionConfig.attributes.in,
      "in",
    );
  };

  private animateTransitionOut = async (elements: HTMLElement[]) =>
    this.animateTransitions(
      elements,
      this.transitionConfig.attributes.out,
      "out",
    );

  private animateTransitions = async (
    elements: HTMLElement[],
    attribute: string,
    direction: "in" | "out",
  ) => {
    const animations = this.sortTransitionElements(elements, direction)
      .map((element, index) => {
        const transitionName = this.getTransitionName(element, attribute);
        if (!transitionName) return null;

        const transition = PRESI_TRANSITION_CONFIG.transitions[transitionName];
        const hiddenFrame = {
          opacity: 0,
          transform: `translate(${
            direction === "in" ? transition.x : this.invertOffset(transition.x)
          }, ${
            direction === "in" ? transition.y : this.invertOffset(transition.y)
          }) scale(${transition.scale})`,
        };
        const visibleFrame = {
          opacity: 1,
          transform: "translate(0, 0) scale(1)",
        };

        return element.animate(
          direction === "in"
            ? [hiddenFrame, visibleFrame]
            : [visibleFrame, hiddenFrame],
          {
            duration: this.transitionConfig.duration,
            delay: index * this.transitionConfig.delay,
            easing: this.transitionConfig.easing,
            fill: "both",
          },
        );
      })
      .filter((animation): animation is Animation => Boolean(animation));

    await Promise.all(
      animations.map((animation) =>
        animation.finished.finally(() => {
          animation.commitStyles();
          animation.cancel();
        }),
      ),
    );
  };

  public getCurrentSlide = (): HTMLElement =>
    this.slides[this.getCurrentHashState().slideIndex || 0].slide;

  public getTotalSlides = (): number => this.slides.length;

  public getTotalSteps = (
    slideIndex = this.getCurrentHashStateSave().slideIndex,
  ): number => this.slides[slideIndex]?.steps.length || 0;

  public getSlideProps = (
    slideIndex = this.getCurrentHashStateSave().slideIndex,
  ): {
    title: string;
  } => ({
    title: this.slides[slideIndex]?.slide.getAttribute("data-title") || "",
  });
}

export default Presi;
