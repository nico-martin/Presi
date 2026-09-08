import React from "react";
import { DeckContext, SlideContext, type SlideHandle } from "./context.ts";
import type {
  EffectRegistration,
  PresiSlideMountContext,
  PresiStepCleanupContext,
  SlideRegistration,
} from "./engine/deckStore.ts";
import { styles } from "./engine/styles.ts";
import type { TransitionName } from "./engine/transitions.ts";

declare const PRESI_INCLUDE_NOTES: string | undefined;

const includeNotes = () =>
  typeof PRESI_INCLUDE_NOTES === "undefined" || PRESI_INCLUDE_NOTES !== "false";

export interface SlideProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  id?: string;
  background?: SlideBackground;
  className?: string;
  title?: string;
  notes?: Array<string> | null;
  transitionIn?: TransitionName;
  transitionOut?: TransitionName;
  onMount?: (context: PresiSlideMountContext) => void;
  onUnmount?: (context: PresiStepCleanupContext) => void;
}

export interface SlideBackground {
  className?: string;
  color?: React.CSSProperties["backgroundColor"];
  image?: string;
  style?: React.CSSProperties;
}

const Slide: React.FC<SlideProps> = ({
  children,
  id,
  background,
  className,
  title = "",
  notes = null,
  transitionIn,
  transitionOut,
  onMount,
  onUnmount,
  style,
  ...props
}) => {
  const store = React.useContext(DeckContext);
  if (!store) {
    throw new Error("<Slide> must be used inside a <Wrapper>.");
  }

  const sectionRef = React.useRef<HTMLElement>(null);
  const [registration] = React.useState<SlideRegistration>(() => ({
    element: null,
    title: "",
    notes: [],
    fragments: new Set(),
    effects: new Set(),
  }));
  const [handle] = React.useState<SlideHandle>(() => ({ registration, store }));

  const onMountRef = React.useRef(onMount);
  const onUnmountRef = React.useRef(onUnmount);
  onMountRef.current = onMount;
  onUnmountRef.current = onUnmount;

  React.useLayoutEffect(() => {
    const nextNotes = includeNotes() && notes ? notes : [];
    const changed =
      registration.id !== id ||
      registration.title !== title ||
      registration.transitionIn !== transitionIn ||
      registration.transitionOut !== transitionOut ||
      JSON.stringify(registration.notes) !== JSON.stringify(nextNotes);
    registration.id = id;
    registration.title = title;
    registration.notes = nextNotes;
    registration.transitionIn = transitionIn;
    registration.transitionOut = transitionOut;
    changed && store.invalidate();
  });

  const hasMountEffect = Boolean(onMount || onUnmount);
  React.useLayoutEffect(() => {
    if (!hasMountEffect) return;

    const effect: EffectRegistration = {
      anchor: null,
      stepIndex: 0,
      run: (mountContext) => {
        onMountRef.current?.(mountContext);

        return (unmountContext) => {
          onUnmountRef.current?.(unmountContext);
        };
      },
    };
    registration.effects.add(effect);
    store.invalidate();

    return () => {
      registration.effects.delete(effect);
      store.invalidate();
    };
  }, [hasMountEffect]);

  React.useLayoutEffect(() => {
    registration.element = sectionRef.current;
    return store.registerSlide(registration);
  }, []);

  return (
    <SlideContext.Provider value={handle}>
      <section
        ref={sectionRef}
        id={id}
        className={
          background || !className
            ? styles.slide
            : `${styles.slide} ${className}`
        }
        style={background ? undefined : style}
        {...props}
      >
        {background ? (
          <>
            <div
              data-presi-slide-background
              className={background.className}
              style={{
                backgroundColor: background.color,
                backgroundImage: background.image
                  ? `url("${background.image}")`
                  : undefined,
                ...background.style,
              }}
            />
            <div data-presi-slide-content className={className} style={style}>
              {children}
            </div>
          </>
        ) : (
          children
        )}
      </section>
    </SlideContext.Provider>
  );
};

export default Slide;
