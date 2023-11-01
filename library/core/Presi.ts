import EventBus from "./EventBus";

interface PresiConfig {
  aspectRatio?: `${number}:${number}`;
}

interface Events {
  slideChange: {
    prevSlide: HTMLElement;
    slide: HTMLElement;
  };
  fragmentChange: {
    prevFragmentIndex: number;
    fragmentIndex: number;
  };
}

class Presi {
  private readonly wrapper: HTMLElement = null;
  private readonly slides: Array<HTMLElement> = [];
  private fragments: Array<Array<HTMLElement>> = [];
  public hasNextSlide = false;
  public hasPrevSlide = false;
  public backwards: boolean = false;
  public currentFragmentIndex: number = -1;
  public eventBus: EventBus<Events> = new EventBus<Events>();

  public constructor(
    wrapper: HTMLElement,
    { aspectRatio = "16:9" }: PresiConfig,
  ) {
    this.wrapper = wrapper;
    this.wrapper.style.aspectRatio = aspectRatio.replace(":", "/");
    this.slides = Array.from(this.wrapper.querySelectorAll("section"));
    this.slides.map((slide) => {
      slide.style.aspectRatio = aspectRatio.replace(":", "/");
      slide.style.display = "none";
    });
    this.fragments = [];

    if (this.getCurrentHashIndex() === false) {
      window.location.hash = "#/0";
    } else {
      this.updateActiveSlide();
    }

    addEventListener("hashchange", this.updateActiveSlide);
    addEventListener("keyup", this.keypress);
  }

  public on = this.eventBus.subscribe;

  public cleanUp = () => {
    removeEventListener("hashchange", this.updateActiveSlide);
    removeEventListener("keyup", this.keypress);
  };

  private updateActiveSlide = () => {
    const index = this.getCurrentHashIndex() || 0;
    this.hasPrevSlide = index > 0;
    this.hasNextSlide = index < this.slides.length - 1;

    this.slides.map((slide, i) => {
      slide.style.display = i === index ? "block" : "none";
    });

    this.fragments = this.getFragmentsFromSlide(this.slides[index]);
    this.currentFragmentIndex = this.backwards ? this.fragments.length - 1 : -1;
    this.evaluateFragments();

    // todo: custom function should also be fragments
  };

  private evaluateFragments = () => {
    this.fragments.map((fragmentGroup, i) => {
      if (i <= this.currentFragmentIndex) {
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

    const fragmentsReturn: HTMLElement[][] = fragmentsWithoutIndex.map(
      (fragmentGroup, i) => [
        ...fragmentGroup,
        ...(i in fragmentsWithIndexGrouped ? fragmentsWithIndexGrouped[i] : []),
      ],
    );

    Object.entries(fragmentsWithIndexGrouped).map(([index, fragmentGroup]) => {
      if (parseInt(index) <= fragmentsWithoutIndex.length) return;
      fragmentsReturn.push(fragmentGroup);
    });

    return fragmentsReturn;
  };

  private keypress = (e: KeyboardEvent) => {
    (e.code === "ArrowRight" || e.code === "Space") && this.next();
    e.code === "ArrowLeft" && this.prev();
  };

  private getCurrentHashIndex = (): number | false => {
    const index = parseInt(window.location.hash.replace("#/", ""));
    return isNaN(index) ? false : index;
  };

  private changeHash = async (newSlideNo: number) => {
    const currentSlideNo = this.getCurrentHashIndex() || 0;
    const backwards = newSlideNo < currentSlideNo;

    if (!document.startViewTransition) {
      window.location.hash = `#/${newSlideNo}`;
    } else {
      backwards && document.documentElement.classList.add("back-transition");
      const transition = document.startViewTransition(() => {
        window.location.hash = `#/${newSlideNo}`;
      });
      try {
        await transition.finished;
      } finally {
        document.documentElement.classList.remove("back-transition");
      }
    }
    window.location.hash = `#/${newSlideNo}`;
  };

  public next = async () => {
    this.backwards = false;
    if (this.fragments.length - 1 === this.currentFragmentIndex) {
      await this.nextSlide();
    } else {
      await this.nextFragment();
    }
  };

  public prev = async () => {
    this.backwards = true;
    if (this.currentFragmentIndex === -1) {
      await this.prevSlide();
    } else {
      await this.prevFragment();
    }
  };

  public nextFragment = async () => {
    const prevFragmentIndex = this.currentFragmentIndex;
    const fragmentIndex = this.currentFragmentIndex + 1;
    this.eventBus.publish("fragmentChange", {
      prevFragmentIndex,
      fragmentIndex,
    });

    this.currentFragmentIndex = fragmentIndex;
    this.evaluateFragments();
  };

  public prevFragment = async () => {
    const prevFragmentIndex = this.currentFragmentIndex;
    const fragmentIndex = this.currentFragmentIndex - 1;
    this.eventBus.publish("fragmentChange", {
      prevFragmentIndex,
      fragmentIndex,
    });

    this.currentFragmentIndex = fragmentIndex;
    this.evaluateFragments();
  };

  public nextSlide = async () => {
    if (!this.hasNextSlide) return;
    const prevSlide = this.getCurrentHashIndex() || 0;
    const slide = prevSlide + 1;
    this.eventBus.publish("slideChange", {
      prevSlide: this.slides[prevSlide],
      slide: this.slides[slide],
    });
    await this.changeHash((this.getCurrentHashIndex() || 0) + 1);
  };

  public prevSlide = async () => {
    if (!this.hasPrevSlide) return;
    const prevSlide = this.getCurrentHashIndex() || 0;
    const slide = prevSlide - 1;
    this.eventBus.publish("slideChange", {
      prevSlide: this.slides[prevSlide],
      slide: this.slides[slide],
    });
    await this.changeHash((this.getCurrentHashIndex() || 0) - 1);
  };
}

export default Presi;
