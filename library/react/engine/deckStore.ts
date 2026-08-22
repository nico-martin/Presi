import {
  backState,
  nextState,
  resolveHashState,
  serializeHashState,
  validateSlideIds,
  type HashSlideInfo,
  type PresiState,
} from "./hashState.ts";
import {
  isEditableKeyboardTarget,
  keyBoardFullscreen,
  keyBoardNavigation,
} from "./keyboard.ts";
import { NotesPlugin } from "./notes.ts";
import { injectBaseStyles, injectInstanceStyles, styles } from "./styles.ts";
import {
  DEFAULT_TRANSITION_CONFIG,
  TransitionEngine,
  type PresiTransitionConfig,
  type TransitionName,
  type TransitionRun,
  type TransitionTarget,
} from "./transitions.ts";

export type PresiStepCleanup = void | (() => void);
export type PresiStepFunction = () => PresiStepCleanup;

export interface FragmentConfig {
  transitionIn?: TransitionName;
  transitionOut?: TransitionName;
  order?: number;
  stepIndex?: number;
}

export interface FragmentRegistration extends FragmentConfig {
  element: HTMLElement;
}

export interface EffectRegistration {
  anchor: HTMLElement | null;
  stepIndex?: number;
  run: PresiStepFunction;
}

export interface SlideRegistration {
  element: HTMLElement | null;
  id?: string;
  title: string;
  notes: string[];
  transitionIn?: TransitionName;
  transitionOut?: TransitionName;
  fragments: Set<FragmentRegistration>;
  effects: Set<EffectRegistration>;
}

export interface DeckConfig {
  aspectRatio: `${number}:${number}`;
  transition?: PresiTransitionConfig;
  calculateFontSize?: () => number;
}

export interface PresiSnapshot {
  slideIndex: number;
  stepIndex: number;
  totalSlides: number;
  totalSteps: number;
  currentSlide: {
    title: string;
  };
}

interface TimelineElement {
  element: HTMLElement;
  direction: "in" | "out";
  transitionIn?: TransitionName;
  transitionOut?: TransitionName;
  order?: number;
}

interface TimelineStep {
  elements: TimelineElement[];
  effects: EffectRegistration[];
}

interface SlideEntry {
  registration: SlideRegistration;
  element: HTMLElement;
  timeline: TimelineStep[];
}

