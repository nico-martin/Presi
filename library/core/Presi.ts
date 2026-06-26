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

interface PresiTimelineStep {
  fragments: HTMLElement[];
  effects: PresiTimelineEffect[];
}

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
  background-color: pink;
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

  public constructor(
    wrapper: HTMLElement,
    {
      aspectRatio = "16:9",
      calculateFontSize = () => window.innerWidth / 48,
    }: PresiConfig,
  ) {
    this.calculateFontSize = calculateFontSize;
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
    presiStyles.innerHTML = `@media (min-aspect-ratio: ${aspect}) {
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
    this.slides.map(({ slide }) => {
      slide.style.display = "none";
    });
    const currentSlide = this.slides[slideIndex];
    currentSlide.slide.style.display = "block";

    const activeEffectIds = new Set<string>();

    currentSlide.steps.map((step, i) => {
      if (i <= fragmentIndex) {
        step.fragments.map((fragment) => {
          fragment.classList.add("visible");
        });
        step.effects.map((effect) => activeEffectIds.add(effect.id));
      } else {
        step.fragments.map((fragment) => {
          fragment.classList.remove("visible");
        });
      }
    });

    this.cleanInactiveEffects(activeEffectIds);
    currentSlide.steps
      .slice(0, fragmentIndex + 1)
      .flatMap((step) => step.effects)
      .map((effect) => this.runEffect(effect.id));

    const currentState = { slideIndex, fragmentIndex };
    this.eventBus.publish("stateChange", {
      currentState,
      nextState: this.nextState(currentState) || currentState,
    });
  };

  private getStepsFromSlide = (slide: HTMLElement): PresiTimelineStep[] => {
    const timeline: PresiTimelineStep[] = [{ fragments: [], effects: [] }];
    const elements: HTMLElement[] = Array.from(
      slide.querySelectorAll(".fragment, [data-presi-step-id]"),
    );
    let nextImplicitIndex = 1;

    elements.map((element) => {
      const explicitIndex = this.getExplicitStepIndex(element);
      const stepIndex = explicitIndex ?? nextImplicitIndex;
      nextImplicitIndex = Math.max(nextImplicitIndex, stepIndex + 1);
      timeline[stepIndex] = timeline[stepIndex] || {
        fragments: [],
        effects: [],
      };

      if (element.classList.contains("fragment")) {
        timeline[stepIndex].fragments.push(element);
      }

      const effectId = element.getAttribute("data-presi-step-id");
      if (effectId) {
        timeline[stepIndex].effects.push({ id: effectId });
      }
    });

    return timeline.map((step) => step || { fragments: [], effects: [] });
  };

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
    const slideChanged = prevState.slideIndex !== nextState.slideIndex;

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

    if (!document.startViewTransition || !slideChanged) {
      window.location.hash = `#/${nextState.slideIndex}/${nextState.fragmentIndex}`;
      return;
    }
    this.backwards && document.documentElement.classList.add("back-transition");
    const transition = document.startViewTransition(() => {
      window.location.hash = `#/${nextState.slideIndex}/${nextState.fragmentIndex}`;
    });
    try {
      await transition.finished;
    } finally {
      document.documentElement.classList.remove("back-transition");
    }
  };

  public getCurrentSlide = (): HTMLElement =>
    this.slides[this.getCurrentHashState().slideIndex || 0].slide;

  public getTotalSlides = (): number => this.slides.length;

  public getTotalSteps = (slideIndex = this.getCurrentHashStateSave().slideIndex): number =>
    this.slides[slideIndex]?.steps.length || 0;

  public getSlideProps = (slideIndex = this.getCurrentHashStateSave().slideIndex): {
    title: string;
  } => ({
    title: this.slides[slideIndex]?.slide.getAttribute("data-title") || "",
  });
}

export default Presi;
