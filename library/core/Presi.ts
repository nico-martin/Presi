import styles from "./styles.module.css";
import EventBus from "./EventBus";
import Notes from "./plugins/Notes.ts";
import {
  keyBoardFullscreen,
  keyBoardNavigation,
  parseHash,
} from "./utils/functions.ts";

// todo: custom function should also be fragments

class Presi {
  private readonly wrapper: HTMLElement = null;
  public aspect: `${number}:${number}`;
  public backwards: boolean = false;
  private readonly calculateFontSize: () => number;
  public eventBus: EventBus<PresiEvents> = new EventBus<PresiEvents>();
  private slides: Array<{
    slide: HTMLElement;
    fragments: HTMLElement[][];
  }> = [];

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
        fragments: this.getFragmentsFromSlide(slide),
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

    currentSlide.fragments.map((fragmentGroup, i) => {
      if (i <= fragmentIndex) {
        fragmentGroup.map((fragment) => {
          fragment.classList.add("visible");
        });
      } else {
        fragmentGroup.map((fragment) => {
          fragment.classList.remove("visible");
        });
      }
    });
  };

  private getFragmentsFromSlide = (slide: HTMLElement): HTMLElement[][] => {
    const fragments: HTMLElement[] = Array.from(
      slide.querySelectorAll(".fragment"),
    );

    const fragmentsWithoutIndex: HTMLElement[][] = fragments
      .filter(
        (fragment) => fragment.getAttribute("data-fragment-index") === null,
      )
      .map((fragment) => [fragment]);

    const fragmentsWithIndexGrouped: Record<number, HTMLElement[]> =
      fragments.reduce<Record<number, HTMLElement[]>>(
        (acc, curr): Record<number, HTMLElement[]> => {
          const index = curr.getAttribute("data-fragment-index");
          if (index === null) return acc;
          return { ...acc, [index]: [...(acc[parseInt(index)] || []), curr] };
        },
        {},
      );

    const fragmentsReturn: HTMLElement[][] = [
      [],
      ...fragmentsWithoutIndex.map((fragmentGroup, i) => [
        ...fragmentGroup,
        ...(i in fragmentsWithIndexGrouped ? fragmentsWithIndexGrouped[i] : []),
      ]),
    ];

    Object.entries(fragmentsWithIndexGrouped).map(([index, fragmentGroup]) => {
      if (parseInt(index) <= fragmentsWithoutIndex.length) return;
      fragmentsReturn.push(fragmentGroup);
    });

    return fragmentsReturn;
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
      console.log("end");
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
    const hasNextFragment =
      prev.fragmentIndex < currentSlide.fragments.length - 1;

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
        fragmentIndex: this.slides[prev.slideIndex - 1].fragments.length - 1,
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

    this.eventBus.publish("stateChange", {
      currentState: nextState,
      nextState: this.nextState(nextState) || nextState,
    });

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
}

export default Presi;