const compareDocumentOrder = (
  a: HTMLElement | null,
  b: HTMLElement | null,
): number => {
  if (a === b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  const position = a.compareDocumentPosition(b);
  if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
  if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
  return 0;
};

// Holding a navigation key fast-forwards: first press navigates immediately,
// then repeats every HOLD_REPEAT_INTERVAL ms once HOLD_REPEAT_DELAY has
// passed. Independent of OS key-repeat settings.
const HOLD_REPEAT_DELAY = 400;
const HOLD_REPEAT_INTERVAL = 100;

const isNavigationKey = (code: string): boolean =>
  code === "ArrowRight" || code === "Space" || code === "ArrowLeft";

const isElementVisibleAtStep = (
  stepIndex: number,
  direction: TimelineElement["direction"],
  currentStep: number | null,
): boolean => {
  if (currentStep === null) return false;
  return direction === "in"
    ? stepIndex <= currentStep
    : stepIndex === 0 || stepIndex > currentStep;
};

export class DeckStore {
  private wrapper: HTMLElement | null = null;
  private config: DeckConfig = { aspectRatio: "16:9" };
  private slideRegistrations = new Set<SlideRegistration>();
  private slides: SlideEntry[] = [];
  private transitionEngine = new TransitionEngine();
  private currentState: PresiState | null = null;
  private backwards: boolean = false;
  private activeEffects = new Map<EffectRegistration, PresiStepCleanup>();
  private outgoingSlides = new Set<HTMLElement>();
  private listeners = new Set<() => void>();
  private snapshot: PresiSnapshot = {
    slideIndex: 0,
    stepIndex: 0,
    totalSlides: 0,
    totalSteps: 0,
    currentSlide: { title: "" },
  };
  private mounted: boolean = false;
  private flushScheduled: boolean = false;
  private notes: NotesPlugin | null = null;
  // Consumed by the next drawSlide: staging delay for in-animations while the
  // out-animations of the previous state are still running.
  private pendingInDelay: number = 0;

  public mount = (wrapper: HTMLElement) => {
    this.wrapper = wrapper;
    this.mounted = true;
    this.transitionEngine.disabled =
      Boolean(
        (
          globalThis as typeof globalThis & {
            PRESI_DISABLE_TRANSITIONS?: boolean;
          }
        ).PRESI_DISABLE_TRANSITIONS,
      ) || new URLSearchParams(window.location.search).has("presi-static");

    injectBaseStyles();
    wrapper.classList.add(styles.wrapper);
    wrapper.toggleAttribute(
      "data-presi-static",
      this.transitionEngine.disabled,
    );
    this.applyConfig();

    addEventListener("hashchange", this.onHashChanged);
    addEventListener("keydown", this.keydown);
    addEventListener("keyup", this.keyup);
    addEventListener("blur", this.onBlur);
    addEventListener("resize", this.resize);
    this.resize();

    this.notes = new NotesPlugin(this);
    this.flush();
  };

  public unmount = () => {
    this.mounted = false;
    this.stopHold();
    removeEventListener("hashchange", this.onHashChanged);
    removeEventListener("keydown", this.keydown);
    removeEventListener("keyup", this.keyup);
    removeEventListener("blur", this.onBlur);
    removeEventListener("resize", this.resize);
    this.cleanInactiveEffects(new Set());
    this.notes?.destroy();
    this.notes = null;
    this.wrapper = null;
  };

  public updateConfig = (config: DeckConfig) => {
    const changed =
      config.aspectRatio !== this.config.aspectRatio ||
      JSON.stringify(config.transition) !==
        JSON.stringify(this.config.transition) ||
      config.calculateFontSize !== this.config.calculateFontSize;
    this.config = config;
    if (this.mounted && changed) {
      this.applyConfig();
      this.resize();
    }
  };

  private applyConfig = () => {
    if (!this.wrapper) return;
    const aspect = this.config.aspectRatio.replace(":", "/");
    this.wrapper.style.setProperty("--aspect-ratio", aspect);
    injectInstanceStyles(aspect);
    this.transitionEngine.config = {
      ...DEFAULT_TRANSITION_CONFIG,
      ...this.config.transition,
    };
  };

  public registerSlide = (registration: SlideRegistration): (() => void) => {
    this.slideRegistrations.add(registration);
    this.invalidate();

    return () => {
      this.slideRegistrations.delete(registration);
      this.invalidate();
    };
  };

  public invalidate = () => {
    if (!this.mounted || this.flushScheduled) return;
    this.flushScheduled = true;
    queueMicrotask(() => {
      this.flushScheduled = false;
      this.mounted && this.flush();
    });
  };

  private flush = () => {
    this.slides = Array.from(this.slideRegistrations)
      .filter(
        (
          registration,
        ): registration is SlideRegistration & {
          element: HTMLElement;
        } => Boolean(registration.element),
      )
      .sort((a, b) => compareDocumentOrder(a.element, b.element))
      .map((registration) => ({
        registration,
        element: registration.element as HTMLElement,
        timeline: this.buildTimeline(registration),
      }));
    validateSlideIds(this.slideInfos());

    (
      window as typeof window & {
        __PRESI_DECK__?: {
          slides: Array<{ id?: string; title: string; stepCount: number }>;
        };
      }
    ).__PRESI_DECK__ = {
      slides: this.slides.map(({ registration, timeline }) => ({
        id: registration.id,
        title: registration.title,
        stepCount: timeline.length,
      })),
    };

    if (this.slides.length === 0) {
      this.updateSnapshot();
      return;
    }

    const resolved = resolveHashState(window.location.hash, this.slideInfos());
    if (!resolved.exact) {
      const serialized = serializeHashState(resolved.state, this.slideInfos());
      if (serialized === window.location.hash) {
        this.drawSlide(resolved.state.slideIndex, resolved.state.stepIndex);
      } else {
        window.location.hash = serialized;
      }
    } else {
      this.drawSlide(resolved.state.slideIndex, resolved.state.stepIndex);
    }
  };

  private buildTimeline = (registration: SlideRegistration): TimelineStep[] => {
    const timeline: TimelineStep[] = [{ elements: [], effects: [] }];
    const items: Array<{
      position: HTMLElement | null;
      fragment?: FragmentRegistration;
      effect?: EffectRegistration;
    }> = [
      ...Array.from(registration.fragments).map((fragment) => ({
        position: fragment.element as HTMLElement | null,
        fragment,
      })),
      ...Array.from(registration.effects).map((effect) => ({
        position: effect.anchor,
        effect,
      })),
    ].sort((a, b) => compareDocumentOrder(a.position, b.position));
    let nextImplicitIndex = 1;

    items.map((item) => {
      const direction: TimelineElement["direction"] =
        item.fragment &&
        item.fragment.transitionOut &&
        !item.fragment.transitionIn
          ? "out"
          : "in";
      const usesImplicitStep = item.effect ? true : direction === "in";
      const explicitIndex = (item.fragment ?? item.effect)?.stepIndex ?? null;
      const stepIndex =
        explicitIndex ?? (usesImplicitStep ? nextImplicitIndex : 0);
      if (usesImplicitStep) {
        nextImplicitIndex = Math.max(nextImplicitIndex, stepIndex + 1);
      }
      timeline[stepIndex] = timeline[stepIndex] || {
        elements: [],
        effects: [],
      };

      if (item.fragment) {
        timeline[stepIndex].elements.push({
          element: item.fragment.element,
          direction,
          transitionIn: item.fragment.transitionIn,
          transitionOut: item.fragment.transitionOut,
          order: item.fragment.order,
        });
      }
      if (item.effect) {
        timeline[stepIndex].effects.push(item.effect);
      }
    });

    return timeline.map((step) => step || { elements: [], effects: [] });
  };

  private slideInfos = (): HashSlideInfo[] =>
    this.slides.map(({ registration, timeline }) => ({
      id: registration.id,
      stepCount: timeline.length,
    }));

  public getState = (): PresiState =>
    this.currentState ??
    resolveHashState(window.location.hash, this.slideInfos()).state;

  public getNextState = (): PresiState => {
    const current = this.getState();
    return nextState(current, this.slideInfos()) || current;
  };

  public getAspectRatio = (): `${number}:${number}` => this.config.aspectRatio;

  public getNotesHtml = (slideIndex: number): string =>
    (this.slides[slideIndex]?.registration.notes || [])
      .map((note) => `<p>${note}</p>`)
      .join("");

  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  public getSnapshot = (): PresiSnapshot => this.snapshot;

  private emit = () => {
    this.listeners.forEach((listener) => listener());
  };

  private updateSnapshot = () => {
    const state = this.getState();
    const currentSlide = this.slides[state.slideIndex];
    const next: PresiSnapshot = {
      slideIndex: state.slideIndex,
      stepIndex: state.stepIndex,
      totalSlides: this.slides.length,
      totalSteps: currentSlide?.timeline.length || 0,
      currentSlide: { title: currentSlide?.registration.title || "" },
    };
    const prev = this.snapshot;
    if (
      prev.slideIndex !== next.slideIndex ||
      prev.stepIndex !== next.stepIndex ||
      prev.totalSlides !== next.totalSlides ||
      prev.totalSteps !== next.totalSteps ||
      prev.currentSlide.title !== next.currentSlide.title
    ) {
      this.snapshot = next;
    }
  };

  private onHashChanged = () => {
    if (this.slides.length === 0) return;
    const resolved = resolveHashState(window.location.hash, this.slideInfos());
    if (!resolved.exact) {
      window.location.hash = serializeHashState(
        resolved.state,
        this.slideInfos(),
      );
      return;
    }

    this.drawSlide(resolved.state.slideIndex, resolved.state.stepIndex);
  };

  private drawSlide = (slideIndex: number, stepIndex: number) => {
    const prevState = this.currentState;
    this.slides.map(({ element }) => {
      if (!this.outgoingSlides.has(element)) {
        element.style.display = "none";
      }
    });
    const currentSlide = this.slides[slideIndex];
    if (!currentSlide) return;
    if (prevState?.slideIndex !== slideIndex) {
      // A quickly re-entered slide may still be animating out.
      currentSlide.element
        .getAnimations({ subtree: true })
        .map((animation) => animation.cancel());
      this.transitionEngine.resetAnimatedStyles(currentSlide.element);
    }
    currentSlide.element.style.display = "block";

    const activeEffects = new Set<EffectRegistration>();
    const transitionInTargets: TransitionTarget[] = [];

    currentSlide.timeline.map((step, i) => {
      step.elements.map((timelineElement) => {
        const wasVisible = isElementVisibleAtStep(
          i,
          timelineElement.direction,
          prevState?.slideIndex === slideIndex ? prevState.stepIndex : null,
        );
        const isVisible = isElementVisibleAtStep(
          i,
          timelineElement.direction,
          stepIndex,
        );

        timelineElement.element.classList.toggle("visible", isVisible);

        if (!wasVisible && isVisible && timelineElement.transitionIn) {
          transitionInTargets.push({
            element: timelineElement.element,
            transition: timelineElement.transitionIn,
            order: timelineElement.order,
          });
        }
      });

      if (i <= stepIndex) {
        step.effects.map((effect) => activeEffects.add(effect));
      }
    });

    this.cleanInactiveEffects(activeEffects);
    activeEffects.forEach((effect) => this.runEffect(effect));

    this.currentState = { slideIndex, stepIndex };
    this.updateSnapshot();
    this.emit();

    const inDelay = this.pendingInDelay;
    this.pendingInDelay = 0;
    const shouldAnimateSlideIn =
      prevState && prevState.slideIndex !== slideIndex;
    if (!this.backwards) {
      shouldAnimateSlideIn &&
        this.transitionEngine.animateIn(
          this.getSlideTransitionTargets(currentSlide, "in"),
          inDelay,
        );
      this.transitionEngine.animateIn(transitionInTargets, inDelay);
    }
  };

  private getSlideTransitionTargets = (
    slide: SlideEntry,
    direction: "in" | "out",
  ): TransitionTarget[] => {
    const transition =
      direction === "in"
        ? slide.registration.transitionIn
        : slide.registration.transitionOut;
    if (!transition) return [];

    const background = Array.from(slide.element.children).find((child) =>
      child.hasAttribute(styles.slideBackground),
    );
    const content = Array.from(slide.element.children).find((child) =>
      child.hasAttribute(styles.slideContent),
    );
    if (
      !(background instanceof HTMLElement) ||
      !(content instanceof HTMLElement)
    ) {
      return [{ element: slide.element, transition, delayIndex: 0 }];
    }

    return [
      { element: background, transition: "fade", delayIndex: 0 },
      { element: content, transition, delayIndex: 0 },
    ];
  };

  private runEffect = (effect: EffectRegistration) => {
    if (this.activeEffects.has(effect)) return;
    this.activeEffects.set(effect, effect.run());
  };

  private cleanInactiveEffects = (activeEffects: Set<EffectRegistration>) => {
    Array.from(this.activeEffects.entries()).map(([effect, cleanup]) => {
      if (activeEffects.has(effect)) return;

      typeof cleanup === "function" && cleanup();
      this.activeEffects.delete(effect);
    });
  };

  private holdCode: string | null = null;
  private holdTimeout: number | null = null;
  private holdInterval: number | null = null;

  private keydown = (e: KeyboardEvent) => {
    if (!isNavigationKey(e.code)) return;
    if (isEditableKeyboardTarget(e.target)) return;

    e.preventDefault();
    if (e.repeat) return;
    this.startHold(e.code);
  };

  private keyup = (e: KeyboardEvent) => {
    this.stopHold(e.code);
    if (isEditableKeyboardTarget(e.target)) return;

    keyBoardFullscreen(e.code);
  };

  private startHold = (code: string) => {
    this.stopHold();
    this.holdCode = code;
    keyBoardNavigation(code, this.next, this.prev);
    this.holdTimeout = window.setTimeout(() => {
      this.holdInterval = window.setInterval(() => {
        keyBoardNavigation(code, this.next, this.prev);
      }, HOLD_REPEAT_INTERVAL);
    }, HOLD_REPEAT_DELAY);
  };

  private stopHold = (code?: string) => {
    if (code && code !== this.holdCode) return;
    this.holdCode = null;
    this.holdTimeout !== null && clearTimeout(this.holdTimeout);
    this.holdInterval !== null && clearInterval(this.holdInterval);
    this.holdTimeout = null;
    this.holdInterval = null;
  };

  private onBlur = () => this.stopHold();

  private resize = () => {
    const calculateFontSize =
      this.config.calculateFontSize || (() => window.innerWidth / 48);
    document.documentElement.style.fontSize = `${calculateFontSize()}px`;
  };

  public next = () => {
    this.backwards = false;
    const prev = this.getState();
    const next = nextState(prev, this.slideInfos());
    if (next !== false) {
      this.updateHash(prev, next);
    }
  };

  public prev = () => {
    this.backwards = true;
    const prev = this.getState();
    const back = backState(prev, this.slideInfos());
    if (back !== false) {
      this.updateHash(prev, back);
    }
  };

  // Navigation is instant: the hash updates synchronously so rapid next/prev
  // calls chain off the fresh state, while out-animations play out
  // concurrently on the outgoing elements.
  private updateHash = (prevState: PresiState, next: PresiState) => {
    this.pendingInDelay = 0;
    if (!this.backwards) {
      const transition = this.animateStateOut(prevState, next);
      if (transition.duration > 0) {
        this.pendingInDelay = this.transitionEngine.config.inDelay;
      }

      if (transition.duration > 0 && prevState.slideIndex !== next.slideIndex) {
        const outgoingSlide = this.slides[prevState.slideIndex]?.element;
        if (outgoingSlide && !this.outgoingSlides.has(outgoingSlide)) {
          this.outgoingSlides.add(outgoingSlide);
          transition.finished.then(
            () => this.hideOutgoingSlide(outgoingSlide),
            () => this.hideOutgoingSlide(outgoingSlide),
          );
        }
      }
    }

    window.location.hash = serializeHashState(next, this.slideInfos());
  };

  private hideOutgoingSlide = (slide: HTMLElement) => {
    this.outgoingSlides.delete(slide);
    if (this.slides[this.getState().slideIndex]?.element !== slide) {
      slide.style.display = "none";
    }
  };

  private animateStateOut = (
    prevState: PresiState,
    next: PresiState,
  ): TransitionRun => {
    const prevSlide = this.slides[prevState.slideIndex];
    if (!prevSlide) return { duration: 0, finished: Promise.resolve() };

    const targets: TransitionTarget[] = [];
    if (prevState.slideIndex !== next.slideIndex) {
      targets.push(...this.getSlideTransitionTargets(prevSlide, "out"));
      prevSlide.timeline.map((step) => {
        step.elements.map((timelineElement) => {
          if (
            timelineElement.transitionOut &&
            timelineElement.element.classList.contains("visible")
          ) {
            targets.push({
              element: timelineElement.element,
              transition: timelineElement.transitionOut,
              order: timelineElement.order,
            });
          }
        });
      });
    }

    if (prevState.slideIndex === next.slideIndex) {
      prevSlide.timeline.map((step, stepIndex) => {
        step.elements.map((timelineElement) => {
          const wasVisible = isElementVisibleAtStep(
            stepIndex,
            timelineElement.direction,
            prevState.stepIndex,
          );
          const isVisible = isElementVisibleAtStep(
            stepIndex,
            timelineElement.direction,
            next.stepIndex,
          );
          if (wasVisible && !isVisible && timelineElement.transitionOut) {
            targets.push({
              element: timelineElement.element,
              transition: timelineElement.transitionOut,
              order: timelineElement.order,
            });
          }
        });
      });
    }

    return this.transitionEngine.animateOut(targets);
  };
}
